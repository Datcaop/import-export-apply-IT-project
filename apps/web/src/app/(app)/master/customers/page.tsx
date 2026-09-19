import type { Paged, CustomerDto, CurrencyDto } from '@erp/shared';
import { COUNTRY_LABEL } from '@erp/shared';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ActiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHead } from '@/components/ui/PageHead';
import { Pagination } from '@/components/ui/Pagination';
import { FilterBar } from '../_components/FilterBar';
import { CustomerModalWrapper } from './CustomerModalWrapper';

interface Props { searchParams: Promise<Record<string, string | undefined>>; }

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, active, page } = params;
  const [data, currencies] = await Promise.all([
    api.get<Paged<CustomerDto>>('/customers', { q, active, page: page ?? '1', pageSize: '20' }),
    api.get<CurrencyDto[]>('/currencies'),
  ]);

  const columns: Column<CustomerDto>[] = [
    { key: 'code', header: 'Mã KH', render: (r) => <Link href={`?edit=${r.id}`} className="font-semibold text-primary no-underline hover:underline">{r.code}</Link> },
    { key: 'name', header: 'Tên khách hàng', render: (r) => r.name },
    { key: 'tax', header: 'MST', render: (r) => r.taxCode ?? '—' },
    { key: 'country', header: 'Quốc gia', render: (r) => r.countryCode ? COUNTRY_LABEL[r.countryCode] ?? r.countryCode : '—' },
    { key: 'so', header: 'SO mở', className: 'text-right', render: (r) => r.openSoCount || '—' },
    { key: 'status', header: 'Trạng thái', render: (r) => <ActiveBadge active={r.isActive} /> },
  ];

  const baseUrl = `/master/customers?${new URLSearchParams(Object.fromEntries(Object.entries({ q, active }).filter(([, v]) => v !== undefined)) as Record<string, string>)}`;

  return (
    <>
      <PageHead breadcrumb={[{ label: 'Danh mục' }, { label: 'Khách hàng' }]} title="Khách hàng" subtitle={`${data.total} khách hàng`}
        actions={<Link href="?modal=new"><Button variant="primary">+ Thêm KH</Button></Link>} />
      <Card>
        <FilterBar baseUrl="/master/customers" q={q} active={active} />
        <DataTable columns={columns} data={data.items} rowKey={(r) => r.id} emptyMessage="Không tìm thấy khách hàng nào."
          footer={data.total > data.pageSize && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} baseUrl={baseUrl} />} />
      </Card>
      <CustomerModalWrapper items={data.items} currencies={currencies} />
    </>
  );
}
