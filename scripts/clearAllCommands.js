require("dotenv").config();
const { REST, Routes } = require("discord.js");

async function clearAllCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("Clearing guild commands...");
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: [] }
      );
      console.log("Guild commands cleared.");
    }

    console.log("Clearing global commands...");
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
      body: [],
    });
    console.log("Global commands cleared.");

    console.log("✅ All commands cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing commands:", error);
  }
}

clearAllCommands();
