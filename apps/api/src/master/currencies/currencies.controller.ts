import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  type ExchangeRateCreateInput,
  exchangeRateCreateSchema,
  type ExchangeRateUpdateInput,
  exchangeRateUpdateSchema,
  idStr,
  type ListQuery,
  listQuerySchema,
  rateSuggestQuerySchema,
} from '@erp/shared';
import type { AuthUser } from '../../auth/auth.types.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { CurrenciesService } from './currencies.service.js';

@Controller()
export class CurrenciesController {
  constructor(private readonly svc: CurrenciesService) {}

  @Get('currencies')
  list() {
    return this.svc.list();
  }

  @Get('currencies/:code/rates')
  rates(@Param('code') code: string, @Query({ schema: listQuerySchema }) q: ListQuery) {
    return this.svc.rates(code, q);
  }

  @Post('currencies/:code/rates')
  createRate(
    @Param('code') code: string,
    @Body({ schema: exchangeRateCreateSchema }) body: ExchangeRateCreateInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.createRate(code, body, user.id);
  }

  @Patch('exchange-rates/:id')
  updateRate(@Param('id', { schema: idStr }) id: string, @Body({ schema: exchangeRateUpdateSchema }) body: ExchangeRateUpdateInput) {
    return this.svc.updateRate(BigInt(id), body);
  }

  @Get('exchange-rates/suggest')
  suggest(@Query({ schema: rateSuggestQuerySchema }) q: { currency: string; date: string }) {
    return this.svc.suggest(q.currency, q.date);
  }
}
