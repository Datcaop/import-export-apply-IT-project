# HỆ THỐNG QUẢN TRỊ ERP (PURCHASING, SALES & INVENTORY MANAGEMENT)

Hệ thống quản lý doanh nghiệp ERP toàn diện bao gồm các phân hệ: **Danh mục Master Data**, **Quản lý Mua hàng (Purchasing)**, **Quản lý Bán hàng (Sales)** và **Quản lý Tồn kho (Inventory)**.

---

## 🛠 Kiến trúc & Công nghệ

Dự án được xây dựng theo mô hình **Monorepo** (pnpm workspaces):

| Thành phần | Công nghệ / Stack | Cổng (Port) |
| :--- | :--- | :--- |
| **Frontend Web** | Next.js 16 (App Router, Turbopack, Vanilla CSS) | `http://localhost:3000` |
| **Backend API** | NestJS 11 + Prisma ORM 7 + JWT Auth | `http://localhost:3001` |
| **Database** | PostgreSQL 17 (qua Docker Compose) | `localhost:5432` |
| **Shared Lib** | `@erp/shared` (DTO, Validation Schema Zod, Tính toán Decimal.js) | - |

---

## 🔑 Tài khoản đăng nhập mẫu

Sau khi chạy lệnh seed dữ liệu, người chấm / thầy cô có thể đăng nhập bằng tài khoản Quản trị hệ thống:

- **Trang đăng nhập**: `http://localhost:3000/login`
- **Email**: `admin@erp.local`
- **Mật khẩu**: `123456`

---

## 📋 Yêu cầu môi trường

Trước khi cài đặt, vui lòng đảm bảo máy tính đã cài đặt:
1. **Node.js** >= 20.x
2. **pnpm** >= 9.x (`npm i -g pnpm`)
3. **Docker & Docker Desktop** (dùng để khởi động PostgreSQL)

---

## 🚀 Hướng dẫn Cài đặt và Chạy Dự án (Dành cho Người chấm)

Vui lòng thực hiện theo các bước dưới đây để chạy hệ thống từ đầu:

### Bước 1: Clone repo và Cài đặt dependencies

```bash
git clone https://github.com/Datcaop/import-export-apply-IT-project.git
cd import-export-apply-IT-project
pnpm install
```

### Bước 2: Khởi tạo các file cấu hình môi trường (.env)

Tạo file `.env` cho Root, API và Web từ các file mẫu:

```bash
# Windows PowerShell
copy .env.example .env
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local

# Hoặc trên Bash / Linux / macOS:
# cp .env.example .env
# cp apps/api/.env.example apps/api/.env
# cp apps/web/.env.example apps/web/.env.local
```

### Bước 3: Khởi động Cơ sở dữ liệu (PostgreSQL)

Yêu cầu Docker Desktop đang chạy. Khởi động PostgreSQL container:

```bash
pnpm db:up
```

*Lưu ý: Chờ khoảng 5-10 giây để PostgreSQL khởi động hoàn tất.*

### Bước 4: Khởi tạo Database Schema và Seed Dữ liệu mẫu

Chạy lệnh migration để tạo toàn bộ bảng database và chạy seed dữ liệu thử nghiệm:

```bash
pnpm db:migrate
pnpm db:seed
```

### Bước 5: Chạy hệ thống (Dev mode)

Khởi động đồng thời cả Backend API và Frontend Web:

```bash
pnpm dev
```

Sau khi chạy thành công:
- Truy cập giao diện ứng dụng: **`http://localhost:3000`**
- Kiểm tra kết nối Backend API: **`http://localhost:3001/api/health`** (Trả về `{"status":"ok","db":"up"}`)

---

## ⭐ Các phân hệ và Luồng nghiệp vụ chính

1. **Quản lý Danh mục (Master Data)** (`/master`):
   - Quản lý Tiền tệ (`/master/currencies`), Sản phẩm & Đơn vị tính (`/master/products`), Kho hàng (`/master/warehouses`), Nhà cung cấp (`/master/suppliers`), Khách hàng (`/master/customers`).

2. **Quản lý Mua hàng (Purchasing)** (`/purchase`):
   - Tạo & Duyệt Đơn mua hàng PO (`/purchase/orders`).
   - Lập Phiếu nhập kho GR (`/purchase/receipts`) từ PO.
   - Khi Ghi sổ Phiếu nhập kho: Tự động cộng tồn kho (`qtyOnHand`) và cập nhật giá vốn bình quân tức thời (`avgCost`).

3. **Quản lý Bán hàng (Sales)** (`/sales`):
   - Tạo & Duyệt Đơn bán hàng SO (`/sales/orders`).
   - Lập Phiếu xuất kho GI (`/sales/issues`) từ SO đã chốt.
   - Khi Ghi sổ Phiếu xuất kho: Tự động trừ tồn kho, tính giá vốn xuất hàng và tạo giao dịch thẻ kho.

4. **Quản lý Tồn kho (Inventory)** (`/inventory`):
   - Báo cáo tồn kho hiện tại (`/inventory/balances`): Xem số lượng tồn kho và giá vốn của từng mặt hàng tại từng kho.
   - Thẻ kho / Lịch sử giao dịch (`/inventory/transactions`): Theo dõi chi tiết biến động cộng/trừ kho theo thời gian thực.

---

## 🛠 Các lệnh Utility hữu ích

| Lệnh | Chức năng |
| :--- | :--- |
| `pnpm dev` | Chạy ứng dụng ở chế độ Development (Web + API) |
| `pnpm build` | Biên dịch toàn bộ dự án (Shared + API + Web) |
| `pnpm db:seed` | Khôi phục và nạp lại dữ liệu seed mẫu |
| `pnpm db:studio` | Mở giao diện trực quan Prisma Studio quản lý dữ liệu DB |
| `pnpm db:down` | Dừng và tắt container PostgreSQL |
