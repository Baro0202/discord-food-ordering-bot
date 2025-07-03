const { createClient } = require("@supabase/supabase-js");

class SupabaseDatabase {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async init() {
    try {
      // Test connection
      const { data, error } = await this.supabase
        .from("menu_items")
        .select("count")
        .limit(1);
      if (error && error.code === "42P01") {
        // Table doesn't exist, create schema
        await this.createTables();
      }
      console.log("[INFO] Connected to Supabase database");
    } catch (error) {
      console.error("[ERROR] Failed to connect to Supabase:", error);
      throw error;
    }
  }

  async createTables() {
    console.log("[INFO] Creating database schema...");

    // Note: You'll need to run these in Supabase SQL editor
    const sqlSchema = `
      -- Menu items table
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        category VARCHAR(50) DEFAULT 'main',
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Daily menus table
      CREATE TABLE IF NOT EXISTS daily_menus (
        id SERIAL PRIMARY KEY,
        menu_date DATE UNIQUE NOT NULL,
        menu_items INTEGER[],
        special_note TEXT,
        delivery_time TIME DEFAULT '12:00',
        order_deadline TIME DEFAULT '09:45',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        menu_date DATE NOT NULL,
        items JSONB NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        preferences JSONB,
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_order_at TIMESTAMP
      );

      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_menu_date ON orders(menu_date);
      CREATE INDEX IF NOT EXISTS idx_daily_menus_date ON daily_menus(menu_date);
    `;

    console.log("[INFO] Please run this SQL in your Supabase SQL Editor:");
    console.log(sqlSchema);
    console.log("[INFO] After running the SQL, restart the bot.");
  }

  // Menu Items
  async addMenuItem(name, description, price, imageUrl, category = "main") {
    const { data, error } = await this.supabase
      .from("menu_items")
      .insert({
        name,
        description,
        price,
        image_url: imageUrl,
        category,
        available: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getMenuItems(availableOnly = true) {
    let query = this.supabase.from("menu_items").select("*");

    if (availableOnly) {
      query = query.eq("available", true);
    }

    const { data, error } = await query.order("category").order("name");
    if (error) throw error;
    return data || [];
  }

  // Daily Menu
  async createDailyMenu(date, itemIds, specialNote = null) {
    const { data, error } = await this.supabase
      .from("daily_menus")
      .upsert({
        menu_date: date,
        menu_items: itemIds,
        special_note: specialNote,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDailyMenu(date, itemIds, specialNote = null) {
    const { data, error } = await this.supabase
      .from("daily_menus")
      .update({
        menu_items: itemIds,
        special_note: specialNote,
      })
      .eq("menu_date", date)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDailyMenu(date) {
    const { data, error } = await this.supabase
      .from("daily_menus")
      .select("*")
      .eq("menu_date", date)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
    return data;
  }

  // Orders
  async createOrder(userId, username, menuDate, orderItems, totalAmount) {
    const { data, error } = await this.supabase
      .from("orders")
      .insert({
        user_id: userId,
        username,
        menu_date: menuDate,
        items: orderItems,
        total_amount: totalAmount,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // Update user stats
    await this.upsertUser(userId, username);

    return data;
  }

  async getOrder(orderId) {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  // Alias for compatibility
  async getOrderById(orderId) {
    return this.getOrder(orderId);
  }

  async getOrdersByDate(date) {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*")
      .eq("menu_date", date)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUserOrders(userId, limit = 10) {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getUserOrdersByDate(userId, date) {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .eq("menu_date", date)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateOrderStatus(orderId, status) {
    const { data, error } = await this.supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePaymentStatus(orderId, paymentStatus) {
    const { data, error } = await this.supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all pending payment orders (for payment notifications)
  async getPendingPaymentOrders() {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*")
      .eq("payment_status", "pending")
      .neq("status", "cancelled")
      .order("menu_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Users
  async upsertUser(userId, username, displayName = null) {
    const { data, error } = await this.supabase
      .from("users")
      .upsert(
        {
          user_id: userId,
          username,
          display_name: displayName,
          last_order_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Generic query methods for compatibility
  async run(sql, params = []) {
    // For simple updates, we'll need to implement specific methods
    // This is a placeholder for compatibility
    console.warn(
      "[WARN] Direct SQL not supported in Supabase. Use specific methods."
    );
    return { changes: 1 };
  }

  async get(sql, params = []) {
    console.warn(
      "[WARN] Direct SQL not supported in Supabase. Use specific methods."
    );
    return null;
  }

  async all(sql, params = []) {
    console.warn(
      "[WARN] Direct SQL not supported in Supabase. Use specific methods."
    );
    return [];
  }

  close() {
    // Supabase handles connection pooling automatically
    console.log("[INFO] Supabase connection closed");
  }
}

module.exports = SupabaseDatabase;
