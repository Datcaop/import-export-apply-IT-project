import type { AdjReason, DocStatus, PoStatus, ReceiptType, SoStatus, TxnType } from './enums.js';

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'muted' | 'danger';
export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const PO_STATUS_META: Record<PoStatus, StatusMeta> = {
  DRAFT: { label: 'Nháp', tone: 'neutral' },
  APPROVED: { label: 'Đã duyệt', tone: 'info' },
  PARTIALLY_RECEIVED: { label: 'Nhận một phần', tone: 'warning' },
  RECEIVED: { label: 'Đã nhận đủ', tone: 'success' },
  CLOSED: { label: 'Đã đóng', tone: 'muted' },
  CANCELLED: { label: 'Đã hủy', tone: 'muted' },
};

export const SO_STATUS_META: Record<SoStatus, StatusMeta> = {
  DRAFT: { label: 'Nháp', tone: 'neutral' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'info' },
  PARTIALLY_ISSUED: { label: 'Xuất một phần', tone: 'warning' },
  ISSUED: { label: 'Đã xuất đủ', tone: 'success' },
  CLOSED: { label: 'Đã đóng', tone: 'muted' },
  CANCELLED: { label: 'Đã hủy', tone: 'muted' },
};

export const DOC_STATUS_META: Record<DocStatus, StatusMeta> = {
  DRAFT: { label: 'Nháp', tone: 'neutral' },
  POSTED: { label: 'Đã ghi sổ', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'muted' },
};

export const ACTIVE_META = {
  true: { label: 'Đang dùng', tone: 'success' },
  false: { label: 'Ngừng dùng', tone: 'muted' },
} as const satisfies Record<'true' | 'false', StatusMeta>;

export const RECEIPT_TYPE_LABEL: Record<ReceiptType, string> = {
  PURCHASE: 'Nhập mua hàng (theo PO)',
  NON_PO: 'Nhập ngoài PO',
  OPENING: 'Tồn đầu kỳ',
  CUSTOMER_RETURN: 'Khách trả hàng',
};

export const ADJ_REASON_LABEL: Record<AdjReason, string> = {
  STOCKTAKE: 'Kiểm kê định kỳ',
  DAMAGED: 'Hàng hư hỏng',
  LOST: 'Mất mát',
  OTHER: 'Khác',
};

export const TXN_TYPE_LABEL: Record<TxnType, string> = {
  RECEIPT: 'Nhập kho',
  ISSUE: 'Xuất bán',
  ADJUST_IN: 'Điều chỉnh tăng',
  ADJUST_OUT: 'Điều chỉnh giảm',
  TRANSFER_IN: 'Chuyển kho đến',
  TRANSFER_OUT: 'Chuyển kho đi',
  REVERSAL: 'Bút toán đảo',
};

/** Mã ĐVT lưu trong DB → tên hiển thị */
export const UOM_LABEL: Record<string, string> = {
  PCS: 'Cái',
  BOX: 'Hộp',
  SET: 'Bộ',
  KG: 'Kg',
  M: 'Mét',
};
export const uomLabel = (code: string) => UOM_LABEL[code] ?? code;

export const COUNTRY_LABEL: Record<string, string> = {
  VN: 'Việt Nam',
  CN: 'Trung Quốc',
  TW: 'Đài Loan',
  DE: 'Đức',
  JP: 'Nhật Bản',
  SG: 'Singapore',
  US: 'Hoa Kỳ',
  KR: 'Hàn Quốc',
};
