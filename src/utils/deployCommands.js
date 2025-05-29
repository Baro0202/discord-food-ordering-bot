const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

async function setupCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, "../commands");

  if (!fs.existsSync(commandsPath)) {
    console.log("[WARNING] Commands directory does not exist");
    return;
  }

  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  // Gather the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${file} is missing a required "data" or "execute" property.`
      );
    }
  }

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  // Deploy commands
  try {
    console.log(
      `[INFO] Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    let data;

    if (process.env.GUILD_ID) {
      // Deploy to specific guild (faster for development)
      data = await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: commands }
      );
      console.log(
        `[INFO] Successfully reloaded ${data.length} guild application (/) commands.`
      );
    } else {
      // Deploy globally (takes up to 1 hour to update)
      data = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log(
        `[INFO] Successfully reloaded ${data.length} global application (/) commands.`
      );
    }
  } catch (error) {
    console.error("[ERROR] Failed to deploy commands:", error);
    throw error;
  }
}

module.exports = { setupCommands };
