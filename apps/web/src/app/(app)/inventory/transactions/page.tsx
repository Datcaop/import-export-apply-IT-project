'use client';

import { useEffect, useState } from 'react';
import { Card, CardHead } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { apiClient } from '@/lib/api-client';
import type { InventoryTransactionDto, Paged } from '@erp/shared';

export default function InventoryTransactionsPage() {
  const [data, setData] = useState<Paged<InventoryTransactionDto>>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<Paged<InventoryTransactionDto>>('/inventory-transactions')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Lịch sử giao dịch kho (Thẻ kho)</h1>
      <Card>
        <CardHead title="Giao dịch gần đây" />
        <div className="p-4">
          <DataTable
            columns={[
              { key: 'txnAt', header: 'Thời gian', render: (r) => new Date(r.txnAt).toLocaleString('vi-VN') },
              { key: 'txnType', header: 'Loại', render: (r) => r.txnType },
              { key: 'warehouseName', header: 'Kho', render: (r) => r.warehouseName },
              { key: 'productSku', header: 'Mã SP', render: (r) => r.productSku },
              { key: 'productName', header: 'Tên SP', render: (r) => r.productName },
              { key: 'refNo', header: 'Tham chiếu', render: (r) => r.refNo || r.refType },
              { key: 'qtyChange', header: 'Thay đổi', className: 'text-right', render: (r) => <span className={Number(r.qtyChange) > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{Number(r.qtyChange) > 0 ? '+' : ''}{r.qtyChange}</span> },
              { key: 'qtyAfter', header: 'Tồn sau GD', className: 'text-right', render: (r) => r.qtyAfter },
            ]}
            data={data.items}
            rowKey={(r) => r.id}
            emptyMessage="Không có lịch sử giao dịch"
          />
        </div>
      </Card>
    </div>
  );
}
