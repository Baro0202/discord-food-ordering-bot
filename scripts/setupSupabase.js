require("dotenv").config();
const SupabaseDatabase = require("../src/database/supabase");

async function setupSupabaseData() {
  console.log("🚀 Setting up Supabase database with sample data...");

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error("❌ Missing Supabase configuration!");
    console.error(
      "Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file"
    );
    process.exit(1);
  }

  console.log("✅ Supabase config found");

  const database = new SupabaseDatabase();

  try {
    console.log("🔌 Connecting to Supabase...");
    await database.init();

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    try {
      // Clear daily menus first (references menu_items)
      await database.supabase.from("daily_menus").delete().neq("id", 0);
      console.log("✅ Cleared daily_menus");

      // Clear orders (references menu_items)
      await database.supabase.from("orders").delete().neq("id", 0);
      console.log("✅ Cleared orders");

      // Clear menu_items
      await database.supabase.from("menu_items").delete().neq("id", 0);
      console.log("✅ Cleared menu_items");

      // Reset auto-increment counters
      try {
        await database.supabase.rpc("reset_menu_items_sequence");
        console.log("✅ Reset ID sequences");
      } catch (rpcError) {
        console.log(
          "⚠️  Sequence reset function not found, IDs may not start from 1"
        );
      }
    } catch (clearError) {
      console.log("⚠️  Some tables might be empty, continuing...");
    }

    // Sample Vietnamese food items
    const sampleItems = [
      {
        name: "Thịt kho trứng cút",
        description: "Thịt heo ba chỉ kho cùng trứng cút thơm ngon",
        price: 45000,
        category: "main",
        image_url: "",
      },
      {
        name: "Trứng đúc thịt",
        description: "Trứng đúc nhân thịt băm đậm đà",
        price: 38000,
        category: "main",
        image_url: "",
      },
      {
        name: "Bò hầm tiêu",
        description: "Thịt bò hầm mềm với hạt tiêu thơm",
        price: 55000,
        category: "main",
        image_url: "",
      },
      {
        name: "Cá lóc kho tộ",
        description: "Cá lóc tươi kho tộ đậm đà",
        price: 45000,
        category: "main",
        image_url: "",
      },
      {
        name: "Đậu hũ dồn thịt",
        description: "Đậu hũ non nhồi thịt hấp",
        price: 38000,
        category: "main",
        image_url: "",
      },
      {
        name: "Canh chua cá lóc",
        description: "Canh chua truyền thống với cá lóc tươi",
        price: 35000,
        category: "soup",
        image_url: "",
      },
      {
        name: "Trứng chiên",
        description: "Trứng gà chiên vàng giòn",
        price: 25000,
        category: "main",
        image_url: "",
      },
      {
        name: "Thịt heo kho xả ớt",
        description: "Thịt heo kho với sả và ớt thơm cay",
        price: 45000,
        category: "main",
        image_url: "",
      },
      {
        name: "Rau muống xào tỏi",
        description: "Rau muống tươi xào tỏi giòn ngon",
        price: 20000,
        category: "vegetable",
        image_url: "",
      },
      {
        name: "Cơm trắng",
        description: "Cơm trắng thơm dẻo",
        price: 8000,
        category: "rice",
        image_url: "",
      },
    ];

    console.log("📝 Adding new menu items...");
    const addedItems = [];

    for (const item of sampleItems) {
      try {
        const result = await database.addMenuItem(
          item.name,
          item.description,
          item.price,
          item.image_url,
          item.category
        );
        addedItems.push(result);
        console.log(`✅ Added: ${item.name} (ID: ${result.id})`);
      } catch (error) {
        console.error(`❌ Failed to add ${item.name}:`, error);
      }
    }

    // Create today's menu with actual IDs from newly added items
    console.log("📅 Setting up today's menu...");
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    if (addedItems.length >= 5) {
      // Use first 5-7 items for today's menu
      const menuItemIds = addedItems.slice(0, 7).map((item) => item.id);

      try {
        await database.createDailyMenu(
          today,
          menuItemIds,
          "Menu đặc biệt hôm nay! Giao hàng lúc 12:00 PM"
        );
        console.log(
          `✅ Created today's menu with items: ${menuItemIds.join(", ")}`
        );
      } catch (error) {
        console.error("❌ Failed to create daily menu:", error);
      }
    }

    console.log("\n🎉 Supabase setup completed successfully!");
    console.log("📊 You can now view your data in Supabase Dashboard");
    console.log("🤖 Start the bot with: yarn start");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    console.error("Make sure:");
    console.error("1. Supabase project is created");
    console.error(
      "2. Database tables are created (run SQL in Supabase dashboard)"
    );
    console.error("3. Environment variables are set correctly");
  } finally {
    database.close();
  }
}

setupSupabaseData();
