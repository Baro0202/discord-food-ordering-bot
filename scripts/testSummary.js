require("dotenv").config();
const SupabaseDatabase = require("../src/database/supabase");
const moment = require("moment");

async function testSummary() {
  console.log("🔍 Testing summary functionality...");

  const database = new SupabaseDatabase();
  await database.init();

  try {
    const today = moment().format("YYYY-MM-DD");
    console.log(`📅 Checking orders for: ${today}`);

    const allOrders = await database.getOrdersByDate(today);
    const orders = allOrders.filter((order) => order.status !== "cancelled");
    const cancelledCount = allOrders.length - orders.length;

    console.log(
      `📊 Found ${allOrders.length} total orders (${orders.length} valid, ${cancelledCount} cancelled)`
    );

    if (orders.length > 0) {
      console.log("\n📋 Sample orders:");
      orders.slice(0, 3).forEach((order, index) => {
        console.log(`\n${index + 1}. Order #${order.id}:`);
        console.log(`   👤 Customer: ${order.username}`);
        console.log(`   💰 Total: ${order.total_amount}`);
        console.log(`   🚚 Status: ${order.status}`);
        console.log(`   💳 Payment: ${order.payment_status}`);

        // Parse items
        let items = [];
        try {
          items =
            typeof order.items === "string"
              ? JSON.parse(order.items)
              : order.items || [];

          console.log(`   🍽️ Items (${items.length}):`);
          items.forEach((item) => {
            console.log(
              `      • ${item.name} x${item.quantity} = ${
                item.price * item.quantity
              } VND`
            );
          });
        } catch (e) {
          console.log(`   ❌ Error parsing items: ${e.message}`);
        }
      });

      // Aggregate food summary
      const foodSummary = {};

      for (const order of orders) {
        let orderItems = [];
        try {
          orderItems =
            typeof order.items === "string"
              ? JSON.parse(order.items)
              : order.items || [];
        } catch (e) {
          continue;
        }

        for (const item of orderItems) {
          const itemName = item.name;
          const quantity = item.quantity || 1;
          const price = item.price || 0;

          if (!foodSummary[itemName]) {
            foodSummary[itemName] = {
              totalQuantity: 0,
              totalRevenue: 0,
            };
          }

          foodSummary[itemName].totalQuantity += quantity;
          foodSummary[itemName].totalRevenue += price * quantity;
        }
      }

      console.log("\n🍽️ Food Summary:");
      const foodItems = Object.entries(foodSummary).sort(
        (a, b) => b[1].totalQuantity - a[1].totalQuantity
      );

      if (foodItems.length > 0) {
        foodItems.forEach(([itemName, data], index) => {
          console.log(`${index + 1}. ${itemName}:`);
          console.log(`   🔢 Quantity: ${data.totalQuantity} servings`);
          console.log(`   💰 Revenue: ${data.totalRevenue} VND`);
        });

        const totalDishes = foodItems.reduce(
          (sum, [_, data]) => sum + data.totalQuantity,
          0
        );
        console.log(
          `\n👨‍🍳 Total dishes to prepare: ${totalDishes} servings from ${foodItems.length} different items`
        );
      } else {
        console.log("   No items found in orders");
      }
    } else {
      console.log("⚠️ No orders found for today. Creating sample data...");

      // Create sample order for testing
      const menuItems = await database.getMenuItems(true);
      if (menuItems.length > 0) {
        const sampleItems = menuItems.slice(0, 2).map((item) => ({
          item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 2,
          subtotal: item.price * 2,
        }));

        const totalAmount = sampleItems.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );

        console.log("Creating sample order...");
        const result = await database.createOrder(
          "123456789",
          "TestUser",
          today,
          sampleItems,
          totalAmount
        );

        console.log(`✅ Created sample order #${result.id}`);
        console.log("Run the script again to see the summary!");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    database.close();
  }
}

testSummary();
