import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/promptpay';

const ProductCard = ({ product, showActions = true }) => {
  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch event to update cart count
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Show success message
    const message = document.createElement('div');
    message.className = 'toast-message success';
    message.textContent = 'เพิ่มสินค้าลงในตะกร้าแล้ว!';
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  };

  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-image">
          <img 
            src={product.image_url || '/api/placeholder/250/200'} 
            alt={product.name}
            loading="lazy"
          />
          {product.is_featured && (
            <span className="featured-badge">⭐ แนะนำ</span>
          )}
          {isOutOfStock && (
            <div className="stock-overlay">
              <span>สินค้าหมด</span>
            </div>
          )}
        </div>
        
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-price">{formatCurrency(product.price)}</p>
          {product.category_name && (
            <p className="product-category">{product.category_name}</p>
          )}
          <div className="product-stock">
            คงเหลือ: {product.stock_quantity} ชิ้น
          </div>
        </div>
      </Link>
      
      {showActions && (
        <div className="product-actions">
          <Link 
            to={`/product/${product.id}`}
            className="btn btn-secondary btn-sm"
          >
            ดูรายละเอียด
          </Link>
          <button 
            onClick={addToCart}
            className="btn btn-primary btn-sm"
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;