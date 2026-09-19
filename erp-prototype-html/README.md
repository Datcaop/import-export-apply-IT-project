# ERP prototype (HTML tĩnh)

Prototype giao diện cho hệ thống Mua hàng/Nhập khẩu – Kho – Bán hàng. Chỉ có HTML + CSS và một ít JavaScript thuần (mở modal, chuyển tab). Dữ liệu là dữ liệu mẫu cố định, các nút chỉ để minh họa hoặc dẫn sang trang khác.

Đặc tả từng màn (trường, nút, trạng thái, bảng/cột DB) nằm ở [`docs/SCREEN_SPEC.md`](../docs/SCREEN_SPEC.md).

## Cách mở

**Cách 1, không cần cài gì:** bấm đúp `index.html` để mở bằng trình duyệt.

**Cách 2, qua localhost** (tiện khi chia sẻ trong mạng LAN hoặc mở trên điện thoại):

```bash
pnpm prototype                               # từ gốc repo
# hoặc
node erp-prototype-html/scripts/serve.mjs 5500
```

Rồi mở http://localhost:5500/.

Font Be Vietnam Pro tải từ Google Fonts; nếu máy không có mạng, trang tự dùng Segoe UI.

## Sơ đồ file

```
erp-prototype-html/
  index.html                              Tổng quan
  assets/
    styles.css                            CSS dùng chung (token màu, layout, bảng, nút, badge, form, modal)
    app.js                                Mở/đóng modal, chuyển tab; mở modal theo #id trên URL
  purchase/
    orders.html                           Danh sách đơn mua
    order-new.html                        Tạo đơn mua
    order-detail.html                     Chi tiết đơn mua PO-2026-0142
    receipts.html                         Danh sách phiếu nhập
    receipts--empty.html                    biến thể: danh sách trống
    receipt-detail.html                   Phiếu nhập GR-2026-0327 (nháp)
    receipt-detail--posted.html             biến thể: đã ghi sổ
    receipt-detail--cancelled.html          biến thể: đã hủy
  sales/
    orders.html                           Danh sách đơn bán
    order-detail.html                     Chi tiết đơn bán SO-2026-0588
    issues.html                           Danh sách phiếu xuất
    issue-detail.html                     Phiếu xuất GI-2026-0463 (thiếu tồn)
    issue-detail--ready.html                biến thể: đủ tồn, sẵn sàng ghi sổ
    issue-detail--posted.html               biến thể: đã ghi sổ
    issue-detail--race.html                 biến thể: người khác vừa xuất trước, bị từ chối
  inventory/
    balances.html                         Tồn kho hiện tại
    stock-card.html                       Thẻ kho BP-K120, Kho Hà Nội
    adjustments.html                      Danh sách phiếu điều chỉnh
    adjustment-detail.html                Phiếu kiểm kê ADJ-2026-0021
    reconcile.html                        Đối soát tồn kho
  master/
    products.html                         Sản phẩm (modal thêm/sửa)
    warehouses.html                       Kho hàng (modal thêm/sửa)
    suppliers.html                        Nhà cung cấp, có cột tiền tệ mặc định (modal)
    customers.html                        Khách hàng (modal)
    currencies.html                       Tiền tệ và tỷ giá
  scripts/
    check-links.mjs                       Quét link nội bộ hỏng
    serve.mjs                             Server tĩnh cho localhost
```

Trang biến thể (`--posted`, `--race`…) có dải **Trạng thái hiển thị** ở đầu trang để chuyển qua lại giữa các trạng thái. Dải này chỉ có trong prototype, không làm trên sản phẩm thật.

## Kịch bản click demo

**1. Mua hàng nhập khẩu, từ đơn mua tới thẻ kho**

