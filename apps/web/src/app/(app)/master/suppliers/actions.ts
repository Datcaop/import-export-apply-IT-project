'use server';

import { revalidatePath } from 'next/cache';
import type { SupplierCreateInput, SupplierUpdateInput } from '@erp/shared';
import { api, ApiRequestError } from '@/lib/api';
import type { FormState } from '../products/actions';

export async function createSupplier(_prev: FormState, formData: FormData): Promise<FormState> {
  const body: SupplierCreateInput = {
    code: formData.get('code') as string,
    name: formData.get('name') as string,
    taxCode: (formData.get('taxCode') as string) || null,
    countryCode: (formData.get('countryCode') as string) || null,
    defaultCurrency: (formData.get('defaultCurrency') as string) || null,
    isActive: formData.get('isActive') === 'on',
  };
  try {
    await api.post('/suppliers', body);
    revalidatePath('/master/suppliers');
    return { success: true };
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.body.message, fieldErrors: err.body.fieldErrors };
    return { error: 'Lỗi hệ thống.' };
  }
}

export async function updateSupplier(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get('id') as string;
  const body: SupplierUpdateInput = {
    code: (formData.get('code') as string) || undefined,
    name: (formData.get('name') as string) || undefined,
    taxCode: (formData.get('taxCode') as string) || null,
    countryCode: (formData.get('countryCode') as string) || null,
    defaultCurrency: (formData.get('defaultCurrency') as string) || null,
    isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : undefined,
  };
  try {
    await api.patch(`/suppliers/${id}`, body);
    revalidatePath('/master/suppliers');
    return { success: true };
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.body.message, fieldErrors: err.body.fieldErrors };
    return { error: 'Lỗi hệ thống.' };
  }
}
