import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NumberingService } from '../../numbering/numbering.service.js';
import { InventoryService, BalancePair, OutboundItem } from '../../inventory/inventory-core/inventory.service.js';
import { runInTx } from '../../prisma/prisma-tx.js';
import { DomainError } from '../../common/domain-error.js';
import {
  type GoodsIssueInput,
  type GoodsIssueDto,
  type SoItemDto,
  D,
  progressState,
  rollupSoStatus,
} from '@erp/shared';
import {
  fromDateOnly,
  iso,
  dateOnly,
  userRef,
  decStr,
  USER_REF_SELECT,
} from '../../common/convert.js';
import { skipTake, paged } from '../../common/pagination.js';
import type { Prisma } from '../../generated/prisma/client.js';

type GiRow = Prisma.GoodsIssueGetPayload<{
  include: {
    warehouse: { select: { code: true; name: true } };
    so: { select: { soNo: true } };
    createdByUser: typeof USER_REF_SELECT;
    postedByUser: typeof USER_REF_SELECT;
    cancelledByUser: typeof USER_REF_SELECT;
    items: {
      include: { product: { select: { sku: true; name: true; uom: true } } };
    };
  };
}>;

function toGiDto(r: GiRow, candidateLines?: SoItemDto[]): GoodsIssueDto {
  return {
    id: r.id.toString(),
    giNo: r.giNo,
    soId: r.soId?.toString() ?? null,
    soNo: r.so?.soNo ?? null,
    warehouseId: r.warehouseId.toString(),
    warehouseCode: r.warehouse.code,
    warehouseName: r.warehouse.name,
    issueDate: dateOnly(r.issueDate),
    status: r.status,
    postedAt: r.postedAt ? iso(r.postedAt) : null,
    postedBy: userRef(r.postedByUser),
    note: r.note,
    createdBy: userRef(r.createdByUser),
    createdAt: iso(r.createdAt),
    cancelledAt: r.cancelledAt ? iso(r.cancelledAt) : null,
    cancelledBy: userRef(r.cancelledByUser),
    cancelReason: r.cancelReason,
    items: r.items.map((i) => ({
      id: i.id.toString(),
      giId: i.giId.toString(),
      lineNo: i.lineNo,
      soItemId: i.soItemId?.toString() ?? null,
      productId: i.productId.toString(),
      productSku: i.product.sku,
      productName: i.product.name,
      productUom: i.product.uom,
      qty: decStr(i.qty, 4),
      unitCostBase: i.unitCostBase ? decStr(i.unitCostBase, 4) : null,
    })),
    candidateLines,
  };
}

const INCLUDE = {
  warehouse: { select: { code: true, name: true } },
  so: { select: { soNo: true } },
  createdByUser: USER_REF_SELECT,
  postedByUser: USER_REF_SELECT,
  cancelledByUser: USER_REF_SELECT,
  items: { include: { product: { select: { sku: true, name: true, uom: true } } }, orderBy: { lineNo: 'asc' } as const },
};

