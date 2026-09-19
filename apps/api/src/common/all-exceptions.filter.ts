import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { ApiError, ErrorCode } from '@erp/shared';
import type { Response } from 'express';
import { DomainError } from './domain-error.js';

interface PgInfo {
  prismaCode?: string;
  pgCode?: string;
  constraint?: string;
  target?: string[];
}

/** Moi mã lỗi Postgres / tên constraint từ lỗi Prisma (kể cả lỗi bọc qua driver adapter). */
export function extractPgInfo(err: unknown): PgInfo {
  const info: PgInfo = {};
  const seen = new Set<unknown>();
  const visit = (v: unknown, depth: number) => {
    if (!v || typeof v !== 'object' || seen.has(v) || depth > 6) return;
    seen.add(v);
    const o = v as Record<string, unknown>;
    if (typeof o.code === 'string' && /^P\d{4}$/.test(o.code) && !info.prismaCode) info.prismaCode = o.code;
    for (const k of ['originalCode', 'code']) {
      const c = o[k];
      if (typeof c === 'string' && /^[0-9A-Z]{5}$/.test(c) && !/^P\d{4}$/.test(c) && !info.pgCode) info.pgCode = c;
    }
    if (typeof o.constraint === 'string' && !info.constraint) info.constraint = o.constraint;
    if (typeof o.constraint === 'object' && o.constraint && 'index' in o.constraint && !info.constraint) {
      info.constraint = String((o.constraint as { index: unknown }).index);
    }
    if (Array.isArray(o.target) && !info.target) info.target = o.target.map(String);
    for (const key of ['meta', 'cause', 'driverAdapterError', 'kind']) visit(o[key], depth + 1);
  };
  visit(err, 0);
  if (!info.constraint && err instanceof Error) {
    const m = /constraint "([^"]+)"/.exec(err.message);
    if (m) info.constraint = m[1];
  }
  return info;
}

/** Đổi lỗi DB còn sót (dịch vụ đã kiểm tra trước nhưng vẫn lọt) thành lỗi có nghĩa. */
export function mapDbError(err: unknown): DomainError | null {
  const info = extractPgInfo(err);
  const { prismaCode, pgCode, constraint } = info;
  if (!prismaCode && !pgCode) return null;

  if (constraint === 'ck_inventory_non_negative') {
    return new DomainError('STOCK_SHORTAGE', 'Không đủ tồn kho để ghi sổ. Tải lại số tồn rồi giảm số lượng xuất.');
  }
  if (pgCode === '40P01' || pgCode === '55P03' || pgCode === '57014' || prismaCode === 'P2034' || prismaCode === 'P2028') {
    return new DomainError('BUSY', 'Hệ thống đang bận vì có người khác đang ghi sổ cùng mặt hàng. Thử lại sau vài giây.');
  }
  if (prismaCode === 'P2002' || pgCode === '23505') {
    return new DomainError('DUPLICATE', `Dữ liệu bị trùng (${constraint ?? info.target?.join(', ') ?? 'khóa duy nhất'}). Kiểm tra lại mã vừa nhập.`);
  }
  if (prismaCode === 'P2003' || pgCode === '23503') {
    return new DomainError('IN_USE', 'Dữ liệu đang được chứng từ khác tham chiếu hoặc tham chiếu tới dữ liệu không tồn tại.');
  }
  if (prismaCode === 'P2025') {
    return DomainError.notFound('bản ghi');
  }
  if (pgCode === '23514' || prismaCode === 'P2004') {
    return DomainError.validation(`Dữ liệu vi phạm quy tắc ${constraint ?? 'kiểm tra'} của hệ thống.`);
  }
  return null;
}

const HTTP_CODE: Record<number, ErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'UNAUTHENTICATED',
  404: 'NOT_FOUND',
  409: 'INVALID_STATE',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    if (body.statusCode >= 500) this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    res.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiError {
    const domain = exception instanceof DomainError ? exception : mapDbError(exception);
    if (domain) {
      return {
        statusCode: domain.statusCode,
        code: domain.code,
        message: domain.message,
        ...(domain.options.fieldErrors ? { fieldErrors: domain.options.fieldErrors } : {}),
        ...(domain.options.details !== undefined ? { details: domain.options.details } : {}),
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      const message =
        status === 404
          ? 'Không tìm thấy đường dẫn này.'
          : typeof resp === 'object' && resp && 'message' in resp
            ? String((resp as { message: unknown }).message)
            : exception.message;
      return { statusCode: status, code: HTTP_CODE[status] ?? 'INTERNAL', message };
    }
    return { statusCode: 500, code: 'INTERNAL', message: 'Lỗi hệ thống. Thử lại; nếu vẫn lỗi, báo quản trị hệ thống.' };
  }
}
