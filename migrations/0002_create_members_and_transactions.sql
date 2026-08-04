-- 2. 会员表
CREATE TABLE IF NOT EXISTS members (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       name TEXT NOT NULL,
                                       phone TEXT NOT NULL UNIQUE,
                                       cardcode TEXT NOT NULL UNIQUE,
                                       balance REAL NOT NULL DEFAULT 0,              -- 余额
                                       points INTEGER NOT NULL DEFAULT 0,            -- 积分
                                       remark TEXT DEFAULT '',                        -- 备注
                                       created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),  -- 创建时间
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),  -- 更新时间
    expired_at TEXT DEFAULT NULL                   -- 到期时间（NULL 表示永不过期）
    );

-- 3. 交易/变动流水表
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'balance' (余额) or 'points' (积分)
    amount REAL NOT NULL, -- 变动金额/数量（正数增加，负数减少）
    balance_after REAL NOT NULL, -- 变动后的余额/积分快照
    remark TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
