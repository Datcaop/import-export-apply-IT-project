import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { SerializeInterceptor } from './common/serialize.interceptor.js';
import { validationPipe } from './common/validation.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { MasterModule } from './master/master.module.js';
import { NumberingModule } from './numbering/numbering.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PurchasingModule } from './purchasing/purchasing.module.js';
import { SalesModule } from './sales/sales.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    NumberingModule,
    UsersModule,
    AuthModule,
    MasterModule,
    InventoryModule,
    PurchasingModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_PIPE, useValue: validationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: SerializeInterceptor },
  ],
})
export class AppModule {}
