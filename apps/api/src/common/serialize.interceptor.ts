import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';

const isDecimal = (v: object): boolean =>
  typeof (v as { toFixed?: unknown }).toFixed === 'function' &&
  typeof (v as { isNeg?: unknown }).isNeg === 'function' &&
  typeof (v as { d?: unknown }).d !== 'undefined';

/**
 * Lưới an toàn: mapper của từng module đã đổi BigInt/Decimal sang chuỗi, nhưng nếu còn sót
 * thì đổi ở đây thay vì để JSON.stringify ném lỗi 500.
 */
export function toJsonSafe(v: unknown): unknown {
  if (typeof v === 'bigint') return v.toString();
  if (v === null || typeof v !== 'object') return v;
  if (v instanceof Date) return v.toISOString();
  if (isDecimal(v)) return (v as { toString(): string }).toString();
  if (Array.isArray(v)) return v.map(toJsonSafe);
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) out[k] = toJsonSafe(val);
  return out;
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map(toJsonSafe));
  }
}
