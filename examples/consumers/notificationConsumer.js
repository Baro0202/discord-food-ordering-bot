const { Kafka } = require("kafkajs");
const { kafkaConfig, topics } = require("../../src/kafka/config");

class NotificationConsumer {
  constructor() {
    this.kafka = new Kafka({
      ...kafkaConfig,
      clientId: "notification-consumer",
    });

    this.consumer = this.kafka.consumer({
      groupId: "notification-processing-group",
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    // In-memory notification tracking (use Redis/Database in production)
    this.notificationStats = {
      totalSent: 0,
      successCount: 0,
      failureCount: 0,
      notificationsByType: {},
      notificationsByChannel: {},
      recentNotifications: [],
    };

    // External service integrations (example)
    this.integrations = {
      email: this.initEmailService(),
      sms: this.initSMSService(),
      push: this.initPushService(),
      webhook: this.initWebhookService(),
    };
  }

  async start() {
    try {
      console.log("[NOTIFICATION] Connecting to Kafka...");
      await this.consumer.connect();

      console.log("[NOTIFICATION] Subscribing to notification topic...");
      await this.consumer.subscribe({
        topics: [topics.NOTIFICATIONS],
        fromBeginning: false,
      });

      console.log("[NOTIFICATION] Starting notification consumer...");
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          try {
            await this.processNotification(message);
            await heartbeat();
          } catch (error) {
            console.error(
              "[NOTIFICATION] Error processing notification:",
              error
            );
            this.notificationStats.failureCount++;
          }
        },
      });

      console.log("[NOTIFICATION] Consumer started successfully!");
    } catch (error) {
      console.error("[NOTIFICATION] Failed to start consumer:", error);
      process.exit(1);
    }
  }

  async processNotification(message) {
    const event = JSON.parse(message.value.toString());
    const { eventType, data, timestamp, metadata } = event;

    console.log(`[NOTIFICATION] Processing ${eventType} notification`);

    this.notificationStats.totalSent++;

    // Track notification type
    this.notificationStats.notificationsByType[eventType] =
      (this.notificationStats.notificationsByType[eventType] || 0) + 1;

    // Track notification channel
    const channel = data.channel || "unknown";
    this.notificationStats.notificationsByChannel[channel] =
      (this.notificationStats.notificationsByChannel[channel] || 0) + 1;

    // Store recent notifications (keep last 100)
    this.notificationStats.recentNotifications.unshift({
      eventType,
      timestamp,
      channel,
      success: false, // Will be updated
    });
    if (this.notificationStats.recentNotifications.length > 100) {
      this.notificationStats.recentNotifications.pop();
    }

    try {
      switch (eventType) {
        case "notification.send":
          await this.handleSendNotification(data, metadata);
          break;
        case "notification.reminder":
          await this.handleReminderNotification(data, metadata);
          break;
        case "notification.alert":
          await this.handleAlertNotification(data, metadata);
          break;
        case "notification.broadcast":
          await this.handleBroadcastNotification(data, metadata);
          break;
        default:
          console.warn(
            `[NOTIFICATION] Unknown notification type: ${eventType}`
          );
      }

      this.notificationStats.successCount++;
      this.notificationStats.recentNotifications[0].success = true;
    } catch (error) {
      console.error(`[NOTIFICATION] Failed to process ${eventType}:`, error);
      this.notificationStats.failureCount++;
    }

    // Log stats every 25 notifications
    if (this.notificationStats.totalSent % 25 === 0) {
      this.logNotificationStats();
    }
  }

  async handleSendNotification(data, metadata) {
    const { channel, recipient, message, priority = "normal" } = data;

    console.log(`[NOTIFICATION] Sending to ${channel}: ${recipient}`);

    switch (channel) {
      case "discord":
        await this.sendDiscordNotification(data);
        break;
      case "email":
        await this.sendEmailNotification(data);
        break;
      case "sms":
        await this.sendSMSNotification(data);
        break;
      case "push":
        await this.sendPushNotification(data);
        break;
      case "webhook":
        await this.sendWebhookNotification(data);
        break;
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  async handleReminderNotification(data, metadata) {
    console.log(`[NOTIFICATION] Processing reminder: ${data.reminderType}`);

    // Handle different reminder types
    switch (data.reminderType) {
      case "order_deadline":
        await this.sendOrderDeadlineReminder(data);
        break;
      case "payment_due":
        await this.sendPaymentDueReminder(data);
        break;
      case "menu_available":
        await this.sendMenuAvailableReminder(data);
        break;
      default:
        await this.handleSendNotification(data, metadata);
    }
  }

  async handleAlertNotification(data, metadata) {
    console.log(`[NOTIFICATION] Processing alert: ${data.alertType}`);

    // High priority alerts
    const alertData = {
      ...data,
      priority: "high",
      urgent: true,
    };

    switch (data.alertType) {
      case "system_error":
        await this.sendSystemErrorAlert(alertData);
        break;
      case "payment_failed":
        await this.sendPaymentFailedAlert(alertData);
        break;
      case "order_cancelled":
        await this.sendOrderCancelledAlert(alertData);
        break;
      default:
        await this.handleSendNotification(alertData, metadata);
    }
  }

  async handleBroadcastNotification(data, metadata) {
    console.log(
      `[NOTIFICATION] Processing broadcast to ${
        data.recipients?.length || "all"
      } recipients`
    );

    const recipients = data.recipients || ["all"];

    for (const recipient of recipients) {
      try {
        await this.handleSendNotification(
          {
            ...data,
            recipient,
          },
          metadata
        );

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `[NOTIFICATION] Failed to send broadcast to ${recipient}:`,
          error
        );
      }
    }
  }

  // Discord notification methods
  async sendDiscordNotification(data) {
    console.log(
      `[DISCORD] Sending message to ${data.recipient}: ${data.message.substring(
        0,
        50
      )}...`
    );
    // In real implementation, you would use Discord API
    // await discordClient.channels.cache.get(data.recipient).send(data.message);
    return { success: true, channel: "discord" };
  }

  // Reminder-specific methods
  async sendOrderDeadlineReminder(data) {
    const reminderMessage = `⏰ Reminder: Order deadline is in ${data.timeUntilDeadline}!`;
    await this.sendDiscordNotification({
      ...data,
      message: reminderMessage,
    });
  }

  async sendPaymentDueReminder(data) {
    const reminderMessage = `💳 Payment due for order #${data.orderId}. Amount: ${data.amount}`;
    await this.sendDiscordNotification({
      ...data,
      message: reminderMessage,
    });
  }

  async sendMenuAvailableReminder(data) {
    const reminderMessage = `🍽️ Today's menu is now available! Use /menu to view and order.`;
    await this.sendDiscordNotification({
      ...data,
      message: reminderMessage,
    });
  }

  // Alert-specific methods
  async sendSystemErrorAlert(data) {
    const alertMessage = `🚨 SYSTEM ALERT: ${data.error}`;
    await this.sendDiscordNotification({
      ...data,
      message: alertMessage,
      recipient: data.adminChannel,
    });
  }

  async sendPaymentFailedAlert(data) {
    const alertMessage = `❌ Payment failed for order #${data.orderId}. Reason: ${data.reason}`;
    await this.sendDiscordNotification({
      ...data,
      message: alertMessage,
    });
  }

  async sendOrderCancelledAlert(data) {
    const alertMessage = `🚫 Order #${data.orderId} has been cancelled. User: ${data.userId}`;
    await this.sendDiscordNotification({
      ...data,
      message: alertMessage,
    });
  }

  // External service integrations (placeholder implementations)
  async sendEmailNotification(data) {
    console.log(`[EMAIL] Sending to ${data.recipient}: ${data.subject}`);
    // Implementation would use email service (SendGrid, etc.)
    return { success: true, channel: "email" };
  }

  async sendSMSNotification(data) {
    console.log(
      `[SMS] Sending to ${data.recipient}: ${data.message.substring(0, 30)}...`
    );
    // Implementation would use SMS service (Twilio, etc.)
    return { success: true, channel: "sms" };
  }

  async sendPushNotification(data) {
    console.log(`[PUSH] Sending to device ${data.deviceId}: ${data.title}`);
    // Implementation would use push service (FCM, APNs, etc.)
    return { success: true, channel: "push" };
  }

  async sendWebhookNotification(data) {
    console.log(`[WEBHOOK] Posting to ${data.webhookUrl}`);
    // Implementation would make HTTP POST request
    return { success: true, channel: "webhook" };
  }

  // Service initialization methods (placeholders)
  initEmailService() {
    return {
      apiKey: process.env.EMAIL_API_KEY,
      endpoint: process.env.EMAIL_ENDPOINT,
    };
  }

  initSMSService() {
    return {
      apiKey: process.env.SMS_API_KEY,
      endpoint: process.env.SMS_ENDPOINT,
    };
  }

  initPushService() {
    return {
      apiKey: process.env.PUSH_API_KEY,
      endpoint: process.env.PUSH_ENDPOINT,
    };
  }

  initWebhookService() {
    return {
      defaultTimeout: 5000,
      retries: 3,
    };
  }

  logNotificationStats() {
    console.log("\n📢 ===== NOTIFICATION STATS =====");
    console.log(`📊 Total Sent: ${this.notificationStats.totalSent}`);
    console.log(`✅ Success: ${this.notificationStats.successCount}`);
    console.log(`❌ Failed: ${this.notificationStats.failureCount}`);
    console.log(
      `📈 Success Rate: ${(
        (this.notificationStats.successCount /
          this.notificationStats.totalSent) *
        100
      ).toFixed(2)}%`
    );

    console.log("\n📋 By Type:");
    Object.entries(this.notificationStats.notificationsByType).forEach(
      ([type, count]) => {
        console.log(`  ${type}: ${count}`);
      }
    );

    console.log("\n📱 By Channel:");
    Object.entries(this.notificationStats.notificationsByChannel).forEach(
      ([channel, count]) => {
        console.log(`  ${channel}: ${count}`);
      }
    );

    console.log("\n🕐 Recent Notifications (Last 5):");
    this.notificationStats.recentNotifications
      .slice(0, 5)
      .forEach((notif, index) => {
        const status = notif.success ? "✅" : "❌";
        console.log(
          `  ${index + 1}. ${status} ${notif.eventType} → ${
            notif.channel
          } (${new Date(notif.timestamp).toLocaleTimeString()})`
        );
      });

    console.log("================================\n");
  }

  async disconnect() {
    try {
      await this.consumer.disconnect();
      console.log("[NOTIFICATION] Consumer disconnected");
    } catch (error) {
      console.error("[NOTIFICATION] Error disconnecting:", error);
    }
  }
}

// Graceful shutdown
async function gracefulShutdown(consumer) {
  console.log("\n[NOTIFICATION] Shutting down gracefully...");
  await consumer.disconnect();
  process.exit(0);
}

// Start consumer if run directly
if (require.main === module) {
  const consumer = new NotificationConsumer();

  // Handle shutdown signals
  process.on("SIGINT", () => gracefulShutdown(consumer));
  process.on("SIGTERM", () => gracefulShutdown(consumer));

  consumer.start().catch((error) => {
    console.error("[NOTIFICATION] Consumer failed:", error);
    process.exit(1);
  });
}

module.exports = NotificationConsumer;
