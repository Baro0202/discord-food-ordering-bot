import { WebDatabase } from "./database";

// Only import Kafka on server-side
let getWebKafkaProducer = null;
if (typeof window === "undefined") {
  // Server-side only
  try {
    const kafkaModule = require("./kafka/producer");
    getWebKafkaProducer = kafkaModule.getWebKafkaProducer;
  } catch (error) {
    console.warn("[WEB-DB] Kafka not available:", error.message);
    getWebKafkaProducer = () => null;
  }
} else {
  // Client-side - no Kafka
  getWebKafkaProducer = () => null;
}

export class EnhancedWebDatabase extends WebDatabase {
  constructor() {
    super();
    this.kafkaProducer = getWebKafkaProducer ? getWebKafkaProducer() : null;
    this.kafkaEnabled = this.kafkaProducer !== null;
  }

  // Override createWebOrder to publish Kafka events
  async createWebOrder(authUserId, orderData) {
    try {
      // Call parent method
      const result = await super.createWebOrder(authUserId, orderData);

      if (result.data && !result.error) {
        // Publish order created event (non-blocking)
        this.publishOrderCreated(result.data).catch((error) => {
          console.error(
            "[WEB-KAFKA] Failed to publish order.created event:",
            error
          );
        });
      }

      return result;
    } catch (error) {
      console.error("[WEB-DB] Error creating web order:", error);
      throw error;
    }
  }

  // Override signUp to publish user events
  async signUp(email, password, userData = {}) {
    try {
      const result = await super.signUp(email, password, userData);

      if (result.data?.user && !result.error) {
        // Publish user created event (non-blocking)
        this.publishUserCreated(result.data.user).catch((error) => {
          console.error(
            "[WEB-KAFKA] Failed to publish user.created event:",
            error
          );
        });
      }

      return result;
    } catch (error) {
      console.error("[WEB-DB] Error during sign up:", error);
      throw error;
    }
  }

  // Override updateProfile to publish user events
  async updateProfile(authUserId, updates) {
    try {
      const result = await super.updateProfile(authUserId, updates);

      if (result.data && !result.error) {
        // Get full user data for event
        const { user } = await this.getCurrentUser();
        if (user) {
          this.publishUserUpdated(user, result.data).catch((error) => {
            console.error(
              "[WEB-KAFKA] Failed to publish user.updated event:",
              error
            );
          });
        }
      }

      return result;
    } catch (error) {
      console.error("[WEB-DB] Error updating profile:", error);
      throw error;
    }
  }

  // New method: Update order status (for admin/management)
  async updateOrderStatus(orderId, status) {
    try {
      // Get current order first
      const currentOrderResult = await this.getOrderById(orderId);
      const currentOrder = currentOrderResult.data;
      const previousStatus = currentOrder?.status;

      // Update order status
      const { data, error } = await this.supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("order_source", "web") // Security: only web orders
        .select()
        .single();

      if (!error && data) {
        // Publish status change event
        this.publishOrderStatusChanged(data, previousStatus).catch((error) => {
          console.error(
            "[WEB-KAFKA] Failed to publish order status change:",
            error
          );
        });
      }

      return { data, error };
    } catch (error) {
      console.error("[WEB-DB] Error updating order status:", error);
      throw error;
    }
  }

  // New method: Update payment status
  async updatePaymentStatus(orderId, paymentStatus) {
    try {
      // Update payment status
      const { data, error } = await this.supabase
        .from("orders")
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("order_source", "web") // Security: only web orders
        .select()
        .single();

      if (!error && data) {
        // Publish payment status change event
        this.publishPaymentStatusChanged(data, paymentStatus).catch((error) => {
          console.error(
            "[WEB-KAFKA] Failed to publish payment status change:",
            error
          );
        });
      }

      return { data, error };
    } catch (error) {
      console.error("[WEB-DB] Error updating payment status:", error);
      throw error;
    }
  }

