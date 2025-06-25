const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const timeSlotManager = require("../utils/timeSlots");
const TimeHelper = require("../utils/timeHelper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeslots")
    .setDescription("Xem tất cả khung giờ đặt cơm trong ngày"),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }); // Ephemeral reply

    try {
      // Kiểm tra ngày làm việc
      if (!timeSlotManager.isWorkingDay()) {
        await interaction.editReply({
          embeds: [
            {
              color: 0xff9900,
              title: "🏖️ Không phải ngày làm việc",
              description:
                "Dịch vụ đặt cơm chỉ hoạt động từ **Thứ 2 đến Thứ 6**.\nChúc bạn cuối tuần vui vẻ! 🎉",
              timestamp: TimeHelper.embedTimestamp(),
            },
          ],
        });
        return;
      }

      // Lấy thông tin khung giờ hiện tại
      const currentPeriod = timeSlotManager.getCurrentMealPeriod();
      const timeSlotEmbed = timeSlotManager.createTimeSlotEmbed();

      // Tạo embed chính
      const mainEmbed = new EmbedBuilder()
        .setColor(timeSlotEmbed.color)
        .setTitle(timeSlotEmbed.title)
        .setDescription(timeSlotEmbed.description)
        .setTimestamp(TimeHelper.embedTimestamp());

      // Thêm thông tin khung giờ hiện tại
      if (currentPeriod.isOrderingTime) {
        mainEmbed.addFields({
          name: "🔥 Khung giờ hiện tại",
          value:
            `${currentPeriod.emoji} **${currentPeriod.name}** - Đang mở đặt món!\n` +
            `⏱️ Còn lại đến **${currentPeriod.orderDeadline}** để đặt\n` +
            `🚚 Giao hàng lúc **${currentPeriod.deliveryTime}**`,
          inline: false,
        });
      } else if (currentPeriod.nextPeriod) {
        const next = currentPeriod.nextPeriod;
        const isNextDay = next.date ? " (ngày mai)" : "";

        mainEmbed.addFields({
          name: "⏳ Khung giờ tiếp theo",
          value:
            `${next.emoji} **${next.name}${isNextDay}**\n` +
            `🕐 Mở đặt món lúc **${next.orderStart}**\n` +
            `⏰ Hạn đặt: **${next.orderDeadline}**`,
          inline: false,
        });
      }

      // Thêm các khung giờ trong ngày
      timeSlotEmbed.fields.forEach((field) => {
        mainEmbed.addFields(field);
      });

      // Thêm hướng dẫn sử dụng
      mainEmbed.addFields({
        name: "📖 Hướng dẫn",
        value:
          "🍽️ Sử dụng `/menu` để xem menu và đặt món\n" +
          "📋 Sử dụng `/myorders` để xem đơn hàng của bạn\n" +
          "❓ Sử dụng `/help` để xem tất cả lệnh",
        inline: false,
      });

      await interaction.editReply({ embeds: [mainEmbed] });
    } catch (error) {
      console.error("[ERROR] Timeslots command error:", error);
      await interaction.editReply({
        embeds: [
          {
            color: 0xff0000,
            title: "❌ Lỗi hệ thống",
            description:
              "Có lỗi xảy ra khi lấy thông tin khung giờ. Vui lòng thử lại sau!",
            timestamp: TimeHelper.embedTimestamp(),
          },
        ],
      });
    }
  },
};
