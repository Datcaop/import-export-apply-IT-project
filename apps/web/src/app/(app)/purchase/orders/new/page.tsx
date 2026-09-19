import { api } from '@/lib/api';
import { SupplierDto, CurrencyDto, ProductDto } from '@erp/shared';
import { PoForm } from '../PoForm';
import { PageHead } from '@/components/ui/PageHead';

export default async function NewPurchaseOrderPage() {
  const [suppliers, currencies, products] = await Promise.all([
    api.get<SupplierDto[]>('/suppliers/options'),
    api.get<CurrencyDto[]>('/currencies'),
    api.get<ProductDto[]>('/products/lookup'),
  ]);

  return (
    <>
      <PageHead
        breadcrumb={[
          { label: 'Mua hàng' },
          { label: 'Đơn mua hàng', href: '/purchase/orders' },
          { label: 'Tạo mới' },
        ]}
        title="Tạo đơn mua hàng"
      />
      <PoForm suppliers={suppliers} currencies={currencies} products={products} />
    </>
  );
}
