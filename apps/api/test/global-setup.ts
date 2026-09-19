// Tạo DB erp_test (nếu chưa có) và áp mọi migration trước khi chạy test e2e.
import { execSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

export default async function setup() {
  loadEnv();
  const url = new URL(process.env.TEST_DATABASE_URL!);
  const dbName = url.pathname.slice(1);
  if (!/^[a-z0-9_]+$/.test(dbName) || !dbName.includes('test')) {
    throw new Error(`TEST_DATABASE_URL phải trỏ tới DB test (tên có chữ "test"), đang là "${dbName}"`);
  }

  const admin = new URL(url);
  admin.pathname = '/postgres';
  admin.search = '';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE ${dbName}`);
  await client.end();

  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url.toString() },
  });
}
