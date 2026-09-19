import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  type CustomerCreateInput,
  customerCreateSchema,
  type CustomerUpdateInput,
  customerUpdateSchema,
  idStr,
  type MasterListQuery,
  masterListQuerySchema,
  type SupplierCreateInput,
  supplierCreateSchema,
  supplierListQuerySchema,
  type SupplierUpdateInput,
  supplierUpdateSchema,
  type WarehouseCreateInput,
  warehouseCreateSchema,
  type WarehouseUpdateInput,
  warehouseUpdateSchema,
} from '@erp/shared';
import { CustomersService } from './customers/customers.service.js';
import { SuppliersService } from './suppliers/suppliers.service.js';
import { WarehousesService } from './warehouses/warehouses.service.js';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly svc: WarehousesService) {}

  @Get()
  list(@Query({ schema: masterListQuerySchema }) q: MasterListQuery) {
    return this.svc.list(q);
  }

  @Get('options')
  options() {
    return this.svc.options();
  }

  @Get(':id')
  get(@Param('id', { schema: idStr }) id: string) {
    return this.svc.get(BigInt(id));
  }

  @Post()
  create(@Body({ schema: warehouseCreateSchema }) body: WarehouseCreateInput) {
    return this.svc.create(body);
  }

  @Patch(':id')
  update(@Param('id', { schema: idStr }) id: string, @Body({ schema: warehouseUpdateSchema }) body: WarehouseUpdateInput) {
    return this.svc.update(BigInt(id), body);
  }
}

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly svc: SuppliersService) {}

  @Get()
  list(@Query({ schema: supplierListQuerySchema }) q: MasterListQuery & { currency?: string }) {
    return this.svc.list(q);
  }

  @Get('options')
  options() {
    return this.svc.options();
  }

  @Get(':id')
  get(@Param('id', { schema: idStr }) id: string) {
    return this.svc.get(BigInt(id));
  }

  @Post()
  create(@Body({ schema: supplierCreateSchema }) body: SupplierCreateInput) {
    return this.svc.create(body);
  }

  @Patch(':id')
  update(@Param('id', { schema: idStr }) id: string, @Body({ schema: supplierUpdateSchema }) body: SupplierUpdateInput) {
    return this.svc.update(BigInt(id), body);
  }
}

@Controller('customers')
export class CustomersController {
  constructor(private readonly svc: CustomersService) {}

  @Get()
  list(@Query({ schema: masterListQuerySchema }) q: MasterListQuery) {
    return this.svc.list(q);
  }

  @Get('options')
  options() {
    return this.svc.options();
  }

  @Get(':id')
  get(@Param('id', { schema: idStr }) id: string) {
    return this.svc.get(BigInt(id));
  }

  @Post()
  create(@Body({ schema: customerCreateSchema }) body: CustomerCreateInput) {
    return this.svc.create(body);
  }

  @Patch(':id')
  update(@Param('id', { schema: idStr }) id: string, @Body({ schema: customerUpdateSchema }) body: CustomerUpdateInput) {
    return this.svc.update(BigInt(id), body);
  }
}
