#!/usr/bin/env node

const { Kafka } = require("kafkajs");
const { kafkaConfig, topics } = require("../src/kafka/config");

class NotificationTester {
  constructor() {
    this.kafka = new Kafka({
      ...kafkaConfig,
      clientId: "notification-tester",
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: false,
      transactionTimeout: 30000,
    });

    this.testResults = {
      sent: 0,
      success: 0,
      failed: 0,
      startTime: Date.now(),
    };
  }

  async start() {
    try {
      console.log("🧪 [TEST] Starting Notification Flow Test...");
      console.log(`📋 [TEST] Target Topic: ${topics.NOTIFICATIONS}`);

      await this.producer.connect();
      console.log("✅ [TEST] Producer connected to Kafka");

      // Test different notification scenarios
      await this.testBasicNotification();
      await this.sleep(1000);

      await this.testReminderNotifications();
      await this.sleep(1000);

      await this.testAlertNotifications();
      await this.sleep(1000);

      await this.testBroadcastNotification();
      await this.sleep(1000);

      await this.testMultiChannelNotifications();

      this.printTestSummary();
    } catch (error) {
      console.error("❌ [TEST] Error:", error);
    } finally {
      await this.producer.disconnect();
      console.log("🔌 [TEST] Producer disconnected");
    }
  }

  async testBasicNotification() {
    console.log("\n📢 [TEST] Testing Basic Notifications...");

    const basicNotifications = [
      {
        eventType: "notification.send",
        data: {
          channel: "discord",
          recipient: "1329647866888589434", // Guild ID
          message: "🍽️ Your order has been confirmed! Order ID: #TEST001",
          priority: "normal",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          orderId: "TEST001",
        },
      },
      {
        eventType: "notification.send",
        data: {
          channel: "email",
          recipient: "user@example.com",
          subject: "Order Confirmation - TEST002",
          message: "Thank you for your order! Details attached.",
          priority: "normal",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          orderId: "TEST002",
        },
      },
    ];

    for (const notification of basicNotifications) {
      await this.sendNotification(notification);
    }
  }

  async testReminderNotifications() {
    console.log("\n⏰ [TEST] Testing Reminder Notifications...");

    const reminderNotifications = [
      {
        eventType: "notification.reminder",
        data: {
          channel: "discord",
          recipient: "1329647866888589434",
          reminderType: "order_deadline",
          timeUntilDeadline: "15 minutes",
          message: "Order deadline reminder",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          reminderType: "deadline",
        },
      },
      {
        eventType: "notification.reminder",
        data: {
          channel: "discord",
          recipient: "1329647866888589434",
          reminderType: "payment_due",
          orderId: "TEST003",
          amount: "150,000 VND",
          message: "Payment reminder",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          reminderType: "payment",
        },
      },
      {
        eventType: "notification.reminder",
        data: {
          channel: "discord",
          recipient: "1329647866888589434",
          reminderType: "menu_available",
          message: "Menu available reminder",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          reminderType: "menu",
        },
      },
    ];

    for (const notification of reminderNotifications) {
      await this.sendNotification(notification);
    }
  }

  async testAlertNotifications() {
    console.log("\n🚨 [TEST] Testing Alert Notifications...");

    const alertNotifications = [
      {
        eventType: "notification.alert",
        data: {
          channel: "discord",
          recipient: "1329647866888589434",
          alertType: "payment_failed",
          orderId: "TEST004",
          reason: "Insufficient funds",
          message: "Payment failed alert",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          severity: "high",
        },
      },
      {
        eventType: "notification.alert",
        data: {
          channel: "discord",
          recipient: "1329647866888589434",
          alertType: "system_error",
          error: "Database connection timeout",
          adminChannel: "1329647866888589434",
          message: "System error alert",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          severity: "critical",
        },
      },
      {
        eventType: "notification.alert",
        data: {
          channel: "discord",
          recipient: "1329647866888589434",
          alertType: "order_cancelled",
          orderId: "TEST005",
          userId: "test-user-123",
          message: "Order cancelled alert",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          severity: "medium",
        },
      },
    ];

    for (const notification of alertNotifications) {
      await this.sendNotification(notification);
    }
  }

  async testBroadcastNotification() {
    console.log("\n📡 [TEST] Testing Broadcast Notifications...");

    const broadcastNotification = {
      eventType: "notification.broadcast",
      data: {
        channel: "discord",
        recipients: [
          "1329647866888589434",
          "user1@example.com",
          "user2@example.com",
        ],
        subject: "System Maintenance Notice",
        message:
          "🔧 Scheduled maintenance: System will be down from 2:00-3:00 AM for updates.",
        priority: "high",
      },
      timestamp: new Date().toISOString(),
      metadata: {
        source: "test-script",
        broadcast: true,
      },
    };

    await this.sendNotification(broadcastNotification);
  }

