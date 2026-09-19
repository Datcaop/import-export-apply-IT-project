import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { GoodsIssuesService } from './goods-issues.service.js';
import type { GoodsIssueInput } from '@erp/shared';
import { CurrentUser } from '../../auth/current-user.decorator.js';

@Controller('goods-issues')
export class GoodsIssuesController {
  constructor(private readonly giService: GoodsIssuesService) {}

  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '20', @Query('q') q?: string, @Query('status') status?: string) {
    return this.giService.list({ page: parseInt(page, 10), pageSize: parseInt(pageSize, 10), q, status });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.giService.get(BigInt(id));
  }

  @Post()
  create(@Body() input: GoodsIssueInput, @CurrentUser('id') userId: string) {
    return this.giService.create(input, BigInt(userId));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: GoodsIssueInput) {
    return this.giService.update(BigInt(id), input);
  }

  @Post(':id/post')
  post(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.giService.post(BigInt(id), BigInt(userId));
  }
}
