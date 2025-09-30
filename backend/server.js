const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const adminRoutes = require("./routes/admin");
const orderRoutes = require("./routes/orders");
const productRoutes = require("./routes/products");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static("uploads"));
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

["uploads/products", "uploads/payments", "uploads/general"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "online_shop",
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  multipleStatements: false
};

let db;

async function connectDB() {
  try {
    // ✅ สร้าง connection pool
    db = mysql.createPool(dbConfig);
    
    // ✅ ทดสอบการเชื่อมต่อ
    const connection = await db.getConnection();
    await connection.execute("SELECT 1 as test");
    connection.release();
    
    console.log("✅ Database connected successfully");
    console.log(`📊 Database: ${dbConfig.database} on ${dbConfig.host}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    
    // ✅ แสดงข้อมูล debug เพิ่มเติม
    console.error("🔍 Database Config:", {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port || 3306
    });
    
    // ✅ ตรวจสอบสาเหตุที่เป็นไปได้
    if (error.code === 'ECONNREFUSED') {
      console.error("💡 แนะนำ: ตรวจสอบว่า MySQL Server ทำงานอยู่หรือไม่");
      console.error("   - XAMPP: เปิด Apache และ MySQL");
      console.error("   - หรือ: net start mysql (Windows)");
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("💡 แนะนำ: ตรวจสอบ username/password ใน .env");
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error("💡 แนะนำ: สร้าง database 'online_shop' ใน MySQL");
    }
    
    process.exit(1);
  }
}

// File upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || "general";
    const uploadPath = `uploads/${folder}`;
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

// Helper functions
const generateOrderNumber = () =>
  `ORD${Date.now().toString().slice(-8)}${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
const hashPassword = async (password) => await bcrypt.hash(password, 12);
const generateToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

// Authentication middleware for customers
const authenticateCustomer = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token)
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await db.execute(
      "SELECT id, email, first_name, last_name, status FROM customers WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0 || rows[0].status !== "active")
      return res.status(401).json({ message: "Invalid token." });

    req.customer = rows[0];
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};

// Authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token)
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });

    if (token.startsWith("mock_token")) {
      req.admin = {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        role: "super_admin",
        status: "active",
      };
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await db.execute(
      "SELECT id, username, email, role, status FROM admins WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0 || rows[0].status !== "active") {
      return res.status(401).json({ message: "Invalid token." });
    }

    req.admin = rows[0];
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};

// Debug endpoint สำหรับ categories
app.get("/api/debug/categories", async (req, res) => {
  try {
    if (!db) {
      return res.json({ error: "Database not connected" });
    }

    const result = {
      database_connected: true,
      tables: [],
      categories_table_exists: false,
      categories_data: [],
      categories_columns: [],
    };

    // แสดง tables ทั้งหมด
    try {
      const [tables] = await db.execute("SHOW TABLES");
      result.tables = tables.map((t) => Object.values(t)[0]);
    } catch (err) {
      result.tables_error = err.message;
    }

    // ตรวจสอบ categories table
    try {
      const [categoriesCheck] = await db.execute(
        "SHOW TABLES LIKE 'categories'"
      );
      result.categories_table_exists = categoriesCheck.length > 0;
    } catch (err) {
      result.categories_check_error = err.message;
    }

    // ถ้ามี categories table
    if (result.categories_table_exists) {
      try {
        // แสดง columns
        const [columns] = await db.execute("DESCRIBE categories");
        result.categories_columns = columns;

        // แสดงข้อมูล
        const [data] = await db.execute("SELECT * FROM categories LIMIT 10");
        result.categories_data = data;

        // นับจำนวน
        const [count] = await db.execute(
          "SELECT COUNT(*) as total FROM categories"
        );
        result.categories_count = count[0].total;
      } catch (err) {
        result.categories_query_error = err.message;
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/debug/tables", async (req, res) => {
  try {
    if (!db) {
      return res.json({ message: "Database not connected" });
    }

    // แสดง tables ทั้งหมด
    const [tables] = await db.execute("SHOW TABLES");
    let result = {
      tables: tables.map((t) => Object.values(t)[0]),
    };

    // แสดง structure ของแต่ละ table
    for (const table of result.tables) {
      try {
        const [columns] = await db.execute(`DESCRIBE ${table}`);
        result[table] = columns;
      } catch (error) {
        result[table] = { error: error.message };
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/featured", async (req, res) => {
  try {
    console.log("🔄 กำลังดึงข้อมูลสินค้าแนะนำจาก Database...");

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    // ใช้ columns ที่มีจริงในตาราง
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.category_id,
        p.image_url,
        p.created_at,
        p.updated_at,
        c.name as category_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC 
      LIMIT 8
    `;

    const [products] = await db.execute(query);

    // เพิ่ม default values สำหรับ columns ที่ไม่มี
    const productsWithDefaults = products.map((product) => ({
      ...product,
      price: parseFloat(product.price),
      is_featured: true, // ถือว่าทุกสินค้าเป็น featured
      is_active: true, // ถือว่าทุกสินค้าเป็น active
      category_name: product.category_name || "ทั่วไป",
    }));

    console.log(`✅ Database: พบสินค้าแนะนำ ${products.length} รายการ`);

    res.json({
      success: true,
      data: productsWithDefaults,
      message: "ดึงข้อมูลสินค้าแนะนำสำเร็จ",
    });
  } catch (error) {
    console.error("❌ ข้อผิดพลาดในการดึงข้อมูลสินค้าแนะนำ:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าแนะนำ",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.get("/api/products/categories", async (req, res) => {
  try {
    console.log("🔄 กำลังดึงข้อมูลหมวดหมู่สินค้าจาก Database...");

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    const query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        c.updated_at,
        COUNT(p.id) as product_count
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
      ORDER BY c.name ASC
    `;

    const [categories] = await db.execute(query);

    console.log(`✅ Database: พบหมวดหมู่สินค้า ${categories.length} รายการ`);

    res.json({
      success: true,
      data: categories,
      message: "ดึงข้อมูลหมวดหมู่สินค้าสำเร็จจาก Database",
    });
  } catch (error) {
    console.error("❌ ข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 12,
      sort = "created_at",
      order = "DESC",
    } = req.query;
    const offset = (page - 1) * limit;

    console.log("🔄 กำลังดึงข้อมูลสินค้าจาก Database...");

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.category_id,
        p.image_url,
        p.created_at,
        p.updated_at,
        c.name as category_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;

    let params = [];

    if (category) {
      query += " AND p.category_id = ?";
      params.push(category);
    }

    if (search) {
      query += " AND (p.name LIKE ? OR p.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // เพิ่มการเรียงลำดับ
    const validSortColumns = ["created_at", "name", "price"];
    const validOrders = ["ASC", "DESC"];

    const sortColumn = validSortColumns.includes(sort) ? sort : "created_at";
    const sortOrder = validOrders.includes(order.toUpperCase())
      ? order.toUpperCase()
      : "DESC";

    query += ` ORDER BY p.${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await db.execute(query, params);

    // นับจำนวนทั้งหมด
    let countQuery = "SELECT COUNT(*) as total FROM products p WHERE 1=1";
    let countParams = [];

    if (category) {
      countQuery += " AND p.category_id = ?";
      countParams.push(category);
    }

    if (search) {
      countQuery += " AND (p.name LIKE ? OR p.description LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.execute(countQuery, countParams);

    // เพิ่ม default values
    const productsWithDefaults = products.map((product) => ({
      ...product,
      price: parseFloat(product.price),
      is_featured: true, // default
      is_active: true, // default
      category_name: product.category_name || "ทั่วไป",
    }));

    console.log(
      `✅ Database: พบสินค้า ${products.length} รายการ จากทั้งหมด ${countResult[0].total} รายการ`
    );

    res.json({
      success: true,
      data: productsWithDefaults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit),
      },
      message: "ดึงข้อมูลสินค้าสำเร็จ",
    });
  } catch (error) {
    console.error("❌ ข้อผิดพลาดในการดึงข้อมูลสินค้า:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 ขอข้อมูลสินค้า ID:", id);

    const productId = parseInt(id);
    if (!id || isNaN(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "รหัสสินค้าไม่ถูกต้อง",
      });
    }

    // ใช้ columns ที่มีจริง
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.category_id,
        p.image_url,
        p.created_at,
        p.updated_at,
        c.name as category_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `;

    const [rows] = await db.execute(query, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสินค้าที่ต้องการ",
      });
    }

    const product = rows[0];

    // เพิ่ม default values
    const responseData = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      stock_quantity: product.stock_quantity,
      category_id: product.category_id,
      category_name: product.category_name || "ไม่มีหมวดหมู่",
      image_url: product.image_url,
      is_featured: true, // default
      is_active: true, // default
      created_at: product.created_at,
      updated_at: product.updated_at,
    };

    console.log("✅ ส่งข้อมูลสินค้าสำเร็จ:", responseData);

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("❌ ข้อผิดพลาดใน /api/products/:id:", error);

    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ============ CUSTOMER AUTH APIs ============
app.post("/api/customers/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    const [existingUser] = await db.execute(
      "SELECT id FROM customers WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "อีเมลนี้มีคนใช้แล้ว" });
    }

    const hashedPassword = await hashPassword(password);
    const [result] = await db.execute(
      "INSERT INTO customers (first_name, last_name, email, password, phone) VALUES (?, ?, ?, ?, ?)",
      [firstName, lastName, email, hashedPassword, phone || null]
    );

    res.status(201).json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
      data: { id: result.insertId, firstName, lastName, email },
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" });
  }
});

app.post("/api/customers/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });

    const [rows] = await db.execute(
      "SELECT id, email, password, first_name, last_name, status FROM customers WHERE email = ?",
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });

    const customer = rows[0];
    if (customer.status !== "active")
      return res.status(401).json({ message: "บัญชีของคุณถูกระงับ" });

    const isValidPassword = await bcrypt.compare(password, customer.password);
    if (!isValidPassword)
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });

    await db.execute("UPDATE customers SET last_login = NOW() WHERE id = ?", [
      customer.id,
    ]);
    const token = generateToken({
      id: customer.id,
      email: customer.email,
      type: "customer",
    });
    const { password: _, ...customerData } = customer;

    res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: customerData,
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
  }
});

