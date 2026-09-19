import { Module } from '@nestjs/common';
import { CurrenciesController } from './currencies/currencies.controller.js';
import { CurrenciesService } from './currencies/currencies.service.js';
import { CustomersService } from './customers/customers.service.js';
import { CustomersController, SuppliersController, WarehousesController } from './master.controllers.js';
import { ProductsController } from './products/products.controller.js';
import { ProductsService } from './products/products.service.js';
import { SuppliersService } from './suppliers/suppliers.service.js';
import { WarehousesService } from './warehouses/warehouses.service.js';

@Module({
  controllers: [CurrenciesController, ProductsController, WarehousesController, SuppliersController, CustomersController],
  providers: [CurrenciesService, ProductsService, WarehousesService, SuppliersService, CustomersService],
  exports: [CurrenciesService, ProductsService, WarehousesService, SuppliersService, CustomersService],
})
export class MasterModule {}
