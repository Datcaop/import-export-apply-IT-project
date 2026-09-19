import { z } from 'zod';
import { idStr, optText, decimalStr, dateStr } from './common.js';
import { TXN_TYPE } from '../enums.js';

export const InventoryBalanceDtoSchema = z.object({
  productId: idStr,
  productSku: z.string(),
  productName: z.string(),
  productUom: z.string(),
  warehouseId: idStr,
  warehouseCode: z.string(),
  warehouseName: z.string(),
  qtyOnHand: decimalStr(4, { label: 'Tồn kho' }),
  avgCost: decimalStr(4, { label: 'Giá vốn' }),
  updatedAt: z.string().datetime(),
});
export type InventoryBalanceDto = z.infer<typeof InventoryBalanceDtoSchema>;

export const InventoryTransactionDtoSchema = z.object({
  id: idStr,
  productId: idStr,
  productSku: z.string(),
  productName: z.string(),
  productUom: z.string(),
  warehouseId: idStr,
  warehouseCode: z.string(),
  warehouseName: z.string(),
  txnType: z.enum(TXN_TYPE as any),
  qtyChange: decimalStr(4, { label: 'Số lượng thay đổi' }),
  qtyAfter: decimalStr(4, { label: 'Tồn sau GD' }),
  unitCostBase: decimalStr(4, { label: 'Giá vốn' }).nullable(),
  refType: z.string(),
  refId: idStr,
  refLineId: idStr,
  refNo: z.string().nullable(), // số PO/GR/SO/GI (nếu join được)
  txnAt: z.string().datetime(),
  createdBy: z.object({
    id: idStr,
    fullName: z.string(),
  }).nullable(),
  note: optText(255),
});
export type InventoryTransactionDto = z.infer<typeof InventoryTransactionDtoSchema>;
