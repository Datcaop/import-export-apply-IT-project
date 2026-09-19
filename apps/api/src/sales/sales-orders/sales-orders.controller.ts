import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service.js';
import type { SalesOrderInput } from '@erp/shared';
import { CurrentUser } from '../../auth/current-user.decorator.js';

@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly soService: SalesOrdersService) {}

  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '20', @Query('q') q?: string, @Query('status') status?: string) {
    return this.soService.list({ page: parseInt(page, 10), pageSize: parseInt(pageSize, 10), q, status });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.soService.get(BigInt(id));
  }

  @Post()
  create(@Body() input: SalesOrderInput, @CurrentUser('id') userId: string) {
    return this.soService.create(input, BigInt(userId));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: SalesOrderInput) {
    return this.soService.update(BigInt(id), input);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.soService.approve(BigInt(id));
  }
}
