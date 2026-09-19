-- =====================================================================
--  Hệ thống Mua hàng/Nhập khẩu – Kho – Bán hàng
--  Target: PostgreSQL 14+
--  Quy ước:
--    * Tiền tệ gốc (base currency) = VND
--    * Số lượng  : NUMERIC(18,4)   (không dùng FLOAT)
--    * Tiền      : NUMERIC(19,4)
--    * Tỷ giá    : NUMERIC(18,6)   (1 đơn vị ngoại tệ = rate VND)
--    * Chứng từ đã POSTED là bất biến; sửa sai bằng chứng từ đảo/điều chỉnh
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. MASTER DATA
-- ---------------------------------------------------------------------
CREATE TABLE currency (
    code        CHAR(3)      PRIMARY KEY,            -- ISO 4217: VND, USD, EUR...
    name        VARCHAR(50)  NOT NULL,
    decimals    SMALLINT     NOT NULL DEFAULT 2,
    is_base     BOOLEAN      NOT NULL DEFAULT FALSE
);
-- Chỉ một đồng tiền gốc
CREATE UNIQUE INDEX uq_currency_single_base ON currency (is_base) WHERE is_base;

-- Bảng tỷ giá tham chiếu (chỉ dùng để GỢI Ý khi tạo chứng từ, KHÔNG dùng để tính lại lịch sử)
CREATE TABLE exchange_rate (
    id             BIGSERIAL     PRIMARY KEY,
    currency_code  CHAR(3)       NOT NULL REFERENCES currency(code),
    rate_date      DATE          NOT NULL,
    rate           NUMERIC(18,6) NOT NULL CHECK (rate > 0),
    source         VARCHAR(30),                      -- VCB, SBV, manual...
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_exchange_rate UNIQUE (currency_code, rate_date)
);

