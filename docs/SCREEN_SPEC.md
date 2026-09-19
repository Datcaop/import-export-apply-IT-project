# Đặc tả màn hình – ERP Mua hàng/Nhập khẩu – Kho – Bán hàng

Tài liệu này mô tả từng màn trong prototype `erp-prototype-html/` để làm đầu vào code chức năng thật (Next.js + NestJS + PostgreSQL).
Tên bảng/cột lấy theo [`docs/schema.sql`](schema.sql). Chưa có `DB_DESIGN.md`, nên quy tắc nghiệp vụ dưới đây suy ra từ comment trong `schema.sql` và từ prototype; chỗ nào schema chưa đáp ứng được ghi ở mục [Khoảng trống giữa giao diện và schema](#khoảng-trống-giữa-giao-diện-và-schema).

## Quy ước chung

| Nội dung | Quy ước |
|---|---|
| Tiền tệ gốc | VND (`currency.is_base = true`). Mọi cột `*_base` là VND. |
| Hiển thị số | Kiểu Việt Nam: `25.400`, `18,50`. Số lượng lưu `NUMERIC(18,4)`, tiền `NUMERIC(19,4)`, tỷ giá `NUMERIC(18,6)`; giao diện làm tròn theo `currency.decimals` (VND 0, ngoại tệ 2). |
| Ngày | `dd/MM/yyyy`, thời điểm `dd/MM/yyyy HH:mm` theo giờ Việt Nam; DB lưu `DATE` / `TIMESTAMPTZ`. |
| Đơn vị tính | `product.uom` lưu mã (`PCS`, `BOX`, `SET`, `KG`, `M`), giao diện hiển thị tên (`Cái`, `Hộp`...). |
| Số chứng từ | `PO-yyyy-nnnn`, `GR-…`, `SO-…`, `GI-…`, `ADJ-…`; cấp tự động khi lưu lần đầu, duy nhất (`*_no UNIQUE`). |
| Chứng từ kho | Trạng thái `DRAFT → POSTED` hoặc `DRAFT → CANCELLED`. `POSTED` là bất biến; sửa sai bằng phiếu điều chỉnh hoặc phiếu đảo. |
| Sổ cái kho | `inventory_transaction` chỉ ghi thêm (trigger chặn UPDATE/DELETE). Mỗi dòng chứng từ sinh đúng 1 bút toán (`uq_inv_txn_ref_line`). |
| Tỷ giá | `exchange_rate` chỉ để **gợi ý**. Mỗi chứng từ tự lưu tỷ giá của nó (`purchase_order.exchange_rate`, `goods_receipt.exchange_rate`, `sales_order.exchange_rate`). |

### Nhãn trạng thái

| Giá trị DB | Nhãn | Kiểu badge |
|---|---|---|
| `DRAFT` | Nháp | xám |
| `APPROVED` (PO) | Đã duyệt | xanh dương |
| `PARTIALLY_RECEIVED` (PO) | Nhận một phần | vàng |
| `RECEIVED` (PO) | Đã nhận đủ | xanh lá |
| `CONFIRMED` (SO) | Đã xác nhận | xanh dương |
| `PARTIALLY_ISSUED` (SO) | Xuất một phần | vàng |
| `ISSUED` (SO) | Đã xuất đủ | xanh lá |
| `POSTED` (GR, GI, ADJ) | Đã ghi sổ | xanh lá |
| `CLOSED` | Đã đóng | xám nhạt |
| `CANCELLED` | Đã hủy | xám nhạt |
| `is_active = true / false` | Đang dùng / Ngừng dùng | xanh lá / xám nhạt |

### Loại phiếu nhập (`goods_receipt.receipt_type`) và lý do điều chỉnh (`inventory_adjustment.reason`)

| `receipt_type` | Nhãn | Ràng buộc |
|---|---|---|
| `PURCHASE` | Nhập mua hàng (theo PO) | `po_id` bắt buộc (`ck_gr_po_required`) |
| `NON_PO` | Nhập ngoài PO | `po_id` phải NULL |
| `OPENING` | Tồn đầu kỳ | `po_id` phải NULL |
| `CUSTOMER_RETURN` | Khách trả hàng | `po_id` phải NULL |

| `reason` (đề xuất) | Nhãn |
|---|---|
| `STOCKTAKE` | Kiểm kê định kỳ |
| `DAMAGED` | Hàng hư hỏng |
| `LOST` | Mất mát |
| `OTHER` | Khác |

### Loại bút toán kho (`inventory_transaction.txn_type`) hiển thị trên thẻ kho

| `txn_type` | Nhãn | `ref_type` |
|---|---|---|
| `RECEIPT` | Nhập mua / Nhập khác | `GR` |
| `ISSUE` | Xuất bán | `GI` |
| `ADJUST_IN` / `ADJUST_OUT` | Điều chỉnh tăng / giảm | `ADJ` |
| `TRANSFER_IN` / `TRANSFER_OUT` | Chuyển kho đến / đi (chưa có màn) | `TRF` |
| `REVERSAL` | Bút toán đảo | theo chứng từ gốc |

---

## Danh sách màn hình

| # | Màn | File prototype | Module |
|---|---|---|---|
| 1 | Tổng quan | `index.html` | Chung |
| 2 | Danh sách đơn mua | `purchase/orders.html` | Mua hàng |
| 3 | Tạo đơn mua | `purchase/order-new.html` | Mua hàng |
| 4 | Chi tiết đơn mua | `purchase/order-detail.html` | Mua hàng |
| 5 | Danh sách phiếu nhập | `purchase/receipts.html` (+ `--empty`) | Mua hàng |
| 6 | Phiếu nhập kho | `purchase/receipt-detail.html` (+ `--posted`, `--cancelled`) | Mua hàng |
| 7 | Danh sách đơn bán | `sales/orders.html` | Bán hàng |
| 8 | Chi tiết đơn bán | `sales/order-detail.html` | Bán hàng |
| 9 | Danh sách phiếu xuất | `sales/issues.html` | Bán hàng |
| 10 | Phiếu xuất kho | `sales/issue-detail.html` (+ `--ready`, `--posted`, `--race`) | Bán hàng |
| 11 | Tồn kho hiện tại | `inventory/balances.html` | Kho |
| 12 | Thẻ kho | `inventory/stock-card.html` | Kho |
| 13 | Danh sách phiếu điều chỉnh | `inventory/adjustments.html` | Kho |
| 14 | Phiếu kiểm kê, điều chỉnh | `inventory/adjustment-detail.html` | Kho |
| 15 | Đối soát tồn kho | `inventory/reconcile.html` | Kho |
| 16 | Sản phẩm | `master/products.html` | Danh mục |
| 17 | Kho hàng | `master/warehouses.html` | Danh mục |
| 18 | Nhà cung cấp | `master/suppliers.html` | Danh mục |
| 19 | Khách hàng | `master/customers.html` | Danh mục |
| 20 | Tiền tệ và tỷ giá | `master/currencies.html` | Danh mục |

Các màn danh sách có chung: ô tìm kiếm, bộ lọc, nút **Lọc**, phân trang **Trang trước / Trang sau** kèm "Hiển thị x–y trong N". Khi làm thật: lọc và phân trang phía server, giữ tham số lọc trên URL để chia sẻ link được.

---

## 1. Tổng quan – `index.html`

**Mục đích:** nhìn nhanh tình hình kho và các chứng từ đang chờ xử lý.

**Hiển thị**

| Khối | Nội dung | Nguồn dữ liệu |
|---|---|---|
| Giá trị tồn kho | Tổng `qty_on_hand × avg_cost`, số kho và số mã có tồn | `inventory_balance` |
| Đơn mua chờ nhận hàng | Số PO `APPROVED` + `PARTIALLY_RECEIVED`, trong đó số đã nhận một phần | `purchase_order.status` |
| Đơn bán chờ xuất kho | Số SO `CONFIRMED` + `PARTIALLY_ISSUED` | `sales_order.status` |
| Chứng từ nháp chưa ghi sổ | Đếm `DRAFT` theo loại phiếu | `goods_receipt`, `goods_issue`, `inventory_adjustment` |
| Bảng Đơn mua chờ nhận | Số PO, NCC, dự kiến về, tiến độ `SUM(qty_received)/SUM(qty_ordered)` | `purchase_order`, `supplier`, `purchase_order_item` |
| Bảng Đơn bán chờ xuất | Số SO, khách, ngày đặt, tiến độ `SUM(qty_issued)/SUM(qty_ordered)` | `sales_order`, `customer`, `sales_order_item` |
| Biến động kho gần đây | Thời gian, chứng từ, sản phẩm, kho, số lượng có dấu, tồn sau | `inventory_transaction` (`txn_at DESC`, dùng `ix_inv_txn_time`) |

**Hành động:** "Xem tất cả" dẫn tới danh sách đơn mua, đơn bán; "Mở thẻ kho" dẫn tới thẻ kho; số chứng từ dẫn tới chi tiết.

---

## 2. Danh sách đơn mua – `purchase/orders.html`

**Mục đích:** tra cứu và theo dõi tiến độ nhận hàng của đơn mua.

**Bộ lọc:** tìm theo số PO hoặc mã hàng (`po_no`, `product.sku` qua `purchase_order_item`), nhà cung cấp (`supplier_id`), trạng thái (`status`), tháng đặt (`order_date`).

**Cột:** Số PO (`po_no`), Nhà cung cấp (`supplier.name`), Ngày đặt (`order_date`), Tiền tệ (`currency_code`), Tổng nguyên tệ (`total_amount`), Tổng quy đổi (`total_amount_base`), Tiến độ nhận (tổng `qty_received` / tổng `qty_ordered`), Trạng thái.

**Hành động:** **Tạo đơn mua** → màn 3. **Xuất Excel** xuất theo bộ lọc hiện tại. Bấm số PO → màn 4.

**Trạng thái mẫu có trên màn:** Nháp, Đã duyệt, Nhận một phần, Đã nhận đủ, Đã đóng, Đã hủy.

---

## 3. Tạo đơn mua – `purchase/order-new.html`

**Mục đích:** lập PO mới cho nhà cung cấp trong nước hoặc nhập khẩu.

| Trường | Bắt buộc | Cột DB | Quy tắc |
|---|---|---|---|
| Nhà cung cấp | Có | `purchase_order.supplier_id` | Chỉ NCC `is_active`. |
| Tiền tệ | Có | `currency_code` | Tự điền `supplier.default_currency` khi chọn NCC; người dùng đổi được. NCC chưa có tiền tệ mặc định thì để trống và bắt chọn. |
| Tỷ giá | Có | `exchange_rate` | Gợi ý: bản ghi `exchange_rate` mới nhất của tiền tệ đó có `rate_date ≤ order_date`; hiện nguồn (`source`) và ngày dưới ô. VND thì cố định 1 và khóa ô. Phải > 0. |
| Ngày đặt | Có | `order_date` | Mặc định hôm nay. |
| Dự kiến về | Không | `expected_date` | ≥ ngày đặt. |
| Số đơn mua | Tự cấp | `po_no` | Chỉ đọc. |
| Ghi chú | Không | `note` | |
| Dòng hàng: sản phẩm | Có | `purchase_order_item.product_id` | Chỉ sản phẩm `is_active`; `line_no` tăng dần. |
| Dòng hàng: SL đặt | Có | `qty_ordered` | > 0. |
| Dòng hàng: đơn giá | Có | `unit_price` (nguyên tệ) | ≥ 0. |
| Thành tiền, quy đổi | Tính | `line_amount` (cột generated), quy đổi = `line_amount × exchange_rate` | Chỉ hiển thị. |
| Tổng | Tính | `total_amount`, `total_amount_base` | Lưu lại khi lưu đơn. |

**Hành động**

| Nút | Khi làm thật |
|---|---|
| Thêm dòng / biểu tượng thùng rác | Thêm, xóa dòng trên form. Dòng trống bị bỏ qua khi lưu. |
| Hủy | Bỏ thay đổi, về danh sách (hỏi xác nhận nếu đã nhập). |
| Lưu nháp | Tạo `purchase_order` `DRAFT` và các `purchase_order_item` trong 1 transaction. |
| Lưu và duyệt | Như Lưu nháp rồi chuyển `APPROVED`; từ đây tỷ giá và đơn giá bị khóa. Chuyển sang màn 4. |

**Lỗi cần báo:** "Chọn nhà cung cấp", "Tỷ giá phải lớn hơn 0", "Dòng 2: số lượng phải lớn hơn 0", "Cần ít nhất 1 dòng hàng".

---

## 4. Chi tiết đơn mua – `purchase/order-detail.html`

**Mục đích:** xem PO, tiến độ nhận hàng và các phiếu nhập liên quan.

**Hiển thị:** NCC, ngày đặt, dự kiến về, người lập (`created_by`), tiền tệ, tỷ giá chốt (`exchange_rate`), nguồn tỷ giá, điều khoản. Bảng dòng hàng: #, mã, tên, ĐVT, SL đặt (`qty_ordered`), đã nhận (`qty_received`), còn lại (`qty_ordered − qty_received`), đơn giá, thành tiền (`line_amount`), quy đổi. Bảng phiếu nhập của đơn: `goods_receipt` có `po_id` = đơn này (số phiếu, ngày, kho, tỷ giá ngày nhập, tổng SL, trạng thái).

**Hành động**

| Nút | Điều kiện | Khi làm thật |
|---|---|---|
| Tạo phiếu nhập | `APPROVED` hoặc `PARTIALLY_RECEIVED` | Tạo `goods_receipt` `DRAFT`, loại `PURCHASE`, lấy các dòng còn phải nhận (`po_item_id`), gợi ý tỷ giá ngày nhập. |
| Hủy đơn | `DRAFT` hoặc `APPROVED` và chưa có phiếu nhập `POSTED` | `status = CANCELLED`. |
| In đơn | Mọi trạng thái | Xuất PDF. |

**Chuyển trạng thái tự động** (khi ghi sổ phiếu nhập): còn dòng chưa nhận đủ → `PARTIALLY_RECEIVED`; tất cả dòng đủ → `RECEIVED`. Đóng đơn thiếu (`CLOSED`) là thao tác tay khi NCC không giao nốt.

---

## 5. Danh sách phiếu nhập – `purchase/receipts.html`

**Mục đích:** tra cứu mọi phiếu nhập kho, gồm cả nhập ngoài PO, tồn đầu kỳ, khách trả hàng.

**Bộ lọc:** tìm theo số phiếu, số PO, đối tác; loại phiếu (`receipt_type`); kho (`warehouse_id`); trạng thái (`status`).

**Cột:** Số phiếu (`gr_no`), Loại phiếu, PO tham chiếu (`po_id → po_no`, "—" nếu không có), Nhà cung cấp / đối tác (`supplier.name`), Kho, Ngày nhập (`receipt_date`), Số dòng, Tổng SL (`SUM(goods_receipt_item.qty)`), Trạng thái.

**Hành động:** **Tạo phiếu nhập** mở phiếu mới (chọn loại phiếu trước). Bấm số phiếu → màn 6.

**Trạng thái màn**

| Biến thể | File | Nội dung |
|---|---|---|
| Có dữ liệu | `receipts.html` | 8 phiếu đủ 4 loại và 3 trạng thái. |
| Trống | `receipts--empty.html` | Câu hướng dẫn cách tạo phiếu (từ đơn mua hoặc tạo trực tiếp) và nút tạo mới. Khi làm thật: dùng câu khác cho trường hợp "lọc không ra kết quả" (gợi ý xóa bộ lọc). |

---

## 6. Phiếu nhập kho – `purchase/receipt-detail.html`

**Mục đích:** ghi nhận hàng thực nhận vào kho và giá nhập kho theo tỷ giá ngày nhập.

**Trường (trạng thái Nháp)**

| Trường | Cột DB | Quy tắc |
|---|---|---|
| Loại phiếu nhập | `goods_receipt.receipt_type` | Đổi loại thì ẩn/hiện ô Đơn mua. |
| Đơn mua | `po_id` | Bắt buộc với `PURCHASE`; chỉ PO `APPROVED`/`PARTIALLY_RECEIVED`. |
| Nhà cung cấp | `supplier_id` | Lấy theo PO (chỉ đọc); với `NON_PO` chọn tay. |
| Nhập vào kho | `warehouse_id` | Chỉ kho `is_active`. |
| Ngày nhập | `receipt_date` | |
| Tiền tệ | `currency_code` | Theo PO (chỉ đọc). |
| Tỷ giá ngày nhập | `exchange_rate` | Gợi ý từ `exchange_rate` ngày nhập, hiện kèm tỷ giá trên PO để so sánh. |
| Ghi chú | `note` | Số tờ khai, số lô… |
| Dòng: còn phải nhận | `purchase_order_item.qty_ordered − qty_received` | Chỉ đọc. |
| Dòng: SL thực nhận | `goods_receipt_item.qty` | > 0 để được ghi; không vượt số còn phải nhận (`ck_po_item_not_over_received`). Dòng 0 bị bỏ khi ghi sổ. |
| Dòng: đơn giá | `unit_cost` (nguyên tệ) | Lấy từ `purchase_order_item.unit_price`. |
| Dòng: giá nhập kho | `unit_cost_base` = `unit_cost × exchange_rate`, làm tròn | Chỉ đọc. |

**Hành động**

| Nút | Khi làm thật |
|---|---|
| Lưu nháp | Lưu header + dòng, giữ `DRAFT`. |
| Hủy phiếu | Chỉ khi `DRAFT`: `status = CANCELLED`. Không đụng tồn kho. |
| Ghi sổ | Một transaction: (1) khóa `goods_receipt` và kiểm tra còn `DRAFT`; (2) với mỗi dòng: khóa `inventory_balance (product_id, warehouse_id)` bằng `SELECT … FOR UPDATE` (tạo dòng nếu chưa có), cộng `qty_on_hand`, tính lại `avg_cost` bình quân gia quyền, ghi `inventory_transaction` `RECEIPT` (`ref_type = 'GR'`, `ref_line_id` = id dòng, `qty_after`, `unit_cost_base`); (3) cộng `purchase_order_item.qty_received` và cập nhật `purchase_order.status`; (4) `status = POSTED`, `posted_at`, `posted_by`. Lỗi ở bất kỳ bước nào thì rollback toàn bộ. |

**Trạng thái màn**

| Biến thể | File | Khác biệt |
|---|---|---|
| Nháp | `receipt-detail.html` | Form nhập được, có Lưu nháp / Hủy phiếu / Ghi sổ. |
| Đã ghi sổ | `receipt-detail--posted.html` | Không còn ô nhập; hiện thời điểm và người ghi sổ, tồn sau ghi sổ, link sang thẻ kho; nút Lập phiếu điều chỉnh thay cho sửa. |
| Đã hủy | `receipt-detail--cancelled.html` | Chỉ đọc, thông báo không có biến động kho, nút Sao chép thành phiếu mới. |

---

## 7. Danh sách đơn bán – `sales/orders.html`

**Mục đích:** theo dõi đơn bán và tiến độ xuất kho.

**Bộ lọc:** tìm theo số SO hoặc mã hàng, khách hàng (`customer_id`), trạng thái, tháng đặt.

**Cột:** Số SO (`so_no`), Khách hàng, Ngày đặt, Tiền tệ, Tổng nguyên tệ (`total_amount`), Tổng quy đổi (`total_amount_base`), Tiến độ xuất (`SUM(qty_issued)/SUM(qty_ordered)`), Trạng thái.

**Hành động:** **Tạo đơn bán** (chưa có màn riêng; prototype dẫn tới chi tiết đơn bán), bấm số SO → màn 8.

---

## 8. Chi tiết đơn bán – `sales/order-detail.html`

**Mục đích:** xem SO, tiến độ xuất từng dòng và các lần xuất kho.

**Hiển thị:** khách hàng, ngày đặt, tiền tệ, nhân viên bán, địa chỉ giao, kho xuất mặc định, thanh toán, ghi chú (xem mục khoảng trống: nhiều trường chưa có trong schema). Dòng hàng: mã, tên, SL đặt (`qty_ordered`), đã xuất (`qty_issued`, thanh tiến độ), đơn giá, thành tiền (`line_amount`). Các lần xuất kho: `goods_issue` có `so_id` = đơn này.

**Hành động**

| Nút | Điều kiện | Khi làm thật |
|---|---|---|
| Tạo phiếu xuất | `CONFIRMED` hoặc `PARTIALLY_ISSUED` | Tạo `goods_issue` `DRAFT` với các dòng còn phải giao (`so_item_id`), kho mặc định. |
| Hủy đơn | Chưa có phiếu xuất `POSTED` | `CANCELLED`. |
| In đơn | | PDF. |

**Chuyển trạng thái tự động** khi ghi sổ phiếu xuất: `PARTIALLY_ISSUED` / `ISSUED`. `CLOSED` là đóng tay khi khách không lấy nốt.

---

## 9. Danh sách phiếu xuất – `sales/issues.html`

**Mục đích:** tra cứu phiếu xuất kho.

**Bộ lọc:** tìm theo số phiếu, số SO, khách; kho; trạng thái.

**Cột:** Số phiếu (`gi_no`), SO tham chiếu (`so_id → so_no`), Khách hàng (qua `sales_order.customer_id`), Kho, Ngày xuất (`issue_date`), Tổng SL (`SUM(goods_issue_item.qty)`), Trạng thái.

**Hành động:** **Chọn đơn bán để xuất** dẫn tới danh sách đơn bán (phiếu xuất luôn tạo từ SO).

---

## 10. Phiếu xuất kho – `sales/issue-detail.html`

**Mục đích:** xuất hàng cho đơn bán, chặn xuất âm kho kể cả khi nhiều người thao tác cùng lúc.

**Trường:** Đơn bán, Khách hàng (chỉ đọc), Xuất từ kho (`warehouse_id`), Ngày xuất (`issue_date`). Dòng: mã, tên, còn phải giao (`qty_ordered − qty_issued`), tồn tại kho (`inventory_balance.qty_on_hand` lúc mở phiếu), SL xuất (`goods_issue_item.qty`), cột Kiểm tra (Đủ hàng / Không đủ tồn).

**Kiểm tra trên form:** SL xuất ≤ còn phải giao (`ck_so_item_not_over_issued`) và ≤ tồn. Dòng thiếu tồn: viền đỏ, dòng lỗi dưới ô ("Thiếu 4, kho chỉ còn 6"), thông báo đầu trang chỉ cách sửa, nút Ghi sổ bị khóa.

**Ghi sổ (khi làm thật):** một transaction; khóa các dòng `inventory_balance` liên quan theo thứ tự cố định `(product_id, warehouse_id)` để tránh deadlock; kiểm tra lại tồn; nếu **bất kỳ** dòng nào thiếu thì rollback toàn bộ và trả lỗi kèm tồn mới của từng dòng; nếu đủ: trừ `qty_on_hand`, ghi `inventory_transaction` `ISSUE` với `unit_cost_base = avg_cost` hiện tại, lưu `goods_issue_item.unit_cost_base`, cộng `sales_order_item.qty_issued`, cập nhật `sales_order.status`, đặt `POSTED`, `posted_at`, `posted_by`. `ck_inventory_non_negative` là lớp chặn cuối cùng.

**Trạng thái màn**

| Biến thể | File | Nội dung |
|---|---|---|
| Thiếu tồn | `issue-detail.html` | MN-24F xuất 10 nhưng kho còn 6; Ghi sổ bị khóa. |
| Đủ tồn, sẵn sàng ghi sổ | `issue-detail--ready.html` | Đã giảm MN-24F còn 6; mọi dòng Đủ hàng; Ghi sổ bật. |
| Đã ghi sổ | `issue-detail--posted.html` | Chỉ đọc; giá vốn từng dòng, tồn sau ghi sổ, link thẻ kho; SO còn 4 chưa giao. |
| Người khác vừa xuất trước | `issue-detail--race.html` | Ghi sổ bị từ chối: tồn MN-24F đã giảm còn 1 do GI-2026-0465 ghi sổ trước. Hiện cả "tồn lúc mở phiếu" và "tồn hiện tại", nói rõ không dòng nào bị trừ, phiếu vẫn Nháp, và chỉ cách sửa. Có nút Tải lại số tồn. |

---

## 11. Tồn kho hiện tại – `inventory/balances.html`

**Mục đích:** xem tồn theo từng cặp sản phẩm, kho.

**Bộ lọc:** tìm sản phẩm (`sku`, `name`), kho, tình trạng (còn hàng `qty_on_hand > 0` / hết hàng `= 0`).

**Cột:** Mã hàng, Tên hàng, Kho, Tồn (`qty_on_hand`; 0 hiện badge Hết hàng), ĐVT (`uom`), Giá vốn BQ (`avg_cost`), Giá trị tồn (`qty_on_hand × avg_cost`), Cập nhật lần cuối (`inventory_balance.updated_at`), link Thẻ kho.

**Hành động:** Xuất Excel, **Đối soát** (màn 15), **Lập phiếu kiểm kê** (màn 14).

---

## 12. Thẻ kho – `inventory/stock-card.html`

**Mục đích:** xem mọi biến động của 1 sản phẩm tại 1 kho trong khoảng thời gian.

**Bộ lọc:** sản phẩm, kho, từ ngày, đến ngày.

**Hiển thị:**
- Thẻ tổng: tồn đầu kỳ (`SUM(qty_change)` trước từ-ngày), nhập trong kỳ, xuất trong kỳ, điều chỉnh, tồn cuối kỳ; dòng ghi chú so với `inventory_balance.qty_on_hand`.
- Bảng: thời gian (`txn_at`), chứng từ (`ref_type` + `ref_id` → số phiếu, có link), loại (`txn_type`), nhập / xuất (`qty_change` tách dấu), tồn sau (`qty_after`), giá vốn (`unit_cost_base`), người ghi sổ (`created_by`).
- Thông báo đối soát của riêng cặp sản phẩm, kho này.

**Truy vấn:** dùng `ix_inv_txn_product_wh_time (product_id, warehouse_id, txn_at, id)`; sắp theo `txn_at, id`.

**Hành động:** In thẻ kho, Xuất Excel.

---

## 13. Danh sách phiếu điều chỉnh – `inventory/adjustments.html`

**Mục đích:** tra cứu phiếu kiểm kê, hư hỏng, mất mát.

**Bộ lọc:** tìm theo số phiếu hoặc mã hàng, kho, lý do (`reason`), trạng thái.

**Cột:** Số phiếu (`adj_no`), Kho, Ngày (`adj_date`), Lý do, Số dòng, Giá trị chênh lệch (`SUM(qty_change × unit_cost_base)`, xanh khi tăng, đỏ khi giảm), Trạng thái.

**Hành động:** **Lập phiếu kiểm kê** → màn 14.

---

## 14. Phiếu kiểm kê, điều chỉnh – `inventory/adjustment-detail.html`

**Mục đích:** đưa tồn hệ thống về đúng số thực tế, có dấu vết trên thẻ kho.

**Trường:** Kho (`warehouse_id`), Ngày kiểm kê (`adj_date`), Lý do (`reason`), Ghi chú (xem khoảng trống). Dòng: mã, tên, tồn trên hệ thống (`qty_on_hand` lúc lập), thực tế đếm (nhập), chênh lệch = đếm − hệ thống (`inventory_adjustment_item.qty_change`, phải ≠ 0 mới được lưu), giá vốn BQ (`unit_cost_base` = `avg_cost`), giá trị chênh lệch.

**Hành động**

| Nút | Khi làm thật |
|---|---|
| Lấy toàn bộ mã hàng trong kho | Nạp mọi dòng `inventory_balance` của kho vào bảng. |
| Lưu nháp | Chỉ lưu dòng có chênh lệch ≠ 0. |
| Ghi sổ | Transaction: khóa `inventory_balance`; dòng tăng ghi `ADJUST_IN`, dòng giảm ghi `ADJUST_OUT` (`ref_type = 'ADJ'`); cập nhật `qty_on_hand`; `POSTED`. Nếu tồn đã thay đổi kể từ lúc lập (có người nhập/xuất xen giữa) thì từ chối và yêu cầu đếm lại hoặc tải lại số hệ thống. |

---

## 15. Đối soát tồn kho – `inventory/reconcile.html`

**Mục đích:** chứng minh `inventory_balance.qty_on_hand` luôn bằng `SUM(inventory_transaction.qty_change)`.

**Hiển thị:** thẻ tổng (số cặp kiểm tra, số khớp, số lệch, lần chạy gần nhất); thông báo kết quả; bảng: mã hàng, tên, kho, tồn hiện tại (`qty_on_hand`), tổng sổ cái (`SUM(qty_change)`), chênh lệch, số bút toán (`COUNT(*)`), kết quả "Khớp"/"Lệch", link thẻ kho. Bộ lọc "Chỉ dòng lệch".

**Nguồn:** view `v_inventory_reconcile` chỉ trả **các dòng lệch** (kết quả đúng là rỗng). Để hiện cả dòng khớp cần truy vấn riêng không có `HAVING` (xem khoảng trống).

**Hành động:** **Chạy đối soát ngay** (chạy truy vấn, lưu kết quả lần chạy), Xuất Excel. Nếu có lệch: không sửa số tồn trực tiếp; tra thẻ kho, báo quản trị, lập phiếu điều chỉnh.

---

## 16. Sản phẩm – `master/products.html`

**Cột:** Mã hàng (`sku`), Tên (`name`), ĐVT (`uom`), Tồn từng kho (từ `inventory_balance`), Trạng thái (`is_active`), Cập nhật (`updated_at`), nút Sửa.

**Modal Thêm / Sửa:** Mã hàng (SKU) – bắt buộc, duy nhất, **không sửa được khi đã có chứng từ** (modal Sửa hiện ô chỉ đọc); Đơn vị tính cơ sở; Tên hàng; Đang dùng.

**Quy tắc:** không xóa sản phẩm đã có chứng từ, chỉ ngừng dùng; sản phẩm ngừng dùng không hiện trong ô chọn khi lập chứng từ mới. Mở thẳng modal: `products.html#m-product-new`, `#m-product-edit`.

---

## 17. Kho hàng – `master/warehouses.html`

**Cột:** Mã kho (`code`), Tên (`name`), Địa chỉ (`address`), Số mã hàng đang có tồn (`COUNT` từ `inventory_balance` với `qty_on_hand > 0`), Trạng thái, Sửa.

**Modal:** Mã kho (duy nhất, chỉ đọc khi sửa), Tên, Địa chỉ, Đang dùng.

**Quy tắc:** chỉ ngừng dùng kho không còn tồn. Modal Sửa mẫu hiện lỗi "Không ngừng dùng được: Kho Hà Nội còn 98 mã hàng có tồn. Chuyển hoặc điều chỉnh hết tồn về 0 trước."

---

## 18. Nhà cung cấp – `master/suppliers.html`

**Bộ lọc:** tìm theo mã, tên, MST; tiền tệ mặc định; trạng thái.

**Cột:** Mã NCC (`code`), Tên (`name`), Mã số thuế (`tax_code`), Quốc gia (`country_code`), **Tiền tệ mặc định** (`default_currency`, NULL hiện "Chưa đặt"), PO đang mở (đếm PO chưa `RECEIVED/CLOSED/CANCELLED`), Trạng thái, Sửa.

**Modal:** Mã NCC, Mã số thuế, Tên, Quốc gia, Tiền tệ mặc định (gợi ý: "Đơn mua mới sẽ tự lấy tiền tệ này"), Đang giao dịch.

**Quy tắc:** đổi tiền tệ mặc định không ảnh hưởng PO đã lập (mỗi PO lưu `currency_code` riêng).

---

## 19. Khách hàng – `master/customers.html`

**Cột:** Mã khách hàng (`code`), Tên (`name`), Mã số thuế (`tax_code`), Đơn bán đang mở, Trạng thái, Sửa.

**Modal:** Mã (chỉ đọc khi sửa), Mã số thuế (kiểm tra 10 hoặc 13 chữ số; modal Sửa mẫu hiện lỗi cụ thể), Tên, Đang giao dịch.

---

## 20. Tiền tệ và tỷ giá – `master/currencies.html`

**Mục đích:** quản lý danh mục tiền tệ và bảng tỷ giá tham chiếu.

**Hiển thị:** bảng Tiền tệ: mã (`currency.code`), tên, số lẻ (`decimals`), nhãn Tiền gốc (`is_base`). Lịch sử tỷ giá theo tiền tệ đang chọn (tab USD/EUR/CNY): ngày áp dụng (`rate_date`), tỷ giá (`rate`), nguồn (`source`), người nhập.

**Form thêm tỷ giá:** ngày áp dụng, tỷ giá (> 0), nguồn (Vietcombank / NHNN / Nhập tay). Trùng `(currency_code, rate_date)` thì báo "Đã có tỷ giá USD ngày 20/09/2026; sửa dòng đó thay vì thêm mới" (`uq_exchange_rate`).

**Quy tắc:** chỉ một tiền tệ gốc (`uq_currency_single_base`). Sửa tỷ giá không làm đổi chứng từ đã lập.

---

## Khoảng trống giữa giao diện và schema

Những chỗ giao diện đang hiển thị hoặc cần, nhưng `schema.sql` chưa có. Cần chốt trước khi code.

| # | Màn | Giao diện cần | Schema hiện tại | Đề xuất |
|---|---|---|---|---|
| 1 | Phiếu nhập loại Khách trả hàng | Biết khách nào trả, trả cho SO nào | `goods_receipt` chỉ có `supplier_id`, `po_id` | Thêm `customer_id`, `so_id` (hoặc `ref_gi_id`) và CHECK tương ứng cho `CUSTOMER_RETURN`. |
| 2 | Mọi chứng từ ở trạng thái Đã hủy | Thời điểm, người hủy, lý do hủy | Không có cột | Thêm `cancelled_at`, `cancelled_by`, `cancel_reason` cho PO, SO, GR, GI, ADJ. |
| 3 | Chi tiết đơn mua | Điều khoản (Incoterms, thanh toán), nguồn tỷ giá | Không có | Thêm `purchase_order.terms`, `exchange_rate_source`. |
| 4 | Chi tiết đơn bán | Nhân viên bán, địa chỉ giao, kho xuất mặc định, điều khoản thanh toán | Không có | Thêm `sales_order.salesperson_id`, `ship_to_address`, `default_warehouse_id`, `payment_terms`. |
| 5 | Phiếu kiểm kê | Ghi chú; người lập | `inventory_adjustment` không có `note`, `created_by` | Thêm 2 cột. |
| 6 | Phiếu kiểm kê | Lưu cả tồn hệ thống và số đếm để kiểm tra lại | Chỉ có `qty_change` | Thêm `qty_system`, `qty_counted` vào `inventory_adjustment_item`. |
| 7 | Lý do điều chỉnh | Danh sách cố định | `reason VARCHAR(50)` tự do | Thêm CHECK `reason IN ('STOCKTAKE','DAMAGED','LOST','OTHER')` hoặc bảng danh mục. |
| 8 | Tiền tệ và tỷ giá | Người nhập tỷ giá | `exchange_rate` không có `created_by` | Thêm cột. |
| 9 | Mọi màn có "người lập / người ghi sổ" | Tên người dùng | `created_by`, `posted_by` là `BIGINT` không FK | Thêm bảng `app_user` và FK. |
| 10 | Đối soát tồn kho | Hiện cả dòng khớp, số bút toán, lịch sử các lần chạy | View chỉ trả dòng lệch | Thêm truy vấn/view không `HAVING`; bảng `inventory_reconcile_run` nếu cần lưu lịch sử. |
| 11 | Chi tiết đơn mua / bán | Tổng tiền | `total_amount`, `total_amount_base` là cột lưu tay | Tính lại trong cùng transaction khi lưu dòng (hoặc trigger) để không lệch với `SUM(line_amount)`. |
| 12 | Khách hàng | Địa chỉ, quốc gia, tiền tệ (khách nước ngoài như Tech Partner Pte. Ltd dùng USD) | `customer` chỉ có mã, tên, MST | Thêm `address`, `country_code`, `default_currency`. |

## Ghi chú về dữ liệu mẫu

- Dữ liệu mẫu đồng nhất quanh các chứng từ PO-2026-0142, GR-2026-0327, SO-2026-0588, GI-2026-0463, ADJ-2026-0021 và 8 sản phẩm (BP-K120, CH-M50, TN-H3, MN-24F, CAP-C1, DE-L2, HUB-U4, BL-P01), 2 kho có tồn (Hà Nội, TP.HCM).
- Thẻ kho BP-K120 (có từ 10 màn gốc) thể hiện dòng thời gian **sau** khi GI-2026-0463 và ADJ-2026-0021 đã ghi sổ (tồn cuối 68), trong khi màn Tồn kho và Tổng quan chụp lúc 11:00 (tồn 80, hai phiếu còn Nháp). Khi làm thật, số liệu sẽ tự nhất quán.
