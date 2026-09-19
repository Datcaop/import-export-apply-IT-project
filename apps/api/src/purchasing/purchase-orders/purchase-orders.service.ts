import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NumberingService } from '../../numbering/numbering.service.js';
import { DomainError } from '../../common/domain-error.js';
import {
  type PurchaseOrderInput,
  type PoCancelInput,
  type PurchaseOrderDto,
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

type PoRow = Prisma.PurchaseOrderGetPayload<{
  include: {
    supplier: { select: { code: true; name: true } };
    createdByUser: typeof USER_REF_SELECT;
    cancelledByUser: typeof USER_REF_SELECT;
    closedByUser: typeof USER_REF_SELECT;
    items: {
      include: { product: { select: { sku: true; name: true; uom: true } } };
    };
  };
}>;

function toPoDto(r: PoRow): PurchaseOrderDto {
  return {
    id: r.id.toString(),
    poNo: r.poNo,
    supplierId: r.supplierId.toString(),
    supplierCode: r.supplier.code,
    supplierName: r.supplier.name,
    orderDate: dateOnly(r.orderDate),
    expectedDate: r.expectedDate ? dateOnly(r.expectedDate) : null,
    currencyCode: r.currencyCode,
    exchangeRate: decStr(r.exchangeRate, 6),
    exchangeRateSource: r.exchangeRateSource,
    status: r.status,
    totalAmount: decStr(r.totalAmount, 4),
    totalAmountBase: decStr(r.totalAmountBase, 4),
    terms: r.terms,
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
    })),
  };
}

const INCLUDE = {
  supplier: { select: { code: true, name: true } },
  createdByUser: USER_REF_SELECT,
  cancelledByUser: USER_REF_SELECT,
  closedByUser: USER_REF_SELECT,
  items: { include: { product: { select: { sku: true, name: true, uom: true } } }, orderBy: { lineNo: 'asc' } as const },
};

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService, private readonly numbering: NumberingService) {}

  async create(input: PurchaseOrderInput, userId: bigint): Promise<PurchaseOrderDto> {
    return this.prisma.$transaction(async (tx) => {
      const orderDate = fromDateOnly(input.orderDate);
      const poNo = await this.numbering.next(tx, 'PO', orderDate);

      // Tính tổng tiền
      const totals = orderTotals(
        input.items.map((i) => ({ qty: i.qtyOrdered, unitPrice: i.unitPrice })),
        input.exchangeRate,
        0,
      );

      const row = await tx.purchaseOrder.create({
        data: {
          poNo,
          supplierId: BigInt(input.supplierId),
          orderDate,
          expectedDate: input.expectedDate ? fromDateOnly(input.expectedDate) : null,
          currencyCode: input.currencyCode,
          exchangeRate: input.exchangeRate,
          exchangeRateSource: input.exchangeRateSource,
          totalAmount: totals.totalAmount.toString(),
          totalAmountBase: totals.totalAmountBase.toString(),
          terms: input.terms,
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

      return toPoDto(row as unknown as PoRow);
    });
  }

  async update(id: bigint, input: PurchaseOrderInput): Promise<PurchaseOrderDto> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
      if (!existing) throw DomainError.notFound('đơn mua hàng');
      if (existing.status !== 'DRAFT') {
        throw DomainError.validation('Chỉ được sửa đơn ở trạng thái Nháp.');
      }

      const totals = orderTotals(
        input.items.map((i) => ({ qty: i.qtyOrdered, unitPrice: i.unitPrice })),
        input.exchangeRate,
        0,
      );

      // Xóa tất cả dòng cũ và tạo lại dòng mới cho đơn giản
      await tx.purchaseOrderItem.deleteMany({ where: { poId: id } });

      const row = await tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: BigInt(input.supplierId),
          orderDate: fromDateOnly(input.orderDate),
          expectedDate: input.expectedDate ? fromDateOnly(input.expectedDate) : null,
          currencyCode: input.currencyCode,
          exchangeRate: input.exchangeRate,
          exchangeRateSource: input.exchangeRateSource,
          totalAmount: totals.totalAmount.toString(),
          totalAmountBase: totals.totalAmountBase.toString(),
          terms: input.terms,
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

      return toPoDto(row as unknown as PoRow);
    });
  }

  async get(id: bigint): Promise<PurchaseOrderDto> {
    const row = await this.prisma.purchaseOrder.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw DomainError.notFound('đơn mua hàng');
    return toPoDto(row as unknown as PoRow);
  }

  async list(q: {
    page: number;
    pageSize: number;
    q?: string;
    status?: string;
  }) {
    const where: Prisma.PurchaseOrderWhereInput = {};
    if (q.q) where.poNo = { contains: q.q, mode: 'insensitive' };
    if (q.status) where.status = q.status;

    const [rows, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: INCLUDE,
        orderBy: { poNo: 'desc' },
        ...skipTake(q),
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return paged(
      rows.map((r) => toPoDto(r as unknown as PoRow)),
      total,
      q,
    );
  }

  async approve(id: bigint): Promise<PurchaseOrderDto> {
    const row = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!row) throw DomainError.notFound('đơn mua hàng');
    if (row.status !== 'DRAFT') throw DomainError.validation('Chỉ được duyệt đơn ở trạng thái Nháp.');

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: INCLUDE,
    });
    return toPoDto(updated as unknown as PoRow);
  }

  async cancel(id: bigint, input: PoCancelInput, userId: bigint): Promise<PurchaseOrderDto> {
    const row = await this.prisma.purchaseOrder.findUnique({ where: { id }, include: { goodsReceipts: true } });
    if (!row) throw DomainError.notFound('đơn mua hàng');
    if (row.status === 'CANCELLED' || row.status === 'CLOSED') {
      throw DomainError.validation('Đơn đã hủy hoặc đã đóng.');
    }

    // Nếu có phiếu nhập chưa hủy thì không cho hủy
    if (row.goodsReceipts.some((gr) => gr.status !== 'CANCELLED')) {
      throw DomainError.validation('Không thể hủy đơn mua đã có phiếu nhập. Vui lòng hủy các phiếu nhập trước.');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: input.reason,
      },
      include: INCLUDE,
    });
    return toPoDto(updated as unknown as PoRow);
  }

  async close(id: bigint, userId: bigint): Promise<PurchaseOrderDto> {
    const row = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!row) throw DomainError.notFound('đơn mua hàng');
    if (row.status === 'DRAFT' || row.status === 'CANCELLED' || row.status === 'CLOSED') {
      throw DomainError.validation('Đơn không ở trạng thái hợp lệ để đóng.');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: userId,
      },
      include: INCLUDE,
    });
    return toPoDto(updated as unknown as PoRow);
  }
}
