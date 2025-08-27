import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CartComponent from '../components/Cart';

// ✅ ฟังก์ชัน formatCurrency ที่แก้ไขแล้ว
const formatCurrency = (amount) => {
  try {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount === 0) {
      console.warn('Invalid or zero amount for currency formatting:', amount);
      return '฿0';
    }
    
    const formatted = numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return `฿${formatted}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `฿0`;
  }
};

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);

  // ✅ ฟังก์ชันทำความสะอาดข้อมูลตะกร้า - ใช้เฉพาะข้อมูลจาก database
  const cleanCartData = (cart) => {
    console.log('🧹 Raw cart data from localStorage:', cart);
    
    const cleaned = cart.map((item, index) => {
      console.log(`🔍 Processing cart item ${index + 1}:`, item);
      
      // ตรวจสอบราคาเฉพาะจากข้อมูลที่มีอยู่
      let price = 0;
      
      if (item.price && !isNaN(parseFloat(item.price))) {
        price = parseFloat(item.price);
      } else if (item.Price && !isNaN(parseFloat(item.Price))) {
        price = parseFloat(item.Price);
      } else if (item.originalPrice && !isNaN(parseFloat(item.originalPrice))) {
        price = parseFloat(item.originalPrice);
      } else {
        console.warn('⚠️ ไม่พบราคาสำหรับสินค้า:', item);
        // ไม่กำหนดราคาเริ่มต้น ให้เป็น 0 และจะแสดง warning
        price = 0;
      }
      
      // ตรวจสอบชื่อสินค้า - ใช้เฉพาะข้อมูลที่มีอยู่
      let name = item.name;
      if (!name || name === 'undefined' || name === '') {
        console.warn('⚠️ ไม่พบชื่อสินค้า:', item);
        name = 'สินค้าไม่ระบุชื่อ'; // ใช้ชื่อเริ่มต้นเท่านั้น
      }
      
      const cleanedItem = {
        ...item,
        id: item.id,
        name: name,
        price: price,
        quantity: parseInt(item.quantity) || 1,
        image_url: item.image_url || '/api/placeholder/100/100'
      };
      
      console.log('✅ Cleaned item:', cleanedItem);
      return cleanedItem;
    });
    
    return cleaned;
  };

  useEffect(() => {
    const loadCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // ✅ ทำความสะอาดข้อมูลก่อนใช้งาน
        const cleanedCart = cleanCartData(cart);
        
        console.log('🛒 Loading cart:', cleanedCart);
        setCartItems(cleanedCart);
        
        // บันทึกข้อมูลที่ทำความสะอาดแล้วกลับไป localStorage
        if (cleanedCart.length > 0) {
          localStorage.setItem('cart', JSON.stringify(cleanedCart));
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems([]);
      }
    };
    
    loadCart();
    
    // Listen for cart updates
    window.addEventListener('cartUpdated', loadCart);
    
    return () => {
      window.removeEventListener('cartUpdated', loadCart);
    };
  }, []);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) return;
    
    const updatedCart = cartItems.map(item =>
      item.id === productId ? { ...item, quantity: parseInt(newQuantity) } : item
    );
    
    const cleanedCart = cleanCartData(updatedCart);
    
    setCartItems(cleanedCart);
    localStorage.setItem('cart', JSON.stringify(cleanedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId) => {
    const updatedCart = cartItems.filter(item => item.id !== productId);
    const cleanedCart = cleanCartData(updatedCart);
    
    setCartItems(cleanedCart);
    localStorage.setItem('cart', JSON.stringify(cleanedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    // ✅ ใช้ React state แทน DOM manipulation
    showToastMessage('ลบสินค้าออกจากตะกร้าแล้ว');
  };

  // ✅ ฟังก์ชันแสดง toast message
  const showToastMessage = (message) => {
    // ใช้ setTimeout เพื่อให้ React re-render
    const toastDiv = document.createElement('div');
    toastDiv.className = 'toast-message info';
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
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะล้างตะกร้าสินค้าทั้งหมด?')) {
      setCartItems([]);
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      showToastMessage('ล้างตะกร้าสินค้าแล้ว');
    }
  };

  // ✅ คำนวณยอดรวม
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  };

  // ✅ Debug cart items เพื่อหาสาเหตุราคาเป็น 0
  useEffect(() => {
    if (cartItems.length > 0) {
      console.log('🔍 === CART DEBUG ===');
      console.log('Raw cartItems from localStorage:', JSON.parse(localStorage.getItem('cart') || '[]'));
      
      cartItems.forEach((item, index) => {
        console.log(`🛒 Cart Item ${index + 1}:`, {
          id: item.id,
          name: item.name,
          price: item.price,
          priceType: typeof item.price,
          allItemData: item,
          quantity: item.quantity,
          quantityType: typeof item.quantity,
          subtotal: item.price * item.quantity
        });
      });
      console.log('📊 Total calculated:', calculateTotal());
      console.log('💰 Total formatted:', formatCurrency(calculateTotal()));
      console.log('==================');
    }
  }, [cartItems]);

  // ✅ ลบฟังก์ชัน quickRepair ที่ใช้ข้อมูลจำลอง
  const clearCorruptedCart = () => {
    if (window.confirm('ล้างข้อมูลตะกร้าที่เสียหายและเริ่มใหม่?\n(จะลบข้อมูลทั้งหมดใน localStorage)')) {
      // ลบข้อมูลตะกร้าทั้งหมด
      localStorage.removeItem('cart');
      setCartItems([]);
      showToastMessage('ล้างข้อมูลตะกร้าเรียบร้อยแล้ว กรุณาเพิ่มสินค้าใหม่');
      console.log('🗑️ Cleared all cart data');
      
      // Force reload หน้า
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  // ✅ ฟังก์ชันซ่อมราคาโดยดึงข้อมูลจาก API
  const repairCartPrices = async () => {
    if (cartItems.length === 0) {
      showToastMessage('ไม่มีสินค้าในตะกร้าให้ซ่อม');
      return;
    }

    console.log('🔧 Attempting to repair cart prices from API...');
    showToastMessage('กำลังซ่อมราคาจาก database...');
    
    try {
      const repairedCart = [];
      
      for (const item of cartItems) {
        if (item.id && !isNaN(item.id)) {
          try {
            // ดึงข้อมูลสินค้าจาก API
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/products/${item.id}`);
            
            if (response.ok) {
              const productData = await response.json();
              const product = productData.data || productData;
              
              console.log(`🔧 Found product data for ID ${item.id}:`, product);
              
              repairedCart.push({
                ...item,
                name: product.name || item.name,
                price: parseFloat(product.price) || item.price,
                image_url: product.image_url || item.image_url
              });
            } else {
              console.warn(`⚠️ Product ID ${item.id} not found in database`);
              repairedCart.push(item); // เก็บข้อมูลเดิม
            }
          } catch (error) {
            console.error(`❌ Error fetching product ${item.id}:`, error);
            repairedCart.push(item); // เก็บข้อมูลเดิม
          }
        } else {
          console.warn(`⚠️ Invalid product ID: ${item.id}`);
          repairedCart.push(item); // เก็บข้อมูลเดิม
        }
      }
      
      if (repairedCart.length > 0) {
        setCartItems(repairedCart);
        localStorage.setItem('cart', JSON.stringify(repairedCart));
        console.log('✅ Cart prices repaired from database');
        showToastMessage('ซ่อมราคาจาก database เรียบร้อยแล้ว!');
      } else {
        showToastMessage('ไม่สามารถซ่อมราคาได้');
      }
    } catch (error) {
      console.error('❌ Error during cart repair:', error);
      showToastMessage('เกิดข้อผิดพลาดในการซ่อมราคา');
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* ✅ ปุ่มซ่อมราคาจาก API */}
            <button 
              onClick={repairCartPrices} 
              className="btn btn-warning btn-sm"
              title="ซ่อมราคาจากฐานข้อมูล"
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              🔧 ซ่อมจาก DB
            </button>
            
            {/* ✅ ปุ่มล้างข้อมูลเสีย */}
            <button 
              onClick={clearCorruptedCart} 
              className="btn btn-danger btn-sm"
              title="ล้างข้อมูลตะกร้าทั้งหมดและเริ่มใหม่"
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              🗑️ ล้างทั้งหมด
            </button>
            
            <button 
              onClick={clearCart} 
              className="btn btn-outline btn-sm"
              style={{ fontSize: '12px', padding: '4px 8px' }}
            >
              🗑️ ล้างตะกร้า
            </button>
          </div>
        </div>
        
        <div className="cart-content">
          {/* ✅ ใช้ CartComponent เดิม แต่เพิ่ม key และ props ที่จำเป็น */}
          <CartComponent
            key={`cart-${cartItems.length}-${Date.now()}`} // เพิ่ม unique key
            cartItems={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            showTitle={false}
            formatCurrency={formatCurrency} // ส่งฟังก์ชัน formatCurrency
          />
          
          {/* ✅ แสดงยอดรวมแยกต่างหาก */}
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              borderTop: '2px solid #dee2e6',
              paddingTop: '15px'
            }}>
              ยอดรวมทั้งหมด: <span style={{ color: '#dc3545', fontSize: '24px' }}>
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
          
          <div className="cart-actions" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            paddingTop: '20px'
          }}>
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