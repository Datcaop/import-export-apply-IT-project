import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NumberingService } from '../../numbering/numbering.service.js';
import { InventoryService, BalancePair, InboundItem } from '../../inventory/inventory-core/inventory.service.js';
import { runInTx } from '../../prisma/prisma-tx.js';
import { DomainError } from '../../common/domain-error.js';
import {
  type GoodsReceiptInput,
  type GrCancelInput,
  type GoodsReceiptDto,
  type PoItemDto,
  D,
  unitCostBase,
  progressState,
  rollupPoStatus,
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

type GrRow = Prisma.GoodsReceiptGetPayload<{
  include: {
    supplier: { select: { code: true; name: true } };
    customer: { select: { code: true; name: true } };
    warehouse: { select: { code: true; name: true } };
    po: { select: { poNo: true } };
    so: { select: { soNo: true } };
    createdByUser: typeof USER_REF_SELECT;
    postedByUser: typeof USER_REF_SELECT;
    cancelledByUser: typeof USER_REF_SELECT;
    items: {
      include: { product: { select: { sku: true; name: true; uom: true } } };
    };
  };
}>;

function toGrDto(r: GrRow, candidateLines?: PoItemDto[]): GoodsReceiptDto {
  return {
    id: r.id.toString(),
    grNo: r.grNo,
    receiptType: r.receiptType,
    poId: r.poId?.toString() ?? null,
    poNo: r.po?.poNo ?? null,
    supplierId: r.supplierId?.toString() ?? null,
    supplierCode: r.supplier?.code ?? null,
    supplierName: r.supplier?.name ?? null,
    customerId: r.customerId?.toString() ?? null,
    customerCode: r.customer?.code ?? null,
    customerName: r.customer?.name ?? null,
    soId: r.soId?.toString() ?? null,
    soNo: r.so?.soNo ?? null,
    warehouseId: r.warehouseId.toString(),
    warehouseCode: r.warehouse.code,
    warehouseName: r.warehouse.name,
    receiptDate: dateOnly(r.receiptDate),
    currencyCode: r.currencyCode,
    exchangeRate: decStr(r.exchangeRate, 6),
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
      grId: i.grId.toString(),
      lineNo: i.lineNo,
      poItemId: i.poItemId?.toString() ?? null,
      productId: i.productId.toString(),
      productSku: i.product.sku,
      productName: i.product.name,
      productUom: i.product.uom,
      qty: decStr(i.qty, 4),
      unitCost: decStr(i.unitCost, 4),
      unitCostBase: decStr(i.unitCostBase, 4),
    })),
    candidateLines,
  };
}

const INCLUDE = {
  supplier: { select: { code: true, name: true } },
  customer: { select: { code: true, name: true } },
  warehouse: { select: { code: true, name: true } },
  po: { select: { poNo: true } },
  so: { select: { soNo: true } },
  createdByUser: USER_REF_SELECT,
  postedByUser: USER_REF_SELECT,
  cancelledByUser: USER_REF_SELECT,
  items: { include: { product: { select: { sku: true, name: true, uom: true } } }, orderBy: { lineNo: 'asc' } as const },
};

