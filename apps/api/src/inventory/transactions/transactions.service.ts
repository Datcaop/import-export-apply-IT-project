import { Injectable } from '@nestjs/common';
import type { InventoryTransactionDto } from '@erp/shared';
import { decStr, userRef, iso } from '../../common/convert.js';
import { paged, skipTake } from '../../common/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { page: number; pageSize: number; q?: string; warehouseId?: string; productId?: string }) {
    const where: any = {};

    if (opts.q) {
      where.OR = [
        { product: { sku: { contains: opts.q, mode: 'insensitive' } } },
        { product: { name: { contains: opts.q, mode: 'insensitive' } } },
      ];
    }
    if (opts.warehouseId) {
      where.warehouseId = BigInt(opts.warehouseId);
    }
    if (opts.productId) {
      where.productId = BigInt(opts.productId);
    }

    const [total, rows] = await Promise.all([
      this.prisma.inventoryTransaction.count({ where }),
      this.prisma.inventoryTransaction.findMany({
        where,
        include: { product: true, warehouse: true, createdByUser: true },
        orderBy: { txnAt: 'desc' },
        ...skipTake(opts),
      }),
    ]);

    // Lấy số tham chiếu (grNo, poNo, soNo, adjNo) nếu có thể để hiển thị
    const txns = await Promise.all(rows.map(async (r) => {
      let refNo: string | null = null;
      if (r.refType === 'GR') {
        const gr = await this.prisma.goodsReceipt.findUnique({ where: { id: r.refId } });
        refNo = gr?.grNo ?? null;
      } else if (r.refType === 'GI') {
        const gi = await this.prisma.goodsIssue.findUnique({ where: { id: r.refId } });
        refNo = gi?.giNo ?? null;
      } else if (r.refType === 'ADJ') {
        const adj = await this.prisma.inventoryAdjustment.findUnique({ where: { id: r.refId } });
        refNo = adj?.adjNo ?? null;
      }

      const dto: InventoryTransactionDto = {
        id: r.id.toString(),
        productId: r.productId.toString(),
        productSku: r.product.sku,
        productName: r.product.name,
        productUom: r.product.uom,
        warehouseId: r.warehouseId.toString(),
        warehouseCode: r.warehouse.code,
        warehouseName: r.warehouse.name,
        txnType: r.txnType,
        qtyChange: decStr(r.qtyChange, 4),
        qtyAfter: decStr(r.qtyAfter, 4),
        unitCostBase: r.unitCostBase ? decStr(r.unitCostBase, 4) : null,
        refType: r.refType,
        refId: r.refId.toString(),
        refLineId: r.refLineId.toString(),
        refNo,
        txnAt: iso(r.txnAt),
        createdBy: userRef(r.createdByUser),
        note: r.note,
      };
      return dto;
    }));

    return paged(txns, total, opts);
  }
}
