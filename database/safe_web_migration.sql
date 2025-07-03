-- SAFE WEB MIGRATION: Chỉ thêm tính năng mới, KHÔNG sửa đổi dữ liệu hiện tại
-- Discord bot sẽ tiếp tục hoạt động bình thường

-- =====================================================
-- BƯỚC 1: CHỈ THÊM CỘT MỚI (KHÔNG SỬA ĐỔI EXISTING)
-- =====================================================

-- Thêm cột mới vào users table (với DEFAULT values an toàn)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'discord';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Thêm cột mới vào orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_source VARCHAR(20) DEFAULT 'discord';

-- =====================================================
-- BƯỚC 2: TẠO BẢNG MỚI CHO WEB APP (KHÔNG ẢNH HƯỞNG CŨ)
-- =====================================================

-- Bảng profiles riêng cho web users (KHÔNG liên quan đến users cũ)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- Reference to Supabase auth.users
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng mapping giữa web auth và app users (OPTIONAL, không bắt buộc)
CREATE TABLE IF NOT EXISTS web_user_mapping (
  id SERIAL PRIMARY KEY,
  auth_user_id UUID NOT NULL, -- Supabase auth user
  app_user_id VARCHAR(255), -- Có thể NULL ban đầu
  mapping_type VARCHAR(20) DEFAULT 'web',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(auth_user_id)
);

-- =====================================================
-- BƯỚC 3: TẠO INDEXES (KHÔNG ẢNH HƯỞNG PERFORMANCE CŨ)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_order_source ON orders(order_source);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-- =====================================================
-- BƯỚC 4: RLS CHỈ CHO BẢNG MỚI (KHÔNG ẢNH HƯỞNG CŨ)
-- =====================================================

-- Chỉ enable RLS cho bảng mới
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_user_mapping ENABLE ROW LEVEL SECURITY;

-- KHÔNG enable RLS cho bảng cũ để Discord bot hoạt động bình thường

-- =====================================================
-- BƯỚC 5: POLICIES CHỈ CHO WEB APP
-- =====================================================

-- Policies cho profiles
CREATE POLICY "Web users can view own profile" ON profiles
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Web users can update own profile" ON profiles
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Web users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Policies cho mapping table
CREATE POLICY "Users can view own mapping" ON web_user_mapping
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can create own mapping" ON web_user_mapping
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- =====================================================
-- BƯỚC 6: FUNCTIONS VÀ TRIGGERS CHỈ CHO WEB
-- =====================================================

-- Function tạo profile cho web user mới
CREATE OR REPLACE FUNCTION public.handle_new_web_user()
RETURNS trigger AS $$
BEGIN
  -- Chỉ tạo profile, KHÔNG động vào bảng users cũ
  INSERT INTO public.profiles (auth_user_id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger chỉ cho Supabase auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_web_user();

-- =====================================================
-- BƯỚC 7: PERMISSIONS CHỈ CHO BẢNG MỚI
-- =====================================================

-- Grant permissions cho bảng mới
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.web_user_mapping TO anon, authenticated;

-- =====================================================
-- BƯỚC 8: CẬP NHẬT DỮ LIỆU AN TOÀN
-- =====================================================

-- Chỉ cập nhật NULL values, KHÔNG đổi dữ liệu existing
UPDATE users SET user_type = 'discord' WHERE user_type IS NULL;
UPDATE orders SET order_source = 'discord' WHERE order_source IS NULL;

-- =====================================================
-- BƯỚC 9: VERIFICATION
-- =====================================================

-- Kiểm tra Discord bot data vẫn intact
SELECT 'Discord Users Count' as check_name, COUNT(*) as count FROM users WHERE user_type = 'discord';
SELECT 'Discord Orders Count' as check_name, COUNT(*) as count FROM orders WHERE order_source = 'discord';
SELECT 'Menu Items Count' as check_name, COUNT(*) as count FROM menu_items;
SELECT 'Daily Menus Count' as check_name, COUNT(*) as count FROM daily_menus;

-- =====================================================
-- COMMENTS VÀ DOCUMENTATION
-- =====================================================

COMMENT ON TABLE profiles IS 'Web app user profiles - SEPARATE from Discord users';
COMMENT ON TABLE web_user_mapping IS 'Optional mapping between web auth and app users';
COMMENT ON COLUMN users.user_type IS 'discord (existing) | web (new) | mobile (future)';
COMMENT ON COLUMN orders.order_source IS 'discord (existing) | web (new) | mobile (future)';

-- Log migration completion
INSERT INTO settings (key, value, description, updated_at) VALUES
('web_migration_completed_at', NOW()::TEXT, 'Safe web migration completed successfully', NOW())
ON CONFLICT (key) DO UPDATE SET
  value = NOW()::TEXT,
  updated_at = NOW();