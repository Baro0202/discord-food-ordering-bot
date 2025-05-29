# 🚀 Hướng dẫn Migration từ SQLite sang Supabase

## 📋 **Bước 1: Tạo Supabase Project**

1. **Đăng ký/Đăng nhập** tại: https://supabase.com
2. **Tạo new project**:

   - Chọn Organization
   - Đặt tên project: `discord-food-bot`
   - Tạo mật khẩu mạnh cho database
   - Chọn region gần nhất (Singapore cho VN)
   - Click **Create new project**

3. **Đợi project khởi tạo** (1-2 phút)

## 📋 **Bước 2: Lấy Database Credentials**

1. Vào **Settings** → **API**
2. Copy các thông tin:
   - **Project URL** (SUPABASE_URL)
   - **anon/public key** (SUPABASE_ANON_KEY)

## 📋 **Bước 3: Cập nhật Environment Variables**

1. **Cập nhật file `.env`**:

```env
# Thêm Supabase config
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 📋 **Bước 4: Tạo Database Schema**

1. **Vào SQL Editor** trong Supabase Dashboard
2. **Copy và chạy SQL này**:

```sql
-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(50) DEFAULT 'main',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily menus table
CREATE TABLE IF NOT EXISTS daily_menus (
  id SERIAL PRIMARY KEY,
  menu_date DATE UNIQUE NOT NULL,
  menu_items INTEGER[],
  special_note TEXT,
  delivery_time TIME DEFAULT '12:00',
  order_deadline TIME DEFAULT '10:00',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  menu_date DATE NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  preferences JSONB,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_order_at TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_menu_date ON orders(menu_date);
CREATE INDEX IF NOT EXISTS idx_daily_menus_date ON daily_menus(menu_date);
```

3. **Click "RUN"** để tạo tables

## 📋 **Bước 5: Import Sample Data**

1. **Chạy script setup**:

```bash
yarn setup-supabase
```

2. **Hoặc import data thủ công** trong SQL Editor:

```sql
-- Sample menu items
INSERT INTO menu_items (name, description, price, category) VALUES
('Cơm tấm sườn nướng', 'Cơm tấm thơm ngon với sườn nướng BBQ', 35000, 'main'),
('Phở bò tái', 'Phở bò truyền thống với nước dầm đậm đà', 45000, 'soup'),
('Bún chả Hà Nội', 'Bún chả truyền thống với chả nướng thơm lừng', 40000, 'main'),
('Trà đá', 'Trà đá mát lạnh, giải khát', 5000, 'drink'),
('Chè ba màu', 'Chè ba màu mát lạnh, ngọt ngào', 18000, 'dessert');

-- Today's menu
INSERT INTO daily_menus (menu_date, menu_items, special_note) VALUES
(CURRENT_DATE, ARRAY[1,2,3,4,5], 'Menu đặc biệt hôm nay!');
```

## 📋 **Bước 6: Kiểm tra Migration**

1. **Khởi động bot**:

```bash
yarn start
```

2. **Test các chức năng**:
   - `/menu` - Xem menu
   - `/admin additem` - Thêm món mới
   - Đặt hàng và thanh toán

## 🎉 **Lợi ích của Supabase**

### ✅ **Immediate Benefits:**

- **No more local file**: Database trên cloud
- **Real-time**: Có thể thêm live updates
- **Dashboard**: Quản lý data bằng GUI
- **Backup tự động**: An toàn dữ liệu
- **Scalable**: Hỗ trợ nhiều user hơn

### ✅ **Future Features (có thể thêm sau):**

- **Real-time notifications**: Order updates tức thì
- **Analytics dashboard**: Thống kê chi tiết
- **Multiple restaurants**: Scale lên nhiều nhà hàng
- **Mobile app**: Tích hợp app mobile
- **Webhooks**: Tích hợp payment gateway

## 🚨 **Lưu ý quan trọng**

### **Security:**

- Supabase key đã được cấu hình **Row Level Security (RLS)**
- Chỉ bot được quyền truy cập database
- API key public an toàn cho client-side

### **Pricing:**

- **Free tier**: 500MB storage, 50,000 rows
- **Upgrade when needed**: $25/month cho unlimited

### **Backup:**

- Supabase tự động backup daily
- Export data bất cứ lúc nào qua Dashboard

## 📞 **Hỗ trợ**

- **Supabase Docs**: https://supabase.com/docs
- **Discord Community**: https://discord.supabase.com
- **GitHub Issues**: Báo bug trong repo này
