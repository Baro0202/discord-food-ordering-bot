# 🛡️ HƯỚNG DẪN MIGRATION AN TOÀN - WEB APP

## ❗ QUAN TRỌNG: ĐẢM BẢO DISCORD BOT HOẠT ĐỘNG BÌNH THƯỜNG

Tài liệu này đảm bảo rằng việc thêm web app **KHÔNG ẢNH HƯỞNG** đến Discord bot hiện tại.

## 🔄 QUY TRÌNH AN TOÀN

### 1. BACKUP TRƯỚC KHI MIGRATION

```sql
-- Chạy file: database/backup_before_web_migration.sql
-- Tạo backup tất cả dữ liệu hiện tại
```

### 2. MIGRATION STRATEGY

- ✅ **CHỈ THÊM** bảng mới
- ✅ **CHỈ THÊM** cột mới với DEFAULT values
- ❌ **KHÔNG SỬA ĐỔI** dữ liệu existing
- ❌ **KHÔNG XÓA** bất kỳ thứ gì

### 3. DATABASE CHANGES

#### ✅ An toàn - Chỉ thêm cột:

```sql
-- Thêm cột với DEFAULT values
ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'discord';
ALTER TABLE orders ADD COLUMN order_source VARCHAR(20) DEFAULT 'discord';
```

#### ✅ An toàn - Tạo bảng mới:

```sql
-- Bảng riêng cho web users
CREATE TABLE profiles (...);
CREATE TABLE web_user_mapping (...);
```

#### ❌ KHÔNG làm:

```sql
-- KHÔNG sửa đổi cột existing
-- KHÔNG xóa dữ liệu
-- KHÔNG thay đổi constraints existing
```

## 🔒 ISOLATION STRATEGY

### Discord Bot (Existing)

- Sử dụng `users` table với `user_type = 'discord'`
- Sử dụng `orders` table với `order_source = 'discord'`
- **KHÔNG có RLS** - hoạt động như hiện tại
- **KHÔNG thay đổi logic** hiện tại

### Web App (New)

- Sử dụng `profiles` table riêng biệt
- Tạo orders với `order_source = 'web'`
- **CÓ RLS** chỉ cho web users
- **Độc lập** với Discord logic

## 📋 CHECKLIST TRƯỚC KHI MIGRATION

### ✅ Pre-Migration

- [ ] Backup database hiện tại
- [ ] Test Discord bot hoạt động bình thường
- [ ] Kiểm tra tất cả commands Discord
- [ ] Backup `.env` file
- [ ] Có rollback plan

### ✅ During Migration

- [ ] Chạy migration trong maintenance window
- [ ] Test từng bước
- [ ] Verify Discord bot vẫn hoạt động
- [ ] Check logs cho errors

### ✅ Post-Migration

- [ ] Discord bot commands vẫn work
- [ ] Existing users vẫn đặt được hàng
- [ ] Data integrity check
- [ ] Performance test

## 🧪 TESTING PLAN

### 1. Pre-Migration Test

```bash
# Test Discord bot
npm run dev
# Thử các commands: /menu, /admin orders, etc.
```

### 2. Post-Migration Test

```bash
# 1. Test Discord bot vẫn hoạt động
npm run dev
# Test all existing features

# 2. Test web app
npm run web:dev
# Test registration, login, etc.

# 3. Test data isolation
# - Discord orders không xuất hiện trong web
# - Web orders có source = 'web'
```

## 🔄 ROLLBACK PLAN

Nếu có vấn đề, chạy rollback:

```sql
-- File: database/rollback_web_migration.sql
-- Xóa tất cả thay đổi cho web app
-- Discord bot sẽ hoạt động như trước
```

## 📊 DATA FLOW

### Discord Bot (Không đổi)

```
Discord User → Discord Bot → users (user_type='discord') → orders (source='discord')
```

### Web App (Mới)

```
Web User → Supabase Auth → profiles → orders (source='web')
```

### Shared Data (Read-only)

```
Both → menu_items, daily_menus, settings (read-only)
```

## 🚨 WARNING SIGNS

Dừng migration nếu thấy:

- Discord bot commands báo lỗi
- Existing users không đặt được hàng
- Performance degradation
- Data inconsistency

## 💡 BEST PRACTICES

### 1. Gradual Rollout

- Migration trong giờ ít traffic
- Test với 1-2 web users trước
- Monitor Discord bot activity

### 2. Monitoring

```sql
-- Check Discord bot data
SELECT COUNT(*) FROM users WHERE user_type = 'discord';
SELECT COUNT(*) FROM orders WHERE order_source = 'discord';

-- Check web app data
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM orders WHERE order_source = 'web';
```

### 3. Performance

- Index mới không ảnh hưởng queries cũ
- RLS chỉ áp dụng cho bảng mới
- Web app sử dụng connection pool riêng

## 🔧 TROUBLESHOOTING

### Discord Bot Issues

```bash
# Restart Discord bot
npm run start

# Check logs
tail -f logs/bot.log

# Test specific commands
# Use Discord to test /menu, /admin orders
```

### Database Issues

```sql
-- Verify table structure
\d users;
\d orders;

-- Check data integrity
SELECT user_type, COUNT(*) FROM users GROUP BY user_type;
SELECT order_source, COUNT(*) FROM orders GROUP BY order_source;
```

### Web App Issues

```bash
# Check Supabase connection
# Go to Supabase Dashboard → Database

# Verify RLS policies
# Go to Authentication → Policies
```

## 📞 SUPPORT

Nếu có vấn đề:

1. Chạy rollback script ngay lập tức
2. Restore từ backup nếu cần
3. Kiểm tra Discord bot hoạt động
4. Debug từng bước

## ✅ SUCCESS CRITERIA

Migration thành công khi:

- ✅ Discord bot hoạt động 100% như trước
- ✅ Existing users đặt hàng bình thường
- ✅ Web app chạy được
- ✅ Data isolated properly
- ✅ Performance không giảm
