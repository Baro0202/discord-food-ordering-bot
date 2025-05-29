/**
 * Utility functions for managing Discord messages
 */

/**
 * Send a temporary message that auto-deletes after specified time
 * @param {Object} interaction - Discord interaction
 * @param {Object} content - Message content (embeds, content, etc.)
 * @param {number} deleteAfter - Time in milliseconds before deletion (default: 30 seconds)
 * @param {boolean} isEdit - Whether to edit existing reply or send new
 */
async function sendTemporaryMessage(
  interaction,
  content,
  deleteAfter = 30000,
  isEdit = false
) {
  try {
    let message;

    if (isEdit && (interaction.deferred || interaction.replied)) {
      message = await interaction.editReply(content);
    } else {
      message = await interaction.reply({ ...content, ephemeral: true });
    }

    // Set timer to delete message
    setTimeout(async () => {
      try {
        if (message && message.delete) {
          await message.delete();
        } else if (interaction.deleteReply) {
          await interaction.deleteReply();
        }
        console.log(`🗑️ Auto-deleted message after ${deleteAfter / 1000}s`);
      } catch (error) {
        console.log(
          "⚠️ Could not delete message (might be ephemeral):",
          error.message
        );
      }
    }, deleteAfter);

    return message;
  } catch (error) {
    console.error("Error sending temporary message:", error);
    throw error;
  }
}

/**
 * Send success message that auto-deletes
 */
async function sendSuccessMessage(interaction, content, deleteAfter = 15000) {
  const successContent = {
    embeds: [
      {
        color: 0x00ff00,
        title: "✅ Thành công!",
        description: content,
        timestamp: new Date(),
      },
    ],
  };

  return await sendTemporaryMessage(interaction, successContent, deleteAfter);
}

/**
 * Send error message that auto-deletes
 */
async function sendErrorMessage(interaction, content, deleteAfter = 10000) {
  const errorContent = {
    embeds: [
      {
        color: 0xff0000,
        title: "❌ Lỗi!",
        description: content,
        timestamp: new Date(),
      },
    ],
  };

  return await sendTemporaryMessage(interaction, errorContent, deleteAfter);
}

/**
 * Send payment confirmation that stays longer
 */
async function sendPaymentMessage(interaction, content, deleteAfter = 300000) {
  // 5 minutes
  return await sendTemporaryMessage(interaction, content, deleteAfter, true);
}

module.exports = {
  sendTemporaryMessage,
  sendSuccessMessage,
  sendErrorMessage,
  sendPaymentMessage,
};
