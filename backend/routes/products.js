const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// ✅ Routes for product management
router.get('/', productController.getAllProducts);
router.post('/', productController.upload.single('image'), productController.createProduct);
router.get('/categories', productController.getAllCategories);
router.post('/categories', productController.createCategory);

module.exports = router;