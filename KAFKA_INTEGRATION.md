# Kafka Integration Documentation

## Tổng quan

Dự án đã được tích hợp Kafka để hỗ trợ kiến trúc event-driven mà **không ảnh hưởng đến logic và database hiện tại**. Kafka integration được thiết kế để:

- ✅ Không thay đổi luồng xử lý hiện tại
- ✅ Không ảnh hưởng đến database schema
- ✅ Có thể bật/tắt Kafka mà không làm crash ứng dụng
- ✅ Graceful degradation khi Kafka không khả dụng

## Kiến trúc

```
Discord Bot (Main Flow)
       ↓
Enhanced Database Wrapper
       ↓
┌─ Supabase (Original) ──→ Return to Bot
└─ Kafka Producer ──→ Event Topics (Non-blocking)
```

## Environment Variables

Thêm các biến sau vào file `.env`:

```bash
# Kafka Configuration
KAFKA_ENABLED=true
KAFKA_CLIENT_ID=discord-food-bot
KAFKA_BROKERS=localhost:9092
KAFKA_CONNECTION_TIMEOUT=3000
KAFKA_REQUEST_TIMEOUT=30000
KAFKA_RETRIES=5

# Kafka Topics
KAFKA_TOPIC_ORDERS=food-orders
KAFKA_TOPIC_PAYMENTS=payments
KAFKA_TOPIC_USERS=users
KAFKA_TOPIC_NOTIFICATIONS=notifications

# Production Kafka (Optional)
KAFKA_SSL_ENABLED=false
KAFKA_USERNAME=
KAFKA_PASSWORD=
```

## Event Types

### Order Events

- `order.created` - Khi order mới được tạo
- `order.updated` - Khi order được cập nhật
- `order.confirmed` - Khi order được xác nhận
- `order.cancelled` - Khi order bị hủy

### Payment Events

- `payment.initiated` - Khi thanh toán được khởi tạo
- `payment.completed` - Khi thanh toán hoàn thành
- `payment.failed` - Khi thanh toán thất bại

### User Events

- `user.created` - Khi user mới được tạo
- `user.updated` - Khi user được cập nhật

### Notification Events

- `notification.send` - Gửi thông báo

## Event Schema

Tất cả events có cấu trúc:

```json
{
  "eventType": "order.created",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "discord-food-bot",
  "data": {
    // Event-specific data
  }
}
```

## Deployment Options

### Option 1: Disable Kafka (Default/Safe)

```bash
KAFKA_ENABLED=false
```

Bot sẽ hoạt động bình thường như trước, không có Kafka.

### Option 2: Local Kafka Development

```bash
# Start Kafka với Docker
docker run -d \
  --name kafka \
  -p 9092:9092 \
  apache/kafka:latest

# Enable trong .env
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
```

### Option 3: Production Kafka

Sử dụng Confluent Cloud, AWS MSK, hoặc self-managed Kafka cluster.

## Monitoring

### Health Check

GET `/health` endpoint bây giờ bao gồm Kafka status:

```json
{
  "status": "OK",
  "uptime": 12345,
  "kafka": {
    "enabled": true,
    "healthy": true
  }
}
```

### Logs

Kafka events được log với prefix `[KAFKA]`:

```
[KAFKA] Producer connected successfully
[KAFKA] Event published to food-orders: order.created
[KAFKA] Failed to publish event: Connection error
```

## Consumer Examples

### Order Analytics Consumer

```javascript
// consumers/orderAnalytics.js
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "order-analytics",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "analytics-group" });

async function start() {
  await consumer.connect();
  await consumer.subscribe({ topic: "food-orders" });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());

      if (event.eventType === "order.created") {
        // Analytics logic
        console.log("New order analytics:", event.data);
      }
    },
  });
}

start().catch(console.error);
```

### Email Notification Consumer

```javascript
// consumers/emailNotifications.js
const { Kafka } = require("kafkajs");

const consumer = kafka.consumer({ groupId: "email-group" });

await consumer.subscribe({ topics: ["food-orders", "payments"] });

await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());

    switch (event.eventType) {
      case "order.confirmed":
        await sendOrderConfirmationEmail(event.data);
        break;
      case "payment.completed":
        await sendPaymentReceiptEmail(event.data);
        break;
    }
  },
});
```

## Migration Guide

### Bước 1: Cài đặt Dependencies

```bash
npm install kafkajs
```

### Bước 2: Cập nhật Environment

Sao chép từ `env.example` và cập nhật Kafka settings.

### Bước 3: Test với Kafka Disabled

```bash
KAFKA_ENABLED=false npm start
```

Verify bot hoạt động bình thường.

### Bước 4: Enable Kafka

```bash
KAFKA_ENABLED=true npm start
```

Check logs cho Kafka connection.

### Bước 5: Deploy Consumers

Deploy các microservices consumer để xử lý events.

## Troubleshooting

### Bot không start

1. Check `KAFKA_ENABLED=false` để disable Kafka
2. Verify environment variables
3. Check Kafka broker connectivity

### Events không được publish

1. Check Kafka health: GET `/health`
2. Verify topic names
3. Check logs cho connection errors

### Performance Issues

1. Kafka publish là non-blocking
2. Failed publishes không ảnh hưởng main flow
3. Monitor memory usage cho producer connections

## Best Practices

1. **Always graceful degradation**: App hoạt động khi Kafka down
2. **Idempotent consumers**: Events có thể được replay
3. **Monitor lag**: Kafka consumer lag
4. **Schema evolution**: Backwards compatible event changes
5. **Testing**: Test với Kafka enabled/disabled

## Security

### Production Kafka

```bash
KAFKA_SSL_ENABLED=true
KAFKA_USERNAME=your_username
KAFKA_PASSWORD=your_password
KAFKA_SASL_MECHANISM=SCRAM-SHA-256
```

### Network Security

- Restrict Kafka broker access
- Use VPC/private networks
- Enable encryption in transit

## Future Enhancements

1. **Dead Letter Queues**: Cho failed events
2. **Event Replay**: Administrative tools
3. **Schema Registry**: Event schema management
4. **Metrics**: Prometheus/Grafana integration
5. **Multi-tenant**: Separate topics per guild

## Support

- Kafka logs: Check `[KAFKA]` prefixed messages
- Health endpoint: `/health` for status
- Disable quickly: Set `KAFKA_ENABLED=false`
