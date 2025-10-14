import React, { useState, useEffect } from 'react'; // ✅ เพิ่ม useState, useEffect

const ProductCard = ({ product, onAddToCart }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // ✅ เหมือนกับใน ProductManagement.js
  const getImageUrl = () => {
    if (!product.image_url) {
      console.log('❌ No image URL for product:', product.id);
      return null;
    }
    
    let finalUrl;
    
    if (product.image_url.startsWith("http")) {
      finalUrl = product.image_url;
    } else if (product.image_url.startsWith("/uploads/")) {
      finalUrl = `http://localhost:3001${product.image_url}`;
    } else {
      finalUrl = `http://localhost:3001/uploads/products/${product.image_url}`;
    }
    
    // Cache busting
    return `${finalUrl}?t=${product.updated_at || Date.now()}`;
  };

  const handleImageError = (e) => {
    console.error(`❌ ProductList image error:`, {
      product_id: product.id,
      src: e.target.src,
      original_url: product.image_url
    });
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log(`✅ ProductList image loaded:`, {
      product_id: product.id,
      image_url: product.image_url
    });
    setImageError(false);
    setImageLoading(false);
  };

  // Reset state when product changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [product.id, product.image_url]);

  const imageUrl = getImageUrl();

  return (
    <div className="product-card" style={{
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Product Image */}
      <div className="product-image" style={{
        width: '100%',
        height: '200px',
        position: 'relative',
        overflow: 'hidden',
        background: '#f3f4f6'
      }}>
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#9ca3af',
                fontSize: '0.9rem',
                zIndex: 2
              }}>
                🔄 กำลังโหลด...
              </div>
            )}
            
            <img
              key={`${product.id}-${product.updated_at}`}
              src={imageUrl}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: imageLoading ? 'none' : 'block'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
            <div>{imageError ? 'ไม่สามารถโหลดรูปได้' : 'ไม่มีรูปภาพ'}</div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info" style={{
        padding: '1rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#1f2937',
          lineHeight: 1.4
        }}>
          {product.name}
        </h3>

        {product.description && (
          <p style={{
            margin: '0 0 1rem 0',
            fontSize: '0.9rem',
            color: '#6b7280',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1
          }}>
            {product.description}
          </p>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#059669'
          }}>
            ฿{new Intl.NumberFormat('th-TH').format(product.price)}
          </span>

          {product.category_name && (
            <span style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              background: '#f3f4f6',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px'
            }}>
              {product.category_name}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div style={{ marginBottom: '1rem' }}>
          {product.stock_quantity > 0 ? (
            <span style={{
              fontSize: '0.8rem',
              color: product.stock_quantity < 10 ? '#d97706' : '#059669',
              fontWeight: '500'
            }}>
              {product.stock_quantity < 10 ? '⚠️ ' : '✅ '}
              คงเหลือ {product.stock_quantity} ชิ้น
            </span>
          ) : (
            <span style={{
              fontSize: '0.8rem',
              color: '#dc2626',
              fontWeight: '500'
            }}>
              ❌ สินค้าหมด
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart && onAddToCart(product)}
          disabled={product.stock_quantity === 0}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: product.stock_quantity === 0 ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: product.stock_quantity === 0 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (product.stock_quantity > 0) {
              e.target.style.background = '#2563eb';
            }
          }}
          onMouseLeave={(e) => {
            if (product.stock_quantity > 0) {
              e.target.style.background = '#3b82f6';
            }
          }}
        >
          {product.stock_quantity === 0 ? '❌ สินค้าหมด' : '🛒 เพิ่มในตะกร้า'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;