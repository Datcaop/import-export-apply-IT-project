'use client';

import { useEffect, useState } from 'react';
import { Card, CardHead } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { apiClient } from '@/lib/api-client';
import type { InventoryBalanceDto, Paged } from '@erp/shared';

export default function InventoryBalancesPage() {
  const [data, setData] = useState<Paged<InventoryBalanceDto>>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<Paged<InventoryBalanceDto>>('/inventory-balances')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Báo cáo tồn kho</h1>
      <Card>
        <CardHead title="Tồn kho hiện tại" />
        <div className="p-4">
          <DataTable
            columns={[
              { key: 'warehouseName', header: 'Kho', render: (r) => r.warehouseName },
              { key: 'productSku', header: 'Mã SP', render: (r) => r.productSku },
              { key: 'productName', header: 'Tên SP', render: (r) => r.productName },
              { key: 'productUom', header: 'ĐVT', render: (r) => r.productUom },
              { key: 'qtyOnHand', header: 'Số lượng tồn', className: 'text-right font-semibold', render: (r) => r.qtyOnHand },
              { key: 'avgCost', header: 'Giá vốn', className: 'text-right font-semibold', render: (r) => r.avgCost },
            ]}
            data={data.items}
            rowKey={(r) => `${r.warehouseId}-${r.productId}`}
            emptyMessage="Không có dữ liệu tồn kho"
          />
        </div>
      </Card>
    </div>
  );
}
