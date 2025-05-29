const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const SupabaseDatabase = require("../database/supabase");
const moment = require("moment");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Các lệnh quản trị cho bot đặt cơm")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("additem")
        .setDescription("Thêm món ăn mới vào database")
        .addStringOption((option) =>
          option.setName("name").setDescription("Tên món ăn").setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("price")
            .setDescription("Giá món ăn (VND)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("Mô tả món ăn")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Danh mục món ăn")
            .setRequired(false)
            .addChoices(
              { name: "Món chính", value: "main" },
              { name: "Canh/Súp", value: "soup" },
              { name: "Cơm", value: "rice" },
              { name: "Rau củ", value: "vegetable" },
              { name: "Đồ uống", value: "drink" },
              { name: "Tráng miệng", value: "dessert" },
              { name: "Khác", value: "other" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("image")
            .setDescription("Link hình ảnh món ăn")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setmenu")
        .setDescription("Thiết lập menu cho một ngày")
        .addStringOption((option) =>
          option
            .setName("items")
            .setDescription(
              "ID các món ăn, cách nhau bằng dấu phẩy (VD: 1,2,3)"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription("Ngày (YYYY-MM-DD hoặc để trống cho hôm nay)")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("note")
            .setDescription("Ghi chú đặc biệt cho menu hôm nay")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("orders")
        .setDescription("Xem danh sách đơn hàng")
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription("Ngày (YYYY-MM-DD hoặc để trống cho hôm nay)")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Lọc theo trạng thái")
            .setRequired(false)
            .addChoices(
              { name: "Tất cả", value: "all" },
              { name: "Chờ xử lý", value: "pending" },
              { name: "Đã xác nhận", value: "confirmed" },
              { name: "Đang chuẩn bị", value: "preparing" },
              { name: "Đã giao", value: "delivered" },
              { name: "Đã hủy", value: "cancelled" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("updateorder")
        .setDescription("Cập nhật trạng thái đơn hàng")
        .addIntegerOption((option) =>
          option
            .setName("orderid")
            .setDescription("ID đơn hàng")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Trạng thái mới")
            .setRequired(true)
            .addChoices(
              { name: "Chờ xử lý", value: "pending" },
              { name: "Đã xác nhận", value: "confirmed" },
              { name: "Đang chuẩn bị", value: "preparing" },
              { name: "Đã giao", value: "delivered" },
              { name: "Đã hủy", value: "cancelled" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("listitems")
        .setDescription("Xem danh sách tất cả món ăn")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stats")
        .setDescription("Thống kê đơn hàng")
        .addStringOption((option) =>
          option
            .setName("period")
            .setDescription("Khoảng thời gian")
            .setRequired(false)
            .addChoices(
              { name: "Hôm nay", value: "today" },
              { name: "7 ngày", value: "week" },
              { name: "30 ngày", value: "month" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("sendmenu")
        .setDescription("Gửi message menu cố định với button đặt cơm")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("myid").setDescription("Hiển thị user ID của bạn")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("summary")
        .setDescription("Tổng hợp món ăn được đặt theo ngày")
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription("Ngày (YYYY-MM-DD hoặc để trống cho hôm nay)")
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    // Only allow admin user to use admin commands
    const adminUserId = process.env.ADMIN_USER_ID;

    if (!adminUserId || interaction.user.id !== adminUserId) {
      await interaction.reply({
        content:
          "❌ Bạn không có quyền sử dụng lệnh này! Chỉ có thể sử dụng `/menu` để đặt cơm.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const database = new SupabaseDatabase();
    await database.init();

    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "additem":
          await handleAddItem(interaction, database);
          break;
        case "setmenu":
          await handleSetMenu(interaction, database);
          break;
        case "orders":
          await handleOrders(interaction, database);
          break;
        case "updateorder":
          await handleUpdateOrder(interaction, database);
          break;
        case "listitems":
          await handleListItems(interaction, database);
          break;
        case "stats":
          await handleStats(interaction, database);
          break;
        case "sendmenu":
          await handleSendMenu(interaction, database);
          break;
        case "myid":
          await handleMyID(interaction);
          break;
        case "summary":
          await handleSummary(interaction, database);
          break;
      }
    } catch (error) {
      console.error("Error in admin command:", error);
      await interaction.editReply({
        embeds: [
          {
            color: 0xff0000,
            title: "❌ Lỗi",
            description: "Có lỗi xảy ra khi thực hiện lệnh. Vui lòng thử lại!",
            timestamp: new Date(),
          },
        ],
      });
    } finally {
      database.close();
    }
  },
};

async function handleAddItem(interaction, database) {
  const name = interaction.options.getString("name");
  const price = interaction.options.getNumber("price");
  const description = interaction.options.getString("description") || "";
  const category = interaction.options.getString("category") || "main";
  const imageUrl = interaction.options.getString("image");

  const result = await database.addMenuItem(
    name,
    description,
    price,
    imageUrl,
    category
  );

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("✅ Đã thêm món ăn mới")
    .addFields(
      { name: "🏷️ Tên", value: name, inline: true },
      { name: "💰 Giá", value: formatPrice(price), inline: true },
      { name: "📂 Danh mục", value: category, inline: true },
      { name: "📝 Mô tả", value: description || "Không có", inline: false },
      { name: "🆔 ID", value: result.id.toString(), inline: true }
    )
    .setTimestamp();

  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleSetMenu(interaction, database) {
  const itemsInput = interaction.options.getString("items");
  const dateInput = interaction.options.getString("date");
  const note = interaction.options.getString("note");

  const date = dateInput || moment().format("YYYY-MM-DD");
  const itemIds = itemsInput
    .split(",")
    .map((id) => parseInt(id.trim()))
    .filter((id) => !isNaN(id));

  if (itemIds.length === 0) {
    await interaction.editReply({
      content: "❌ Không có ID món ăn hợp lệ nào!",
    });
    return;
  }

  // Verify items exist
  const allItems = await database.getMenuItems(false); // Get all items, including disabled
  const items = allItems.filter((item) => itemIds.includes(item.id));

  if (items.length !== itemIds.length) {
    await interaction.editReply({
      content: "❌ Một số ID món ăn không tồn tại!",
    });
    return;
  }

  await database.createDailyMenu(date, itemIds, note);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("✅ Đã thiết lập menu")
    .addFields(
      {
        name: "📅 Ngày",
        value: moment(date).format("DD/MM/YYYY"),
        inline: true,
      },
      { name: "🍽️ Số món", value: items.length.toString(), inline: true },
      { name: "📝 Ghi chú", value: note || "Không có", inline: false }
    )
    .setDescription(
      `**Các món ăn:**\n${items
        .map((item) => `• ${item.name} - ${formatPrice(item.price)}`)
        .join("\n")}`
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleOrders(interaction, database) {
  const dateInput = interaction.options.getString("date");
  const statusFilter = interaction.options.getString("status") || "all";

  const date = dateInput || moment().format("YYYY-MM-DD");

  let orders = await database.getOrdersByDate(date);

  if (statusFilter !== "all") {
    orders = orders.filter((order) => order.status === statusFilter);
  }

  if (orders.length === 0) {
    await interaction.editReply({
      embeds: [
        {
          color: 0xff9900,
          title: "📋 Không có đơn hàng",
          description: `Không có đơn hàng nào cho ngày ${moment(date).format(
            "DD/MM/YYYY"
          )}`,
          timestamp: new Date(),
        },
      ],
    });
    return;
  }

  const totalAmount = orders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );
  const statusCounts = {};
  orders.forEach((order) => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });

  // Create summary embed
  const summaryEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`📋 Tổng quan đơn hàng ngày ${moment(date).format("DD/MM/YYYY")}`)
    .addFields(
      { name: "📊 Tổng số đơn", value: orders.length.toString(), inline: true },
      { name: "💰 Tổng tiền", value: formatPrice(totalAmount), inline: true },
      {
        name: "📈 Trạng thái",
        value: Object.entries(statusCounts)
          .map(
            ([status, count]) => `${getStatusEmoji(status)} ${status}: ${count}`
          )
          .join("\n"),
        inline: false,
      }
    )
    .setTimestamp();

  const embeds = [summaryEmbed];
  const components = [];

  // Show detailed orders with action buttons (first 3 orders)
  const ordersToShow = orders.slice(0, 3);
  ordersToShow.forEach((order, index) => {
    const isPaid = order.payment_status === "paid";

    const orderEmbed = new EmbedBuilder()
      .setColor(
        isPaid
          ? 0x32cd32 // Green for paid
          : order.status === "pending"
          ? 0xff9900
          : order.status === "confirmed"
          ? 0x00ff00
          : 0x0099ff
      )
      .setTitle(`📋 Đơn hàng #${order.id}`)
      .addFields(
        { name: "👤 Khách hàng", value: order.username, inline: true },
        {
          name: "💰 Tổng tiền",
          value: formatPrice(order.total_amount),
          inline: true,
        },
        {
          name: "🚚 Trạng thái",
          value: `${getStatusEmoji(order.status)} ${order.status}`,
          inline: true,
        },
        {
          name: "💳 Thanh toán",
          value: isPaid ? "✅ Đã thanh toán" : "⏳ Chờ thanh toán",
          inline: true,
        },
        {
          name: "📅 Thời gian đặt",
          value: moment(order.created_at).format("HH:mm DD/MM/YYYY"),
          inline: true,
        }
      )
      .setTimestamp();

    if (isPaid) {
      orderEmbed.setFooter({
        text: "✅ Đã thanh toán - Không cần thao tác thêm",
      });
    }

    embeds.push(orderEmbed);

    // Chỉ hiển thị button thanh toán nếu chưa thanh toán
    if (!isPaid) {
      const orderButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`admin_payment_${order.id}_paid`)
          .setLabel("💳 Đã thanh toán")
          .setStyle(ButtonStyle.Success)
      );

      components.push(orderButtons);
    }
  });

  if (orders.length > 3) {
    summaryEmbed.addFields({
      name: "ℹ️ Ghi chú",
      value: `Hiển thị 3/${orders.length} đơn hàng. Sử dụng filter để xem cụ thể hơn.`,
      inline: false,
    });
  }

  // Send detailed view to admin channel
  const orderChannelId = process.env.ORDER_CHANNEL_ID;
  if (orderChannelId && orderChannelId !== interaction.channel.id) {
    try {
      const orderChannel =
        interaction.client.channels.cache.get(orderChannelId);
      if (orderChannel) {
        await orderChannel.send({
          content: `📊 **Chi tiết đơn hàng ${moment(date).format(
            "DD/MM/YYYY"
          )}** (Yêu cầu bởi ${interaction.user.displayName})`,
          embeds,
          components,
        });

        // Send simple summary to current channel
        await interaction.editReply({
          content: `✅ Đã gửi chi tiết ${orders.length} đơn hàng đến <#${orderChannelId}>`,
          embeds: [summaryEmbed],
        });
        return;
      }
    } catch (error) {
      console.error("Could not send to admin channel:", error);
    }
  }

  await interaction.editReply({ embeds, components });
}

async function handleUpdateOrder(interaction, database) {
  const orderId = interaction.options.getInteger("orderid");
  const newStatus = interaction.options.getString("status");

  const order = await database.getOrder(orderId);
  if (!order) {
    await interaction.editReply({
      content: "❌ Không tìm thấy đơn hàng với ID này!",
    });
    return;
  }

  await database.updateOrderStatus(orderId, newStatus);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("✅ Đã cập nhật đơn hàng")
    .addFields(
      { name: "🆔 ID đơn hàng", value: orderId.toString(), inline: true },
      { name: "👤 Khách hàng", value: order.username, inline: true },
      {
        name: "📅 Ngày",
        value: moment(order.menu_date).format("DD/MM/YYYY"),
        inline: true,
      },
      {
        name: "💰 Tổng tiền",
        value: formatPrice(order.total_amount),
        inline: true,
      },
      {
        name: "🔄 Trạng thái mới",
        value: `${getStatusEmoji(newStatus)} ${newStatus}`,
        inline: true,
      }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleListItems(interaction, database) {
  const items = await database.getMenuItems(false);

  if (items.length === 0) {
    await interaction.editReply({
      content: "📋 Chưa có món ăn nào trong database!",
    });
    return;
  }

  const categories = {};
  items.forEach((item) => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("📋 Danh sách tất cả món ăn")
    .setDescription(`Tổng số: **${items.length}** món`)
    .setTimestamp();

  for (const [categoryName, categoryItems] of Object.entries(categories)) {
    const itemsList = categoryItems
      .map(
        (item) =>
          `**ID ${item.id}:** ${item.name} - ${formatPrice(item.price)} ${
            item.available ? "✅" : "❌"
          }`
      )
      .join("\n");

    embed.addFields({
      name: `${getCategoryEmoji(categoryName)} ${capitalizeFirst(
        categoryName
      )} (${categoryItems.length})`,
      value: itemsList,
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleStats(interaction, database) {
  const period = interaction.options.getString("period") || "today";

  let startDate, endDate;
  const today = moment().format("YYYY-MM-DD");

  switch (period) {
    case "today":
      startDate = endDate = today;
      break;
    case "week":
      startDate = moment().subtract(6, "days").format("YYYY-MM-DD");
      endDate = today;
      break;
    case "month":
      startDate = moment().subtract(29, "days").format("YYYY-MM-DD");
      endDate = today;
      break;
  }

  // Get orders for the date range using Supabase method
  let orders = [];

  if (period === "today") {
    orders = await database.getOrdersByDate(startDate);
  } else {
    // For week/month periods, we need to get orders for multiple dates
    // Since we don't have a direct range method, we'll get orders day by day
    const allOrders = [];
    let currentDate = moment(startDate);
    const endMoment = moment(endDate);

    while (currentDate.isSameOrBefore(endMoment)) {
      const dayOrders = await database.getOrdersByDate(
        currentDate.format("YYYY-MM-DD")
      );
      allOrders.push(...dayOrders);
      currentDate.add(1, "day");
    }

    orders = allOrders;
  }

  if (orders.length === 0) {
    await interaction.editReply({
      embeds: [
        {
          color: 0xff9900,
          title: "📊 Không có dữ liệu",
          description: "Không có đơn hàng nào trong khoảng thời gian này.",
          timestamp: new Date(),
        },
      ],
    });
    return;
  }

  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );
  const avgOrderValue = totalRevenue / orders.length;

  const statusCounts = {};
  const paymentCounts = {};
  orders.forEach((order) => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    paymentCounts[order.payment_status] =
      (paymentCounts[order.payment_status] || 0) + 1;
  });

  const embed = new EmbedBuilder()
    .setColor(0x9932cc)
    .setTitle(
      `📊 Thống kê ${
        period === "today"
          ? "hôm nay"
          : period === "week"
          ? "7 ngày"
          : "30 ngày"
      }`
    )
    .addFields(
      {
        name: "📈 Tổng đơn hàng",
        value: orders.length.toString(),
        inline: true,
      },
      { name: "💰 Doanh thu", value: formatPrice(totalRevenue), inline: true },
      {
        name: "💳 Giá trị TB/đơn",
        value: formatPrice(avgOrderValue),
        inline: true,
      },
      {
        name: "📋 Trạng thái đơn hàng",
        value: Object.entries(statusCounts)
          .map(
            ([status, count]) => `${getStatusEmoji(status)} ${status}: ${count}`
          )
          .join("\n"),
        inline: true,
      },
      {
        name: "💳 Trạng thái thanh toán",
        value: Object.entries(paymentCounts)
          .map(
            ([status, count]) =>
              `${getPaymentEmoji(status)} ${status}: ${count}`
          )
          .join("\n"),
        inline: true,
      }
    )
    .setFooter({
      text: `Từ ${moment(startDate).format("DD/MM/YYYY")} đến ${moment(
        endDate
      ).format("DD/MM/YYYY")}`,
    })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleSendMenu(interaction, database) {
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("🍽️ Đặt Cơm Hàng Ngày")
    .setDescription(
      "**Chào mừng đến với hệ thống đặt cơm!**\n\n" +
        "🕘 **Thời gian:** Đặt cơm bất cứ lúc nào trong ngày\n" +
        "🚚 **Giao hàng:** 12:00 PM hàng ngày\n" +
        "💳 **Thanh toán:** COD (Thanh toán khi nhận hàng)\n\n" +
        "👇 **Nhấn button bên dưới để đặt cơm ngay!**"
    )
    .setImage("https://i.imgur.com/food-banner.jpg") // Có thể thay bằng link ảnh đẹp
    .setFooter({ text: "Bot Đặt Cơm - Tiện lợi mỗi ngày!" })
    .setTimestamp();

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("quick_menu")
      .setLabel("🍽️ Đặt Cơm Hôm Nay")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🍽️")
  );

  // Send to current channel
  const menuMessage = await interaction.channel.send({
    embeds: [embed],
    components: [button],
  });

  await interaction.editReply({
    content: `✅ Đã gửi message menu cố định! [Xem tại đây](${menuMessage.url})`,
    ephemeral: true,
  });
}

async function handleMyID(interaction) {
  await interaction.reply({
    content: `🆔 User ID của bạn là: ${interaction.user.id}`,
    ephemeral: true,
  });
}

async function handleSummary(interaction, database) {
  const dateInput =
    interaction.options.getString("date") || moment().format("YYYY-MM-DD");

  const allOrders = await database.getOrdersByDate(dateInput);

  // Filter out cancelled orders
  const orders = allOrders.filter((order) => order.status !== "cancelled");

  if (orders.length === 0) {
    await interaction.editReply({
      embeds: [
        {
          color: 0xff9900,
          title: "📋 Không có đơn hàng",
          description: `Không có đơn hàng hợp lệ nào cho ngày ${moment(
            dateInput
          ).format("DD/MM/YYYY")}${
            allOrders.length > 0
              ? ` (${allOrders.length - orders.length} đơn đã hủy)`
              : ""
          }`,
          timestamp: new Date(),
        },
      ],
    });
    return;
  }

  // Calculate totals (excluding cancelled orders)
  const totalAmount = orders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );
  const totalOrders = orders.length;
  const paidOrders = orders.filter(
    (order) => order.payment_status === "paid"
  ).length;
  const cancelledCount = allOrders.length - orders.length;

  // Get all menu items for reference
  const allMenuItems = await database.getMenuItems(false);

  // Aggregate food items from all orders
  const foodSummary = {};

  for (const order of orders) {
    // Parse order_items (should be JSON)
    let orderItems = [];
    try {
      orderItems =
        typeof order.items === "string"
          ? JSON.parse(order.items)
          : order.items || [];
    } catch (e) {
      console.error("Error parsing order items:", e);
      continue;
    }

    // Add each item to summary
    for (const item of orderItems) {
      const itemId = item.item_id || item.id;
      const itemName = item.name;
      const quantity = item.quantity || 1;
      const price = item.price || 0;

      if (!foodSummary[itemName]) {
        foodSummary[itemName] = {
          totalQuantity: 0,
          totalRevenue: 0,
          unitPrice: price,
          orders: [],
        };
      }

      foodSummary[itemName].totalQuantity += quantity;
      foodSummary[itemName].totalRevenue += price * quantity;
      foodSummary[itemName].orders.push({
        orderId: order.id,
        customer: order.username,
        quantity: quantity,
      });
    }
  }

  // Create summary embed
  const summaryEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`📊 Tổng hợp món ăn - ${moment(dateInput).format("DD/MM/YYYY")}`)
    .addFields(
      {
        name: "📋 Tổng đơn hợp lệ",
        value: totalOrders.toString(),
        inline: true,
      },
      {
        name: "💰 Tổng doanh thu",
        value: formatPrice(totalAmount),
        inline: true,
      },
      {
        name: "✅ Đã thanh toán",
        value: `${paidOrders}/${totalOrders}`,
        inline: true,
      }
    )
    .setTimestamp();

  // Add cancelled orders info if any
  if (cancelledCount > 0) {
    summaryEmbed.addFields({
      name: "❌ Đơn đã hủy",
      value: `${cancelledCount} đơn (không tính trong tổng hợp)`,
      inline: true,
    });
  }

  // Create food breakdown
  const foodItems = Object.entries(foodSummary)
    .sort((a, b) => b[1].totalQuantity - a[1].totalQuantity) // Sort by quantity DESC
    .map(([itemName, data]) => ({
      name: itemName,
      quantity: data.totalQuantity,
      revenue: data.totalRevenue,
      unitPrice: data.unitPrice,
      orderCount: data.orders.length,
    }));

  if (foodItems.length > 0) {
    const foodBreakdown = foodItems
      .slice(0, 10) // Top 10 items
      .map(
        (item, index) =>
          `**${index + 1}. ${item.name}**\n` +
          `🔢 Số lượng: **${item.quantity}** phần\n` +
          `💰 Doanh thu: **${formatPrice(item.revenue)}**\n` +
          `👥 Số đơn: **${item.orderCount}** đơn`
      )
      .join("\n\n");

    summaryEmbed.addFields({
      name: "🍽️ Top món ăn được đặt nhiều nhất",
      value: foodBreakdown,
      inline: false,
    });

    // Add preparation summary
    const totalDishes = foodItems.reduce((sum, item) => sum + item.quantity, 0);
    summaryEmbed.addFields({
      name: "👨‍🍳 Cần chuẩn bị",
      value: `**${totalDishes}** phần tổng cộng từ **${foodItems.length}** món khác nhau`,
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [summaryEmbed] });

  // Send detailed breakdown to admin channel if configured
  const orderChannelId = process.env.ORDER_CHANNEL_ID;
  if (orderChannelId && orderChannelId !== interaction.channel.id) {
    try {
      const orderChannel =
        interaction.client.channels.cache.get(orderChannelId);
      if (orderChannel) {
        // Create detailed food list for kitchen
        const detailedFoodList = foodItems
          .map(
            (item) =>
              `**${item.name}**: ${item.quantity} phần (${formatPrice(
                item.revenue
              )})`
          )
          .join("\n");

        const kitchenEmbed = new EmbedBuilder()
          .setColor(0x32cd32)
          .setTitle(
            `🍳 Danh sách chuẩn bị - ${moment(dateInput).format("DD/MM/YYYY")}`
          )
          .setDescription(detailedFoodList)
          .addFields({
            name: "📊 Tóm tắt",
            value: `${totalOrders} đơn hợp lệ${
              cancelledCount > 0 ? ` (${cancelledCount} đơn đã hủy)` : ""
            } | ${totalDishes} phần | ${formatPrice(totalAmount)}`,
            inline: false,
          })
          .setFooter({ text: `Yêu cầu bởi ${interaction.user.displayName}` })
          .setTimestamp();

        await orderChannel.send({
          content: "👨‍🍳 **DANH SÁCH CHUẨN BỊ CHO BẾP**",
          embeds: [kitchenEmbed],
        });

        await interaction.followUp({
          content: `✅ Đã gửi danh sách chuẩn bị đến <#${orderChannelId}>`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Could not send to admin channel:", error);
    }
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

function getPaymentEmoji(status) {
  const emojis = {
    pending: "⏳",
    paid: "✅",
    failed: "❌",
  };
  return emojis[status] || "❓";
}

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

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
