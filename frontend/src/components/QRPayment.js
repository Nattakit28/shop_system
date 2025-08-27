import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';
import { formatCurrency, formatPromptPayNumber } from '../utils/promptpay';

const QRPayment = ({ orderId, onPaymentGenerated }) => {
  const [qrData, setQRData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await paymentAPI.generateQR(orderId);
        setQRData(response.data);
        
        if (onPaymentGenerated) {
          onPaymentGenerated(response.data);
        }
      } catch (err) {
        setError('ไม่สามารถสร้าง QR Code ได้ กรุณาลองใหม่อีกครั้ง');
        console.error('QR Generation Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      generateQR();
    }
  }, [orderId, onPaymentGenerated]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const downloadQR = () => {
    if (!qrData?.qrCode) return;
    
    const link = document.createElement('a');
    link.download = `QR-Payment-${qrData.orderNumber}.png`;
    link.href = qrData.qrCode;
    link.click();
  };

  if (loading) {
    return (
      <div className="qr-payment loading">
        <div className="loading-spinner"></div>
        <p>กำลังสร้าง QR Code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-payment error">
        <div className="error-icon">❌</div>
        <p className="error-message">{error}</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!qrData) return null;

  return (
    <div className="qr-payment">
      <div className="qr-header">
        <h3>💳 สแกน QR Code เพื่อชำระเงิน</h3>
        <p className="qr-subtitle">ใช้แอปธนาคารของคุณสแกน QR Code ด้านล่าง</p>
      </div>
      
      <div className="qr-container">
        <div className="qr-code-wrapper">
          <img 
            src={qrData.qrCode} 
            alt="QR Code สำหรับชำระเงิน PromptPay"
            className="qr-code-image"
          />
          <button 
            className="download-qr-btn"
            onClick={downloadQR}
            title="ดาวน์โหลด QR Code"
          >
            📥
          </button>
        </div>
      </div>
      
      <div className="payment-details">
        <div className="detail-row">
          <span className="label">หมายเลข PromptPay:</span>
          <div className="value-with-copy">
            <span className="value">{formatPromptPayNumber(qrData.promptpayNumber)}</span>
            <button 
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={() => copyToClipboard(qrData.promptpayNumber)}
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
        </div>
        
        <div className="detail-row highlight">
          <span className="label">จำนวนเงิน:</span>
          <span className="value amount">{formatCurrency(qrData.amount)}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">หมายเลขคำสั่งซื้อ:</span>
          <span className="value">{qrData.orderNumber}</span>
        </div>
      </div>
      
      <div className="payment-instructions">
        <h4>📋 วิธีการชำระเงิน:</h4>
        <ol className="instruction-list">
          <li>
            <span className="step-number">1</span>
            <span className="step-text">เปิดแอปธนาคารของคุณ</span>
          </li>
          <li>
            <span className="step-number">2</span>
            <span className="step-text">เลือกเมนู "สแกน QR" หรือ "QR Payment"</span>
          </li>
          <li>
            <span className="step-number">3</span>
            <span className="step-text">สแกน QR Code ด้านบน</span>
          </li>
          <li>
            <span className="step-number">4</span>
            <span className="step-text">ตรวจสอบจำนวนเงินและกดยืนยัน</span>
          </li>
          <li>
            <span className="step-number">5</span>
            <span className="step-text">เก็บหลักฐานการโอนเงินไว้แจ้งต่อไป</span>
          </li>
        </ol>
      </div>
      
      <div className="payment-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <strong>หมายเหตุ:</strong>
          <p>หากไม่สามารถสแกน QR Code ได้ ให้ใช้หมายเลข PromptPay และระบุจำนวนเงินด้วยตนเอง</p>
        </div>
      </div>
    </div>
  );
};

export default QRPayment;