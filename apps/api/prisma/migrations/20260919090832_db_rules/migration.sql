-- =====================================================================
--  Quy tắc DB mà Prisma không diễn đạt được (viết tay, KHÔNG sinh lại).
--  Nguồn: docs/schema.sql + các bổ sung trong docs/SCREEN_SPEC.md.
--  Prisma bỏ qua CHECK, trigger và view khi so sánh schema, nên các đối tượng
--  này tồn tại qua các migration sau. Cột GENERATED line_amount được test
--  db-invariants canh giữ.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Master data
-- ---------------------------------------------------------------------
ALTER TABLE exchange_rate ADD CONSTRAINT ck_exchange_rate_rate CHECK (rate > 0);

-- ---------------------------------------------------------------------
-- 1. Mua hàng
-- ---------------------------------------------------------------------
ALTER TABLE purchase_order
  ADD CONSTRAINT ck_po_exchange_rate CHECK (exchange_rate > 0),
  ADD CONSTRAINT ck_po_status CHECK (status IN ('DRAFT','APPROVED','PARTIALLY_RECEIVED','RECEIVED','CLOSED','CANCELLED')),
  ADD CONSTRAINT ck_po_cancelled CHECK ((status = 'CANCELLED') = (cancelled_at IS NOT NULL)),
  ADD CONSTRAINT ck_po_closed CHECK ((status = 'CLOSED') = (closed_at IS NOT NULL));

ALTER TABLE purchase_order_item
  ADD CONSTRAINT ck_po_item_qty_ordered CHECK (qty_ordered > 0),
  ADD CONSTRAINT ck_po_item_qty_received CHECK (qty_received >= 0),
  ADD CONSTRAINT ck_po_item_unit_price CHECK (unit_price >= 0),
  ADD CONSTRAINT ck_po_item_not_over_received CHECK (qty_received <= qty_ordered);

ALTER TABLE purchase_order_item DROP COLUMN line_amount;
ALTER TABLE purchase_order_item
  ADD COLUMN line_amount NUMERIC(19,4) GENERATED ALWAYS AS (qty_ordered * unit_price) STORED;

ALTER TABLE goods_receipt
  ADD CONSTRAINT ck_gr_receipt_type CHECK (receipt_type IN ('PURCHASE','NON_PO','OPENING','CUSTOMER_RETURN')),
  ADD CONSTRAINT ck_gr_exchange_rate CHECK (exchange_rate > 0),
  ADD CONSTRAINT ck_gr_status CHECK (status IN ('DRAFT','POSTED','CANCELLED')),
  ADD CONSTRAINT ck_gr_po_required CHECK (
        (receipt_type = 'PURCHASE' AND po_id IS NOT NULL)
     OR (receipt_type <> 'PURCHASE' AND po_id IS NULL)),
  ADD CONSTRAINT ck_gr_customer_return CHECK (
        (receipt_type = 'CUSTOMER_RETURN' AND customer_id IS NOT NULL)
     OR (receipt_type <> 'CUSTOMER_RETURN' AND customer_id IS NULL AND so_id IS NULL)),
  ADD CONSTRAINT ck_gr_posted CHECK ((status = 'POSTED') = (posted_at IS NOT NULL)),
  ADD CONSTRAINT ck_gr_cancelled CHECK ((status = 'CANCELLED') = (cancelled_at IS NOT NULL));

ALTER TABLE goods_receipt_item
  ADD CONSTRAINT ck_gr_item_qty CHECK (qty > 0),
  ADD CONSTRAINT ck_gr_item_unit_cost CHECK (unit_cost >= 0),
  ADD CONSTRAINT ck_gr_item_unit_cost_base CHECK (unit_cost_base >= 0);

-- ---------------------------------------------------------------------
-- 2. Bán hàng
-- ---------------------------------------------------------------------
ALTER TABLE sales_order
  ADD CONSTRAINT ck_so_exchange_rate CHECK (exchange_rate > 0),
  ADD CONSTRAINT ck_so_status CHECK (status IN ('DRAFT','CONFIRMED','PARTIALLY_ISSUED','ISSUED','CLOSED','CANCELLED')),
  ADD CONSTRAINT ck_so_cancelled CHECK ((status = 'CANCELLED') = (cancelled_at IS NOT NULL)),
  ADD CONSTRAINT ck_so_closed CHECK ((status = 'CLOSED') = (closed_at IS NOT NULL));

ALTER TABLE sales_order_item
  ADD CONSTRAINT ck_so_item_qty_ordered CHECK (qty_ordered > 0),
  ADD CONSTRAINT ck_so_item_qty_issued CHECK (qty_issued >= 0),
  ADD CONSTRAINT ck_so_item_unit_price CHECK (unit_price >= 0),
  ADD CONSTRAINT ck_so_item_not_over_issued CHECK (qty_issued <= qty_ordered);

