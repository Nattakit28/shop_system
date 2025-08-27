const db = require('../config/database');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

// Create new order
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      customerName, 
      customerPhone, 
      customerAddress, 
      customerEmail,
      notes,
      items 
    } = req.body;
    
    // Validate required fields
    if (!customerName || !customerPhone || !items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Customer name, phone, and items are required'
      });
    }
    
    // Validate phone format
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(customerPhone.replace(/[-\s]/g, ''))) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Invalid phone format',
        message: 'Phone number must be 9-10 digits'
      });
    }
    
    // Validate email if provided
    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }
    }
    
    // Calculate total amount and validate products
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      // Validate item structure
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Invalid item data',
          message: 'Each item must have productId and valid quantity'
        });
      }
      
      // Get product details
      const [productRows] = await connection.execute(
        'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND is_active = true',
        [item.productId]
      );
      
      if (productRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Product not found',
          message: `Product with ID ${item.productId} not found or inactive`
        });
      }
      
      const product = productRows[0];
      
      // Check stock availability
      if (product.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Not enough stock for product: ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`
        });
      }
      
      // Use provided price or product price
      const itemPrice = item.price || product.price;
      const itemTotal = parseFloat(itemPrice) * parseInt(item.quantity);
      totalAmount += itemTotal;
      
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: parseInt(item.quantity),
        price: parseFloat(itemPrice)
      });
    }
    
    // Validate total amount
    if (totalAmount <= 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Invalid order total',
        message: 'Order total must be greater than 0'
      });
    }
    
    // Generate order number
    const orderNumber = Order.generateOrderNumber();
    
    // Create order
    const [orderResult] = await connection.execute(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_address, 
        customer_email, notes, total_amount, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      orderNumber, 
      customerName.trim(), 
      customerPhone.trim(), 
      customerAddress ? customerAddress.trim() : null, 
      customerEmail ? customerEmail.trim() : null, 
      notes ? notes.trim() : null, 
      totalAmount
    ]);
    
    const orderId = orderResult.insertId;
    
    // Create order items and update stock
    for (const item of orderItems) {
      // Insert order item
      await connection.execute(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [orderId, item.productId, item.quantity, item.price]);
      
      // Update product stock
      const [updateResult] = await connection.execute(`
        UPDATE products 
        SET stock_quantity = stock_quantity - ?, updated_at = NOW()
        WHERE id = ? AND stock_quantity >= ?
      `, [item.quantity, item.productId, item.quantity]);
      
      // Double-check stock update
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Stock update failed',
          message: `Failed to update stock for product: ${item.productName}`
        });
      }
    }
    
    await connection.commit();
    
    // Log successful order creation
    console.log(`✅ Order created successfully: ${orderNumber} for ${customerName}`);
    
    res.status(201).json({
      success: true,
      orderId: orderId,
      orderNumber: orderNumber,
      totalAmount: totalAmount,
      itemCount: orderItems.length,
      message: 'Order created successfully'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    
    // Handle specific MySQL errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: 'Duplicate order',
        message: 'An order with this information already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create order. Please try again.'
    });
  } finally {
    connection.release();
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: 'Invalid order ID',
        message: 'Order ID must be a valid number'
      });
    }
    
    // Get order details using the model
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        message: 'The requested order does not exist'
      });
    }
    
    res.json(order.toJSON());
    
  } catch (error) {
    console.error('Error getting order by ID:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve order'
    });
  }
};

// Get order by order number
exports.getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    if (!orderNumber || orderNumber.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid order number',
        message: 'Order number is required'
      });
    }
    
    const order = await Order.findByOrderNumber(orderNumber.trim());
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        message: 'The requested order does not exist'
      });
    }
    
    res.json(order.toJSON());
    
  } catch (error) {
    console.error('Error getting order by number:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve order'
    });
  }
};

// Get customer orders (by phone number)
exports.getCustomerOrders = async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone || phone.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid phone number',
        message: 'Phone number is required'
      });
    }
    
    const cleanPhone = phone.replace(/[-\s]/g, '');
    
    // Get orders for this customer
    const [orderRows] = await db.execute(`
      SELECT o.*, 
             COUNT(oi.id) as item_count,
             p.status as payment_status
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.customer_phone LIKE ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [`%${cleanPhone}%`]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({
        error: 'No orders found',
        message: 'No orders found for this phone number'
      });
    }
    
    res.json({
      customer_phone: phone,
      total_orders: orderRows.length,
      orders: orderRows
    });
    
  } catch (error) {
    console.error('Error getting customer orders:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve customer orders'
    });
  }
};

