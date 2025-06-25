const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getInitializedDatabase } = require("../utils/databaseHelper");
const { userCarts } = require("./buttonHandlers");
const TimeHelper = require("../utils/timeHelper");
const reliableMessaging = require("../utils/reliableMessaging");

async function handleMenuItemSelection(interaction, params) {
  const selectedItemId = parseInt(interaction.values[0]);
  const userId = interaction.user.id;

  // STEP 1: Check for rapid selection (prevent double-click issues)
  if (reliableMessaging.isOperationInProgress(userId, "menu_selection")) {
    await interaction.reply({
      embeds: [
        {
          color: 0xff9900,
          title: "⏳ Đang xử lý...",
          description:
            "Bạn đang thêm món vào giỏ hàng. Vui lòng đợi trong giây lát.",
          footer: { text: "Không cần click nhiều lần" },
        },
      ],
      ephemeral: true,
    });
    return;
  }

  // STEP 2: Immediate ACK for smooth UX
  const operationId = await reliableMessaging.immediateAck(
    interaction,
    "menu_selection",
    {
      itemName: `Item #${selectedItemId}`,
      quantity: "1",
    }
  );

  if (!operationId) return; // Duplicate operation handled

  // STEP 3: Async processing
  processMenuSelection(interaction, selectedItemId, operationId);
}

