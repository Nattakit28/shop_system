const db = require('../config/database');

// Get all products with filtering
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      sortBy = 'newest',
      page = 1,
      limit = 20 
    } = req.query;
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = true
    `;
    
    const params = [];
    
    // Add filters
    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }
    
    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    // Add sorting
    switch (sortBy) {
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
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [rows] = await db.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM products p 
      WHERE p.is_active = true
    `;
    const countParams = [];
    
    if (category) {
      countQuery += ' AND p.category_id = ?';
      countParams.push(category);
    }
    
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (minPrice) {
      countQuery += ' AND p.price >= ?';
      countParams.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      countQuery += ' AND p.price <= ?';
      countParams.push(parseFloat(maxPrice));
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      products: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve products'
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ? AND p.is_active = true
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: 'The requested product does not exist or is not active'
      });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting product by ID:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve product'
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_featured = true AND p.is_active = true
      ORDER BY p.created_at DESC
      LIMIT 6
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error getting featured products:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve featured products'
    });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      GROUP BY c.id
      ORDER BY c.name
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve categories'
    });
  }
};