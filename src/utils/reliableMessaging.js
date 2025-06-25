const { v4: uuidv4 } = require("uuid");

class ReliableMessaging {
  constructor() {
    // In-memory tracking (use Redis in production)
    this.pendingMessages = new Map();
    this.deliveredMessages = new Set();
    this.userOperations = new Map(); // Track user operations to prevent duplicates

    // Configuration
    this.config = {
      maxRetries: 3,
      initialDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffFactor: 2,
    };
  }

  // 1. IMMEDIATE ACKNOWLEDGMENT - Always respond to user first
  async immediateAck(interaction, operationType, data = {}) {
    const operationId = this.generateOperationId(
      interaction.user.id,
      operationType
    );

    // Check for duplicate operation
    if (this.isDuplicateOperation(operationId)) {
      return this.handleDuplicateOperation(interaction, operationId);
    }

    // Mark operation as in-progress
    this.markOperationInProgress(operationId, data);

    // Immediate user feedback
    const ackMessage = this.getAckMessage(operationType, data);
    await interaction.reply(ackMessage);

    return operationId;
  }

  // 2. IDEMPOTENCY - Prevent duplicate operations
  generateOperationId(userId, operationType, additionalData = "") {
    // Create deterministic ID based on user + operation + time window
    const timeWindow = Math.floor(Date.now() / 60000); // 1-minute window
    return `${userId}_${operationType}_${timeWindow}_${additionalData}`;
  }

  isDuplicateOperation(operationId) {
    return this.userOperations.has(operationId);
  }

  markOperationInProgress(operationId, data) {
    this.userOperations.set(operationId, {
      status: "in-progress",
      startTime: Date.now(),
      data,
      retryCount: 0,
    });
  }

  async handleDuplicateOperation(interaction, operationId) {
    const operation = this.userOperations.get(operationId);

    if (operation.status === "completed") {
      await interaction.reply({
        embeds: [
          {
            color: 0x00ff00,
            title: "✅ Thao tác đã hoàn thành",
            description:
              "Bạn đã thực hiện thao tác này rồi. Kiểm tra lại kết quả bên dưới.",
            footer: { text: `ID: ${operationId.split("_")[3] || "N/A"}` },
          },
        ],
        ephemeral: true,
      });
      return null; // Signal duplicate
    }

    if (operation.status === "in-progress") {
      await interaction.reply({
        embeds: [
          {
            color: 0xff9900,
            title: "⏳ Đang xử lý...",
            description:
              "Thao tác của bạn đang được xử lý. Vui lòng đợi trong giây lát.",
            footer: { text: "Không cần thực hiện lại" },
          },
        ],
        ephemeral: true,
      });
      return null; // Signal in-progress
    }

    return operationId; // Allow retry if failed
  }

  // 3. GET IMMEDIATE ACK MESSAGES
  getAckMessage(operationType, data) {
    const messages = {
      order_creation: {
        embeds: [
          {
            color: 0x00ff00,
            title: "⏳ Đang xử lý đơn hàng...",
            description:
              "Đơn hàng của bạn đang được tạo. Bạn sẽ nhận được xác nhận trong giây lát.",
            fields: [
              {
                name: "💰 Tổng tiền",
                value: data.totalAmount || "Đang tính...",
                inline: true,
              },
              {
                name: "🍽️ Số món",
                value: data.itemCount || "Đang xử lý...",
                inline: true,
              },
              {
                name: "⏱️ Trạng thái",
                value: "🔄 Đang tạo đơn hàng",
                inline: true,
              },
            ],
            footer: {
              text: "Vui lòng không thực hiện thao tác khác trong lúc này",
            },
            timestamp: new Date().toISOString(),
          },
        ],
        ephemeral: true, // 🔒 PRIVACY FIX!
      },

      payment_confirmation: {
        embeds: [
          {
            color: 0xff9900,
            title: "⏳ Đang xác nhận thanh toán...",
            description:
              "Đang gửi xác nhận thanh toán cho admin. Bạn sẽ nhận được phản hồi sớm nhất.",
            fields: [
              {
                name: "🆔 Đơn hàng",
                value: data.orderId || "Đang xử lý...",
                inline: true,
              },
              {
                name: "💳 Trạng thái",
                value: "🔄 Đang gửi xác nhận",
                inline: true,
              },
            ],
            footer: { text: "Admin sẽ kiểm tra và phản hồi" },
          },
        ],
        ephemeral: true, // 🔒 PRIVACY FIX!
      },

      menu_selection: {
        embeds: [
          {
            color: 0x0099ff,
            title: "⏳ Đang thêm vào giỏ hàng...",
            description: "Món ăn đang được thêm vào giỏ hàng của bạn.",
            fields: [
              {
                name: "🍽️ Món ăn",
                value: data.itemName || "Đang xử lý...",
                inline: true,
              },
              {
                name: "🔢 Số lượng",
                value: data.quantity || "1",
                inline: true,
              },
            ],
            footer: { text: "Đang cập nhật giỏ hàng..." },
          },
        ],
        ephemeral: true,
      },
    };

    return (
      messages[operationType] || {
        embeds: [
          {
            color: 0x00ff00,
            title: "⏳ Đang xử lý...",
            description:
              "Yêu cầu của bạn đang được xử lý. Vui lòng đợi trong giây lát.",
            footer: { text: "Hệ thống đang hoạt động" },
          },
        ],
        ephemeral: true,
      }
    );
  }

