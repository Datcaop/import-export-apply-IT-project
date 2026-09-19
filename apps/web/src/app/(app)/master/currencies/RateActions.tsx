'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Form';

interface Props {
  currencyCode: string;
}

export function RateActions({ currencyCode }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/bff/currencies/${currencyCode}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rateDate: form.get('rateDate'),
          rate: form.get('rate'),
          source: form.get('source') || null,
        }),
      });

      // BFF only supports GET, so use direct API call via server action instead
      // For now, use a simplified approach
      if (!res.ok) {
        const body = await res.json();
        setError(body.message ?? 'Lỗi hệ thống');
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError('Không thể kết nối tới server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>+ Thêm tỷ giá</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Thêm tỷ giá ${currencyCode}`}
        footer={<><Button onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" form="rate-form" variant="primary" loading={loading}>Thêm</Button></>}>
        {error && <div className="mb-4 p-3 rounded-md bg-badge-danger text-danger text-sm">{error}</div>}
        <form id="rate-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 gap-x-5">
          <Field label="Ngày áp dụng" htmlFor="rate-date" required>
            <Input id="rate-date" name="rateDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Tỷ giá" htmlFor="rate-val" required>
            <Input id="rate-val" name="rate" variant="num" placeholder="VD: 25400" />
          </Field>
          <Field label="Nguồn" htmlFor="rate-src" className="col-span-2">
            <Input id="rate-src" name="source" defaultValue="Vietcombank" />
          </Field>
        </form>
      </Modal>
    </>
  );
}
