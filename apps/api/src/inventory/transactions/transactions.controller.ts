import { Controller, Get, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';

@Controller('inventory-transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('q') q?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.transactionsService.list({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      q,
      warehouseId,
      productId,
    });
  }
}
