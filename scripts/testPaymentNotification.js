const SupabaseDatabase = require("../src/database/supabase");
const moment = require("moment");

async function testPaymentNotification() {
  console.log("🔄 Testing Payment Notification Functionality...");

  const database = new SupabaseDatabase();
  await database.init();

  try {
    // Test date
    const testDate = moment().format("YYYY-MM-DD");
    console.log(`📅 Testing for date: ${testDate}`);

    // Get all orders for today
    const allOrders = await database.getOrdersByDate(testDate);
    console.log(`📦 Total orders found: ${allOrders.length}`);

    // Filter pending payment orders
    const pendingOrders = allOrders.filter(
      (order) => order.payment_status === "pending"
    );
    console.log(`⏳ Pending payment orders: ${pendingOrders.length}`);

    if (pendingOrders.length === 0) {
      console.log("✅ No pending payment orders found. Test completed.");
      return;
    }

    // Group orders by user
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

    console.log(
      `👥 Users with pending payments: ${Object.keys(userOrders).length}`
    );

    // Display user summary
    Object.entries(userOrders).forEach(([userId, userData]) => {
      console.log(`\n👤 User: ${userData.username} (${userId})`);
      console.log(`📦 Orders: ${userData.orders.length}`);
      console.log(`💰 Total amount: ${formatPrice(userData.totalAmount)}`);

      userData.orders.forEach((order) => {
        console.log(
          `  📋 Order #${order.id}: ${formatPrice(order.total_amount)}`
        );
        order.items.forEach((item) => {
          console.log(`    • ${item.name} x${item.quantity}`);
        });
      });
    });

    // Test message content generation
    console.log("\n📝 Testing message content generation...");

    const userId = Object.keys(userOrders)[0];
    const userData = userOrders[userId];

    console.log("\n--- Sample Notification Message ---");
    console.log(`🔔 Thông báo thanh toán tiền cơm`);
    console.log(`Chào ${userData.username}!`);
    console.log(
      `Bạn có đơn hàng chưa thanh toán. Vui lòng thanh toán để đảm bảo việc giao hàng đúng hẹn.`
    );
    console.log(`📅 Ngày giao hàng: ${moment(testDate).format("DD/MM/YYYY")}`);
    console.log(`📦 Số đơn hàng: ${userData.orders.length}`);
    console.log(
      `💰 Tổng tiền cần thanh toán: ${formatPrice(userData.totalAmount)}`
    );

    let orderDetails = "";
    userData.orders.forEach((order) => {
      const orderItems = order.items
        .map((item) => `• ${item.name} x${item.quantity}`)
        .join("\n");
      orderDetails += `🛍️ Đơn hàng #${
        order.id
      }\n${orderItems}\n💰 ${formatPrice(order.total_amount)}\n\n`;
    });

    console.log(`🍽️ Chi tiết đơn hàng:\n${orderDetails}`);
    console.log("--- End Sample Message ---\n");

    console.log("✅ Payment notification test completed successfully!");
  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    database.close();
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// Run test if this file is executed directly
if (require.main === module) {
  testPaymentNotification()
    .then(() => {
      console.log("🎉 Test completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test failed:", error);
      process.exit(1);
    });
}

module.exports = { testPaymentNotification };
