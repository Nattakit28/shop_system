import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI, paymentAPI } from '../services/api';
import QRPayment from '../components/QRPayment';
import { formatCurrency, formatDate } from '../utils/promptpay';

const PaymentConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [showProofForm, setShowProofForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentDateTime: '',
    notes: '',
    paymentSlip: null
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await orderAPI.getById(orderId);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์มีขนาดใหญ่เกินไป (ขนาดสูงสุด 5MB)');
        return;
      }
      
      setPaymentForm(prev => ({
        ...prev,
        paymentSlip: file
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    
    if (!paymentForm.paymentSlip) {
      alert('กรุณาแนบสลิปการโอนเงิน');
      return;
    }
    
    if (!paymentForm.paymentDateTime) {
      alert('กรุณาระบุวันที่และเวลาที่โอนเงิน');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('paymentDateTime', paymentForm.paymentDateTime);
    formData.append('notes', paymentForm.notes);
    formData.append('paymentSlip', paymentForm.paymentSlip);

    try {
      await paymentAPI.submitProof(formData);
      
      // Show success message
      const message = document.createElement('div');
      message.className = 'toast-message success';
      message.textContent = 'ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว!';
      document.body.appendChild(message);
      
      setTimeout(() => {
        message.remove();
        navigate(`/thank-you/${order.order_number}`);
      }, 2000);
      
    } catch (error) {
      console.error('Payment proof submission error:', error);
      alert('เกิดข้อผิดพลาดในการส่งหลักฐาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="error-container">
        <div className="error-message">ไม่พบคำสั่งซื้อ</div>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          กลับหน้าแรก
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="payment-confirmation">
        <div className="payment-header">
          <h1>💳 ชำระเงิน</h1>
          <div className="order-status">
            <span className="status-badge pending">รอการชำระเงิน</span>
          </div>
        </div>
        
        <div className="payment-content">
          {/* Order Information */}
          <div className="order-info-section">
            <h2>📋 ข้อมูลคำสั่งซื้อ</h2>
            <div className="order-details">
              <div className="detail-row">
                <span className="label">หมายเลขคำสั่งซื้อ:</span>
                <span className="value">{order.order_number}</span>
              </div>
              <div className="detail-row">
                <span className="label">ผู้สั่งซื้อ:</span>
                <span className="value">{order.customer_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">เบอร์โทร:</span>
                <span className="value">{order.customer_phone}</span>
              </div>
              {order.customer_address && (
                <div className="detail-row">
                  <span className="label">ที่อยู่จัดส่ง:</span>
                  <span className="value">{order.customer_address}</span>
                </div>
              )}
              <div className="detail-row highlight">
                <span className="label">ยอดรวมทั้งหมด:</span>
                <span className="value total">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="detail-row">
                <span className="label">วันที่สั่งซื้อ:</span>
                <span className="value">{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>

          {/* QR Payment */}
          <QRPayment orderId={orderId} />

          {/* Payment Proof Form */}
          <div className="payment-actions">
            <button 
              onClick={() => setShowProofForm(!showProofForm)}
              className={`btn ${showProofForm ? 'btn-secondary' : 'btn-primary'} btn-lg`}
            >
              {showProofForm ? '🔽 ซ่อนฟอร์ม' : '📤 แจ้งการชำระเงิน'}
            </button>
          </div>

          {showProofForm && (
            <div className="payment-proof-section">
              <h2>📤 แจ้งการชำระเงิน</h2>
              <p className="section-description">
                กรุณาแนบสลิปการโอนเงินและระบุข้อมูลเพิ่มเติม
              </p>
              
              <form onSubmit={handleSubmitProof} className="payment-proof-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="paymentDateTime">วันที่-เวลาที่โอน *</label>
                    <input
                      id="paymentDateTime"
                      type="datetime-local"
                      name="paymentDateTime"
                      value={paymentForm.paymentDateTime}
                      onChange={handleInputChange}
                      max={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentSlip">แนบสลิปการโอน *</label>
                  <div className="file-upload">
                    <input
                      id="paymentSlip"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="file-input"
                      required
                    />
                    <div className="file-upload-display">
                      {paymentForm.paymentSlip ? (
                        <div className="file-preview">
                          <span className="file-name">📎 {paymentForm.paymentSlip.name}</span>
                          <span className="file-size">
                            ({Math.round(paymentForm.paymentSlip.size / 1024)} KB)
                          </span>
                        </div>
                      ) : (
                        <div className="file-placeholder">
                          <span className="upload-icon">📷</span>
                          <span>คลิกเพื่อเลือกไฟล์สลิป</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <small className="form-help">
                    รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">หมายเหตุเพิ่มเติม</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={paymentForm.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="หมายเหตุเพิ่มเติม เช่น โอนจากธนาคารใด, ชื่อบัญชีผู้โอน"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={() => setShowProofForm(false)}
                    className="btn btn-secondary"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="loading-spinner small"></span>
                        กำลังส่ง...
                      </>
                    ) : (
                      '📤 ส่งหลักฐานการชำระเงิน'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Help Section */}
          <div className="help-section">
            <h3>❓ ต้องการความช่วยเหลือ?</h3>
            <div className="help-content">
              <p>
                หากมีปัญหาในการชำระเงินหรือต้องการสอบถามข้อมูลเพิ่มเติม 
                กรุณาติดต่อเราผ่านช่องทางดังต่อไปนี้:
              </p>
              <div className="contact-methods">
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <span>02-123-4567</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <span>support@example.com</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">💬</span>
                  <span>Line: @onlineshop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;