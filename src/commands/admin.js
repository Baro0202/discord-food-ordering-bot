const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getInitializedDatabase } = require("../utils/databaseHelper");
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
        .setDescription("Cập nhật trạng thái thanh toán đơn hàng")
        .addIntegerOption((option) =>
          option
            .setName("orderid")
            .setDescription("ID đơn hàng")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("paymentstatus")
            .setDescription("Trạng thái thanh toán")
            .setRequired(true)
            .addChoices(
              { name: "Chờ thanh toán", value: "pending" },
              { name: "Đã thanh toán", value: "paid" },
              { name: "Thanh toán thất bại", value: "failed" },
              { name: "Đã hoàn tiền", value: "refunded" }
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("sendpaymentnotify")
        .setDescription(
          "Gửi thông báo thanh toán đến tất cả người có đơn hàng chưa thanh toán"
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Tin nhắn tùy chỉnh (tùy chọn)")
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const adminUserId = process.env.ADMIN_USER_ID;
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const subcommand = interaction.options.getSubcommand();

    console.log(
      `[ADMIN CHECK] User: ${username} (${userId}) | Command: ${subcommand} | Admin ID: ${adminUserId}`
    );

    // Allow myid for anyone (debugging purposes)
    if (subcommand === "myid") {
      await handleMyID(interaction);
      return;
    }

    // Double check - both environment variable and hardcoded admin ID must match
    const HARDCODED_ADMIN = "1329624897588170856";

    if (!adminUserId || userId !== adminUserId || userId !== HARDCODED_ADMIN) {
      console.log(
        `[ADMIN DENIED] User ${username} (${userId}) attempted to use admin command: ${subcommand}`
      );
      await interaction.reply({
        content:
          "❌ Bạn không có quyền sử dụng lệnh này! Chỉ có thể sử dụng `/menu` để đặt cơm.",
        ephemeral: true,
      });
      return;
    }

    console.log(
      `[ADMIN ALLOWED] User ${username} (${userId}) authorized for admin command: ${subcommand}`
    );
    await interaction.deferReply();

    const database = await getInitializedDatabase();

    try {
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
        case "summary":
          await handleSummary(interaction, database);
          break;
        case "sendpaymentnotify":
          await handleSendPaymentNotify(interaction, database);
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

  // Create simple list of all orders as requested
  const orderListChunks = [];
  let currentChunk = [];

  orders.forEach((order) => {
    const orderItems = order.items
      .map((item) => `${item.name} x${item.quantity}`)
      .join(", ");

    const statusEmoji = getStatusEmoji(order.status);
    const paymentEmoji = order.payment_status === "paid" ? "✅" : "⏳";

    const orderLine = `**#${order.id}** | ${
      order.username
    } | ${orderItems} | ${formatPrice(
      order.total_amount
    )} ${statusEmoji}${paymentEmoji}`;

    // Check if adding this order would exceed Discord's field value limit (1024 chars)
    const testChunk = [...currentChunk, orderLine].join("\n");
    if (testChunk.length > 1000) {
      orderListChunks.push(currentChunk.join("\n"));
      currentChunk = [orderLine];
    } else {
      currentChunk.push(orderLine);
    }
  });

  // Add the last chunk
  if (currentChunk.length > 0) {
    orderListChunks.push(currentChunk.join("\n"));
  }

  // Add order list chunks to the summary embed
  orderListChunks.forEach((chunk, index) => {
    summaryEmbed.addFields({
      name:
        index === 0 ? "📋 Danh sách đơn hàng" : `📋 Danh sách đơn hàng (tiếp)`,
      value: chunk,
      inline: false,
    });
  });

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

  await interaction.editReply({ embeds });
}

async function handleUpdateOrder(interaction, database) {
  const orderId = interaction.options.getInteger("orderid");
  const paymentStatus = interaction.options.getString("paymentstatus");

  console.log(
    `[DEBUG] UpdateOrder - ID: ${orderId}, PaymentStatus: ${paymentStatus}`
  );

  const order = await database.getOrder(orderId);
  if (!order) {
    await interaction.editReply({
      content: "❌ Không tìm thấy đơn hàng với ID này!",
    });
    return;
  }

  // Update payment status in database
  try {
    await database.updatePaymentStatus(orderId, paymentStatus);
  } catch (error) {
    console.error("Error updating order:", error);
    await interaction.editReply({
      content: "❌ Có lỗi xảy ra khi cập nhật đơn hàng!",
    });
    return;
  }

  // Create admin confirmation embed
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("✅ Đã cập nhật trạng thái thanh toán")
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
        name: "💳 Trạng thái thanh toán",
        value: `${getPaymentEmoji(paymentStatus)} ${paymentStatus}`,
        inline: true,
      }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });

  // Send notification to user if payment confirmed
  if (paymentStatus === "paid") {
    try {
      console.log(
        `[INFO] Sending payment confirmation to user ${order.user_id}`
      );

      const user = await interaction.client.users.fetch(order.user_id);

      const userEmbed = new EmbedBuilder()
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
            value: moment(order.menu_date).format("DD/MM/YYYY"),
            inline: true,
          },
          {
            name: "🔄 Trạng thái hiện tại",
            value: "✅ Đã thanh toán - Chuẩn bị giao hàng",
            inline: true,
          }
        )
        .setFooter({ text: "Cảm ơn bạn đã sử dụng dịch vụ đặt cơm!" })
        .setTimestamp();

      await user.send({ embeds: [userEmbed] });

      console.log(
        `[INFO] Payment confirmation sent to user ${order.user_id} for order #${orderId}`
      );

      // Send notification to order channel if configured
      const orderChannelId = process.env.ORDER_CHANNEL_ID;
      if (orderChannelId && orderChannelId !== interaction.channel.id) {
        try {
          const orderChannel =
            interaction.client.channels.cache.get(orderChannelId);
          if (orderChannel) {
            const channelEmbed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle("💳 Xác nhận thanh toán")
              .addFields(
                { name: "🆔 Đơn hàng", value: `#${orderId}`, inline: true },
                { name: "👤 Khách hàng", value: order.username, inline: true },
                {
                  name: "💰 Số tiền",
                  value: formatPrice(order.total_amount),
                  inline: true,
                },
                {
                  name: "👨‍💼 Admin",
                  value: interaction.user.displayName,
                  inline: true,
                }
              )
              .setTimestamp();

            await orderChannel.send({
              content: `✅ **Đã xác nhận thanh toán**`,
              embeds: [channelEmbed],
            });
          }
        } catch (channelError) {
          console.error("Could not send to order channel:", channelError);
        }
      }
    } catch (userError) {
      console.log(
        `Could not send payment confirmation to user ${order.user_id}:`,
        userError.message
      );

      // Update admin that DM failed
      await interaction.followUp({
        content: `⚠️ Đã cập nhật đơn hàng nhưng không thể gửi thông báo đến user (${userError.message})`,
        ephemeral: true,
      });
    }
  }
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
        "💳 **Thanh toán:** Momo (Thanh toán khi nhận hàng)\n\n" +
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

  // Aggregate data by customer and dish
  const customerSummary = {};
  const dishSummary = {};

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

    // Initialize customer if not exists
    if (!customerSummary[order.username]) {
      customerSummary[order.username] = {
        totalAmount: 0,
        orders: [],
        dishes: {},
        paymentStatus: order.payment_status,
      };
    }

    customerSummary[order.username].totalAmount += order.total_amount;
    customerSummary[order.username].orders.push({
      id: order.id,
      amount: order.total_amount,
      status: order.status,
      payment: order.payment_status,
      items: orderItems,
    });

    // Add each item to customer's dishes and global dish summary
    for (const item of orderItems) {
      const itemName = item.name;
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const subtotal = price * quantity;

      // Add to customer's dishes
      if (!customerSummary[order.username].dishes[itemName]) {
        customerSummary[order.username].dishes[itemName] = {
          quantity: 0,
          amount: 0,
        };
      }
      customerSummary[order.username].dishes[itemName].quantity += quantity;
      customerSummary[order.username].dishes[itemName].amount += subtotal;

      // Add to global dish summary
      if (!dishSummary[itemName]) {
        dishSummary[itemName] = {
          totalQuantity: 0,
          totalRevenue: 0,
          unitPrice: price,
          customers: {},
        };
      }
      dishSummary[itemName].totalQuantity += quantity;
      dishSummary[itemName].totalRevenue += subtotal;

      if (!dishSummary[itemName].customers[order.username]) {
        dishSummary[itemName].customers[order.username] = 0;
      }
      dishSummary[itemName].customers[order.username] += quantity;
    }
  }

  // Create main summary embed
  const summaryEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(
      `📊 Tổng hợp chi tiết - ${moment(dateInput).format("DD/MM/YYYY")}`
    )
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
    );

  // Add cancelled orders info if any
  if (cancelledCount > 0) {
    summaryEmbed.addFields({
      name: "❌ Đơn đã hủy",
      value: `${cancelledCount} đơn (không tính trong tổng hợp)`,
      inline: true,
    });
  }

  // Customer breakdown - show who ordered what
  const customerList = Object.entries(customerSummary)
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount) // Sort by total amount DESC
    .slice(0, 15) // Top 15 customers
    .map(([customerName, data]) => {
      const dishList = Object.entries(data.dishes)
        .map(([dish, info]) => `${dish} x${info.quantity}`)
        .join(", ");

      const paymentEmoji = data.paymentStatus === "paid" ? "✅" : "⏳";

      return `${paymentEmoji} **${customerName}**\n${dishList}\n💰 ${formatPrice(
        data.totalAmount
      )}`;
    })
    .join("\n\n");

  if (customerList) {
    summaryEmbed.addFields({
      name: "👥 Chi tiết khách hàng (top 15)",
      value: customerList,
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [summaryEmbed] });

  // Create detailed dish summary
  const dishItems = Object.entries(dishSummary).sort(
    (a, b) => b[1].totalQuantity - a[1].totalQuantity
  );

  if (dishItems.length > 0) {
    const dishEmbed = new EmbedBuilder()
      .setColor(0x32cd32)
      .setTitle(
        `🍽️ Chi tiết món ăn - ${moment(dateInput).format("DD/MM/YYYY")}`
      );

    // Show dish breakdown with customers
    const dishBreakdown = dishItems
      .slice(0, 10) // Top 10 dishes
      .map(([dishName, data]) => {
        const customerList = Object.entries(data.customers)
          .sort((a, b) => b[1] - a[1]) // Sort by quantity DESC
          .map(([customer, qty]) => `${customer} (${qty})`)
          .join(", ");

        return (
          `**${dishName}** - ${data.totalQuantity} phần\n` +
          `💰 ${formatPrice(data.totalRevenue)} | 👥 ${customerList}`
        );
      })
      .join("\n\n");

    dishEmbed.setDescription(dishBreakdown);

    // Add preparation summary
    const totalDishes = dishItems.reduce(
      (sum, [, data]) => sum + data.totalQuantity,
      0
    );
    dishEmbed.addFields({
      name: "👨‍🍳 Tổng cần chuẩn bị",
      value: `**${totalDishes}** phần từ **${dishItems.length}** món khác nhau`,
      inline: false,
    });

    await interaction.followUp({
      embeds: [dishEmbed],
      ephemeral: true,
    });
  }

  // Send kitchen preparation list to admin channel
  const orderChannelId = process.env.ORDER_CHANNEL_ID;
  if (orderChannelId && orderChannelId !== interaction.channel.id) {
    try {
      const orderChannel =
        interaction.client.channels.cache.get(orderChannelId);
      if (orderChannel) {
        const kitchenList = dishItems
          .map(([dish, data]) => `**${dish}**: ${data.totalQuantity} phần`)
          .join("\n");

        const kitchenEmbed = new EmbedBuilder()
          .setColor(0xff6b35)
          .setTitle(
            `🍳 Danh sách bếp - ${moment(dateInput).format("DD/MM/YYYY")}`
          )
          .setDescription(kitchenList || "Không có món nào")
          .addFields({
            name: "📊 Tóm tắt",
            value: `${totalOrders} đơn | ${dishItems.reduce(
              (sum, [, data]) => sum + data.totalQuantity,
              0
            )} phần | ${formatPrice(totalAmount)}`,
            inline: false,
          })
          .setFooter({ text: `Yêu cầu: ${interaction.user.displayName}` })
          .setTimestamp();

        await orderChannel.send({
          content: "👨‍🍳 **DANH SÁCH CHUẨN BỊ CHO BẾP**",
          embeds: [kitchenEmbed],
        });

        await interaction.followUp({
          content: `✅ Đã gửi danh sách bếp đến <#${orderChannelId}>`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Could not send to admin channel:", error);
    }
  }
}

async function handleSendPaymentNotify(interaction, database) {
  const customMessage = interaction.options.getString("message") || "";

  console.log(`[DEBUG] Starting sendpaymentnotify for all pending orders`);

  try {
    console.log(`[DEBUG] Getting all pending payment orders`);
    const pendingOrders = await database.getPendingPaymentOrders();
    console.log(
      `[DEBUG] Found ${pendingOrders.length} pending payment orders (excluding cancelled)`
    );

    if (pendingOrders.length === 0) {
      console.log(`[DEBUG] No pending orders, sending response to admin`);
      await interaction.editReply({
        embeds: [
          {
            color: 0xff9900,
            title: "📋 Không có đơn hàng chờ thanh toán",
            description: `Không có đơn hàng nào cần thanh toán trong hệ thống (đã loại bỏ đơn hủy)`,
            timestamp: new Date(),
          },
        ],
      });
      return;
    }

    // Group orders by user
    console.log(`[DEBUG] Grouping orders by user...`);
    const userOrders = {};
    pendingOrders.forEach((order) => {
      if (!userOrders[order.user_id]) {
        userOrders[order.user_id] = {
          username: order.username,
          orders: [],
          totalAmount: 0,
        };
      }
      userOrders[order.user_id].orders.push(order);
      userOrders[order.user_id].totalAmount += parseFloat(order.total_amount);
    });

    const userIds = Object.keys(userOrders);
    console.log(
      `[DEBUG] Found ${userIds.length} unique users with pending payments`
    );

    let sentCount = 0;
    let failedCount = 0;
    const failedUsers = [];

    // Send notifications to each user
    console.log(`[DEBUG] Starting to send notifications...`);
    for (const userId of userIds) {
      try {
        console.log(
          `[DEBUG] Processing user ${userId} (${userOrders[userId].username})`
        );

        console.log(`[DEBUG] Fetching user object from Discord...`);
        const user = await interaction.client.users.fetch(userId);
        console.log(`[DEBUG] Successfully fetched user: ${user.username}`);

        const userData = userOrders[userId];

        // Create notification embed
        console.log(`[DEBUG] Creating notification embed...`);
        // Get earliest and latest delivery dates
        const deliveryDates = userData.orders
          .map((order) => order.menu_date)
          .sort();
        const dateRangeText =
          deliveryDates.length === 1
            ? moment(deliveryDates[0]).format("DD/MM/YYYY")
            : `${moment(deliveryDates[0]).format("DD/MM")} - ${moment(
                deliveryDates[deliveryDates.length - 1]
              ).format("DD/MM/YYYY")}`;

        const notificationEmbed = new EmbedBuilder()
          .setColor(0xff9900)
          .setTitle("🔔 Thông báo thanh toán tiền cơm")
          .setDescription(
            customMessage ||
              `Chào **${userData.username}**!\n\nBạn có ${userData.orders.length} đơn hàng chưa thanh toán. Vui lòng thanh toán để đảm bảo việc giao hàng đúng hẹn.`
          )
          .addFields(
            {
              name: "📅 Ngày giao hàng",
              value: dateRangeText,
              inline: true,
            },
            {
              name: "📦 Số đơn hàng",
              value: userData.orders.length.toString(),
              inline: true,
            },
            {
              name: "💰 Tổng tiền cần thanh toán",
              value: formatPrice(userData.totalAmount),
              inline: true,
            }
          )
          .setTimestamp();

        // Add order details with delivery dates
        console.log(`[DEBUG] Building order details...`);
        let orderDetails = "";
        userData.orders.forEach((order) => {
          const orderItems = order.items
            .map((item) => `• ${item.name} x${item.quantity}`)
            .join("\n");
          orderDetails += `**🛍️ Đơn hàng #${order.id}** (📅 ${moment(
            order.menu_date
          ).format("DD/MM")})\n${orderItems}\n💰 **${formatPrice(
            order.total_amount
          )}**\n\n`;
        });

        if (orderDetails.length > 1000) {
          orderDetails = orderDetails.substring(0, 1000) + "...";
        }

        notificationEmbed.addFields({
          name: "🍽️ Chi tiết tất cả đơn hàng chưa thanh toán",
          value: orderDetails || "Không có chi tiết",
          inline: false,
        });

        notificationEmbed.addFields({
          name: "💳 Hướng dẫn thanh toán",
          value:
            "• Sử dụng lệnh `/pay` để xem chi tiết thanh toán\n• Quét mã QR MoMo để thanh toán\n• Sau khi chuyển khoản, nhấn nút **✅ Đã chuyển khoản**\n• Admin sẽ xác nhận và cập nhật trạng thái đơn hàng",
          inline: false,
        });

        notificationEmbed.setFooter({
          text: "Cảm ơn bạn đã sử dụng dịch vụ đặt cơm! Vui lòng thanh toán sớm.",
        });

        // Create action buttons
        console.log(`[DEBUG] Creating action buttons...`);
        const buttons = new ActionRowBuilder();

        if (userData.orders.length === 1) {
          // Single order - direct payment button
          buttons.addComponents(
            new ButtonBuilder()
              .setCustomId(`payment_${userData.orders[0].id}`)
              .setLabel("💳 Thanh toán ngay")
              .setStyle(ButtonStyle.Success)
          );
        } else {
          // Multiple orders - general pay command
          buttons.addComponents(
            new ButtonBuilder()
              .setCustomId(`quick_menu_null`)
              .setLabel("💳 Xem tất cả đơn hàng")
              .setStyle(ButtonStyle.Primary)
          );
        }

        console.log(`[DEBUG] Sending DM to user ${userId}...`);
        await user.send({
          embeds: [notificationEmbed],
          components: [buttons],
        });

        sentCount++;
        console.log(
          `[INFO] Payment notification sent to ${userData.username} (${userId})`
        );
      } catch (error) {
        failedCount++;
        failedUsers.push(userOrders[userId].username);
        console.error(
          `[ERROR] Failed to send payment notification to ${userId}:`,
          error.message
        );
      }
    }

    console.log(
      `[DEBUG] Finished sending notifications. Sent: ${sentCount}, Failed: ${failedCount}`
    );
    console.log(`[DEBUG] Creating summary embed...`);

    // Get date range for summary
    const allDates = pendingOrders.map((order) => order.menu_date).sort();
    const uniqueDates = [...new Set(allDates)];
    const dateRange =
      uniqueDates.length === 1
        ? moment(uniqueDates[0]).format("DD/MM/YYYY")
        : `${moment(uniqueDates[0]).format("DD/MM")} - ${moment(
            uniqueDates[uniqueDates.length - 1]
          ).format("DD/MM/YYYY")}`;

    // Send summary to admin
    const summaryEmbed = new EmbedBuilder()
      .setColor(sentCount > 0 ? 0x00ff00 : 0xff0000)
      .setTitle("📤 Kết quả gửi thông báo thanh toán")
      .addFields(
        {
          name: "📅 Khoảng ngày giao",
          value: dateRange,
          inline: true,
        },
        {
          name: "📦 Tổng đơn hàng",
          value: pendingOrders.length.toString(),
          inline: true,
        },
        {
          name: "👥 Người dùng",
          value: userIds.length.toString(),
          inline: true,
        },
        {
          name: "✅ Gửi thành công",
          value: sentCount.toString(),
          inline: true,
        },
        {
          name: "❌ Gửi thất bại",
          value: failedCount.toString(),
          inline: true,
        },
        {
          name: "💰 Tổng tiền chờ thanh toán",
          value: formatPrice(
            Object.values(userOrders).reduce(
              (sum, userData) => sum + userData.totalAmount,
              0
            )
          ),
          inline: true,
        }
      )
      .setTimestamp();

    if (customMessage) {
      summaryEmbed.addFields({
        name: "💬 Tin nhắn tùy chỉnh",
        value: customMessage,
        inline: false,
      });
    }

    if (failedUsers.length > 0) {
      summaryEmbed.addFields({
        name: "⚠️ Không thể gửi thông báo đến",
        value: failedUsers.join(", "),
        inline: false,
      });
    }

    console.log(`[DEBUG] Sending reply to admin...`);
    await interaction.editReply({
      embeds: [summaryEmbed],
    });

    console.log(`[DEBUG] Sending notification to order channel...`);
    // Send notification to order channel if configured
    const orderChannelId = process.env.ORDER_CHANNEL_ID;
    if (orderChannelId && orderChannelId !== interaction.channel.id) {
      try {
        const orderChannel =
          interaction.client.channels.cache.get(orderChannelId);
        if (orderChannel) {
          await orderChannel.send({
            content: `🔔 **Admin ${interaction.user.displayName} đã gửi thông báo thanh toán**`,
            embeds: [summaryEmbed],
          });
        }
      } catch (error) {
        console.error("Could not send to order channel:", error);
      }
    }

    console.log(`[DEBUG] sendpaymentnotify completed successfully`);
  } catch (error) {
    console.error("Error in handleSendPaymentNotify:", error);
    await interaction.editReply({
      embeds: [
        {
          color: 0xff0000,
          title: "❌ Lỗi gửi thông báo",
          description:
            "Có lỗi xảy ra khi gửi thông báo thanh toán. Vui lòng thử lại!",
          timestamp: new Date(),
        },
      ],
    });
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
