'use client';

import { useActionState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SupplierDto, CurrencyDto } from '@erp/shared';
import { COUNTRY_LABEL } from '@erp/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Checkbox } from '@/components/ui/Form';
import { createSupplier, updateSupplier } from './actions';
import type { FormState } from '../products/actions';

interface Props {
  items: SupplierDto[];
  currencies: CurrencyDto[];
}

export function SupplierModalWrapper({ items, currencies }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { open, edit } = useMemo(() => {
    if (searchParams.get('modal') === 'new') return { open: true, edit: null };
    const editId = searchParams.get('edit');
    if (editId) {
      const s = items.find((i) => i.id === editId) ?? null;
      return { open: !!s, edit: s };
    }
    return { open: false, edit: null };
  }, [searchParams, items]);

  const handleClose = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('modal'); p.delete('edit');
    router.push(`/master/suppliers${p.toString() ? `?${p}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  const isEdit = !!edit;
  const action = isEdit ? updateSupplier : createSupplier;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      handleClose();
      router.refresh();
    }
  }, [state.success, handleClose, router]);

  return (
    <Modal open={open} onClose={handleClose} title={isEdit ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
      footer={<><Button type="button" onClick={handleClose}>Hủy</Button><Button type="submit" form="sup-form" variant="primary" loading={pending}>{isEdit ? 'Lưu' : 'Thêm'}</Button></>}>
      {state.error && <div className="mb-4 p-3 rounded-md bg-badge-danger text-danger text-sm">{state.error}</div>}
      <form id="sup-form" action={formAction} className="grid grid-cols-2 gap-4 gap-x-5">
        {isEdit && <input type="hidden" name="id" value={edit!.id} />}
        <Field label="Mã NCC" htmlFor="sup-code" required error={state.fieldErrors?.code}>
          <Input id="sup-code" name="code" defaultValue={edit?.code} readOnly={isEdit && edit?.inUse} variant={isEdit && edit?.inUse ? 'readonly' : 'default'} />
        </Field>
        <Field label="Mã số thuế" htmlFor="sup-tax" error={state.fieldErrors?.taxCode}>
          <Input id="sup-tax" name="taxCode" defaultValue={edit?.taxCode ?? ''} />
        </Field>
        <Field label="Tên nhà cung cấp" htmlFor="sup-name" required error={state.fieldErrors?.name} className="col-span-2">
          <Input id="sup-name" name="name" defaultValue={edit?.name} />
        </Field>
        <Field label="Quốc gia" htmlFor="sup-country" error={state.fieldErrors?.countryCode}>
          <Select id="sup-country" name="countryCode" defaultValue={edit?.countryCode ?? ''}>
            <option value="">— Chọn —</option>
            {Object.entries(COUNTRY_LABEL).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </Select>
        </Field>
        <Field label="Tiền tệ mặc định" htmlFor="sup-cur" error={state.fieldErrors?.defaultCurrency}>
          <Select id="sup-cur" name="defaultCurrency" defaultValue={edit?.defaultCurrency ?? ''}>
            <option value="">— Chọn —</option>
            {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
          </Select>
        </Field>
        <div className="col-span-2"><Checkbox name="isActive" label="Đang sử dụng" defaultChecked={edit?.isActive ?? true} /></div>
      </form>
    </Modal>
  );
}
