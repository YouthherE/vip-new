-- ============================================================
-- 星光儿童乐园 · 企业邮箱模块
-- 运行方式：
--   本地：npx wrangler d1 execute nextjs-db --local --file=migrations/0002_email.sql
--   远程：npx wrangler d1 execute nextjs-db --remote --file=migrations/0002_email.sql
-- ============================================================

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
    use_mailchannels INTEGER NOT NULL DEFAULT 1,           -- 优先使用 MailChannels（Cloudflare Workers 免费）
    status           TEXT    NOT NULL DEFAULT 'inactive',   -- active | inactive
    created_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 插入默认配置（未激活）
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_inbox_uid      ON email_inbox(message_uid);
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