ALTER TABLE sales_order_item DROP COLUMN line_amount;
ALTER TABLE sales_order_item
  ADD COLUMN line_amount NUMERIC(19,4) GENERATED ALWAYS AS (qty_ordered * unit_price) STORED;

ALTER TABLE goods_issue
  ADD CONSTRAINT ck_gi_status CHECK (status IN ('DRAFT','POSTED','CANCELLED')),
  ADD CONSTRAINT ck_gi_posted CHECK ((status = 'POSTED') = (posted_at IS NOT NULL)),
  ADD CONSTRAINT ck_gi_cancelled CHECK ((status = 'CANCELLED') = (cancelled_at IS NOT NULL));

ALTER TABLE goods_issue_item
  ADD CONSTRAINT ck_gi_item_qty CHECK (qty > 0);

-- ---------------------------------------------------------------------
-- 3. Kho
-- ---------------------------------------------------------------------
ALTER TABLE inventory_adjustment
  ADD CONSTRAINT ck_adj_status CHECK (status IN ('DRAFT','POSTED','CANCELLED')),
  ADD CONSTRAINT ck_adj_reason CHECK (reason IN ('STOCKTAKE','DAMAGED','LOST','OTHER')),
  ADD CONSTRAINT ck_adj_posted CHECK ((status = 'POSTED') = (posted_at IS NOT NULL)),
  ADD CONSTRAINT ck_adj_cancelled CHECK ((status = 'CANCELLED') = (cancelled_at IS NOT NULL));

ALTER TABLE inventory_adjustment_item
  ADD CONSTRAINT ck_adj_item_qty_change CHECK (qty_change <> 0);

-- Tuyến phòng thủ cuối cùng chống tồn âm
ALTER TABLE inventory_balance
  ADD CONSTRAINT ck_inventory_non_negative CHECK (qty_on_hand >= 0);

ALTER TABLE inventory_transaction
  ADD CONSTRAINT ck_inv_txn_type CHECK (txn_type IN ('RECEIPT','ISSUE','ADJUST_IN','ADJUST_OUT','TRANSFER_IN','TRANSFER_OUT','REVERSAL')),
  ADD CONSTRAINT ck_inv_txn_qty_change CHECK (qty_change <> 0),
  ADD CONSTRAINT ck_inv_txn_qty_after CHECK (qty_after >= 0),
  ADD CONSTRAINT ck_inv_txn_ref_type CHECK (ref_type IN ('GR','GI','ADJ','TRF'));

-- Sổ cái kho chỉ được ghi thêm; sửa sai bằng bút toán đảo (REVERSAL)
CREATE OR REPLACE FUNCTION fn_inventory_txn_immutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'inventory_transaction là append-only; hãy tạo bút toán đảo (REVERSAL)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_txn_immutable
    BEFORE UPDATE OR DELETE ON inventory_transaction
    FOR EACH ROW EXECUTE FUNCTION fn_inventory_txn_immutable();

ALTER TABLE doc_sequence ADD CONSTRAINT ck_doc_sequence_last_value CHECK (last_value >= 0);

-- ---------------------------------------------------------------------
-- 4. View đối soát
-- ---------------------------------------------------------------------
-- Như schema.sql: chỉ trả các cặp lệch (kết quả đúng là rỗng)
CREATE VIEW v_inventory_reconcile AS
SELECT b.product_id, b.warehouse_id, b.qty_on_hand,
       COALESCE(SUM(t.qty_change), 0) AS ledger_qty
FROM inventory_balance b
LEFT JOIN inventory_transaction t
       ON t.product_id = b.product_id AND t.warehouse_id = b.warehouse_id
GROUP BY b.product_id, b.warehouse_id, b.qty_on_hand
HAVING b.qty_on_hand <> COALESCE(SUM(t.qty_change), 0);

-- Bổ sung: mọi cặp (kể cả khớp), kèm số bút toán; bắt được cả bút toán không có dòng tồn
CREATE VIEW v_inventory_reconcile_all AS
WITH ledger AS (
    SELECT product_id, warehouse_id, SUM(qty_change) AS ledger_qty, COUNT(*) AS txn_count
    FROM inventory_transaction
    GROUP BY product_id, warehouse_id
)
SELECT COALESCE(b.product_id, l.product_id)                       AS product_id,
       COALESCE(b.warehouse_id, l.warehouse_id)                   AS warehouse_id,
       COALESCE(b.qty_on_hand, 0)                                 AS qty_on_hand,
       COALESCE(l.ledger_qty, 0)                                  AS ledger_qty,
       COALESCE(b.qty_on_hand, 0) - COALESCE(l.ledger_qty, 0)     AS diff,
       COALESCE(l.txn_count, 0)::int                              AS txn_count,
       COALESCE(b.qty_on_hand, 0) = COALESCE(l.ledger_qty, 0)     AS is_match
FROM inventory_balance b
FULL OUTER JOIN ledger l
       ON l.product_id = b.product_id AND l.warehouse_id = b.warehouse_id;
