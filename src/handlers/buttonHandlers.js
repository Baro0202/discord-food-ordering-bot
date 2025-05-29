const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const SupabaseDatabase = require("../database/supabase");
const moment = require("moment");

// Temporary storage for user carts (in production, use Redis or database)
const userCarts = new Map();

async function handleOrderButton(interaction, params) {
  const action = params[0];

  switch (action) {
    case "cart":
      await showCart(interaction);
      break;
    case "history":
      await showOrderHistory(interaction);
      break;
    case "help":
      await showHelp(interaction);
      break;
    default:
      await interaction.reply({
        content: "❌ Hành động không hợp lệ!",
        ephemeral: true,
      });
  }
}

async function handleConfirmButton(interaction, params) {
  const orderId = params[0];

  if (!orderId) {
    await interaction.reply({
      content: "❌ ID đơn hàng không hợp lệ!",
      ephemeral: true,
    });
    return;
  }

  const database = new SupabaseDatabase();
  await database.init();

  try {
    const order = await database.getOrder(parseInt(orderId));

    if (!order) {
      await interaction.reply({
        content: "❌ Không tìm thấy đơn hàng!",
        ephemeral: true,
      });
      return;
    }

    if (order.user_id !== interaction.user.id) {
      await interaction.reply({
        content: "❌ Bạn không có quyền thực hiện hành động này!",
        ephemeral: true,
      });
      return;
    }

    // Process order confirmation
    await database.updateOrderStatus(parseInt(orderId), "confirmed");

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Đơn hàng đã được xác nhận!")
      .setDescription(
        `Đơn hàng #${orderId} của bạn đã được xác nhận và sẽ được chuẩn bị.`
      )
      .addFields(
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
        { name: "🚚 Trạng thái", value: "✅ Đã xác nhận", inline: true }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error confirming order:", error);
    await interaction.reply({
      content: "❌ Có lỗi xảy ra khi xác nhận đơn hàng!",
      ephemeral: true,
    });
  } finally {
    database.close();
  }
}

async function handleCancelButton(interaction, params) {
  const orderId = params[0];

  if (!orderId) {
    try {
      await interaction.reply({
        content: "❌ ID đơn hàng không hợp lệ!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error replying to interaction:", error);
    }
    return;
  }

  // Defer reply to prevent timeout
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (error) {
    console.error("Error deferring reply:", error);
    return;
  }

  const database = new SupabaseDatabase();
  await database.init();

  try {
    const order = await database.getOrder(parseInt(orderId));

    if (!order) {
      await interaction.editReply({
        content: "❌ Không tìm thấy đơn hàng!",
      });
      return;
    }

    if (order.user_id !== interaction.user.id) {
      await interaction.editReply({
        content: "❌ Bạn không có quyền thực hiện hành động này!",
      });
      return;
    }

    if (order.status === "delivered" || order.status === "preparing") {
      await interaction.editReply({
        content: "❌ Không thể hủy đơn hàng đã được chuẩn bị hoặc giao!",
      });
      return;
    }

    await database.updateOrderStatus(parseInt(orderId), "cancelled");

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("❌ Đơn hàng đã được hủy")
      .setDescription(`Đơn hàng #${orderId} của bạn đã được hủy thành công.`)
      .addFields(
        {
          name: "💰 Số tiền",
          value: formatPrice(order.total_amount),
          inline: true,
        },
        {
          name: "📅 Ngày",
          value: moment(order.menu_date).format("DD/MM/YYYY"),
          inline: true,
        },
        { name: "🚚 Trạng thái", value: "❌ Đã hủy", inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    try {
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          content: "❌ Có lỗi xảy ra khi hủy đơn hàng!",
        });
      }
    } catch (editError) {
      console.error("Error editing reply:", editError);
    }
  } finally {
    database.close();
  }
}

async function handlePaymentButton(interaction, params) {
  const orderId = params[0];

  if (!orderId) {
    try {
      await interaction.reply({
        content: "❌ ID đơn hàng không hợp lệ!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error replying to interaction:", error);
    }
    return;
  }

  // Defer reply to prevent timeout
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (error) {
    console.error("Error deferring reply:", error);
    return;
  }

  const database = new SupabaseDatabase();
  await database.init();

  try {
    const order = await database.getOrder(parseInt(orderId));

    if (!order) {
      await interaction.editReply({
        content: "❌ Không tìm thấy đơn hàng!",
      });
      return;
    }

    if (order.user_id !== interaction.user.id) {
      await interaction.editReply({
        content: "❌ Bạn không có quyền thực hiện hành động này!",
      });
      return;
    }

    // Hiển thị thông tin thanh toán MoMo
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
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    try {
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          content: "❌ Có lỗi xảy ra khi xử lý thanh toán!",
        });
      }
    } catch (editError) {
      console.error("Error editing reply:", editError);
    }
  } finally {
    database.close();
  }
}

