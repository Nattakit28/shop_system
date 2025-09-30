const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Database configuration - ✅ แก้ไข config ให้ถูกต้อง
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "online_shop",
  charset: "utf8mb4",
  // ✅ ลบ config ที่ไม่รองรับใน mysql2
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// ✅ Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads", "products");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Get all products with pagination and filters
exports.getAllProducts = async (req, res) => {
  let connection;

  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      sort = "created_at",
      order = "DESC",
      status = "all",
    } = req.query;

    connection = await mysql.createConnection(dbConfig);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = "WHERE 1=1";
    const params = [];

    // Filter by category
    if (category && category !== "all") {
      whereClause += " AND p.category_id = ?";
      params.push(category);
    }

    // Search by name or description
    if (search) {
      whereClause += " AND (p.name LIKE ? OR p.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter by status
    if (status !== "all") {
      whereClause += " AND p.is_active = ?";
      params.push(status === "active" ? 1 : 0);
    }

    // Count total products
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       ${whereClause}`,
      params
    );

    // Get products with category info
    const [products] = await connection.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description,
        COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'confirmed', 'shipped', 'completed')
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const total = countResult[0].total;
    const pages = Math.ceil(total / parseInt(limit));

    console.log(`✅ ดึงข้อมูลสินค้าสำเร็จ: ${products.length} รายการ`);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: pages,
      },
    });
  } catch (error) {
    console.error("❌ Error getting products:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  let connection;

  try {
    const {
      name,
      description,
      price,
      stock_quantity,
      category_id,
      sku,
      features,
      is_active = 1,
    } = req.body;

    console.log("📝 ข้อมูลสินค้าที่ได้รับ:", req.body);

    // Validate required fields
    if (!name || !price || stock_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อสินค้า, ราคา, จำนวนสต็อก)",
      });
    }

    connection = await mysql.createConnection(dbConfig);

    // Handle image upload
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/products/${req.file.filename}`;
      console.log("📷 อัปโหลดรูปภาพสำเร็จ:", image_url);
    }

    // Parse features if it's a string
    let parsedFeatures = null;
    if (features) {
      try {
        parsedFeatures =
          typeof features === "string" ? JSON.parse(features) : features;
      } catch (error) {
        console.warn("⚠️ Features JSON ไม่ถูกต้อง:", features);
        parsedFeatures = features; // เก็บเป็น string ปกติ
      }
    }

    // Insert product
    const [result] = await connection.execute(
      `INSERT INTO products (
        name, description, price, stock_quantity, category_id, 
        sku, image_url, features, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name.trim(),
        description ? description.trim() : null,
        parseFloat(price),
        parseInt(stock_quantity),
        category_id || null,
        sku ? sku.trim() : null,
        image_url,
        parsedFeatures ? JSON.stringify(parsedFeatures) : null,
        parseInt(is_active),
      ]
    );

    console.log(`✅ สร้างสินค้าใหม่สำเร็จ ID: ${result.insertId}`);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name: name.trim(),
        price: parseFloat(price),
        stock_quantity: parseInt(stock_quantity),
        image_url,
      },
      message: "สร้างสินค้าสำเร็จ",
    });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างสินค้า",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [categories] = await connection.execute(
      `SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.name ASC`
    );

    console.log(`✅ ดึงข้อมูลหมวดหมู่สำเร็จ: ${categories.length} รายการ`);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("❌ Error getting categories:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Create category
exports.createCategory = async (req, res) => {
  let connection;

  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อหมวดหมู่",
      });
    }

    connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute(
      `INSERT INTO categories (name, description, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [name.trim(), description ? description.trim() : null]
    );

    console.log(`✅ สร้างหมวดหมู่ใหม่สำเร็จ ID: ${result.insertId}`);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name: name.trim(),
        description: description ? description.trim() : null,
        sort_order: parseInt(sort_order),
      },
      message: "สร้างหมวดหมู่สำเร็จ",
    });
  } catch (error) {
    console.error("❌ Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ✅ Export upload middleware
exports.upload = upload;
