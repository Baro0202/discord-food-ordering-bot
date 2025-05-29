const {
  handleOrderButton,
  handleConfirmButton,
  handleCancelButton,
  handlePaymentButton,
  handleAdminUpdateButton,
  handleQuickMenu,
} = require("../handlers/buttonHandlers");
const {
  handleMenuItemSelection,
  handleQuantitySelection,
  handleCartCheckout,
  handleCartClear,
} = require("../handlers/selectMenuHandlers");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    // Debug: Log user info for admin setup
    console.log("=== USER ID DEBUG ===");
    console.log("User:", interaction.user.username);
    console.log("User ID:", interaction.user.id);
    console.log("Command:", interaction.commandName || interaction.customId);
    console.log("========================");

    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);

        const errorMessage = {
          content: "❌ Có lỗi xảy ra khi thực hiện lệnh này!",
          ephemeral: true,
        };

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (followUpError) {
          console.error("Error sending error response:", followUpError);
          // Don't try to respond again if interaction is invalid
          if (followUpError.code === 10062) {
            console.warn(
              "Interaction has expired or is invalid - skipping error response"
            );
          }
        }
      }
    }

    // Handle button interactions
    else if (interaction.isButton()) {
      try {
        await handleButtonInteraction(interaction);
      } catch (error) {
        console.error("Error handling button interaction:", error);

        const errorMessage = {
          content: "❌ Có lỗi xảy ra khi xử lý tương tác!",
          ephemeral: true,
        };

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (followUpError) {
          console.error("Error sending error response:", followUpError);
          // Don't try to respond again if interaction is invalid
          if (followUpError.code === 10062) {
            console.warn(
              "Interaction has expired or is invalid - skipping error response"
            );
          }
        }
      }
    }

    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      try {
        await handleSelectMenuInteraction(interaction);
      } catch (error) {
        console.error("Error handling select menu interaction:", error);

        const errorMessage = {
          content: "❌ Có lỗi xảy ra khi xử lý menu!",
          ephemeral: true,
        };

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (followUpError) {
          console.error("Error sending error response:", followUpError);
          // Don't try to respond again if interaction is invalid
          if (followUpError.code === 10062) {
            console.warn(
              "Interaction has expired or is invalid - skipping error response"
            );
          }
        }
      }
    }
  },
};

async function handleButtonInteraction(interaction) {
  const [action, ...params] = interaction.customId.split("_");

  switch (action) {
    case "order":
      await handleOrderButton(interaction, params);
      break;
    case "confirm":
      await handleConfirmButton(interaction, params);
      break;
    case "cancel":
      await handleCancelButton(interaction, params);
      break;
    case "payment":
      await handlePaymentButton(interaction, params);
      break;
    case "admin":
      await handleAdminUpdateButton(interaction, params);
      break;
    case "quick":
      await handleQuickMenu(interaction, params);
      break;
    case "cart":
      if (params[0] === "checkout") {
        await handleCartCheckout(interaction);
      } else if (params[0] === "clear") {
        await handleCartClear(interaction);
      }
      break;
    case "continue":
      if (params[0] === "shopping") {
        await interaction.reply({
          content: "🛍️ Sử dụng `/menu` để tiếp tục chọn món!",
          ephemeral: true,
        });
      }
      break;
    default:
      await interaction.reply({
        content: "❌ Tương tác không hợp lệ!",
        ephemeral: true,
      });
  }
}

async function handleSelectMenuInteraction(interaction) {
  const [action, ...params] = interaction.customId.split("_");

  switch (action) {
    case "menuitems":
      await handleMenuItemSelection(interaction, params);
      break;
    case "quantity":
      await handleQuantitySelection(interaction, params);
      break;
    default:
      await interaction.reply({
        content: "❌ Menu không hợp lệ!",
        ephemeral: true,
      });
  }
}