async function showCart(interaction) {
  const userId = interaction.user.id;
  const cart = userCarts.get(userId) || [];

  if (cart.length === 0) {
    await interaction.reply({
      embeds: [
        {
          color: 0xff9900,
          title: "🛒 Giỏ hàng trống",
          description:
            "Bạn chưa thêm món nào vào giỏ hàng.\nSử dụng menu để chọn món!",
          timestamp: new Date(),
        },
      ],
      ephemeral: true,
    });
    return;
  }

  const database = new SupabaseDatabase();
  await database.init();

  try {
    // Get item details
    const allItems = await database.getMenuItems(false); // Get all items
    const items = allItems.filter((item) =>
      cart.some((cartItem) => cartItem.itemId === item.id)
    );

    let totalAmount = 0;
    const cartDetails = items
      .map((item) => {
        const subtotal =
          item.price * cart.find((i) => i.itemId === item.id).quantity;
        totalAmount += subtotal;

        return {
          name: item.name,
          price: item.price,
          quantity: cart.find((i) => i.itemId === item.id).quantity,
          subtotal: subtotal,
        };
      })
      .filter(Boolean);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("🛒 Giỏ hàng của bạn")
      .setDescription(
        cartDetails
          .map(
            (item) =>
              `**${item.name}**\n${formatPrice(item.price)} x ${
                item.quantity
              } = ${formatPrice(item.subtotal)}`
          )
          .join("\n\n")
      )
      .addFields(
        { name: "💰 Tổng cộng", value: formatPrice(totalAmount), inline: true },
        { name: "🍽️ Số món", value: cart.length.toString(), inline: true }
      )
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cart_checkout")
        .setLabel("✅ Đặt hàng")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cart_clear")
        .setLabel("🗑️ Xóa giỏ hàng")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cart_edit")
        .setLabel("✏️ Chỉnh sửa")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [buttons],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error showing cart:", error);
    await interaction.reply({
      content: "❌ Có lỗi xảy ra khi hiển thị giỏ hàng!",
      ephemeral: true,
    });
  } finally {
    database.close();
  }
}

