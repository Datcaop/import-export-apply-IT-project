import { Injectable } from '@nestjs/common';
import type { MasterListQuery, SupplierCreateInput, SupplierDto, SupplierUpdateInput } from '@erp/shared';
import { DomainError } from '../../common/domain-error.js';
import { paged, skipTake } from '../../common/pagination.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/** PO còn "đang mở" với nhà cung cấp */
export const OPEN_PO_STATUSES = ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED'];

const INCLUDE = {
  _count: { select: { purchaseOrders: true, goodsReceipts: true } },
} as const satisfies Prisma.SupplierInclude;

type Row = Prisma.SupplierGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  private async toDtos(rows: Row[]): Promise<SupplierDto[]> {
    const open = await this.prisma.purchaseOrder.groupBy({
      by: ['supplierId'],
      where: { supplierId: { in: rows.map((r) => r.id) }, status: { in: OPEN_PO_STATUSES } },
      _count: { _all: true },
    });
    const openMap = new Map(open.map((o) => [o.supplierId.toString(), o._count._all]));
    return rows.map((s) => ({
      id: s.id.toString(),
      code: s.code,
      name: s.name,
      taxCode: s.taxCode,
      countryCode: s.countryCode,
      defaultCurrency: s.defaultCurrency,
      isActive: s.isActive,
      openPoCount: openMap.get(s.id.toString()) ?? 0,
      inUse: s._count.purchaseOrders + s._count.goodsReceipts > 0,
    }));
  }

  async list(q: MasterListQuery & { currency?: string }) {
    const where: Prisma.SupplierWhereInput = {
      ...(q.active !== undefined ? { isActive: q.active } : {}),
      ...(q.currency ? { defaultCurrency: q.currency } : {}),
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
      this.prisma.supplier.findMany({ where, include: INCLUDE, orderBy: [{ isActive: 'desc' }, { code: 'asc' }], ...skipTake(q) }),
      this.prisma.supplier.count({ where }),
    ]);
    return paged(await this.toDtos(rows), total, q);
  }

  /** Nhà cung cấp đang giao dịch, cho ô chọn trên đơn mua */
  async options() {
    const rows = await this.prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return rows.map((s) => ({ id: s.id.toString(), code: s.code, name: s.name, defaultCurrency: s.defaultCurrency }));
  }

  async get(id: bigint): Promise<SupplierDto> {
    const s = await this.prisma.supplier.findUnique({ where: { id }, include: INCLUDE });
    if (!s) throw DomainError.notFound('nhà cung cấp');
    return (await this.toDtos([s]))[0];
  }

  async create(input: SupplierCreateInput): Promise<SupplierDto> {
    await this.assertCodeFree(input.code);
    await assertCurrency(this.prisma, input.defaultCurrency);
    const s = await this.prisma.supplier.create({ data: input, include: INCLUDE });
    return (await this.toDtos([s]))[0];
  }

  async update(id: bigint, input: SupplierUpdateInput): Promise<SupplierDto> {
    const current = await this.get(id);
    if (input.code !== undefined && input.code !== current.code) {
      if (current.inUse) {
        throw new DomainError('IN_USE', `Nhà cung cấp ${current.code} đã có chứng từ nên không đổi được mã.`, {
          fieldErrors: { code: 'Đã có chứng từ, không đổi được mã' },
        });
      }
      await this.assertCodeFree(input.code);
    }
    await assertCurrency(this.prisma, input.defaultCurrency);
    const s = await this.prisma.supplier.update({ where: { id }, data: input, include: INCLUDE });
    return (await this.toDtos([s]))[0];
  }

  private async assertCodeFree(code: string) {
    const dup = await this.prisma.supplier.findUnique({ where: { code } });
    if (dup) {
      throw new DomainError('DUPLICATE', `Mã nhà cung cấp ${code} đã được dùng cho ${dup.name}. Chọn mã khác.`, {
        fieldErrors: { code: 'Mã đã tồn tại' },
      });
    }
  }
}

export async function assertCurrency(prisma: PrismaService, code: string | null | undefined) {
  if (!code) return;
  const c = await prisma.currency.findUnique({ where: { code } });
  if (!c) {
    throw DomainError.validation(`Tiền tệ ${code} chưa được khai báo. Thêm ở màn Tiền tệ và tỷ giá trước.`, {
      defaultCurrency: 'Tiền tệ chưa khai báo',
    });
  }
}
