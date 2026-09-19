import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  idStr,
  lookupQuerySchema,
  type MasterListQuery,
  masterListQuerySchema,
  type ProductCreateInput,
  productCreateSchema,
  type ProductUpdateInput,
  productUpdateSchema,
} from '@erp/shared';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Get()
  list(@Query({ schema: masterListQuerySchema }) q: MasterListQuery) {
    return this.svc.list(q);
  }

  @Get('lookup')
  lookup(@Query({ schema: lookupQuerySchema }) q: { q?: string; limit: number }) {
    return this.svc.lookup(q);
  }

  @Get(':id')
  get(@Param('id', { schema: idStr }) id: string) {
    return this.svc.get(BigInt(id));
  }

  @Post()
  create(@Body({ schema: productCreateSchema }) body: ProductCreateInput) {
    return this.svc.create(body);
  }

  @Patch(':id')
  update(@Param('id', { schema: idStr }) id: string, @Body({ schema: productUpdateSchema }) body: ProductUpdateInput) {
    return this.svc.update(BigInt(id), body);
  }
}
