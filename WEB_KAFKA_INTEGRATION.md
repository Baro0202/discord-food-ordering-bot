# Web App Kafka Integration

## 🎯 Tổng quan

Web app đã được tích hợp Kafka để đồng bộ với Discord bot và tạo kiến trúc event-driven thống nhất.

## 🔧 Kiến trúc

```
Web App Flow (với Kafka):
User → Web App → EnhancedWebDatabase → Supabase + Kafka Events ✅

Discord Bot Flow (có sẵn):
User → Discord → EnhancedSupabaseDatabase → Supabase + Kafka Events ✅

Unified Event Stream:
Web Events + Discord Events → Kafka Topics → Consumers
```

## 📂 Cấu trúc Code

### Files đã thêm:

```
web/
├── lib/kafka/
│   ├── config.js          # Kafka configuration
│   └── producer.js        # Kafka producer for web app
├── lib/enhancedDatabase.js # Enhanced database with Kafka
├── app/api/health/route.js # Health check with Kafka status
└── .env.example           # Environment variables template
```

### Classes:

- **WebKafkaProducer**: Kafka producer cho web app
- **EnhancedWebDatabase**: Database layer với Kafka integration

## 🚀 Setup Instructions

### 1. Cài đặt Environment Variables

Tạo file `web/.env.local`:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Kafka Configuration
KAFKA_ENABLED=true
KAFKA_CLIENT_ID=web-food-app
KAFKA_BROKERS=localhost:9092
KAFKA_CONNECTION_TIMEOUT=3000
KAFKA_REQUEST_TIMEOUT=30000
KAFKA_RETRIES=5

# Kafka Topics (phải giống Discord bot)
KAFKA_TOPIC_ORDERS=food-orders
KAFKA_TOPIC_PAYMENTS=payments
KAFKA_TOPIC_USERS=users
KAFKA_TOPIC_NOTIFICATIONS=notifications
```

### 2. Start Kafka (Development)

```bash
# Option 1: Docker Compose (recommended)
cd /path/to/subcription-tracker
docker-compose up kafka zookeeper

# Option 2: Local Kafka
docker run -d --name kafka -p 9092:9092 apache/kafka:latest
```

### 3. Start Web App

```bash
cd web
npm run dev
```

### 4. Verify Integration

Kiểm tra health endpoint:

```bash
curl http://localhost:3001/api/health
```

Response mong muốn:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45,
  "application": "web-food-app",
  "database": "connected",
  "kafka": {
    "enabled": true,
    "connected": true,
    "healthy": true,
    "clientId": "web-food-app"
  }
}
```

## 📊 Events được publish

### Order Events từ Web App:

```json
{
  "eventType": "order.created",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "web-food-app",
  "data": {
    "id": 123,
    "user_id": "auth-user-id",
    "username": "user@ticketbox.vn",
    "items": [...],
    "total_amount": 45000,
    "order_source": "web",
    "source": "web"
  }
}
```

### User Events từ Web App:

```json
{
  "eventType": "user.created",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "web-food-app",
  "data": {
    "id": "auth-user-id",
    "email": "user@ticketbox.vn",
    "created_at": "2024-01-01T12:00:00.000Z",
    "source": "web"
  }
}
```

## 🔄 Event Flow Diagram

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Web App   │───▶│    Kafka     │───▶│  Consumers  │
│  (New)      │    │   Topics     │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
                          ▲                     │
┌─────────────┐           │              ┌──────▼──────┐
│ Discord Bot │───────────┘              │ Analytics   │
│ (Existing)  │                          │ Email       │
└─────────────┘                          │ Notifications│
                                         │ Reports     │
                                         └─────────────┘
```

## 🛠 Troubleshooting

### 1. Kafka Connection Failed

```bash
# Check if Kafka is running
docker ps | grep kafka

# Check logs
docker logs kafka

# Test connection
telnet localhost 9092
```

### 2. Web App works without Kafka

Nếu Kafka down, web app vẫn hoạt động bình thường:

```bash
# Disable Kafka
KAFKA_ENABLED=false npm run dev
```

### 3. Check Event Publishing

```bash
# Monitor Kafka topics
docker exec -it kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic food-orders \
  --from-beginning
```

### 4. Debug Logs

Web app logs với prefix `[WEB-KAFKA]`:

```
[WEB-KAFKA] Producer connected successfully
[WEB-KAFKA] Event published to food-orders: order.created
[WEB-KAFKA] Failed to publish event: Connection error
```

## 🚀 Production Deployment

### 1. Kafka Cloud (Recommended)

**Confluent Cloud:**

```bash
KAFKA_ENABLED=true
KAFKA_BROKERS=your-cluster.confluent.cloud:9092
KAFKA_SSL_ENABLED=true
KAFKA_USERNAME=your-api-key
KAFKA_PASSWORD=your-api-secret
KAFKA_SASL_MECHANISM=SCRAM-SHA-256
```

**AWS MSK:**

```bash
KAFKA_ENABLED=true
KAFKA_BROKERS=your-cluster.kafka.region.amazonaws.com:9092
KAFKA_SSL_ENABLED=true
```

### 2. Self-managed Kafka

```bash
# Production docker-compose
docker-compose -f docker-compose.prod.yml up kafka zookeeper
```

## 📈 Monitoring & Analytics

### Health Monitoring

```bash
# Production health check
curl https://your-web-app.com/api/health

# Automated monitoring
watch -n 30 'curl -s https://your-web-app.com/api/health | jq .kafka'
```

### Event Analytics

Có thể tạo consumer để:

- Track order patterns từ web vs Discord
- Monitor user registration trends
- Generate real-time reports
- Send automated notifications

## 🔒 Security

### Production Best Practices:

1. **Environment Variables**: Không commit .env files
2. **Kafka Authentication**: Dùng SASL/SSL trong production
3. **Network Security**: Restrict Kafka access
4. **Data Validation**: Validate event payloads
5. **Rate Limiting**: Prevent event spam

## 🎉 Benefits

✅ **Unified Event Stream**: Web + Discord events in one place
✅ **Real-time Analytics**: Track user behavior across platforms
✅ **Scalable Architecture**: Easy to add new consumers
✅ **Graceful Degradation**: Works without Kafka
✅ **Monitoring**: Health checks and status endpoints
✅ **Future-proof**: Ready for microservices architecture

## 📝 Next Steps

1. **Deploy Consumers**: Email notifications, analytics
2. **Real-time Dashboard**: Live order tracking
3. **Admin Panel**: Kafka topic management
4. **Alerting**: Monitor event failures
5. **Event Replay**: For data recovery
