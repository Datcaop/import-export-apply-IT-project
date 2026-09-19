import { z } from 'zod';

/** Id BigInt truyền dạng chuỗi số */
export const idStr = z.string({ error: 'Thiếu mã' }).regex(/^\d+$/, { error: 'Mã không hợp lệ' });

/** Chuỗi bắt buộc, đã cắt khoảng trắng */
export const reqText = (message: string, max = 255) =>
  z
    .string({ error: message })
    .trim()
    .min(1, { error: message })
    .max(max, { error: `Tối đa ${max} ký tự` });

/** Chuỗi tùy chọn: rỗng → null */
export const optText = (max = 255) =>
  z
    .string()
    .trim()
    .max(max, { error: `Tối đa ${max} ký tự` })
    .nullish()
    .transform((v) => (v ? v : null));

/**
 * Số thập phân dạng chuỗi chuẩn ('18.50'), tối đa `scale` chữ số lẻ.
 * Web đổi số người dùng gõ kiểu Việt Nam sang dạng này bằng parseVnNumber trước khi gửi.
 */
export function decimalStr(
  scale: number,
  opts: { label: string; min?: 'positive' | 'nonNegative' | 'nonZero' } = { label: 'Giá trị' },
) {
  const re = new RegExp(`^-?\\d{1,15}(\\.\\d{1,${scale}})?$`);
  let s = z
    .string({ error: `${opts.label}: nhập số` })
    .trim()
    .regex(re, { error: `${opts.label}: số không hợp lệ (tối đa ${scale} chữ số lẻ)` });
  if (opts.min === 'positive') s = s.refine((v) => Number(v) > 0, { error: `${opts.label} phải lớn hơn 0` });
  if (opts.min === 'nonNegative') s = s.refine((v) => Number(v) >= 0, { error: `${opts.label} không được âm` });
  if (opts.min === 'nonZero') s = s.refine((v) => Number(v) !== 0, { error: `${opts.label} phải khác 0` });
  return s;
}

/** Ngày 'yyyy-MM-dd' có thật */
export const dateStr = (label = 'Ngày') =>
  z
    .string({ error: `Nhập ${label.toLowerCase()}` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: `${label} không hợp lệ` })
    .refine((v) => new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v, { error: `${label} không tồn tại` });

export const boolQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));

export const listQuerySchema = z.object({
  q: z.string().trim().optional().transform((v) => (v ? v : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const loginSchema = z.object({
  username: reqText('Nhập tên đăng nhập', 50),
  password: z.string({ error: 'Nhập mật khẩu' }).min(1, { error: 'Nhập mật khẩu' }),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const reasonSchema = z.object({
  reason: reqText('Nhập lý do', 500),
});
export type ReasonInput = z.infer<typeof reasonSchema>;