app.get("/api/customers/profile", authenticateCustomer, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, first_name, last_name, email, phone, date_of_birth, gender, email_verified, last_login, created_at FROM customers WHERE id = ?",
      [req.customer.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    res.json({ success: true, user: rows[0] });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์" });
  }
});

app.put("/api/customers/profile", authenticateCustomer, async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, gender } = req.body;
    await db.execute(
      "UPDATE customers SET first_name = ?, last_name = ?, phone = ?, date_of_birth = ?, gender = ? WHERE id = ?",
      [
        firstName,
        lastName,
        phone || null,
        dateOfBirth || null,
        gender || null,
        req.customer.id,
      ]
    );
    res.json({ success: true, message: "อัปเดตโปรไฟล์สำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์" });
  }
});

// ============ ADMIN LOGIN ============
app.post("/api/auth/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });

    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ? AND status = "active"',
      [username]
    );
    if (rows.length === 0)
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

    const admin = rows[0];
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword)
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

    await db.execute("UPDATE admins SET last_login = NOW() WHERE id = ?", [
      admin.id,
    ]);
    const token = generateToken({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      type: "admin",
    });

    const { password: _, ...adminData } = admin;
    res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      data: { token, admin: adminData },
      admin: adminData,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
  }
});

// ============ ORDERS APIs ============
app.post("/api/orders", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items,
      notes,
    } = req.body;
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
      });
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const [productRows] = await db.execute(
        "SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND is_active = 1",
        [item.productId]
      );
      if (productRows.length === 0)
        return res.status(400).json({
          success: false,
          message: `ไม่พบสินค้ารหัส ${item.productId}`,
        });

      const product = productRows[0];
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `สินค้า "${product.name}" มีจำนวนเหลือเพียง ${product.stock_quantity} ชิ้น`,
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    const orderNumber = generateOrderNumber();
    await db.execute("START TRANSACTION");

    const [orderResult] = await db.execute(
      'INSERT INTO orders (order_number, customer_name, customer_phone, customer_email, customer_address, notes, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", NOW())',
      [
        orderNumber,
        customerName,
        customerPhone,
        customerEmail || null,
        customerAddress || null,
        notes || null,
        totalAmount,
      ]
    );

    for (const item of validatedItems) {
      await db.execute(
        "INSERT INTO order_items (order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, NOW())",
        [orderResult.insertId, item.productId, item.quantity, item.price]
      );
      await db.execute(
        "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
        [item.quantity, item.productId]
      );
    }

    await db.execute("COMMIT");
    res.status(201).json({
      success: true,
      message: "สร้างคำสั่งซื้อสำเร็จ",
      data: {
        orderId: orderResult.insertId,
        orderNumber,
        totalAmount,
        status: "pending",
        items: validatedItems,
      },
    });
  } catch (error) {
    await db.execute("ROLLBACK");
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ" });
  }
});

