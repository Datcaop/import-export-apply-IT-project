'use client';

import { useState, useReducer, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerDto, CurrencyDto, ProductDto, SalesOrderDto, formatMoney, lineAmount, orderTotals, SoItemDto, SalesOrderInputSchema, D } from '@erp/shared';
import { Card, CardHead } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Props {
  so?: SalesOrderDto;
  customers: CustomerDto[];
  currencies: CurrencyDto[];
  products: ProductDto[];
}

type GridItem = {
  id?: string;
  productId: string;
  qtyOrdered: string;
  unitPrice: string;
};

type Action = 
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM'; index: number }
  | { type: 'UPDATE_ITEM'; index: number; field: keyof GridItem; value: string };

function initGrid(so?: SalesOrderDto): GridItem[] {
  if (!so || so.items.length === 0) {
    return [{ productId: '', qtyOrdered: '1', unitPrice: '0' }];
  }
  return so.items.map(i => ({
    id: i.id,
    productId: i.productId,
    qtyOrdered: i.qtyOrdered,
    unitPrice: i.unitPrice,
  }));
}

export function SoForm({ so, customers, currencies, products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!so;
  const isDraft = !so || so.status === 'DRAFT';

  const [header, setHeader] = useState({
    customerId: so?.customerId ?? '',
    orderDate: so?.orderDate ?? new Date().toISOString().split('T')[0],
    currencyCode: so?.currencyCode ?? 'VND',
    exchangeRate: so?.exchangeRate ?? '1',
    paymentTerms: so?.paymentTerms ?? '',
    shipToAddress: so?.shipToAddress ?? '',
    note: so?.note ?? '',
  });

  const [items, dispatch] = useReducer((state: GridItem[], action: Action) => {
    switch (action.type) {
      case 'ADD_ITEM':
        return [...state, { productId: '', qtyOrdered: '1', unitPrice: '0' }];
      case 'REMOVE_ITEM':
        return state.filter((_, i) => i !== action.index);
      case 'UPDATE_ITEM':
        const next = [...state];
        next[action.index] = { ...next[action.index], [action.field]: action.value };
        return next;
      default:
        return state;
    }
  }, so, initGrid);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError('');
    const input = {
      ...header,
      items: items.map(i => ({ ...i, qtyOrdered: i.qtyOrdered || '0', unitPrice: i.unitPrice || '0' }))
    };

    const parsed = SalesOrderInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        await apiClient.patch(`/sales-orders/${so.id}`, parsed.data);
      } else {
        await apiClient.post('/sales-orders', parsed.data);
      }
      startTransition(() => {
        router.push('/sales/orders');
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!so) return;
    if (!confirm('Bạn có chắc chắn muốn duyệt đơn bán hàng này?')) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/sales-orders/${so.id}/approve`, {});
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totals = orderTotals(
    items.map(i => ({ qty: i.qtyOrdered || 0, unitPrice: i.unitPrice || 0 })),
    header.exchangeRate || 1
  );

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-[#FFF8F7] border border-[#C4321F] text-[#C4321F] px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHead title="Thông tin chung" />
        <div className="grid grid-cols-3 gap-5">
          <Field label="Khách hàng" required>
            <Select name="customerId" value={header.customerId} onChange={handleHeaderChange} disabled={!isDraft}>
              <option value="">-- Chọn khách hàng --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </Select>
          </Field>
          <Field label="Ngày đặt" required>
            <Input type="date" name="orderDate" value={header.orderDate} onChange={handleHeaderChange} disabled={!isDraft} />
          </Field>
          <Field label="Tiền tệ" required>
            <Select name="currencyCode" value={header.currencyCode} onChange={handleHeaderChange} disabled={!isDraft}>
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </Select>
          </Field>
          <Field label="Tỷ giá" required>
            <Input type="number" step="0.01" name="exchangeRate" value={header.exchangeRate} onChange={handleHeaderChange} disabled={!isDraft} />
          </Field>
          <Field label="Điều khoản thanh toán">
            <Input name="paymentTerms" value={header.paymentTerms} onChange={handleHeaderChange} disabled={!isDraft} />
          </Field>
          <Field label="Địa chỉ giao hàng">
            <Input name="shipToAddress" value={header.shipToAddress} onChange={handleHeaderChange} disabled={!isDraft} />
          </Field>
          <Field label="Ghi chú">
            <Input name="note" value={header.note} onChange={handleHeaderChange} disabled={!isDraft} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHead title="Chi tiết sản phẩm" />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border-input text-[13px] text-text-muted">
                <th className="py-2.5 font-medium w-8 text-center">#</th>
                <th className="py-2.5 font-medium">Sản phẩm</th>
                <th className="py-2.5 font-medium w-24">ĐVT</th>
                <th className="py-2.5 font-medium w-32 text-right">Số lượng</th>
                <th className="py-2.5 font-medium w-36 text-right">Đơn giá</th>
                <th className="py-2.5 font-medium w-36 text-right">Thành tiền</th>
                {isDraft && <th className="py-2.5 font-medium w-12 text-center"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const p = products.find(p => p.id === item.productId);
                const amt = lineAmount(item.qtyOrdered || 0, item.unitPrice || 0);
                return (
                  <tr key={idx} className="border-b border-border-layout last:border-0">
                    <td className="py-2 text-center text-sm">{idx + 1}</td>
                    <td className="py-2">
                      <Select 
                        value={item.productId} 
                        onChange={e => dispatch({ type: 'UPDATE_ITEM', index: idx, field: 'productId', value: e.target.value })}
                        disabled={!isDraft}
                      >
                        <option value="">-- Chọn --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                      </Select>
                    </td>
                    <td className="py-2 text-sm text-text-muted">{p?.uom ?? '-'}</td>
                    <td className="py-2">
                      <Input 
                        type="number" min="0" step="1" variant="num"
                        value={item.qtyOrdered} 
                        onChange={e => dispatch({ type: 'UPDATE_ITEM', index: idx, field: 'qtyOrdered', value: e.target.value })}
                        disabled={!isDraft}
                      />
                    </td>
                    <td className="py-2">
                      <Input 
                        type="number" min="0" step="0.01" variant="num"
                        value={item.unitPrice} 
                        onChange={e => dispatch({ type: 'UPDATE_ITEM', index: idx, field: 'unitPrice', value: e.target.value })}
                        disabled={!isDraft}
                      />
                    </td>
                    <td className="py-2 text-right text-sm font-semibold">
                      {formatMoney(amt)}
                    </td>
                    {isDraft && (
                      <td className="py-2 text-center">
                        <button type="button" onClick={() => dispatch({ type: 'REMOVE_ITEM', index: idx })} className="text-danger hover:text-danger-hover p-1">
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={isDraft ? 7 : 6} className="py-3">
                  {isDraft && (
                    <button type="button" onClick={() => dispatch({ type: 'ADD_ITEM' })} className="text-sm text-primary font-medium hover:underline">
                      + Thêm dòng
                    </button>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-border-layout">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Tổng tiền ({header.currencyCode}):</span>
              <span className="font-semibold">{formatMoney(totals.totalAmount)}</span>
            </div>
            {header.currencyCode !== 'VND' && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Quy đổi VND:</span>
                <span className="font-semibold text-primary">{formatMoney(totals.totalAmountBase)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        {isDraft && (
          <Button variant="primary" onClick={handleSave} disabled={isSaving || isPending}>
            {isSaving ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Tạo đơn bán hàng')}
          </Button>
        )}
        {isEdit && isDraft && (
          <Button variant="default" onClick={handleApprove} disabled={isSaving || isPending}>
            Duyệt đơn
          </Button>
        )}
        {so?.status === 'CONFIRMED' && (
          <Link href={`/sales/issues/new?soId=${so.id}`} className="h-9 px-4 inline-flex items-center justify-center rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-hover no-underline shadow-sm">
            Tạo phiếu xuất kho
          </Link>
        )}
      </div>
    </div>
  );
}
