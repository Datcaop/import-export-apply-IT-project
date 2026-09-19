import { PageHead } from '@/components/ui/PageHead';
import { SoForm } from '../SoForm';
import { api } from '@/lib/api';
import type { CustomerDto, CurrencyDto, ProductDto, Paged } from '@erp/shared';

export default async function NewSalesOrderPage() {
  const [customers, currencies, products] = await Promise.all([
    api.get<Paged<CustomerDto>>('/master/customers', { pageSize: '1000' }).then(res => res.items.filter(s => s.isActive)),
    api.get<Paged<CurrencyDto>>('/master/currencies', { pageSize: '100' }).then(res => res.items),
    api.get<Paged<ProductDto>>('/master/products', { pageSize: '5000' }).then(res => res.items.filter(p => p.isActive)),
  ]);

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: 'Bán hàng' },
          { label: 'Đơn bán hàng', href: '/sales/orders' },
          { label: 'Thêm mới' },
        ]}
        title="Tạo Đơn bán hàng"
      />
      <SoForm customers={customers} currencies={currencies} products={products} />
    </>
  );
}
