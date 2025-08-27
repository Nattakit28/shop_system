const db = require('../config/database');

class Order {
  constructor(data = {}) {
    this.id = data.id;
    this.order_number = data.order_number;
    this.customer_name = data.customer_name;
    this.customer_phone = data.customer_phone;
    this.customer_address = data.customer_address;
    this.customer_email = data.customer_email;
    this.notes = data.notes;
    this.total_amount = data.total_amount;
    this.status = data.status || 'pending';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.items = data.items || [];
    this.payment = data.payment || null;
  }

  // Generate order number
  static generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  // Find order by ID
  static async findById(id) {
    try {
      // Get order details
      const [orderRows] = await db.execute(
        'SELECT * FROM orders WHERE id = ?',
        [id]
      );
      
      if (orderRows.length === 0) {
        return null;
      }
      
      const order = new Order(orderRows[0]);
      
      // Get order items
      const [itemRows] = await db.execute(`
        SELECT oi.*, p.name as product_name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [id]);
      
      order.items = itemRows;
      
      // Get payment info
      const [paymentRows] = await db.execute(
        'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
        [id]
      );
      
      if (paymentRows.length > 0) {
        order.payment = paymentRows[0];
      }
      
      return order;
    } catch (error) {
      throw error;
    }
  }

  // Find order by order number
  static async findByOrderNumber(orderNumber) {
    try {
      const [orderRows] = await db.execute(
        'SELECT * FROM orders WHERE order_number = ?',
        [orderNumber]
      );
      
      if (orderRows.length === 0) {
        return null;
      }
      
      return await Order.findById(orderRows[0].id);
    } catch (error) {
      throw error;
    }
  }

  // Find all orders with filters (Admin)
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT o.*,
               p.payment_slip,
               p.payment_date_time,
               p.status as payment_status,
               p.notes as payment_notes
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
      `;
      
      const params = [];
      const conditions = [];
      
      if (filters.status && filters.status !== 'all') {
        conditions.push('o.status = ?');
        params.push(filters.status);
      }
      
      if (filters.startDate) {
        conditions.push('DATE(o.created_at) >= ?');
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        conditions.push('DATE(o.created_at) <= ?');
        params.push(filters.endDate);
      }
      
      if (filters.customerPhone) {
        conditions.push('o.customer_phone LIKE ?');
        params.push(`%${filters.customerPhone}%`);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY o.created_at DESC';
      
      // Apply pagination
      if (filters.limit) {
        const offset = filters.offset || 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(filters.limit), parseInt(offset));
      }
      
      const [orders] = await db.execute(query, params);
      
      // Get items for each order
      for (let order of orders) {
        const [items] = await db.execute(`
          SELECT oi.*, p.name as product_name, p.image_url
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `, [order.id]);
        
        order.items = items;
      }
      
      return orders.map(order => new Order(order));
    } catch (error) {
      throw error;
    }
  }

  // Count orders with filters
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM orders o';
      const params = [];
      const conditions = [];
      
      if (filters.status && filters.status !== 'all') {
        conditions.push('o.status = ?');
        params.push(filters.status);
      }
      
      if (filters.startDate) {
        conditions.push('DATE(o.created_at) >= ?');
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        conditions.push('DATE(o.created_at) <= ?');
        params.push(filters.endDate);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Save order
  async save() {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      if (this.id) {
        // Update existing order
        const [result] = await connection.execute(`
          UPDATE orders 
          SET customer_name = ?, customer_phone = ?, customer_address = ?,
              customer_email = ?, notes = ?, total_amount = ?, status = ?,
              updated_at = NOW()
          WHERE id = ?
        `, [
          this.customer_name, this.customer_phone, this.customer_address,
          this.customer_email, this.notes, this.total_amount, this.status,
          this.id
        ]);
        
        await connection.commit();
        return result.affectedRows > 0;
      } else {
        // Create new order
        if (!this.order_number) {
          this.order_number = Order.generateOrderNumber();
        }
        
        const [result] = await connection.execute(`
          INSERT INTO orders (
            order_number, customer_name, customer_phone, customer_address,
            customer_email, notes, total_amount, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.order_number, this.customer_name, this.customer_phone,
          this.customer_address, this.customer_email, this.notes,
          this.total_amount, this.status
        ]);
        
        this.id = result.insertId;
        
        await connection.commit();
        return true;
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update status
  async updateStatus(newStatus) {
    try {
      const validStatuses = ['pending', 'paid', 'confirmed', 'shipped', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status');
      }
      
      const [result] = await db.execute(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, this.id]
      );
      
      if (result.affectedRows > 0) {
        this.status = newStatus;
        return true;
      }
      
      return false;
    } catch (error) {
      throw error;
    }
  }

  // Calculate total amount
  calculateTotal() {
    return this.items.reduce((total, item) => {
      return total + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);
  }

  // Validate order data
  validate() {
    const errors = [];
    
    if (!this.customer_name || this.customer_name.trim().length === 0) {
      errors.push('Customer name is required');
    }
    
    if (!this.customer_phone || this.customer_phone.trim().length === 0) {
      errors.push('Customer phone is required');
    }
    
    if (!this.items || this.items.length === 0) {
      errors.push('Order must have at least one item');
    }
    
    // Validate phone format
    const phoneRegex = /^[0-9]{9,10}$/;
    if (this.customer_phone && !phoneRegex.test(this.customer_phone.replace(/[-\s]/g, ''))) {
      errors.push('Invalid phone number format');
    }
    
    // Validate email if provided
    if (this.customer_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.customer_email)) {
        errors.push('Invalid email format');
      }
    }
    
    return errors;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      order_number: this.order_number,
      customer_name: this.customer_name,
      customer_phone: this.customer_phone,
      customer_address: this.customer_address,
      customer_email: this.customer_email,
      notes: this.notes,
      total_amount: parseFloat(this.total_amount),
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      items: this.items,
      payment: this.payment
    };
  }
}

module.exports = Order;