import { z } from 'zod';
import { idStr, reqText, optText, decimalStr, dateStr } from './common.js';
import { PO_STATUS, DOC_STATUS, RECEIPT_TYPE } from '../enums.js';

// --- Purchase Orders ---

export const PoItemInputSchema = z.object({
  id: z.string().optional(),
  productId: idStr,
  qtyOrdered: decimalStr(4, { label: 'Số lượng đặt', min: 'positive' }),
  unitPrice: decimalStr(4, { label: 'Đơn giá', min: 'nonNegative' }),
});

export const PurchaseOrderInputSchema = z.object({
  supplierId: idStr,
  orderDate: dateStr('Ngày đặt'),
  expectedDate: dateStr('Ngày dự kiến').nullable().optional().or(z.literal('')),
  currencyCode: z.string().length(3),
  exchangeRate: decimalStr(6, { label: 'Tỷ giá', min: 'positive' }),
  exchangeRateSource: optText(100),
  terms: optText(255),
  note: optText(255),
  items: z.array(PoItemInputSchema).min(1, 'Đơn hàng phải có ít nhất 1 dòng hàng'),
});

export type PurchaseOrderInput = z.infer<typeof PurchaseOrderInputSchema>;
export type PoItemInput = z.infer<typeof PoItemInputSchema>;

export const PoCancelInputSchema = z.object({
  reason: reqText('Nhập lý do hủy', 255),
});
export type PoCancelInput = z.infer<typeof PoCancelInputSchema>;

// --- Goods Receipts ---

export const GrItemInputSchema = z.object({
  id: z.string().optional(),
  poItemId: idStr.optional().nullable(),
  productId: idStr,
  qty: decimalStr(4, { label: 'Số lượng nhận', min: 'positive' }), // API filter những dòng = 0
  unitCost: decimalStr(4, { label: 'Đơn giá', min: 'nonNegative' }),
});

export const GoodsReceiptInputSchema = z.object({
  receiptType: z.enum(RECEIPT_TYPE as any),
  poId: idStr.optional().nullable(),
  supplierId: idStr.optional().nullable(),
  customerId: idStr.optional().nullable(),
  soId: idStr.optional().nullable(),
  warehouseId: idStr,
  receiptDate: dateStr('Ngày nhận'),
  currencyCode: z.string().length(3),
  exchangeRate: decimalStr(6, { label: 'Tỷ giá', min: 'positive' }),
  note: optText(255),
  items: z.array(GrItemInputSchema).min(1, 'Phiếu nhập phải có ít nhất 1 dòng hàng'),
});

export type GoodsReceiptInput = z.infer<typeof GoodsReceiptInputSchema>;
export type GrItemInput = z.infer<typeof GrItemInputSchema>;

export const GrCancelInputSchema = z.object({
  reason: reqText('Nhập lý do hủy', 255),
});
export type GrCancelInput = z.infer<typeof GrCancelInputSchema>;
