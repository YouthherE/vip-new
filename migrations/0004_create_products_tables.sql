-- 4. 商品表
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    regular_price REAL NOT NULL DEFAULT 0,
    member_price REAL NOT NULL DEFAULT 0,
    image TEXT,
    status TEXT DEFAULT 'listed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);


