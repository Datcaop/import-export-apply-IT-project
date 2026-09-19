import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders/purchase-orders.controller.js';
import { PurchaseOrdersService } from './purchase-orders/purchase-orders.service.js';
import { GoodsReceiptsController } from './goods-receipts/goods-receipts.controller.js';
import { GoodsReceiptsService } from './goods-receipts/goods-receipts.service.js';
import { InventoryModule } from '../inventory/inventory.module.js';

@Module({
  imports: [InventoryModule],
  controllers: [PurchaseOrdersController, GoodsReceiptsController],
  providers: [PurchaseOrdersService, GoodsReceiptsService],
})
export class PurchasingModule {}
