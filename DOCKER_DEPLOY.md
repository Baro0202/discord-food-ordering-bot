# 🐳 Deploy Discord Bot với Docker - 100% MIỄN PHÍ

Docker mở ra nhiều options hosting miễn phí hơn! Dưới đây là các platform tốt nhất.

## 🎯 Top 5 Platforms Miễn Phí với Docker

| Platform             | Free Tier       | Container | Database   | Uptime |
| -------------------- | --------------- | --------- | ---------- | ------ |
| **Fly.io**           | 🟢 3 apps       | 256MB RAM | PostgreSQL | 24/7   |
| **Railway**          | 🟢 $5 credit    | Unlimited | PostgreSQL | 24/7   |
| **Google Cloud Run** | 🟢 2M requests  | 1GB RAM   | Cloud SQL  | 24/7   |
| **Oracle Cloud**     | 🟢 Forever free | 1GB RAM   | MySQL      | 24/7   |
| **Render**           | 🟡 750 hours    | 512MB RAM | External   | Sleeps |

---

## 🚀 Option 1: Fly.io (Khuyến nghị)

### Bước 1: Cài đặt Fly CLI

```bash
# macOS
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux
curl -L https://fly.io/install.sh | sh
```

### Bước 2: Login và setup

```bash
fly auth login
fly launch --no-deploy
```

### Bước 3: Cấu hình fly.toml

```toml
app = "your-bot-name"
primary_region = "sin"  # Singapore

[build]

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

### Bước 4: Set environment variables

```bash
fly secrets set DISCORD_TOKEN="your_token"
fly secrets set DISCORD_CLIENT_ID="your_client_id"
fly secrets set SUPABASE_URL="your_supabase_url"
fly secrets set SUPABASE_ANON_KEY="your_supabase_key"
fly secrets set ADMIN_USER_ID="your_user_id"
fly secrets set ORDER_CHANNEL_ID="your_channel_id"
```

### Bước 5: Deploy

```bash
fly deploy
```

---

## ⚡ Option 2: Railway với Docker

### Bước 1: Tạo file railway.toml

```toml
[build]
  builder = "dockerfile"

[deploy]
  startCommand = "npm start"
  healthcheckPath = "/health"
  restartPolicyType = "on_failure"
```

### Bước 2: Deploy từ GitHub

1. Push code lên GitHub
2. Connect Railway với GitHub repo
3. Set environment variables trong Railway dashboard
4. Railway sẽ tự động detect Dockerfile và build

---

## 🔥 Option 3: Google Cloud Run

### Bước 1: Build và push image

```bash
# Build image
docker build -t gcr.io/YOUR_PROJECT_ID/discord-bot .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/discord-bot
```

### Bước 2: Deploy to Cloud Run

```bash
gcloud run deploy discord-bot \
  --image gcr.io/YOUR_PROJECT_ID/discord-bot \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --port 3000
```

---

## 🧪 Test Local với Docker

### Build và chạy

```bash
# Build image
docker build -t discord-food-bot .

# Chạy với docker-compose
docker-compose up -d

# Hoặc chạy trực tiếp
docker run -d \
  --name food-bot \
  --env-file .env \
  -p 3000:3000 \
  discord-food-bot
```

### Kiểm tra logs

```bash
# Docker Compose
docker-compose logs -f

# Docker run
docker logs -f food-bot
```

### Kiểm tra health

```bash
curl http://localhost:3000/health
```

---

## ⚙️ Docker Commands hữu ích

### Development

```bash
# Rebuild và restart
docker-compose up --build

# Chỉ restart service
docker-compose restart discord-bot

# Xem logs realtime
docker-compose logs -f discord-bot

# Vào container
docker-compose exec discord-bot sh
```

### Production

```bash
# Build optimized image
docker build --no-cache -t discord-food-bot .

# Run in background
docker run -d --restart unless-stopped \
  --name food-bot \
  --env-file .env \
  -p 3000:3000 \
  discord-food-bot

# Cleanup unused images
docker system prune -a
```

---

## 🔧 Dockerfile Explained

```dockerfile
# Multi-stage build để giảm image size
FROM node:18-alpine AS base

# Alpine Linux nhẹ và bảo mật
WORKDIR /app

# Copy package.json trước để tận dụng Docker cache
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Security: chạy với non-root user
RUN adduser -S discordbot
USER discordbot

# Health check built-in
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:3000/health

CMD ["npm", "start"]
```

---

## 📊 So sánh chi tiết

### Fly.io ⭐ (Recommend)

- ✅ **Miễn phí**: 3 apps, 256MB RAM mỗi app
- ✅ **24/7**: Không sleep
- ✅ **Edge locations**: Deploy gần user
- ✅ **PostgreSQL**: Miễn phí
- ⚠️ **Giới hạn**: 256MB RAM (đủ cho bot nhỏ)

### Railway

- ✅ **$5 credit/tháng**: Dùng được 2-3 tháng
- ✅ **Dễ dùng**: GitHub integration
- ✅ **No limits**: RAM/CPU
- ⚠️ **Hết credit**: Cần add card (nhưng không charge nếu dưới limit)

### Google Cloud Run

- ✅ **2M requests/tháng**: Miễn phí
- ✅ **1GB RAM**: Đủ dư
- ✅ **Auto scale**: 0 → N instances
- ⚠️ **Phức tạp**: Cần setup GCP

---

## 🆘 Troubleshooting

### Container không start?

```bash
# Check logs
docker logs container_name

# Common issues:
# 1. Environment variables missing
# 2. Port binding wrong
# 3. Health check failed
```

### Bot offline sau deploy?

```bash
# Test health endpoint
curl https://your-app.fly.dev/health

# Check Discord intents
# Make sure bot has correct permissions
```

### Memory issues?

```bash
# Monitor resource usage
docker stats

# Optimize Dockerfile
# Use alpine images
# Multi-stage builds
```

---

## 🎯 Recommend cho bạn

1. **Beginners**: Fly.io
2. **Intermediate**: Railway
3. **Advanced**: Google Cloud Run
4. **Self-hosted**: Docker Compose trên VPS

**Fly.io** là lựa chọn tốt nhất vì:

- Setup nhanh nhất
- Miễn phí lâu dài
- Performance tốt
- Support tốt

Chỉ cần 3 commands là xong! 🚀
