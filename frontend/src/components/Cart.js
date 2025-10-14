import React from "react";

const formatCurrency = (amount) => {
  try {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount === 0) {
      return "฿0";
    }

    const formatted = numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return `฿${formatted}`;
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `฿0`;
  }
};

const CartComponent = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  showTitle = true,
  formatCurrency: formatCurrencyProp,
}) => {
  const formatPrice = formatCurrencyProp || formatCurrency;

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

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

      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="item-image">
              <img
                src={item.image_url || "/api/placeholder/80/80"}
                alt={item.name}
              />
            </div>

            <div className="item-details">
              <h4 className="item-name">{item.name}</h4>
              <p className="item-price">{formatPrice(item.price)}</p>
            </div>

            <div className="quantity-controls">
              <button
                className="quantity-btn minus"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                −
              </button>
              <span className="quantity">{item.quantity}</span>
              <button
                className="quantity-btn plus"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>

            <div className="item-total">
              {formatCurrency(item.price * item.quantity)}
            </div>

            <button
              className="remove-btn"
              onClick={() => onRemoveItem(item.id)}
              aria-label="ลบสินค้า"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>จำนวนรายการ:</span>
          <span>{cartItems.length} รายการ</span>
        </div>
        <div className="summary-row">
          <span>จำนวนชิ้น:</span>
          <span>
            {cartItems.reduce((total, item) => total + item.quantity, 0)} ชิ้น
          </span>
        </div>
        <div className="summary-row total">
          <span>ยอดรวมทั้งหมด:</span>
          <span className="total-price">{formatCurrency(getTotalPrice())}</span>
        </div>
      </div>
    </div>
  );
};

export default CartComponent;
