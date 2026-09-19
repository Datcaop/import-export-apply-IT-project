import { NumberingService } from '../src/numbering/numbering.service.js';
import { runInTx } from '../src/prisma/prisma-tx.js';
import { type TestCtx, createTestApp } from './helpers/app.js';

describe('Master data', () => {
  let ctx: TestCtx;
  let h: Record<string, string>;
  beforeAll(async () => {
    ctx = await createTestApp();
    h = await ctx.auth();
  });
  afterAll(() => ctx.app.close());

  it('lists products with paging and search', async () => {
    const res = await ctx.http().get('/api/products?q=k120&pageSize=5').set(h).expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0]).toMatchObject({ sku: 'BP-K120', uom: 'PCS', inUse: false, stock: [] });
  });

  it('creates a product and rejects a duplicate SKU', async () => {
    const created = await ctx
      .http()
      .post('/api/products')
      .set(h)
      .send({ sku: 'bp-k150', name: 'Bàn phím cơ K150', uom: 'PCS' })
      .expect(201);
    expect(created.body).toMatchObject({ sku: 'BP-K150', isActive: true });

    const dup = await ctx.http().post('/api/products').set(h).send({ sku: 'BP-K150', name: 'X', uom: 'PCS' }).expect(409);
    expect(dup.body.code).toBe('DUPLICATE');
    expect(dup.body.fieldErrors.sku).toBe('Mã hàng đã tồn tại');
  });

  it('blocks changing the SKU of a product used on documents', async () => {
    const p = await ctx.prisma.product.findUniqueOrThrow({ where: { sku: 'CH-M50' } });
    const w = await ctx.prisma.warehouse.findUniqueOrThrow({ where: { code: 'HN' } });
    // Một bút toán kho là đủ để sản phẩm "đang được dùng"
    await ctx.prisma.inventoryBalance.create({ data: { productId: p.id, warehouseId: w.id, qtyOnHand: 5, avgCost: 1000 } });
    await ctx.prisma.inventoryTransaction.create({
      data: { productId: p.id, warehouseId: w.id, txnType: 'RECEIPT', qtyChange: 5, qtyAfter: 5, refType: 'GR', refId: 1, refLineId: 1 },
    });

    const res = await ctx.http().patch(`/api/products/${p.id}`).set(h).send({ sku: 'CH-M51' }).expect(409);
    expect(res.body.code).toBe('IN_USE');
    await ctx.http().patch(`/api/products/${p.id}`).set(h).send({ name: 'Chuột không dây M50 (mới)' }).expect(200);

    // Kho còn tồn thì không ngừng dùng được
    const wr = await ctx.http().patch(`/api/warehouses/${w.id}`).set(h).send({ isActive: false }).expect(409);
    expect(wr.body.message).toBe('Không ngừng dùng được: Kho Hà Nội còn 1 mã hàng có tồn. Chuyển hoặc điều chỉnh hết tồn về 0 trước.');
  });

  it('suggests the latest rate on or before the document date', async () => {
    const res = await ctx.http().get('/api/exchange-rates/suggest?currency=USD&date=2026-09-15').set(h).expect(200);
    expect(res.body).toEqual({ rate: '25350.000000', rateDate: '2026-09-10', source: 'Vietcombank' });
  });

  it('rejects a duplicate exchange rate with the spec message', async () => {
    const res = await ctx
      .http()
      .post('/api/currencies/USD/rates')
      .set(h)
      .send({ rateDate: '2026-09-19', rate: '25410' })
      .expect(409);
    expect(res.body.message).toBe('Đã có tỷ giá USD ngày 19/09/2026; sửa dòng đó thay vì thêm mới.');

    const ok = await ctx.http().post('/api/currencies/USD/rates').set(h).send({ rateDate: '2026-09-20', rate: '25420' }).expect(201);
    expect(ok.body).toMatchObject({ rate: '25420.000000', createdBy: { fullName: 'Nguyễn Thu Hà' } });
  });

  it('explains a wrong customer tax code', async () => {
    const res = await ctx
      .http()
      .post('/api/customers')
      .set(h)
      .send({ code: 'KH-TEST', name: 'Khách test', taxCode: '010234567' })
      .expect(400);
    expect(res.body.fieldErrors.taxCode).toBe(
      'Mã số thuế phải có 10 hoặc 13 chữ số; đang có 9. Kiểm tra lại trên giấy đăng ký kinh doanh.',
    );
  });

  it('counts open POs per supplier and filters by default currency', async () => {
    const res = await ctx.http().get('/api/suppliers?currency=USD').set(h).expect(200);
    expect(res.body.items.map((s: { code: string }) => s.code)).toEqual(['NCC-KEYTECH', 'NCC-TAIPEI']);
  });

  it('issues consecutive document numbers under concurrency', async () => {
    const numbering = ctx.app.get(NumberingService);
    const date = new Date('2026-09-19T00:00:00Z');
    const nos = await Promise.all(
      Array.from({ length: 50 }, () => runInTx(ctx.prisma, (tx) => numbering.next(tx, 'PO', date))),
    );
    const expected = Array.from({ length: 50 }, (_, i) => `PO-2026-${String(i + 1).padStart(4, '0')}`);
    expect([...nos].sort()).toEqual(expected);
  });
});
