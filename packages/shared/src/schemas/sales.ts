import { z } from 'zod';
import { idStr, optText, decimalStr, dateStr } from './common.js';

export const SoItemInputSchema = z.object({
  id: idStr.optional(),
  productId: idStr,
  qtyOrdered: decimalStr(4, { label: 'Số lượng' }).refine(val => Number(val) > 0, 'Phải lớn hơn 0'),
  unitPrice: decimalStr(4, { label: 'Đơn giá' }).refine(val => Number(val) >= 0, 'Không được âm'),
});

export const SalesOrderInputSchema = z.object({
  customerId: idStr,
  orderDate: dateStr('Ngày đặt'),
  currencyCode: z.string().length(3),
  exchangeRate: decimalStr(6, { label: 'Tỷ giá' }).refine(val => Number(val) > 0, 'Phải lớn hơn 0'),
  paymentTerms: optText(255),
  shipToAddress: optText(255),
  defaultWarehouseId: idStr.optional().nullable(),
  salespersonId: idStr.optional().nullable(),
  note: optText(1000),
  items: z.array(SoItemInputSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
});
export type SalesOrderInput = z.infer<typeof SalesOrderInputSchema>;

export const GiItemInputSchema = z.object({
  id: idStr.optional(),
  soItemId: idStr.optional().nullable(),
  productId: idStr,
  qty: decimalStr(4, { label: 'Số lượng xuất' }).refine(val => Number(val) > 0, 'Phải lớn hơn 0'),
});

export const GoodsIssueInputSchema = z.object({
  soId: idStr.optional().nullable(),
  warehouseId: idStr,
  issueDate: dateStr('Ngày xuất'),
  note: optText(1000),
  items: z.array(GiItemInputSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
});
export type GoodsIssueInput = z.infer<typeof GoodsIssueInputSchema>;
