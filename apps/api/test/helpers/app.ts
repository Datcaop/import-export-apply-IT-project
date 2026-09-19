import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { seedMaster } from '../../src/seed/seed-master.js';

export interface TestCtx {
  app: INestApplication;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
  /** Header Authorization của người dùng mẫu (mặc định thuha) */
  auth: (username?: string) => Promise<Record<string, string>>;
}

/** Xóa sạch dữ liệu (TRUNCATE không kích hoạt trigger chặn sửa sổ cái). */
export async function truncateAll(prisma: PrismaService) {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = rows.map((r) => `"${r.tablename}"`).join(', ');
  if (list) await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

/** Dựng app Nest trên DB test, dữ liệu sạch + danh mục mẫu. */
export async function createTestApp(): Promise<TestCtx> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = configureApp(moduleRef.createNestApplication({ logger: ['error'] }));
  await app.init();
  const prisma = app.get(PrismaService);
  await truncateAll(prisma);
  await seedMaster(app, process.env.SEED_PASSWORD ?? 'Erp@2026');

  const http = () => request(app.getHttpServer());
  const tokens = new Map<string, string>();
  const auth = async (username = 'thuha') => {
    let token = tokens.get(username);
    if (!token) {
      const res = await http()
        .post('/api/auth/login')
        .send({ username, password: process.env.SEED_PASSWORD ?? 'Erp@2026' })
        .expect(200);
      token = res.body.token as string;
      tokens.set(username, token);
    }
    return { Authorization: `Bearer ${token}` };
  };
  return { app, prisma, http, auth };
}
