const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

class Database {
  constructor() {
    this.dbPath = process.env.DATABASE_URL || "./database/orders.db";
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      // Ensure database directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          reject(err);
        } else {
          console.log("Connected to SQLite database");
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      // Menu items table
      `CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                image_url TEXT,
                category TEXT DEFAULT 'main',
                available BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

      // Daily menus table
      `CREATE TABLE IF NOT EXISTS daily_menus (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL UNIQUE,
                menu_items TEXT NOT NULL, -- JSON array of menu item IDs
                special_note TEXT,
                order_deadline TIME DEFAULT '10:00',
                delivery_time TIME DEFAULT '12:00',
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

      // Orders table
      `CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                menu_date DATE NOT NULL,
                items TEXT NOT NULL, -- JSON array of {item_id, quantity, price}
                total_amount DECIMAL(10,2) NOT NULL,
                payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
                payment_method TEXT,
                payment_id TEXT,
                special_requests TEXT,
                status TEXT DEFAULT 'pending', -- pending, confirmed, preparing, delivered, cancelled
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

      // Users table for tracking preferences
      `CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                display_name TEXT,
                phone TEXT,
                allergies TEXT,
                preferences TEXT, -- JSON
                total_orders INTEGER DEFAULT 0,
                total_spent DECIMAL(10,2) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                description TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Insert default settings
    await this.insertDefaultSettings();
  }

  async insertDefaultSettings() {
    const defaultSettings = [
      ["currency", "VND", "Default currency"],
      ["order_deadline", "10:00", "Daily order deadline"],
      ["delivery_time", "12:00", "Daily delivery time"],
      ["auto_menu_reminder", "true", "Send automatic menu reminders"],
      [
        "payment_required",
        "false",
        "Require payment before order confirmation",
      ],
    ];

    for (const [key, value, description] of defaultSettings) {
      await this.run(
        "INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)",
        [key, value, description]
      );
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Menu methods
  async addMenuItem(
    name,
    description,
    price,
    imageUrl = null,
    category = "main"
  ) {
    return this.run(
      "INSERT INTO menu_items (name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?)",
      [name, description, price, imageUrl, category]
    );
  }

  async getMenuItems(available = true) {
    const sql = available
      ? "SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name"
      : "SELECT * FROM menu_items ORDER BY category, name";
    return this.all(sql);
  }

  async updateMenuItem(id, updates) {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);
    values.push(id);

    return this.run(
      `UPDATE menu_items SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  }

  // Daily menu methods
  async createDailyMenu(date, menuItemIds, specialNote = null) {
    return this.run(
      "INSERT OR REPLACE INTO daily_menus (date, menu_items, special_note) VALUES (?, ?, ?)",
      [date, JSON.stringify(menuItemIds), specialNote]
    );
  }

  async getDailyMenu(date) {
    const menu = await this.get(
      "SELECT * FROM daily_menus WHERE date = ? AND active = 1",
      [date]
    );
    if (menu) {
      menu.menu_items = JSON.parse(menu.menu_items);
    }
    return menu;
  }

  // Order methods
  async createOrder(
    userId,
    username,
    menuDate,
    items,
    totalAmount,
    specialRequests = null
  ) {
    return this.run(
      "INSERT INTO orders (user_id, username, menu_date, items, total_amount, special_requests) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        username,
        menuDate,
        JSON.stringify(items),
        totalAmount,
        specialRequests,
      ]
    );
  }

  async getOrder(orderId) {
    const order = await this.get("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);
    if (order) {
      order.items = JSON.parse(order.items);
    }
    return order;
  }

  async getUserOrders(userId, limit = 10) {
    const orders = await this.all(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      [userId, limit]
    );
    return orders.map((order) => {
      order.items = JSON.parse(order.items);
      return order;
    });
  }

  async getOrdersByDate(date) {
    const orders = await this.all(
      "SELECT * FROM orders WHERE menu_date = ? ORDER BY created_at",
      [date]
    );
    return orders.map((order) => {
      order.items = JSON.parse(order.items);
      return order;
    });
  }

  async updateOrderStatus(orderId, status) {
    return this.run(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, orderId]
    );
  }

  async updatePaymentStatus(
    orderId,
    status,
    paymentId = null,
    paymentMethod = null
  ) {
    return this.run(
      "UPDATE orders SET payment_status = ?, payment_id = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, paymentId, paymentMethod, orderId]
    );
  }

  // User methods
  async upsertUser(userId, username, displayName = null) {
    return this.run(
      `INSERT INTO users (user_id, username, display_name, updated_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id) DO UPDATE SET
             username = excluded.username,
             display_name = excluded.display_name,
             updated_at = CURRENT_TIMESTAMP`,
      [userId, username, displayName]
    );
  }

  async getUser(userId) {
    return this.get("SELECT * FROM users WHERE user_id = ?", [userId]);
  }

  // Settings methods
  async getSetting(key) {
    const result = await this.get("SELECT value FROM settings WHERE key = ?", [
      key,
    ]);
    return result ? result.value : null;
  }

  async setSetting(key, value) {
    return this.run(
      "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [key, value]
    );
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = Database;
