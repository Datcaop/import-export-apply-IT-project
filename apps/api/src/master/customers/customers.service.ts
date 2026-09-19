import { Injectable } from '@nestjs/common';
import type { CustomerCreateInput, CustomerDto, CustomerUpdateInput, MasterListQuery } from '@erp/shared';
import { DomainError } from '../../common/domain-error.js';
import { paged, skipTake } from '../../common/pagination.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { assertCurrency } from '../suppliers/suppliers.service.js';

/** SO còn "đang mở" với khách hàng */
export const OPEN_SO_STATUSES = ['DRAFT', 'CONFIRMED', 'PARTIALLY_ISSUED'];

const INCLUDE = {
  _count: { select: { salesOrders: true, goodsReceipts: true } },
} as const satisfies Prisma.CustomerInclude;

type Row = Prisma.CustomerGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private async toDtos(rows: Row[]): Promise<CustomerDto[]> {
    const open = await this.prisma.salesOrder.groupBy({
      by: ['customerId'],
      where: { customerId: { in: rows.map((r) => r.id) }, status: { in: OPEN_SO_STATUSES } },
      _count: { _all: true },
    });
    const openMap = new Map(open.map((o) => [o.customerId.toString(), o._count._all]));
    return rows.map((c) => ({
      id: c.id.toString(),
      code: c.code,
      name: c.name,
      taxCode: c.taxCode,
      address: c.address,
      countryCode: c.countryCode,
      defaultCurrency: c.defaultCurrency,
      isActive: c.isActive,
      openSoCount: openMap.get(c.id.toString()) ?? 0,
      inUse: c._count.salesOrders + c._count.goodsReceipts > 0,
    }));
  }

  async list(q: MasterListQuery) {
    const where: Prisma.CustomerWhereInput = {
      ...(q.active !== undefined ? { isActive: q.active } : {}),
      ...(q.q
        ? {
            OR: [
              { code: { contains: q.q, mode: 'insensitive' } },
              { name: { contains: q.q, mode: 'insensitive' } },
              { taxCode: { contains: q.q } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.customer.findMany({ where, include: INCLUDE, orderBy: [{ isActive: 'desc' }, { code: 'asc' }], ...skipTake(q) }),
      this.prisma.customer.count({ where }),
    ]);
    return paged(await this.toDtos(rows), total, q);
  }

  /** Khách đang giao dịch, cho ô chọn trên đơn bán */
  async options() {
    const rows = await this.prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return rows.map((c) => ({
      id: c.id.toString(),
      code: c.code,
      name: c.name,
      defaultCurrency: c.defaultCurrency,
      address: c.address,
    }));
  }

  async get(id: bigint): Promise<CustomerDto> {
    const c = await this.prisma.customer.findUnique({ where: { id }, include: INCLUDE });
    if (!c) throw DomainError.notFound('khách hàng');
    return (await this.toDtos([c]))[0];
  }

  async create(input: CustomerCreateInput): Promise<CustomerDto> {
    await this.assertCodeFree(input.code);
    await assertCurrency(this.prisma, input.defaultCurrency);
    const c = await this.prisma.customer.create({ data: input, include: INCLUDE });
    return (await this.toDtos([c]))[0];
  }

  async update(id: bigint, input: CustomerUpdateInput): Promise<CustomerDto> {
    const current = await this.get(id);
    if (input.code !== undefined && input.code !== current.code) {
      if (current.inUse) {
        throw new DomainError('IN_USE', `Khách hàng ${current.code} đã có chứng từ nên không đổi được mã.`, {
          fieldErrors: { code: 'Đã có chứng từ, không đổi được mã' },
        });
      }
      await this.assertCodeFree(input.code);
    }
    await assertCurrency(this.prisma, input.defaultCurrency);
    const c = await this.prisma.customer.update({ where: { id }, data: input, include: INCLUDE });
    return (await this.toDtos([c]))[0];
  }

  private async assertCodeFree(code: string) {
    const dup = await this.prisma.customer.findUnique({ where: { code } });
    if (dup) {
      throw new DomainError('DUPLICATE', `Mã khách hàng ${code} đã được dùng cho ${dup.name}. Chọn mã khác.`, {
        fieldErrors: { code: 'Mã đã tồn tại' },
      });
    }
  }
}
