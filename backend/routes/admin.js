const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "online_shop",
  charset: "utf8mb4",
};

// ✅ Authentication middleware
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  console.log('🔐 Authenticating admin token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'ไม่พบ token การยืนยันตัวตน'
    });
  }

  try {
    // ตรวจสอบ token (สำหรับตอนนี้ให้ผ่านไปก่อน)
    req.admin = { id: 1, username: 'admin' };
    console.log('✅ Admin authenticated:', req.admin.username);
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้อง'
    });
  }
}

// ✅ POST /admin/login - Admin login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("🔐 Admin login attempt:", username);

    // ตรวจสอบ credentials (สำหรับตอนนี้ใช้ hardcode)
    if (username === "admin" && password === "password") {
      // สร้าง token (สำหรับตอนนี้ใช้ simple token)
      const token = `admin_token_${Date.now()}`;
      
      console.log("✅ Admin login successful");
      
      res.json({
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        token: token,
        admin: {
          id: 1,
          username: "admin",
          role: "admin"
        }
      });
    } else {
      console.log("❌ Invalid credentials");
      res.status(401).json({
        success: false,
        message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
      });
    }
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
    });
  }
});

// ✅ GET /admin/dashboard/stats - Dashboard statistics
router.get("/dashboard/stats", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    console.log("📊 GET Dashboard Stats - Admin ID:", req.admin.id);

    connection = await mysql.createConnection(dbConfig);

    // Get basic stats with error handling for missing tables
    const [customerCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM customers WHERE status = "active"`
    ).catch(() => [{ count: 0 }]);

    const [productCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM products WHERE is_active = 1`
    ).catch(() => [{ count: 0 }]);

    const [orderStats] = await connection.execute(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders`
    ).catch(() => [{ count: 0, revenue: 0 }]);

    const stats = {
      total_customers: customerCount[0]?.count || 0,
      total_products: productCount[0]?.count || 0,
      total_orders: orderStats[0]?.count || 0,
      total_revenue: parseFloat(orderStats[0]?.revenue || 0),
    };

    console.log("✅ Dashboard stats retrieved:", stats);
    res.json(stats);
  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสถิติ",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

router.get("/products/top", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    console.log("📊 GET Top Products - Admin ID:", req.admin.id);

    connection = await mysql.createConnection(dbConfig);

    const [products] = await connection.execute(`
      SELECT 
        p.id, p.name, p.price, p.stock_quantity, p.image_url,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'confirmed', 'shipped', 'completed')
      WHERE p.is_active = 1
      GROUP BY p.id, p.name, p.price, p.stock_quantity, p.image_url
      ORDER BY total_sold DESC, p.created_at DESC 
      LIMIT 10
    `);

    console.log(`✅ Top products retrieved: ${products.length} items`);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error("❌ Top products error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสินค้า",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

router.get("/verify", authenticateAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Token verified successfully', 
    admin: req.admin 
  });
});


// ✅ GET /admin/orders - Get all orders
router.get("/orders", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    console.log("📊 GET All Orders - Admin:", req.admin.id);

    connection = await mysql.createConnection(dbConfig);

    // ✅ เพิ่ม pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // ✅ นับจำนวนรวม
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total FROM orders
    `);
    const total = countResult[0].total;

    // ✅ ดึงข้อมูลแบบ pagination
    const [orders] = await connection.execute(`
      SELECT 
        o.id, 
        o.order_number, 
        o.customer_name, 
        o.customer_phone, 
        o.customer_email, 
        o.customer_address, 
        o.total_amount, 
        o.status, 
        o.notes, 
        o.created_at, 
        o.updated_at,
        COUNT(oi.id) as item_count
      FROM orders o 
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    console.log(`✅ Orders retrieved: ${orders.length} items`);
    
    // ✅ ส่ง response ในรูปแบบที่ Frontend คาดหวัง
    res.json({
      success: true,
      data: orders,
      total: orders.length,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ Orders error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงคำสั่งซื้อ",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// ✅ GET /admin/orders/recent - Recent orders
router.get("/orders/recent", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    console.log("📊 GET Recent Orders - Admin ID:", req.admin.id);

    connection = await mysql.createConnection(dbConfig);

    const limit = parseInt(req.query.limit) || 10;

    const [orders] = await connection.execute(`
      SELECT 
        o.id, 
        o.order_number, 
        o.customer_name, 
        o.customer_phone, 
        o.customer_email, 
        o.customer_address, 
        o.total_amount, 
        o.status, 
        o.notes, 
        o.created_at, 
        o.updated_at,
        COUNT(oi.id) as item_count
      FROM orders o 
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [limit]);

    console.log(`✅ Recent orders retrieved: ${orders.length} items`);
    
    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
  } catch (error) {
    console.error("❌ Recent orders error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงคำสั่งซื้อ",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// ✅ PUT /admin/orders/:orderId/status - Update order status
router.put("/orders/:orderId/status", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`🔄 Admin ${req.admin.username} updating order ${orderId} status to: ${status}`);

    const validStatuses = [
      "pending",
      "paid",
      "confirmed",
      "shipped",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "สถานะไม่ถูกต้อง",
      });
    }

    connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute(
      "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, orderId]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Order ${orderId} status updated to: ${status}`);

      res.json({
        success: true,
        message: "อัปเดตสถานะคำสั่งซื้อสำเร็จ",
        orderId: parseInt(orderId),
        newStatus: status,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "ไม่พบคำสั่งซื้อ",
      });
    }
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// ✅ GET /admin/products/top - Top selling products
router.get("/products/top", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    console.log("📊 GET Top Products - Admin ID:", req.admin.id);

    connection = await mysql.createConnection(dbConfig);

    const [products] = await connection.execute(`
      SELECT 
        p.id, p.name, p.price, p.stock_quantity,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('confirmed', 'shipped', 'completed')
      WHERE p.is_active = 1
      GROUP BY p.id, p.name, p.price, p.stock_quantity
      ORDER BY total_sold DESC, p.name ASC
      LIMIT 10
    `);

    console.log(`✅ Top products retrieved: ${products.length} items`);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error("❌ Top products error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสินค้า",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// ✅ GET /admin/settings - Get all settings (ใช้อันเดียวเท่านั้น)
router.get("/settings", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    console.log("📊 GET Settings - Admin ID:", req.admin.id);

    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      "SELECT setting_key, setting_value, updated_at FROM settings ORDER BY setting_key ASC"
    );

    console.log(`✅ Settings retrieved: ${rows.length} items`);

    res.json(rows);
  } catch (error) {
    console.error("❌ GET Settings Error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงการตั้งค่า",
      error: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
});

// ✅ GET /admin/settings/:key - Get specific setting
router.get("/settings/:key", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    const { key } = req.params;
    console.log(`📊 ดึงการตั้งค่า: ${key}`);

    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      "SELECT setting_key, setting_value, created_at, updated_at FROM settings WHERE setting_key = ?",
      [key]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบการตั้งค่า: ${key}`,
      });
    }

    res.json({
      success: true,
      data: rows[0],
      message: "ดึงการตั้งค่าสำเร็จ",
    });
  } catch (error) {
    console.error("❌ ข้อผิดพลาดในการดึงการตั้งค่า:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงการตั้งค่า",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// ✅ PUT /admin/settings - Update settings
router.put("/settings", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    console.log("🔄 PUT Settings - Admin ID:", req.admin.id);
    console.log("🔄 Request Body:", req.body);

    const {
      shop_name,
      promptpay_number,
      shop_address,
      shop_phone,
      shop_email,
    } = req.body;

    // Basic validation
    if (!shop_name || shop_name.trim() === "") {
      console.log("❌ Validation failed: shop_name is required");
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุชื่อร้าน",
      });
    }

    if (!promptpay_number || promptpay_number.trim() === "") {
      console.log("❌ Validation failed: promptpay_number is required");
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุหมายเลข PromptPay",
      });
    }

    // Connect to database
    console.log("🔌 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Database connected");

    // Update settings one by one
    const settings = [
      { key: "shop_name", value: shop_name.trim() },
      { key: "promptpay_number", value: promptpay_number.trim() },
      { key: "shop_address", value: (shop_address || "").trim() },
      { key: "shop_phone", value: (shop_phone || "").trim() },
      { key: "shop_email", value: (shop_email || "").trim() },
    ];

    console.log("🔄 Updating settings...");

    for (const setting of settings) {
      try {
        console.log(`Updating ${setting.key} = ${setting.value}`);

        // Check if setting exists
        const [existing] = await connection.execute(
          "SELECT id FROM settings WHERE setting_key = ?",
          [setting.key]
        );

        if (existing.length > 0) {
          // Update existing
          await connection.execute(
            "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?",
            [setting.value, setting.key]
          );
          console.log(`✅ Updated ${setting.key}`);
        } else {
          // Insert new
          await connection.execute(
            "INSERT INTO settings (setting_key, setting_value, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
            [setting.key, setting.value]
          );
          console.log(`✅ Inserted ${setting.key}`);
        }
      } catch (settingError) {
        console.error(`❌ Error updating ${setting.key}:`, settingError);
        throw settingError;
      }
    }

    // Fetch updated settings
    console.log("📊 Fetching updated settings...");
    const [updatedRows] = await connection.execute(
      `SELECT setting_key, setting_value, updated_at 
       FROM settings 
       WHERE setting_key IN ('shop_name', 'promptpay_number', 'shop_address', 'shop_phone', 'shop_email')
       ORDER BY setting_key ASC`
    );

    console.log("✅ Settings updated successfully");

    res.json({
      success: true,
      message: "อัปเดตการตั้งค่าเรียบร้อยแล้ว",
      data: updatedRows,
      updated_count: updatedRows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ PUT Settings Error:", {
      message: error.message,
      stack: error.stack,
      adminId: req.admin?.id,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log("📪 Database connection closed");
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
});

// ✅ DELETE /admin/settings/:key - Delete setting
router.delete("/settings/:key", authenticateAdmin, async (req, res) => {
  let connection;

  try {
    const { key } = req.params;
    console.log(`🗑️ ลบการตั้งค่า: ${key}`);

    // Prevent deletion of critical settings
    const criticalSettings = ["shop_name", "promptpay_number"];
    if (criticalSettings.includes(key)) {
      return res.status(400).json({
        success: false,
        message: "ไม่สามารถลบการตั้งค่าสำคัญนี้ได้",
      });
    }

    connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute(
      "DELETE FROM settings WHERE setting_key = ?",
      [key]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบการตั้งค่า: ${key}`,
      });
    }

    console.log(`✅ ลบการตั้งค่า ${key} สำเร็จ`);

    res.json({
      success: true,
      message: `ลบการตั้งค่า ${key} เรียบร้อยแล้ว`,
      deleted_key: key,
    });
  } catch (error) {
    console.error("❌ ข้อผิดพลาดในการลบการตั้งค่า:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบการตั้งค่า",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router;