import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('AppController', () => {
  let appController: AppController;
  const queryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }]);

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: { $queryRaw: queryRaw } }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('reports the database as up', async () => {
    await expect(appController.health()).resolves.toEqual({ status: 'ok', db: 'up' });
    expect(queryRaw).toHaveBeenCalled();
  });
});