  // 4. RELIABLE MESSAGE DELIVERY with retry
  async sendReliableMessage(interaction, messageData, operationId) {
    const messageId = uuidv4();

    this.pendingMessages.set(messageId, {
      interaction,
      messageData,
      operationId,
      attempts: 0,
      nextRetry: Date.now(),
    });

    return this.attemptDelivery(messageId);
  }

  async attemptDelivery(messageId, isRetry = false) {
    const pending = this.pendingMessages.get(messageId);
    if (!pending) return false;

    const { interaction, messageData, operationId } = pending;
    pending.attempts++;

    try {
      // Try to send/edit the message
      let result;
      if (isRetry) {
        // 🔒 CRITICAL PRIVACY FIX: Preserve ephemeral flag in retries
        const retryData = {
          ...messageData,
          ephemeral: messageData.ephemeral !== false, // Default to true if not explicitly false
        };
        result = await interaction.followUp(retryData);
      } else {
        // First attempt, edit the immediate ACK
        result = await interaction.editReply(messageData);
      }

      // Success - mark as delivered
      this.deliveredMessages.add(messageId);
      this.pendingMessages.delete(messageId);
      this.markOperationCompleted(operationId, "success");

      console.log(
        `✅ [RELIABLE] Message delivered successfully: ${messageId} (ephemeral: ${
          messageData.ephemeral !== false
        })`
      );
      return true;
    } catch (error) {
      console.error(
        `❌ [RELIABLE] Delivery attempt ${pending.attempts} failed:`,
        error.message
      );

      if (pending.attempts >= this.config.maxRetries) {
        // Max retries reached - use fallback
        await this.handleFailedDelivery(interaction, messageData, operationId);
        this.pendingMessages.delete(messageId);
        this.markOperationCompleted(operationId, "failed");
        return false;
      }

      // Schedule retry
      this.scheduleRetry(messageId);
      return false;
    }
  }

  scheduleRetry(messageId) {
    const pending = this.pendingMessages.get(messageId);
    if (!pending) return;

    const delay = Math.min(
      this.config.initialDelay *
        Math.pow(this.config.backoffFactor, pending.attempts - 1),
      this.config.maxDelay
    );

    pending.nextRetry = Date.now() + delay;

    setTimeout(() => {
      if (this.pendingMessages.has(messageId)) {
        this.attemptDelivery(messageId, true);
      }
    }, delay);

    console.log(
      `🔄 [RELIABLE] Scheduled retry ${
        pending.attempts + 1
      } for ${messageId} in ${delay}ms`
    );
  }

