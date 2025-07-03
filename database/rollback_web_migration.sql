-- ROLLBACK SCRIPT: Khôi phục về trạng thái trước khi migration
-- CHỈ CHẠY NẾU CÓ VẤN ĐỀ VỚI WEB APP

-- =====================================================
-- BƯỚC 1: XÓA TRIGGERS VÀ FUNCTIONS MỚI
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_web_user();

-- =====================================================
-- BƯỚC 2: XÓA RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Web users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Web users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Web users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own mapping" ON web_user_mapping;
DROP POLICY IF EXISTS "Users can create own mapping" ON web_user_mapping;

-- =====================================================
-- BƯỚC 3: DISABLE RLS CHO BẢNG MỚI
-- =====================================================

ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS web_user_mapping DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- BƯỚC 4: XÓA BẢNG MỚI (GIỮ LẠI DATA CŨ)
-- =====================================================

-- Backup data trước khi xóa (nếu cần)
CREATE TABLE IF NOT EXISTS deleted_profiles_backup AS SELECT * FROM profiles;
CREATE TABLE IF NOT EXISTS deleted_web_mapping_backup AS SELECT * FROM web_user_mapping;

-- Xóa bảng mới
DROP TABLE IF EXISTS web_user_mapping;
DROP TABLE IF EXISTS profiles;

-- =====================================================
-- BƯỚC 5: XÓA CỘT MỚI (TÙY CHỌN - CẨN THẬN!)
-- =====================================================

-- CẢNH BÁO: Chỉ chạy nếu chắc chắn muốn xóa hoàn toàn
-- COMMENT OUT các dòng này nếu muốn giữ cột để sau này dùng lại

-- ALTER TABLE users DROP COLUMN IF EXISTS user_type;
-- ALTER TABLE users DROP COLUMN IF EXISTS email;
-- ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
-- ALTER TABLE users DROP COLUMN IF EXISTS phone;
-- ALTER TABLE orders DROP COLUMN IF EXISTS order_source;

-- =====================================================
-- BƯỚC 6: XÓA INDEXES MỚI
-- =====================================================

DROP INDEX IF EXISTS idx_users_user_type;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_orders_order_source;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_auth_user_id;

-- =====================================================
-- BƯỚC 7: REVOKE PERMISSIONS
-- =====================================================

-- REVOKE ALL ON public.profiles FROM anon, authenticated;
-- REVOKE ALL ON public.web_user_mapping FROM anon, authenticated;

-- =====================================================
-- BƯỚC 8: VERIFICATION - ĐẢM BẢO DISCORD BOT VẪN HOẠT ĐỘNG
-- =====================================================

-- Kiểm tra tất cả bảng Discord bot vẫn hoạt động
SELECT 'users' as table_name, COUNT(*) as count FROM users;
SELECT 'orders' as table_name, COUNT(*) as count FROM orders;
SELECT 'menu_items' as table_name, COUNT(*) as count FROM menu_items;
SELECT 'daily_menus' as table_name, COUNT(*) as count FROM daily_menus;
SELECT 'settings' as table_name, COUNT(*) as count FROM settings;

-- Kiểm tra structure
\d users;
\d orders;

-- =====================================================
-- BƯỚC 9: RESTORE FROM BACKUP (NẾU CẦN)
-- =====================================================

-- Chỉ chạy nếu có vấn đề nghiêm trọng và cần restore hoàn toàn
/*
-- Khôi phục từ backup
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS daily_menus CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE users AS SELECT * FROM backup_users;
CREATE TABLE orders AS SELECT * FROM backup_orders;
CREATE TABLE menu_items AS SELECT * FROM backup_menu_items;
CREATE TABLE daily_menus AS SELECT * FROM backup_daily_menus;
CREATE TABLE settings AS SELECT * FROM backup_settings;

-- Recreate constraints and indexes
-- (Copy from original schema)
*/

-- =====================================================
-- BƯỚC 10: LOG ROLLBACK
-- =====================================================

INSERT INTO settings (key, value, description, updated_at) VALUES
('web_migration_rollback_at', NOW()::TEXT, 'Web migration rolled back successfully', NOW())
ON CONFLICT (key) DO UPDATE SET
  value = NOW()::TEXT,
  updated_at = NOW();

-- =====================================================
-- BƯỚC 11: CLEANUP BACKUP TABLES (TÙY CHỌN)
-- =====================================================

-- Uncommment nếu muốn xóa backup tables
-- DROP TABLE IF EXISTS backup_menu_items;
-- DROP TABLE IF EXISTS backup_daily_menus;
-- DROP TABLE IF EXISTS backup_orders;
-- DROP TABLE IF EXISTS backup_users;
-- DROP TABLE IF EXISTS backup_settings;
-- DROP TABLE IF EXISTS deleted_profiles_backup;
-- DROP TABLE IF EXISTS deleted_web_mapping_backup;