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
  const [imageError, setImageError] = useState(false); // ✅ เพิ่ม state นี้
  const [toastMessage, setToastMessage] = useState("");

  // ✅ เพิ่ม DEFAULT_IMAGE
  const DEFAULT_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xMDAgMTAwSDMwMFYzMDBIMTAwVjEwMFoiIHN0cm9rZT0iI0RERERERCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE3MCIgcj0iMjAiIGZpbGw9IiNEREREREQiLz4KPHBhdGggZD0iTTEzMCAyMDBMMTcwIDI0MEwyMzAgMTgwTDI3MCAyMjBWMjgwSDEzMFYyMDBaIiBmaWxsPSIjRERERUREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LXNpemU9IjE0Ij7guYTguKHguYjguKHguLXguYTguJ/guKXguYzguKPguLnguJc8L3RleHQ+Cjwvc3ZnPgo=";

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

  // ✅ เพิ่มฟังก์ชัน getImageUrl
  const getImageUrl = () => {
    if (imageError || !product?.image_url) {
      return DEFAULT_IMAGE;
    }

    if (product.image_url.startsWith("http")) {
      return product.image_url;
    }

    return `http://localhost:3001${product.image_url}`;
  };

  // ✅ เพิ่มฟังก์ชัน getProductImages
  const getProductImages = () => {
    const baseImage = getImageUrl();
    return [baseImage, baseImage, baseImage];
  };

  // ✅ ตัวแปรที่คำนวณ
  const stockQuantity = parseInt(product?.stock_quantity) || 0;
  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;
  const maxQuantity = Math.min(stockQuantity, 10);
  const productImages = getProductImages();
  const selectedQuantity = quantity; // alias สำหรับความชัดเจน

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

  // ✅ ฟังก์ชัน handleAddToCart ที่เรียบง่าย
  const handleAddToCart = () => {
    if (!product) {
      console.error("❌ No product data");
      return;
    }

    if (isOutOfStock) {
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

  // ✅ ฟังก์ชันจัดการปริมาณ
  const setSelectedQuantity = (newQuantity) => {
    setQuantity(newQuantity);
  };

  const handleQuantityChange = (newQuantity) => {
    const qty = parseInt(newQuantity);

    if (isNaN(qty) || qty < 1) {
      setQuantity(1);
    } else if (qty > maxQuantity) {
      setQuantity(maxQuantity);
    } else {
      setQuantity(qty);
    }
  };

  const buyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  // ✅ Loading state
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

  // ✅ Error state
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

  return (
    <div className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => navigate("/")} className="back-btn">
            หน้าแรก
          </button>
          <span className="breadcrumb-separator">/</span>
          <button onClick={() => navigate("/products")} className="back-btn">
            สินค้าทั้งหมด
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="current">{product.name}</span>
        </nav>

        <div className="product-detail-content">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={getImageUrl()}
                alt={product.name}
                onError={() => setImageError(true)}
                className="main-product-image"
              />

              {/* Stock Badge */}
              {isOutOfStock && (
                <div className="stock-badge out-of-stock">หมดสต็อก</div>
              )}
              {isLowStock && (
                <div className="stock-badge low-stock">เหลือน้อย</div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="image-thumbnails">
              {productImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail ${
                    selectedImage === index ? "active" : ""
                  }`}
                  onClick={() => setSelectedImage(index)}
                  onError={(e) => {
                    e.target.src = DEFAULT_IMAGE;
                  }}
                />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <h1 className="product-title">{product.name}</h1>

              {product.category_name && (
                <div className="product-meta">
                  <span>📂 หมวดหมู่: {product.category_name}</span>
                </div>
              )}
            </div>

            <div className="price-section">
              <div className="current-price">{formatPrice(product.price)}</div>
            </div>

            {/* Stock Status */}
            <div className="stock-info">
              {isOutOfStock ? (
                <div className="stock-status out-of-stock">
                  ❌ สินค้าหมดสต็อก
                </div>
              ) : isLowStock ? (
                <div className="stock-status low-stock">
                  ⚠️ เหลือสินค้าเพียง {stockQuantity} ชิ้น
                </div>
              ) : (
                <div className="stock-status in-stock">
                  ✅ มีสินค้าในสต็อก ({stockQuantity} ชิ้น)
                </div>
              )}
            </div>

            {/* Purchase Section */}
            {!isOutOfStock && (
              <div className="purchase-section">
                <div className="quantity-section">
                  <label>จำนวน:</label>
                  <div className="quantity-controls">
                    <button
                      className={`quantity-btn ${
                        selectedQuantity <= 1 ? "disabled" : ""
                      }`}
                      onClick={() =>
                        setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                      }
                      disabled={selectedQuantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="quantity-input"
                      value={selectedQuantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setSelectedQuantity(
                          Math.min(maxQuantity, Math.max(1, value))
                        );
                      }}
                      min="1"
                      max={maxQuantity}
                    />
                    <button
                      className={`quantity-btn ${
                        selectedQuantity >= maxQuantity ? "disabled" : ""
                      }`}
                      onClick={() =>
                        setSelectedQuantity(
                          Math.min(maxQuantity, selectedQuantity + 1)
                        )
                      }
                      disabled={selectedQuantity >= maxQuantity}
                    >
                      +
                    </button>
                  </div>
                  <small className="form-help">
                    (สูงสุด {maxQuantity} ชิ้น)
                  </small>
                </div>

                {/* Total Price */}
                <div className="total-price">
                  <div className="label">ราคารวม:</div>
                  <div className="total-amount">
                    {formatPrice(product.price * selectedQuantity)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button
                    className={`btn btn-primary btn-lg ${
                      isOutOfStock ? "btn-disabled" : ""
                    }`}
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                  >
                    {isOutOfStock
                      ? "❌ หมดสต็อก"
                      : `🛒 เพิ่ม ${selectedQuantity} ชิ้น ลงตะกร้า`}
                  </button>

                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => navigate("/cart")}
                  >
                    👀 ดูตะกร้าสินค้า
                  </button>
                </div>
              </div>
            )}

            {/* Product Description */}
            {product.description && (
              <div className="product-description">
                <h3>รายละเอียดสินค้า</h3>
                <div className="description-content">
                  <p>{product.description}</p>
                </div>
              </div>
            )}

            {/* Product Features */}
            <div className="product-features">
              <h3>🔥 จุดเด่นของสินค้า</h3>
              <ul className="features-list">
                <li>✅ สินค้าของแท้ 100%</li>
                <li>🚚 จัดส่งฟรีทั่วประเทศ</li>
                <li>🔄 รับประกันคุณภาพ</li>
                <li>💳 ชำระเงินผ่าน PromptPay</li>
                <li>📞 บริการลูกค้า 24/7</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Toast Message */}
        {toastMessage && (
          <div className="toast-message">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;