-- Add new columns to members table
ALTER TABLE members ADD COLUMN gender TEXT DEFAULT 'unknown'; -- male, female, unknown
ALTER TABLE members ADD COLUMN address TEXT;
ALTER TABLE members ADD COLUMN channel TEXT; -- e.g., 'wechat', 'web', 'referral'
ALTER TABLE members ADD COLUMN status TEXT DEFAULT 'active'; -- active, disabled