// Cancel order (customer can cancel pending orders)
exports.cancelOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { reason } = req.body;
    
    // Get order details
    const order = await Order.findById(id);
    
    if (!order) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order does not exist'
      });
    }
    
    // Check if order can be cancelled
    if (!['pending', 'paid'].includes(order.status)) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Cannot cancel order',
        message: 'Only pending or paid orders can be cancelled'
      });
    }
    
    // Update order status
    await connection.execute(
      'UPDATE orders SET status = ?, notes = CONCAT(COALESCE(notes, ""), "\nCancelled: ", COALESCE(?, "No reason provided")), updated_at = NOW() WHERE id = ?',
      ['cancelled', reason, id]
    );
    
    // Restore stock for all items
    for (const item of order.items) {
      await connection.execute(
        'UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = NOW() WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    await connection.commit();
    
    console.log(`📦 Order cancelled: ${order.order_number} - Reason: ${reason || 'No reason provided'}`);
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      orderId: id,
      orderNumber: order.order_number
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to cancel order'
    });
  } finally {
    connection.release();
  }
};

// Get order statistics (for reports)
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateCondition = '';
    const params = [];
    
    if (startDate && endDate) {
      dateCondition = 'WHERE DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateCondition = 'WHERE DATE(created_at) >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateCondition = 'WHERE DATE(created_at) <= ?';
      params.push(endDate);
    }
    
    // Get order statistics
    const [orderStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
      FROM orders ${dateCondition}
    `, params);
    
    // Get daily order counts (last 30 days)
    const [dailyStats] = await db.execute(`
      SELECT 
        DATE(created_at) as order_date,
        COUNT(*) as order_count,
        SUM(total_amount) as daily_revenue
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY order_date DESC
    `);
    
    // Get top products (by quantity sold)
    const [topProducts] = await db.execute(`
      SELECT 
        p.name as product_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      ${dateCondition.replace('created_at', 'o.created_at')}
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 10
    `, params);
    
    res.json({
      period: {
        start_date: startDate || 'All time',
        end_date: endDate || 'All time'
      },
      summary: {
        total_orders: orderStats[0].total_orders || 0,
        total_revenue: parseFloat(orderStats[0].total_revenue) || 0,
        average_order_value: parseFloat(orderStats[0].average_order_value) || 0,
        order_status_breakdown: {
          pending: orderStats[0].pending_orders || 0,
          paid: orderStats[0].paid_orders || 0,
          confirmed: orderStats[0].confirmed_orders || 0,
          shipped: orderStats[0].shipped_orders || 0,
          completed: orderStats[0].completed_orders || 0,
          cancelled: orderStats[0].cancelled_orders || 0
        }
      },
      daily_stats: dailyStats,
      top_products: topProducts
    });
    
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve order statistics'
    });
  }
};

// Validate order data before processing
const validateOrderData = (orderData) => {
  const errors = [];
  
  // Required fields validation
  if (!orderData.customerName || orderData.customerName.trim().length === 0) {
    errors.push('Customer name is required');
  }
  
  if (!orderData.customerPhone || orderData.customerPhone.trim().length === 0) {
    errors.push('Customer phone is required');
  }
  
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  }
  
  // Phone format validation
  if (orderData.customerPhone) {
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(orderData.customerPhone.replace(/[-\s]/g, ''))) {
      errors.push('Phone number must be 9-10 digits');
    }
  }
  
  // Email validation (if provided)
  if (orderData.customerEmail && orderData.customerEmail.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.customerEmail)) {
      errors.push('Invalid email format');
    }
  }
  
  // Items validation
  if (orderData.items && Array.isArray(orderData.items)) {
    orderData.items.forEach((item, index) => {
      if (!item.productId || isNaN(item.productId)) {
        errors.push(`Item ${index + 1}: Invalid product ID`);
      }
      
      if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Invalid quantity`);
      }
      
      if (item.price !== undefined && (isNaN(item.price) || item.price < 0)) {
        errors.push(`Item ${index + 1}: Invalid price`);
      }
    });
  }
  
  return errors;
};

// Export validation function for use in other modules
exports.validateOrderData = validateOrderData;