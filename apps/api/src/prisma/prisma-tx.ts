import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from './prisma.service.js';

export type Tx = Prisma.TransactionClient;

/**
 * Chạy `fn` trong một transaction READ COMMITTED. Các nghiệp vụ ghi sổ khóa dòng bằng
 * SELECT … FOR UPDATE theo thứ tự cố định; lock_timeout giới hạn thời gian chờ khóa để
 * trả lỗi BUSY rõ ràng thay vì treo.
 */
export function runInTx<T>(prisma: PrismaService, fn: (tx: Tx) => Promise<T>, opts: { lockTimeoutMs?: number } = {}) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '${opts.lockTimeoutMs ?? 10_000}ms'`);
      return fn(tx);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5_000,
      timeout: 20_000,
    },
  );
}