async function processMenuSelection(interaction, selectedItemId, operationId) {
  const userId = interaction.user.id;
  const database = await getInitializedDatabase();

  try {
    // Get item using Supabase method
    const allItems = await database.getMenuItems(true); // Only available items
    const item = allItems.find((i) => i.id === selectedItemId);

    if (!item) {
      const errorMessage = {
        embeds: [
          {
            color: 0xff0000,
            title: "❌ Món ăn không khả dụng!",
            description:
              "Món ăn này hiện tại không có sẵn. Vui lòng chọn món khác.",
            footer: { text: "Kiểm tra menu mới nhất với /menu" },
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

    // Directly add 1 quantity to cart (skip quantity selection)
    const quantity = 1;
    let cart = userCarts.get(userId) || [];

    // Check if item already in cart
    const existingItemIndex = cart.findIndex(
      (cartItem) => cartItem.item_id === selectedItemId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push({
        item_id: selectedItemId,
        name: item.name,
        price: item.price,
        quantity: quantity,
        subtotal: item.price * quantity,
      });
    }

    userCarts.set(userId, cart);

    const totalInCart = cart.reduce(
      (sum, cartItem) => sum + cartItem.quantity,
      0
    );

    const totalAmount = cart.reduce(
      (sum, cartItem) => sum + cartItem.subtotal,
      0
    );

    // STEP 4: Send success message with retry
    const successMessage = {
      content: "**Đã thêm 1 phần vào giỏ hàng!**",
      embeds: [
        {
          color: 0x00ff00,
          title: "✅ Đã thêm vào giỏ hàng!",
          description: `**${item.name}** - 1 phần`,
          fields: [
            { name: "💰 Giá", value: formatPrice(item.price), inline: true },
            { name: "📂 Danh mục", value: item.category, inline: true },
            {
              name: "🛒 Tổng trong giỏ",
              value: `${totalInCart} món`,
              inline: true,
            },
          ],
          thumbnail: item.image_url ? { url: item.image_url } : undefined,
          timestamp: TimeHelper.embedTimestamp(),
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 2,
              label: "🛍️ Tiếp tục chọn món",
              custom_id: "continue_shopping",
            },
            {
              type: 2,
              style: 1,
              label: "🛒 Xem giỏ hàng",
              custom_id: "order_cart",
            },
            {
              type: 2,
              style: 3,
              label: "✅ Đặt hàng ngay",
              custom_id: "cart_checkout",
            },
          ],
        },
      ],
    };

    await reliableMessaging.sendReliableMessage(
      interaction,
      successMessage,
      operationId
    );

    // Auto-save user info (non-blocking)
    database
      .upsertUser(
        userId,
        interaction.user.username,
        interaction.user.displayName
      )
      .catch((error) => {
        console.error("Failed to save user info:", error.message);
      });
  } catch (error) {
    console.error("Error handling menu item selection:", error);

    const errorMessage = {
      embeds: [
        {
          color: 0xff0000,
          title: "❌ Lỗi thêm món vào giỏ hàng",
          description: "Có lỗi xảy ra khi xử lý lựa chọn. Vui lòng thử lại!",
          fields: [
            {
              name: "💡 Hướng dẫn",
              value:
                "• Kiểm tra kết nối mạng\n• Thử chọn món khác\n• Liên hệ admin nếu vấn đề tiếp tục",
              inline: false,
            },
          ],
          footer: { text: "Lỗi hệ thống" },
        },
      ],
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

async function handleCartCheckout(interaction) {
  const userId = interaction.user.id;
  const cart = userCarts.get(userId);

  if (!cart || cart.length === 0) {
    await interaction.reply({
      embeds: [
        {
          color: 0xff0000,
          title: "🛒 Giỏ hàng trống",
          description:
            "Bạn chưa có món ăn nào trong giỏ hàng. Sử dụng `/menu` để xem menu và thêm món.",
          timestamp: TimeHelper.embedTimestamp(),
        },
      ],
      ephemeral: true,
    });
    return;
  }

  // STEP 1: IMMEDIATE ACK - User gets instant feedback
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const operationId = await reliableMessaging.immediateAck(
    interaction,
    "order_creation",
    {
      totalAmount: formatPrice(totalAmount),
      itemCount: cart.length.toString(),
    }
  );

  // If duplicate operation, stop here
  if (!operationId) return;

  // STEP 2: ASYNC PROCESSING - Do the actual work
  processOrderCreation(interaction, userId, cart, totalAmount, operationId);
}

async function processOrderCreation(
  interaction,
  userId,
  cart,
  totalAmount,
  operationId
) {
  const database = await getInitializedDatabase();

  try {
    console.log(
      `[ORDER] Processing order creation for user ${userId}, operation: ${operationId}`
    );

    // Validate cart items (could be async)
    const menuItems = await database.getMenuItems(true);
    const orderItems = [];

    for (const cartItem of cart) {
      const menuItem = menuItems.find((item) => item.id === cartItem.item_id);
      if (!menuItem) {
        throw new Error(`Món ăn ${cartItem.name} không còn tồn tại trong menu`);
      }

      if (!menuItem.available) {
        throw new Error(`Món ăn ${cartItem.name} hiện tại không có sẵn`);
      }

      orderItems.push({
        item_id: cartItem.item_id,
        name: cartItem.name,
        price: menuItem.price, // Use current price from DB
        quantity: cartItem.quantity,
        subtotal: menuItem.price * cartItem.quantity,
      });
    }

    // Recalculate total with current prices
    const validatedTotal = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    // Create order in database
    const today = TimeHelper.today();
    const result = await database.createOrder(
      userId,
      interaction.user.username,
      today,
      orderItems,
      validatedTotal
    );

    console.log(`[ORDER] Created order #${result.id} successfully`);

    // Clear cart after successful order creation
    userCarts.delete(userId);

    // STEP 3: SEND SUCCESS MESSAGE with retry
    const successMessage = {
      embeds: [
        {
          color: 0x00ff00,
          title: "🎉 Đặt hàng thành công!",
          description: `Đơn hàng #${result.id} đã được tạo thành công.`,
          fields: [
            {
              name: "👤 Khách hàng",
              value: interaction.user.displayName || interaction.user.username,
              inline: true,
            },
            {
              name: "📅 Ngày giao",
              value: TimeHelper.formatDate(today),
              inline: true,
            },
            {
              name: "💰 Tổng tiền",
              value: formatPrice(validatedTotal),
              inline: true,
            },
            {
              name: "🍽️ Chi tiết đơn hàng",
              value: orderItems
                .map(
                  (item) =>
                    `• ${item.name} x${item.quantity} = ${formatPrice(
                      item.subtotal
                    )}`
                )
                .join("\n"),
              inline: false,
            },
            { name: "🚚 Trạng thái", value: "⏳ Chờ xử lý", inline: true },
            {
              name: "💳 Thanh toán",
              value: "💸 Thanh toán qua MoMo (Click button để xem QR)",
              inline: true,
            },
          ],
          footer: { text: `ID đơn hàng: ${result.id}` },
          timestamp: TimeHelper.embedTimestamp(),
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: "💳 Thanh toán ngay",
              custom_id: `payment_${result.id}`,
            },
            {
              type: 2,
              style: 4,
              label: "❌ Hủy đơn hàng",
              custom_id: `cancel_${result.id}`,
            },
          ],
        },
      ],
    };

    // PRIVACY FIX: Make success message ephemeral
    const privateSuccessMessage = {
      ...successMessage,
      ephemeral: true, // 🔒 PRIVACY PROTECTION
    };

    // Send with retry mechanism
    await reliableMessaging.sendReliableMessage(
      interaction,
      privateSuccessMessage,
      operationId
    );

    // STEP 4: NOTIFY ADMIN (non-blocking)
    notifyAdminNewOrder(interaction, result, orderItems, validatedTotal).catch(
      (error) => {
        console.error("[ORDER] Admin notification failed:", error.message);
        // Don't fail the user operation if admin notification fails
      }
    );
  } catch (error) {
    console.error(`[ORDER] Error processing order creation:`, error);

    // STEP 3b: SEND ERROR MESSAGE with retry
    const errorMessage = {
      embeds: [
        {
          color: 0xff0000,
          title: "❌ Lỗi tạo đơn hàng",
          description:
            error.message ||
            "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!",
          fields: [
            {
              name: "🔍 Chi tiết lỗi",
              value: error.message.includes("không còn tồn tại")
                ? "Một số món ăn trong giỏ hàng đã bị thay đổi. Vui lòng kiểm tra lại menu."
                : "Lỗi hệ thống. Vui lòng thử lại sau ít phút.",
              inline: false,
            },
            {
              name: "💡 Hướng dẫn",
              value:
                "• Kiểm tra lại menu với `/menu`\n• Thử đặt lại đơn hàng\n• Liên hệ admin nếu vấn đề tiếp tục",
              inline: false,
            },
          ],
          footer: { text: "Giỏ hàng của bạn vẫn được giữ nguyên" },
          timestamp: TimeHelper.embedTimestamp(),
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

async function notifyAdminNewOrder(
  interaction,
  order,
  orderItems,
  totalAmount
) {
  const orderChannelId = process.env.ORDER_CHANNEL_ID;
  if (!orderChannelId) return;

  try {
    const orderChannel = interaction.client.channels.cache.get(orderChannelId);
    if (!orderChannel) {
      console.warn(`Order channel ${orderChannelId} not found`);
      return;
    }

    const adminEmbed = {
      color: 0xff9900,
      title: "🔔 Đơn hàng mới",
      fields: [
        {
          name: "👤 Khách hàng",
          value: interaction.user.displayName || interaction.user.username,
          inline: true,
        },
        {
          name: "🆔 ID đơn hàng",
          value: order.id.toString(),
          inline: true,
        },
        {
          name: "💰 Tổng tiền",
          value: formatPrice(totalAmount),
          inline: true,
        },
        {
          name: "🍽️ Món ăn",
          value: orderItems
            .map((item) => `• ${item.name} x${item.quantity}`)
            .join("\n"),
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
          label: "💳 Đã thanh toán",
          custom_id: `admin_payment_${order.id}_paid`,
        },
      ],
    };

    await orderChannel.send({
      content: process.env.ADMIN_USER_ID
        ? `<@${process.env.ADMIN_USER_ID}> **Đơn hàng mới cần thanh toán!**`
        : "**Đơn hàng mới cần thanh toán!**",
      embeds: [adminEmbed],
      components: [adminButtons],
    });

    console.log(`[ORDER] Admin notified for order #${order.id}`);
  } catch (channelError) {
    console.error("Error sending to order channel:", channelError.message);

    // Fallback: Send DM to admin
    const adminUserId = process.env.ADMIN_USER_ID;
    if (adminUserId) {
      try {
        const adminUser = await interaction.client.users.fetch(adminUserId);
        const dmEmbed = {
          color: 0xff9900,
          title: "🔔 Đơn hàng mới (DM)",
          description: "Không thể gửi tới order channel, gửi DM thay thế",
          fields: [
            {
              name: "👤 Khách hàng",
              value: interaction.user.displayName || interaction.user.username,
              inline: true,
            },
            {
              name: "🆔 ID đơn hàng",
              value: order.id.toString(),
              inline: true,
            },
            {
              name: "💰 Tổng tiền",
              value: formatPrice(totalAmount),
              inline: true,
            },
            {
              name: "🍽️ Món ăn",
              value: orderItems
                .map((item) => `• ${item.name} x${item.quantity}`)
                .join("\n"),
              inline: false,
            },
          ],
          timestamp: TimeHelper.embedTimestamp(),
        };

        await adminUser.send({ embeds: [dmEmbed] });
        console.log("Sent order notification via DM to admin");
      } catch (dmError) {
        console.error("Failed to send DM to admin:", dmError.message);
      }
    }
  }
}

async function handleCartClear(interaction) {
  const userId = interaction.user.id;
  userCarts.delete(userId);

  await interaction.reply({
    embeds: [
      {
        color: 0xff0000,
        title: "🗑️ Đã xóa giỏ hàng",
        description: "Tất cả món ăn đã được xóa khỏi giỏ hàng.",
        timestamp: TimeHelper.embedTimestamp(),
      },
    ],
    ephemeral: true,
  });
}

// Helper function
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

module.exports = {
  handleMenuItemSelection,
  handleCartCheckout,
  handleCartClear,
};