  // Kafka event publishers (private methods)
  async publishOrderCreated(order) {
    if (!this.kafkaEnabled || !this.kafkaProducer) {
      console.log("[WEB-DB] Kafka not available, skipping order.created event");
      return;
    }
    return this.kafkaProducer.orderCreated({
      ...order,
      source: "web",
    });
  }

  async publishOrderStatusChanged(order, previousStatus) {
    if (!this.kafkaEnabled || !this.kafkaProducer) {
      console.log(
        "[WEB-DB] Kafka not available, skipping order status change event"
      );
      return;
    }
    if (order.status === "confirmed") {
      return this.kafkaProducer.orderConfirmed(order);
    } else if (order.status === "cancelled") {
      return this.kafkaProducer.orderCancelled(order);
    } else {
      return this.kafkaProducer.orderUpdated(order, previousStatus);
    }
  }

  async publishPaymentStatusChanged(order, paymentStatus) {
    if (!this.kafkaEnabled || !this.kafkaProducer) {
      console.log(
        "[WEB-DB] Kafka not available, skipping payment status change event"
      );
      return;
    }
    if (paymentStatus === "completed" || paymentStatus === "paid") {
      return this.kafkaProducer.paymentCompleted({
        orderId: order.id,
        userId: order.user_id,
        amount: order.total_amount,
        status: paymentStatus,
        source: "web",
      });
    } else if (paymentStatus === "failed") {
      return this.kafkaProducer.paymentFailed({
        orderId: order.id,
        userId: order.user_id,
        amount: order.total_amount,
        status: paymentStatus,
        source: "web",
      });
    }
  }

  async publishUserCreated(user) {
    if (!this.kafkaEnabled || !this.kafkaProducer) {
      console.log("[WEB-DB] Kafka not available, skipping user.created event");
      return;
    }
    return this.kafkaProducer.userCreated({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      source: "web",
    });
  }

  async publishUserUpdated(user, profileData = null) {
    if (!this.kafkaEnabled || !this.kafkaProducer) {
      console.log("[WEB-DB] Kafka not available, skipping user.updated event");
      return;
    }
    return this.kafkaProducer.userUpdated({
      id: user.id,
      email: user.email,
      profile: profileData,
      updated_at: new Date().toISOString(),
      source: "web",
    });
  }

  // Helper method to publish notification events
  async publishNotification(type, recipient, content) {
    if (!this.kafkaEnabled || !this.kafkaProducer) {
      console.log("[WEB-DB] Kafka not available, skipping notification event");
      return;
    }
    return this.kafkaProducer
      .sendNotification(type, recipient, content)
      .catch((error) => {
        console.error("[WEB-KAFKA] Failed to publish notification:", error);
      });
  }

  // Health check method
  async isKafkaHealthy() {
    if (!this.kafkaEnabled || !this.kafkaProducer) {
      return false;
    }
    return this.kafkaProducer.isHealthy();
  }

  // Get Kafka status
  getKafkaStatus() {
    if (!this.kafkaEnabled || !this.kafkaProducer) {
      return {
        enabled: false,
        connected: false,
        clientId: "web-food-app",
      };
    }
    return this.kafkaProducer.getStatus();
  }

  // Graceful shutdown
  async disconnect() {
    try {
      await this.kafkaProducer.disconnect();
      console.log("[WEB-DB] Database disconnected successfully");
    } catch (error) {
      console.error("[WEB-DB] Error during disconnect:", error);
    }
  }

  // Health check endpoint data
  async getHealthStatus() {
    const kafkaStatus = this.getKafkaStatus();
    const kafkaHealthy = await this.isKafkaHealthy();

    return {
      database: "connected",
      kafka: {
        enabled: kafkaStatus.enabled,
        connected: kafkaStatus.connected,
        healthy: kafkaHealthy,
        clientId: kafkaStatus.clientId,
      },
    };
  }
}
