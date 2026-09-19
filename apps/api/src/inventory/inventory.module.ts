import { Module } from '@nestjs/common';
import { InventoryService } from './inventory-core/inventory.service.js';
import { BalancesController } from './balances/balances.controller.js';
import { BalancesService } from './balances/balances.service.js';
import { TransactionsController } from './transactions/transactions.controller.js';
import { TransactionsService } from './transactions/transactions.service.js';

@Module({
  controllers: [BalancesController, TransactionsController],
  providers: [InventoryService, BalancesService, TransactionsService],
  exports: [InventoryService],
})
export class InventoryModule {}
