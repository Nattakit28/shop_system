const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Middleware สำหรับตรวจสอบข้อมูล
const validateOrderData = (req, res, next) => {
  console.log("🔍 Validating order data:", req.body);

  const { customerName, customerPhone, items } = req.body;

  if (!customerName || !customerPhone || !items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message:
        "ข้อมูลคำสั่งซื้อไม่ครบถ้วน (customerName, customerPhone, items)",
    });
  }

  next();
};

// Routes
router.post("/", validateOrderData, orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/phone/:phone", orderController.getOrdersByPhone);
router.get("/:id", orderController.getOrderById);
router.put("/:orderId/status", orderController.updateOrderStatus);
router.post('/', orderController.createOrder);

module.exports = router;