CREATE TABLE supplier (
    id                BIGSERIAL    PRIMARY KEY,
    code              VARCHAR(30)  NOT NULL UNIQUE,
    name              VARCHAR(255) NOT NULL,
    tax_code          VARCHAR(30),
    country_code      CHAR(2),
    default_currency  CHAR(3)      REFERENCES currency(code),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE customer (
    id          BIGSERIAL    PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    tax_code    VARCHAR(30),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE product (
    id          BIGSERIAL    PRIMARY KEY,
    sku         VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    uom         VARCHAR(20)  NOT NULL,               -- đơn vị tính cơ sở: PCS, KG, BOX...
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE warehouse (
    id          BIGSERIAL    PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    address     TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 1. MUA HÀNG / NHẬP KHẨU
-- ---------------------------------------------------------------------
CREATE TABLE purchase_order (
    id                 BIGSERIAL     PRIMARY KEY,
    po_no              VARCHAR(30)   NOT NULL UNIQUE,
    supplier_id        BIGINT        NOT NULL REFERENCES supplier(id),
    order_date         DATE          NOT NULL,
    expected_date      DATE,
    currency_code      CHAR(3)       NOT NULL REFERENCES currency(code),
    exchange_rate      NUMERIC(18,6) NOT NULL CHECK (exchange_rate > 0),  -- snapshot tại ngày PO
    status             VARCHAR(20)   NOT NULL DEFAULT 'DRAFT'
                       CHECK (status IN ('DRAFT','APPROVED','PARTIALLY_RECEIVED','RECEIVED','CLOSED','CANCELLED')),
    total_amount       NUMERIC(19,4) NOT NULL DEFAULT 0,   -- nguyên tệ
    total_amount_base  NUMERIC(19,4) NOT NULL DEFAULT 0,   -- VND
    note               TEXT,
    created_by         BIGINT,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX ix_po_supplier_date ON purchase_order (supplier_id, order_date);
CREATE INDEX ix_po_status        ON purchase_order (status);

CREATE TABLE purchase_order_item (
    id            BIGSERIAL     PRIMARY KEY,
    po_id         BIGINT        NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
    line_no       INT           NOT NULL,
    product_id    BIGINT        NOT NULL REFERENCES product(id),
    qty_ordered   NUMERIC(18,4) NOT NULL CHECK (qty_ordered > 0),
    qty_received  NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (qty_received >= 0),
    unit_price    NUMERIC(19,4) NOT NULL CHECK (unit_price >= 0),         -- nguyên tệ
    line_amount   NUMERIC(19,4) GENERATED ALWAYS AS (qty_ordered * unit_price) STORED,
    CONSTRAINT uq_po_item_line UNIQUE (po_id, line_no),
    CONSTRAINT ck_po_item_not_over_received CHECK (qty_received <= qty_ordered)
);
CREATE INDEX ix_po_item_product ON purchase_order_item (product_id);

CREATE TABLE goods_receipt (
    id              BIGSERIAL     PRIMARY KEY,
    gr_no           VARCHAR(30)   NOT NULL UNIQUE,
    receipt_type    VARCHAR(20)   NOT NULL DEFAULT 'PURCHASE'
                    CHECK (receipt_type IN ('PURCHASE','NON_PO','OPENING','CUSTOMER_RETURN')),
    po_id           BIGINT        REFERENCES purchase_order(id),   -- bắt buộc khi receipt_type = PURCHASE
    supplier_id     BIGINT        REFERENCES supplier(id),
    warehouse_id    BIGINT        NOT NULL REFERENCES warehouse(id),
    receipt_date    DATE          NOT NULL,
    currency_code   CHAR(3)       NOT NULL REFERENCES currency(code),
    exchange_rate   NUMERIC(18,6) NOT NULL CHECK (exchange_rate > 0),  -- tỷ giá thực tế ngày nhập
    status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','POSTED','CANCELLED')),
    posted_at       TIMESTAMPTZ,
    posted_by       BIGINT,
    note            TEXT,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_gr_po_required CHECK (
        (receipt_type = 'PURCHASE' AND po_id IS NOT NULL)
     OR (receipt_type <> 'PURCHASE' AND po_id IS NULL)
    )
);
CREATE INDEX ix_gr_po             ON goods_receipt (po_id);
CREATE INDEX ix_gr_warehouse_date ON goods_receipt (warehouse_id, receipt_date);

CREATE TABLE goods_receipt_item (
    id               BIGSERIAL     PRIMARY KEY,
    gr_id            BIGINT        NOT NULL REFERENCES goods_receipt(id) ON DELETE CASCADE,
    line_no          INT           NOT NULL,
    po_item_id       BIGINT        REFERENCES purchase_order_item(id),
    product_id       BIGINT        NOT NULL REFERENCES product(id),
    qty              NUMERIC(18,4) NOT NULL CHECK (qty > 0),
    unit_cost        NUMERIC(19,4) NOT NULL CHECK (unit_cost >= 0),       -- nguyên tệ
    unit_cost_base   NUMERIC(19,4) NOT NULL CHECK (unit_cost_base >= 0),  -- VND = unit_cost * exchange_rate (đã làm tròn)
    CONSTRAINT uq_gr_item_line UNIQUE (gr_id, line_no)
);
CREATE INDEX ix_gr_item_po_item ON goods_receipt_item (po_item_id);
CREATE INDEX ix_gr_item_product ON goods_receipt_item (product_id);

-- ---------------------------------------------------------------------
-- 2. BÁN HÀNG
-- ---------------------------------------------------------------------
CREATE TABLE sales_order (
    id                 BIGSERIAL     PRIMARY KEY,
    so_no              VARCHAR(30)   NOT NULL UNIQUE,
    customer_id        BIGINT        NOT NULL REFERENCES customer(id),
    order_date         DATE          NOT NULL,
    currency_code      CHAR(3)       NOT NULL REFERENCES currency(code),
    exchange_rate      NUMERIC(18,6) NOT NULL CHECK (exchange_rate > 0),
    status             VARCHAR(20)   NOT NULL DEFAULT 'DRAFT'
                       CHECK (status IN ('DRAFT','CONFIRMED','PARTIALLY_ISSUED','ISSUED','CLOSED','CANCELLED')),
    total_amount       NUMERIC(19,4) NOT NULL DEFAULT 0,
    total_amount_base  NUMERIC(19,4) NOT NULL DEFAULT 0,
    note               TEXT,
    created_by         BIGINT,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX ix_so_customer_date ON sales_order (customer_id, order_date);
CREATE INDEX ix_so_status        ON sales_order (status);

CREATE TABLE sales_order_item (
    id           BIGSERIAL     PRIMARY KEY,
    so_id        BIGINT        NOT NULL REFERENCES sales_order(id) ON DELETE CASCADE,
    line_no      INT           NOT NULL,
    product_id   BIGINT        NOT NULL REFERENCES product(id),
    qty_ordered  NUMERIC(18,4) NOT NULL CHECK (qty_ordered > 0),
    qty_issued   NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (qty_issued >= 0),
    unit_price   NUMERIC(19,4) NOT NULL CHECK (unit_price >= 0),
    line_amount  NUMERIC(19,4) GENERATED ALWAYS AS (qty_ordered * unit_price) STORED,
    CONSTRAINT uq_so_item_line UNIQUE (so_id, line_no),
    CONSTRAINT ck_so_item_not_over_issued CHECK (qty_issued <= qty_ordered)
);
CREATE INDEX ix_so_item_product ON sales_order_item (product_id);

CREATE TABLE goods_issue (
    id            BIGSERIAL    PRIMARY KEY,
    gi_no         VARCHAR(30)  NOT NULL UNIQUE,
    so_id         BIGINT       REFERENCES sales_order(id),   -- 1 SO : N GI (xuất nhiều lần)
    warehouse_id  BIGINT       NOT NULL REFERENCES warehouse(id),
    issue_date    DATE         NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                  CHECK (status IN ('DRAFT','POSTED','CANCELLED')),
    posted_at     TIMESTAMPTZ,
    posted_by     BIGINT,
    note          TEXT,
    created_by    BIGINT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_gi_so             ON goods_issue (so_id);
CREATE INDEX ix_gi_warehouse_date ON goods_issue (warehouse_id, issue_date);

CREATE TABLE goods_issue_item (
    id              BIGSERIAL     PRIMARY KEY,
    gi_id           BIGINT        NOT NULL REFERENCES goods_issue(id) ON DELETE CASCADE,
    line_no         INT           NOT NULL,
    so_item_id      BIGINT        REFERENCES sales_order_item(id),
    product_id      BIGINT        NOT NULL REFERENCES product(id),
    qty             NUMERIC(18,4) NOT NULL CHECK (qty > 0),
    unit_cost_base  NUMERIC(19,4),       -- giá vốn VND, ghi nhận tại thời điểm POST
    CONSTRAINT uq_gi_item_line UNIQUE (gi_id, line_no)
);
CREATE INDEX ix_gi_item_so_item ON goods_issue_item (so_item_id);
CREATE INDEX ix_gi_item_product ON goods_issue_item (product_id);

-- ---------------------------------------------------------------------
-- 3. KHO
-- ---------------------------------------------------------------------
-- Điều chỉnh tồn (kiểm kê, hư hỏng...) – chứng từ nguồn cho ADJUST_IN/ADJUST_OUT
CREATE TABLE inventory_adjustment (
    id            BIGSERIAL    PRIMARY KEY,
    adj_no        VARCHAR(30)  NOT NULL UNIQUE,
    warehouse_id  BIGINT       NOT NULL REFERENCES warehouse(id),
    adj_date      DATE         NOT NULL,
    reason        VARCHAR(50)  NOT NULL,                 -- STOCKTAKE, DAMAGED, LOST...
    status        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                  CHECK (status IN ('DRAFT','POSTED','CANCELLED')),
    posted_at     TIMESTAMPTZ,
    posted_by     BIGINT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE inventory_adjustment_item (
    id              BIGSERIAL     PRIMARY KEY,
    adj_id          BIGINT        NOT NULL REFERENCES inventory_adjustment(id) ON DELETE CASCADE,
    line_no         INT           NOT NULL,
    product_id      BIGINT        NOT NULL REFERENCES product(id),
    qty_change      NUMERIC(18,4) NOT NULL CHECK (qty_change <> 0),   -- + tăng / - giảm
    unit_cost_base  NUMERIC(19,4),
    CONSTRAINT uq_adj_item_line UNIQUE (adj_id, line_no)
);

-- Tồn kho HIỆN TẠI theo (sản phẩm, kho) – 1 dòng / cặp; là "điểm khóa" khi cập nhật đồng thời
CREATE TABLE inventory_balance (
    product_id    BIGINT        NOT NULL REFERENCES product(id),
    warehouse_id  BIGINT        NOT NULL REFERENCES warehouse(id),
    qty_on_hand   NUMERIC(18,4) NOT NULL DEFAULT 0,
    avg_cost      NUMERIC(19,4) NOT NULL DEFAULT 0,       -- giá vốn bình quân gia quyền (VND)
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT pk_inventory_balance PRIMARY KEY (product_id, warehouse_id),
    CONSTRAINT ck_inventory_non_negative CHECK (qty_on_hand >= 0)   -- tuyến phòng thủ cuối cùng
);
CREATE INDEX ix_inv_balance_warehouse ON inventory_balance (warehouse_id);

-- Sổ cái kho (stock ledger) – APPEND-ONLY, mọi biến động đều ghi ở đây
CREATE TABLE inventory_transaction (
    id              BIGSERIAL     PRIMARY KEY,
    product_id      BIGINT        NOT NULL REFERENCES product(id),
    warehouse_id    BIGINT        NOT NULL REFERENCES warehouse(id),
    txn_type        VARCHAR(20)   NOT NULL
                    CHECK (txn_type IN ('RECEIPT','ISSUE','ADJUST_IN','ADJUST_OUT',
                                        'TRANSFER_IN','TRANSFER_OUT','REVERSAL')),
    qty_change      NUMERIC(18,4) NOT NULL CHECK (qty_change <> 0),  -- có dấu: + nhập, - xuất
    qty_after       NUMERIC(18,4) NOT NULL CHECK (qty_after >= 0),   -- tồn sau giao dịch
    unit_cost_base  NUMERIC(19,4),                                   -- VND
    ref_type        VARCHAR(10)   NOT NULL CHECK (ref_type IN ('GR','GI','ADJ','TRF')),
    ref_id          BIGINT        NOT NULL,     -- id header chứng từ
    ref_line_id     BIGINT        NOT NULL,     -- id dòng chứng từ
    txn_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_by      BIGINT,
    note            TEXT,
    -- Idempotency: một dòng chứng từ chỉ sinh đúng 1 bút toán kho
    CONSTRAINT uq_inv_txn_ref_line UNIQUE (ref_type, ref_line_id, txn_type)
);
CREATE INDEX ix_inv_txn_product_wh_time ON inventory_transaction (product_id, warehouse_id, txn_at, id);
CREATE INDEX ix_inv_txn_ref             ON inventory_transaction (ref_type, ref_id);
CREATE INDEX ix_inv_txn_time            ON inventory_transaction (txn_at);

-- Chặn UPDATE/DELETE trên sổ cái kho
CREATE OR REPLACE FUNCTION fn_inventory_txn_immutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'inventory_transaction là append-only; hãy tạo bút toán đảo (REVERSAL)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_txn_immutable
    BEFORE UPDATE OR DELETE ON inventory_transaction
    FOR EACH ROW EXECUTE FUNCTION fn_inventory_txn_immutable();

-- ---------------------------------------------------------------------
-- 4. VIEW / QUERY TIỆN ÍCH
-- ---------------------------------------------------------------------
-- Đối soát: tồn hiện tại phải bằng tổng biến động (chạy định kỳ, kết quả phải rỗng)
CREATE VIEW v_inventory_reconcile AS
SELECT b.product_id, b.warehouse_id, b.qty_on_hand,
       COALESCE(SUM(t.qty_change), 0) AS ledger_qty
FROM inventory_balance b
LEFT JOIN inventory_transaction t
       ON t.product_id = b.product_id AND t.warehouse_id = b.warehouse_id
GROUP BY b.product_id, b.warehouse_id, b.qty_on_hand
HAVING b.qty_on_hand <> COALESCE(SUM(t.qty_change), 0);
