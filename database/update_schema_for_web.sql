-- Migration script to add web app support to existing Discord bot database
-- Run this in your Supabase SQL Editor

-- 1. Add new columns to users table to support both Discord and Web users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'discord',
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. Add order_source column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_source VARCHAR(20) DEFAULT 'discord';

-- 3. Create profiles table for additional user data (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create user_sessions table for linking auth users to orders
CREATE TABLE IF NOT EXISTS user_sessions (
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
  session_type VARCHAR(20) DEFAULT 'web',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (auth_user_id, app_user_id)
);

-- 5. Update indexes
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_order_source ON orders(order_source);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 6. Enable Row Level Security (RLS) for web app tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 8. Create RLS policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can create own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- 9. Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 11. Create function to sync profile updates
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for profile updates
DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_profile_update();

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_sessions TO anon, authenticated;

-- 14. Update existing data (optional)
-- Mark existing users as Discord users if not already set
UPDATE users SET user_type = 'discord' WHERE user_type IS NULL;
UPDATE orders SET order_source = 'discord' WHERE order_source IS NULL;

COMMENT ON TABLE profiles IS 'Extended user profiles for web app users';
COMMENT ON TABLE user_sessions IS 'Links Supabase Auth users to app users';
COMMENT ON COLUMN users.user_type IS 'Type of user: discord, web, or mobile';
COMMENT ON COLUMN orders.order_source IS 'Source of order: discord, web, or mobile';