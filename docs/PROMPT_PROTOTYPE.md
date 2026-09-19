# Prompt: Hoàn thiện prototype HTML tĩnh cho ERP Mua hàng – Kho – Bán hàng

> Giải nén `erp-prototype-html.zip` vào gốc repo (được thư mục `erp-prototype-html/`), lưu file này ở `docs/PROMPT_PROTOTYPE.md`, rồi nhắn Claude Code:
> "Đọc docs/PROMPT_PROTOTYPE.md và làm theo."

---

## Vai trò và mục tiêu

Bạn là frontend engineer. Hãy hoàn thiện một **prototype HTML tĩnh** cho hệ thống ERP Mua hàng/Nhập khẩu – Kho – Bán hàng, lưu trong repo local hiện tại.

**Phạm vi:**

- Chỉ HTML + CSS, JavaScript thuần tối thiểu nếu thật cần (ví dụ bật/tắt modal, chuyển tab). **Không** framework, **không** build tool, **không** backend, **không** database.
- Dữ liệu mẫu **viết cứng trong HTML**. Các nút chỉ để minh họa (hoặc dẫn sang trang khác).
- Mở `index.html` bằng trình duyệt là xem được, không cần cài gì.
- Mục đích: chốt giao diện và luồng màn hình, làm cơ sở để sau này code chức năng thật với Next.js + NestJS + PostgreSQL.

## Tài liệu đầu vào

- `erp-prototype-html/`: **10 màn đã làm xong**. Đây là chuẩn giao diện; giữ nguyên phong cách, bố cục, màu, font, cách viết số liệu.
- `docs/DB_DESIGN.md`, `docs/schema.sql`: thiết kế database. Tên trường, trạng thái chứng từ và quy tắc nghiệp vụ trên giao diện phải khớp tài liệu này.

Không tìm thấy các file trên thì dừng lại và hỏi tôi.

## Nơi lưu code

- Làm việc trong `erp-prototype-html/`. Không sửa file ngoài thư mục này, trừ `docs/SCREEN_SPEC.md` ở cuối prompt.
- Repo đã có git thì commit sau mỗi bước (message tiếng Anh, dạng `feat(prototype): ...`). Chưa có git thì `git init`. **Không push.**

## Việc cần làm

### Bước 1: Dọn cấu trúc

- Đổi tên file sang kebab-case và gom theo module, cập nhật mọi link:
  ```
  erp-prototype-html/
    index.html
    assets/styles.css
    assets/app.js            # chỉ nếu cần
    purchase/orders.html, purchase/order-detail.html, purchase/order-new.html,
    purchase/receipts.html, purchase/receipt-detail.html
    sales/orders.html, sales/order-detail.html, sales/issues.html, sales/issue-detail.html
    inventory/balances.html, inventory/stock-card.html, inventory/adjustments.html,
    inventory/adjustment-detail.html, inventory/reconcile.html
    master/products.html, master/warehouses.html, master/suppliers.html,
    master/customers.html, master/currencies.html
  ```
- Các trang hiện dùng inline style. Tách phần lặp lại (sidebar, topbar, card, bảng, nút, badge, ô nhập, thông báo) thành class trong `assets/styles.css`, giữ **y nguyên** hình thức hiện tại.
- Sidebar: mọi mục đều trỏ tới trang thật, mục đang mở được đánh dấu (`aria-current="page"`).

### Bước 2: Làm thêm các màn còn thiếu

| Màn hình | File | Nội dung chính |
|---|---|---|
| Tạo đơn mua | `purchase/order-new.html` | Chọn NCC, tiền tệ (tự lấy tiền tệ mặc định của NCC), tỷ giá gợi ý kèm ghi chú nguồn, bảng dòng hàng có dòng trống để nhập, tổng nguyên tệ và VND |
| Danh sách phiếu nhập | `purchase/receipts.html` | Lọc loại phiếu, kho, trạng thái; cột loại phiếu, PO tham chiếu, kho, ngày, trạng thái |
| Danh sách đơn bán | `sales/orders.html` | Lọc khách, trạng thái; tiến độ xuất |
| Danh sách phiếu xuất | `sales/issues.html` | Lọc kho, trạng thái; SO tham chiếu |
| Danh sách phiếu điều chỉnh | `inventory/adjustments.html` | Lọc kho, lý do, trạng thái |
| Đối soát tồn kho | `inventory/reconcile.html` | Bảng: sản phẩm, kho, tồn hiện tại, tổng sổ cái, kết quả "Khớp" |
| Sản phẩm | `master/products.html` | Danh sách + modal thêm/sửa |
| Kho | `master/warehouses.html` | Danh sách + modal |
| Nhà cung cấp | `master/suppliers.html` | Có cột tiền tệ mặc định |
| Khách hàng | `master/customers.html` | Danh sách + modal |

