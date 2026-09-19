import { Injectable } from '@nestjs/common';
import type {
  MasterListQuery,
  ProductCreateInput,
  ProductDto,
  ProductLookupDto,
  ProductUpdateInput,
} from '@erp/shared';
import { decStr, iso } from '../../common/convert.js';
import { DomainError } from '../../common/domain-error.js';
import { paged, skipTake } from '../../common/pagination.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const INCLUDE = {
  balances: { include: { warehouse: { select: { id: true, code: true } } }, orderBy: { warehouseId: 'asc' } },
  _count: { select: { poItems: true, grItems: true, soItems: true, giItems: true, adjItems: true, transactions: true } },
} as const satisfies Prisma.ProductInclude;

type Row = Prisma.ProductGetPayload<{ include: typeof INCLUDE }>;

const toDto = (p: Row): ProductDto => ({
  id: p.id.toString(),
  sku: p.sku,
  name: p.name,
  uom: p.uom,
  isActive: p.isActive,
  createdAt: iso(p.createdAt),
  updatedAt: iso(p.updatedAt),
  inUse: Object.values(p._count).some((n) => n > 0),
  stock: p.balances.map((b) => ({
    warehouseId: b.warehouse.id.toString(),
    warehouseCode: b.warehouse.code,
    qtyOnHand: decStr(b.qtyOnHand, 4),
  })),
});

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: MasterListQuery) {
    const where: Prisma.ProductWhereInput = {
      ...(q.active !== undefined ? { isActive: q.active } : {}),
      ...(q.q
        ? { OR: [{ sku: { contains: q.q, mode: 'insensitive' } }, { name: { contains: q.q, mode: 'insensitive' } }] }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({ where, include: INCLUDE, orderBy: [{ isActive: 'desc' }, { sku: 'asc' }], ...skipTake(q) }),
      this.prisma.product.count({ where }),
    ]);
    return paged(rows.map(toDto), total, q);
  }

  async lookup(q: { q?: string; limit: number }): Promise<ProductLookupDto[]> {
    const rows = await this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(q.q
          ? { OR: [{ sku: { contains: q.q, mode: 'insensitive' } }, { name: { contains: q.q, mode: 'insensitive' } }] }
          : {}),
      },
      orderBy: { sku: 'asc' },
      take: q.limit,
    });
    return rows.map((p) => ({ id: p.id.toString(), sku: p.sku, name: p.name, uom: p.uom }));
  }

  async get(id: bigint): Promise<ProductDto> {
    const p = await this.prisma.product.findUnique({ where: { id }, include: INCLUDE });
    if (!p) throw DomainError.notFound('sản phẩm');
    return toDto(p);
  }

  async create(input: ProductCreateInput): Promise<ProductDto> {
    await this.assertSkuFree(input.sku);
    const p = await this.prisma.product.create({ data: input, include: INCLUDE });
    return toDto(p);
  }

  async update(id: bigint, input: ProductUpdateInput): Promise<ProductDto> {
    const current = await this.get(id);
    if (input.sku !== undefined && input.sku !== current.sku) {
      if (current.inUse) {
        throw new DomainError(
          'IN_USE',
          `Mã hàng ${current.sku} đã có chứng từ nên không đổi được. Nếu cần mã mới, tạo sản phẩm mới và ngừng dùng mã cũ.`,
          { fieldErrors: { sku: 'Đã có chứng từ, không đổi được mã' } },
        );
      }
      await this.assertSkuFree(input.sku);
    }
    const p = await this.prisma.product.update({ where: { id }, data: input, include: INCLUDE });
    return toDto(p);
  }

  private async assertSkuFree(sku: string) {
    const dup = await this.prisma.product.findUnique({ where: { sku } });
    if (dup) {
      throw new DomainError('DUPLICATE', `Mã hàng ${sku} đã tồn tại (${dup.name}). Chọn mã khác.`, {
        fieldErrors: { sku: 'Mã hàng đã tồn tại' },
      });
    }
  }
}