  async testMultiChannelNotifications() {
    console.log("\n📱 [TEST] Testing Multi-Channel Notifications...");

    const multiChannelNotifications = [
      {
        eventType: "notification.send",
        data: {
          channel: "sms",
          recipient: "+84987654321",
          message: "Your food order #TEST006 is ready for pickup!",
          priority: "urgent",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          channel: "sms",
        },
      },
      {
        eventType: "notification.send",
        data: {
          channel: "push",
          deviceId: "device-token-12345",
          title: "Order Update",
          message: "Your order has been delivered successfully!",
          priority: "normal",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          channel: "push",
        },
      },
      {
        eventType: "notification.send",
        data: {
          channel: "webhook",
          webhookUrl: "https://example.com/webhook/notifications",
          payload: {
            event: "order_completed",
            orderId: "TEST007",
            status: "delivered",
          },
          message: "Webhook notification test",
        },
        timestamp: new Date().toISOString(),
        metadata: {
          source: "test-script",
          channel: "webhook",
        },
      },
    ];

    for (const notification of multiChannelNotifications) {
      await this.sendNotification(notification);
    }
  }

  async sendNotification(notification) {
    try {
      console.log(
        `📤 [TEST] Sending ${notification.eventType} → ${notification.data.channel}`
      );

      await this.producer.send({
        topic: topics.NOTIFICATIONS,
        messages: [
          {
            key: `${notification.eventType}-${Date.now()}`,
            value: JSON.stringify(notification),
            timestamp: Date.now().toString(),
          },
        ],
      });

      this.testResults.sent++;
      this.testResults.success++;
      console.log(`✅ [TEST] Sent successfully`);
    } catch (error) {
      this.testResults.sent++;
      this.testResults.failed++;
      console.error(`❌ [TEST] Failed to send:`, error.message);
    }
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  printTestSummary() {
    const duration = Date.now() - this.testResults.startTime;

    console.log("\n" + "=".repeat(50));
    console.log("📊 NOTIFICATION TEST SUMMARY");
    console.log("=".repeat(50));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📤 Total Sent: ${this.testResults.sent}`);
    console.log(`✅ Success: ${this.testResults.success}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(
      `📈 Success Rate: ${(
        (this.testResults.success / this.testResults.sent) *
        100
      ).toFixed(2)}%`
    );
    console.log("=".repeat(50));
    console.log(
      "🔍 Check the notification consumer logs for processing results!"
    );
    console.log(
      "💡 Tip: Use Kafka UI at http://localhost:8080 to monitor messages"
    );
    console.log("=".repeat(50) + "\n");
  }
}

// Show usage
function showUsage() {
  console.log("🧪 Notification Flow Tester");
  console.log("");
  console.log("Usage: node scripts/test-notifications.js [options]");
  console.log("");
  console.log("Options:");
  console.log("  --help, -h     Show this help message");
  console.log("  --basic        Test only basic notifications");
  console.log("  --reminders    Test only reminder notifications");
  console.log("  --alerts       Test only alert notifications");
  console.log("  --broadcast    Test only broadcast notifications");
  console.log("  --multichannel Test only multi-channel notifications");
  console.log("");
  console.log("Examples:");
  console.log(
    "  node scripts/test-notifications.js              # Run all tests"
  );
  console.log(
    "  node scripts/test-notifications.js --basic      # Test basic only"
  );
  console.log(
    "  node scripts/test-notifications.js --alerts     # Test alerts only"
  );
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showUsage();
    return;
  }

  const tester = new NotificationTester();

  // Handle specific test types
  if (args.includes("--basic")) {
    await tester.producer.connect();
    await tester.testBasicNotification();
  } else if (args.includes("--reminders")) {
    await tester.producer.connect();
    await tester.testReminderNotifications();
  } else if (args.includes("--alerts")) {
    await tester.producer.connect();
    await tester.testAlertNotifications();
  } else if (args.includes("--broadcast")) {
    await tester.producer.connect();
    await tester.testBroadcastNotification();
  } else if (args.includes("--multichannel")) {
    await tester.producer.connect();
    await tester.testMultiChannelNotifications();
  } else {
    // Run all tests
    await tester.start();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 [TEST] Fatal error:", error);
    process.exit(1);
  });
}

module.exports = NotificationTester;
