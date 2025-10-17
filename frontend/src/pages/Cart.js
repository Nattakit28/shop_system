import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import CartComponent from "../components/Cart";
import { productAPI } from "../services/api";
import { formatCurrency } from "../utils/promptpay";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [stockInfo, setStockInfo] = useState({});
  const [loadingStock, setLoadingStock] = useState(false);

  console.log("🔄 Cart page render:", cartItems.length, "items");

  // ✅ 1. ประกาศ Utility Functions ก่อน
  const stableFormatCurrency = useCallback((amount) => {
    try {
      return formatCurrency(amount);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return `฿${parseFloat(amount) || 0}`;
    }
  }, []);

  const showToastMessage = useCallback((message, type = "info") => {
    try {
      setToast({ message, type, id: Date.now() });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("Error showing toast:", error);
    }
  }, []);

  const isCartEqual = useCallback((cart1, cart2) => {
    if (cart1.length !== cart2.length) return false;

    return cart1.every((item1, index) => {
      const item2 = cart2[index];
      return (
        item1.id === item2.id &&
        item1.name === item2.name &&
        parseFloat(item1.price) === parseFloat(item2.price) &&
        parseInt(item1.quantity) === parseInt(item2.quantity) &&
        item1.image_url === item2.image_url
      );
    });
  }, []);

  const cleanCartData = useCallback((cart) => {
    if (!Array.isArray(cart)) return [];

    return cart
      .map((item) => {
        const id = item.id;
        const name = item.name || "สินค้าไม่ระบุชื่อ";
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const image_url = item.image_url || "/api/placeholder/100/100";

        if (
          item.id === id &&
          item.name === name &&
          parseFloat(item.price) === price &&
          parseInt(item.quantity) === quantity &&
          item.image_url === image_url
        ) {
          return item;
        }

        return { id, name, price, quantity, image_url };
      })
      .filter((item) => item.id && item.price > 0 && item.quantity > 0);
  }, []);

  // ✅ 2. หลังจากนั้นประกาศ Functions ที่ใช้ showToastMessage
  const loadStockInfo = useCallback(async () => {
    if (cartItems.length === 0) return;

    setLoadingStock(true);
    const stockData = {};

    try {
      const stockPromises = cartItems.map(async (item) => {
        try {
          const response = await productAPI.getProduct(item.id);
          const product = response?.data?.data || response?.data;

          stockData[item.id] = {
            available: parseInt(product?.stock_quantity) || 0,
            name: product?.name || item.name,
            price: parseFloat(product?.price) || item.price,
          };
        } catch (error) {
          console.warn(`⚠️ Cannot get stock for product ${item.id}:`, error);
          stockData[item.id] = {
            available: item.quantity,
            name: item.name,
            price: item.price,
          };
        }
      });

      await Promise.all(stockPromises);

      console.log("📊 Stock info loaded:", stockData);
      setStockInfo(stockData);
    } catch (error) {
      console.error("Error loading stock info:", error);
      showToastMessage("เกิดข้อผิดพลาดในการโหลดข้อมูลสต็อก", "warning");
    } finally {
      setLoadingStock(false);
    }
  }, [cartItems, showToastMessage]); // ✅ ตอนนี้ showToastMessage ถูกประกาศแล้ว

  const loadCart = useCallback(() => {
    try {
      setIsLoading(true);
      const cartString = localStorage.getItem("cart");

      if (!cartString || cartString === "[]") {
        console.log("🛒 Cart is empty");
        setCartItems([]);
        return;
      }

      const cart = JSON.parse(cartString);
      const cleanedCart = cleanCartData(cart);

      console.log("🛒 Loading cart:", {
        originalLength: cart.length,
        cleanedLength: cleanedCart.length,
      });

      setCartItems((prevItems) => {
        const hasChanged = !isCartEqual(prevItems, cleanedCart);

        console.log("🔄 Cart comparison:", {
          hasChanged,
          prevLength: prevItems.length,
          newLength: cleanedCart.length,
        });

        return hasChanged ? cleanedCart : prevItems;
      });

      if (cleanedCart.length > 0) {
        const cleanedString = JSON.stringify(cleanedCart);
        if (cartString !== cleanedString) {
          console.log("💾 Saving cleaned cart to localStorage");
          localStorage.setItem("cart", cleanedString);
        }
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      setCartItems([]);
      showToastMessage("เกิดข้อผิดพลาดในการโหลดตะกร้า", "error");
    } finally {
      setIsLoading(false);
    }
  }, [cleanCartData, isCartEqual, showToastMessage]);

  const updateQuantity = useCallback(
    async (productId, newQuantity) => {
      if (newQuantity <= 0) return;

      console.log("🔄 Updating quantity:", productId, newQuantity);

      try {
        let currentStock = stockInfo[productId]?.available;

        if (currentStock === undefined) {
          console.log("📡 Fetching fresh stock data for product:", productId);
          const response = await productAPI.getProduct(productId);
          currentStock =
            response?.data?.data?.stock_quantity ||
            response?.data?.stock_quantity ||
            0;

          setStockInfo((prev) => ({
            ...prev,
            [productId]: {
              ...prev[productId],
              available: currentStock,
            },
          }));
        }

        if (newQuantity > currentStock) {
          showToastMessage(
            `❌ ไม่สามารถเพิ่มได้อีก\nสินค้านี้มีในสต็อกเหลือเพียง ${currentStock} ชิ้น\nคุณต้องการ ${newQuantity} ชิ้น`,
            "warning"
          );
          return;
        }

        setCartItems((prevItems) => {
          const updatedCart = prevItems.map((item) =>
            item.id === productId
              ? { ...item, quantity: parseInt(newQuantity) }
              : item
          );

          const cleanedCart = cleanCartData(updatedCart);
          localStorage.setItem("cart", JSON.stringify(cleanedCart));

          window.dispatchEvent(
            new CustomEvent("cartUpdated", { detail: "internal" })
          );

          return cleanedCart;
        });

        const productName = stockInfo[productId]?.name || "สินค้า";
        showToastMessage(
          `✅ อัปเดตจำนวน ${productName} เป็น ${newQuantity} ชิ้น`,
          "success"
        );
      } catch (error) {
        console.error("Error updating quantity:", error);
        showToastMessage("เกิดข้อผิดพลาดในการอัปเดตจำนวน", "error");
      }
    },
    [cleanCartData, showToastMessage, stockInfo]
  );

  const removeItem = useCallback(
    (productId) => {
      console.log("🗑️ Removing item:", productId);

      try {
        setCartItems((prevItems) => {
          const updatedCart = prevItems.filter((item) => item.id !== productId);
          const cleanedCart = cleanCartData(updatedCart);

          localStorage.setItem("cart", JSON.stringify(cleanedCart));

          window.dispatchEvent(
            new CustomEvent("cartUpdated", { detail: "internal" })
          );

          showToastMessage("ลบสินค้าออกจากตะกร้าแล้ว", "success");

          return cleanedCart;
        });
      } catch (error) {
        console.error("Error removing item:", error);
        showToastMessage("เกิดข้อผิดพลาดในการลบสินค้า", "error");
      }
    },
    [cleanCartData, showToastMessage]
  );

  const clearCart = useCallback(() => {
    if (window.confirm("คุณแน่ใจหรือไม่ที่จะล้างตะกร้าสินค้าทั้งหมด?")) {
      try {
        setCartItems([]);
        localStorage.removeItem("cart");
        window.dispatchEvent(
          new CustomEvent("cartUpdated", { detail: "internal" })
        );
        showToastMessage("ล้างตะกร้าสินค้าแล้ว", "success");
      } catch (error) {
        console.error("Error clearing cart:", error);
        showToastMessage("เกิดข้อผิดพลาดในการล้างตะกร้า", "error");
      }
    }
  }, [showToastMessage]);

  // ✅ 3. useEffect hooks
  useEffect(() => {
    loadCart();

    const handleCartUpdate = (event) => {
      if (event.detail !== "internal") {
        console.log("🔄 External cart update detected");
        loadCart();
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [loadCart]);

  useEffect(() => {
    if (cartItems.length > 0) {
      loadStockInfo();
    } else {
      setStockInfo({});
    }
  }, [loadStockInfo]);

  // ✅ 4. Computed values
  const totalAmount = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return total + price * quantity;
    }, 0);
  }, [cartItems]);

  // ✅ 5. Loading state
  if (isLoading) {
    return (
      <div className="container">
        <div className="cart-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>กำลังโหลดตะกร้าสินค้า...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 6. Empty cart state
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

  // ✅ 7. Main render
  return (
    <div className="container">
      {toast && (
        <div className={`toast-message ${toast.type}`} key={toast.id}>
          {toast.message}
        </div>
      )}

      <div className="cart-page">
        <div className="cart-header">
          <h1>🛒 ตะกร้าสินค้า ({cartItems.length} รายการ)</h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={loadStockInfo}
              className="btn btn-info btn-sm"
              disabled={loadingStock}
              title="รีเฟรชข้อมูลสต็อก"
            >
              {loadingStock ? (
                <>
                  <div className="loading-spinner-mini"></div>
                  โหลด...
                </>
              ) : (
                "🔄 รีเฟรชสต็อก"
              )}
            </button>

            <button onClick={clearCart} className="btn btn-outline btn-sm">
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
            formatCurrency={stableFormatCurrency}
            stockInfo={stockInfo}
            loadingStock={loadingStock}
          />

          <div className="cart-total">
            <div className="total-amount">
              ยอดรวมทั้งหมด: <span>{stableFormatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="cart-actions">
            <Link to="/products" className="btn btn-secondary">
              ← ช้อปต่อ
            </Link>
            <Link to="/checkout" className="btn btn-primary btn-lg">
              💳 ดำเนินการชำระเงิน ({stableFormatCurrency(totalAmount)})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;