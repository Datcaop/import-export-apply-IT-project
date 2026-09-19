// Chuyển đổi giữa kiểu của Prisma (BigInt, Decimal, Date) và kiểu truyền qua API (chuỗi).
import { D, type Dec, type DecInput, type UserRef } from '@erp/shared';

export const idOf = (v: bigint): string => v.toString();
export const optIdOf = (v: bigint | null | undefined): string | null => (v == null ? null : v.toString());
export const toBigInt = (v: string | number | bigint): bigint => BigInt(v);
export const optBigInt = (v: string | null | undefined): bigint | null => (v ? BigInt(v) : null);

/** Decimal của Prisma → decimal.js dùng chung (ROUND_HALF_UP) */
export const dec = (v: DecInput | null | undefined): Dec => D(v == null ? 0 : v.toString());

/** Decimal → chuỗi cố định số lẻ; null giữ null */
export const decStr = (v: DecInput | null | undefined, scale: number): string => dec(v).toFixed(scale);
export const optDecStr = (v: DecInput | null | undefined, scale: number): string | null =>
  v == null ? null : dec(v).toFixed(scale);

/** Cột DATE (Prisma trả Date lúc 00:00 UTC) → 'yyyy-MM-dd' */
export const dateOnly = (d: Date): string => d.toISOString().slice(0, 10);
export const optDateOnly = (d: Date | null | undefined): string | null => (d ? dateOnly(d) : null);

/** 'yyyy-MM-dd' → Date lúc 00:00 UTC để ghi vào cột DATE */
export const fromDateOnly = (s: string): Date => new Date(`${s}T00:00:00.000Z`);
export const optFromDateOnly = (s: string | null | undefined): Date | null => (s ? fromDateOnly(s) : null);

export const iso = (d: Date): string => d.toISOString();
export const optIso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

export const userRef = (u: { id: bigint; fullName: string } | null | undefined): UserRef | null =>
  u ? { id: u.id.toString(), fullName: u.fullName } : null;

export const USER_REF_SELECT = { select: { id: true, fullName: true } } as const;
