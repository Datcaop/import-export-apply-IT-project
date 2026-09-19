import type { ErrorCode } from '@erp/shared';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  NOT_FOUND: 404,
  INVALID_STATE: 409,
  DUPLICATE: 409,
  IN_USE: 409,
  STOCK_SHORTAGE: 409,
  STOCK_CHANGED: 409,
  OVER_RECEIPT: 409,
  OVER_ISSUE: 409,
  BUSY: 503,
  INTERNAL: 500,
};

/**
 * Lỗi nghiệp vụ có mã ổn định và câu tiếng Việt nói rõ cách sửa.
 * AllExceptionsFilter đổi nó thành body { statusCode, code, message, fieldErrors?, details? }.
 */
export class DomainError extends Error {
  readonly statusCode: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly options: { fieldErrors?: Record<string, string>; details?: unknown; statusCode?: number } = {},
  ) {
    super(message);
    this.statusCode = options.statusCode ?? STATUS_BY_CODE[code];
  }

  static notFound(what: string) {
    return new DomainError('NOT_FOUND', `Không tìm thấy ${what}. Có thể đã bị xóa; tải lại danh sách.`);
  }

  static validation(message: string, fieldErrors?: Record<string, string>) {
    return new DomainError('VALIDATION_FAILED', message, { fieldErrors });
  }
}
