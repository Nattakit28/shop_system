import React, { memo, useMemo, useCallback } from "react";

const CartComponent = memo(
  ({
    cartItems,
    onUpdateQuantity,
    onRemoveItem,
    showTitle = true,
    formatCurrency,
    stockInfo = {},
    loadingStock = false,
  }) => {
    console.log("🔄 CartComponent render:", cartItems.length, "items");

    const totalPrice = useMemo(() => {
      return cartItems.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return total + price * quantity;
      }, 0);
    }, [cartItems]);

    const totalQuantity = useMemo(() => {
      return cartItems.reduce(
        (total, item) => total + (parseInt(item.quantity) || 0),
        0
      );
    }, [cartItems]);

    if (cartItems.length === 0) {
      return (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h3>ตะกร้าสินค้าว่างเปล่า</h3>
          <p>ยังไม่มีสินค้าในตะกร้า เริ่มช้อปปิ้งกันเลย!</p>
        </div>
      );
    }

    return (
      <div className="cart-component">
        {showTitle && <h2>ตะกร้าสินค้า ({cartItems.length} รายการ)</h2>}

        {loadingStock && (
          <div className="stock-loading">
            <div className="loading-spinner-small"></div>
            <span>กำลังโหลดข้อมูลสต็อก...</span>
          </div>
        )}

        <div className="cart-items">
          {cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              formatCurrency={formatCurrency}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              stockInfo={stockInfo[item.id]}
              loadingStock={loadingStock}
            />
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>จำนวนรายการ:</span>
            <span>{cartItems.length} รายการ</span>
          </div>
          <div className="summary-row">
            <span>จำนวนชิ้น:</span>
            <span>{totalQuantity} ชิ้น</span>
          </div>
          <div className="summary-row total">
            <span>ยอดรวมทั้งหมด:</span>
            <span className="total-price">{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </div>
    );
  }
);

const CartItem = memo(
  ({
    item,
    formatCurrency,
    onUpdateQuantity,
    onRemoveItem,
    stockInfo,
    loadingStock,
  }) => {
    console.log("🔄 CartItem render:", item.id, item.name);

    const availableStock = stockInfo?.available || 0;
    const isStockLoaded = stockInfo !== undefined;
    const canIncrease = isStockLoaded && item.quantity < availableStock;
    const isAtMaxStock = isStockLoaded && item.quantity >= availableStock;
    const isLowStock = isStockLoaded && availableStock <= 5;
    const isOutOfStock = availableStock === 0;

    const itemTotal = useMemo(() => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return price * quantity;
    }, [item.price, item.quantity]);

    const handleQuantityDecrease = useCallback(() => {
      if (item.quantity > 1) {
        onUpdateQuantity(item.id, item.quantity - 1);
      }
    }, [item.id, item.quantity, onUpdateQuantity]);

    const handleQuantityIncrease = useCallback(() => {
      if (canIncrease) {
        onUpdateQuantity(item.id, item.quantity + 1);
      }
    }, [item.id, item.quantity, onUpdateQuantity, canIncrease]);

    const handleRemove = useCallback(() => {
      onRemoveItem(item.id);
    }, [item.id, onRemoveItem]);

    const getImageUrl = () => {
      if (!item.image_url) {
        return "/api/placeholder/80/80";
      }
      if (item.image_url.startsWith("http")) {
        return item.image_url;
      }
      return `http://localhost:3001${item.image_url}`;
    };

    return (
      <div className={`cart-item ${isOutOfStock ? "out-of-stock" : ""}`}>
        <div className="item-image">
          <img
            src={getImageUrl()}
            alt={item.name}
            onError={(e) => {
              e.target.src = "/api/placeholder/80/80";
            }}
          />

          {/* ✅ Stock badge */}
          {isStockLoaded && (
            <div
              className={`stock-badge ${
                isOutOfStock
                  ? "out-of-stock"
                  : isLowStock
                  ? "low-stock"
                  : "in-stock"
              }`}
            >
              {isOutOfStock ? "❌" : isLowStock ? "⚠️" : "✅"} {availableStock}
            </div>
          )}
        </div>

        <div className="item-details">
          <h4 className="item-name">{item.name}</h4>
          <div className="item-price">{formatCurrency(item.price)} / ชิ้น</div>

          {/* ✅ Stock information */}
          {isStockLoaded && (
            <div className="stock-info">
              {isOutOfStock ? (
                <span className="stock-status out-of-stock">❌ สินค้าหมด</span>
              ) : isAtMaxStock ? (
                <span className="stock-status max-reached">
                  🚫 จำนวนสูงสุดแล้ว
                </span>
              ) : isLowStock ? (
                <span className="stock-status low-stock">
                  ⚠️ เหลือ {availableStock - item.quantity} ชิ้น
                </span>
              ) : (
                <span className="stock-status in-stock">
                  ✅ เพิ่มได้อีก {availableStock - item.quantity} ชิ้น
                </span>
              )}
            </div>
          )}

          {loadingStock && !isStockLoaded && (
            <div className="stock-loading-item">
              <div className="loading-spinner-mini"></div>
              <span>โหลดสต็อก...</span>
            </div>
          )}
        </div>

        <div className="quantity-controls">
          <button
            className="quantity-btn minus"
            onClick={handleQuantityDecrease}
            disabled={item.quantity <= 1}
            aria-label="ลดจำนวน"
            title={item.quantity <= 1 ? "ไม่สามารถลดได้อีก" : "ลดจำนวน"}
          >
            −
          </button>

          <span className="quantity">{item.quantity}</span>

          <button
            className={`quantity-btn plus ${
              !canIncrease && isStockLoaded ? "disabled" : ""
            }`}
            onClick={handleQuantityIncrease}
            disabled={!canIncrease && isStockLoaded}
            aria-label="เพิ่มจำนวน"
            title={
              !isStockLoaded
                ? "กำลังโหลดข้อมูลสต็อก..."
                : isOutOfStock
                ? "สินค้าหมดสต็อก"
                : isAtMaxStock
                ? `จำนวนสูงสุดแล้ว (${availableStock} ชิ้น)`
                : `เพิ่มจำนวน (เหลือ ${availableStock - item.quantity} ชิ้น)`
            }
          >
            +
          </button>
        </div>

        <div className="item-total">{formatCurrency(itemTotal)}</div>

        <button
          className="remove-btn"
          onClick={handleRemove}
          aria-label={`ลบ ${item.name} ออกจากตะกร้า`}
          title="ลบสินค้า"
        >
          🗑️
        </button>
      </div>
    );
  }
);

CartComponent.displayName = "CartComponent";
CartItem.displayName = "CartItem";

export default CartComponent;