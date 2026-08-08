-- ============================================================
-- 星光儿童乐园 · 数据库初始化迁移
-- 运行方式：
--   本地：npx wrangler d1 execute nextjs-db --local --file=migrations/0001_init.sql
--   远程：npx wrangler d1 execute nextjs-db --remote --file=migrations/0001_init.sql
-- ============================================================

-- -------------------------------------------------------
-- 1. 用户表（员工/管理员）
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    avatar          TEXT,
    bio             TEXT,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    role            TEXT    DEFAULT 'admin',
    status          INTEGER DEFAULT 1,
    created_by      INTEGER DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_by      INTEGER DEFAULT 0,
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- -------------------------------------------------------
-- 2. 会员表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    phone       TEXT    NOT NULL UNIQUE,
    cardcode    TEXT    NOT NULL UNIQUE,
    balance     REAL    NOT NULL DEFAULT 0,
    points      INTEGER NOT NULL DEFAULT 0,
    gender      TEXT    DEFAULT 'unknown',
    address     TEXT,
    channel     TEXT,
    status      TEXT    DEFAULT 'active',
    cartype     TEXT    DEFAULT 'unknown',
    remark      TEXT    DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    expired_at  TEXT
);

-- -------------------------------------------------------
-- 3. 交易 / 变动流水表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id       INTEGER NOT NULL,
    order_id        INTEGER,
    type            TEXT    NOT NULL,
    amount          REAL    NOT NULL,
    balance_after   REAL    NOT NULL,
    balance_before  REAL,
    remark          TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);

-- -------------------------------------------------------
-- 4. 商品表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    code            TEXT    DEFAULT '',
    regular_price   REAL    NOT NULL DEFAULT 0,
    member_price    REAL    NOT NULL DEFAULT 0,
    image           TEXT,
    status          TEXT    DEFAULT 'listed',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- -------------------------------------------------------
-- 5. 订单主表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no        TEXT    NOT NULL UNIQUE,
    member_id       INTEGER,
    member_name     TEXT,
    member_phone    TEXT,
    operator_id     INTEGER DEFAULT 0,
    operator_name   TEXT    DEFAULT '',
    price_type      TEXT    NOT NULL DEFAULT 'normal',
    total_amount    REAL    NOT NULL,
    item_count      INTEGER NOT NULL DEFAULT 0,
    balance_before  REAL,
    balance_after   REAL,
    status          INTEGER NOT NULL DEFAULT 1,
    payment_method  TEXT    DEFAULT '',
    payment_id      INTEGER,
    payment_time    TEXT,
    remark          TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (member_id) REFERENCES members(id)
);
CREATE INDEX IF NOT EXISTS idx_orders_member_id   ON orders(member_id);
CREATE INDEX IF NOT EXISTS idx_orders_price_type  ON orders(price_type);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at);

-- -------------------------------------------------------
-- 6. 订单明细表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL,
    product_id      INTEGER NOT NULL,
    product_name    TEXT    NOT NULL,
    product_image   TEXT,
    normal_price    REAL    NOT NULL,
    member_price    REAL    NOT NULL,
    sold_price      REAL    NOT NULL,
    price_type      TEXT    NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    entry_count     INTEGER NOT NULL DEFAULT 0,
    subtotal        REAL    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- -------------------------------------------------------
-- 7. 入园人数每日计数表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS entry_counts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date      TEXT    NOT NULL,
    product_id      INTEGER NOT NULL,
    product_name    TEXT    NOT NULL,
    count           INTEGER DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE(entry_date, product_id)
);

-- -------------------------------------------------------
-- 8. 操作日志表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_operation_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type     TEXT    NOT NULL,
    target_id       INTEGER,
    operator_id     INTEGER DEFAULT 0,
    action          TEXT    NOT NULL,
    content         TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_logs_target      ON product_operation_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_logs_action      ON product_operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_created_at  ON product_operation_logs(created_at);

-- -------------------------------------------------------
-- 9. 支付记录表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_no      TEXT    NOT NULL UNIQUE,
    order_no        TEXT,
    method          TEXT    NOT NULL,                              -- wechat | alipay | cash | unknown
    auth_code       TEXT,                                           -- 脱敏后的付款码
    amount          REAL    NOT NULL,
    transaction_id  TEXT,                                           -- 支付平台返回的交易流水号
    status          TEXT    NOT NULL DEFAULT 'pending',            -- pending | processing | success | failed | closed | refunded
    raw_request     TEXT,                                           -- 请求原样 JSON（脱敏后）
    raw_response    TEXT,                                           -- 支付平台响应 JSON
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_payments_order_no   ON payments(order_no);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- -------------------------------------------------------
-- 10. 默认 admin 用户设为超级管理员
-- -------------------------------------------------------
UPDATE users SET role = 'super_admin' WHERE username = 'admin';
