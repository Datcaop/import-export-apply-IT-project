import { Controller, Get, Post, Patch, Param, Body, Query, HttpCode, ParseIntPipe } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import type { PurchaseOrderInput, PoCancelInput } from '@erp/shared';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.poService.list({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      q,
      status,
    });
  }

  @Post()
  create(@Body() input: PurchaseOrderInput, @CurrentUser('id') userId: string) {
    return this.poService.create(input, BigInt(userId));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.poService.get(BigInt(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: PurchaseOrderInput) {
    return this.poService.update(BigInt(id), input);
  }

  @Post(':id/approve')
  @HttpCode(200)
  approve(@Param('id') id: string) {
    return this.poService.approve(BigInt(id));
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string, @Body() input: PoCancelInput, @CurrentUser('id') userId: string) {
    return this.poService.cancel(BigInt(id), input, BigInt(userId));
  }

  @Post(':id/close')
  @HttpCode(200)
  close(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.poService.close(BigInt(id), BigInt(userId));
  }
}
