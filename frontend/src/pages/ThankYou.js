
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const ThankYou = () => {
  const { orderNumber } = useParams();

  useEffect(() => {
    // Clear any remaining cart data
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
  }, []);

  return (
    <div className="container">
      <div className="thank-you-page">
        <div className="thank-you-content">
          <div className="success-animation">
            <div className="success-icon">✅</div>
            <div className="success-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
          </div>
          
          <h1 className="thank-you-title">
            🎉 ขอบคุณสำหรับการสั่งซื้อ!
          </h1>
          
          <div className="order-confirmation">
            <div className="confirmation-card">
              <h2>📋 ข้อมูลคำสั่งซื้อ</h2>
              <div className="order-details">
                <div className="detail-item">
                  <span className="label">หมายเลขคำสั่งซื้อ:</span>
                  <span className="value highlight">{orderNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">สถานะ:</span>
                  <span className="value status">รอตรวจสอบการชำระเงิน</span>
                </div>
                <div className="detail-item">
                  <span className="label">วันที่สั่งซื้อ:</span>
                  <span className="value">{new Date().toLocaleDateString('th-TH')}</span>
                </div>
              </div>
              
              <div className="confirmation-message">
                <p>
                  <strong>✨ เราได้รับหลักฐานการชำระเงินของคุณแล้ว</strong>
                </p>
                <p>
                  ทีมงานของเราจะตรวจสอบและยืนยันการชำระเงินภายใน <strong>24 ชั่วโมง</strong>
                </p>
              </div>
            </div>
          </div>
          
          <div className="next-steps">
            <h3>📝 ขั้นตอนถัดไป</h3>
            <div className="steps-timeline">
              <div className="step completed">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>สั่งซื้อเรียบร้อย</h4>
                  <p>คุณได้ทำการสั่งซื้อและส่งหลักฐานการชำระเงินแล้ว</p>
                </div>
              </div>
              <div className="step current">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>ตรวจสอบการชำระเงิน</h4>
                  <p>เราจะตรวจสอบการชำระเงินของคุณภายใน 24 ชั่วโมง</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>เตรียมสินค้า</h4>
                  <p>หลังยืนยันการชำระเงิน เราจะเตรียมสินค้าเพื่อจัดส่ง</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>จัดส่งสินค้า</h4>
                  <p>สินค้าจะถูกจัดส่งถึงที่อยู่ของคุณภายใน 2-3 วันทำการ</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="contact-info">
            <h3>📞 ติดต่อสอบถาม</h3>
            <div className="contact-grid">
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h4>โทรศัพท์</h4>
                  <p>02-123-4567</p>
                  <small>จันทร์-ศุกร์ 9:00-18:00</small>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <h4>อีเมล</h4>
                  <p>support@example.com</p>
                  <small>ตอบกลับภายใน 24 ชั่วโมง</small>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">💬</div>
                <div className="contact-details">
                  <h4>Line</h4>
                  <p>@onlineshop</p>
                  <small>สอบถามได้ตลอด 24 ชั่วโมง</small>
                </div>
              </div>
            </div>
          </div>
          
          <div className="thank-you-actions">
            <Link to="/" className="btn btn-primary btn-lg">
              🏠 กลับไปหน้าแรก
            </Link>
            <Link to="/products" className="btn btn-secondary btn-lg">
              🛍️ ช้อปสินค้าเพิ่ม
            </Link>
          </div>
          
          <div className="social-share">
            <h4>📢 แชร์ประสบการณ์ดีๆ</h4>
            <p>หากคุณพอใจกับบริการของเรา อย่าลืมแชร์ให้เพื่อนๆ ด้วยนะคะ</p>
            <div className="share-buttons">
              <button className="share-btn facebook">📘 Facebook</button>
              <button className="share-btn line">💬 Line</button>
              <button className="share-btn copy">📋 Copy Link</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;