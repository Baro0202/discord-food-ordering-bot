const { REST, Routes } = require("discord.js");
require("dotenv").config();

async function clearCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("[INFO] Starting to clear all application commands...");

    // Clear global commands
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
      body: [],
    });

    console.log("[INFO] Successfully cleared all global application commands!");

    // If GUILD_ID is set, also clear guild commands
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: [] }
      );
      console.log(
        `[INFO] Successfully cleared guild commands for ${process.env.GUILD_ID}!`
      );
    }
  } catch (error) {
    console.error("[ERROR] Failed to clear commands:", error);
    process.exit(1);
  }
}

clearCommands();
