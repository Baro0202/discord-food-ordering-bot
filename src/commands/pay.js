const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getInitializedDatabase } = require("../utils/databaseHelper");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Xem thông tin thanh toán cho đơn hàng của bạn")
    .addIntegerOption((option) =>
      option
        .setName("order_id")
        .setDescription(
          "ID đơn hàng cần thanh toán (để trống sẽ hiện tất cả đơn chưa thanh toán)"
        )
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }); // Ephemeral reply

    const database = await getInitializedDatabase();

    try {
      const userId = interaction.user.id;
      const orderId = interaction.options.getInteger("order_id");

      if (orderId) {
        // Show specific order payment info
        await showSpecificOrderPayment(interaction, database, userId, orderId);
      } else {
        // Show all pending payment orders
        await showPendingPaymentOrders(interaction, database, userId);
      }
    } catch (error) {
      console.error("Error in pay command:", error);
      await interaction.editReply({
        embeds: [
          {
            color: 0xff0000,
            title: "❌ Lỗi",
            description:
              "Có lỗi xảy ra khi tải thông tin thanh toán. Vui lòng thử lại!",
            timestamp: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
          },
        ],
      });
    } finally {
      database.close();
    }
  },
};

async function showSpecificOrderPayment(
  interaction,
  database,
  userId,
  orderId
) {
  // Get specific order
  const order = await database.getOrderById(orderId);

  if (!order) {
    await interaction.editReply({
      embeds: [
        {
          color: 0xff9900,
          title: "❌ Không tìm thấy đơn hàng",
          description: `Đơn hàng #${orderId} không tồn tại hoặc không thuộc về bạn.`,
          timestamp: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
        },
      ],
    });
    return;
  }

  if (order.user_id !== userId) {
    await interaction.editReply({
      embeds: [
        {
          color: 0xff0000,
          title: "❌ Không có quyền truy cập",
          description:
            "Bạn không có quyền xem thông tin thanh toán của đơn hàng này.",
          timestamp: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
        },
      ],
    });
    return;
  }

  // Check if order is cancelled
  if (order.status === "cancelled") {
    await interaction.editReply({
      embeds: [
        {
          color: 0xff0000,
          title: "❌ Đơn hàng đã bị hủy",
          description: `Đơn hàng #${orderId} đã bị hủy và không thể thanh toán.`,
          fields: [
            {
              name: "📅 Ngày đặt",
              value: moment
                .utc(order.created_at)
                .tz("Asia/Ho_Chi_Minh")
                .format("DD/MM/YYYY HH:mm"),
              inline: true,
            },
            {
              name: "🔄 Trạng thái",
              value: getStatusText(order.status),
              inline: true,
            },
          ],
          timestamp: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
        },
      ],
    });
    return;
  }

  if (order.payment_status === "paid") {
    await interaction.editReply({
      embeds: [
        {
          color: 0x00ff00,
          title: "✅ Đơn hàng đã thanh toán",
          description: `Đơn hàng #${orderId} đã được thanh toán thành công!`,
          fields: [
            {
              name: "💰 Số tiền",
              value: formatPrice(order.total_amount),
              inline: true,
            },
            {
              name: "📅 Ngày đặt",
              value: moment
                .utc(order.created_at)
                .tz("Asia/Ho_Chi_Minh")
                .format("DD/MM/YYYY HH:mm"),
              inline: true,
            },
            {
              name: "🔄 Trạng thái",
              value: getStatusText(order.status),
              inline: true,
            },
          ],
          timestamp: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
        },
      ],
    });
    return;
  }

  // Show payment screen similar to handlePaymentButton
  const embed = new EmbedBuilder()
    .setColor(0xff1493)
    .setTitle("💳 Thanh toán đơn hàng")
    .setDescription(`**Đơn hàng #${orderId}** - Vui lòng thanh toán qua MoMo`)
    .addFields(
      {
        name: "👤 Khách hàng",
        value: interaction.user.displayName || interaction.user.username,
        inline: true,
      },
      {
        name: "💰 Tổng tiền",
        value: formatPrice(order.total_amount),
        inline: true,
      },
      {
        name: "📅 Ngày giao",
        value: moment(order.menu_date).format("DD/MM/YYYY"),
        inline: true,
      },
      {
        name: "🍽️ Chi tiết đơn hàng",
        value: order.items
          .map(
            (item) =>
              `• ${item.name} x${item.quantity} = ${formatPrice(
                item.price * item.quantity
              )}`
          )
          .join("\n"),
        inline: false,
      },
      {
        name: "💳 Hướng dẫn thanh toán",
        value:
          "1️⃣ Mở ứng dụng **MoMo**\n2️⃣ Quét mã QR bên dưới\n3️⃣ Nhập số tiền và xác nhận\n4️⃣ Gửi ảnh chụp màn hình cho admin",
        inline: false,
      },
      {
        name: "⚠️ Lưu ý",
        value: `• Số tiền chính xác: **${formatPrice(
          order.total_amount
        )}**\n• Nội dung chuyển khoản: **Order #${orderId}**\n• Sau khi chuyển, admin sẽ xác nhận đơn hàng`,
        inline: false,
      }
    )
    .setImage(
      "https://salt.tkbcdn.com/ts/ds/7b/6d/a9/efae12b2a7e9bf659ca5898fd74bfb7b.jpg"
    ) // QR code từ .env
    .setFooter({ text: `ID đơn hàng: ${orderId} | Cảm ơn bạn đã đặt hàng!` })
    .setTimestamp(moment().tz("Asia/Ho_Chi_Minh").toDate());

  await interaction.editReply({
    embeds: [embed],
  });
}

