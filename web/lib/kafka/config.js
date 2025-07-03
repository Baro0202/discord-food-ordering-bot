// Kafka configuration for Web App
const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || "web-food-app",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
  connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT) || 3000,
  requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT) || 30000,
  retry: {
    initialRetryTime: 100,
    retries: parseInt(process.env.KAFKA_RETRIES) || 5,
  },
  // SSL Configuration (for production)
  ssl:
    process.env.KAFKA_SSL_ENABLED === "true"
      ? {
          rejectUnauthorized: false,
        }
      : false,
  // SASL Configuration (for production)
  sasl:
    process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD
      ? {
          mechanism: process.env.KAFKA_SASL_MECHANISM || "plain",
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD,
        }
      : undefined,
};

// Kafka Topics
const topics = {
  ORDERS: process.env.KAFKA_TOPIC_ORDERS || "food-orders",
  PAYMENTS: process.env.KAFKA_TOPIC_PAYMENTS || "payments",
  USERS: process.env.KAFKA_TOPIC_USERS || "users",
  NOTIFICATIONS: process.env.KAFKA_TOPIC_NOTIFICATIONS || "notifications",
};

// Event Types
const eventTypes = {
  // Order Events
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_CANCELLED: "order.cancelled",

  // Payment Events
  PAYMENT_INITIATED: "payment.initiated",
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",

  // User Events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",

  // Notification Events
  NOTIFICATION_SEND: "notification.send",
};

module.exports = {
  kafkaConfig,
  topics,
  eventTypes,
};
