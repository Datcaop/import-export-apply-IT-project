import { type TestCtx, createTestApp } from './helpers/app.js';

describe('Auth', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.app.close());

  it('keeps /health public', async () => {
    await ctx.http().get('/health').expect(200, { status: 'ok', db: 'up' });
  });

  it('rejects API calls without a token', async () => {
    const res = await ctx.http().get('/api/products').expect(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a wrong password with a clear message', async () => {
    const res = await ctx.http().post('/api/auth/login').send({ username: 'thuha', password: 'sai' }).expect(401);
    expect(res.body.message).toBe('Sai tên đăng nhập hoặc mật khẩu.');
  });

  it('validates the login body', async () => {
    const res = await ctx.http().post('/api/auth/login').send({ username: '' }).expect(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.fieldErrors.username).toBe('Nhập tên đăng nhập');
  });

  it('logs in and returns the current user', async () => {
    const res = await ctx.http().get('/api/auth/me').set(await ctx.auth()).expect(200);
    expect(res.body).toMatchObject({ username: 'thuha', fullName: 'Nguyễn Thu Hà', title: 'Thủ kho Hà Nội' });
  });

  it('refuses a deactivated user', async () => {
    const headers = await ctx.auth('long');
    await ctx.prisma.appUser.update({ where: { username: 'long' }, data: { isActive: false } });
    await ctx.http().get('/api/auth/me').set(headers).expect(401);
    await ctx.http().post('/api/auth/login').send({ username: 'long', password: 'Erp@2026' }).expect(401);
  });
});
