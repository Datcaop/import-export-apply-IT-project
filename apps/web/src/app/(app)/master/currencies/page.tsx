import type { CurrencyDto, Paged, ExchangeRateDto } from '@erp/shared';
import { formatDate, formatRate, formatDateTime } from '@erp/shared';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardHead } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHead } from '@/components/ui/PageHead';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { RateActions } from './RateActions';

interface Props { searchParams: Promise<Record<string, string | undefined>>; }

export default async function CurrenciesPage({ searchParams }: Props) {
  const params = await searchParams;
  const currencies = await api.get<CurrencyDto[]>('/currencies');
  const selectedCode = params.currency ?? currencies.find((c) => !c.isBase)?.code ?? 'USD';
  const ratePage = params.ratePage ?? '1';

  const rates = selectedCode
    ? await api.get<Paged<ExchangeRateDto>>(`/currencies/${selectedCode}/rates`, { page: ratePage, pageSize: '10' })
    : null;

  const currColumns: Column<CurrencyDto>[] = [
    { key: 'code', header: 'Mã', render: (r) => <span className="font-semibold">{r.code}</span> },
    { key: 'name', header: 'Tên', render: (r) => r.name },
    { key: 'decimals', header: 'Số lẻ', className: 'text-right', render: (r) => r.decimals },
    { key: 'base', header: '', render: (r) => r.isBase ? <Badge tone="info">Tiền gốc</Badge> : null },
  ];

  const rateColumns: Column<ExchangeRateDto>[] = [
    { key: 'date', header: 'Ngày', render: (r) => formatDate(r.rateDate) },
    { key: 'rate', header: 'Tỷ giá', className: 'text-right', render: (r) => formatRate(r.rate) },
    { key: 'source', header: 'Nguồn', render: (r) => r.source ?? '—' },
    { key: 'by', header: 'Người nhập', render: (r) => r.createdBy?.fullName ?? '—' },
    { key: 'at', header: 'Lúc', render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <>
      <PageHead
        breadcrumb={[{ label: 'Danh mục' }, { label: 'Tiền tệ và tỷ giá' }]}
        title="Tiền tệ và tỷ giá"
      />

      <div className="grid grid-cols-[1fr_2fr] gap-5">
        {/* Left: currencies list */}
        <Card>
          <CardHead title="Tiền tệ" />
          <DataTable columns={currColumns} data={currencies} rowKey={(r) => r.code} />
        </Card>

        {/* Right: exchange rates for selected currency */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-base font-semibold text-text">Lịch sử tỷ giá</h2>
              <div className="flex gap-1 ml-3">
                {currencies.filter((c) => !c.isBase).map((c) => (
                  <Link
                    key={c.code}
                    href={`?currency=${c.code}`}
                    className={`h-9 px-3.5 rounded-full text-sm font-semibold border no-underline inline-flex items-center ${
                      selectedCode === c.code
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-text border-border-input hover:bg-surface-alt'
                    }`}
                  >
                    {c.code}
                  </Link>
                ))}
              </div>
            </div>
            <RateActions currencyCode={selectedCode} />
          </div>

          {rates && (
            <DataTable
              columns={rateColumns}
              data={rates.items}
              rowKey={(r) => r.id}
              emptyMessage="Chưa có tỷ giá nào."
              footer={
                rates.total > rates.pageSize && (
                  <Pagination
                    page={rates.page}
                    pageSize={rates.pageSize}
                    total={rates.total}
                    baseUrl={`/master/currencies?currency=${selectedCode}`}
                  />
                )
              }
            />
          )}
        </Card>
      </div>
    </>
  );
}
