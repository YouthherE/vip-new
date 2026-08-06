-- 为 order_items 表添加入园计数快照列
-- 记录购买时的实时计数，补打票据时使用此快照值，不会因后续购买而变化
ALTER TABLE order_items ADD COLUMN entry_count INTEGER NOT NULL DEFAULT 0;
