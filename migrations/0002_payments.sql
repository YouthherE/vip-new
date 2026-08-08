-- ============================================
-- 支付模块 — B扫C（商家扫用户）支付架构
-- ============================================

-- 1. 支付记录表
CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_no      TEXT    NOT NULL UNIQUE,
    order_no        TEXT,
    method          TEXT    NOT NULL,          -- 'wechat' | 'alipay' | 'cash' | 'unknown'
    auth_code       TEXT,                      -- 脱敏后的付款码 auth_code
    amount          REAL    NOT NULL,
    transaction_id  TEXT,                      -- 支付平台返回的交易流水号
    status          TEXT    NOT NULL DEFAULT 'pending',  -- pending | processing | success | failed | closed | refunded
    raw_request     TEXT,                      -- 请求原样 JSON（脱敏后）
    raw_response    TEXT,                      -- 支付平台响应 JSON
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_payments_order_no   ON payments(order_no);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 2. 订单表增加支付追踪字段
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN payment_id    INTEGER;
ALTER TABLE orders ADD COLUMN payment_time  TEXT;
