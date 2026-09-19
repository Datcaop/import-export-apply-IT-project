import { Controller, Get, Query } from '@nestjs/common';
import { BalancesService } from './balances.service.js';

@Controller('inventory-balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('q') q?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.balancesService.list({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      q,
      warehouseId,
    });
  }
}
