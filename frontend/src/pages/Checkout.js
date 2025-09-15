import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderAPI } from "../services/api";
import CartComponent from "../components/Cart";
import { formatCurrency } from "../utils/promptpay";

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.length === 0) {
      navigate("/cart");
      return;
    }
    setCartItems(cart);
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = "กรุณากรอกชื่อ-นามสกุล";
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    } else if (
      !/^[0-9]{9,10}$/.test(customerInfo.phone.replace(/[-\s]/g, ""))
    ) {
      newErrors.phone = "รูปแบบเบอร์โทรไม่ถูกต้อง";
    }

    if (
      customerInfo.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)
    ) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        customerEmail: customerInfo.email,
        notes: customerInfo.notes,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      console.log("📤 Sending order data:", orderData);

      // ✅ เพิ่มการตรวจสอบ API connection
      const response = await orderAPI.create(orderData);

      console.log("📥 Raw Response:", response);

      // ✅ ตรวจสอบ response structure
      if (!response) {
        throw new Error("No response received from server");
      }

      if (!response.data) {
        throw new Error("Invalid response format - no data property");
      }

      console.log("📥 Response Data:", response.data);
      console.log("📥 Response Status:", response.status);

      // ✅ ตรวจสอบ success และ orderId
      const isSuccess = response.data.success === true || response.data.orderId;

      if (isSuccess && response.data.orderId) {
        const orderId = response.data.orderId;

        console.log("🔗 Navigating to payment page with orderId:", orderId);

        // Clear cart
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));

        // Navigate to payment page
        navigate(`/payment/${orderId}`);

        console.log("✅ Navigation completed");
      } else {
        console.error("❌ API returned success: false or no orderId");
        console.error("❌ Error message:", response.data.message);

        alert(
          `เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ: ${
            response.data.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("❌ Order creation error:", error);
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Error data:", error.response?.data);

      // ✅ แสดงข้อความ error ที่ชัดเจนขึ้น
      let errorMessage = "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ";

      if (error.message === "Network Error") {
        errorMessage =
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
      } else if (error.code === "ECONNREFUSED") {
        errorMessage =
          "เซิร์ฟเวอร์ไม่ตอบสนอง กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่หรือไม่";
      } else if (error.response?.status === 404) {
        errorMessage = "ไม่พบ API endpoint กรุณาติดต่อผู้ดูแลระบบ";
      } else if (error.response?.status >= 500) {
        errorMessage = "เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง";
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="checkout-page">
        <h1>💳 ข้อมูลการสั่งซื้อ</h1>

        <div className="checkout-content">
          <div className="checkout-form">
            <div className="form-section">
              <h2>📝 ข้อมูลผู้สั่งซื้อ</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">ชื่อ-นามสกุล *</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      className={errors.name ? "error" : ""}
                      placeholder="กรอกชื่อ-นามสกุล"
                    />
                    {errors.name && (
                      <span className="error-text">{errors.name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">เบอร์โทรศัพท์ *</label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      className={errors.phone ? "error" : ""}
                      placeholder="0xx-xxx-xxxx"
                    />
                    {errors.phone && (
                      <span className="error-text">{errors.phone}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">อีเมล (ไม่บังคับ)</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    className={errors.email ? "error" : ""}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="address">ที่อยู่จัดส่ง</label>
                  <textarea
                    id="address"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="กรอกที่อยู่สำหรับจัดส่งสินค้า (หากต้องการจัดส่ง)"
                  />
                  <small className="form-help">
                    💡 หากไม่ต้องการจัดส่ง ท่านสามารถมารับสินค้าที่ร้านได้
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">หมายเหตุเพิ่มเติม</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={customerInfo.notes}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="หมายเหตุเพิ่มเติม เช่น ข้อกำหนดพิเศษ"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="btn btn-secondary"
                  >
                    ← กลับไปตะกร้า
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner small"></span>
                        กำลังดำเนินการ...
                      </>
                    ) : (
                      "💳 ดำเนินการชำระเงิน"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="order-summary">
            <div className="summary-section">
              <h2>📋 สรุปคำสั่งซื้อ</h2>
              <div className="summary-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="summary-item">
                    <div className="item-info">
                      <img
                        src={item.image_url || "/api/placeholder/50/50"}
                        alt={item.name}
                        className="item-image"
                      />
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>
                          {formatCurrency(item.price)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="item-total">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>รวมค่าสินค้า:</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="summary-row">
                  <span>ค่าจัดส่ง:</span>
                  <span className="free">ฟรี</span>
                </div>
                <div className="summary-row total">
                  <span>ยอดรวมทั้งหมด:</span>
                  <span className="total-amount">
                    {formatCurrency(getTotalPrice())}
                  </span>
                </div>
              </div>
            </div>

            <div className="payment-info">
              <h3>💳 ข้อมูลการชำระเงิน</h3>
              <div className="payment-methods">
                <div className="payment-method active">
                  <div className="method-icon">📱</div>
                  <div className="method-details">
                    <h4>QR PromptPay</h4>
                    <p>ชำระเงินผ่าน QR Code สะดวก รวดเร็ว ปลอดภัย</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
