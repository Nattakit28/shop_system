const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// ✅ Routes for product management
router.get('/', productController.getAllProducts);
router.post('/', productController.createProduct);
router.get('/featured', productController.getFeaturedProducts);
router.get('/categories', productController.getAllCategories);
router.post('/categories', productController.createCategory);
router.get('/:id', productController.getProduct);
router.put('/:id', productController.updateProduct);
router.patch('/:id/status', productController.updateProductStatus);
router.delete('/:id', productController.deleteProduct);

module.exports = router;