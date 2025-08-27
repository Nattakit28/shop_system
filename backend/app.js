const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Online Shop API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Online Shop API',
    version: '1.0.0',
    description: 'Backend API for Online Shop with QR PromptPay support',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments',
      admin: '/api/admin',
      health: '/api/health'
    },
    documentation: 'https://github.com/your-repo/online-shop'
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: ['/api/products', '/api/orders', '/api/payments', '/api/admin']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 5MB'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Invalid file',
      message: 'Unexpected file field'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Please provide a valid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Please login again'
    });
  }
  
  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      error: 'Duplicate entry',
      message: 'This record already exists'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.messagez
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 API Documentation: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;