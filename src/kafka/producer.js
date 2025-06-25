const { Kafka } = require("kafkajs");
const { kafkaConfig, topics } = require("./config");

class KafkaProducer {
  constructor() {
    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });
    this.isConnected = false;
    this.enabled = process.env.KAFKA_ENABLED !== "false";

    if (this.enabled) {
      this.connect();
    }
  }

  async connect() {
    if (!this.enabled) {
      console.log("[KAFKA] Kafka producer disabled");
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log("[KAFKA] Producer connected successfully");
    } catch (error) {
      console.error("[KAFKA] Failed to connect producer:", error);
      this.isConnected = false;
      // Retry connection after delay
      setTimeout(() => this.connect(), 5000);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      try {
        await this.producer.disconnect();
        this.isConnected = false;
        console.log("[KAFKA] Producer disconnected");
      } catch (error) {
        console.error("[KAFKA] Error disconnecting producer:", error);
      }
    }
  }

  async publishEvent(topic, eventType, data, key = null) {
    if (!this.enabled || !this.isConnected) {
      // Log cho debug nhưng không fail
      if (process.env.NODE_ENV === "development") {
        console.log(`[KAFKA] Would publish to ${topic}:`, { eventType, data });
      }
      return { success: false, reason: "not_connected" };
    }

    try {
      const message = {
        key: key || data.id?.toString() || null,
        value: JSON.stringify({
          eventType,
          timestamp: new Date().toISOString(),
          source: "discord-food-bot",
          data,
        }),
        headers: {
          "content-type": "application/json",
          "event-type": eventType,
          source: "discord-food-bot",
        },
      };

      const result = await this.producer.send({
        topic,
        messages: [message],
      });

      console.log(`[KAFKA] Event published to ${topic}:`, { eventType, key });
      return { success: true, result };
    } catch (error) {
      console.error(`[KAFKA] Failed to publish event to ${topic}:`, error);
      // Không throw error để không ảnh hưởng main flow
      return { success: false, error: error.message };
    }
  }

  // Order Events
  async publishOrderEvent(eventType, orderData) {
    return this.publishEvent(
      topics.ORDERS,
      eventType,
      orderData,
      orderData.id?.toString()
    );
  }

  async orderCreated(order) {
    return this.publishOrderEvent("order.created", order);
  }

  async orderUpdated(order, previousStatus = null) {
    return this.publishOrderEvent("order.updated", {
      ...order,
      previousStatus,
    });
  }

  async orderCancelled(order) {
    return this.publishOrderEvent("order.cancelled", order);
  }

  async orderConfirmed(order) {
    return this.publishOrderEvent("order.confirmed", order);
  }

  // Payment Events
  async publishPaymentEvent(eventType, paymentData) {
    return this.publishEvent(
      topics.PAYMENTS,
      eventType,
      paymentData,
      paymentData.orderId?.toString()
    );
  }

  async paymentInitiated(paymentData) {
    return this.publishPaymentEvent("payment.initiated", paymentData);
  }

  async paymentCompleted(paymentData) {
    return this.publishPaymentEvent("payment.completed", paymentData);
  }

  async paymentFailed(paymentData) {
    return this.publishPaymentEvent("payment.failed", paymentData);
  }

  // User Events
  async publishUserEvent(eventType, userData) {
    return this.publishEvent(
      topics.USERS,
      eventType,
      userData,
      userData.user_id
    );
  }

  async userCreated(user) {
    return this.publishUserEvent("user.created", user);
  }

  async userUpdated(user) {
    return this.publishUserEvent("user.updated", user);
  }

  // Notification Events
  async publishNotificationEvent(eventType, notificationData) {
    return this.publishEvent(topics.NOTIFICATIONS, eventType, notificationData);
  }

  async sendNotification(type, recipient, content) {
    return this.publishNotificationEvent("notification.send", {
      type,
      recipient,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  // Health check
  async isHealthy() {
    if (!this.enabled) return true;
    return this.isConnected;
  }
}

// Singleton instance
let instance = null;

function getKafkaProducer() {
  if (!instance) {
    instance = new KafkaProducer();
  }
  return instance;
}

module.exports = {
  KafkaProducer,
  getKafkaProducer,
};
