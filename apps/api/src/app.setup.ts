import type { INestApplication } from '@nestjs/common';

/** Cấu hình dùng chung cho server thật (main.ts) và test e2e. */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableShutdownHooks();
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' });
  return app;
}
