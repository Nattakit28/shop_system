const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }
    
    // Get admin from database
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    const admin = rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        username: admin.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true,
      token,
      admin: { 
        id: admin.id, 
        username: admin.username 
      },
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
};

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    // Get order statistics
    const [orderStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN status IN ('confirmed', 'shipped', 'completed') THEN total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_orders
      FROM orders
    `);
    
    // Get product statistics
    const [productStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN stock_quantity <= 5 THEN 1 ELSE 0 END) as low_stock_products
      FROM products WHERE is_active = true
    `);
    
    // Get recent orders
    const [recentOrders] = await db.execute(`
      SELECT id, order_number, customer_name, total_amount, status, created_at
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    res.json({
      totalOrders: orderStats[0].total_orders || 0,
      pendingPayments: orderStats[0].pending_payments || 0,
      totalRevenue: parseFloat(orderStats[0].total_revenue) || 0,
      todayOrders: orderStats[0].today_orders || 0,
      totalProducts: productStats[0].total_products || 0,
      lowStockProducts: productStats[0].low_stock_products || 0,
      recentOrders: recentOrders
    });
    
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve statistics'
    });
  }
};

// Get all orders with filtering (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 20,
      startDate,
      endDate 
    } = req.query;
    
    let query = `
      SELECT 
        o.*,
        p.payment_slip,
        p.payment_date_time,
        p.status as payment_status,
        p.notes as payment_notes
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }
    
    if (startDate) {
      conditions.push('DATE(o.created_at) >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('DATE(o.created_at) <= ?');
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY o.created_at DESC';
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [orders] = await db.execute(query, params);
    
    // Get order items for each order
    for (let order of orders) {
      const [items] = await db.execute(`
        SELECT oi.*, p.name as product_name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
    }
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders o';
    const countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      // Remove pagination params for count query
      params.slice(0, -2).forEach(param => countParams.push(param));
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      orders,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve orders'
    });
  }
};

// Update order status (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'paid', 'confirmed', 'shipped', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: ' + validStatuses.join(', ')
      });
    }
    
    // Check if order exists
    const [orderRows] = await db.execute(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    
    if (orderRows.length === 0) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order does not exist'
      });
    }
    
    // Update order status
    await db.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    // If order is cancelled, restore stock
    if (status === 'cancelled') {
      const [orderItems] = await db.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );
      
      for (const item of orderItems) {
        await db.execute(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Order status updated successfully',
      orderId: id,
      newStatus: status
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update order status'
    });
  }
};

// Get all products (Admin)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error getting products (admin):', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve products'
    });
  }
};

// Create product (Admin)
exports.createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      stock_quantity, 
      category_id, 
      is_featured = false 
    } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Validate required fields
    if (!name || !price || !stock_quantity || !category_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, price, stock quantity, and category are required'
      });
    }
    
    // Check if category exists
    const [categoryRows] = await db.execute(
      'SELECT id FROM categories WHERE id = ?',
      [category_id]
    );
    
    if (categoryRows.length === 0) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'The specified category does not exist'
      });
    }
    
    const [result] = await db.execute(`
      INSERT INTO products (
        name, description, price, stock_quantity, 
        category_id, image_url, is_featured
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      description || null, 
      parseFloat(price), 
      parseInt(stock_quantity), 
      category_id, 
      image_url, 
      Boolean(is_featured)
    ]);
    
    res.status(201).json({ 
      success: true, 
      productId: result.insertId,
      message: 'Product created successfully'
    });
    
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create product'
    });
  }
};

// Update product (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      stock_quantity, 
      category_id, 
      is_featured 
    } = req.body;
    
    // Check if product exists
    const [existingProduct] = await db.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    
    if (existingProduct.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }
    
    let query = `
      UPDATE products 
      SET name = ?, description = ?, price = ?, stock_quantity = ?, 
          category_id = ?, is_featured = ?, updated_at = NOW()
    `;
    let params = [
      name, 
      description || null, 
      parseFloat(price), 
      parseInt(stock_quantity), 
      category_id, 
      Boolean(is_featured)
    ];
    
    // Add image if uploaded
    if (req.file) {
      query += ', image_url = ?';
      params.push(`/uploads/${req.file.filename}`);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await db.execute(query, params);
    
    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      productId: id
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update product'
    });
  }
};

// Delete product (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const [existingProduct] = await db.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    
    if (existingProduct.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }
    
    // Soft delete - set as inactive
    await db.execute(
      'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({ 
      success: true, 
      message: 'Product deleted successfully',
      productId: id
    });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete product'
    });
  }
};

// Toggle product status (Admin)
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const [existingProduct] = await db.execute(
      'SELECT is_active FROM products WHERE id = ?',
      [id]
    );
    
    if (existingProduct.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }
    
    // Toggle status
    await db.execute(`
      UPDATE products 
      SET is_active = NOT is_active, updated_at = NOW() 
      WHERE id = ?
    `, [id]);
    
    res.json({ 
      success: true, 
      message: 'Product status updated successfully',
      productId: id
    });
    
  } catch (error) {
    console.error('Error toggling product status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update product status'
    });
  }
};

// Get settings (Admin)
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM settings');
    
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    res.json(settings);
    
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve settings'
    });
  }
};

// Update settings (Admin)
exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await db.execute(`
        INSERT INTO settings (setting_key, setting_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()
      `, [key, value, value]);
    }
    
    res.json({ 
      success: true, 
      message: 'Settings updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update settings'
    });
  }
};