# ERP IT

Monorepo (pnpm workspaces):

| Path       | Stack                                  | Port |
| ---------- | -------------------------------------- | ---- |
| `apps/api` | NestJS 12 + Prisma 7 (adapter `pg`)    | 3001 |
| `apps/web` | Next.js 16 (App Router, Tailwind v4)   | 3000 |
| DB         | PostgreSQL 17 (`docker-compose.yml`)   | 5432 |

## Khởi động

```bash
pnpm install
cp .env.example .env                              # biến cho docker-compose
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

pnpm db:up         # chạy Postgres
pnpm db:migrate    # áp dụng migration + tạo migration mới
pnpm dev           # chạy api + web song song
```

Kiểm tra: http://localhost:3001/health → `{"status":"ok","db":"up"}`

## Prisma

- Schema: `apps/api/prisma/schema.prisma`, config: `apps/api/prisma.config.ts`
- Client được generate vào `apps/api/src/generated/prisma` (đã gitignore; tự chạy khi `pnpm install` / `build`)
- Dùng trong NestJS: inject `PrismaService` (module `PrismaModule` là global)

| Script             | Việc làm                  |
| ------------------ | ------------------------- |
| `pnpm db:migrate`  | `prisma migrate dev`      |
| `pnpm db:generate` | `prisma generate`         |
| `pnpm db:studio`   | Mở Prisma Studio          |
| `pnpm db:down`     | Dừng Postgres             |

## Prototype giao diện (HTML tĩnh)

Thư mục `erp-prototype-html/`: 20 màn chính và 6 trang biến thể trạng thái, không cần cài đặt.

```bash
pnpm prototype          # http://localhost:5500/
pnpm prototype:check    # kiểm tra link nội bộ
```

Hoặc bấm đúp `erp-prototype-html/index.html`. Đặc tả màn hình: `docs/SCREEN_SPEC.md`, schema: `docs/schema.sql`.
