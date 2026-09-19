import { StandardSchemaValidationPipe } from '@nestjs/common';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { DomainError } from './domain-error.js';

function pathOf(issue: StandardSchemaV1.Issue): (string | number)[] {
  return (issue.path ?? []).map((p) => (typeof p === 'object' && p !== null && 'key' in p ? p.key : p) as string | number);
}

/**
 * Đổi các issue của Zod thành lỗi 400 thống nhất. Lỗi ở dòng hàng (đường dẫn bắt đầu bằng
 * `lines.<i>`) được thêm tiền tố "Dòng N: " để người dùng biết sửa ở đâu.
 */
export function issuesToError(issues: readonly StandardSchemaV1.Issue[]): DomainError {
  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];
  for (const issue of issues) {
    const path = pathOf(issue);
    let message = issue.message;
    if (path[0] === 'lines' && typeof path[1] === 'number') {
      message = `Dòng ${path[1] + 1}: ${message.charAt(0).toLowerCase()}${message.slice(1)}`;
    }
    const key = path.join('.') || '_';
    if (!fieldErrors[key]) fieldErrors[key] = message;
    if (!messages.includes(message)) messages.push(message);
  }
  return DomainError.validation(messages.slice(0, 3).join('; '), fieldErrors);
}

export const validationPipe = new StandardSchemaValidationPipe({
  exceptionFactory: (issues) => issuesToError(issues),
});