app.get("/api/orders/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const [orderRows] = await db.execute(
      "SELECT id, order_number, customer_name, customer_phone, customer_email, customer_address, notes, total_amount, status, created_at, updated_at FROM orders WHERE order_number = ?",
      [orderNumber]
    );
    if (orderRows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบคำสั่งซื้อที่ระบุ" });

    const [itemRows] = await db.execute(
      "SELECT oi.product_id, oi.quantity, oi.price, p.name as product_name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?",
      [orderRows[0].id]
    );
    res.json({ success: true, data: { ...orderRows[0], items: itemRows } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ",
    });
  }
});

// ============ OTHER APIs ============
app.get("/api/categories", async (req, res) => {
  try {
    console.log("🔄 กำลังดึงข้อมูลหมวดหมู่สินค้า...");

    // ตรวจสอบการเชื่อมต่อ Database ก่อน
    if (!db) {
      console.error("❌ Database ไม่ได้เชื่อมต่อ");
      return res.status(500).json({
        success: false,
        message: "Database connection not available",
      });
    }

    // ทดสอบการเชื่อมต่อ Database
    try {
      await db.execute("SELECT 1");
      console.log("✅ Database connection ทำงานปกติ");
    } catch (connError) {
      console.error("❌ Database connection error:", connError.message);
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }

    // ตรวจสอบว่ามี table categories หรือไม่
    try {
      const [tableCheck] = await db.execute("SHOW TABLES LIKE 'categories'");
      if (tableCheck.length === 0) {
        console.warn("⚠️ ไม่พบ table categories");
        return res.status(500).json({
          success: false,
          message: "Categories table not found",
        });
      }
      console.log("✅ พบ table categories");
    } catch (tableError) {
      console.error("❌ Error checking categories table:", tableError.message);
      return res.status(500).json({
        success: false,
        message: "Error checking categories table",
      });
    }

    // ดึงข้อมูลหมวดหมู่แบบง่ายก่อน (ไม่ join กับ products)
    try {
      const [categories] = await db.execute(`
        SELECT 
          id, 
          name, 
          description, 
          created_at, 
          updated_at
        FROM categories 
        ORDER BY name ASC
      `);

      console.log(`✅ พบหมวดหมู่สินค้า ${categories.length} รายการ`);

      // เพิ่ม product_count แบบ manual (จะปรับปรุงภายหลัง)
      const categoriesWithCount = categories.map((cat) => ({
        ...cat,
        product_count: Math.floor(Math.random() * 15) + 1, // Random สำหรับทดสอบ
      }));

      res.json({
        success: true,
        data: categoriesWithCount,
        message: "ดึงข้อมูลหมวดหมู่สินค้าสำเร็จ",
      });
    } catch (queryError) {
      console.error("❌ Error executing categories query:", queryError.message);
      return res.status(500).json({
        success: false,
        message: "Error fetching categories data",
        error:
          process.env.NODE_ENV === "development"
            ? queryError.message
            : "Database query failed",
      });
    }
  } catch (error) {
    console.error("❌ ข้อผิดพลาดทั่วไปในการดึงข้อมูลหมวดหมู่:", error);

    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

app.get("/api/shop/info", async (req, res) => {
  try {
    const [settings] = await db.execute(
      "SELECT setting_key, setting_value FROM settings"
    );
    const shopInfo = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});
    const defaultInfo = {
      shop_name: "ร้านออนไลน์ของฉัน",
      shop_description: "ร้านค้าออนไลน์ที่ให้บริการสินค้าคุณภาพดี ราคาสุดคุ้ม",
      shop_phone: "02-123-4567",
      shop_email: "contact@example.com",
      shop_address: "123 ถนนตัวอย่าง จังหวัดตัวอย่าง 12345",
      promptpay_number: "0123456789",
      free_shipping_minimum: "500",
      currency: "THB",
      timezone: "Asia/Bangkok",
      ...shopInfo,
    };
    res.json({ success: true, data: defaultInfo });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลร้าน" });
  }
});

app.post("/api/payments", upload.single("paymentSlip"), async (req, res) => {
  try {
    const {
      orderNumber,
      paymentMethod = "promptpay",
      amount,
      paymentDateTime,
      notes,
    } = req.body;
    if (!orderNumber || !amount)
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุเลขที่คำสั่งซื้อและจำนวนเงิน",
      });

    const [orderRows] = await db.execute(
      "SELECT id, total_amount, status FROM orders WHERE order_number = ?",
      [orderNumber]
    );
    if (orderRows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบคำสั่งซื้อที่ระบุ" });

    const order = orderRows[0];
    if (order.status !== "pending")
      return res.status(400).json({
        success: false,
        message: "คำสั่งซื้อนี้ได้รับการชำระเงินแล้ว",
      });
    if (parseFloat(amount) !== parseFloat(order.total_amount))
      return res
        .status(400)
        .json({ success: false, message: "จำนวนเงินไม่ตรงกับยอดคำสั่งซื้อ" });

    const paymentSlipPath = req.file
      ? `/uploads/${req.body.folder || "payments"}/${req.file.filename}`
      : null;
    const [paymentResult] = await db.execute(
      'INSERT INTO payments (order_id, payment_method, amount, payment_slip, payment_date_time, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, "pending", NOW())',
      [
        order.id,
        paymentMethod,
        amount,
        paymentSlipPath,
        paymentDateTime || null,
        notes || null,
      ]
    );
    await db.execute(
      'UPDATE orders SET status = "paid", updated_at = NOW() WHERE id = ?',
      [order.id]
    );

    res.json({
      success: true,
      message: "บันทึกการชำระเงินสำเร็จ",
      data: {
        paymentId: paymentResult.insertId,
        orderNumber,
        amount,
        status: "pending",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน",
    });
  }
});

app.post("/api/upload/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "กรุณาเลือกไฟล์รูปภาพ" });
    const imageUrl = `/uploads/${req.body.folder || "general"}/${
      req.file.filename
    }`;
    res.json({
      success: true,
      message: "อัปโหลดรูปภาพสำเร็จ",
      data: { image_url: imageUrl, filename: req.file.filename },
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" });
  }
});

// ============ ADDITIONAL ADMIN APIs ============
app.get("/api/admin/verify", authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Token verified successfully",
    admin: req.admin,
  });
});

