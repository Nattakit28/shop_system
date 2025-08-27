const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if admin exists in database
    const [adminRows] = await db.execute(
      'SELECT id, username FROM admins WHERE id = ?',
      [decoded.adminId]
    );
    
    if (adminRows.length === 0) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Admin not found' 
      });
    }
    
    // Add admin info to request
    req.admin = {
      id: decoded.adminId,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Authentication failed' 
    });
  }
};

module.exports = auth;