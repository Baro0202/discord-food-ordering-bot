const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getInitializedDatabase } = require("../utils/databaseHelper");
const TimeHelper = require("../utils/timeHelper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("menu")
    .setDescription("Xem menu hôm nay và đặt món"),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const database = await getInitializedDatabase();

    try {
      // Check if ordering is allowed now
      const orderDeadline = process.env.ORDER_DEADLINE || "09:45";
      const orderStartTime = process.env.ORDER_START_TIME || "08:00";

      const vnTime = TimeHelper.currentTime();

      // Check if it's before order start time
      if (
        orderStartTime !== "00:00" &&
        TimeHelper.isBeforeStartTime(orderStartTime)
      ) {
        await interaction.editReply({
          embeds: [
            {
              color: 0xff9900,
              title: "⏰ Chưa đến giờ đặt món",
              description: `Thời gian đặt món: **${orderStartTime} - ${orderDeadline}**\nVui lòng quay lại sau ${orderStartTime}!`,
              timestamp: TimeHelper.embedTimestamp(),
            },
          ],
        });
        return;
      }

      // Check if it's past order deadline (chỉ check nếu không phải 23:59)
      if (
        orderDeadline !== "23:59" &&
        TimeHelper.isPastDeadline(orderDeadline)
      ) {
        await interaction.editReply({
          embeds: [
            {
              color: 0xff0000,
              title: "⏰ Đã hết hạn đặt món",
              description: `Thời gian đặt món: **${orderStartTime} - ${orderDeadline}**\nVui lòng đặt sớm hơn vào ngày mai!`,
              timestamp: TimeHelper.embedTimestamp(),
            },
          ],
        });
        return;
      }

      // Get today's menu
      const dailyMenu = await database.getDailyMenu(TimeHelper.today());

      if (!dailyMenu) {
        await interaction.editReply({
          embeds: [
            {
              color: 0xff9900,
              title: "📋 Chưa có menu hôm nay",
              description:
                "Admin chưa cập nhật menu cho hôm nay.\nVui lòng thử lại sau!",
              timestamp: TimeHelper.embedTimestamp(),
            },
          ],
        });
        return;
      }

      // Get menu items
      let menuItems = [];
      if (
        dailyMenu &&
        dailyMenu.menu_items &&
        dailyMenu.menu_items.length > 0
      ) {
        // Get all available menu items
        const allItems = await database.getMenuItems(true);

        // Filter items that are in today's menu
        menuItems = allItems.filter((item) =>
          dailyMenu.menu_items.includes(item.id)
        );
      } else {
        // Fallback: show all available items if no daily menu is set
        menuItems = await database.getMenuItems(true);
      }

      if (menuItems.length === 0) {
        await interaction.editReply({
          embeds: [
            {
              color: 0xff9900,
              title: "🍽️ Không có món nào",
              description: "Hiện tại không có món ăn nào khả dụng.",
              timestamp: TimeHelper.embedTimestamp(),
            },
          ],
        });
        return;
      }

      // Group items by category
      const categories = {};
      menuItems.forEach((item) => {
        if (!categories[item.category]) {
          categories[item.category] = [];
        }
        categories[item.category].push(item);
      });

      // Create embed
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("🍽️ Menu Hôm Nay")
        .setDescription(
          `📅 **Ngày:** ${TimeHelper.formatDate(
            TimeHelper.today()
          )}\n⏰ **Thời gian đặt:** ${orderStartTime} - ${orderDeadline}\n🚚 **Giao hàng:** ${
            dailyMenu.delivery_time
          }`
        )
        .setTimestamp(TimeHelper.embedTimestamp());

      if (dailyMenu.special_note) {
        embed.addFields({
          name: "📝 Ghi chú đặc biệt",
          value: dailyMenu.special_note,
          inline: false,
        });
      }

      // Add menu items by category
      for (const [categoryName, items] of Object.entries(categories)) {
        const categoryEmoji = getCategoryEmoji(categoryName);
        const itemsList = items
          .map(
            (item) =>
              `**${item.name}** - ${formatPrice(item.price)}\n${
                item.description || "Không có mô tả"
              }`
          )
          .join("\n\n");

        embed.addFields({
          name: `${categoryEmoji} ${capitalizeFirst(categoryName)}`,
          value: itemsList,
          inline: false,
        });
      }

      // Create select menu for ordering
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("menuitems_order")
        .setPlaceholder("Chọn món để đặt...")
        .addOptions(
          menuItems.map((item) => ({
            label: `${item.name} - ${formatPrice(item.price)}`,
            description: item.description
              ? item.description.substring(0, 100)
              : "Không có mô tả",
            value: item.id.toString(),
          }))
        );

      const row1 = new ActionRowBuilder().addComponents(selectMenu);

      // Add buttons
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("order_cart")
          .setLabel("🛒 Xem giỏ hàng")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("order_history")
          .setLabel("📋 Lịch sử đặt hàng")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("order_help")
          .setLabel("❓ Trợ giúp")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({
        embeds: [embed],
        components: [row1, buttons],
      });
    } catch (error) {
      console.error("Error in menu command:", error);
      await interaction.editReply({
        embeds: [
          {
            color: 0xff0000,
            title: "❌ Lỗi",
            description: "Có lỗi xảy ra khi tải menu. Vui lòng thử lại!",
            timestamp: TimeHelper.embedTimestamp(),
          },
        ],
      });
    } finally {
      database.close();
    }
  },
};

function getCategoryEmoji(category) {
  const emojis = {
    main: "🍖",
    soup: "🍲",
    rice: "🍚",
    vegetable: "🥬",
    drink: "🥤",
    dessert: "🍰",
    other: "🍽️",
  };
  return emojis[category] || "🍽️";
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