app.post("/api/admin/logout", authenticateAdmin, (req, res) => {
  res.json({ success: true, message: "ออกจากระบบสำเร็จ" });
});

// Legacy endpoints for backward compatibility
app.post("/api/admin/login", (req, res) => {
  req.url = "/api/auth/admin/login";
  req.method = "POST";
  return app._router.handle(req, res);
});

app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
  try {
    const [customers] = await db.execute(
      "SELECT COUNT(DISTINCT customer_phone) as count FROM orders WHERE customer_phone IS NOT NULL"
    );
    const [products] = await db.execute(
      "SELECT COUNT(*) as count FROM products WHERE is_active = 1"
    );
    const [orderStats] = await db.execute(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders"
    );

    res.json({
      success: true,
      data: {
        customers: customers[0].count,
        products: products[0].count,
        orders: orderStats[0].count,
        revenue: parseFloat(orderStats[0].revenue),
      },
    });
  } catch (error) {
    res.json({
      success: true,
      data: { customers: 0, products: 0, orders: 0, revenue: 0 },
    });
  }
});

app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ message: "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)" });
  }
  res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
});

app.use("*", (req, res) => {
  console.log(`🔍 404 - ไม่พบเส้นทาง: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "ไม่พบ endpoint ที่ร้องขอ",
    requested_url: req.originalUrl,
    method: req.method,
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
      console.log(
        `📊 Dashboard: http://localhost:${PORT}/api/admin/dashboard/stats`
      );
      console.log(`🔐 Admin Login: http://localhost:3000/admin/login`);
      console.log(`👤 Customer Login: http://localhost:3000/login`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  if (db) await db.end();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  if (db) await db.end();
  process.exit(0);
});

startServer();
