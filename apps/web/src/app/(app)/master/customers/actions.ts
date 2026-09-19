'use server';

import { revalidatePath } from 'next/cache';
import type { CustomerCreateInput, CustomerUpdateInput } from '@erp/shared';
import { api, ApiRequestError } from '@/lib/api';
import type { FormState } from '../products/actions';

export async function createCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const body: CustomerCreateInput = {
    code: formData.get('code') as string,
    name: formData.get('name') as string,
    taxCode: (formData.get('taxCode') as string) || null,
    address: (formData.get('address') as string) || null,
    countryCode: (formData.get('countryCode') as string) || null,
    defaultCurrency: (formData.get('defaultCurrency') as string) || null,
    isActive: formData.get('isActive') === 'on',
  };
  try {
    await api.post('/customers', body);
    revalidatePath('/master/customers');
    return { success: true };
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.body.message, fieldErrors: err.body.fieldErrors };
    return { error: 'Lỗi hệ thống.' };
  }
}

export async function updateCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get('id') as string;
  const body: CustomerUpdateInput = {
    code: (formData.get('code') as string) || undefined,
    name: (formData.get('name') as string) || undefined,
    taxCode: (formData.get('taxCode') as string) || null,
    address: (formData.get('address') as string) || null,
    countryCode: (formData.get('countryCode') as string) || null,
    defaultCurrency: (formData.get('defaultCurrency') as string) || null,
    isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : undefined,
  };
  try {
    await api.patch(`/customers/${id}`, body);
    revalidatePath('/master/customers');
    return { success: true };
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.body.message, fieldErrors: err.body.fieldErrors };
    return { error: 'Lỗi hệ thống.' };
  }
}