  // 5. FALLBACK DELIVERY MECHANISMS
  async handleFailedDelivery(interaction, messageData, operationId) {
    console.log(
      `🚨 [RELIABLE] Message delivery failed completely for operation: ${operationId}`
    );

    // Try multiple fallback methods
    const fallbackMethods = [
      () => this.sendDM(interaction, messageData),
      () => this.sendChannelMessage(interaction, messageData),
      () => this.queueNotification(interaction, messageData),
    ];

    for (const method of fallbackMethods) {
      try {
        await method();
        console.log(`✅ [RELIABLE] Fallback delivery successful`);
        return;
      } catch (error) {
        console.error(`❌ [RELIABLE] Fallback method failed:`, error.message);
      }
    }

    // Last resort - log for manual handling
    console.error(
      `💥 [RELIABLE] All delivery methods failed for: ${operationId}`
    );
    this.logFailedDelivery(interaction, messageData, operationId);
  }

  async sendDM(interaction, messageData) {
    const user = await interaction.client.users.fetch(interaction.user.id);
    const dmData = {
      ...messageData,
      embeds: messageData.embeds?.map((embed) => ({
        ...embed,
        title: `[DM] ${embed.title}`,
        footer: { text: "Gửi qua tin nhắn riêng do lỗi kênh chính" },
      })),
    };
    await user.send(dmData);
  }

  async sendChannelMessage(interaction, messageData) {
    // 🔒 PRIVACY: Only use DM fallback, never public channel for private messages
    if (messageData.ephemeral !== false) {
      // If message should be private, use DM instead
      return this.sendDM(interaction, messageData);
    }

    // For public messages only
    const channel = interaction.channel;
    if (channel) {
      await channel.send({
        content: `<@${interaction.user.id}> Tin nhắn dự phòng:`,
        ...messageData,
      });
    }
  }

  async queueNotification(interaction, messageData) {
    // Add to Kafka notification queue for later delivery
    const database = await require("./databaseHelper").getInitializedDatabase();
    if (database && typeof database.publishNotification === "function") {
      await database.publishNotification("notification.send", {
        channel: "discord",
        recipient: interaction.user.id,
        message: `Fallback notification: ${
          messageData.embeds?.[0]?.title || "Message"
        }`,
        priority: "high",
        fallback: true,
      });
    }
  }

  logFailedDelivery(interaction, messageData, operationId) {
    const logData = {
      timestamp: new Date().toISOString(),
      operationId,
      userId: interaction.user.id,
      username: interaction.user.username,
      guildId: interaction.guild?.id,
      channelId: interaction.channel?.id,
      messageType: messageData.embeds?.[0]?.title || "Unknown",
      error: "Complete delivery failure",
    };

    console.error("🚨 [FAILED_DELIVERY]", JSON.stringify(logData, null, 2));

    // Could also write to file or send to monitoring system
    // fs.appendFileSync('failed_deliveries.log', JSON.stringify(logData) + '\n');
  }

  // 6. OPERATION STATUS MANAGEMENT
  markOperationCompleted(operationId, status) {
    if (this.userOperations.has(operationId)) {
      this.userOperations.set(operationId, {
        ...this.userOperations.get(operationId),
        status: status === "success" ? "completed" : "failed",
        completedAt: Date.now(),
      });
    }
  }

  // 7. CLEANUP OLD OPERATIONS
  cleanupOldOperations() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [operationId, operation] of this.userOperations.entries()) {
      if (now - operation.startTime > maxAge) {
        this.userOperations.delete(operationId);
      }
    }

    // Cleanup old pending messages
    for (const [messageId, pending] of this.pendingMessages.entries()) {
      if (now - pending.nextRetry > maxAge) {
        this.pendingMessages.delete(messageId);
      }
    }
  }

  // 8. STATUS CHECK UTILITIES
  getOperationStatus(operationId) {
    return this.userOperations.get(operationId);
  }

  isOperationInProgress(userId, operationType) {
    const operationId = this.generateOperationId(userId, operationType);
    const operation = this.userOperations.get(operationId);
    return operation && operation.status === "in-progress";
  }

  // 9. PERIODIC CLEANUP
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldOperations();
    }, 60000); // Every minute
  }
}

// Singleton instance
const reliableMessaging = new ReliableMessaging();
reliableMessaging.startCleanupInterval();

module.exports = reliableMessaging;
