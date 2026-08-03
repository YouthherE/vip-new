-- 6. 订单主表
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    member_id INTEGER,
    member_name TEXT,
    member_phone TEXT,
    price_type TEXT NOT NULL DEFAULT 'normal',
    total_amount REAL NOT NULL,
    item_count INTEGER NOT NULL DEFAULT 0,
    balance_before REAL,
    balance_after REAL,
    status INTEGER NOT NULL DEFAULT 1,
    remark TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_member_id ON orders(member_id);
CREATE INDEX IF NOT EXISTS idx_orders_price_type ON orders(price_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 7. 订单明细表
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    normal_price REAL NOT NULL,
    member_price REAL NOT NULL,
    sold_price REAL NOT NULL,
    price_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Add missing columns to transactions (if not already present)
-- SQLite doesn't support ADD COLUMN IF NOT EXISTS, but these will fail silently if columns already exist
-- Run these individually; errors on duplicates are harmless
-- ALTER TABLE transactions ADD COLUMN order_id INTEGER;
-- ALTER TABLE transactions ADD COLUMN balance_before REAL;
