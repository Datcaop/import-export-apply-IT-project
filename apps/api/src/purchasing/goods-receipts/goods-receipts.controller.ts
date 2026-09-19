import { Controller, Get, Post, Patch, Param, Body, Query, HttpCode } from '@nestjs/common';
import { GoodsReceiptsService } from './goods-receipts.service.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import type { GoodsReceiptInput, GrCancelInput } from '@erp/shared';

@Controller('goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly grService: GoodsReceiptsService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.grService.list({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      q,
      status,
    });
  }

  @Post()
  create(@Body() input: GoodsReceiptInput, @CurrentUser('id') userId: string) {
    return this.grService.create(input, BigInt(userId));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.grService.get(BigInt(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: GoodsReceiptInput) {
    return this.grService.update(BigInt(id), input);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string, @Body() input: GrCancelInput, @CurrentUser('id') userId: string) {
    return this.grService.cancel(BigInt(id), input, BigInt(userId));
  }

  @Post(':id/post')
  @HttpCode(200)
  post(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.grService.post(BigInt(id), BigInt(userId));
  }
}
