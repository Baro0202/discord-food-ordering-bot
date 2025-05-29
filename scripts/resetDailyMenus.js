require("dotenv").config();
const SupabaseDatabase = require("../src/database/supabase");
const moment = require("moment");

async function resetDailyMenus() {
  console.log("🔄 Resetting daily menus with existing menu items...");

  const database = new SupabaseDatabase();

  try {
    await database.init();

    // Clear existing daily menus
    console.log("🧹 Clearing existing daily menus...");
    await database.supabase.from("daily_menus").delete().neq("id", 0);
    console.log("✅ Cleared daily_menus");

    // Get all available menu items
    console.log("📋 Getting available menu items...");
    const menuItems = await database.getMenuItems(true); // Only available items

    if (menuItems.length === 0) {
      console.log("❌ No menu items found! Run 'yarn setup-supabase' first");
      return;
    }

    console.log(`✅ Found ${menuItems.length} menu items`);

    // Create today's menu with all available items
    const today = moment().format("YYYY-MM-DD");
    const menuItemIds = menuItems.map((item) => item.id);

    try {
      await database.createDailyMenu(
        today,
        menuItemIds,
        "Menu được cập nhật - Tất cả món ăn có sẵn"
      );
      console.log(
        `✅ Created today's menu (${today}) with ${menuItemIds.length} items`
      );
      console.log(`📋 Item IDs: ${menuItemIds.join(", ")}`);
    } catch (error) {
      console.error("❌ Failed to create daily menu:", error);
    }

    console.log("\n🎉 Daily menus reset completed!");
    console.log("🤖 Your bot should now work with updated menu items");
  } catch (error) {
    console.error("❌ Reset failed:", error);
  } finally {
    database.close();
  }
}

resetDailyMenus();
