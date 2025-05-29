const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const express = require("express");
require("dotenv").config();

const SupabaseDatabase = require("./database/supabase");
const { setupCommands } = require("./utils/deployCommands");
const moment = require("moment");

class FoodOrderBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        // GatewayIntentBits.MessageContent, // Not needed for slash commands
      ],
    });

    // Create Express app for health checks (Railway requirement)
    this.app = express();
    this.PORT = process.env.PORT || 3000;

    this.setupHealthChecks();
    this.client.commands = new Collection();
    this.database = new SupabaseDatabase();
    this.loadCommands();
    this.loadEvents();
    this.setupCronJobs();
  }

  setupHealthChecks() {
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        bot: this.client.user
          ? {
              username: this.client.user.username,
              id: this.client.user.id,
              ready: this.client.readyAt ? true : false,
            }
          : "Not logged in",
      });
    });

    this.app.get("/", (req, res) => {
      res.json({
        message: "Discord Food Ordering Bot is running!",
        status: "healthy",
      });
    });

    this.app.listen(this.PORT, () => {
      console.log(`[HTTP] Health check server running on port ${this.PORT}`);
    });
  }

  loadCommands() {
    const commandsPath = path.join(__dirname, "commands");

    if (!fs.existsSync(commandsPath)) {
      fs.mkdirSync(commandsPath, { recursive: true });
    }

    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);

      if ("data" in command && "execute" in command) {
        this.client.commands.set(command.data.name, command);
        console.log(`[INFO] Loaded command: ${command.data.name}`);
      } else {
        console.log(
          `[WARNING] Command ${file} is missing required "data" or "execute" property.`
        );
      }
    }
  }

  loadEvents() {
    const eventsPath = path.join(__dirname, "events");

    if (!fs.existsSync(eventsPath)) {
      fs.mkdirSync(eventsPath, { recursive: true });
    }

    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);

      if (event.once) {
        this.client.once(event.name, (...args) => event.execute(...args));
      } else {
        this.client.on(event.name, (...args) => event.execute(...args));
      }
      console.log(`[INFO] Loaded event: ${event.name}`);
    }
  }

  async start() {
    try {
      // Initialize database
      await this.database.init();
      console.log("[INFO] Database initialized successfully");

      // Setup slash commands
      await setupCommands();
      console.log("[INFO] Slash commands deployed successfully");

      // Login to Discord
      await this.client.login(process.env.DISCORD_TOKEN);
      console.log("[INFO] Bot logged in successfully");
    } catch (error) {
      console.error("[ERROR] Failed to start bot:", error);
      process.exit(1);
    }
  }

  setupCronJobs() {
    // Schedule daily menu reminder at 9:00 AM (Monday to Friday)
    cron.schedule(
      "0 9 * * 1-5",
      async () => {
        console.log("[CRON] Sending daily menu reminder...");
        await this.sendMenuReminder();
      },
      {
        timezone: "Asia/Ho_Chi_Minh",
      }
    );

    // Schedule order deadline reminder at 9:45 AM (Monday to Friday)
    cron.schedule(
      "45 9 * * 1-5",
      async () => {
        console.log("[CRON] Sending order deadline reminder...");
        await this.sendDeadlineReminder();
      },
      {
        timezone: "Asia/Ho_Chi_Minh",
      }
    );

    console.log("[INFO] Scheduled tasks configured");
  }

  async sendMenuReminder() {
    try {
      const channelId = process.env.ORDER_CHANNEL_ID;
      if (!channelId) return;

      const channel = this.client.channels.cache.get(channelId);
      if (!channel) return;

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

  async sendDeadlineReminder() {
    try {
      const channelId = process.env.ORDER_CHANNEL_ID;
      if (!channelId) return;

      const channel = this.client.channels.cache.get(channelId);
      if (!channel) return;

      await channel.send({
        embeds: [
          {
            color: 0xff9900,
            title: "⏰ Sắp hết hạn đặt món!",
            description:
              "Còn **15 phút** nữa là hết hạn đặt món hôm nay.\nNhanh tay sử dụng `/menu` để đặt!",
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
}

// Create and start the bot
const bot = new FoodOrderBot();
bot.start();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("[INFO] Received SIGINT, shutting down gracefully");
  bot.client.destroy();
  process.exit(0);
});

module.exports = FoodOrderBot;
