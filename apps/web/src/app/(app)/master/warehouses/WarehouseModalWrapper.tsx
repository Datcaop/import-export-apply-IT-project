'use client';

import { useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { WarehouseDto } from '@erp/shared';
import { WarehouseModal } from './WarehouseModal';

export function WarehouseModalWrapper({ items }: { items: WarehouseDto[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { open, edit } = useMemo(() => {
    if (searchParams.get('modal') === 'new') return { open: true, edit: null };
    const editId = searchParams.get('edit');
    if (editId) {
      const w = items.find((i) => i.id === editId) ?? null;
      return { open: !!w, edit: w };
    }
    return { open: false, edit: null };
  }, [searchParams, items]);

  const handleClose = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('modal'); p.delete('edit');
    router.push(`/master/warehouses${p.toString() ? `?${p}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  return <WarehouseModal open={open} warehouse={edit} onClose={handleClose} />;
}
