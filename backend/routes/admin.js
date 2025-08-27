const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'online_shop',
  charset: 'utf8mb4'
};

// Get all settings
router.get('/settings', authenticateAdmin, async (req, res) => {
  let connection;
  
  try {
    console.log('📊 GET Settings - Admin ID:', req.admin.id);
    
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT setting_key, setting_value, updated_at FROM settings ORDER BY setting_key ASC'
    );
    
    console.log(`✅ Settings retrieved: ${rows.length} items`);
    
    res.json(rows);
    
  } catch (error) {
    console.error('❌ GET Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงการตั้งค่า',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
});

// Update settings
router.put('/settings', async (req, res) => {
  let connection;
  
  try {
    console.log('🔄 อัปเดตการตั้งค่า:', req.body);
    
    const {
      shop_name,
      promptpay_number,
      shop_address,
      shop_phone,
      shop_email
    } = req.body;
    
    // Validate required fields
    if (!shop_name || !promptpay_number) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุชื่อร้านและหมายเลข PromptPay'
      });
    }
    
    // Validate PromptPay number format
    const promptPayRegex = /^(\d{10}|\d{13})$/;
    if (!promptPayRegex.test(promptpay_number)) {
      return res.status(400).json({
        success: false,
        message: 'หมายเลข PromptPay ต้องเป็นเบอร์โทร (10 หลัก) หรือเลขบัตรประชาชน (13 หลัก)'
      });
    }
    
    connection = await mysql.createConnection(dbConfig);
    
    // Start transaction
    await connection.beginTransaction();
    
    const settingsToUpdate = {
      shop_name,
      promptpay_number,
      shop_address: shop_address || '',
      shop_phone: shop_phone || '',
      shop_email: shop_email || ''
    };
    
    const updatePromises = Object.entries(settingsToUpdate).map(async ([key, value]) => {
      const [result] = await connection.execute(`
        INSERT INTO settings (setting_key, setting_value, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
          setting_value = VALUES(setting_value),
          updated_at = NOW()
      `, [key, value]);
      
      console.log(`✅ อัปเดต ${key}: ${value}`);
      return result;
    });
    
    // Execute all updates
    await Promise.all(updatePromises);
    
    // Commit transaction
    await connection.commit();
    
    // Fetch updated settings
    const [updatedRows] = await connection.execute(`
      SELECT setting_key, setting_value, updated_at 
      FROM settings 
      WHERE setting_key IN (?, ?, ?, ?, ?)
      ORDER BY setting_key ASC
    `, ['shop_name', 'promptpay_number', 'shop_address', 'shop_phone', 'shop_email']);
    
    console.log('✅ อัปเดตการตั้งค่าสำเร็จทั้งหมด');
    
    res.json({
      success: true,
      data: updatedRows,
      message: 'อัปเดตการตั้งค่าเรียบร้อยแล้ว',
      updated_count: updatedRows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      try {
        await connection.rollback();
        console.log('↩️ Rollback transaction เสร็จสิ้น');
      } catch (rollbackError) {
        console.error('❌ ข้อผิดพลาดในการ rollback:', rollbackError);
      }
    }
    
    console.error('❌ ข้อผิดพลาดในการอัปเดตการตั้งค่า:', error);
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Get specific setting by key
router.get('/settings/:key', async (req, res) => {
  let connection;
  
  try {
    const { key } = req.params;
    console.log(`📊 ดึงการตั้งค่า: ${key}`);
    
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(`
      SELECT setting_key, setting_value, created_at, updated_at 
      FROM settings 
      WHERE setting_key = ?
    `, [key]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบการตั้งค่า: ${key}`
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: 'ดึงการตั้งค่าสำเร็จ'
    });
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการดึงการตั้งค่า:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงการตั้งค่า',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Delete setting
router.delete('/settings/:key', async (req, res) => {
  let connection;
  
  try {
    const { key } = req.params;
    console.log(`🗑️ ลบการตั้งค่า: ${key}`);
    
    // Prevent deletion of critical settings
    const criticalSettings = ['shop_name', 'promptpay_number'];
    if (criticalSettings.includes(key)) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบการตั้งค่าสำคัญนี้ได้'
      });
    }
    
    connection = await mysql.createConnection(dbConfig);
    
    const [result] = await connection.execute(`
      DELETE FROM settings WHERE setting_key = ?
    `, [key]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบการตั้งค่า: ${key}`
      });
    }
    
    console.log(`✅ ลบการตั้งค่า ${key} สำเร็จ`);
    
    res.json({
      success: true,
      message: `ลบการตั้งค่า ${key} เรียบร้อยแล้ว`,
      deleted_key: key
    });
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการลบการตั้งค่า:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบการตั้งค่า',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Get settings history/audit log (if you want to track changes)
router.get('/settings-history', async (req, res) => {
  let connection;
  
  try {
    console.log('📊 ดึงประวัติการเปลี่ยนแปลงการตั้งค่า...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Create settings_history table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_by VARCHAR(100),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
        INDEX idx_settings_history_key (setting_key),
        INDEX idx_settings_history_date (changed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    const [rows] = await connection.execute(`
      SELECT setting_key, old_value, new_value, changed_by, changed_at, action
      FROM settings_history 
      ORDER BY changed_at DESC 
      LIMIT 100
    `);
    
    res.json({
      success: true,
      data: rows,
      message: 'ดึงประวัติการเปลี่ยนแปลงสำเร็จ'
    });
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการดึงประวัติ:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติการเปลี่ยนแปลง',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// GET /api/admin/dashboard/stats - Dashboard statistics with real data
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  let connection;
  
  try {
    console.log('📊 GET Dashboard Stats - Admin ID:', req.admin.id);
    
    connection = await mysql.createConnection(dbConfig);
    
    // Get basic stats
    const [customerCount] = await connection.execute('SELECT COUNT(*) as count FROM customers WHERE status = "active"');
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
    const [orderStats] = await connection.execute('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders');
    
    const stats = {
      total_customers: customerCount[0].count,
      total_products: productCount[0].count, 
      total_orders: orderStats[0].count,
      total_revenue: parseFloat(orderStats[0].revenue)
    };
    
    console.log('✅ Dashboard stats retrieved:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถิติ',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// GET /api/admin/orders/recent - Recent orders
router.get('/orders/recent', authenticateAdmin, async (req, res) => {
  let connection;
  
  try {
    console.log('📊 GET Recent Orders - Admin ID:', req.admin.id);
    
    connection = await mysql.createConnection(dbConfig);
    
    const [orders] = await connection.execute(`
      SELECT id, order_number, customer_name, total_amount, status, created_at, updated_at
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`✅ Recent orders retrieved: ${orders.length} items`);
    res.json(orders);
    
  } catch (error) {
    console.error('❌ Recent orders error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงคำสั่งซื้อ',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// GET /api/admin/products/top - Top selling products
router.get('/products/top', authenticateAdmin, async (req, res) => {
  let connection;
  
  try {
    console.log('📊 GET Top Products - Admin ID:', req.admin.id);
    
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
    res.json(products);
    
  } catch (error) {
    console.error('❌ Top products error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสินค้า',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// GET /api/admin/settings - Get all settings
router.put('/settings', authenticateAdmin, async (req, res) => {
  let connection;
  
  try {
    console.log('🔄 PUT Settings - Admin ID:', req.admin.id);
    console.log('🔄 Request Body:', req.body);
    
    const {
      shop_name,
      promptpay_number,
      shop_address,
      shop_phone,
      shop_email
    } = req.body;
    
    // Basic validation
    if (!shop_name || shop_name.trim() === '') {
      console.log('❌ Validation failed: shop_name is required');
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุชื่อร้าน'
      });
    }
    
    if (!promptpay_number || promptpay_number.trim() === '') {
      console.log('❌ Validation failed: promptpay_number is required');
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุหมายเลข PromptPay'
      });
    }
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected');
    
    // Update settings one by one with simple approach
    const settings = [
      { key: 'shop_name', value: shop_name.trim() },
      { key: 'promptpay_number', value: promptpay_number.trim() },
      { key: 'shop_address', value: (shop_address || '').trim() },
      { key: 'shop_phone', value: (shop_phone || '').trim() },
      { key: 'shop_email', value: (shop_email || '').trim() }
    ];
    
    console.log('🔄 Updating settings...');
    
    for (const setting of settings) {
      try {
        console.log(`Updating ${setting.key} = ${setting.value}`);
        
        // Check if setting exists
        const [existing] = await connection.execute(
          'SELECT id FROM settings WHERE setting_key = ?',
          [setting.key]
        );
        
        if (existing.length > 0) {
          // Update existing
          await connection.execute(
            'UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
            [setting.value, setting.key]
          );
          console.log(`✅ Updated ${setting.key}`);
        } else {
          // Insert new
          await connection.execute(
            'INSERT INTO settings (setting_key, setting_value, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
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
    console.log('📊 Fetching updated settings...');
    const [updatedRows] = await connection.execute(
      `SELECT setting_key, setting_value, updated_at 
       FROM settings 
       WHERE setting_key IN ('shop_name', 'promptpay_number', 'shop_address', 'shop_phone', 'shop_email')
       ORDER BY setting_key ASC`
    );
    
    console.log('✅ Settings updated successfully');
    
    res.json({
      success: true,
      message: 'อัปเดตการตั้งค่าเรียบร้อยแล้ว',
      data: updatedRows,
      updated_count: updatedRows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ PUT Settings Error:', {
      message: error.message,
      stack: error.stack,
      adminId: req.admin?.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('📪 Database connection closed');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
});

module.exports = router;