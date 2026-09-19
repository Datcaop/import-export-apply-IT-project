// Phép tính tiền, số lượng, giá vốn. Dùng chung web (xem trước) và API (ghi thật)
// để hai bên luôn ra cùng một con số. Không bao giờ dùng Number cho tiền.
import { Decimal as DecimalJs } from 'decimal.js';

export const Dec = DecimalJs.clone({ precision: 40, rounding: DecimalJs.ROUND_HALF_UP });
export type Dec = InstanceType<typeof Dec>;
export type DecInput = string | number | Dec | { toString(): string };

export const D = (v: DecInput | null | undefined): Dec => new Dec(v == null ? 0 : v.toString());

/** Chuỗi số chuẩn (dấu chấm thập phân, không phân tách hàng nghìn), cố định `scale` chữ số lẻ */
export const toFixedStr = (v: DecInput, scale: number): string => D(v).toFixed(scale);

export const QTY_SCALE = 4;
export const MONEY_SCALE = 4;
export const RATE_SCALE = 6;

/** Thành tiền nguyên tệ của một dòng: qty × đơn giá, như NUMERIC(19,4) của Postgres */
export const lineAmount = (qty: DecInput, unitPrice: DecInput): Dec =>
  D(qty).mul(D(unitPrice)).toDecimalPlaces(MONEY_SCALE);

/** Quy đổi sang tiền gốc (VND: 0 chữ số lẻ) */
export const toBase = (amount: DecInput, rate: DecInput, baseDecimals = 0): Dec =>
  D(amount).mul(D(rate)).toDecimalPlaces(baseDecimals);

/** Giá nhập kho VND = đơn giá nguyên tệ × tỷ giá, làm tròn theo tiền gốc */
export const unitCostBase = (unitCost: DecInput, rate: DecInput, baseDecimals = 0): Dec =>
  toBase(unitCost, rate, baseDecimals);

export interface TotalsLine {
  qty: DecInput;
  unitPrice: DecInput;
}
/**
 * Tổng đơn: tổng nguyên tệ = Σ thành tiền dòng; tổng quy đổi = Σ quy đổi từng dòng
 * (đã làm tròn), để các dòng hiển thị luôn cộng đúng bằng tổng.
 */
export function orderTotals(lines: TotalsLine[], rate: DecInput, baseDecimals = 0) {
  let total = D(0);
  let totalBase = D(0);
  for (const l of lines) {
    const amt = lineAmount(l.qty, l.unitPrice);
    total = total.add(amt);
    totalBase = totalBase.add(toBase(amt, rate, baseDecimals));
  }
  return { totalAmount: total, totalAmountBase: totalBase };
}

/** Giá vốn bình quân gia quyền sau khi nhập thêm `inQty` với giá `inCost` */
export function weightedAverage(oldQty: DecInput, oldAvg: DecInput, inQty: DecInput, inCost: DecInput): Dec {
  const q0 = D(oldQty);
  const q1 = D(inQty);
  const newQty = q0.add(q1);
  if (q0.lte(0) || newQty.lte(0)) return D(inCost).toDecimalPlaces(MONEY_SCALE);
  return q0.mul(D(oldAvg)).add(q1.mul(D(inCost))).div(newQty).toDecimalPlaces(MONEY_SCALE);
}

export interface ProgressLine {
  ordered: DecInput;
  done: DecInput;
}
/** 'none' | 'partial' | 'full' theo số đã nhận/xuất so với số đặt */
export function progressState(lines: ProgressLine[]): 'none' | 'partial' | 'full' {
  if (lines.length === 0) return 'none';
  const allFull = lines.every((l) => D(l.done).gte(D(l.ordered)));
  if (allFull) return 'full';
  return lines.some((l) => D(l.done).gt(0)) ? 'partial' : 'none';
}

const PO_ROLLUP = { none: 'APPROVED', partial: 'PARTIALLY_RECEIVED', full: 'RECEIVED' } as const;
const SO_ROLLUP = { none: 'CONFIRMED', partial: 'PARTIALLY_ISSUED', full: 'ISSUED' } as const;

/** Trạng thái PO sau khi ghi sổ phiếu nhập */
export const rollupPoStatus = (lines: ProgressLine[]) => PO_ROLLUP[progressState(lines)];
/** Trạng thái SO sau khi ghi sổ phiếu xuất */
export const rollupSoStatus = (lines: ProgressLine[]) => SO_ROLLUP[progressState(lines)];

export const sumDec = (values: DecInput[]): Dec => values.reduce<Dec>((acc, v) => acc.add(D(v)), D(0));
