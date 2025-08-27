const db = require('../config/database');

class OrderItem {
  constructor(data = {}) {
    this.id = data.id;
    this.order_id = data.order_id;
    this.product_id = data.product_id;
    this.quantity = data.quantity;
    this.price = data.price;
    this.created_at = data.created_at;
    this.product_name = data.product_name;
    this.image_url = data.image_url;
  }

  // Find items by order ID
  static async findByOrderId(orderId) {
    try {
      const [rows] = await db.execute(`
        SELECT oi.*, p.name as product_name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        ORDER BY oi.id
      `, [orderId]);
      
      return rows.map(row => new OrderItem(row));
    } catch (error) {
      throw error;
    }
  }

  // Save order item
  async save() {
    try {
      if (this.id) {
        // Update existing item
        const [result] = await db.execute(`
          UPDATE order_items 
          SET quantity = ?, price = ?
          WHERE id = ?
        `, [this.quantity, this.price, this.id]);
        
        return result.affectedRows > 0;
      } else {
        // Create new item
        const [result] = await db.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [this.order_id, this.product_id, this.quantity, this.price]);
        
        this.id = result.insertId;
        return true;
      }
    } catch (error) {
      throw error;
    }
  }

  // Calculate item total
  getTotal() {
    return parseFloat(this.price) * parseInt(this.quantity);
  }

  // Validate order item
  validate() {
    const errors = [];
    
    if (!this.order_id) {
      errors.push('Order ID is required');
    }
    
    if (!this.product_id) {
      errors.push('Product ID is required');
    }
    
    if (!this.quantity || this.quantity <= 0) {
      errors.push('Valid quantity is required');
    }
    
    if (!this.price || this.price <= 0) {
      errors.push('Valid price is required');
    }
    
    return errors;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      order_id: this.order_id,
      product_id: this.product_id,
      quantity: parseInt(this.quantity),
      price: parseFloat(this.price),
      total: this.getTotal(),
      product_name: this.product_name,
      image_url: this.image_url,
      created_at: this.created_at
    };
  }
}

module.exports = OrderItem;