@Injectable()
export class GoodsIssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: NumberingService,
    private readonly inventory: InventoryService,
  ) {}

  private validateInput(input: GoodsIssueInput) {
    const validItems = input.items.filter((i) => D(i.qty).gt(0));
    if (validItems.length === 0) {
      throw DomainError.validation('Phiếu xuất kho phải có ít nhất 1 dòng có số lượng > 0.');
    }
    return validItems;
  }

  async create(input: GoodsIssueInput, userId: bigint): Promise<GoodsIssueDto> {
    return this.prisma.$transaction(async (tx) => {
      const validItems = this.validateInput(input);
      const issueDate = fromDateOnly(input.issueDate);
      const giNo = await this.numbering.next(tx, 'GI', issueDate);

      const row = await tx.goodsIssue.create({
        data: {
          giNo,
          soId: input.soId ? BigInt(input.soId) : null,
          warehouseId: BigInt(input.warehouseId),
          issueDate,
          note: input.note,
          status: 'DRAFT',
          createdBy: userId,
          items: {
            create: validItems.map((i, index) => ({
              lineNo: index + 1,
              soItemId: i.soItemId ? BigInt(i.soItemId) : null,
              productId: BigInt(i.productId),
              qty: i.qty,
            })),
          },
        },
        include: INCLUDE,
      });

      return toGiDto(row as unknown as GiRow);
    });
  }

  async update(id: bigint, input: GoodsIssueInput): Promise<GoodsIssueDto> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.goodsIssue.findUnique({ where: { id } });
      if (!existing) throw DomainError.notFound('phiếu xuất kho');
      if (existing.status !== 'DRAFT') {
        throw DomainError.validation('Chỉ được sửa phiếu ở trạng thái Nháp.');
      }

      const validItems = this.validateInput(input);

      await tx.goodsIssueItem.deleteMany({ where: { giId: id } });

      const row = await tx.goodsIssue.update({
        where: { id },
        data: {
          soId: input.soId ? BigInt(input.soId) : null,
          warehouseId: BigInt(input.warehouseId),
          issueDate: fromDateOnly(input.issueDate),
          note: input.note,
          items: {
            create: validItems.map((i, index) => ({
              lineNo: index + 1,
              soItemId: i.soItemId ? BigInt(i.soItemId) : null,
              productId: BigInt(i.productId),
              qty: i.qty,
            })),
          },
        },
        include: INCLUDE,
      });

      return toGiDto(row as unknown as GiRow);
    });
  }

  async get(id: bigint): Promise<GoodsIssueDto> {
    const row = await this.prisma.goodsIssue.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw DomainError.notFound('phiếu xuất kho');

    let candidateLines: SoItemDto[] | undefined;
    if (row.status === 'DRAFT' && row.soId) {
      const soItems = await this.prisma.salesOrderItem.findMany({
        where: { soId: row.soId },
        include: { product: true },
      });
      const currentItemIds = new Set(row.items.map((i) => i.soItemId?.toString()).filter(Boolean));
      
      const missing = soItems.filter((si) => !currentItemIds.has(si.id.toString()) && D(si.qtyOrdered).gt(si.qtyIssued));
      if (missing.length > 0) {
        candidateLines = missing.map(i => ({
          id: i.id.toString(),
          soId: i.soId.toString(),
          lineNo: i.lineNo,
          productId: i.productId.toString(),
          productSku: i.product.sku,
          productName: i.product.name,
          productUom: i.product.uom,
          qtyOrdered: decStr(i.qtyOrdered, 4),
          qtyIssued: decStr(i.qtyIssued, 4),
          unitPrice: decStr(i.unitPrice, 4),
          lineAmount: decStr(i.lineAmount!, 4),
        }));
      }
    }

    return toGiDto(row as unknown as GiRow, candidateLines);
  }

  async list(q: { page: number; pageSize: number; q?: string; status?: string }) {
    const where: Prisma.GoodsIssueWhereInput = {};
    if (q.q) where.giNo = { contains: q.q, mode: 'insensitive' };
    if (q.status) where.status = q.status;

    const [rows, total] = await Promise.all([
      this.prisma.goodsIssue.findMany({
        where,
        include: INCLUDE,
        orderBy: { giNo: 'desc' },
        ...skipTake(q),
      }),
      this.prisma.goodsIssue.count({ where }),
    ]);

    return paged(
      rows.map((r) => toGiDto(r as unknown as GiRow)),
      total,
      q,
    );
  }

  async post(id: bigint, userId: bigint): Promise<GoodsIssueDto> {
    return runInTx(this.prisma, async (tx) => {
      // 1. Khóa phiếu xuất
      const gi = await tx.$queryRawUnsafe<any[]>(`SELECT * FROM goods_issue WHERE id = $1 FOR UPDATE`, id);
      if (gi.length === 0) throw DomainError.notFound('phiếu xuất kho');
      if (gi[0].status !== 'DRAFT') {
        throw DomainError.validation('Chỉ được ghi sổ phiếu Nháp.');
      }

      const row = await tx.goodsIssue.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });

      // 2. Khóa SO và kiểm tra vượt
      let soLines: Prisma.SalesOrderItemGetPayload<{}>[] = [];
      if (row.soId) {
        await tx.$executeRawUnsafe(`SELECT * FROM sales_order WHERE id = $1 FOR UPDATE`, row.soId);
        await tx.$executeRawUnsafe(`SELECT * FROM sales_order_item WHERE so_id = $1 ORDER BY id FOR UPDATE`, row.soId);
        
        soLines = await tx.salesOrderItem.findMany({ where: { soId: row.soId } });
        
        for (const item of row.items) {
          if (!item.soItemId) continue;
          const soItem = soLines.find((s) => s.id === item.soItemId);
          if (!soItem) throw DomainError.validation(`Không tìm thấy dòng SO cho dòng xuất ${item.lineNo}.`);
          
          const newIssued = D(soItem.qtyIssued).add(item.qty);
          if (newIssued.gt(soItem.qtyOrdered)) {
            throw DomainError.validation(
              `Dòng ${item.lineNo}: Số lượng xuất vượt quá số lượng đặt (${newIssued.toString()} > ${soItem.qtyOrdered.toString()}).`
            );
          }
        }
      }

      // 3. Khóa tồn kho
      const balancePairs: BalancePair[] = row.items.map((i) => ({
        productId: i.productId,
        warehouseId: row.warehouseId,
      }));
      await this.inventory.lockBalances(tx, balancePairs);

      // 4. Trừ tồn và lấy giá vốn
      const outboundItems: OutboundItem[] = row.items.map((i) => ({
        productId: i.productId,
        warehouseId: row.warehouseId,
        qty: i.qty.toString(),
        refType: 'GI',
        refId: row.id,
        refLineId: i.id,
        txnType: 'ISSUE',
        createdBy: userId,
        note: row.note ?? undefined,
      }));
      
      const applyResult = await this.inventory.applyOutbound(tx, outboundItems);
      
      // 5. Cập nhật unitCostBase vào GoodsIssueItem
      for (const item of row.items) {
        const cost = applyResult.costs[item.id.toString()];
        await tx.goodsIssueItem.update({
          where: { id: item.id },
          data: { unitCostBase: cost },
        });
      }

      // 6. Cập nhật SO
      if (row.soId && soLines.length > 0) {
        for (const item of row.items) {
          if (!item.soItemId) continue;
          const soItem = soLines.find((s) => s.id === item.soItemId)!;
          const newIssued = D(soItem.qtyIssued).add(item.qty);
          await tx.salesOrderItem.update({
            where: { id: soItem.id },
            data: { qtyIssued: newIssued.toString() },
          });
          soItem.qtyIssued = newIssued as any;
        }

        const progressLines = soLines.map((s) => ({ ordered: s.qtyOrdered, done: s.qtyIssued }));
        const newStatus = rollupSoStatus(progressLines);
        await tx.salesOrder.update({
          where: { id: row.soId },
          data: { status: newStatus },
        });
      }

      // 7. Cập nhật trạng thái GI
      const updated = await tx.goodsIssue.update({
        where: { id },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedBy: userId,
        },
        include: INCLUDE,
      });

      return toGiDto(updated as unknown as GiRow);
    });
  }
}
