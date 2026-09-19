import { z } from 'zod';
import { UOM } from '../enums.js';
import { boolQuery, dateStr, decimalStr, listQuerySchema, optText, reqText } from './common.js';

const code = (label: string, max = 30) =>
  reqText(`Nhập ${label}`, max).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, {
    error: `${label[0].toUpperCase()}${label.slice(1)} chỉ gồm chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới`,
  });

const currencyCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, { error: 'Mã tiền tệ gồm 3 chữ cái' });

const optCurrency = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v.toUpperCase() : null))
  .refine((v) => v === null || /^[A-Z]{3}$/.test(v), { error: 'Mã tiền tệ gồm 3 chữ cái' });

const optCountry = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v.toUpperCase() : null))
  .refine((v) => v === null || /^[A-Z]{2}$/.test(v), { error: 'Mã quốc gia gồm 2 chữ cái' });

/** Mã số thuế Việt Nam: 10 hoặc 13 chữ số (bỏ trống được) */
const vnTaxCode = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v.replace(/[\s-]/g, '') : null))
  .superRefine((v, ctx) => {
    if (v === null) return;
    if (!/^\d+$/.test(v)) {
      ctx.addIssue({ code: 'custom', message: 'Mã số thuế chỉ gồm chữ số' });
    } else if (v.length !== 10 && v.length !== 13) {
      ctx.addIssue({
        code: 'custom',
        message: `Mã số thuế phải có 10 hoặc 13 chữ số; đang có ${v.length}. Kiểm tra lại trên giấy đăng ký kinh doanh.`,
      });
    }
  });

const isActive = z.boolean().default(true);

// ---------------------------------------------------------------------
export const productCreateSchema = z.object({
  sku: code('mã hàng', 50).transform((v) => v.toUpperCase()),
  name: reqText('Nhập tên hàng'),
  uom: z.enum(UOM, { error: 'Chọn đơn vị tính' }),
  isActive,
});
export const productUpdateSchema = productCreateSchema.partial();
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const warehouseCreateSchema = z.object({
  code: code('mã kho').transform((v) => v.toUpperCase()),
  name: reqText('Nhập tên kho'),
  address: optText(500),
  isActive,
});
export const warehouseUpdateSchema = warehouseCreateSchema.partial();
export type WarehouseCreateInput = z.infer<typeof warehouseCreateSchema>;
export type WarehouseUpdateInput = z.infer<typeof warehouseUpdateSchema>;

export const supplierCreateSchema = z.object({
  code: code('mã nhà cung cấp').transform((v) => v.toUpperCase()),
  name: reqText('Nhập tên nhà cung cấp'),
  taxCode: optText(30),
  countryCode: optCountry,
  defaultCurrency: optCurrency,
  isActive,
});
export const supplierUpdateSchema = supplierCreateSchema.partial();
export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;

export const customerCreateSchema = z.object({
  code: code('mã khách hàng').transform((v) => v.toUpperCase()),
  name: reqText('Nhập tên khách hàng'),
  taxCode: vnTaxCode,
  address: optText(500),
  countryCode: optCountry,
  defaultCurrency: optCurrency,
  isActive,
});
export const customerUpdateSchema = customerCreateSchema.partial();
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

export const exchangeRateCreateSchema = z.object({
  rateDate: dateStr('Ngày áp dụng'),
  rate: decimalStr(6, { label: 'Tỷ giá', min: 'positive' }),
  source: optText(30),
});
export const exchangeRateUpdateSchema = exchangeRateCreateSchema.pick({ rate: true, source: true }).partial();
export type ExchangeRateCreateInput = z.infer<typeof exchangeRateCreateSchema>;
export type ExchangeRateUpdateInput = z.infer<typeof exchangeRateUpdateSchema>;

export const rateSuggestQuerySchema = z.object({
  currency: currencyCode,
  date: dateStr(),
});

export const masterListQuerySchema = listQuerySchema.extend({
  active: boolQuery,
});
export type MasterListQuery = z.infer<typeof masterListQuerySchema>;

export const supplierListQuerySchema = masterListQuerySchema.extend({
  currency: z.string().trim().toUpperCase().optional(),
});

export const lookupQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
