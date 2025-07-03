-- BACKUP SCRIPT: Chạy trước khi thực hiện web migration
-- Tạo backup của tất cả dữ liệu hiện tại

-- 1. Backup existing tables structure and data
CREATE TABLE IF NOT EXISTS backup_menu_items AS SELECT * FROM menu_items;
CREATE TABLE IF NOT EXISTS backup_daily_menus AS SELECT * FROM daily_menus;
CREATE TABLE IF NOT EXISTS backup_orders AS SELECT * FROM orders;
CREATE TABLE IF NOT EXISTS backup_users AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS backup_settings AS SELECT * FROM settings;

-- 2. Log backup info
INSERT INTO settings (key, value, description, updated_at) VALUES
('backup_created_at', NOW()::TEXT, 'Backup created before web app migration', NOW())
ON CONFLICT (key) DO UPDATE SET
  value = NOW()::TEXT,
  updated_at = NOW();

-- 3. Verify backup
SELECT
  'menu_items' as table_name,
  (SELECT COUNT(*) FROM menu_items) as original_count,
  (SELECT COUNT(*) FROM backup_menu_items) as backup_count
UNION ALL
SELECT
  'daily_menus' as table_name,
  (SELECT COUNT(*) FROM daily_menus) as original_count,
  (SELECT COUNT(*) FROM backup_daily_menus) as backup_count
UNION ALL
SELECT
  'orders' as table_name,
  (SELECT COUNT(*) FROM orders) as original_count,
  (SELECT COUNT(*) FROM backup_orders) as backup_count
UNION ALL
SELECT
  'users' as table_name,
  (SELECT COUNT(*) FROM users) as original_count,
  (SELECT COUNT(*) FROM backup_users) as backup_count;