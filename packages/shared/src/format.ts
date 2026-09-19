// Định dạng hiển thị kiểu Việt Nam: 25.400 · 18,50 · −2 · 19/09/2026 · 19/09/2026 10:42
import { D, type DecInput } from './calc.js';

const MINUS = '−';
const TZ = 'Asia/Ho_Chi_Minh';

const nfCache = new Map<string, Intl.NumberFormat>();
function nf(min: number, max: number) {
  const key = `${min}:${max}`;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: min, maximumFractionDigits: max });
    nfCache.set(key, f);
  }
  return f;
}

/**
 * Định dạng số: phân tách hàng nghìn bằng dấu chấm, thập phân bằng dấu phẩy.
 * `minDecimals`/`maxDecimals` điều khiển số chữ số lẻ; dấu âm là U+2212.
 */
export function formatNumber(value: DecInput | null | undefined, maxDecimals = 4, minDecimals = 0): string {
  if (value == null || value === '') return '';
  const d = D(value).toDecimalPlaces(maxDecimals);
  const abs = nf(minDecimals, maxDecimals).format(d.abs().toFixed(maxDecimals) as unknown as number);
  return d.isNegative() && !d.isZero() ? MINUS + abs : abs;
}

/** Số lượng: tối đa 4 chữ số lẻ, bỏ số 0 thừa */
export const formatQty = (v: DecInput | null | undefined) => formatNumber(v, 4, 0);

/** Tiền theo số chữ số lẻ của đồng tiền (VND 0, ngoại tệ 2) */
export const formatMoney = (v: DecInput | null | undefined, decimals = 0) => formatNumber(v, decimals, decimals);

/** Tỷ giá: bỏ số 0 thừa, tối đa 6 chữ số lẻ */
export const formatRate = (v: DecInput | null | undefined) => formatNumber(v, 6, 0);

/** Số có dấu: +40, −20, 0 */
export function formatSigned(v: DecInput | null | undefined, maxDecimals = 4): string {
  if (v == null || v === '') return '';
  const d = D(v);
  const s = formatNumber(d, maxDecimals);
  return d.gt(0) ? `+${s}` : s;
}

/** 'yyyy-MM-dd' → 'dd/MM/yyyy' (không đi qua Date nên không lệch múi giờ) */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const [y, m, d] = value.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const dtf = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function vnParts(value: string | Date) {
  const parts = Object.fromEntries(dtf.formatToParts(new Date(value)).map((p) => [p.type, p.value]));
  return { y: parts.year, m: parts.month, d: parts.day, h: parts.hour === '24' ? '00' : parts.hour, min: parts.minute };
}

/** ISO timestamp → 'dd/MM/yyyy HH:mm' theo giờ Việt Nam */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  const p = vnParts(value);
  return `${p.d}/${p.m}/${p.y} ${p.h}:${p.min}`;
}

/** ISO timestamp → 'HH:mm' theo giờ Việt Nam */
export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  const p = vnParts(value);
  return `${p.h}:${p.min}`;
}

/** Ngày hôm nay theo giờ Việt Nam, dạng 'yyyy-MM-dd' */
export function vnToday(now: Date = new Date()): string {
  const p = vnParts(now);
  return `${p.y}-${p.m}-${p.d}`;
}

/**
 * Đọc số người dùng gõ kiểu Việt Nam ('25.400', '18,50', '1.234,5', '−2') thành chuỗi chuẩn
 * ('25400', '18.50', '1234.5', '-2'). Trả null nếu không phải số.
 */
export function parseVnNumber(input: string | null | undefined): string | null {
  if (input == null) return null;
  const s = input.trim().replace(/\s/g, '').replace(MINUS, '-');
  if (s === '') return null;
  if (!/^-?[\d.]*(,\d+)?$/.test(s) || !/\d/.test(s)) return null;
  const [intPart, frac] = s.split(',');
  const normalized = intPart.replace(/\./g, '') + (frac !== undefined ? `.${frac}` : '');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  return normalized;
}

/** 'dd/MM/yyyy' → 'yyyy-MM-dd' (null nếu sai định dạng hoặc ngày không tồn tại) */
export function parseVnDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const dt = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

/** Chữ viết tắt tên người: 'Nguyễn Thu Hà' → 'TH' */
export function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  const picked = words.length >= 2 ? words.slice(-2) : words;
  return picked.map((w) => w[0]?.toUpperCase() ?? '').join('');
}
