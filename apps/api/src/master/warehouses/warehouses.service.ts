import { Injectable } from '@nestjs/common';
import type { MasterListQuery, WarehouseCreateInput, WarehouseDto, WarehouseUpdateInput } from '@erp/shared';
import { DomainError } from '../../common/domain-error.js';
import { paged, skipTake } from '../../common/pagination.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const INCLUDE = {
  _count: {
    select: {
      balances: { where: { qtyOnHand: { gt: 0 } } },
      goodsReceipts: true,
      goodsIssues: true,
      adjustments: true,
      transactions: true,
    },
  },
} as const satisfies Prisma.WarehouseInclude;

type Row = Prisma.WarehouseGetPayload<{ include: typeof INCLUDE }>;

const toDto = (w: Row): WarehouseDto => {
  const { balances, ...docs } = w._count;
  return {
    id: w.id.toString(),
    code: w.code,
    name: w.name,
    address: w.address,
    isActive: w.isActive,
    skuInStock: balances,
    inUse: Object.values(docs).some((n) => n > 0),
  };
};

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: MasterListQuery) {
    const where: Prisma.WarehouseWhereInput = {
      ...(q.active !== undefined ? { isActive: q.active } : {}),
      ...(q.q
        ? { OR: [{ code: { contains: q.q, mode: 'insensitive' } }, { name: { contains: q.q, mode: 'insensitive' } }] }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.warehouse.findMany({ where, include: INCLUDE, orderBy: [{ isActive: 'desc' }, { id: 'asc' }], ...skipTake(q) }),
      this.prisma.warehouse.count({ where }),
    ]);
    return paged(rows.map(toDto), total, q);
  }

  /** Kho đang dùng, cho ô chọn trên chứng từ */
  async options() {
    const rows = await this.prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    return rows.map((w) => ({ id: w.id.toString(), code: w.code, name: w.name }));
  }

  async get(id: bigint): Promise<WarehouseDto> {
    const w = await this.prisma.warehouse.findUnique({ where: { id }, include: INCLUDE });
    if (!w) throw DomainError.notFound('kho');
    return toDto(w);
  }

  async create(input: WarehouseCreateInput): Promise<WarehouseDto> {
    await this.assertCodeFree(input.code);
    const w = await this.prisma.warehouse.create({ data: input, include: INCLUDE });
    return toDto(w);
  }

  async update(id: bigint, input: WarehouseUpdateInput): Promise<WarehouseDto> {
    const current = await this.get(id);
    if (input.code !== undefined && input.code !== current.code) {
      if (current.inUse) {
        throw new DomainError('IN_USE', `Kho ${current.code} đã có chứng từ nên không đổi được mã.`, {
          fieldErrors: { code: 'Đã có chứng từ, không đổi được mã' },
        });
      }
      await this.assertCodeFree(input.code);
    }
    if (input.isActive === false && current.isActive && current.skuInStock > 0) {
      throw new DomainError(
        'IN_USE',
        `Không ngừng dùng được: ${current.name} còn ${current.skuInStock} mã hàng có tồn. Chuyển hoặc điều chỉnh hết tồn về 0 trước.`,
        { fieldErrors: { isActive: 'Kho còn tồn' } },
      );
    }
    const w = await this.prisma.warehouse.update({ where: { id }, data: input, include: INCLUDE });
    return toDto(w);
  }

  private async assertCodeFree(code: string) {
    const dup = await this.prisma.warehouse.findUnique({ where: { code } });
    if (dup) {
      throw new DomainError('DUPLICATE', `Mã kho ${code} đã được dùng cho ${dup.name}. Chọn mã khác.`, {
        fieldErrors: { code: 'Mã kho đã tồn tại' },
      });
    }
  }
}
