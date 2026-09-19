-- CreateTable
CREATE TABLE "app_user" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "title" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency" (
    "code" CHAR(3) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "decimals" SMALLINT NOT NULL DEFAULT 2,
    "is_base" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "currency_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "exchange_rate" (
    "id" BIGSERIAL NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "rate_date" DATE NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "source" VARCHAR(30),
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "tax_code" VARCHAR(30),
    "country_code" CHAR(2),
    "default_currency" CHAR(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "tax_code" VARCHAR(30),
    "address" TEXT,
    "country_code" CHAR(2),
    "default_currency" CHAR(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" BIGSERIAL NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "uom" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" BIGSERIAL NOT NULL,
    "po_no" VARCHAR(30) NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "order_date" DATE NOT NULL,
    "expected_date" DATE,
    "currency_code" CHAR(3) NOT NULL,
    "exchange_rate" DECIMAL(18,6) NOT NULL,
    "exchange_rate_source" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "total_amount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "total_amount_base" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "terms" TEXT,
    "note" TEXT,
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" BIGINT,
    "cancel_reason" TEXT,
    "closed_at" TIMESTAMPTZ(6),
    "closed_by" BIGINT,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_item" (
    "id" BIGSERIAL NOT NULL,
    "po_id" BIGINT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "qty_ordered" DECIMAL(18,4) NOT NULL,
    "qty_received" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(19,4) NOT NULL,
    "line_amount" DECIMAL(19,4),

    CONSTRAINT "purchase_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt" (
    "id" BIGSERIAL NOT NULL,
    "gr_no" VARCHAR(30) NOT NULL,
    "receipt_type" VARCHAR(20) NOT NULL DEFAULT 'PURCHASE',
    "po_id" BIGINT,
    "supplier_id" BIGINT,
    "customer_id" BIGINT,
    "so_id" BIGINT,
    "warehouse_id" BIGINT NOT NULL,
    "receipt_date" DATE NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "exchange_rate" DECIMAL(18,6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "posted_at" TIMESTAMPTZ(6),
    "posted_by" BIGINT,
    "note" TEXT,
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" BIGINT,
    "cancel_reason" TEXT,

    CONSTRAINT "goods_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_item" (
    "id" BIGSERIAL NOT NULL,
    "gr_id" BIGINT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "po_item_id" BIGINT,
    "product_id" BIGINT NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,
    "unit_cost" DECIMAL(19,4) NOT NULL,
    "unit_cost_base" DECIMAL(19,4) NOT NULL,

    CONSTRAINT "goods_receipt_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "id" BIGSERIAL NOT NULL,
    "so_no" VARCHAR(30) NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "order_date" DATE NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "exchange_rate" DECIMAL(18,6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "total_amount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "total_amount_base" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "salesperson_id" BIGINT,
    "ship_to_address" TEXT,
    "default_warehouse_id" BIGINT,
    "payment_terms" VARCHAR(255),
    "note" TEXT,
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" BIGINT,
    "cancel_reason" TEXT,
    "closed_at" TIMESTAMPTZ(6),
    "closed_by" BIGINT,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_item" (
    "id" BIGSERIAL NOT NULL,
    "so_id" BIGINT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "qty_ordered" DECIMAL(18,4) NOT NULL,
    "qty_issued" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(19,4) NOT NULL,
    "line_amount" DECIMAL(19,4),

    CONSTRAINT "sales_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_issue" (
    "id" BIGSERIAL NOT NULL,
    "gi_no" VARCHAR(30) NOT NULL,
    "so_id" BIGINT,
    "warehouse_id" BIGINT NOT NULL,
    "issue_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "posted_at" TIMESTAMPTZ(6),
    "posted_by" BIGINT,
    "note" TEXT,
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" BIGINT,
    "cancel_reason" TEXT,

    CONSTRAINT "goods_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_issue_item" (
    "id" BIGSERIAL NOT NULL,
    "gi_id" BIGINT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "so_item_id" BIGINT,
    "product_id" BIGINT NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,
    "unit_cost_base" DECIMAL(19,4),

    CONSTRAINT "goods_issue_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_adjustment" (
    "id" BIGSERIAL NOT NULL,
    "adj_no" VARCHAR(30) NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "adj_date" DATE NOT NULL,
    "reason" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "posted_at" TIMESTAMPTZ(6),
    "posted_by" BIGINT,
    "note" TEXT,
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" BIGINT,
    "cancel_reason" TEXT,

    CONSTRAINT "inventory_adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_adjustment_item" (
    "id" BIGSERIAL NOT NULL,
    "adj_id" BIGINT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "product_id" BIGINT NOT NULL,
    "qty_system" DECIMAL(18,4) NOT NULL,
    "qty_counted" DECIMAL(18,4),
    "qty_change" DECIMAL(18,4) NOT NULL,
    "unit_cost_base" DECIMAL(19,4),

    CONSTRAINT "inventory_adjustment_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_balance" (
    "product_id" BIGINT NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "qty_on_hand" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "avg_cost" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_inventory_balance" PRIMARY KEY ("product_id","warehouse_id")
);

-- CreateTable
CREATE TABLE "inventory_transaction" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "txn_type" VARCHAR(20) NOT NULL,
    "qty_change" DECIMAL(18,4) NOT NULL,
    "qty_after" DECIMAL(18,4) NOT NULL,
    "unit_cost_base" DECIMAL(19,4),
    "ref_type" VARCHAR(10) NOT NULL,
    "ref_id" BIGINT NOT NULL,
    "ref_line_id" BIGINT NOT NULL,
    "txn_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "note" TEXT,

    CONSTRAINT "inventory_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reconcile_run" (
    "id" BIGSERIAL NOT NULL,
    "run_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "run_by" BIGINT,
    "pairs_checked" INTEGER NOT NULL,
    "matched" INTEGER NOT NULL,
    "mismatched" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,

    CONSTRAINT "inventory_reconcile_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reconcile_run_line" (
    "id" BIGSERIAL NOT NULL,
    "run_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "qty_on_hand" DECIMAL(18,4) NOT NULL,
    "ledger_qty" DECIMAL(18,4) NOT NULL,
    "diff" DECIMAL(18,4) NOT NULL,
    "txn_count" INTEGER NOT NULL,

    CONSTRAINT "inventory_reconcile_run_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_sequence" (
    "doc_type" VARCHAR(10) NOT NULL,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_doc_sequence" PRIMARY KEY ("doc_type","year")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_username_key" ON "app_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "uq_currency_single_base" ON "currency"("is_base") WHERE (is_base);

-- CreateIndex
CREATE UNIQUE INDEX "uq_exchange_rate" ON "exchange_rate"("currency_code", "rate_date");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_code_key" ON "supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customer_code_key" ON "customer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "product_sku_key" ON "product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_code_key" ON "warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_po_no_key" ON "purchase_order"("po_no");

-- CreateIndex
CREATE INDEX "ix_po_supplier_date" ON "purchase_order"("supplier_id", "order_date");

-- CreateIndex
CREATE INDEX "ix_po_status" ON "purchase_order"("status");

-- CreateIndex
CREATE INDEX "ix_po_item_product" ON "purchase_order_item"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_po_item_line" ON "purchase_order_item"("po_id", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_gr_no_key" ON "goods_receipt"("gr_no");

-- CreateIndex
CREATE INDEX "ix_gr_po" ON "goods_receipt"("po_id");

-- CreateIndex
CREATE INDEX "ix_gr_warehouse_date" ON "goods_receipt"("warehouse_id", "receipt_date");

-- CreateIndex
CREATE INDEX "ix_gr_item_po_item" ON "goods_receipt_item"("po_item_id");

-- CreateIndex
CREATE INDEX "ix_gr_item_product" ON "goods_receipt_item"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_gr_item_line" ON "goods_receipt_item"("gr_id", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_so_no_key" ON "sales_order"("so_no");

-- CreateIndex
CREATE INDEX "ix_so_customer_date" ON "sales_order"("customer_id", "order_date");

-- CreateIndex
CREATE INDEX "ix_so_status" ON "sales_order"("status");

-- CreateIndex
CREATE INDEX "ix_so_item_product" ON "sales_order_item"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_so_item_line" ON "sales_order_item"("so_id", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "goods_issue_gi_no_key" ON "goods_issue"("gi_no");

-- CreateIndex
CREATE INDEX "ix_gi_so" ON "goods_issue"("so_id");

-- CreateIndex
CREATE INDEX "ix_gi_warehouse_date" ON "goods_issue"("warehouse_id", "issue_date");

-- CreateIndex
CREATE INDEX "ix_gi_item_so_item" ON "goods_issue_item"("so_item_id");

-- CreateIndex
CREATE INDEX "ix_gi_item_product" ON "goods_issue_item"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_gi_item_line" ON "goods_issue_item"("gi_id", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_adjustment_adj_no_key" ON "inventory_adjustment"("adj_no");

-- CreateIndex
CREATE UNIQUE INDEX "uq_adj_item_line" ON "inventory_adjustment_item"("adj_id", "line_no");

-- CreateIndex
CREATE INDEX "ix_inv_balance_warehouse" ON "inventory_balance"("warehouse_id");

-- CreateIndex
CREATE INDEX "ix_inv_txn_product_wh_time" ON "inventory_transaction"("product_id", "warehouse_id", "txn_at", "id");

-- CreateIndex
CREATE INDEX "ix_inv_txn_ref" ON "inventory_transaction"("ref_type", "ref_id");

-- CreateIndex
CREATE INDEX "ix_inv_txn_time" ON "inventory_transaction"("txn_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_inv_txn_ref_line" ON "inventory_transaction"("ref_type", "ref_line_id", "txn_type");

-- CreateIndex
CREATE INDEX "ix_reconcile_run_time" ON "inventory_reconcile_run"("run_at");

-- AddForeignKey
ALTER TABLE "exchange_rate" ADD CONSTRAINT "exchange_rate_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currency"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exchange_rate" ADD CONSTRAINT "exchange_rate_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_default_currency_fkey" FOREIGN KEY ("default_currency") REFERENCES "currency"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_default_currency_fkey" FOREIGN KEY ("default_currency") REFERENCES "currency"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currency"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "sales_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currency"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt" ADD CONSTRAINT "goods_receipt_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt_item" ADD CONSTRAINT "goods_receipt_item_gr_id_fkey" FOREIGN KEY ("gr_id") REFERENCES "goods_receipt"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt_item" ADD CONSTRAINT "goods_receipt_item_po_item_id_fkey" FOREIGN KEY ("po_item_id") REFERENCES "purchase_order_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_receipt_item" ADD CONSTRAINT "goods_receipt_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currency"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_default_warehouse_id_fkey" FOREIGN KEY ("default_warehouse_id") REFERENCES "warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "sales_order"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_order_item" ADD CONSTRAINT "sales_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_issue" ADD CONSTRAINT "goods_issue_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "sales_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_issue" ADD CONSTRAINT "goods_issue_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_issue" ADD CONSTRAINT "goods_issue_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_issue" ADD CONSTRAINT "goods_issue_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_issue" ADD CONSTRAINT "goods_issue_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_issue_item" ADD CONSTRAINT "goods_issue_item_gi_id_fkey" FOREIGN KEY ("gi_id") REFERENCES "goods_issue"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_issue_item" ADD CONSTRAINT "goods_issue_item_so_item_id_fkey" FOREIGN KEY ("so_item_id") REFERENCES "sales_order_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goods_issue_item" ADD CONSTRAINT "goods_issue_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_adjustment" ADD CONSTRAINT "inventory_adjustment_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_adjustment" ADD CONSTRAINT "inventory_adjustment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_adjustment" ADD CONSTRAINT "inventory_adjustment_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_adjustment" ADD CONSTRAINT "inventory_adjustment_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_adjustment_item" ADD CONSTRAINT "inventory_adjustment_item_adj_id_fkey" FOREIGN KEY ("adj_id") REFERENCES "inventory_adjustment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_adjustment_item" ADD CONSTRAINT "inventory_adjustment_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_reconcile_run" ADD CONSTRAINT "inventory_reconcile_run_run_by_fkey" FOREIGN KEY ("run_by") REFERENCES "app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_reconcile_run_line" ADD CONSTRAINT "inventory_reconcile_run_line_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "inventory_reconcile_run"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_reconcile_run_line" ADD CONSTRAINT "inventory_reconcile_run_line_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_reconcile_run_line" ADD CONSTRAINT "inventory_reconcile_run_line_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
