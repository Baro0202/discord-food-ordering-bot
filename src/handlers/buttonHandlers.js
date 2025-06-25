const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const { getInitializedDatabase } = require("../utils/databaseHelper");
const TimeHelper = require("../utils/timeHelper");
const reliableMessaging = require("../utils/reliableMessaging");

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

  const database = await getInitializedDatabase();

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
          value: TimeHelper.formatDate(order.menu_date),
          inline: true,
        },
        { name: "🚚 Trạng thái", value: "✅ Đã xác nhận", inline: true }
      )
      .setTimestamp(TimeHelper.embedTimestamp());

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

  const database = await getInitializedDatabase();

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

    // Check if it's past order deadline
    const orderDeadline = process.env.ORDER_DEADLINE || "09:45";
    if (orderDeadline !== "23:59" && TimeHelper.isPastDeadline(orderDeadline)) {
      await interaction.editReply({
        content: `❌ Không thể hủy đơn hàng sau ${orderDeadline}!`,
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
          value: TimeHelper.formatDate(order.menu_date),
          inline: true,
        },
        { name: "🚚 Trạng thái", value: "❌ Đã hủy", inline: true }
      )
      .setTimestamp(TimeHelper.embedTimestamp());

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

  const database = await getInitializedDatabase();

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
          value: TimeHelper.formatDate(order.menu_date),
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
      .setTimestamp(TimeHelper.embedTimestamp());

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
          timestamp: TimeHelper.embedTimestamp(),
        },
      ],
      ephemeral: true,
    });
    return;
  }

  const database = await getInitializedDatabase();

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
      .setTimestamp(TimeHelper.embedTimestamp());

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
  const database = await getInitializedDatabase();

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
            timestamp: TimeHelper.embedTimestamp(),
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
      .setTimestamp(TimeHelper.embedTimestamp());

    orders.forEach((order) => {
      const statusEmoji = getStatusEmoji(order.status);
      embed.addFields({
        name: `${statusEmoji} Đơn #${order.id} - ${TimeHelper.formatDate(
          order.menu_date
        )}`,
        value: `💰 ${formatPrice(order.total_amount)} | 🚚 ${
          order.status
        }\n📅 ${TimeHelper.formatDateTime(order.created_at)}`,
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
            process.env.ORDER_DEADLINE || "09:45"
          }** mỗi ngày\n• Giao hàng: **12:00 PM**\n• Nhắc nhở tự động: **8:00 AM** và **9:30 AM**`,
        inline: false,
      },
      {
        name: "💳 Thanh toán",
        value:
          "• Hiện tại: Thanh toán bằng MoMo)\n• Sắp tới: Tích hợp thanh toán online",
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
    .setTimestamp(TimeHelper.embedTimestamp());

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

  const database = await getInitializedDatabase();

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
      .setTimestamp(TimeHelper.embedTimestamp());

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
        .setTitle("✅ Thanh toán đã được xác nhận!")
        .setDescription(
          `Chào **${order.username}**!\n\nĐơn hàng #${orderId} của bạn đã được thanh toán thành công.`
        )
        .addFields(
          {
            name: "🍽️ Chi tiết đơn hàng",
            value: order.items
              .map((item) => `• ${item.name} x${item.quantity}`)
              .join("\n"),
            inline: false,
          },
          {
            name: "💰 Số tiền đã thanh toán",
            value: formatPrice(order.total_amount),
            inline: true,
          },
          {
            name: "📅 Ngày giao hàng",
            value: TimeHelper.formatDate(order.menu_date),
            inline: true,
          },
          {
            name: "🔄 Trạng thái hiện tại",
            value: "✅ Đã thanh toán - Chuẩn bị giao hàng",
            inline: true,
          }
        )
        .setFooter({ text: "Cảm ơn bạn đã sử dụng dịch vụ đặt cơm!" })
        .setTimestamp(TimeHelper.embedTimestamp());

      await user.send({ embeds: [customerEmbed] });
      console.log(
        `[INFO] Payment confirmation sent to user ${order.user_id} for order #${orderId}`
      );
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
  const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
  } = require("discord.js");
  const TimeHelper = require("../utils/timeHelper");

  await interaction.deferReply({ flags: 64 }); // 64 = ephemeral flag

  const database = await getInitializedDatabase();

  try {
    const today = TimeHelper.today();
    const orderDeadline = process.env.ORDER_DEADLINE || "09:45";
    const orderStartTime = process.env.ORDER_START_TIME || "08:00";

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

    // Check if it's past order deadline
    if (orderDeadline !== "23:59" && TimeHelper.isPastDeadline(orderDeadline)) {
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
    const dailyMenu = await database.getDailyMenu(today);

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
    if (dailyMenu && dailyMenu.menu_items && dailyMenu.menu_items.length > 0) {
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
          today
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
    console.error("Error in quick menu:", error);
    await interaction.editReply({
      content: "❌ Có lỗi xảy ra! Vui lòng thử lại sau.",
    });
  } finally {
    database.close();
  }
}

async function handleConfirmPaymentButton(interaction, params) {
  const orderId = params[0];
  const userId = interaction.user.id;

  // STEP 1: Immediate ACK for payment confirmation
  const operationId = await reliableMessaging.immediateAck(
    interaction,
    "payment_confirmation",
    {
      orderId: orderId,
    }
  );

  if (!operationId) return; // Duplicate operation handled

  // STEP 2: Async processing
  processPaymentConfirmation(interaction, orderId, operationId);
}

async function processPaymentConfirmation(interaction, orderId, operationId) {
  const database = await getInitializedDatabase();

  try {
    const order = await database.getOrder(parseInt(orderId));

    if (!order) {
      const errorMessage = {
        embeds: [
          {
            color: 0xff0000,
            title: "❌ Không tìm thấy đơn hàng!",
            description: "Đơn hàng này có thể đã bị xóa hoặc không tồn tại.",
            footer: { text: "Kiểm tra lại ID đơn hàng" },
          },
        ],
      };
      await reliableMessaging.sendReliableMessage(
        interaction,
        errorMessage,
        operationId
      );
      return;
    }

    if (order.user_id !== interaction.user.id) {
      const errorMessage = {
        embeds: [
          {
            color: 0xff0000,
            title: "❌ Không có quyền truy cập!",
            description: "Bạn không có quyền thực hiện hành động này.",
            footer: { text: "Chỉ chủ đơn hàng mới có thể xác nhận" },
          },
        ],
      };
      await reliableMessaging.sendReliableMessage(
        interaction,
        errorMessage,
        operationId
      );
      return;
    }

    if (order.payment_status === "paid") {
      const alreadyPaidMessage = {
        embeds: [
          {
            color: 0x00ff00,
            title: "✅ Đã thanh toán rồi!",
            description: "Đơn hàng này đã được thanh toán và xác nhận.",
            footer: { text: `Đơn hàng #${orderId}` },
          },
        ],
      };
      await reliableMessaging.sendReliableMessage(
        interaction,
        alreadyPaidMessage,
        operationId
      );
      return;
    }

    // Update payment status to pending confirmation
    await database.updateOrderPaymentStatus(
      parseInt(orderId),
      "pending_confirmation"
    );

    // STEP 3: Send success message to user with retry
    const userSuccessMessage = {
      embeds: [
        {
          color: 0x00ff00,
          title: "✅ Đã gửi xác nhận thanh toán!",
          description: `Cảm ơn bạn đã xác nhận chuyển khoản cho đơn hàng #${orderId}`,
          fields: [
            {
              name: "💰 Số tiền",
              value: formatPrice(order.total_amount),
              inline: true,
            },
            {
              name: "📅 Thời gian",
              value: TimeHelper.formatDateTime(new Date()),
              inline: true,
            },
            {
              name: "🔄 Trạng thái",
              value: "⏳ Chờ admin xác nhận",
              inline: true,
            },
          ],
          footer: {
            text: "Admin sẽ kiểm tra và xác nhận thanh toán của bạn trong thời gian sớm nhất. Bạn sẽ được thông báo khi thanh toán được xác nhận.",
          },
        },
      ],
      ephemeral: true, // 🔒 PRIVACY PROTECTION
    };

    await reliableMessaging.sendReliableMessage(
      interaction,
      userSuccessMessage,
      operationId
    );

    // STEP 4: Send notification to admin (non-blocking)
    notifyAdminPaymentConfirmation(interaction, order, orderId).catch(
      (error) => {
        console.error("[PAYMENT] Admin notification failed:", error.message);
      }
    );
  } catch (error) {
    console.error("Error confirming payment:", error);

    const errorMessage = {
      embeds: [
        {
          color: 0xff0000,
          title: "❌ Lỗi xác nhận thanh toán",
          description: "Có lỗi xảy ra khi xử lý xác nhận thanh toán!",
          fields: [
            {
              name: "💡 Hướng dẫn",
              value:
                "• Thử lại sau ít phút\n• Kiểm tra kết nối mạng\n• Liên hệ admin nếu vấn đề tiếp tục",
              inline: false,
            },
          ],
          footer: { text: "Lỗi hệ thống" },
        },
      ],
      ephemeral: true, // 🔒 PRIVACY PROTECTION
    };

    await reliableMessaging.sendReliableMessage(
      interaction,
      errorMessage,
      operationId
    );
  } finally {
    database.close();
  }
}

async function notifyAdminPaymentConfirmation(interaction, order, orderId) {
  const orderChannelId = process.env.ORDER_CHANNEL_ID;
  if (!orderChannelId) return;

  try {
    const orderChannel = interaction.client.channels.cache.get(orderChannelId);
    if (!orderChannel) return;

    const adminEmbed = {
      color: 0xff9900,
      title: "💳 Xác nhận chuyển khoản từ khách hàng",
      description: `Khách hàng đã xác nhận chuyển khoản cho đơn hàng #${orderId}`,
      fields: [
        {
          name: "👤 Khách hàng",
          value: interaction.user.displayName || interaction.user.username,
          inline: true,
        },
        { name: "🆔 User ID", value: interaction.user.id, inline: true },
        {
          name: "💰 Số tiền",
          value: formatPrice(order.total_amount),
          inline: true,
        },
        {
          name: "📅 Thời gian xác nhận",
          value: TimeHelper.formatDateTime(new Date()),
          inline: true,
        },
        {
          name: "🍽️ Chi tiết đơn hàng",
          value: order.items
            .map((item) => `• ${item.name} x${item.quantity}`)
            .join("\n"),
          inline: false,
        },
        {
          name: "💸 Thông tin chuyển khoản",
          value: `**Nội dung cần kiểm tra:** Order #${orderId}\n**Số tiền:** ${formatPrice(
            order.total_amount
          )}`,
          inline: false,
        },
      ],
      timestamp: TimeHelper.embedTimestamp(),
    };

    const adminButtons = {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: "✅ Xác nhận đã nhận tiền",
          custom_id: `admin_payment_${orderId}_paid`,
        },
        {
          type: 2,
          style: 4,
          label: "❌ Chưa nhận được tiền",
          custom_id: `admin_payment_${orderId}_failed`,
        },
      ],
    };

    await orderChannel.send({
      content: process.env.ADMIN_USER_ID
        ? `<@${process.env.ADMIN_USER_ID}> **Cần kiểm tra thanh toán!**`
        : "**Cần kiểm tra thanh toán!**",
      embeds: [adminEmbed],
      components: [adminButtons],
    });
  } catch (error) {
    console.error("Error sending to admin channel:", error);
  }
}

// Helper functions
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
  handleConfirmPaymentButton,
  userCarts,
  handleQuickMenu,
};