async function showOrderHistory(interaction) {
  const database = new SupabaseDatabase();
  await database.init();

  try {
    const orders = await database.getUserOrders(interaction.user.id, 5);

    if (orders.length === 0) {
      await interaction.reply({
        embeds: [
          {
            color: 0xff9900,
            title: "📋 Chưa có đơn hàng",
            description:
              "Bạn chưa có đơn hàng nào.\nSử dụng `/menu` để đặt món đầu tiên!",
            timestamp: new Date(),
          },
        ],
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x9932cc)
      .setTitle("📋 Lịch sử đặt hàng")
      .setDescription(
        `5 đơn hàng gần nhất của ${
          interaction.user.displayName || interaction.user.username
        }`
      )
      .setTimestamp();

    orders.forEach((order) => {
      const statusEmoji = getStatusEmoji(order.status);
      embed.addFields({
        name: `${statusEmoji} Đơn #${order.id} - ${moment(
          order.menu_date
        ).format("DD/MM/YYYY")}`,
        value: `💰 ${formatPrice(order.total_amount)} | 🚚 ${
          order.status
        }\n📅 ${moment(order.created_at).format("DD/MM/YYYY HH:mm")}`,
        inline: false,
      });
    });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error showing order history:", error);
    await interaction.reply({
      content: "❌ Có lỗi xảy ra khi hiển thị lịch sử!",
      ephemeral: true,
    });
  } finally {
    database.close();
  }
}

async function showHelp(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("❓ Hướng dẫn sử dụng Bot Đặt Cơm")
    .setDescription("Bot giúp bạn đặt cơm hàng ngày một cách dễ dàng!")
    .addFields(
      {
        name: "🍽️ Đặt món",
        value:
          "• Sử dụng `/menu` để xem menu hôm nay\n• Chọn món từ dropdown menu\n• Chọn số lượng\n• Xem giỏ hàng và đặt hàng",
        inline: false,
      },
      {
        name: "🛒 Quản lý đơn hàng",
        value:
          '• Xem giỏ hàng: Click "🛒 Xem giỏ hàng"\n• Lịch sử: Click "📋 Lịch sử đặt hàng"\n• Hủy đơn: Liên hệ admin hoặc sử dụng nút hủy',
        inline: false,
      },
      {
        name: "⏰ Thời gian đặt hàng",
        value:
          `Chào mừng bạn đến với hệ thống đặt cơm!\n\n` +
          `**🕘 Thời gian đặt món:**\n` +
          `• Hạn đặt: **${
            process.env.ORDER_DEADLINE || "23:59"
          }** mỗi ngày\n• Giao hàng: **12:00 PM**\n• Nhắc nhở tự động: **9:00 AM** và **9:45 AM**`,
        inline: false,
      },
      {
        name: "💳 Thanh toán",
        value:
          "• Hiện tại: Thanh toán khi nhận hàng (COD)\n• Sắp tới: Tích hợp thanh toán online",
        inline: false,
      },
      {
        name: "🔧 Admin Commands",
        value:
          "• `/admin additem` - Thêm món mới\n• `/admin setmenu` - Thiết lập menu hàng ngày\n• `/admin orders` - Xem đơn hàng\n• `/admin stats` - Thống kê",
        inline: false,
      }
    )
    .setFooter({ text: "Cần hỗ trợ? Liên hệ admin của server!" })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

async function handleAdminUpdateButton(interaction, params) {
  // Only allow admin user to use admin buttons
  const adminUserId = process.env.ADMIN_USER_ID;

  if (!adminUserId || interaction.user.id !== adminUserId) {
    await interaction.reply({
      content: "❌ Bạn không có quyền thực hiện hành động này!",
      ephemeral: true,
    });
    return;
  }

  const action = params[0]; // chỉ có payment
  const orderId = parseInt(params[1]);
  const newValue = params[2]; // paid

  if (!orderId || !newValue || action !== "payment") {
    await interaction.reply({
      content: "❌ Thông tin không hợp lệ!",
      ephemeral: true,
    });
    return;
  }

  const database = new SupabaseDatabase();
  await database.init();

  try {
    const order = await database.getOrder(orderId);
    if (!order) {
      await interaction.reply({
        content: "❌ Không tìm thấy đơn hàng!",
        ephemeral: true,
      });
      return;
    }

    // Kiểm tra đã thanh toán chưa
    if (order.payment_status === "paid") {
      await interaction.reply({
        content: "✅ Đơn hàng này đã được thanh toán rồi!",
        ephemeral: true,
      });
      return;
    }

    // Update payment status
    await database.updatePaymentStatus(orderId, newValue);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("💳 Xác nhận thanh toán thành công!")
      .addFields(
        { name: "🆔 Đơn hàng", value: `#${orderId}`, inline: true },
        { name: "👤 Khách hàng", value: order.username, inline: true },
        {
          name: "💰 Số tiền",
          value: formatPrice(order.total_amount),
          inline: true,
        },
        { name: "👨‍💼 Admin", value: interaction.user.displayName, inline: true }
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });

    // Send notification to admin channel
    const orderChannelId = process.env.ORDER_CHANNEL_ID;
    if (orderChannelId && orderChannelId !== interaction.channel.id) {
      try {
        const orderChannel =
          interaction.client.channels.cache.get(orderChannelId);
        if (orderChannel) {
          await orderChannel.send({
            content: `✅ **Đã xác nhận thanh toán**`,
            embeds: [embed],
          });
        }
      } catch (error) {
        console.error("Could not send to admin channel:", error);
      }
    }

    // Send notification to customer
    try {
      const user = await interaction.client.users.fetch(order.user_id);
      const customerEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("💳 Thanh toán đã được xác nhận!")
        .setDescription(
          `Đơn hàng #${orderId} của bạn đã được thanh toán thành công.`
        )
        .addFields(
          {
            name: "💰 Số tiền",
            value: formatPrice(order.total_amount),
            inline: true,
          },
          {
            name: "📅 Ngày",
            value: moment(order.menu_date).format("DD/MM/YYYY"),
            inline: true,
          }
        )
        .setTimestamp();

      await user.send({ embeds: [customerEmbed] });
    } catch (error) {
      console.log("Could not send DM to customer:", error.message);
    }
  } catch (error) {
    console.error("Error updating payment:", error);
    await interaction.reply({
      content: "❌ Có lỗi xảy ra khi cập nhật thanh toán!",
      ephemeral: true,
    });
  } finally {
    database.close();
  }
}

async function handleQuickMenu(interaction, params) {
  // Simulate /menu command execution
  const SupabaseDatabase = require("../database/supabase");
  const moment = require("moment");

  await interaction.deferReply({ flags: 64 }); // 64 = ephemeral flag

  const database = new SupabaseDatabase();
  await database.init();

  try {
    const today = moment().format("YYYY-MM-DD");
    const orderDeadline = process.env.ORDER_DEADLINE || "23:59";

    // Check if it's past order deadline
    const currentTime = moment().format("HH:mm");
    if (orderDeadline !== "23:59" && currentTime > orderDeadline) {
      await interaction.editReply({
        embeds: [
          {
            color: 0xff0000,
            title: "⏰ Đã hết hạn đặt món",
            description: `Hạn đặt món hôm nay là **${orderDeadline}**.\nVui lòng đặt sớm hơn vào ngày mai!`,
            timestamp: new Date(),
          },
        ],
      });
      return;
    }

    // Get today's menu
    const dailyMenu = await database.getDailyMenu(today);

    if (!dailyMenu) {
      await interaction.editReply({
        embeds: [
          {
            color: 0xff9900,
            title: "📋 Chưa có menu hôm nay",
            description:
              "Admin chưa cập nhật menu cho hôm nay.\nVui lòng thử lại sau!",
            timestamp: new Date(),
          },
        ],
      });
      return;
    }

    // Quick redirect to menu command
    await interaction.editReply({
      embeds: [
        {
          color: 0x00ff00,
          title: "🍽️ Chuyển đến menu...",
          description: "Sử dụng lệnh `/menu` để xem menu chi tiết và đặt cơm!",
          timestamp: new Date(),
        },
      ],
    });
  } catch (error) {
    console.error("Error in quick menu:", error);
    await interaction.editReply({
      content: "❌ Có lỗi xảy ra! Vui lòng sử dụng lệnh `/menu` thay thế.",
    });
  } finally {
    database.close();
  }
}

// Helper functions
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
    delivered: "🚚",
    cancelled: "❌",
  };
  return emojis[status] || "❓";
}

module.exports = {
  handleOrderButton,
  handleConfirmButton,
  handleCancelButton,
  handlePaymentButton,
  handleAdminUpdateButton,
  userCarts,
  handleQuickMenu,
};
