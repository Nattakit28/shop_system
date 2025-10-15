import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/promptpay";

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const getImageUrl = () => {
    if (imageError || !product.image_url) {
      return "/images/no-image.png";
    }

    if (product.image_url.startsWith("http")) {
      return product.image_url;
    }

    return `http://localhost:3001${product.image_url}`;
  };

  // ✅ ตรวจสอบสต็อก
  const stockQuantity = product.stock_quantity || 0;
  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;

  // ✅ การจัดการ Add to Cart ที่ตรวจสอบสต็อก
  const handleAddToCart = () => {
    if (isOutOfStock) {
      alert(`❌ สินค้า "${product.name}" หมดสต็อกแล้ว`);
      return;
    }

    // ตรวจสอบว่าในตะกร้ามีสินค้านี้แล้วกี่ชิ้น
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = existingCart.find((item) => item.id === product.id);
    const currentInCart = existingItem ? existingItem.quantity : 0;

    if (currentInCart >= stockQuantity) {
      alert(
        `❌ ไม่สามารถเพิ่มได้อีก\nสินค้า "${product.name}" มีในสต็อกเหลือ ${stockQuantity} ชิ้น\nและคุณมีในตะกร้าแล้ว ${currentInCart} ชิ้น`
      );
      return;
    }

    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleViewDetails = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="product-card">
      {/* Product Image */}
      <div className="product-image">
        {imageLoading && (
          <div className="image-loading">
            <div className="loading-spinner"></div>
          </div>
        )}

        <img
          src={getImageUrl()}
          alt={product.name}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoading ? "none" : "block" }}
        />

        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="stock-badge out-of-stock">หมดสต็อก</div>
        )}
        {isLowStock && <div className="stock-badge low-stock">เหลือน้อย</div>}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>

        <div className="product-details">
          <div className="product-price">{formatCurrency(product.price)}</div>

          {/* ✅ แสดงจำนวนสต็อก */}
          <div className="product-stock">
            {isOutOfStock ? (
              <span className="stock-status out-of-stock">❌ หมดสต็อก</span>
            ) : isLowStock ? (
              <span className="stock-status low-stock">
                ⚠️ เหลือ {stockQuantity} ชิ้น
              </span>
            ) : (
              <span className="stock-status in-stock">
                ✅ มีสินค้า ({stockQuantity} ชิ้น)
              </span>
            )}
          </div>

          {product.category_name && (
            <div className="product-category">📂 {product.category_name}</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="product-actions">
          {/* ✅ ใช้ React Router Navigation */}
          <button
            className="btn btn-outline btn-sm"
            onClick={handleViewDetails}
          >
            👁️ ดูรายละเอียด
          </button>

          {/* ✅ ปุ่ม Add to Cart ที่ตรวจสอบสต็อก */}
          <button
            className={`btn btn-sm ${
              isOutOfStock ? "btn-disabled" : "btn-primary"
            }`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? "❌ หมดสต็อก" : "🛒 เพิ่มในตะกร้า"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
