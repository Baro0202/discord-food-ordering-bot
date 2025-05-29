# 🚀 Hướng dẫn Deploy Discord Bot lên Cloud

Để bot chạy 24/7, bạn cần deploy lên cloud hosting. Dưới đây là hướng dẫn chi tiết.

## 🎯 Railway (Khuyến nghị - Miễn phí)

### Bước 1: Chuẩn bị

1. **Push code lên GitHub**:

   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Kiểm tra file cần thiết**:
   - ✅ `Procfile` (đã có)
   - ✅ `railway.json` (đã có)
   - ✅ `package.json` với script `start` (đã có)

### Bước 2: Deploy lên Railway

1. **Truy cập**: https://railway.app/
2. **Đăng nhập** bằng GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Chọn repository** của bot
5. **Deploy** → Railway sẽ tự động build và deploy

### Bước 3: Cấu hình Environment Variables

Trong Railway dashboard, vào tab **Variables** và thêm:

```
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_USER_ID=your_discord_user_id
ORDER_CHANNEL_ID=your_order_channel_id
ORDER_DEADLINE=10:00
NODE_ENV=production
```

### Bước 4: Database (Supabase)

- **Supabase** đã được tích hợp sẵn
- Không cần cấu hình thêm

---

## 🔥 Alternatives

### 1. Render (Free Tier)

```bash
# Tạo file render.yaml
services:
  - type: web
    name: discord-food-bot
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### 2. Heroku (Có phí ~$7/tháng)

```bash
heroku create your-bot-name
heroku config:set DISCORD_TOKEN=your_token
heroku config:set SUPABASE_URL=your_url
# ... other env vars
git push heroku main
```

### 3. VPS (Vultr, DigitalOcean)

```bash
# Trên VPS Ubuntu
sudo apt update
sudo apt install nodejs npm

git clone your-repo
cd your-repo
npm install

# Setup PM2 for process management
npm install -g pm2
pm2 start src/index.js --name "food-bot"
pm2 startup
pm2 save
```

---

## 📊 So sánh options

| Platform    | Giá                 | Uptime    | Ease    | Database        |
| ----------- | ------------------- | --------- | ------- | --------------- |
| **Railway** | 🟢 Free ($5 credit) | 🟢 24/7   | 🟢 Easy | 🟢 PostgreSQL   |
| **Render**  | 🟡 Free (limits)    | 🟡 Sleeps | 🟢 Easy | 🟡 External     |
| **Heroku**  | 🔴 $7/month         | 🟢 24/7   | 🟢 Easy | 🟢 PostgreSQL   |
| **VPS**     | 🟡 $3-5/month       | 🟢 24/7   | 🔴 Hard | 🟢 Full control |

---

## ✅ Checklist Deploy

**Trước khi deploy:**

- [ ] Push code lên GitHub
- [ ] Test bot locally với `npm start`
- [ ] Kiểm tra tất cả environment variables
- [ ] Test database connection

**Sau khi deploy:**

- [ ] Kiểm tra logs không có lỗi
- [ ] Test `/menu` command
- [ ] Test `/admin` commands
- [ ] Kiểm tra health check endpoint
- [ ] Setup monitoring alerts (optional)

---

## 🆘 Troubleshooting

### Bot không online?

```bash
# Kiểm tra logs
# Railway: View logs trong dashboard
# VPS: pm2 logs food-bot
```

### Database error?

- Kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY
- Verify database tables tồn tại
- Test connection với `npm run setup`

### Commands không work?

```bash
# Re-deploy commands
npm run deploy
```

### Health check fails?

- Ensure PORT environment variable được set
- Railway tự động set PORT
- VPS: set PORT=3000

---

## 📞 Support

Nếu gặp issue:

1. Check logs đầu tiên
2. Verify environment variables
3. Test locally trước
4. Google error message cụ thể

**Railway** là option tốt nhất cho beginners! 🎯
