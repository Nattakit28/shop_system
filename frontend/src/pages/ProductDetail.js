import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { productAPI } from "../services/api";
import { formatCurrency } from "../utils/promptpay";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  const formatPrice = (price) => {
    try {
      const formatted = formatCurrency(price);
      if (!formatted || formatted === "NaN" || formatted === "฿NaN") {
        console.warn(
          "Invalid formatted price:",
          formatted,
          "for price:",
          price
        );
        return `฿${parseFloat(price) || 0}`;
      }
      return formatted;
    } catch (error) {
      console.error("Error formatting price:", error, "for price:", price);
      return `฿${parseFloat(price) || 0}`;
    }
  };

  // ✅ ฟังก์ชันจัดการ localStorage อย่างปลอดภัย
  const getCartFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return [];
    }
  };

  const setCartToStorage = (cart) => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  };

  // ✅ ฟังก์ชันดึงข้อมูลสินค้าจาก API แบบเรียบง่าย
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id || isNaN(id) || parseInt(id) <= 0) {
          setError("รหัสสินค้าไม่ถูกต้อง");
          return;
        }

        const response = await productAPI.getProduct(id);

        // ✅ จัดการ Response แบบง่าย
        let productData = response?.data;
        if (productData?.data) {
          productData = productData.data;
        }

        if (!productData || !productData.id) {
          setError("ไม่พบข้อมูลสินค้า");
          return;
        }

        // ✅ ลบ debug logs ที่ไม่จำเป็น
        console.log("✅ Product loaded:", productData.name);
        setProduct(productData);
      } catch (err) {
        console.error("❌ Error fetching product:", err);

        if (err.response?.status === 404) {
          setError("ไม่พบสินค้าที่ต้องการ");
        } else if (err.response?.status === 400) {
          setError("ข้อมูลสินค้าไม่ถูกต้อง");
        } else if (!navigator.onLine) {
          setError("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
        } else {
          setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ✅ ฟังก์ชัน addToCart ที่เรียบง่าย
  const addToCart = () => {
    if (!product) {
      console.error("❌ No product data");
      return;
    }

    const stockQuantity = product.stock_quantity || 0;
    if (stockQuantity <= 0) {
      setToastMessage(`❌ สินค้า "${product.name}" หมดสต็อกแล้ว`);
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    // ตรวจสอบในตะกร้า
    const cart = getCartFromStorage();
    const existingItem = cart.find((item) => item.id === product.id);
    const currentInCart = existingItem ? existingItem.quantity : 0;

    if (currentInCart + quantity > stockQuantity) {
      setToastMessage(
        `❌ ไม่สามารถเพิ่มได้ สินค้าเหลือ ${stockQuantity} ชิ้น คุณมีในตะกร้า ${currentInCart} ชิ้นแล้ว`
      );
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: quantity,
      });
    }

    const success = setCartToStorage(cart);

    if (success) {
      setToastMessage(
        `✅ เพิ่ม ${product.name} (${quantity} ชิ้น) ลงตะกร้าแล้ว!`
      );
      setTimeout(() => setToastMessage(""), 3000);
    } else {
      setToastMessage("❌ เกิดข้อผิดพลาดในการเพิ่มสินค้า");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const buyNow = () => {
    addToCart();
    navigate("/cart");
  };

  const handleQuantityChange = (newQuantity) => {
    const qty = parseInt(newQuantity);
    const maxStock = product?.stock_quantity || 0;

    if (isNaN(qty) || qty < 1) {
      setQuantity(1);
    } else if (qty > maxStock) {
      setQuantity(maxStock);
    } else {
      setQuantity(qty);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container">
        <div className="error-container">
          <h2>❌ เกิดข้อผิดพลาด</h2>
          <p>{error || "ไม่พบสินค้า"}</p>
          <div className="error-actions">
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              ← กลับ
            </button>
            <Link to="/products" className="btn btn-primary">
              ดูสินค้าทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOutOfStock = (product?.stock_quantity || 0) === 0;
  const mockImages = [
    product.image_url || "/api/placeholder/400/400",
    "/api/placeholder/400/400",
    "/api/placeholder/400/400",
  ];

  return (
    <div className="product-detail">
      {/* Toast Message */}
      {toastMessage && (
        <div className="toast-message success">{toastMessage}</div>
      )}

      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← กลับ
          </button>
          <span className="breadcrumb-separator">/</span>
          <Link to="/products">สินค้าทั้งหมด</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="current">{product.name}</span>
        </nav>

        <div className="product-detail-content">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={mockImages[selectedImage]}
                alt={product.name}
                className="main-product-image"
                onError={(e) => {
                  e.target.src = "/api/placeholder/400/400";
                }}
              />
              {isOutOfStock && (
                <div className="stock-overlay">
                  <span>สินค้าหมด</span>
                </div>
              )}
            </div>
            <div className="image-thumbnails">
              {mockImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail ${
                    selectedImage === index ? "active" : ""
                  }`}
                  onClick={() => setSelectedImage(index)}
                  onError={(e) => {
                    e.target.src = "/api/placeholder/400/400";
                  }}
                />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <h1 className="product-title">{product.name}</h1>
              <div className="product-meta">
                <span className="category">
                  หมวดหมู่: {product.category_name}
                </span>
                <span className="product-id">รหัสสินค้า: #{product.id}</span>
              </div>
            </div>

            <div className="price-section">
              <div className="current-price">{formatPrice(product.price)}</div>{" "}
              <div className="stock-info">
                <span
                  className={`stock-status ${
                    isOutOfStock ? "out-of-stock" : "in-stock"
                  }`}
                >
                  {isOutOfStock
                    ? "❌ สินค้าหมด"
                    : `✅ คงเหลือ ${product.stock_quantity || 0} ชิ้น`}
                </span>
              </div>
            </div>

            <div className="product-description">
              <h3>📝 รายละเอียดสินค้า</h3>
              <div className="description-content">
                {product.description || "ไม่มีรายละเอียดสินค้า"}
              </div>
            </div>

            {!isOutOfStock && (
              <div className="purchase-section">
                <div className="quantity-section">
                  <label>จำนวน:</label>
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn minus"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      min="1"
                      max={product.stock_quantity}
                      className="quantity-input"
                    />
                    <button
                      className="quantity-btn plus"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock_quantity}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="total-price">
                  <span>ราคารวม: </span>
                  <span className="total-amount">
                    {formatPrice(product.price * quantity)}
                    {/* ✅ ใช้ product.price ตรงๆ */}
                  </span>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={addToCart}
                    className="btn btn-secondary btn-lg"
                  >
                    🛒 เพิ่มลงตะกร้า
                  </button>
                  <button onClick={buyNow} className="btn btn-primary btn-lg">
                    💳 ซื้อทันที
                  </button>
                </div>
              </div>
            )}

            {/* Product Features */}
            <div className="product-features">
              <h3>✨ จุดเด่นของสินค้า</h3>
              <ul className="features-list">
                <li>🚚 จัดส่งฟรีทั่วประเทศ</li>
                <li>💳 ชำระเงินผ่าน QR PromptPay</li>
                <li>🔒 รับประกันความปลอดภัย</li>
                <li>📞 บริการลูกค้า 24/7</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
