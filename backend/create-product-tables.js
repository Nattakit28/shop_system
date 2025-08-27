#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'online_shop',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4'
};

async function createProductTables() {
  let connection;
  
  try {
    console.log('🏗️  Creating product tables...');
    console.log('📊 Database config:', { 
      host: dbConfig.host, 
      user: dbConfig.user, 
      database: dbConfig.database,
      port: dbConfig.port 
    });

    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Create categories table
    console.log('\n📂 Creating categories table...');
    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50) DEFAULT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createCategoriesTable);
    console.log('✅ Categories table created successfully');

    // Create products table
    console.log('\n📦 Creating products table...');
    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2) DEFAULT NULL,
        stock_quantity INT DEFAULT 0,
        category_id INT DEFAULT NULL,
        sku VARCHAR(100) UNIQUE DEFAULT NULL,
        images JSON DEFAULT NULL,
        featured BOOLEAN DEFAULT FALSE,
        status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
        weight DECIMAL(8, 2) DEFAULT NULL,
        dimensions VARCHAR(100) DEFAULT NULL,
        tags JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_category (category_id),
        INDEX idx_status (status),
        INDEX idx_featured (featured),
        INDEX idx_price (price),
        INDEX idx_name (name),
        INDEX idx_sku (sku)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createProductsTable);
    console.log('✅ Products table created successfully');

    // Insert sample categories
    console.log('\n📝 Inserting sample categories...');
    const sampleCategories = [
      ['เสื้อผ้า', 'เสื้อผ้าและแฟชั่น', '👕'],
      ['อุปกรณ์บ้าน', 'ของใช้ในบ้านและของตะแต่ง', '🏠'],
      ['อาหารและเครื่องดื่ม', 'อาหาร เครื่องดื่ม และขนม', '🍽️'],
      ['อิเล็กทรอนิกส์', 'อุปกรณ์อิเล็กทรอนิกส์และแกดเจ็ต', '📱'],
      ['หนังสือและสื่อ', 'หนังสือ นิตยสาร และสื่อการเรียนรู้', '📚']
    ];

    for (const [name, description, icon] of sampleCategories) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)',
          [name, description, icon]
        );
        console.log(`  ✓ Added category: ${name}`);
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          console.error(`  ❌ Failed to add category ${name}:`, error.message);
        }
      }
    }

    // Insert sample products
    console.log('\n📝 Inserting sample products...');
    const sampleProducts = [
      {
        name: 'เสื้อยืดคอตต้อน 100%',
        description: 'เสื้อยืดคอตต้อนแท้ 100% นุ่มสบาย ระบายอากาศดี เหมาะสำหรับใส่ในชีวิตประจำวัน',
        price: 299.00,
        original_price: 399.00,
        stock_quantity: 50,
        category_id: 1,
        sku: 'SHIRT-001',
        featured: true,
        status: 'active'
      },
      {
        name: 'หมวกแก๊ปผ้ายีนส์',
        description: 'หมวกแก๊ปผ้ายีนส์คุณภาพดี ป้องกันแสงแดด ใส่สบาย เท่ห์ได้ทุกโอกาส',
        price: 199.00,
        original_price: null,
        stock_quantity: 30,
        category_id: 1,
        sku: 'HAT-001',
        featured: true,
        status: 'active'
      },
      {
        name: 'หลอดไฟ LED ประหยัดไฟ',
        description: 'หลอดไฟ LED ประหยัดไฟ 80% แสงสว่างนุ่มตา อายุการใช้งานยาวนาน',
        price: 89.00,
        original_price: 129.00,
        stock_quantity: 100,
        category_id: 2,
        sku: 'LED-001',
        featured: true,
        status: 'active'
      },
      {
        name: 'กาแฟคั่วเมล็ด แอราบิก้า',
        description: 'เมล็ดกาแฟแอราบิก้าคั่วสด หอมกรุ่น รสชาติเข้มข้น จากไร่กาแฟที่ระดับความสูง',
        price: 349.00,
        original_price: null,
        stock_quantity: 25,
        category_id: 3,
        sku: 'COFFEE-001',
        featured: false,
        status: 'active'
      },
      {
        name: 'สายชาร์จ USB-C ยาว 2 เมตร',
        description: 'สายชาร์จ USB-C คุณภาพสูง รองรับการชาร์จเร็ว ยาว 2 เมตร ใช้งานสะดวก',
        price: 159.00,
        original_price: 199.00,
        stock_quantity: 75,
        category_id: 4,
        sku: 'CABLE-001',
        featured: true,
        status: 'active'
      }
    ];

    for (const product of sampleProducts) {
      try {
        const [result] = await connection.execute(`
          INSERT IGNORE INTO products 
          (name, description, price, original_price, stock_quantity, category_id, sku, featured, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product.name,
          product.description,
          product.price,
          product.original_price,
          product.stock_quantity,
          product.category_id,
          product.sku,
          product.featured,
          product.status
        ]);
        
        if (result.affectedRows > 0) {
          console.log(`  ✓ Added product: ${product.name} (ID: ${result.insertId})`);
        }
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          console.error(`  ❌ Failed to add product ${product.name}:`, error.message);
        }
      }
    }

    // Verify data
    console.log('\n🔍 Verifying data...');
    
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    console.log(`📂 Categories count: ${categories[0].count}`);
    
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log(`📦 Products count: ${products[0].count}`);
    
    const [featuredProducts] = await connection.execute(
      'SELECT COUNT(*) as count FROM products WHERE featured = TRUE AND status = ?', 
      ['active']
    );
    console.log(`⭐ Featured products count: ${featuredProducts[0].count}`);

    // Show sample data
    console.log('\n📋 Sample categories:');
    const [categoryList] = await connection.execute(
      'SELECT id, name, description, icon FROM categories LIMIT 5'
    );
    categoryList.forEach(cat => {
      console.log(`  ${cat.icon} ${cat.name} (ID: ${cat.id})`);
    });

    console.log('\n📋 Sample products:');
    const [productList] = await connection.execute(`
      SELECT p.id, p.name, p.price, c.name as category_name, p.featured, p.status 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LIMIT 5
    `);
    productList.forEach(prod => {
      console.log(`  📦 ${prod.name} - ${prod.price}฿ (${prod.category_name}) ${prod.featured ? '⭐' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error creating product tables:', error.message);
    console.error('📍 Stack:', error.stack);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📪 Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  createProductTables()
    .then(() => {
      console.log('\n🎉 Product tables setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createProductTables };