1. Mở `index.html`, ở khối **Đơn mua chờ nhận hàng** bấm **Xem tất cả**.
2. Ở danh sách đơn mua, bấm **Tạo đơn mua**: chọn NCC Shenzhen Keytech thì tiền tệ tự là USD, tỷ giá gợi ý 25.400 kèm nguồn Vietcombank. Bảng dòng hàng có một dòng trống để nhập.
3. Bấm **Lưu và duyệt** để sang chi tiết **PO-2026-0142** (Nhận một phần 260/350).
4. Bấm **Tạo phiếu nhập** để mở **GR-2026-0327** ở trạng thái Nháp: tỷ giá ngày nhập 25.400 khác tỷ giá PO 25.300.
5. Bấm **Ghi sổ** để xem trạng thái Đã ghi sổ: không còn ô nhập, tồn BP-K120 từ 60 lên 100. Bấm **Xem thẻ kho**.
6. Quay lại phiếu, dùng dải trạng thái chọn **Đã hủy** để xem phiếu hủy.

**2. Bán hàng và chặn xuất âm kho**

1. Sidebar, **Đơn bán hàng**, bấm **SO-2026-0588**, rồi **Tạo phiếu xuất**.
2. Phiếu **GI-2026-0463**: dòng MN-24F đòi 10 nhưng kho chỉ còn 6. Có thông báo lỗi và cách sửa, nút Ghi sổ bị khóa.
3. Chọn **Đủ tồn, sẵn sàng ghi sổ** (SL đã giảm còn 6), bấm **Ghi sổ** để xem trạng thái Đã ghi sổ.
4. Chọn **Người khác vừa xuất trước**: GI-2026-0465 đã xuất trước 5 cái, tồn còn 1. Phiếu bị từ chối, không dòng nào bị trừ.

**3. Kho: tồn, kiểm kê, đối soát**

1. Sidebar, **Tồn kho**, bấm **Thẻ kho** của một dòng.
2. **Kiểm kê, điều chỉnh**, bấm **ADJ-2026-0021**: chênh lệch −2 BP-K120, +1 TN-H3.
3. **Đối soát tồn kho**: tất cả cặp sản phẩm, kho đều Khớp.

**4. Danh mục**

1. **Sản phẩm**, bấm **Thêm sản phẩm** hoặc **Sửa** để mở modal (đóng bằng Esc, nút X hoặc Hủy).
2. **Nhà cung cấp**: xem cột Tiền tệ mặc định, liên hệ với bước 2 của kịch bản 1.
3. **Khách hàng**, bấm **Sửa** ở KH-MINHPHAT để xem thông báo lỗi mã số thuế cụ thể.
4. **Kho hàng**, bấm **Sửa** ở HN để xem lỗi không ngừng dùng được kho còn tồn.
5. Link mở thẳng modal: `master/products.html#m-product-new`.

**5. Danh sách trống:** **Phiếu nhập kho**, chọn **Danh sách trống** ở dải trạng thái.

## Kiểm tra link

```bash
node erp-prototype-html/scripts/check-links.mjs
```

Script quét mọi `href`/`src` nội bộ, báo link trỏ tới file không tồn tại hoặc link trống (`#`).

## Quy ước giao diện

- Tiếng Việt có dấu; số kiểu Việt Nam (`25.400`, `18,50`); ngày `dd/MM/yyyy`; tiền VND có `₫`; số trong bảng dùng `tabular-nums`.
- Màu: nền `#EEF1F4`, bề mặt `#FFFFFF`, viền `#D5DCE4`, chữ `#1B2733`, chữ phụ `#566575`, primary `#1D4E89`; module Mua `#2F6FB3`, Kho `#1B7F66`, Bán `#A9502A`; lỗi `#A32016`. Tất cả khai báo thành biến CSS trong `assets/styles.css`.
- Không gradient, không emoji; icon SVG dạng nét.
- Dùng `<button>`, `<a>`, `<label>` thật; nút chỉ có icon có `aria-label`; focus ring rõ.
- Khi thêm trang mới: copy một trang cùng module, giữ khung sidebar/topbar, đặt `aria-current="page"` cho mục sidebar tương ứng, rồi chạy `check-links.mjs`.

## Lưu ý về dữ liệu mẫu

Thẻ kho BP-K120 thể hiện thời điểm **sau** khi GI-2026-0463 và ADJ-2026-0021 đã ghi sổ (tồn 68). Tổng quan và Tồn kho chụp lúc 11:00, khi hai phiếu đó còn Nháp (tồn 80). Hai mốc này có từ 10 màn gốc và được giữ nguyên.
