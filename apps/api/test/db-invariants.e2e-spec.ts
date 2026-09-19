// Canh giữ các đối tượng DB viết tay trong migration db_rules: nếu một migration sau lỡ
// xóa mất (Prisma không quản lý chúng), test này báo ngay.
import { type TestCtx, createTestApp } from './helpers/app.js';

const CHECKS = [
  'ck_exchange_rate_rate',
  'ck_po_status',
  'ck_po_cancelled',
  'ck_po_closed',
  'ck_po_item_not_over_received',
  'ck_gr_receipt_type',
  'ck_gr_po_required',
  'ck_gr_customer_return',
  'ck_gr_posted',
  'ck_gr_item_qty',
  'ck_so_status',
  'ck_so_item_not_over_issued',
  'ck_gi_status',
  'ck_gi_item_qty',
  'ck_adj_reason',
  'ck_adj_item_qty_change',
  'ck_inventory_non_negative',
  'ck_inv_txn_type',
  'ck_inv_txn_qty_after',
  'ck_inv_txn_ref_type',
];

describe('DB invariants', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.app.close());

  it('has every hand-written CHECK constraint', async () => {
    const rows = await ctx.prisma.$queryRaw<{ conname: string }[]>`
      SELECT conname FROM pg_constraint WHERE contype = 'c'`;
    const names = new Set(rows.map((r) => r.conname));
    expect(CHECKS.filter((c) => !names.has(c))).toEqual([]);
  });

  it('keeps line_amount as a GENERATED column', async () => {
    const rows = await ctx.prisma.$queryRaw<{ table: string }[]>`
      SELECT c.relname AS table FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
      WHERE a.attname = 'line_amount' AND a.attgenerated = 's'`;
    expect(rows.map((r) => r.table).sort()).toEqual(['purchase_order_item', 'sales_order_item']);
  });

  it('has the single-base-currency partial index, ledger trigger and views', async () => {
    const idx = await ctx.prisma.$queryRaw<{ indexdef: string }[]>`
      SELECT indexdef FROM pg_indexes WHERE indexname = 'uq_currency_single_base'`;
    expect(idx[0]?.indexdef).toMatch(/WHERE is_base/);

    const trg = await ctx.prisma.$queryRaw<{ tgname: string }[]>`
      SELECT tgname FROM pg_trigger WHERE tgname = 'trg_inventory_txn_immutable'`;
    expect(trg).toHaveLength(1);

    const views = await ctx.prisma.$queryRaw<{ viewname: string }[]>`
      SELECT viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname`;
    expect(views.map((v) => v.viewname)).toEqual(['v_inventory_reconcile', 'v_inventory_reconcile_all']);
  });

  it('rejects a second base currency', async () => {
    await expect(
      ctx.prisma.currency.create({ data: { code: 'XXX', name: 'Test', decimals: 0, isBase: true } }),
    ).rejects.toThrow();
  });
});
