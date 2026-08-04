-- Add order_id and balance_before to transactions table
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE,
-- so these will fail if columns already exist (which is harmless)

ALTER TABLE transactions ADD COLUMN order_id INTEGER;
ALTER TABLE transactions ADD COLUMN balance_before REAL;
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
