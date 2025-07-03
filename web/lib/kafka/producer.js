const { Kafka } = require("kafkajs");
const { kafkaConfig, topics, eventTypes } = require("./config");

class WebKafkaProducer {
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
      console.log("[WEB-KAFKA] Kafka producer disabled");
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log("[WEB-KAFKA] Producer connected successfully");
    } catch (error) {
      console.error("[WEB-KAFKA] Failed to connect producer:", error);
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
        console.log("[WEB-KAFKA] Producer disconnected");
      } catch (error) {
        console.error("[WEB-KAFKA] Error disconnecting producer:", error);
      }
    }
  }

  // Generic event publisher
  async publishEvent(topic, eventType, data, key = null) {
    if (!this.enabled || !this.isConnected) {
      console.log(
        `[WEB-KAFKA] Skipping event ${eventType} - producer not available`
      );
      return;
    }

    try {
      const eventPayload = {
        eventType,
        timestamp: new Date().toISOString(),
        source: "web-food-app",
        data,
      };

      const message = {
        key: key,
        value: JSON.stringify(eventPayload),
        headers: {
          eventType,
          source: "web-food-app",
          timestamp: eventPayload.timestamp,
        },
      };

      await this.producer.send({
        topic,
        messages: [message],
      });

      console.log(`[WEB-KAFKA] Event published to ${topic}: ${eventType}`);
    } catch (error) {
      console.error(`[WEB-KAFKA] Failed to publish event ${eventType}:`, error);
      // Don't throw - graceful degradation
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
    return this.publishOrderEvent(eventTypes.ORDER_CREATED, order);
  }

  async orderUpdated(order, previousStatus = null) {
    return this.publishOrderEvent(eventTypes.ORDER_UPDATED, {
      ...order,
      previousStatus,
    });
  }

  async orderCancelled(order) {
    return this.publishOrderEvent(eventTypes.ORDER_CANCELLED, order);
  }

  async orderConfirmed(order) {
    return this.publishOrderEvent(eventTypes.ORDER_CONFIRMED, order);
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
    return this.publishPaymentEvent(eventTypes.PAYMENT_INITIATED, paymentData);
  }

  async paymentCompleted(paymentData) {
    return this.publishPaymentEvent(eventTypes.PAYMENT_COMPLETED, paymentData);
  }

  async paymentFailed(paymentData) {
    return this.publishPaymentEvent(eventTypes.PAYMENT_FAILED, paymentData);
  }

  // User Events
  async publishUserEvent(eventType, userData) {
    return this.publishEvent(
      topics.USERS,
      eventType,
      userData,
      userData.id?.toString()
    );
  }

  async userCreated(user) {
    return this.publishUserEvent(eventTypes.USER_CREATED, user);
  }

  async userUpdated(user) {
    return this.publishUserEvent(eventTypes.USER_UPDATED, user);
  }

  // Notification Events
  async publishNotificationEvent(eventType, notificationData) {
    return this.publishEvent(topics.NOTIFICATIONS, eventType, notificationData);
  }

  async sendNotification(type, recipient, content) {
    return this.publishNotificationEvent(eventTypes.NOTIFICATION_SEND, {
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

  // Get connection status
  getStatus() {
    return {
      enabled: this.enabled,
      connected: this.isConnected,
      clientId: kafkaConfig.clientId,
    };
  }
}

// Singleton instance
let instance = null;

function getWebKafkaProducer() {
  if (!instance) {
    instance = new WebKafkaProducer();
  }
  return instance;
}

module.exports = {
  WebKafkaProducer,
  getWebKafkaProducer,
};
