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

// Get single product by ID
exports.getProduct = async (req, res) => {
  let connection;

  try {
    const productId = req.params.id;

    // Validate product ID
    if (!productId || isNaN(productId) || parseInt(productId) <= 0) {
      return res.status(400).json({
        success: false,
        message: "รหัสสินค้าไม่ถูกต้อง",
      });
    }

    connection = await mysql.createConnection(dbConfig);

    // Get product with category info
    const [products] = await connection.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = 1`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสินค้าที่ต้องการ",
      });
    }

    const product = products[0];

    console.log(`✅ ดึงข้อมูลสินค้า ID: ${productId} สำเร็จ`);

    res.json({
      success: true,
      data: product,
      message: "ดึงข้อมูลสินค้าสำเร็จ",
    });
  } catch (error) {
    console.error("❌ Error getting product:", error);
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

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    // Get featured products (is_featured = 1 หรือ ใช้ criteria อื่น)
    const [products] = await connection.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT 8`
    );

    console.log(`✅ ดึงข้อมูลสินค้าแนะนำสำเร็จ: ${products.length} รายการ`);

    res.json({
      success: true,
      data: products,
      message: "ดึงข้อมูลสินค้าแนะนำสำเร็จ",
    });
  } catch (error) {
    console.error("❌ Error getting featured products:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าแนะนำ",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

exports.updateProduct = async (req, res) => {
  const uploadSingle = upload.single("image");

  uploadSingle(req, res, async (uploadError) => {
    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return res.status(400).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
        error: uploadError.message,
      });
    }

    let connection;

    try {
      const productId = req.params.id;
      const {
        name,
        description,
        price,
        stock_quantity,
        category_id,
        is_active,
      } = req.body;

      if (!name || !price || stock_quantity === undefined) {
        return res.status(400).json({
          success: false,
          message: "กรุณากรอกข้อมูลที่จำเป็น",
        });
      }

      connection = await mysql.createConnection(dbConfig);

      const [existing] = await connection.execute(
        "SELECT id, image_url FROM products WHERE id = ?",
        [productId]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "ไม่พบสินค้าที่ต้องการแก้ไข",
        });
      }

      let finalImageUrl = existing[0].image_url;

      if (req.file) {
        console.log("📷 ไฟล์ที่อัปโหลด:", {
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
        });

        if (existing[0].image_url) {
          const oldImagePath = path.join(
            __dirname,
            "..",
            "uploads",
            "products",
            path.basename(existing[0].image_url)
          );

          console.log("🔍 ตรวจสอบรูปเดิม:", oldImagePath);

          if (fs.existsSync(oldImagePath)) {
            try {
              fs.unlinkSync(oldImagePath);
              console.log("🗑️ ลบรูปเดิมแล้ว:", oldImagePath);
            } catch (deleteError) {
              console.warn("⚠️ ไม่สามารถลบรูปเดิมได้:", deleteError.message);
            }
          }
        }

        finalImageUrl = `/uploads/products/${req.file.filename}`;
        console.log("📷 อัปโหลดรูปใหม่สำเร็จ:", finalImageUrl);
      }

      // Update product
      const [updateResult] = await connection.execute(
        `UPDATE products 
         SET name = ?, description = ?, price = ?, stock_quantity = ?, 
             category_id = ?, is_active = ?, image_url = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          name.trim(),
          description ? description.trim() : null,
          parseFloat(price),
          parseInt(stock_quantity),
          category_id || null,
          is_active ? 1 : 0,
          finalImageUrl,
          productId,
        ]
      );

      console.log(`✅ อัปเดตสินค้า ID: ${productId} สำเร็จ`, {
        name: name.trim(),
        image_url: finalImageUrl,
        affectedRows: updateResult.affectedRows,
      });

      const [updatedProduct] = await connection.execute(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [productId]
      );

      res.json({
        success: true,
        message: "แก้ไขสินค้าสำเร็จ",
        data: updatedProduct[0],
      });
    } catch (error) {
      console.error("❌ Error updating product:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการแก้ไขสินค้า",
        error: error.message,
      });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  });
};

exports.updateProductStatus = async (req, res) => {
  let connection;

  try {
    const productId = req.params.id;
    const { is_active } = req.body;

    connection = await mysql.createConnection(dbConfig);

    // Check if product exists
    const [existing] = await connection.execute(
      "SELECT id, name FROM products WHERE id = ?",
      [productId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสินค้าที่ต้องการแก้ไข",
      });
    }

    let image_url = existing[0].image_url; // เก็บรูปเดิม
    if (req.file) {
      // ลบรูปเดิม (ถ้ามี)
      if (existing[0].image_url) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "uploads",
          "products",
          path.basename(existing[0].image_url)
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log("🗑️ ลบรูปเดิมแล้ว:", oldImagePath);
        }
      }

      // ใช้รูปใหม่
      image_url = `/uploads/products/${req.file.filename}`;
      console.log("📷 อัปโหลดรูปใหม่สำเร็จ:", image_url);
    }

    // Update status
    await connection.execute(
      "UPDATE products SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [is_active ? 1 : 0, productId]
    );

    const action = is_active ? "เปิดใช้งาน" : "ปิดใช้งาน";
    console.log(`✅ ${action}สินค้า "${existing[0].name}" สำเร็จ`);

    res.json({
      success: true,
      message: `${action}สินค้าสำเร็จ`,
    });
  } catch (error) {
    console.error("❌ Error updating product status:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะสินค้า",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ✅ Delete product
exports.deleteProduct = async (req, res) => {
  let connection;

  try {
    const productId = req.params.id;

    connection = await mysql.createConnection(dbConfig);

    // Check if product exists
    const [existing] = await connection.execute(
      "SELECT id, name FROM products WHERE id = ?",
      [productId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสินค้าที่ต้องการลบ",
      });
    }

    // Check if product is in any orders
    const [orders] = await connection.execute(
      "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?",
      [productId]
    );

    if (orders[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "ไม่สามารถลบสินค้าได้ เนื่องจากมีการสั่งซื้อแล้ว",
      });
    }

    // Delete product
    await connection.execute("DELETE FROM products WHERE id = ?", [productId]);

    console.log(`✅ ลบสินค้า "${existing[0].name}" สำเร็จ`);

    res.json({
      success: true,
      message: "ลบสินค้าสำเร็จ",
    });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบสินค้า",
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
  const uploadSingle = upload.single("image");

  uploadSingle(req, res, async (uploadError) => {
    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return res.status(400).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
        error: uploadError.message,
      });
    }
    let connection;

    try {
      const {
        name,
        description,
        price,
        stock_quantity,
        category_id,
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

      // Insert product
      const [result] = await connection.execute(
        `INSERT INTO products (
    name, description, price, stock_quantity, category_id, 
    image_url, is_active, created_at, updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          name.trim(),
          description ? description.trim() : null,
          parseFloat(price),
          parseInt(stock_quantity),
          category_id || null,
          image_url,
          parseInt(is_active),
        ]
      );

      console.log(`✅ สร้างสินค้าใหม่สำเร็จ ID: ${result.insertId}`);

      const [newProduct] = await connection.execute(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        data: newProduct[0],
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
  });
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
