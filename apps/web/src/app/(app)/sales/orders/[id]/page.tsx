import { PageHead } from '@/components/ui/PageHead';
import { SoForm } from '../SoForm';
import { api } from '@/lib/api';
import type { CustomerDto, CurrencyDto, ProductDto, SalesOrderDto, Paged } from '@erp/shared';
import { notFound } from 'next/navigation';

export default async function SalesOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  let so: SalesOrderDto;
  try {
    so = await api.get<SalesOrderDto>(`/sales-orders/${resolvedParams.id}`);
  } catch {
    notFound();
  }

  const [customers, currencies, products] = await Promise.all([
    api.get<Paged<CustomerDto>>('/master/customers', { pageSize: '1000' }).then(res => res.items.filter(s => s.isActive || s.id === so.customerId)),
    api.get<Paged<CurrencyDto>>('/master/currencies', { pageSize: '100' }).then(res => res.items),
    api.get<Paged<ProductDto>>('/master/products', { pageSize: '5000' }).then(res => res.items),
  ]);

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: 'Bán hàng' },
          { label: 'Đơn bán hàng', href: '/sales/orders' },
          { label: so.soNo },
        ]}
        title={`Đơn bán hàng ${so.soNo}`}
      />
      <SoForm so={so} customers={customers} currencies={currencies} products={products} />
    </>
  );
}