async function showPendingPaymentOrders(interaction, database, userId) {
  // Get ALL pending payment orders for user (not just today)
  // We need to query all orders and filter them
  const { data: allOrders, error } = await database.supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("payment_status", "pending")
    .neq("status", "cancelled") // Exclude cancelled orders
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending orders:", error);
    throw error;
  }

  const pendingOrders = allOrders || [];

  if (pendingOrders.length === 0) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x00ff00,
          title: "✅ Không có đơn hàng chờ thanh toán",
          description:
            "Bạn không có đơn hàng nào cần thanh toán.\n\nSử dụng `/menu` để đặt món mới!",
          timestamp: moment().tz("Asia/Ho_Chi_Minh").toISOString(),
        },
      ],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xff9900)
    .setTitle("💳 Đơn Hàng Chờ Thanh Toán")
    .setDescription(
      `Bạn có **${pendingOrders.length}** đơn hàng chưa thanh toán`
    )
    .setImage(
      "https://salt.tkbcdn.com/ts/ds/7b/6d/a9/efae12b2a7e9bf659ca5898fd74bfb7b.jpg"
    )
    .setTimestamp(moment().tz("Asia/Ho_Chi_Minh").toDate());

  let totalAmount = 0;

  pendingOrders.forEach((order, index) => {
    totalAmount += parseFloat(order.total_amount);

    const orderItems = order.items
      .map((item) => `• ${item.name} x${item.quantity}`)
      .join("\n");

    embed.addFields({
      name: `🛍️ Đơn hàng #${order.id}`,
      value: [
        orderItems,
        `💰 **Tổng:** ${formatPrice(order.total_amount)}`,
        `📅 **Ngày giao:** ${moment(order.menu_date).format("DD/MM/YYYY")}`,
        `⏰ **Đặt lúc:** ${moment
          .utc(order.created_at)
          .tz("Asia/Ho_Chi_Minh")
          .format("HH:mm DD/MM")}`,
        `🔄 **Trạng thái:** ${getStatusText(order.status)}`,
        `💳 **Thanh toán:** /pay ${order.id}`,
      ].join("\n"),
      inline: false,
    });
  });

  embed.addFields({
    name: "💰 Tổng Cần Thanh Toán",
    value: formatPrice(totalAmount),
    inline: false,
  });

  embed.addFields({
    name: "💸 Hướng dẫn nhanh",
    value: [
      "• Sử dụng `/pay [ID]` để xem chi tiết thanh toán từng đơn",
      "• Chuyển khoản MoMo với nội dung `Order #[ID]`",
      "• Ví dụ: `/pay 123` hoặc nội dung chuyển khoản `Order #123`",
    ].join("\n"),
    inline: false,
  });

  await interaction.editReply({
    embeds: [embed],
  });
}

// Helper functions
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
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
