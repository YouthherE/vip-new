-- ============================================================
-- 星光儿童乐园 · 数据库初始化迁移
-- 运行方式：
--   本地：npx wrangler d1 execute nextjs-db --local --file=migrations/0001_init.sql
--   远程：npx wrangler d1 execute nextjs-db --remote --file=migrations/0001_init.sql
-- ============================================================

-- -------------------------------------------------------
-- 支付平台配置表（超级管理员可在"功能配置"中管理）
-- DB 中配置的参数优先于环境变量
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_configs (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    -- 微信支付
    wechat_app_id           TEXT DEFAULT '',
    wechat_mch_id           TEXT DEFAULT '',
    wechat_api_v3_key       TEXT DEFAULT '',
    wechat_private_key      TEXT DEFAULT '',
    wechat_cert_serial_no   TEXT DEFAULT '',
    wechat_notify_url       TEXT DEFAULT '',
    -- 支付宝
    alipay_app_id           TEXT DEFAULT '',
    alipay_private_key      TEXT DEFAULT '',
    alipay_public_key       TEXT DEFAULT '',
    -- 通用字段
    status                  TEXT DEFAULT 'inactive',
    created_at              TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

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

-- -------------------------------------------------------
-- 11. 邮箱配置表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_configs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    smtp_host        TEXT    NOT NULL DEFAULT '',
    smtp_port        INTEGER NOT NULL DEFAULT 587,
    smtp_secure      INTEGER NOT NULL DEFAULT 0,          -- 0=STARTTLS, 1=SSL
    smtp_user        TEXT    NOT NULL DEFAULT '',
    smtp_pass        TEXT    NOT NULL DEFAULT '',           -- 加密存储
    imap_host        TEXT    NOT NULL DEFAULT '',
    imap_port        INTEGER NOT NULL DEFAULT 993,
    imap_secure      INTEGER NOT NULL DEFAULT 1,           -- 0=无, 1=SSL
    imap_user        TEXT    NOT NULL DEFAULT '',
    imap_pass        TEXT    NOT NULL DEFAULT '',           -- 加密存储
    from_name        TEXT    NOT NULL DEFAULT '星光儿童乐园',
    from_address     TEXT    NOT NULL DEFAULT '',
    reply_to         TEXT    DEFAULT '',
    signature        TEXT    DEFAULT '',
    use_mailchannels INTEGER NOT NULL DEFAULT 1,           -- 优先使用 MailChannels
    status           TEXT    NOT NULL DEFAULT 'inactive',   -- active | inactive
    created_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 插入默认邮箱配置
INSERT OR IGNORE INTO email_configs (id, status) VALUES (1, 'inactive');

-- -------------------------------------------------------
-- 12. 收件箱表（从 IMAP 同步的邮件）
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_inbox (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    message_uid     TEXT,                                    -- IMAP UID
    message_id      TEXT,                                    -- Message-ID header
    from_address    TEXT    NOT NULL,
    from_name       TEXT    DEFAULT '',
    to_address      TEXT    DEFAULT '',
    reply_to        TEXT    DEFAULT '',
    subject         TEXT    NOT NULL DEFAULT '',
    body_text       TEXT,
    body_html       TEXT,
    has_attachment  INTEGER DEFAULT 0,
    is_read         INTEGER DEFAULT 0,
    is_starred      INTEGER DEFAULT 0,
    is_deleted      INTEGER DEFAULT 0,
    received_at     TEXT    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_inbox_uid       ON email_inbox(message_uid);
CREATE INDEX IF NOT EXISTS idx_email_inbox_received         ON email_inbox(received_at);
CREATE INDEX IF NOT EXISTS idx_email_inbox_is_read          ON email_inbox(is_read);

-- -------------------------------------------------------
-- 13. 发件箱表（已发送邮件记录）
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_outbox (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    to_address      TEXT    NOT NULL,
    to_name         TEXT    DEFAULT '',
    cc_address      TEXT    DEFAULT '',
    bcc_address     TEXT    DEFAULT '',
    subject         TEXT    NOT NULL DEFAULT '',
    body_text       TEXT,
    body_html       TEXT,
    reply_to        TEXT    DEFAULT '',
    has_attachment  INTEGER DEFAULT 0,
    status          TEXT    NOT NULL DEFAULT 'pending',      -- pending | sent | failed
    error_message   TEXT,
    sent_at         TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_email_outbox_status     ON email_outbox(status);
CREATE INDEX IF NOT EXISTS idx_email_outbox_created_at ON email_outbox(created_at);

-- -------------------------------------------------------
-- 14. 邮箱草稿表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_drafts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    to_address      TEXT    NOT NULL DEFAULT '',
    to_name         TEXT    DEFAULT '',
    cc_address      TEXT    DEFAULT '',
    subject         TEXT    NOT NULL DEFAULT '',
    body_html       TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