Dữ liệu mẫu phải **nhất quán với 10 màn sẵn có** (cùng số chứng từ, sản phẩm, số lượng, tỷ giá). Mỗi danh sách có 6–10 dòng với đủ các trạng thái.

### Bước 3: Biến thể trạng thái

Tạo thêm các trang biến thể, liên kết từ một dải tab nhỏ "Trạng thái hiển thị" đặt ở đầu trang gốc (chỉ dành cho prototype):

- Phiếu nhập: nháp (hiện có) / đã ghi sổ (không còn ô nhập, có link sang thẻ kho) / đã hủy
- Phiếu xuất: thiếu tồn (hiện có) / đủ tồn, sẵn sàng ghi sổ / đã ghi sổ / "người khác vừa xuất trước" (thông báo: tồn đã thay đổi lúc ghi sổ, phiếu bị từ chối, không dòng nào bị trừ, kèm số tồn mới)
- Một danh sách mẫu ở trạng thái trống (có câu hướng dẫn và nút tạo mới)

Đặt tên ví dụ `sales/issue-detail--posted.html`, `sales/issue-detail--race.html`.

### Bước 4: Tài liệu

- Cập nhật `erp-prototype-html/README.md`: cách mở, sơ đồ file, kịch bản click demo từng bước.
- Viết `docs/SCREEN_SPEC.md`: với mỗi màn, ghi mục đích, các trường hiển thị/nhập, các nút và điều sẽ xảy ra khi làm thật, các trạng thái, **bảng/cột DB liên quan** (theo `schema.sql`). Tài liệu này là đầu vào để code chức năng thật.

## Quy ước giao diện (giữ theo 10 màn sẵn có)

- Tiếng Việt có dấu; số kiểu Việt Nam (`25.400`, `18,50`), ngày `dd/MM/yyyy`, tiền VND có `₫`; số trong bảng `tabular-nums`.
- Font Be Vietnam Pro (Google Fonts), fallback `'Segoe UI', system-ui, sans-serif`.
- Màu: nền `#EEF1F4`, bề mặt `#FFFFFF`, viền `#D5DCE4`, chữ `#1B2733`, chữ phụ `#566575`, primary `#1D4E89`; module Mua `#2F6FB3`, Kho `#1B7F66`, Bán `#A9502A`; lỗi `#A32016`.
- Không gradient, không emoji; icon SVG dạng nét.
- Accessibility: `<button>`, `<a>`, `<label>` thật; `aria-label` cho nút chỉ có icon; focus ring rõ.
- Thông báo lỗi cụ thể và chỉ cách sửa.

## Cách làm việc

1. Đọc tài liệu và 10 trang sẵn có, gửi tôi kế hoạch ngắn rồi làm luôn.
2. Làm lần lượt Bước 1 → 4, commit sau mỗi bước.
3. Sau mỗi bước, kiểm tra mọi link nội bộ đều trỏ tới file tồn tại (viết một script nhỏ bằng Node hoặc Python để quét).
4. Tôi có thể đang điều khiển từ điện thoại qua Remote Control: báo cáo mỗi bước thật ngắn.

## Tiêu chí hoàn thành

- Mở `index.html` là dùng được, không cần cài đặt; không có link hỏng.
- Đủ 20 màn chính cùng các trang biến thể; sidebar dẫn tới mọi màn.
- Giao diện đồng nhất với 10 màn ban đầu; CSS dùng chung nằm ở `assets/styles.css`.
- Có `README.md` và `docs/SCREEN_SPEC.md`; đã commit local, chưa push.
