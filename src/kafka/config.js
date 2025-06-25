require("dotenv").config();

const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || "discord-food-bot",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT) || 3000,
  requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT) || 30000,
  retry: {
    retries: parseInt(process.env.KAFKA_RETRIES) || 5,
    initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME) || 100,
    maxRetryTime: parseInt(process.env.KAFKA_MAX_RETRY_TIME) || 30000,
  },
  // SSL config for production
  ssl:
    process.env.KAFKA_SSL_ENABLED === "true"
      ? {
          rejectUnauthorized:
            process.env.KAFKA_SSL_REJECT_UNAUTHORIZED !== "false",
          ca: process.env.KAFKA_SSL_CA,
          key: process.env.KAFKA_SSL_KEY,
          cert: process.env.KAFKA_SSL_CERT,
        }
      : false,
  // SASL for authentication
  sasl:
    process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD
      ? {
          mechanism: process.env.KAFKA_SASL_MECHANISM || "plain",
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD,
        }
      : undefined,
};

const topics = {
  ORDERS: process.env.KAFKA_TOPIC_ORDERS || "food-orders",
  PAYMENTS: process.env.KAFKA_TOPIC_PAYMENTS || "payments",
  USERS: process.env.KAFKA_TOPIC_USERS || "users",
  NOTIFICATIONS: process.env.KAFKA_TOPIC_NOTIFICATIONS || "notifications",
};

module.exports = {
  kafkaConfig,
  topics,
};
