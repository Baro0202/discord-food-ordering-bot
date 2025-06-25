const { Kafka } = require("kafkajs");
const { kafkaConfig, topics } = require("../../src/kafka/config");

class OrderAnalyticsConsumer {
  constructor() {
    this.kafka = new Kafka({
      ...kafkaConfig,
      clientId: "order-analytics-consumer",
    });

    this.consumer = this.kafka.consumer({
      groupId: "analytics-group",
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    // In-memory analytics (use Redis/Database in production)
    this.analytics = {
      totalOrders: 0,
      totalRevenue: 0,
      ordersByStatus: {},
      ordersByDay: {},
      popularItems: {},
      avgOrderValue: 0,
    };
  }

  async start() {
    try {
      console.log("[ANALYTICS] Connecting to Kafka...");
      await this.consumer.connect();

      console.log("[ANALYTICS] Subscribing to topics...");
      await this.consumer.subscribe({
        topics: [topics.ORDERS, topics.PAYMENTS],
        fromBeginning: false,
      });

      console.log("[ANALYTICS] Starting consumer...");
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          try {
            await this.processMessage(topic, message);
            await heartbeat();
          } catch (error) {
            console.error("[ANALYTICS] Error processing message:", error);
          }
        },
      });

      console.log("[ANALYTICS] Consumer started successfully!");
    } catch (error) {
      console.error("[ANALYTICS] Failed to start consumer:", error);
      process.exit(1);
    }
  }

  async processMessage(topic, message) {
    const event = JSON.parse(message.value.toString());
    const { eventType, data, timestamp } = event;

    console.log(`[ANALYTICS] Processing ${eventType} from ${topic}`);

    switch (topic) {
      case topics.ORDERS:
        await this.handleOrderEvent(eventType, data, timestamp);
        break;
      case topics.PAYMENTS:
        await this.handlePaymentEvent(eventType, data, timestamp);
        break;
    }

    // Log current analytics (every 10 orders)
    if (this.analytics.totalOrders % 10 === 0) {
      this.logAnalytics();
    }
  }

  async handleOrderEvent(eventType, orderData, timestamp) {
    const date = new Date(timestamp).toISOString().split("T")[0];

    switch (eventType) {
      case "order.created":
        this.analytics.totalOrders++;
        this.analytics.totalRevenue += parseFloat(orderData.total_amount || 0);

        // Track by day
        this.analytics.ordersByDay[date] =
          (this.analytics.ordersByDay[date] || 0) + 1;

        // Track popular items
        if (orderData.items) {
          try {
            const items =
              typeof orderData.items === "string"
                ? JSON.parse(orderData.items)
                : orderData.items;

            items.forEach((item) => {
              const itemName = item.name || "Unknown";
              this.analytics.popularItems[itemName] =
                (this.analytics.popularItems[itemName] || 0) +
                (item.quantity || 1);
            });
          } catch (e) {
            console.error("[ANALYTICS] Error parsing order items:", e);
          }
        }

        // Calculate average order value
        this.analytics.avgOrderValue =
          this.analytics.totalRevenue / this.analytics.totalOrders;
        break;

      case "order.updated":
      case "order.confirmed":
      case "order.cancelled":
        const status = eventType.split(".")[1];
        this.analytics.ordersByStatus[status] =
          (this.analytics.ordersByStatus[status] || 0) + 1;
        break;
    }
  }

  async handlePaymentEvent(eventType, paymentData, timestamp) {
    switch (eventType) {
      case "payment.completed":
        console.log(
          `[ANALYTICS] Payment completed: $${paymentData.amount} for order ${paymentData.orderId}`
        );
        break;
      case "payment.failed":
        console.log(
          `[ANALYTICS] Payment failed for order ${paymentData.orderId}`
        );
        break;
    }
  }

  logAnalytics() {
    console.log("\n📊 ===== ORDER ANALYTICS SUMMARY =====");
    console.log(`📦 Total Orders: ${this.analytics.totalOrders}`);
    console.log(
      `💰 Total Revenue: ${this.formatCurrency(this.analytics.totalRevenue)}`
    );
    console.log(
      `📈 Average Order Value: ${this.formatCurrency(
        this.analytics.avgOrderValue
      )}`
    );

    console.log("\n📋 Orders by Status:");
    Object.entries(this.analytics.ordersByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log("\n📅 Orders by Day:");
    Object.entries(this.analytics.ordersByDay)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7)
      .forEach(([date, count]) => {
        console.log(`  ${date}: ${count}`);
      });

    console.log("\n🍽️ Top 5 Popular Items:");
    Object.entries(this.analytics.popularItems)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([item, count]) => {
        console.log(`  ${item}: ${count}`);
      });

    console.log("=====================================\n");
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  async disconnect() {
    try {
      await this.consumer.disconnect();
      console.log("[ANALYTICS] Consumer disconnected");
    } catch (error) {
      console.error("[ANALYTICS] Error disconnecting:", error);
    }
  }
}

// Graceful shutdown
async function gracefulShutdown(consumer) {
  console.log("\n[ANALYTICS] Shutting down gracefully...");
  await consumer.disconnect();
  process.exit(0);
}

// Start consumer if run directly
if (require.main === module) {
  const consumer = new OrderAnalyticsConsumer();

  process.on("SIGINT", () => gracefulShutdown(consumer));
  process.on("SIGTERM", () => gracefulShutdown(consumer));

  consumer.start().catch(console.error);
}

module.exports = OrderAnalyticsConsumer;
