const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getInitializedDatabase } = require("../utils/databaseHelper");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("myorders")
    .setDescription("Xem đơn đặt hàng của bạn hôm nay"),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const database = await getInitializedDatabase();

    try {
      const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
      const userId = interaction.user.id;

      // Get user's orders for today
      const orders = await database.getUserOrdersByDate(userId, today);

      if (!orders || orders.length === 0) {
        await interaction.editReply({
          embeds: [
            {
              color: 0xff9900,
              title: "📋 Không có đơn hàng",
              description: `Bạn chưa đặt món nào hôm nay (${moment(today)
                .tz("Asia/Ho_Chi_Minh")
                .format("DD/MM/YYYY")}).\n\nSử dụng lệnh \`/menu\` để đặt món!`,
              timestamp: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
            },
          ],
        });
        return;
      }

      // Create embed
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("📋 Đơn đặt hàng hôm nay")
        .setDescription(
          `📅 **Ngày:** ${moment(today)
            .tz("Asia/Ho_Chi_Minh")
            .format("DD/MM/YYYY")}\n🕐 **Hiện tại:** ${moment()
            .tz("Asia/Ho_Chi_Minh")
            .format("HH:mm:ss DD/MM/YYYY")}`
        )
        .setTimestamp(moment().tz("Asia/Ho_Chi_Minh").toDate());

      let totalAmount = 0;
      let totalItems = 0;

      // Process each order
      orders.forEach((order, index) => {
        totalAmount += parseFloat(order.total_amount);

        // Parse order items
        const items = order.items;
        const itemsList = items
          .map((item) => {
            totalItems += item.quantity;
            return `• **${item.name}** x${item.quantity} - ${formatPrice(
              item.price * item.quantity
            )}`;
          })
          .join("\n");

        const statusEmoji = getStatusEmoji(order.status);
        const paymentEmoji = getPaymentStatusEmoji(order.payment_status);

        embed.addFields({
          name: `🛍️ Đơn hàng #${order.id} ${statusEmoji}`,
          value: `${itemsList}\n\n💰 **Tổng:** ${formatPrice(
            order.total_amount
          )}\n💳 **Thanh toán:** ${getPaymentStatusText(
            order.payment_status
          )} ${paymentEmoji}\n⏰ **Đặt lúc:** ${moment
            .utc(order.created_at)
            .tz("Asia/Ho_Chi_Minh")
            .format("HH:mm:ss DD/MM/YYYY")}`,
          inline: false,
        });

        if (order.notes) {
          embed.addFields({
            name: "📝 Ghi chú",
            value: order.notes,
            inline: false,
          });
        }
      });

      // Add summary
      embed.addFields({
        name: "📊 Tổng kết",
        value: `🍽️ **Tổng số món:** ${totalItems}\n💰 **Tổng tiền:** ${formatPrice(
          totalAmount
        )}\n📦 **Số đơn hàng:** ${orders.length}`,
        inline: false,
      });

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error in myorders command:", error);
      await interaction.editReply({
        embeds: [
          {
            color: 0xff0000,
            title: "❌ Lỗi",
            description: "Có lỗi xảy ra khi tải đơn hàng. Vui lòng thử lại!",
            timestamp: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
          },
        ],
      });
    } finally {
      database.close();
    }
  },
};

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function getStatusEmoji(status) {
  const emojis = {
    pending: "⏳",
    confirmed: "✅",
    preparing: "👨‍🍳",
    ready: "🍽️",
    delivered: "🚚",
    cancelled: "❌",
  };
  return emojis[status] || "❓";
}

function getPaymentStatusEmoji(paymentStatus) {
  const emojis = {
    pending: "⏳",
    paid: "✅",
    failed: "❌",
    refunded: "🔄",
  };
  return emojis[paymentStatus] || "❓";
}

function getStatusText(status) {
  const statusTexts = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    preparing: "Đang chuẩn bị",
    ready: "Sẵn sàng",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };
  return statusTexts[status] || "Không xác định";
}

function getPaymentStatusText(paymentStatus) {
  const paymentTexts = {
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    failed: "Thanh toán thất bại",
    refunded: "Đã hoàn tiền",
  };
  return paymentTexts[paymentStatus] || "Không xác định";
}
