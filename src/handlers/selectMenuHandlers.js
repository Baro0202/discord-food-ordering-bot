const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const SupabaseDatabase = require("../database/supabase");
const { userCarts } = require("./buttonHandlers");
const moment = require("moment");

async function handleMenuItemSelection(interaction, params) {
  const selectedItemId = parseInt(interaction.values[0]);

  const database = new SupabaseDatabase();
  await database.init();

  try {
    // Get item using Supabase method
    const allItems = await database.getMenuItems(true); // Only available items
    const item = allItems.find((i) => i.id === selectedItemId);

    if (!item) {
      await interaction.reply({
        content: "❌ Món ăn không khả dụng!",
        ephemeral: true,
      });
      return;
    }

    // Create quantity selection menu
    const quantityMenu = new StringSelectMenuBuilder()
      .setCustomId(`quantity_${selectedItemId}`)
      .setPlaceholder("Chọn số lượng...")
      .addOptions([
        { label: "1 phần", value: "1" },
        { label: "2 phần", value: "2" },
        { label: "3 phần", value: "3" },
        { label: "4 phần", value: "4" },
        { label: "5 phần", value: "5" },
      ]);

    const row = new ActionRowBuilder().addComponents(quantityMenu);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`🍽️ ${item.name}`)
      .setDescription(item.description || "Không có mô tả")
      .addFields(
        { name: "💰 Giá", value: formatPrice(item.price), inline: true },
        { name: "📂 Danh mục", value: item.category, inline: true }
      )
      .setTimestamp();

    if (item.image_url) {
      embed.setImage(item.image_url);
    }

    await interaction.reply({
      content: "**Chọn số lượng bạn muốn đặt:**",
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error handling menu item selection:", error);
    await interaction.reply({
      content: "❌ Có lỗi xảy ra khi xử lý lựa chọn!",
      ephemeral: true,
    });
  } finally {
    database.close();
  }
}

async function handleQuantitySelection(interaction, params) {
  const itemId = parseInt(params[0]);
  const quantity = parseInt(interaction.values[0]);
  const userId = interaction.user.id;

  const database = new SupabaseDatabase();
  await database.init();

  try {
    // Get item using Supabase method
    const allItems = await database.getMenuItems(true); // Only available items
    const item = allItems.find((i) => i.id === itemId);

    if (!item) {
      await interaction.reply({
        content: "❌ Món ăn không khả dụng!",
        ephemeral: true,
      });
      return;
    }

    // Add to cart
    let cart = userCarts.get(userId) || [];

    // Check if item already in cart
    const existingItemIndex = cart.findIndex(
      (cartItem) => cartItem.itemId === itemId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push({
        itemId: itemId,
        quantity: quantity,
      });
    }

    userCarts.set(userId, cart);

    const totalInCart = cart.reduce(
      (sum, cartItem) => sum + cartItem.quantity,
      0
    );
    const subtotal = item.price * quantity;

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Đã thêm vào giỏ hàng!")
      .addFields(
        { name: "🍽️ Món ăn", value: item.name, inline: true },
        { name: "🔢 Số lượng", value: quantity.toString(), inline: true },
        { name: "💰 Thành tiền", value: formatPrice(subtotal), inline: true },
        { name: "🛒 Tổng trong giỏ", value: `${totalInCart} món`, inline: true }
      )
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("order_cart")
        .setLabel("🛒 Xem giỏ hàng")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("continue_shopping")
        .setLabel("🛍️ Tiếp tục mua")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("cart_checkout")
        .setLabel("✅ Đặt hàng ngay")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [embed],
      components: [buttons],
      ephemeral: true,
    });

    // Auto-save user info
    await database.upsertUser(
      userId,
      interaction.user.username,
      interaction.user.displayName
    );
  } catch (error) {
    console.error("Error handling quantity selection:", error);
    await interaction.reply({
      content: "❌ Có lỗi xảy ra khi thêm vào giỏ hàng!",
      ephemeral: true,
    });
  } finally {
    database.close();
  }
}

