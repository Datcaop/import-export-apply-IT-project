import { Injectable } from '@nestjs/common';
import {
  type CurrencyDto,
  type ExchangeRateCreateInput,
  type ExchangeRateDto,
  type ExchangeRateUpdateInput,
  formatDate,
  type RateSuggestionDto,
} from '@erp/shared';
import { dateOnly, decStr, fromDateOnly, iso, USER_REF_SELECT, userRef } from '../../common/convert.js';
import { DomainError } from '../../common/domain-error.js';
import { paged, skipTake } from '../../common/pagination.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type RateRow = Prisma.ExchangeRateGetPayload<{ include: { createdByUser: typeof USER_REF_SELECT } }>;

const toRateDto = (r: RateRow): ExchangeRateDto => ({
  id: r.id.toString(),
  currencyCode: r.currencyCode,
  rateDate: dateOnly(r.rateDate),
  rate: decStr(r.rate, 6),
  source: r.source,
  createdBy: userRef(r.createdByUser),
  createdAt: iso(r.createdAt),
});

@Injectable()
export class CurrenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CurrencyDto[]> {
    const rows = await this.prisma.currency.findMany({ orderBy: [{ isBase: 'desc' }, { code: 'asc' }] });
    return rows.map((c) => ({ code: c.code, name: c.name, decimals: c.decimals, isBase: c.isBase }));
  }

  async baseCurrency() {
    const base = await this.prisma.currency.findFirst({ where: { isBase: true } });
    if (!base) throw new DomainError('INTERNAL', 'Chưa khai báo tiền tệ gốc. Báo quản trị hệ thống.');
    return base;
  }

  private async getCurrency(code: string) {
    const c = await this.prisma.currency.findUnique({ where: { code: code.toUpperCase() } });
    if (!c) throw DomainError.notFound(`tiền tệ ${code.toUpperCase()}`);
    return c;
  }

  async rates(code: string, q: { page: number; pageSize: number }) {
    const c = await this.getCurrency(code);
    const where = { currencyCode: c.code };
    const [rows, total] = await Promise.all([
      this.prisma.exchangeRate.findMany({
        where,
        include: { createdByUser: USER_REF_SELECT },
        orderBy: { rateDate: 'desc' },
        ...skipTake(q),
      }),
      this.prisma.exchangeRate.count({ where }),
    ]);
    return paged(rows.map(toRateDto), total, q);
  }

  async createRate(code: string, input: ExchangeRateCreateInput, userId: bigint): Promise<ExchangeRateDto> {
    const c = await this.getCurrency(code);
    if (c.isBase) {
      throw DomainError.validation(`${c.code} là tiền gốc nên tỷ giá luôn là 1; không cần nhập.`);
    }
    const rateDate = fromDateOnly(input.rateDate);
    const exists = await this.prisma.exchangeRate.findUnique({
      where: { currencyCode_rateDate: { currencyCode: c.code, rateDate } },
    });
    if (exists) {
      throw new DomainError(
        'DUPLICATE',
        `Đã có tỷ giá ${c.code} ngày ${formatDate(input.rateDate)}; sửa dòng đó thay vì thêm mới.`,
        { fieldErrors: { rateDate: 'Ngày này đã có tỷ giá' } },
      );
    }
    const row = await this.prisma.exchangeRate.create({
      data: { currencyCode: c.code, rateDate, rate: input.rate, source: input.source, createdBy: userId },
      include: { createdByUser: USER_REF_SELECT },
    });
    return toRateDto(row);
  }

  async updateRate(id: bigint, input: ExchangeRateUpdateInput): Promise<ExchangeRateDto> {
    const exists = await this.prisma.exchangeRate.findUnique({ where: { id } });
    if (!exists) throw DomainError.notFound('tỷ giá');
    const row = await this.prisma.exchangeRate.update({
      where: { id },
      data: { ...(input.rate !== undefined ? { rate: input.rate } : {}), ...(input.source !== undefined ? { source: input.source } : {}) },
      include: { createdByUser: USER_REF_SELECT },
    });
    return toRateDto(row);
  }

  /** Tỷ giá gợi ý: bản ghi mới nhất có rate_date ≤ ngày chứng từ. Tiền gốc luôn là 1. */
  async suggest(code: string, date: string): Promise<RateSuggestionDto | null> {
    const c = await this.getCurrency(code);
    if (c.isBase) return { rate: '1.000000', rateDate: date, source: null };
    const row = await this.prisma.exchangeRate.findFirst({
      where: { currencyCode: c.code, rateDate: { lte: fromDateOnly(date) } },
      orderBy: { rateDate: 'desc' },
    });
    return row ? { rate: decStr(row.rate, 6), rateDate: dateOnly(row.rateDate), source: row.source } : null;
  }
}
