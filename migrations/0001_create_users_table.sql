-- 1. 用户表（基础核心表，关联所有业务表的创建人/更新人）
CREATE TABLE users (
                       id              INTEGER PRIMARY KEY AUTOINCREMENT,
                       username        TEXT    NOT NULL UNIQUE,
                       password_hash   TEXT    NOT NULL,
                       avatar          TEXT,
                       bio             TEXT,
                       phone           TEXT,
                       email           TEXT,
                       address         TEXT,
                       status          INTEGER DEFAULT 1,
                       created_by      INTEGER DEFAULT 0,
                       created_at      TEXT    DEFAULT (datetime('now', 'localtime')),
                       updated_by      INTEGER DEFAULT 0,
                       updated_at      TEXT    DEFAULT (datetime('now', 'localtime'))
);
-- INSERT INTO "users" ("id", "username", "password_hash", "avatar", "status", "created_at", "updated_at", "created_by", "updated_by") VALUES (1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', NULL, 1, '2026-02-10 07:51:01', '2026-02-10 07:51:01', 0, 0);