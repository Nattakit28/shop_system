const db = require('../config/database');

class Product {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.stock_quantity = data.stock_quantity;
    this.category_id = data.category_id;
    this.image_url = data.image_url;
    this.is_featured = data.is_featured || false;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Find all products with optional filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = true
      `;
      
      const params = [];
      
      // Apply filters
      if (filters.category) {
        query += ' AND p.category_id = ?';
        params.push(filters.category);
      }
      
      if (filters.search) {
        query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      
      if (filters.minPrice) {
        query += ' AND p.price >= ?';
        params.push(parseFloat(filters.minPrice));
      }
      
      if (filters.maxPrice) {
        query += ' AND p.price <= ?';
        params.push(parseFloat(filters.maxPrice));
      }
      
      if (filters.featured) {
        query += ' AND p.is_featured = true';
      }
      
      // Apply sorting
      switch (filters.sortBy) {
        case 'price-low':
          query += ' ORDER BY p.price ASC';
          break;
        case 'price-high':
          query += ' ORDER BY p.price DESC';
          break;
        case 'name':
          query += ' ORDER BY p.name ASC';
          break;
        case 'popular':
          query += ' ORDER BY p.is_featured DESC, p.created_at DESC';
          break;
        default:
          query += ' ORDER BY p.created_at DESC';
      }
      
      // Apply pagination
      if (filters.limit) {
        const offset = filters.offset || 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(filters.limit), parseInt(offset));
      }
      
      const [rows] = await db.execute(query, params);
      return rows.map(row => new Product(row));
    } catch (error) {
      throw error;
    }
  }

  // Find product by ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ? AND p.is_active = true
      `, [id]);
      
      return rows.length > 0 ? new Product(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find featured products
  static async findFeatured(limit = 6) {
    try {
      const [rows] = await db.execute(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_featured = true AND p.is_active = true
        ORDER BY p.created_at DESC
        LIMIT ?
      `, [limit]);
      
      return rows.map(row => new Product(row));
    } catch (error) {
      throw error;
    }
  }

  // Count products with filters
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM products p WHERE p.is_active = true';
      const params = [];
      
      if (filters.category) {
        query += ' AND p.category_id = ?';
        params.push(filters.category);
      }
      
      if (filters.search) {
        query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      
      if (filters.minPrice) {
        query += ' AND p.price >= ?';
        params.push(parseFloat(filters.minPrice));
      }
      
      if (filters.maxPrice) {
        query += ' AND p.price <= ?';
        params.push(parseFloat(filters.maxPrice));
      }
      
      const [rows] = await db.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Save product (create or update)
  async save() {
    try {
      if (this.id) {
        // Update existing product
        const [result] = await db.execute(`
          UPDATE products 
          SET name = ?, description = ?, price = ?, stock_quantity = ?, 
              category_id = ?, image_url = ?, is_featured = ?, updated_at = NOW()
          WHERE id = ?
        `, [
          this.name, this.description, this.price, this.stock_quantity,
          this.category_id, this.image_url, this.is_featured, this.id
        ]);
        
        return result.affectedRows > 0;
      } else {
        // Create new product
        const [result] = await db.execute(`
          INSERT INTO products (
            name, description, price, stock_quantity, category_id, 
            image_url, is_featured, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.name, this.description, this.price, this.stock_quantity,
          this.category_id, this.image_url, this.is_featured, this.is_active
        ]);
        
        this.id = result.insertId;
        return true;
      }
    } catch (error) {
      throw error;
    }
  }

  // Update stock quantity
  async updateStock(quantity) {
    try {
      if (this.stock_quantity < quantity) {
        throw new Error('Insufficient stock');
      }
      
      const [result] = await db.execute(`
        UPDATE products 
        SET stock_quantity = stock_quantity - ?, updated_at = NOW()
        WHERE id = ? AND stock_quantity >= ?
      `, [quantity, this.id, quantity]);
      
      if (result.affectedRows === 0) {
        throw new Error('Failed to update stock or insufficient quantity');
      }
      
      this.stock_quantity -= quantity;
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Restore stock (for cancelled orders)
  async restoreStock(quantity) {
    try {
      const [result] = await db.execute(`
        UPDATE products 
        SET stock_quantity = stock_quantity + ?, updated_at = NOW()
        WHERE id = ?
      `, [quantity, this.id]);
      
      this.stock_quantity += quantity;
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Toggle active status
  async toggleActive() {
    try {
      this.is_active = !this.is_active;
      
      const [result] = await db.execute(`
        UPDATE products 
        SET is_active = ?, updated_at = NOW()
        WHERE id = ?
      `, [this.is_active, this.id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete product (soft delete)
  async delete() {
    try {
      const [result] = await db.execute(`
        UPDATE products 
        SET is_active = false, updated_at = NOW()
        WHERE id = ?
      `, [this.id]);
      
      this.is_active = false;
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Validate product data
  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Product name is required');
    }
    
    if (!this.price || this.price <= 0) {
      errors.push('Valid price is required');
    }
    
    if (this.stock_quantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }
    
    if (!this.category_id) {
      errors.push('Category is required');
    }
    
    return errors;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: parseFloat(this.price),
      stock_quantity: this.stock_quantity,
      category_id: this.category_id,
      image_url: this.image_url,
      is_featured: this.is_featured,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Product;