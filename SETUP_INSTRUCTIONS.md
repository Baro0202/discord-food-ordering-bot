# 🚀 HƯỚNG DẪN SETUP WEB APP

## ⚡ SETUP NHANH (5 phút)

### 1. Cài đặt dependencies cho web app

```bash
# Từ thư mục gốc project
cd web
npm install
```

### 2. Cấu hình environment

```bash
# Copy file env
cp .env.local.example .env.local

# Chỉnh sửa .env.local với thông tin Supabase của bạn
```

### 3. Chạy migration database (AN TOÀN)

```sql
-- Trong Supabase SQL Editor, chạy từng file theo thứ tự:
-- 1. database/backup_before_web_migration.sql (backup)
-- 2. database/safe_web_migration.sql (migration)
```

### 4. Chạy web app

```bash
# Từ thư mục web/
npm run dev
```

### 5. Chạy Discord bot (riêng biệt)

```bash
# Từ thư mục gốc
npm run dev
```

## 🔧 Cấu hình .env.local

Tạo file `web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3001
```

## ✅ Kiểm tra hoạt động

1. **Discord bot**: http://localhost:3000 (health check)
2. **Web app**: http://localhost:3001
3. **Test**:
   - Discord bot vẫn hoạt động bình thường
   - Web app có thể đăng ký/đăng nhập
   - Dữ liệu riêng biệt

## 🆘 Nếu có lỗi

### Lỗi "pages or app directory"

```bash
cd web
ls -la  # Kiểm tra có thư mục app/ không
```

### Lỗi Supabase connection

- Kiểm tra NEXT_PUBLIC_SUPABASE_URL trong .env.local
- Verify API keys trong Supabase dashboard

### Discord bot không hoạt động

```bash
# Rollback migration
# Chạy: database/rollback_web_migration.sql
```

## 📂 Cấu trúc project sau setup

```
subcription-tracker/
├── src/                    # Discord bot (không đổi)
├── web/                    # Next.js web app
│   ├── app/               # Next.js app directory
│   ├── lib/               # Supabase clients
│   ├── package.json       # Web dependencies
│   └── .env.local         # Web environment
├── database/              # Migration scripts
├── package.json           # Main dependencies
└── .env                   # Discord bot environment
```
