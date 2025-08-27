import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>🛍️ ร้านออนไลน์</h3>
            <p>ร้านค้าออนไลน์ขนาดเล็ก<br />รองรับการชำระเงินผ่าน QR PromptPay</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="Line">💬</a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>เมนูหลัก</h4>
            <ul>
              <li><Link to="/">หน้าแรก</Link></li>
              <li><Link to="/products">สินค้าทั้งหมด</Link></li>
              <li><Link to="/cart">ตะกร้าสินค้า</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>หมวดหมู่สินค้า</h4>
            <ul>
              <li><Link to="/products?category=1">เสื้อผ้า</Link></li>
              <li><Link to="/products?category=2">ของใช้</Link></li>
              <li><Link to="/products?category=3">อาหาร</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>ติดต่อเรา</h4>
            <div className="contact-info">
              <p>📞 02-123-4567</p>
              <p>📧 contact@example.com</p>
              <p>📍 123 ถนนตัวอย่าง<br />จังหวัดตัวอย่าง 12345</p>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>การชำระเงิน</h4>
            <div className="payment-methods">
              <div className="payment-item">💳 PromptPay</div>
              <div className="payment-item">🏦 โอนธนาคาร</div>
              <div className="payment-item">📱 QR Code</div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-divider"></div>
          <div className="footer-bottom-content">
            <p>&copy; {currentYear} ร้านออนไลน์. สงวนลิขสิทธิ์.</p>
            <div className="footer-links">
              <Link to="/admin/login">ระบบจัดการ</Link>
              <a href="#privacy">นโยบายความเป็นส่วนตัว</a>
              <a href="#terms">เงื่อนไขการใช้งาน</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;