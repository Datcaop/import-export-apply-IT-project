import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module.js';
import { SalesOrdersController } from './sales-orders/sales-orders.controller.js';
import { SalesOrdersService } from './sales-orders/sales-orders.service.js';
import { GoodsIssuesController } from './goods-issues/goods-issues.controller.js';
import { GoodsIssuesService } from './goods-issues/goods-issues.service.js';

@Module({
  imports: [InventoryModule],
  controllers: [SalesOrdersController, GoodsIssuesController],
  providers: [SalesOrdersService, GoodsIssuesService],
})
export class SalesModule {}
