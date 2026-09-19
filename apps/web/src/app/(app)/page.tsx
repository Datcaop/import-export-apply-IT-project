import { Card } from '@/components/ui/Card';
import { PageHead } from '@/components/ui/PageHead';

export default function DashboardPage() {
  return (
    <>
      <PageHead
        breadcrumb={[{ label: 'Trang chủ' }]}
        title="Tổng quan"
        subtitle="Số liệu sẽ được cập nhật khi hoàn thành GĐ2–4"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-5">
        <Card>
          <div className="text-sm text-text-muted">Giá trị tồn kho</div>
          <div className="text-[28px] font-bold mt-2 tabular-nums">—</div>
          <div className="text-[13px] text-text-muted mt-1.5">Chưa có dữ liệu</div>
        </Card>
        <Card>
          <div className="text-sm text-text-muted">Đơn mua chờ nhận hàng</div>
          <div className="text-[28px] font-bold mt-2 tabular-nums">—</div>
          <div className="text-[13px] text-text-muted mt-1.5">Chưa có dữ liệu</div>
        </Card>
        <Card>
          <div className="text-sm text-text-muted">Đơn bán chờ xuất kho</div>
          <div className="text-[28px] font-bold mt-2 tabular-nums">—</div>
          <div className="text-[13px] text-text-muted mt-1.5">Chưa có dữ liệu</div>
        </Card>
        <Card>
          <div className="text-sm text-text-muted">Chứng từ nháp chưa ghi sổ</div>
          <div className="text-[28px] font-bold mt-2 tabular-nums">—</div>
          <div className="text-[13px] text-text-muted mt-1.5">Chưa có dữ liệu</div>
        </Card>
      </div>

      {/* Placeholder tables */}
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="m-0 text-base font-semibold text-text">Đơn mua chờ nhận hàng</h2>
          </div>
          <div className="text-center py-8 text-sm text-text-muted">
            Sẽ hiển thị sau khi hoàn thành module Mua hàng (GĐ2).
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="m-0 text-base font-semibold text-text">Đơn bán chờ xuất kho</h2>
          </div>
          <div className="text-center py-8 text-sm text-text-muted">
            Sẽ hiển thị sau khi hoàn thành module Bán hàng (GĐ3).
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="m-0 text-base font-semibold text-text">Biến động kho gần đây</h2>
        </div>
        <div className="text-center py-8 text-sm text-text-muted">
          Sẽ hiển thị sau khi hoàn thành module Kho (GĐ4).
        </div>
      </Card>
    </>
  );
}
