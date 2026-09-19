// Chạy: pnpm --filter api seed  (hoặc pnpm db:seed / pnpm db:reset ở gốc repo)
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PurchaseOrdersService } from '../purchasing/purchase-orders/purchase-orders.service.js';
import { GoodsReceiptsService } from '../purchasing/goods-receipts/goods-receipts.service.js';
import { SalesOrdersService } from '../sales/sales-orders/sales-orders.service.js';
import { GoodsIssuesService } from '../sales/goods-issues/goods-issues.service.js';
import { hashPassword } from '../auth/password.js';
import { fromDateOnly } from '../common/convert.js';
import { CURRENCIES, CUSTOMERS, PRODUCTS, RATES, SUPPLIERS, USERS, WAREHOUSES } from './master-data.js';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const password = process.env.SEED_PASSWORD;
    if (!password) throw new Error('Thiếu SEED_PASSWORD trong apps/api/.env');
    
    console.log('Seed dữ liệu mẫu…');
    const prisma = app.get(PrismaService);

    // --- Master Data ---
    const passwordHash = await hashPassword(password);
    for (const u of USERS) {
      await prisma.appUser.upsert({
        where: { username: u.username },
        update: { fullName: u.fullName, title: u.title },
        create: { ...u, passwordHash },
      });
    }

    for (const c of CURRENCIES) {
      await prisma.currency.upsert({ where: { code: c.code }, update: {}, create: c });
    }

    const ketoan = await prisma.appUser.findUniqueOrThrow({ where: { username: 'ketoan' } });
    for (const [code, rows] of Object.entries(RATES)) {
      for (const [date, rate] of rows) {
        const rateDate = fromDateOnly(date);
        await prisma.exchangeRate.upsert({
          where: { currencyCode_rateDate: { currencyCode: code, rateDate } },
          update: {},
          create: { currencyCode: code, rateDate, rate, source: 'Vietcombank', createdBy: ketoan.id },
        });
      }
    }

    for (const p of PRODUCTS) {
      await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p });
    }
    for (const w of WAREHOUSES) {
      await prisma.warehouse.upsert({ where: { code: w.code }, update: {}, create: w });
    }
    for (const s of SUPPLIERS) {
      await prisma.supplier.upsert({ where: { code: s.code }, update: {}, create: s });
    }
    for (const c of CUSTOMERS) {
      await prisma.customer.upsert({ where: { code: c.code }, update: {}, create: c });
    }

    console.log(
      `  danh mục: ${USERS.length} người dùng, ${CURRENCIES.length} tiền tệ, ${PRODUCTS.length} sản phẩm, ` +
        `${WAREHOUSES.length} kho, ${SUPPLIERS.length} NCC, ${CUSTOMERS.length} khách hàng`,
    );

    // --- Purchasing & Inventory Data ---
    const poService = app.get(PurchaseOrdersService);
    const grService = app.get(GoodsReceiptsService);
    const soService = app.get(SalesOrdersService);
    const giService = app.get(GoodsIssuesService);

    const user = await prisma.appUser.findFirstOrThrow({ where: { username: 'quan' } });
    const supplier = await prisma.supplier.findFirstOrThrow();
    const warehouse = await prisma.warehouse.findFirstOrThrow();
    const products = await prisma.product.findMany({ take: 3 });

    if (products.length < 3) throw new Error('Cần ít nhất 3 sản phẩm mẫu');

    // Kiểm tra xem đã có GR Opening chưa
    const existingOpening = await prisma.goodsReceipt.findFirst({ where: { receiptType: 'OPENING' } });
    if (!existingOpening) {
      console.log('--- Đang tạo phiếu nhập Tồn Đầu Kỳ ---');
      const openingGr = await grService.create(
        {
          receiptType: 'OPENING',
          warehouseId: warehouse.id.toString(),
          receiptDate: '2026-01-01',
          currencyCode: 'VND',
          exchangeRate: '1',
          note: 'Nhập tồn đầu kỳ',
          items: [
            { productId: products[0].id.toString(), qty: '100', unitCost: '150000' },
            { productId: products[1].id.toString(), qty: '50', unitCost: '320000' },
          ],
        },
        user.id
      );
      await grService.post(BigInt(openingGr.id), user.id);
      console.log(`Đã ghi sổ Phiếu tồn đầu kỳ: ${openingGr.grNo}`);
    }

    const existingPo = await prisma.purchaseOrder.findFirst();
    if (!existingPo) {
      console.log('--- Đang tạo Đơn mua hàng mẫu ---');
      const po1 = await poService.create(
        {
          supplierId: supplier.id.toString(),
          orderDate: '2026-03-01',
          currencyCode: 'VND',
          exchangeRate: '1',
          exchangeRateSource: null,
          terms: null,
          note: 'Đơn mua hàng test 1',
          items: [
            { productId: products[0].id.toString(), qtyOrdered: '50', unitPrice: '145000' },
            { productId: products[2].id.toString(), qtyOrdered: '20', unitPrice: '85000' },
          ],
        },
        user.id
      );
      await poService.approve(BigInt(po1.id));
      console.log(`Đã duyệt PO: ${po1.poNo}`);

      const gr1 = await grService.create(
        {
          receiptType: 'PURCHASE',
          poId: po1.id,
          supplierId: po1.supplierId,
          warehouseId: warehouse.id.toString(),
          receiptDate: '2026-03-05',
          currencyCode: 'VND',
          exchangeRate: '1',
          note: 'Nhập lần 1',
          items: [
            { 
              poItemId: po1.items[0].id, 
              productId: products[0].id.toString(), 
              qty: '30', 
              unitCost: '145000' 
            },
          ],
        },
        user.id
      );
      await grService.post(BigInt(gr1.id), user.id);
      console.log(`Đã nhận một phần PO bằng GR: ${gr1.grNo}`);

      const po2 = await poService.create(
        {
          supplierId: supplier.id.toString(),
          orderDate: '2026-03-10',
          currencyCode: 'USD',
          exchangeRate: '25400',
          exchangeRateSource: null,
          terms: null,
          note: 'Đơn hàng ngoại tệ',
          items: [
            { productId: products[1].id.toString(), qtyOrdered: '100', unitPrice: '12.5' },
          ],
        },
        user.id
      );
      console.log(`Đã tạo PO Nháp: ${po2.poNo}`);
    }

    const existingSo = await prisma.salesOrder.findFirst();
    if (!existingSo) {
      console.log('--- Đang tạo Đơn bán hàng mẫu ---');
      const customer = await prisma.customer.findFirstOrThrow();
      const so1 = await soService.create(
        {
          customerId: customer.id.toString(),
          orderDate: '2026-03-15',
          currencyCode: 'VND',
          exchangeRate: '1',
          paymentTerms: 'Trả chậm 30 ngày',
          shipToAddress: 'Hà Nội',
          defaultWarehouseId: warehouse.id.toString(),
          note: 'Đơn bán hàng test 1',
          items: [
            { productId: products[0].id.toString(), qtyOrdered: '20', unitPrice: '200000' },
            { productId: products[1].id.toString(), qtyOrdered: '10', unitPrice: '400000' },
          ],
        },
        user.id
      );
      await soService.approve(BigInt(so1.id));
      console.log(`Đã duyệt SO: ${so1.soNo}`);

      const gi1 = await giService.create(
        {
          soId: so1.id,
          warehouseId: warehouse.id.toString(),
          issueDate: '2026-03-20',
          note: 'Xuất một phần SO',
          items: [
            { 
              soItemId: so1.items[0].id, 
              productId: products[0].id.toString(), 
              qty: '10', 
            },
          ],
        },
        user.id
      );
      await giService.post(BigInt(gi1.id), user.id);
      console.log(`Đã xuất kho một phần SO bằng GI: ${gi1.giNo}`);
    }

    console.log('Xong.');
  } finally {
    await app.close();
  }
}

await main();
