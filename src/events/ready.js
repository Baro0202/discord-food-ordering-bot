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

    console.log("[INFO] Bot is ready and status set");
  },
};
