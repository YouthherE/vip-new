-- 操作日志表：记录功能菜单中每一项操作
CREATE TABLE IF NOT EXISTS product_operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,
    target_id INTEGER,
    operator_id INTEGER DEFAULT 0,
    action TEXT NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_target ON product_operation_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON product_operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON product_operation_logs(created_at);
