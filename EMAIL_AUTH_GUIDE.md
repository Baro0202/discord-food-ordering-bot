# Email Authentication Guide

Hướng dẫn đăng ký và đăng nhập với email domain **@ticketbox.vn**.

## 🎯 Tính năng

- ✅ Chỉ cho phép email `@ticketbox.vn`
- ✅ Đăng ký với email + mật khẩu
- ✅ Đăng nhập với email + mật khẩu
- ✅ Kiểm tra domain bằng regex
- ✅ Password strength indicator
- ✅ Email confirmation
- ✅ Responsive design với shadcn/ui

## 🔧 Setup

### 1. Environment Variables

Tạo file `web/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Service role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Next.js Configuration
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3001
```

### 2. Supabase Email Settings

1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project → **Authentication** → **Settings**
3. Configure email settings:
   - **Enable email confirmations**: ON
   - **Secure email change**: ON
   - **Enable email verification**: ON

### 3. Database Setup (Optional)

Nếu muốn custom profiles table:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 📧 Email Domain Validation

Regex pattern sử dụng:

```javascript
/^[a-zA-Z0-9._%+-]+@ticketbox\.vn$/i;
```

**Cho phép:**

- ✅ `john.doe@ticketbox.vn`
- ✅ `jane_smith@ticketbox.vn`
- ✅ `user123@ticketbox.vn`
- ✅ `test+tag@ticketbox.vn`

**Không cho phép:**

- ❌ `user@gmail.com`
- ❌ `admin@ticketbox.com`
- ❌ `@ticketbox.vn`
- ❌ `user@subdomain.ticketbox.vn`

## 🚀 Usage

### Đăng ký mới:

1. Vào `/auth/signup`
2. Nhập họ tên, email `@ticketbox.vn`, mật khẩu
3. Kiểm tra email để confirm

### Đăng nhập:

1. Vào `/auth/login`
2. Nhập email `@ticketbox.vn` và mật khẩu
3. Redirect đến `/menu`

### Trong code:

```javascript
import { useAuth } from "../providers/AuthProvider";

function MyComponent() {
  const { user, signIn, signUp, signOut, validateEmailDomain } = useAuth();

  // Check user
  if (user) {
    console.log("Logged in:", user.email);
  }

  // Validate email
  const isValid = validateEmailDomain("user@ticketbox.vn"); // true

  return (
    <div>
      {user ? (
        <button onClick={signOut}>Đăng xuất</button>
      ) : (
        <Link href="/auth/login">Đăng nhập</Link>
      )}
    </div>
  );
}
```

## 🔒 Security Features

- **Email domain restriction**: Chỉ `@ticketbox.vn`
- **Password strength**: Minimum 6 characters, có indicator
- **Email confirmation**: Required để activate account
- **Client + Server validation**: Double check security
- **Supabase Auth**: Built-in security với JWT tokens

## 🎨 UI Components

Sử dụng **shadcn/ui** components:

- `Card`, `CardHeader`, `CardContent`
- `Input`, `Label`, `Button`
- `AlertCircle` cho error messages
- Gradient backgrounds
- Responsive design
- Loading states
- Password strength indicator

## 🛠 Troubleshooting

### Email không gửi được

- Kiểm tra Supabase email settings
- Verify SMTP configuration
- Check spam folder

### Domain validation lỗi

- Đảm bảo email chính xác format
- Kiểm tra regex pattern
- Case-insensitive validation

### Redirect sau login không đúng

- Kiểm tra `router.push("/menu")` trong login handler
- Verify Next.js routing setup

## ✅ Test Cases

```bash
# Valid emails
user@ticketbox.vn ✅
john.doe@ticketbox.vn ✅
admin123@ticketbox.vn ✅

# Invalid emails
user@gmail.com ❌
admin@company.com ❌
test@ticketbox.com ❌
```

## 📱 Mobile Experience

- Responsive design cho mobile
- Touch-friendly buttons
- Proper keyboard types
- Auto-focus và auto-complete
- Gradient backgrounds scale properly

---

**Đã setup xong! Giờ chỉ nhân viên TicketBox mới có thể đăng ký và sử dụng web app.**
