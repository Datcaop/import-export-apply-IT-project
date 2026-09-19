import { api } from '@/lib/api';
import { SupplierDto, CurrencyDto, ProductDto, PurchaseOrderDto } from '@erp/shared';
import { PoForm } from '../PoForm';
import { PageHead } from '@/components/ui/PageHead';

interface Props { params: Promise<{ id: string }> }

export default async function EditPurchaseOrderPage({ params }: Props) {
  const { id } = await params;
  
  const [po, suppliers, currencies, products] = await Promise.all([
    api.get<PurchaseOrderDto>(`/purchase-orders/${id}`),
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
          { label: po.poNo },
        ]}
        title={`Đơn mua hàng ${po.poNo}`}
      />
      <PoForm po={po} suppliers={suppliers} currencies={currencies} products={products} />
    </>
  );
}
