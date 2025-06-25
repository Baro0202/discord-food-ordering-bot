const SupabaseDatabase = require("./supabase");
const { getKafkaProducer } = require("../kafka/producer");

class EnhancedSupabaseDatabase extends SupabaseDatabase {
  constructor() {
    super();
    this.kafkaProducer = getKafkaProducer();
  }

  // Override createOrder để thêm Kafka events
  async createOrder(userId, username, menuDate, orderItems, totalAmount) {
    try {
      // Gọi method gốc từ parent class
      const order = await super.createOrder(
        userId,
        username,
        menuDate,
        orderItems,
        totalAmount
      );

      // Publish event to Kafka (non-blocking)
      this.publishOrderCreated(order).catch((error) => {
        console.error("[KAFKA] Failed to publish order.created event:", error);
      });

      return order;
    } catch (error) {
      // Nếu có lỗi ở database, vẫn cần log và throw
      console.error("[DB] Error creating order:", error);
      throw error;
    }
  }

  // Override updateOrderStatus
  async updateOrderStatus(orderId, status) {
    try {
      // Lấy order hiện tại để biết previous status
      const currentOrder = await this.getOrder(orderId);
      const previousStatus = currentOrder?.status;

      // Update status
      const result = await super.updateOrderStatus(orderId, status);

      // Get updated order
      const updatedOrder = await this.getOrder(orderId);

      if (updatedOrder) {
        // Publish event based on status
        this.publishOrderStatusChanged(updatedOrder, previousStatus).catch(
          (error) => {
            console.error(
              "[KAFKA] Failed to publish order status change:",
              error
            );
          }
        );
      }

      return result;
    } catch (error) {
      console.error("[DB] Error updating order status:", error);
      throw error;
    }
  }

  // Override updatePaymentStatus
  async updatePaymentStatus(orderId, paymentStatus) {
    try {
      const result = await super.updatePaymentStatus(orderId, paymentStatus);

      // Get order for event
      const order = await this.getOrder(orderId);

      if (order) {
        this.publishPaymentStatusChanged(order, paymentStatus).catch(
          (error) => {
            console.error(
              "[KAFKA] Failed to publish payment status change:",
              error
            );
          }
        );
      }

      return result;
    } catch (error) {
      console.error("[DB] Error updating payment status:", error);
      throw error;
    }
  }

  // Override upsertUser
  async upsertUser(userId, username, displayName = null) {
    try {
      // Check if user exists
      const existingUser = await this.getUser(userId);
      const isNewUser = !existingUser;

      const result = await super.upsertUser(userId, username, displayName);

      // Get user data for event
      const userData = await this.getUser(userId);

      if (userData) {
        if (isNewUser) {
          this.publishUserCreated(userData).catch((error) => {
            console.error(
              "[KAFKA] Failed to publish user.created event:",
              error
            );
          });
        } else {
          this.publishUserUpdated(userData).catch((error) => {
            console.error(
              "[KAFKA] Failed to publish user.updated event:",
              error
            );
          });
        }
      }

      return result;
    } catch (error) {
      console.error("[DB] Error upserting user:", error);
      throw error;
    }
  }

  // Kafka event publishers (private methods)
  async publishOrderCreated(order) {
    return this.kafkaProducer.orderCreated(order);
  }

  async publishOrderStatusChanged(order, previousStatus) {
    if (order.status === "confirmed") {
      return this.kafkaProducer.orderConfirmed(order);
    } else if (order.status === "cancelled") {
      return this.kafkaProducer.orderCancelled(order);
    } else {
      return this.kafkaProducer.orderUpdated(order, previousStatus);
    }
  }

  async publishPaymentStatusChanged(order, paymentStatus) {
    if (paymentStatus === "completed" || paymentStatus === "paid") {
      return this.kafkaProducer.paymentCompleted({
        orderId: order.id,
        userId: order.user_id,
        amount: order.total_amount,
        status: paymentStatus,
      });
    } else if (paymentStatus === "failed") {
      return this.kafkaProducer.paymentFailed({
        orderId: order.id,
        userId: order.user_id,
        amount: order.total_amount,
        status: paymentStatus,
      });
    }
  }

  async publishUserCreated(user) {
    return this.kafkaProducer.userCreated(user);
  }

  async publishUserUpdated(user) {
    return this.kafkaProducer.userUpdated(user);
  }

  // Helper method để publish notification events
  async publishNotification(type, recipient, content) {
    return this.kafkaProducer
      .sendNotification(type, recipient, content)
      .catch((error) => {
        console.error("[KAFKA] Failed to publish notification:", error);
      });
  }

  // Health check method
  async isKafkaHealthy() {
    return this.kafkaProducer.isHealthy();
  }

  // Graceful shutdown
  async disconnect() {
    try {
      await this.kafkaProducer.disconnect();
      await super.close();
    } catch (error) {
      console.error("[DB] Error during disconnect:", error);
    }
  }
}

module.exports = EnhancedSupabaseDatabase;
