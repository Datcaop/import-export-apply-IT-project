'use client';

import { useActionState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CustomerDto, CurrencyDto } from '@erp/shared';
import { COUNTRY_LABEL } from '@erp/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/Form';
import { createCustomer, updateCustomer } from './actions';
import type { FormState } from '../products/actions';

interface Props { items: CustomerDto[]; currencies: CurrencyDto[]; }

export function CustomerModalWrapper({ items, currencies }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { open, edit } = useMemo(() => {
    if (searchParams.get('modal') === 'new') return { open: true, edit: null };
    const editId = searchParams.get('edit');
    if (editId) {
      const c = items.find((i) => i.id === editId) ?? null;
      return { open: !!c, edit: c };
    }
    return { open: false, edit: null };
  }, [searchParams, items]);

  const handleClose = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('modal'); p.delete('edit');
    router.push(`/master/customers${p.toString() ? `?${p}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  const isEdit = !!edit;
  const action = isEdit ? updateCustomer : createCustomer;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      handleClose();
      router.refresh();
    }
  }, [state.success, handleClose, router]);

  return (
    <Modal open={open} onClose={handleClose} title={isEdit ? 'Sửa khách hàng' : 'Thêm khách hàng'}
      footer={<><Button type="button" onClick={handleClose}>Hủy</Button><Button type="submit" form="cust-form" variant="primary" loading={pending}>{isEdit ? 'Lưu' : 'Thêm'}</Button></>}>
      {state.error && <div className="mb-4 p-3 rounded-md bg-badge-danger text-danger text-sm">{state.error}</div>}
      <form id="cust-form" action={formAction} className="grid grid-cols-2 gap-4 gap-x-5">
        {isEdit && <input type="hidden" name="id" value={edit!.id} />}
        <Field label="Mã khách hàng" htmlFor="cust-code" required error={state.fieldErrors?.code}>
          <Input id="cust-code" name="code" defaultValue={edit?.code} readOnly={isEdit && edit?.inUse} variant={isEdit && edit?.inUse ? 'readonly' : 'default'} />
        </Field>
        <Field label="Mã số thuế" htmlFor="cust-tax" error={state.fieldErrors?.taxCode} hint="10 hoặc 13 chữ số">
          <Input id="cust-tax" name="taxCode" defaultValue={edit?.taxCode ?? ''} />
        </Field>
        <Field label="Tên khách hàng" htmlFor="cust-name" required error={state.fieldErrors?.name} className="col-span-2">
          <Input id="cust-name" name="name" defaultValue={edit?.name} />
        </Field>
        <Field label="Địa chỉ" htmlFor="cust-addr" className="col-span-2" error={state.fieldErrors?.address}>
          <Textarea id="cust-addr" name="address" defaultValue={edit?.address ?? ''} rows={2} />
        </Field>
        <Field label="Quốc gia" htmlFor="cust-country" error={state.fieldErrors?.countryCode}>
          <Select id="cust-country" name="countryCode" defaultValue={edit?.countryCode ?? ''}>
            <option value="">— Chọn —</option>
            {Object.entries(COUNTRY_LABEL).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </Select>
        </Field>
        <Field label="Tiền tệ mặc định" htmlFor="cust-cur" error={state.fieldErrors?.defaultCurrency}>
          <Select id="cust-cur" name="defaultCurrency" defaultValue={edit?.defaultCurrency ?? ''}>
            <option value="">— Chọn —</option>
            {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
          </Select>
        </Field>
        <div className="col-span-2"><Checkbox name="isActive" label="Đang sử dụng" defaultChecked={edit?.isActive ?? true} /></div>
      </form>
    </Modal>
  );
}
