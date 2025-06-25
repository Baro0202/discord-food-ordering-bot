const Database = require("../src/database/database");
const moment = require("moment");

async function setupDatabase() {
  console.log("🚀 Bắt đầu thiết lập database...");

  const database = new Database();
  await database.init();

  try {
    // Add sample menu items
    console.log("📝 Thêm món ăn mẫu...");

    const sampleItems = [
      // Món chính
      {
        name: "Cơm tấm sườn nướng",
        description: "Cơm tấm với sườn nướng thơm ngon, chả trứng và bì",
        price: 45000,
        category: "main",
        image_url: null,
      },
      {
        name: "Phở bò tái",
        description: "Phở bò truyền thống với thịt tái, hành lá và ngò gai",
        price: 40000,
        category: "main",
        image_url: null,
      },
      {
        name: "Bún thịt nướng",
        description: "Bún tươi với thịt nướng, chả cá và rau sống",
        price: 38000,
        category: "main",
        image_url: null,
      },
      {
        name: "Cơm gà teriyaki",
        description: "Cơm trắng với gà teriyaki và salad",
        price: 42000,
        category: "main",
        image_url: null,
      },
      {
        name: "Mì Quảng",
        description: "Mì Quảng đặc biệt với tôm, thịt và trứng cút",
        price: 43000,
        category: "main",
        image_url: null,
      },

      // Canh/Súp
      {
        name: "Canh chua cá",
        description: "Canh chua cá bông lau với cà chua và dứa",
        price: 25000,
        category: "soup",
        image_url: null,
      },
      {
        name: "Súp gà nấm",
        description: "Súp gà với nấm hương và rau củ",
        price: 20000,
        category: "soup",
        image_url: null,
      },

      // Cơm
      {
        name: "Cơm trắng",
        description: "Cơm trắng thơm dẻo",
        price: 8000,
        category: "rice",
        image_url: null,
      },
      {
        name: "Cơm chiên dương châu",
        description: "Cơm chiên với tôm, xúc xích và trứng",
        price: 35000,
        category: "rice",
        image_url: null,
      },

      // Rau củ
      {
        name: "Gỏi cuốn",
        description: "Gỏi cuốn tôm thịt với nước chấm đậu phộng",
        price: 15000,
        category: "vegetable",
        image_url: null,
      },
      {
        name: "Salad rau mầm",
        description: "Salad rau mầm tươi với sốt yogurt",
        price: 18000,
        category: "vegetable",
        image_url: null,
      },

      // Đồ uống
      {
        name: "Trà đá",
        description: "Trà đá truyền thống",
        price: 5000,
        category: "drink",
        image_url: null,
      },
      {
        name: "Nước cam tươi",
        description: "Nước cam tươi nguyên chất",
        price: 12000,
        category: "drink",
        image_url: null,
      },
      {
        name: "Cà phê sữa đá",
        description: "Cà phê sữa đá đậm đà",
        price: 15000,
        category: "drink",
        image_url: null,
      },

      // Tráng miệng
      {
        name: "Chè ba màu",
        description: "Chè ba màu với đậu xanh, đậu đỏ và thạch",
        price: 12000,
        category: "dessert",
        image_url: null,
      },
      {
        name: "Kem flan",
        description: "Kem flan mát lạnh",
        price: 10000,
        category: "dessert",
        image_url: null,
      },
    ];

    for (const item of sampleItems) {
      await database.addMenuItem(
        item.name,
        item.description,
        item.price,
        item.image_url,
        item.category
      );
    }

    console.log(`✅ Đã thêm ${sampleItems.length} món ăn mẫu`);

    // Create today's menu
    console.log("🍽️ Tạo menu hôm nay...");
    const today = moment().format("YYYY-MM-DD");

    // Get some random items for today's menu
    const menuItems = await database.getMenuItems();
    const todayMenuItems = menuItems.slice(0, 8).map((item) => item.id); // First 8 items

    const sampleMessages = [
      "Cơm hôm nay ngon lắm! 🍱",
      "Có thêm món mới hôm nay nhé! 🆕",
      "Menu đặc biệt hôm nay! Đừng quên đặt trước 9:45 AM 😋",
    ];

    const randomMessage =
      sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

    await database.createDailyMenu(today, todayMenuItems, randomMessage);

    console.log("✅ Đã tạo menu hôm nay");

    // Set up default settings
    console.log("⚙️ Cấu hình settings mặc định...");
    await database.setSetting("business_name", "Quán Cơm Văn Phòng");
    await database.setSetting("contact_info", "Hotline: 0123-456-789");
    await database.setSetting("notification_enabled", "true");

    console.log("✅ Setup hoàn tất!");
    console.log("");
    console.log("🎉 Database đã được khởi tạo thành công!");
    console.log("");
    console.log("📋 Những gì đã được tạo:");
    console.log(`   • ${sampleItems.length} món ăn mẫu`);
    console.log("   • Menu hôm nay với 8 món");
    console.log("   • Cấu hình mặc định");
    console.log("");
    console.log("🚀 Bước tiếp theo:");
    console.log("   1. Cấu hình file .env với Discord bot token");
    console.log("   2. Chạy: npm start");
    console.log("   3. Sử dụng /admin commands để quản lý");
    console.log("   4. Member có thể dùng /menu để đặt món");
    console.log("");
  } catch (error) {
    console.error("❌ Lỗi khi setup database:", error);
  } finally {
    database.close();
  }
}

// Helper function to show current status
async function showStatus() {
  console.log("📊 Trạng thái hiện tại của database:");

  const database = new Database();
  await database.init();

  try {
    const items = await database.getMenuItems(false);
    const today = moment().format("YYYY-MM-DD");
    const todayMenu = await database.getDailyMenu(today);
    const orders = await database.getOrdersByDate(today);

    console.log(`   • Tổng món ăn: ${items.length}`);
    console.log(
      `   • Menu hôm nay: ${
        todayMenu ? todayMenu.menu_items.length + " món" : "Chưa có"
      }`
    );
    console.log(`   • Đơn hàng hôm nay: ${orders.length}`);

    if (items.length > 0) {
      console.log("");
      console.log("🍽️ Một số món ăn có sẵn:");
      items.slice(0, 5).forEach((item) => {
        console.log(`   • ${item.name} - ${formatPrice(item.price)}`);
      });
      if (items.length > 5) {
        console.log(`   ... và ${items.length - 5} món khác`);
      }
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông tin:", error);
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

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--status")) {
    await showStatus();
  } else if (args.includes("--reset")) {
    console.log("🔄 Reset database...");
    // Add reset logic here if needed
    await setupDatabase();
  } else {
    await setupDatabase();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupDatabase, showStatus };
