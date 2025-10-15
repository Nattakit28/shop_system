import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CartComponent from "../components/Cart";
import { productAPI } from "../services/api";
import { formatCurrency } from "../utils/promptpay";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);

  // ✅ ฟังก์ชันทำความสะอาดข้อมูลตะกร้าแบบง่าย
  const cleanCartData = (cart) => {
    return cart.map(item => ({
      ...item,
      id: item.id,
      name: item.name || "สินค้าไม่ระบุชื่อ",
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      image_url: item.image_url || "/api/placeholder/100/100",
    })).filter(item => item.id && item.price > 0);
  };

  useEffect(() => {
    const loadCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const cleanedCart = cleanCartData(cart);
        
        console.log("🛒 Loading cart:", cleanedCart.length, "items");
        setCartItems(cleanedCart);

        if (cleanedCart.length > 0) {
          localStorage.setItem("cart", JSON.stringify(cleanedCart));
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        setCartItems([]);
      }
    };

    loadCart();
    window.addEventListener("cartUpdated", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
    };
  }, []);

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) return;

    try {
      const response = await productAPI.getProduct(productId);
      const currentStock = response?.data?.data?.stock_quantity || response?.data?.stock_quantity || 0;

      if (newQuantity > currentStock) {
        alert(`❌ ไม่สามารถเพิ่มได้\nสินค้านี้มีในสต็อกเหลือเพียง ${currentStock} ชิ้น`);
        return;
      }

      const updatedCart = cartItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: parseInt(newQuantity) }
          : item
      );

      const cleanedCart = cleanCartData(updatedCart);

      setCartItems(cleanedCart);
      localStorage.setItem("cart", JSON.stringify(cleanedCart));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Error updating quantity:", error);
      showToastMessage("เกิดข้อผิดพลาดในการอัปเดตจำนวน");
    }
  };

  const removeItem = (productId) => {
    try {
      const updatedCart = cartItems.filter((item) => item.id !== productId);
      const cleanedCart = cleanCartData(updatedCart);

      setCartItems(cleanedCart);
      localStorage.setItem("cart", JSON.stringify(cleanedCart));
      window.dispatchEvent(new Event("cartUpdated"));

      showToastMessage("ลบสินค้าออกจากตะกร้าแล้ว");
    } catch (error) {
      console.error("Error removing item:", error);
      showToastMessage("เกิดข้อผิดพลาดในการลบสินค้า");
    }
  };

  // ✅ ฟังก์ชันแสดง toast message แบบง่าย
  const showToastMessage = (message) => {
    const toastDiv = document.createElement("div");
    toastDiv.className = "toast-message info";
    toastDiv.textContent = message;
    toastDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #17a2b8;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    document.body.appendChild(toastDiv);

    setTimeout(() => {
      if (toastDiv.parentNode) {
        toastDiv.parentNode.removeChild(toastDiv);
      }
    }, 3000);
  };

  const clearCart = () => {
    if (window.confirm("คุณแน่ใจหรือไม่ที่จะล้างตะกร้าสินค้าทั้งหมด?")) {
      setCartItems([]);
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cartUpdated"));
      showToastMessage("ล้างตะกร้าสินค้าแล้ว");
    }
  };

  // ✅ คำนวณยอดรวม
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return total + price * quantity;
    }, 0);
  };

  // ✅ ฟังก์ชันซ่อมราคาจาก API
  const repairCartPrices = async () => {
    if (cartItems.length === 0) {
      showToastMessage("ไม่มีสินค้าในตะกร้าให้ซ่อม");
      return;
    }

    showToastMessage("กำลังอัปเดตราคาจากฐานข้อมูล...");

    try {
      const repairedCart = [];

      for (const item of cartItems) {
        try {
          const response = await productAPI.getProduct(item.id);
          const product = response?.data?.data || response?.data;

          if (product && product.price) {
            repairedCart.push({
              ...item,
              name: product.name || item.name,
              price: parseFloat(product.price),
            });
          } else {
            repairedCart.push(item);
          }
        } catch (error) {
          console.warn(`⚠️ Product ID ${item.id} not found:`, error);
          repairedCart.push(item);
        }
      }

      setCartItems(repairedCart);
      localStorage.setItem("cart", JSON.stringify(repairedCart));
      showToastMessage("อัปเดตราคาเรียบร้อยแล้ว!");

    } catch (error) {
      console.error("❌ Error during cart repair:", error);
      showToastMessage("เกิดข้อผิดพลาดในการอัปเดตราคา");
    }
  };

  // ✅ แก้ไข clearCorruptedCart - ไม่ reload หน้า
  const clearCorruptedCart = () => {
    if (window.confirm("ล้างข้อมูลตะกร้าที่เสียหายและเริ่มใหม่?\n(จะลบข้อมูลทั้งหมดใน localStorage)")) {
      localStorage.removeItem("cart");
      setCartItems([]);
      window.dispatchEvent(new Event("cartUpdated"));
      showToastMessage("ล้างข้อมูลตะกร้าเรียบร้อยแล้ว กรุณาเพิ่มสินค้าใหม่");
      console.log("🗑️ Cleared all cart data");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <div className="cart-page">
          <h1>🛒 ตะกร้าสินค้า</h1>
          <div className="empty-cart-page">
            <div className="empty-cart-icon">🛒</div>
            <h2>ตะกร้าสินค้าว่างเปล่า</h2>
            <p>คุณยังไม่ได้เพิ่มสินค้าใดๆ ลงในตะกร้า</p>
            <Link to="/products" className="btn btn-primary btn-lg">
              🛍️ เริ่มช้อปปิ้ง
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="cart-page">
        <div className="cart-header">
          <h1>🛒 ตะกร้าสินค้า ({cartItems.length} รายการ)</h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={repairCartPrices}
              className="btn btn-warning btn-sm"
              title="อัปเดตราคาจากฐานข้อมูล"
            >
              🔧 อัปเดตราคา
            </button>

            <button
              onClick={clearCorruptedCart}
              className="btn btn-danger btn-sm"
              title="ล้างข้อมูลตะกร้าทั้งหมดและเริ่มใหม่"
            >
              🗑️ ล้างทั้งหมด
            </button>

            <button
              onClick={clearCart}
              className="btn btn-outline btn-sm"
            >
              🗑️ ล้างตะกร้า
            </button>
          </div>
        </div>

        <div className="cart-content">
          <CartComponent
            cartItems={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            showTitle={false}
            formatCurrency={formatCurrency}
          />

          {/* ยอดรวม */}
          <div className="cart-total">
            <div className="total-amount">
              ยอดรวมทั้งหมด: <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div className="cart-actions">
            <Link to="/products" className="btn btn-secondary">
              ← ช้อปต่อ
            </Link>
            <Link to="/checkout" className="btn btn-primary btn-lg">
              💳 ดำเนินการชำระเงิน ({formatCurrency(calculateTotal())})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;