-- 1. 用户表（基础核心表，关联所有业务表的创建人/更新人）
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL, -- 用户昵称
    password_hash TEXT NOT NULL, -- 存储加密后的密码
    avatar TEXT, -- 用户头像URL
    status INTEGER DEFAULT 1, -- 1:正常 0:禁用
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER DEFAULT 0, -- 自注册用户默认0
    updated_by INTEGER DEFAULT 0
);


INSERT INTO "users" ("id", "username", "password_hash", "avatar", "status", "created_at", "updated_at", "created_by", "updated_by") VALUES (1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', NULL, 1, '2026-02-10 07:51:01', '2026-02-10 07:51:01', 0, 0);