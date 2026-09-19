import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

loadEnv();
const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl) throw new Error('Thiếu TEST_DATABASE_URL trong apps/api/.env');

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Các file test dùng chung một DB thật nên chạy lần lượt
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: {
      DATABASE_URL: testDbUrl,
      SEED_PASSWORD: process.env.SEED_PASSWORD ?? 'Erp@2026',
    },
  },
});
