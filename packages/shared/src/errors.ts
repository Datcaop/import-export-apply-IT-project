// Hình dạng lỗi thống nhất của API: { statusCode, code, message, fieldErrors?, details? }

export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'INVALID_STATE',
  'DUPLICATE',
  'IN_USE',
  'STOCK_SHORTAGE',
  'STOCK_CHANGED',
  'OVER_RECEIPT',
  'OVER_ISSUE',
  'BUSY',
  'INTERNAL',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiError {
  statusCode: number;
  code: ErrorCode;
  message: string;
  /** Lỗi theo trường, khóa là đường dẫn dạng 'lines.1.qty' */
  fieldErrors?: Record<string, string>;
  details?: unknown;
}

export function isApiError(v: unknown): v is ApiError {
  return typeof v === 'object' && v !== null && 'code' in v && 'message' in v && 'statusCode' in v;
}

/** Chi tiết lỗi STOCK_SHORTAGE: dùng để vẽ màn "người khác vừa xuất trước" */
export interface ShortageLine {
  lineId: string;
  lineNo: number;
  productId: string;
  sku: string;
  requested: string;
  available: string;
  shortBy: string;
  lastMovement: {
    refType: string;
    refNo: string;
    at: string;
    qtyChange: string;
    by: string | null;
  } | null;
}
export interface ShortageDetails {
  lines: ShortageLine[];
  ok: { lineId: string; sku: string; available: string }[];
}

/** Chi tiết lỗi STOCK_CHANGED (kiểm kê): tồn hệ thống đã khác lúc lập phiếu */
export interface StockChangedDetails {
  lines: { lineId: string; sku: string; qtySystem: string; qtyNow: string }[];
}