async function handleCartCheckout(interaction) {
  const userId = interaction.user.id;
  const cart = userCarts.get(userId) || [];

  if (cart.length === 0) {
    await interaction.reply({
      content: "❌ Giỏ hàng trống! Vui lòng chọn món trước khi đặt hàng.",
      ephemeral: true,
    });
    return;
  }

  // Check if still within order deadline
  const currentTime = moment().format("HH:mm");
  const orderDeadline = process.env.ORDER_DEADLINE || "23:59";

  if (orderDeadline !== "23:59" && currentTime > orderDeadline) {
    await interaction.reply({
      embeds: [
        {
          color: 0xff0000,
          title: "⏰ Đã hết hạn đặt món",
          description: `Hạn đặt món hôm nay là **${orderDeadline}**.\nVui lòng đặt sớm hơn vào ngày mai!`,
          timestamp: new Date(),
        },
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ flags: 64 }); // 64 = ephemeral flag

  const database = new SupabaseDatabase();
  await database.init();

  try {
    // Get item details and calculate total
    const allItems = await database.getMenuItems(false); // Get all items
    const items = allItems.filter((item) =>
      cart.some((cartItem) => cartItem.itemId === item.id)
    );

    let totalAmount = 0;
    const orderItems = items
      .map((item) => {
        const cartItem = cart.find((i) => i.itemId === item.id);
        if (!cartItem) return null;

        const subtotal = item.price * cartItem.quantity;
        totalAmount += subtotal;

        return {
          item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: cartItem.quantity,
          subtotal: subtotal,
        };
      })
      .filter(Boolean);

    if (orderItems.length === 0) {
      await interaction.editReply({
        content: "❌ Không có món nào hợp lệ trong giỏ hàng!",
      });
      return;
    }

    // Create order
    const today = moment().format("YYYY-MM-DD");
    const result = await database.createOrder(
      userId,
      interaction.user.username,
      today,
      orderItems,
      totalAmount
    );

    // Clear cart
    userCarts.delete(userId);

    // Create order confirmation embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("🎉 Đặt hàng thành công!")
      .setDescription(`Đơn hàng #${result.id} đã được tạo thành công.`)
      .addFields(
        {
          name: "👤 Khách hàng",
          value: interaction.user.displayName || interaction.user.username,
          inline: true,
        },
        {
          name: "📅 Ngày giao",
          value: moment(today).format("DD/MM/YYYY"),
          inline: true,
        },
        { name: "💰 Tổng tiền", value: formatPrice(totalAmount), inline: true },
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
        }
      )
      .setFooter({ text: `ID đơn hàng: ${result.id}` })
      .setTimestamp();

    // Chỉ 2 buttons: Thanh toán và Hủy đơn hàng
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`payment_${result.id}`)
        .setLabel("💳 Thanh toán ngay")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`cancel_${result.id}`)
        .setLabel("❌ Hủy đơn hàng")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({
      embeds: [embed],
      components: [buttons],
    });

    // Send notification to order channel if configured
    const orderChannelId = process.env.ORDER_CHANNEL_ID;
    if (orderChannelId) {
      try {
        const orderChannel =
          interaction.client.channels.cache.get(orderChannelId);
        if (orderChannel) {
          const adminEmbed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle("🔔 Đơn hàng mới")
            .addFields(
              {
                name: "👤 Khách hàng",
                value:
                  interaction.user.displayName || interaction.user.username,
                inline: true,
              },
              {
                name: "🆔 ID đơn hàng",
                value: result.id.toString(),
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
              }
            )
            .setTimestamp();

          // Admin action buttons - chỉ button thanh toán
          const adminButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`admin_payment_${result.id}_paid`)
              .setLabel("💳 Đã thanh toán")
              .setStyle(ButtonStyle.Success)
          );

          await orderChannel.send({
            content: process.env.ADMIN_USER_ID
              ? `<@${process.env.ADMIN_USER_ID}> **Đơn hàng mới cần thanh toán!**`
              : "**Đơn hàng mới cần thanh toán!**",
            embeds: [adminEmbed],
            components: [adminButtons],
          });
        } else {
          console.warn(`Order channel ${orderChannelId} not found`);
        }
      } catch (channelError) {
        console.error("Error sending to order channel:", channelError);
        console.warn(
          "Bot may not have permission to send messages to the order channel"
        );

        // Alternative: Send DM to admin if channel fails
        const adminUserId = process.env.ADMIN_USER_ID;
        if (adminUserId) {
          try {
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const dmEmbed = new EmbedBuilder()
              .setColor(0xff9900)
              .setTitle("🔔 Đơn hàng mới (DM)")
              .setDescription(
                "Không thể gửi tới order channel, gửi DM thay thế"
              )
              .addFields(
                {
                  name: "👤 Khách hàng",
                  value:
                    interaction.user.displayName || interaction.user.username,
                  inline: true,
                },
                {
                  name: "🆔 ID đơn hàng",
                  value: result.id.toString(),
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
                }
              )
              .setTimestamp();

            await adminUser.send({ embeds: [dmEmbed] });
            console.log("Sent order notification via DM to admin");
          } catch (dmError) {
            console.error("Failed to send DM to admin:", dmError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing checkout:", error);
    await interaction.editReply({
      content: "❌ Có lỗi xảy ra khi xử lý đơn hàng. Vui lòng thử lại!",
    });
  } finally {
    database.close();
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
        timestamp: new Date(),
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
  handleQuantitySelection,
  handleCartCheckout,
  handleCartClear,
};
