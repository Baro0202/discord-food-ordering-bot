import { createClient } from "./supabase";

export class WebDatabase {
  constructor() {
    this.supabase = createClient();
  }

  // Auth related methods
  async signUp(email, password, userData = {}) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  }

  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();
    return { user, error };
  }

  // Profile methods - using separate profiles table for web users
  async createProfile(authUserId, profileData) {
    const { data, error } = await this.supabase
      .from("profiles")
      .insert({
        auth_user_id: authUserId,
        ...profileData,
      })
      .select()
      .single();

    return { data, error };
  }

  async getProfile(authUserId) {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUserId)
      .single();

    return { data, error };
  }

  async updateProfile(authUserId, updates) {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("auth_user_id", authUserId)
      .select()
      .single();

    return { data, error };
  }

  // Menu methods (shared with Discord bot - read-only for web)
  async getMenuItems(availableOnly = true) {
    let query = this.supabase.from("menu_items").select("*");

    if (availableOnly) {
      query = query.eq("available", true);
    }

    const { data, error } = await query.order("category").order("name");
    return { data: data || [], error };
  }

  async getDailyMenu(date) {
    const { data, error } = await this.supabase
      .from("daily_menus")
      .select("*")
      .eq("menu_date", date)
      .single();

    if (data && data.menu_items) {
      // Get full menu item details
      const { data: menuItems, error: menuError } = await this.supabase
        .from("menu_items")
        .select("*")
        .in("id", data.menu_items);

      if (menuError) {
        return { data, error: menuError };
      }

      data.menu_items_details = menuItems;
    }

    return { data, error };
  }

  // Orders - create separate orders for web users with source tracking
  async createWebOrder(authUserId, orderData) {
    // Create order with web source
    const { data, error } = await this.supabase
      .from("orders")
      .insert({
        user_id: authUserId, // Use auth user ID for web orders
        username: orderData.username || "Web User",
        menu_date: orderData.menuDate,
        items: orderData.items,
        total_amount: orderData.totalAmount,
        status: "pending",
        payment_status: "pending",
        order_source: "web", // Mark as web order
        notes: orderData.notes || null,
      })
      .select()
      .single();

    if (!error) {
      // Optionally create/update mapping
      await this.createUserMapping(authUserId, authUserId, "web");
    }

    return { data, error };
  }

  async getUserOrders(authUserId, limit = 10) {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*")
      .eq("user_id", authUserId)
      .eq("order_source", "web") // Only web orders
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(limit);

    return { data: data || [], error };
  }

  async getOrderById(orderId) {
    const { data, error } = await this.supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("order_source", "web") // Security: only web orders
      .single();

    return { data, error };
  }

  // User mapping methods
  async createUserMapping(authUserId, appUserId, mappingType = "web") {
    const { data, error } = await this.supabase
      .from("web_user_mapping")
      .upsert({
        auth_user_id: authUserId,
        app_user_id: appUserId,
        mapping_type: mappingType,
      })
      .select()
      .single();

    return { data, error };
  }

  async getUserMapping(authUserId) {
    const { data, error } = await this.supabase
      .from("web_user_mapping")
      .select("*")
      .eq("auth_user_id", authUserId)
      .single();

    return { data, error };
  }

  // Settings - read-only access to shared settings
  async getSettings() {
    const { data, error } = await this.supabase.from("settings").select("*");

    return { data: data || [], error };
  }

  async getSetting(key) {
    const { data, error } = await this.supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .single();

    return { data: data?.value, error };
  }

  // Statistics for dashboard
  async getUserStats(authUserId) {
    const { data: orders, error } = await this.getUserOrders(authUserId, 100);

    if (error) return { data: null, error };

    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce(
        (sum, order) => sum + parseFloat(order.total_amount || 0),
        0
      ),
      pendingOrders: orders.filter((order) => order.status === "pending")
        .length,
      completedOrders: orders.filter((order) => order.status === "completed")
        .length,
      recentOrders: orders.slice(0, 5),
    };

    return { data: stats, error: null };
  }
}
