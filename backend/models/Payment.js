const db = require('../config/database');

class Payment {
  constructor(data = {}) {
    this.id = data.id;
    this.order_id = data.order_id;
    this.payment_method = data.payment_method || 'promptpay';
    this.amount = data.amount;
    this.payment_slip = data.payment_slip;
    this.payment_date_time = data.payment_date_time;
    this.notes = data.notes;
    this.status = data.status || 'pending';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Find payment by order ID
  static async findByOrderId(orderId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
        [orderId]
      );
      
      return rows.length > 0 ? new Payment(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find payment by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM payments WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new Payment(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find all payments with filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT p.*, o.order_number, o.customer_name
        FROM payments p
        JOIN orders o ON p.order_id = o.id
      `;
      
      const params = [];
      const conditions = [];
      
      if (filters.status && filters.status !== 'all') {
        conditions.push('p.status = ?');
        params.push(filters.status);
      }
      
      if (filters.payment_method) {
        conditions.push('p.payment_method = ?');
        params.push(filters.payment_method);
      }
      
      if (filters.startDate) {
        conditions.push('DATE(p.created_at) >= ?');
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        conditions.push('DATE(p.created_at) <= ?');
        params.push(filters.endDate);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY p.created_at DESC';
      
      // Apply pagination
      if (filters.limit) {
        const offset = filters.offset || 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(filters.limit), parseInt(offset));
      }
      
      const [rows] = await db.execute(query, params);
      return rows.map(row => new Payment(row));
    } catch (error) {
      throw error;
    }
  }

  // Save payment
  async save() {
    try {
      if (this.id) {
        // Update existing payment
        const [result] = await db.execute(`
          UPDATE payments 
          SET payment_method = ?, amount = ?, payment_slip = ?,
              payment_date_time = ?, notes = ?, status = ?, updated_at = NOW()
          WHERE id = ?
        `, [
          this.payment_method, this.amount, this.payment_slip,
          this.payment_date_time, this.notes, this.status, this.id
        ]);
        
        return result.affectedRows > 0;
      } else {
        // Create new payment
        const [result] = await db.execute(`
          INSERT INTO payments (
            order_id, payment_method, amount, payment_slip,
            payment_date_time, notes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          this.order_id, this.payment_method, this.amount, this.payment_slip,
          this.payment_date_time, this.notes, this.status
        ]);
        
        this.id = result.insertId;
        return true;
      }
    } catch (error) {
      throw error;
    }
  }

  // Update status
  async updateStatus(newStatus) {
    try {
      const validStatuses = ['pending', 'verified', 'rejected'];
      
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid payment status');
      }
      
      const [result] = await db.execute(
        'UPDATE payments SET status = ?, updated_at = NOW() WHERE id = ?',
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

  // Validate payment data
  validate() {
    const errors = [];
    
    if (!this.order_id) {
      errors.push('Order ID is required');
    }
    
    if (!this.amount || this.amount <= 0) {
      errors.push('Valid amount is required');
    }
    
    if (!this.payment_date_time) {
      errors.push('Payment date and time is required');
    }
    
    // Validate payment method
    const validMethods = ['promptpay', 'bank_transfer', 'cash'];
    if (!validMethods.includes(this.payment_method)) {
      errors.push('Invalid payment method');
    }
    
    return errors;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      order_id: this.order_id,
      payment_method: this.payment_method,
      amount: parseFloat(this.amount),
      payment_slip: this.payment_slip,
      payment_date_time: this.payment_date_time,
      notes: this.notes,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Payment;