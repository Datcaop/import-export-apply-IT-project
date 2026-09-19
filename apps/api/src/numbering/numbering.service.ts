import { Injectable } from '@nestjs/common';
import type { DocType } from '@erp/shared';
import type { Tx } from '../prisma/prisma-tx.js';

/**
 * Cấp số chứng từ dạng PO-2026-0001. Gọi bên trong transaction tạo chứng từ: dòng
 * doc_sequence bị khóa đến khi transaction kết thúc, nên hai người tạo cùng lúc không
 * bao giờ trùng số; transaction rollback thì số được trả lại (không nhảy số).
 */
@Injectable()
export class NumberingService {
  async next(tx: Tx, type: DocType, docDate: Date): Promise<string> {
    const year = docDate.getUTCFullYear();
    const rows = await tx.$queryRaw<{ last_value: number }[]>`
      INSERT INTO doc_sequence (doc_type, year, last_value) VALUES (${type}, ${year}, 1)
      ON CONFLICT (doc_type, year) DO UPDATE SET last_value = doc_sequence.last_value + 1
      RETURNING last_value`;
    return format(type, year, rows[0].last_value);
  }

  /** Chỉ dùng cho seed: đảm bảo số tiếp theo lớn hơn các số đã gán cố định. */
  async ensureAtLeast(tx: Tx, type: DocType, year: number, value: number): Promise<void> {
    await tx.$executeRaw`
      INSERT INTO doc_sequence (doc_type, year, last_value) VALUES (${type}, ${year}, ${value})
      ON CONFLICT (doc_type, year) DO UPDATE SET last_value = GREATEST(doc_sequence.last_value, ${value})`;
  }
}

export function format(type: DocType, year: number, n: number): string {
  return `${type}-${year}-${String(n).padStart(4, '0')}`;
}

/** 'PO-2026-0142' → { type: 'PO', year: 2026, n: 142 } */
export function parseDocNo(no: string): { type: string; year: number; n: number } | null {
  const m = /^([A-Z]+)-(\d{4})-(\d+)$/.exec(no);
  return m ? { type: m[1], year: Number(m[2]), n: Number(m[3]) } : null;
}
