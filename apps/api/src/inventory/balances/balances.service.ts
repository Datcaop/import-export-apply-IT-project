import { Injectable } from '@nestjs/common';
import type { InventoryBalanceDto } from '@erp/shared';
import { decStr } from '../../common/convert.js';
import { paged, skipTake } from '../../common/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { page: number; pageSize: number; q?: string; warehouseId?: string }) {
    const where: any = {};

    if (opts.q) {
      where.product = {
        OR: [
          { sku: { contains: opts.q, mode: 'insensitive' } },
          { name: { contains: opts.q, mode: 'insensitive' } },
        ],
      };
    }
    if (opts.warehouseId) {
      where.warehouseId = BigInt(opts.warehouseId);
    }

    const [total, rows] = await Promise.all([
      this.prisma.inventoryBalance.count({ where }),
      this.prisma.inventoryBalance.findMany({
        where,
        include: { product: true, warehouse: true },
        orderBy: [{ warehouseId: 'asc' }, { productId: 'asc' }],
        ...skipTake(opts),
      }),
    ]);

    return paged(rows.map((r): InventoryBalanceDto => ({
      productId: r.productId.toString(),
      productSku: r.product.sku,
      productName: r.product.name,
      productUom: r.product.uom,
      warehouseId: r.warehouseId.toString(),
      warehouseCode: r.warehouse.code,
      warehouseName: r.warehouse.name,
      qtyOnHand: decStr(r.qtyOnHand, 4),
      avgCost: decStr(r.avgCost, 4),
      updatedAt: r.updatedAt.toISOString(),
    })), total, opts);
  }
}