@Injectable()
export class GoodsReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbering: NumberingService,
    private readonly inventory: InventoryService,
  ) {}

  private validateInput(input: GoodsReceiptInput) {
    if (input.receiptType === 'PURCHASE' && (!input.poId || !input.supplierId)) {
      throw DomainError.validation('Nhập mua hàng phải có Đơn mua hàng và Nhà cung cấp.');
    }
    if (input.receiptType === 'CUSTOMER_RETURN' && !input.customerId) {
      throw DomainError.validation('Khách trả hàng phải chọn Khách hàng.');
    }
    const validItems = input.items.filter((i) => D(i.qty).gt(0));
    if (validItems.length === 0) {
      throw DomainError.validation('Phiếu nhập phải có ít nhất 1 dòng có số lượng > 0.');
    }
    return validItems;
  }

  async create(input: GoodsReceiptInput, userId: bigint): Promise<GoodsReceiptDto> {
    return this.prisma.$transaction(async (tx) => {
      const validItems = this.validateInput(input);
      const receiptDate = fromDateOnly(input.receiptDate);
      const grNo = await this.numbering.next(tx, 'GR', receiptDate);

      const row = await tx.goodsReceipt.create({
        data: {
          grNo,
          receiptType: input.receiptType,
          poId: input.poId ? BigInt(input.poId) : null,
          supplierId: input.supplierId ? BigInt(input.supplierId) : null,
          customerId: input.customerId ? BigInt(input.customerId) : null,
          soId: input.soId ? BigInt(input.soId) : null,
          warehouseId: BigInt(input.warehouseId),
          receiptDate,
          currencyCode: input.currencyCode,
          exchangeRate: input.exchangeRate,
          note: input.note,
          status: 'DRAFT',
          createdBy: userId,
          items: {
            create: validItems.map((i, index) => ({
              lineNo: index + 1,
              poItemId: i.poItemId ? BigInt(i.poItemId) : null,
              productId: BigInt(i.productId),
              qty: i.qty,
              unitCost: i.unitCost,
              unitCostBase: unitCostBase(i.unitCost, input.exchangeRate, 0).toString(),
            })),
          },
        },
        include: INCLUDE,
      });

      return toGrDto(row as unknown as GrRow);
    });
  }

  async update(id: bigint, input: GoodsReceiptInput): Promise<GoodsReceiptDto> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.goodsReceipt.findUnique({ where: { id } });
      if (!existing) throw DomainError.notFound('phiếu nhập kho');
      if (existing.status !== 'DRAFT') {
        throw DomainError.validation('Chỉ được sửa phiếu ở trạng thái Nháp.');
      }

      const validItems = this.validateInput(input);

      await tx.goodsReceiptItem.deleteMany({ where: { grId: id } });

      const row = await tx.goodsReceipt.update({
        where: { id },
        data: {
          receiptType: input.receiptType,
          poId: input.poId ? BigInt(input.poId) : null,
          supplierId: input.supplierId ? BigInt(input.supplierId) : null,
          customerId: input.customerId ? BigInt(input.customerId) : null,
          soId: input.soId ? BigInt(input.soId) : null,
          warehouseId: BigInt(input.warehouseId),
          receiptDate: fromDateOnly(input.receiptDate),
          currencyCode: input.currencyCode,
          exchangeRate: input.exchangeRate,
          note: input.note,
          items: {
            create: validItems.map((i, index) => ({
              lineNo: index + 1,
              poItemId: i.poItemId ? BigInt(i.poItemId) : null,
              productId: BigInt(i.productId),
              qty: i.qty,
              unitCost: i.unitCost,
              unitCostBase: unitCostBase(i.unitCost, input.exchangeRate, 0).toString(),
            })),
          },
        },
        include: INCLUDE,
      });

      return toGrDto(row as unknown as GrRow);
    });
  }

  async get(id: bigint): Promise<GoodsReceiptDto> {
    const row = await this.prisma.goodsReceipt.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw DomainError.notFound('phiếu nhập kho');

    let candidateLines: PoItemDto[] | undefined;
    if (row.status === 'DRAFT' && row.poId) {
      // Tìm các dòng PO chưa có trong phiếu nhập này
      const poItems = await this.prisma.purchaseOrderItem.findMany({
        where: { poId: row.poId },
        include: { product: true },
      });
      const currentItemIds = new Set(row.items.map((i) => i.poItemId?.toString()).filter(Boolean));
      
      const missing = poItems.filter((pi) => !currentItemIds.has(pi.id.toString()) && D(pi.qtyOrdered).gt(pi.qtyReceived));
      if (missing.length > 0) {
        candidateLines = missing.map(i => ({
          id: i.id.toString(),
          poId: i.poId.toString(),
          lineNo: i.lineNo,
          productId: i.productId.toString(),
          productSku: i.product.sku,
          productName: i.product.name,
          productUom: i.product.uom,
          qtyOrdered: decStr(i.qtyOrdered, 4),
          qtyReceived: decStr(i.qtyReceived, 4),
          unitPrice: decStr(i.unitPrice, 4),
          lineAmount: decStr(i.lineAmount!, 4),
        }));
      }
    }

    return toGrDto(row as unknown as GrRow, candidateLines);
  }

  async list(q: {
    page: number;
    pageSize: number;
    q?: string;
    status?: string;
  }) {
    const where: Prisma.GoodsReceiptWhereInput = {};
    if (q.q) where.grNo = { contains: q.q, mode: 'insensitive' };
    if (q.status) where.status = q.status;

    const [rows, total] = await Promise.all([
      this.prisma.goodsReceipt.findMany({
        where,
        include: INCLUDE,
        orderBy: { grNo: 'desc' },
        ...skipTake(q),
      }),
      this.prisma.goodsReceipt.count({ where }),
    ]);

    return paged(
      rows.map((r) => toGrDto(r as unknown as GrRow)),
      total,
      q,
    );
  }

  async cancel(id: bigint, input: GrCancelInput, userId: bigint): Promise<GoodsReceiptDto> {
    const row = await this.prisma.goodsReceipt.findUnique({ where: { id } });
    if (!row) throw DomainError.notFound('phiếu nhập kho');
    if (row.status === 'CANCELLED' || row.status === 'POSTED') {
      throw DomainError.validation('Chỉ được hủy phiếu Nháp.');
    }

    const updated = await this.prisma.goodsReceipt.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: input.reason,
      },
      include: INCLUDE,
    });
    return toGrDto(updated as unknown as GrRow);
  }

  async post(id: bigint, userId: bigint): Promise<GoodsReceiptDto> {
    return runInTx(this.prisma, async (tx) => {
      // 1. Khóa phiếu nhập
      const gr = await tx.$queryRawUnsafe<any[]>(
        `SELECT * FROM goods_receipt WHERE id = $1 FOR UPDATE`,
        id
      );
      if (gr.length === 0) throw DomainError.notFound('phiếu nhập kho');
      if (gr[0].status !== 'DRAFT') {
        throw DomainError.validation('Chỉ được ghi sổ phiếu Nháp.');
      }

      const row = await tx.goodsReceipt.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });

      // 2. Khóa PO và kiểm tra nhận vượt
      let poLines: Prisma.PurchaseOrderItemGetPayload<{}>[] = [];
      if (row.poId) {
        await tx.$executeRawUnsafe(`SELECT * FROM purchase_order WHERE id = $1 FOR UPDATE`, row.poId);
        await tx.$executeRawUnsafe(`SELECT * FROM purchase_order_item WHERE po_id = $1 ORDER BY id FOR UPDATE`, row.poId);
        
        poLines = await tx.purchaseOrderItem.findMany({ where: { poId: row.poId } });
        
        for (const item of row.items) {
          if (!item.poItemId) continue;
          const poItem = poLines.find((p) => p.id === item.poItemId);
          if (!poItem) throw DomainError.validation(`Không tìm thấy dòng PO cho dòng phiếu nhập ${item.lineNo}.`);
          
          const newRecv = D(poItem.qtyReceived).add(item.qty);
          if (newRecv.gt(poItem.qtyOrdered)) {
            throw DomainError.validation(
              `Dòng ${item.lineNo}: Số lượng nhận vượt quá số lượng đặt (${newRecv.toString()} > ${poItem.qtyOrdered.toString()}).`
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

      // 4. Cộng tồn
      const inboundItems: InboundItem[] = row.items.map((i) => ({
        productId: i.productId,
        warehouseId: row.warehouseId,
        qty: i.qty.toString(),
        unitCostBase: i.unitCostBase.toString(),
        refType: 'GR',
        refId: row.id,
        refLineId: i.id,
        txnType: 'RECEIPT',
        createdBy: userId,
        note: row.note ?? undefined,
      }));
      await this.inventory.applyInbound(tx, inboundItems);

      // 5. Cập nhật PO
      if (row.poId && poLines.length > 0) {
        for (const item of row.items) {
          if (!item.poItemId) continue;
          const poItem = poLines.find((p) => p.id === item.poItemId)!;
          const newRecv = D(poItem.qtyReceived).add(item.qty);
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { qtyReceived: newRecv.toString() },
          });
          poItem.qtyReceived = newRecv as any;
        }

        const progressLines = poLines.map((p) => ({ ordered: p.qtyOrdered, done: p.qtyReceived }));
        const newStatus = rollupPoStatus(progressLines);
        await tx.purchaseOrder.update({
          where: { id: row.poId },
          data: { status: newStatus },
        });
      }

      // 6. Cập nhật trạng thái GR
      const updated = await tx.goodsReceipt.update({
        where: { id },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedBy: userId,
        },
        include: INCLUDE,
      });

      return toGrDto(updated as unknown as GrRow);
    });
  }
}
