const db = require('../config/database');
const generatePayload = require('promptpay-qr');
const QRCode = require('qrcode');

// Generate QR Code for PromptPay
exports.generateQRCode = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Get order details
    const [orderRows] = await db.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    
    if (orderRows.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found',
        message: 'The requested order does not exist'
      });
    }
    
    const order = orderRows[0];
    
    // Check if order is already paid
    if (order.status !== 'pending') {
      return res.status(400).json({
        error: 'Order already processed',
        message: 'This order has already been processed'
      });
    }
    
    // Get PromptPay number from settings
    const [settingRows] = await db.execute(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      ['promptpay_number']
    );
    
    const promptpayNumber = settingRows[0]?.setting_value || process.env.DEFAULT_PROMPTPAY_NUMBER || '0123456789';
    const amount = parseFloat(order.total_amount);
    
    // Generate PromptPay QR payload
    const payload = generatePayload(promptpayNumber, { amount });
    
    // Generate QR Code image
    const qrCodeOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(payload, qrCodeOptions);
    
    res.json({
      qrCode: qrCodeDataURL,
      promptpayNumber: promptpayNumber,
      amount: amount,
      orderNumber: order.order_number,
      orderId: order.id,
      payload: payload
    });
    
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to generate QR code'
    });
  }
};

// Submit payment proof
exports.submitPaymentProof = async (req, res) => {
  try {
    const { orderId, paymentDateTime, notes } = req.body;
    const paymentSlip = req.file ? req.file.filename : null;
    
    if (!orderId || !paymentDateTime) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Order ID and payment date/time are required'
      });
    }
    
    // Get order details
    const [orderRows] = await db.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    
    if (orderRows.length === 0) {
      return res.status(404).json({ 
        error: 'Order not found',
        message: 'The requested order does not exist'
      });
    }
    
    const order = orderRows[0];
    
    // Check if payment proof already exists
    const [existingPayment] = await db.execute(
      'SELECT id FROM payments WHERE order_id = ?',
      [orderId]
    );
    
    if (existingPayment.length > 0) {
      return res.status(400).json({
        error: 'Payment proof already submitted',
        message: 'Payment proof for this order has already been submitted'
      });
    }
    
    // Insert payment record
    await db.execute(`
      INSERT INTO payments (
        order_id, payment_method, amount, payment_slip, 
        payment_date_time, notes, status
      )
      VALUES (?, 'promptpay', ?, ?, ?, ?, 'pending')
    `, [
      orderId, 
      order.total_amount, 
      paymentSlip, 
      paymentDateTime, 
      notes || null
    ]);
    
    // Update order status to 'paid'
    await db.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      ['paid', orderId]
    );
    
    res.json({ 
      success: true, 
      message: 'Payment proof submitted successfully',
      orderId: orderId,
      orderNumber: order.order_number
    });
    
  } catch (error) {
    console.error('Error submitting payment proof:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to submit payment proof'
    });
  }
};