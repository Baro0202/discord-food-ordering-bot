const cron = require("node-cron");
const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`[INFO] ${client.user.tag} is online!`);

    // Set bot status
    client.user.setPresence({
      activities: [
        {
          name: "đơn đặt cơm | /menu",
          type: ActivityType.Watching,
        },
      ],
      status: "online",
    });

    // Schedule daily menu reminder at 9:00 AM
    cron.schedule(
      "0 9 * * 1-5",
      async () => {
        console.log("[CRON] Sending daily menu reminder...");
        await sendMenuReminder(client);
      },
      {
        timezone: "Asia/Ho_Chi_Minh",
      }
    );

    // Schedule order deadline reminder at 9:45 AM
    cron.schedule(
      "45 9 * * 1-5",
      async () => {
        console.log("[CRON] Sending order deadline reminder...");
        await sendDeadlineReminder(client);
      },
      {
        timezone: "Asia/Ho_Chi_Minh",
      }
    );

    console.log("[INFO] Scheduled tasks configured");
  },
};

async function sendMenuReminder(client) {
  try {
    const channelId = process.env.ORDER_CHANNEL_ID;
    if (!channelId) return;

    const channel = client.channels.cache.get(channelId);
    if (!channel) return;

    const today = new Date().toISOString().split("T")[0];

    await channel.send({
      embeds: [
        {
          color: 0x00ff00,
          title: "🍽️ Menu hôm nay đã sẵn sàng!",
          description:
            "Sử dụng `/menu` để xem menu và đặt món.\n⏰ **Hạn đặt:** 10:00 AM",
          timestamp: new Date(),
          footer: {
            text: "Bot Đặt Cơm",
          },
        },
      ],
    });
  } catch (error) {
    console.error("[ERROR] Failed to send menu reminder:", error);
  }
}

async function sendDeadlineReminder(client) {
  try {
    const channelId = process.env.ORDER_CHANNEL_ID;
    if (!channelId) return;

    const channel = client.channels.cache.get(channelId);
    if (!channel) return;

    await channel.send({
      embeds: [
        {
          color: 0xff9900,
          title: "⚠️ Sắp hết hạn đặt món!",
          description:
            "**15 phút nữa** sẽ hết hạn đặt món.\nNhanh tay sử dụng `/menu` để đặt!",
          timestamp: new Date(),
          footer: {
            text: "Bot Đặt Cơm",
          },
        },
      ],
    });
  } catch (error) {
    console.error("[ERROR] Failed to send deadline reminder:", error);
  }
}
