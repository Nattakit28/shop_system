import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';

// ✅ ย้ายฟังก์ชัน formatCurrency ไปข้างนอก component เพื่อให้ใช้งานได้ทั่วไป
const formatCurrency = (amount) => {
  try {
    const numAmount = parseFloat(amount);
    
    // ตรวจสอบว่าเป็นตัวเลขที่ถูกต้องหรือไม่
    if (isNaN(numAmount)) {
      console.warn('Invalid amount for currency formatting:', amount);
      return '฿0';
    }
    
    // จัดรูปแบบด้วย toLocaleString
    const formatted = numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return `฿${formatted}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `฿${parseFloat(amount) || 0}`;
  }
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  // ✅ ฟังก์ชันจัดการ localStorage อย่างปลอดภัย
  const getCartFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return [];
    }
  };

  const setCartToStorage = (cart) => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  };

  // ✅ ฟังก์ชันดึงราคาจากข้อมูล API เท่านั้น
  const getProductPrice = (productData) => {
    if (!productData) return 0;
    
    // ดึงราคาเฉพาะจากข้อมูล API ที่ได้รับมา
    const possiblePrices = [
      productData.price,
      productData.Price,
      productData.data?.price
    ];
    
    for (const price of possiblePrices) {
      if (price !== undefined && price !== null && !isNaN(parseFloat(price))) {
        return parseFloat(price);
      }
    }
    
    console.warn('⚠️ ไม่พบราคาสินค้าจาก API:', productData);
    return 0; // คืนค่า 0 ถ้าไม่เจอราคา (ไม่ใช้ข้อมูลจำลอง)
  };

  // ✅ Debug ข้อมูลสินค้าเมื่อโหลดเสร็จ
  useEffect(() => {
    if (product) {
      console.log('🔍 === PRODUCT DEBUG ===');
      console.log('Raw Product Object:', product);
      console.log('Product Keys:', Object.keys(product));
      console.log('Product JSON:', JSON.stringify(product, null, 2));
      
      // ตรวจสอบ price ในทุกรูปแบบที่เป็นไปได้
      console.log('🔍 Price Analysis:');
      console.log('- product.price:', product.price, typeof product.price);
      console.log('- product.Price:', product.Price, typeof product.Price);
      console.log('- product.PRICE:', product.PRICE, typeof product.PRICE);
      
      // ตรวจสอบ nested object
      if (product.data) {
        console.log('- product.data:', product.data);
        console.log('- product.data.price:', product.data?.price);
      }
      
      console.log('========================');
    }
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ตรวจสอบว่า id เป็นตัวเลขที่ถูกต้อง
        if (!id || isNaN(id) || parseInt(id) <= 0) {
          setError('รหัสสินค้าไม่ถูกต้อง');
          setLoading(false);
          return;
        }
        
        console.log(`🔍 กำลังดึงข้อมูลสินค้า ID: ${id}`);
        const response = await productAPI.getProduct(id);
        
        console.log('✅ ได้รับข้อมูลสินค้า:', response.data);
        
        // ✅ ตรวจสอบโครงสร้างข้อมูลที่ได้รับ
        console.log('🔍 API Response Structure:');
        console.log('- response:', response);
        console.log('- response.data:', response.data);
        console.log('- response.data type:', typeof response.data);
        
        // ถ้า response.data มี nested object อีกชั้น
        if (response.data && response.data.data) {
          console.log('📦 Found nested data structure');
          setProduct(response.data.data); // ใช้ข้อมูลจาก nested object
        } else {
          setProduct(response.data); // ใช้ข้อมูลจาก response.data ตรงๆ
        }
        
      } catch (err) {
        console.error('❌ Error fetching product:', err);
        
        // จัดการ error แต่ละประเภท
        if (err.response) {
          const status = err.response.status;
          const errorMessage = err.response.data?.message || err.response.data?.error;
          
          switch (status) {
            case 400:
              setError('ข้อมูลสินค้าไม่ถูกต้อง');
              break;
            case 404:
              setError('ไม่พบสินค้าที่ต้องการ');
              break;
            case 500:
              setError(`เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: ${errorMessage || 'กรุณาลองใหม่อีกครั้ง'}`);
              console.error('Server Error Details:', err.response.data);
              break;
            default:
              setError(`เกิดข้อผิดพลาด (${status}): ${errorMessage || 'ไม่สามารถโหลดข้อมูลสินค้าได้'}`);
          }
        } else if (err.request) {
          if (!navigator.onLine) {
            setError('ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อ');
          } else {
            setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
          }
        } else {
          setError('เกิดข้อผิดพลาดไม่ทราบสาเหตุ');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    } else {
      setError('ไม่พบรหัสสินค้า');
      setLoading(false);
    }
  }, [id]);

  const retryFetch = () => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productAPI.getProduct(id);
        setProduct(response.data);
      } catch (err) {
        setError('ยังคงไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  };

  // ✅ ปรับปรุงฟังก์ชัน addToCart
  const addToCart = () => {
    if (!product) {
      console.error('❌ No product data to add to cart');
      return;
    }
    
    // ✅ ตรวจสอบข้อมูลสินค้าก่อนเพิ่มลงตะกร้า
    const productPrice = getProductPrice(product);
    const productName = product.name || 'สินค้าไม่ระบุชื่อ';
    const productId = product.id;
    
    if (!productId) {
      console.error('❌ Product ID is missing');
      setToastMessage('เกิดข้อผิดพลาด: ไม่พบรหัสสินค้า');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    
    if (productPrice <= 0) {
      console.error('❌ Product price is invalid:', productPrice);
      setToastMessage('เกิดข้อผิดพลาด: ราคาสินค้าไม่ถูกต้อง');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    
    console.log('🛒 Adding to cart:', {
      id: productId,
      name: productName,
      price: productPrice,
      quantity: quantity,
      image_url: product.image_url
    });
    
    const cart = getCartFromStorage();
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      console.log('📦 Updated existing item quantity:', existingItem);
    } else {
      const newItem = {
        id: productId,
        name: productName,
        price: productPrice,
        image_url: product.image_url || '/api/placeholder/100/100',
        quantity: quantity
      };
      cart.push(newItem);
      console.log('📦 Added new item to cart:', newItem);
    }
    
    const success = setCartToStorage(cart);
    
    if (success) {
      setToastMessage(`เพิ่ม ${productName} (${quantity} ชิ้น) ลงในตะกร้าแล้ว!`);
      setTimeout(() => setToastMessage(''), 3000);
      console.log('✅ Cart updated successfully');
    } else {
      setToastMessage('เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า');
      setTimeout(() => setToastMessage(''), 3000);
      console.error('❌ Failed to save cart to localStorage');
    }
  };

  const buyNow = () => {
    addToCart();
    navigate('/cart');
  };

  // ✅ ปรับปรุงการ validate quantity
  const handleQuantityChange = (newQuantity) => {
    const qty = parseInt(newQuantity);
    
    if (isNaN(qty) || qty < 1) {
      setQuantity(1);
    } else if (qty > product?.stock_quantity) {
      setQuantity(product.stock_quantity);
    } else {
      setQuantity(qty);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูลสินค้า...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>เกิดข้อผิดพลาด</h2>
          <p>{error || 'ไม่พบสินค้า'}</p>
          
          {/* Debug information - ควรลบออกใน production */}
          <div className="debug-info" style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            margin: '10px 0', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            <p><strong>Product ID:</strong> {id}</p>
            <p><strong>Online Status:</strong> {navigator.onLine ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        
        <div className="error-actions">
          <button onClick={retryFetch} className="btn btn-secondary">
            🔄 ลองใหม่
          </button>
          <button onClick={() => navigate('/products')} className="btn btn-primary">
            กลับไปดูสินค้าทั้งหมด
          </button>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            ← กลับหน้าที่แล้ว
          </button>
        </div>
      </div>
    );
  }

  const isOutOfStock = (product?.stock_quantity || 0) === 0;
  const mockImages = [
    product.image_url || '/api/placeholder/400/400',
    '/api/placeholder/400/400',
    '/api/placeholder/400/400'
  ];

  return (
    <div className="product-detail">
      {/* ✅ Toast Message */}
      {toastMessage && (
        <div className="toast-message success">
          {toastMessage}
        </div>
      )}
      
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← กลับ
          </button>
          <span className="breadcrumb-separator">/</span>
          <span>สินค้าทั้งหมด</span>
          <span className="breadcrumb-separator">/</span>
          <span>{product.category_name}</span>
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
                  e.target.src = '/api/placeholder/400/400';
                }}
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
            <div className="image-thumbnails">
              {mockImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                  onError={(e) => {
                    e.target.src = '/api/placeholder/400/400';
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
                <span className="category">หมวดหมู่: {product.category_name}</span>
                <span className="product-id">รหัสสินค้า: #{product.id}</span>
              </div>
            </div>

            <div className="price-section">
              {/* ✅ ใช้ฟังก์ชัน getProductPrice แทน */}
              <div className="current-price">{formatCurrency(getProductPrice(product))}</div>
              <div className="stock-info">
                <span className={`stock-status ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                  {isOutOfStock ? '❌ สินค้าหมด' : `✅ คงเหลือ ${product.stock_quantity || 0} ชิ้น`}
                </span>
              </div>
            </div>
            
            <div className="product-description">
              <h3>📝 รายละเอียดสินค้า</h3>
              <div className="description-content">
                {product.description || 'ไม่มีรายละเอียดสินค้า'}
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
                    {/* ✅ ใช้ฟังก์ชัน getProductPrice แทน */}
                    {formatCurrency(getProductPrice(product) * quantity)}
                  </span>
                </div>
                
                <div className="action-buttons">
                  <button 
                    onClick={addToCart}
                    className="btn btn-secondary btn-lg"
                  >
                    🛒 เพิ่มลงตะกร้า
                  </button>
                  <button 
                    onClick={buyNow}
                    className="btn btn-primary btn-lg"
                  >
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

        {/* Additional Info */}
        <div className="additional-info">
          <div className="info-tabs">
            <div className="tab-content">
              <div className="shipping-info">
                <h3>🚚 ข้อมูลการจัดส่ง</h3>
                <ul>
                  <li>จัดส่งทั่วประเทศไทย</li>
                  <li>ใช้เวลา 2-3 วันทำการ</li>
                  <li>ฟรีค่าจัดส่งสำหรับยอดซื้อขั้นต่ำ 500 บาท</li>
                  <li>รับสินค้าได้ที่หน้าบ้าน</li>
                </ul>
              </div>
              
              <div className="return-policy">
                <h3>🔄 นโยบายการคืนสินค้า</h3>
                <ul>
                  <li>สามารถคืนสินค้าได้ภายใน 7 วัน</li>
                  <li>สินค้าต้องอยู่ในสภาพเดิม</li>
                  <li>ติดต่อทีมงานก่อนส่งคืนสินค้า</li>
                  <li>ค่าขนส่งคืนเป็นภาระของลูกค้า</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;