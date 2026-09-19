import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NumberingService } from '../../numbering/numbering.service.js';
import { DomainError } from '../../common/domain-error.js';
import {
  type SalesOrderInput,
  type SalesOrderDto,
  orderTotals,
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

type SoRow = Prisma.SalesOrderGetPayload<{
  include: {
    customer: { select: { code: true; name: true } };
    createdByUser: typeof USER_REF_SELECT;
    cancelledByUser: typeof USER_REF_SELECT;
    closedByUser: typeof USER_REF_SELECT;
    items: {
      include: { product: { select: { sku: true; name: true; uom: true } } };
    };
  };
}>;

function toSoDto(r: SoRow): SalesOrderDto {
  return {
    id: r.id.toString(),
    soNo: r.soNo,
    customerId: r.customerId.toString(),
    customerCode: r.customer.code,
    customerName: r.customer.name,
    orderDate: dateOnly(r.orderDate),
    currencyCode: r.currencyCode,
    exchangeRate: decStr(r.exchangeRate, 6),
    status: r.status,
    totalAmount: decStr(r.totalAmount, 4),
    totalAmountBase: decStr(r.totalAmountBase, 4),
    salespersonId: r.salespersonId?.toString() ?? null,
    salespersonName: null, // Bỏ qua tên nhân viên cho đơn giản
    shipToAddress: r.shipToAddress,
    defaultWarehouseId: r.defaultWarehouseId?.toString() ?? null,
    paymentTerms: r.paymentTerms,
    note: r.note,
    createdBy: userRef(r.createdByUser),
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
    cancelledAt: r.cancelledAt ? iso(r.cancelledAt) : null,
    cancelledBy: userRef(r.cancelledByUser),
    cancelReason: r.cancelReason,
    closedAt: r.closedAt ? iso(r.closedAt) : null,
    closedBy: userRef(r.closedByUser),
    items: r.items.map((i) => ({
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
    })),
  };
}

const INCLUDE = {
  customer: { select: { code: true, name: true } },
  createdByUser: USER_REF_SELECT,
  cancelledByUser: USER_REF_SELECT,
  closedByUser: USER_REF_SELECT,
  items: { include: { product: { select: { sku: true, name: true, uom: true } } }, orderBy: { lineNo: 'asc' } as const },
};

@Injectable()
export class SalesOrdersService {
  constructor(private readonly prisma: PrismaService, private readonly numbering: NumberingService) {}

  async create(input: SalesOrderInput, userId: bigint): Promise<SalesOrderDto> {
    return this.prisma.$transaction(async (tx) => {
      const orderDate = fromDateOnly(input.orderDate);
      const soNo = await this.numbering.next(tx, 'SO', orderDate);

      const totals = orderTotals(
        input.items.map((i) => ({ qty: i.qtyOrdered, unitPrice: i.unitPrice })),
        input.exchangeRate,
        0,
      );

      const row = await tx.salesOrder.create({
        data: {
          soNo,
          customerId: BigInt(input.customerId),
          orderDate,
          currencyCode: input.currencyCode,
          exchangeRate: input.exchangeRate,
          totalAmount: totals.totalAmount.toString(),
          totalAmountBase: totals.totalAmountBase.toString(),
          paymentTerms: input.paymentTerms,
          shipToAddress: input.shipToAddress,
          defaultWarehouseId: input.defaultWarehouseId ? BigInt(input.defaultWarehouseId) : null,
          salespersonId: input.salespersonId ? BigInt(input.salespersonId) : null,
          note: input.note,
          status: 'DRAFT',
          createdBy: userId,
          items: {
            create: input.items.map((i, index) => ({
              lineNo: index + 1,
              productId: BigInt(i.productId),
              qtyOrdered: i.qtyOrdered,
              unitPrice: i.unitPrice,
            })),
          },
        },
        include: INCLUDE,
      });

      return toSoDto(row as unknown as SoRow);
    });
  }

  async update(id: bigint, input: SalesOrderInput): Promise<SalesOrderDto> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.salesOrder.findUnique({ where: { id }, include: { items: true } });
      if (!existing) throw DomainError.notFound('đơn bán hàng');
      if (existing.status !== 'DRAFT') {
        throw DomainError.validation('Chỉ được sửa đơn ở trạng thái Nháp.');
      }

      const totals = orderTotals(
        input.items.map((i) => ({ qty: i.qtyOrdered, unitPrice: i.unitPrice })),
        input.exchangeRate,
        0,
      );

      await tx.salesOrderItem.deleteMany({ where: { soId: id } });

      const row = await tx.salesOrder.update({
        where: { id },
        data: {
          customerId: BigInt(input.customerId),
          orderDate: fromDateOnly(input.orderDate),
          currencyCode: input.currencyCode,
          exchangeRate: input.exchangeRate,
          totalAmount: totals.totalAmount.toString(),
          totalAmountBase: totals.totalAmountBase.toString(),
          paymentTerms: input.paymentTerms,
          shipToAddress: input.shipToAddress,
          defaultWarehouseId: input.defaultWarehouseId ? BigInt(input.defaultWarehouseId) : null,
          salespersonId: input.salespersonId ? BigInt(input.salespersonId) : null,
          note: input.note,
          items: {
            create: input.items.map((i, index) => ({
              lineNo: index + 1,
              productId: BigInt(i.productId),
              qtyOrdered: i.qtyOrdered,
              unitPrice: i.unitPrice,
            })),
          },
        },
        include: INCLUDE,
      });

      return toSoDto(row as unknown as SoRow);
    });
  }

  async get(id: bigint): Promise<SalesOrderDto> {
    const row = await this.prisma.salesOrder.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw DomainError.notFound('đơn bán hàng');
    return toSoDto(row as unknown as SoRow);
  }

  async list(q: { page: number; pageSize: number; q?: string; status?: string }) {
    const where: Prisma.SalesOrderWhereInput = {};
    if (q.q) where.soNo = { contains: q.q, mode: 'insensitive' };
    if (q.status) where.status = q.status;

    const [rows, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        include: INCLUDE,
        orderBy: { soNo: 'desc' },
        ...skipTake(q),
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return paged(
      rows.map((r) => toSoDto(r as unknown as SoRow)),
      total,
      q,
    );
  }

  async approve(id: bigint): Promise<SalesOrderDto> {
    const row = await this.prisma.salesOrder.findUnique({ where: { id } });
    if (!row) throw DomainError.notFound('đơn bán hàng');
    if (row.status !== 'DRAFT') throw DomainError.validation('Chỉ được duyệt đơn ở trạng thái Nháp.');

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: INCLUDE,
    });
    return toSoDto(updated as unknown as SoRow);
  }
}
