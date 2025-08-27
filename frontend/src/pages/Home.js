import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, publicAPI, getAPIStatus } from '../services/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ตรวจสอบสถานะ API
        const status = getAPIStatus();
        setApiStatus(status);
        
        console.log('🏠 เริ่มโหลดข้อมูลหน้าแรก...');
        console.log('📊 สถานะ API:', status);
        
        // โหลดข้อมูลแบบขนาน
        const [productsResponse, categoriesResponse] = await Promise.all([
          productAPI.getFeaturedProducts(),
          publicAPI.getCategories()
        ]);
        
        console.log('📦 ข้อมูลสินค้าแนะนำ:', productsResponse);
        console.log('📂 ข้อมูลหมวดหมู่:', categoriesResponse);
        
        // ประมวลผลข้อมูลสินค้าแนะนำ
        let productsData = [];
        if (productsResponse?.data) {
          productsData = Array.isArray(productsResponse.data) 
            ? productsResponse.data 
            : productsResponse.data.data || productsResponse.data.products || [];
        }
        
        // ประมวลผลข้อมูลหมวดหมู่
        let categoriesData = [];
        if (categoriesResponse?.data) {
          categoriesData = Array.isArray(categoriesResponse.data) 
            ? categoriesResponse.data 
            : categoriesResponse.data.data || categoriesResponse.data.categories || [];
        }
        
        console.log('✅ ประมวลผลข้อมูลเสร็จสิ้น');
        console.log(`📦 สินค้าแนะนำ: ${productsData.length} รายการ`);
        console.log(`📂 หมวดหมู่: ${categoriesData.length} รายการ`);
        
        setFeaturedProducts(productsData);
        setCategories(categoriesData);
        
      } catch (err) {
        console.error('❌ เกิดข้อผิดพลาดในการโหลดข้อมูล:', err);
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // แสดงหน้าโหลด
  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '50vh',
        gap: '20px'
      }}>
        <div className="loading-spinner" style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 2s linear infinite'
        }}></div>
        <p style={{ fontSize: '18px', color: '#666' }}>กำลังโหลดข้อมูล...</p>
        {apiStatus && (
          <p style={{ fontSize: '14px', color: '#999' }}>
            โหมด: {apiStatus.mode === 'online' ? 'ออนไลน์' : 'ออฟไลน์ (ข้อมูลจำลอง)'}
          </p>
        )}
      </div>
    );
  }

  // แสดงข้อผิดพลาด
  if (error) {
    return (
      <div className="error-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: '20px',
        padding: '20px'
      }}>
        <div className="error-message" style={{
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          padding: '20px',
          color: '#d00',
          textAlign: 'center'
        }}>
          <h3>เกิดข้อผิดพลาด</h3>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="home">
      {/* แสดงสถานะ API (เฉพาะในโหมดพัฒนา) */}
      {process.env.NODE_ENV === 'development' && apiStatus && (
        <div style={{
          background: apiStatus.mode === 'online' ? '#d4edda' : '#fff3cd',
          border: `1px solid ${apiStatus.mode === 'online' ? '#c3e6cb' : '#ffeaa7'}`,
          color: apiStatus.mode === 'online' ? '#155724' : '#856404',
          padding: '10px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          🔧 โหมดพัฒนา: ใช้ข้อมูล{apiStatus.mode === 'online' ? 'จาก API จริง' : 'จำลอง (Mock Data)'}
        </div>
      )}

      {/* Hero Banner */}
      <section className="hero" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 0',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div className="hero-content">
            <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '20px', fontWeight: 'bold' }}>
              ยินดีต้อนรับสู่ร้านออนไลน์ของเรา
            </h1>
            <p className="hero-subtitle" style={{ fontSize: '1.2rem', marginBottom: '40px', opacity: 0.9 }}>
              ช้อปสินค้าคุณภาพดี ราคาสุดคุ้ม พร้อมส่งถึงบ้านคุณ<br />
              รองรับการชำระเงินผ่าน QR PromptPay
            </p>
            <div className="hero-actions" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link 
                to="/products" 
                className="btn btn-primary btn-lg"
                style={{
                  background: 'white',
                  color: '#667eea',
                  padding: '15px 30px',
                  borderRadius: '50px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  border: 'none',
                  fontSize: '18px'
                }}
              >
                🛍️ เริ่มช้อปปิ้ง
              </Link>
              <a 
                href="#featured" 
                className="btn btn-secondary btn-lg"
                style={{
                  background: 'transparent',
                  color: 'white',
                  padding: '15px 30px',
                  borderRadius: '50px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  border: '2px solid white',
                  fontSize: '18px'
                }}
              >
                📦 ดูสินค้าแนะนำ
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" style={{ padding: '60px 0', background: '#f8f9fa' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div className="features-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '30px' 
          }}>
            {[
              { icon: '🚚', title: 'จัดส่งฟรี', desc: 'จัดส่งฟรีทั่วประเทศ สำหรับยอดซื้อขั้นต่ำ 500 บาท' },
              { icon: '💳', title: 'PromptPay', desc: 'ชำระเงินง่าย รวดเร็ว ปลอดภัย ด้วย QR Code' },
              { icon: '🔒', title: 'ปลอดภัย', desc: 'ระบบการสั่งซื้อที่ปลอดภัย รับประกันความเป็นส่วนตัว' },
              { icon: '⭐', title: 'คุณภาพ', desc: 'สินค้าคุณภาพดี ผ่านการคัดสรรมาอย่างดี' }
            ].map((feature, index) => (
              <div key={index} className="feature-card" style={{
                background: 'white',
                padding: '30px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease'
              }}>
                <div className="feature-icon" style={{ fontSize: '3rem', marginBottom: '15px' }}>
                  {feature.icon}
                </div>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>{feature.title}</h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories" style={{ padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '15px', color: '#333' }}>หมวดหมู่สินค้า</h2>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>เลือกช้อปตามหมวดหมู่ที่คุณสนใจ</p>
          </div>
          
          <div className="category-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '25px' 
          }}>
            {categories.length > 0 ? (
              categories.map(category => (
                <Link 
                  key={category.id} 
                  to={`/products?category=${category.id}`}
                  className="category-card"
                  style={{
                    display: 'block',
                    background: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    border: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                  }}
                >
                  <div className="category-icon" style={{ fontSize: '3rem', marginBottom: '15px' }}>
                    {category.icon}
                  </div>
                  <h3 style={{ marginBottom: '10px', color: '#333', fontSize: '1.2rem' }}>
                    {category.name}
                  </h3>
                  <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.9rem' }}>
                    {category.description}
                  </p>
                  <span className="category-count" style={{ 
                    background: '#667eea', 
                    color: 'white', 
                    padding: '5px 15px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem',
                    display: 'inline-block'
                  }}>
                    {category.product_count || 0} สินค้า
                  </span>
                </Link>
              ))
            ) : (
              <div className="empty-categories" style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '40px',
                color: '#666'
              }}>
                <p style={{ fontSize: '1.1rem' }}>ไม่มีหมวดหมู่สินค้าในขณะนี้</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="featured-products" style={{ padding: '60px 0', background: '#f8f9fa' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '15px', color: '#333' }}>⭐ สินค้าแนะนำ</h2>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>สินค้าคุณภาพดีที่เราคัดสรรมาให้คุณโดยเฉพาะ</p>
          </div>
          
          {featuredProducts.length > 0 ? (
            <>
              <div className="product-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '30px',
                marginBottom: '40px'
              }}>
                {featuredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="section-footer" style={{ textAlign: 'center' }}>
                <Link 
                  to="/products" 
                  className="btn btn-outline"
                  style={{
                    display: 'inline-block',
                    padding: '12px 30px',
                    border: '2px solid #667eea',
                    color: '#667eea',
                    textDecoration: 'none',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#667eea';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#667eea';
                  }}
                >
                  ดูสินค้าทั้งหมด
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-products" style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'white',
              borderRadius: '15px',
              border: '2px dashed #ddd'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</div>
              <p style={{ fontSize: '1.2rem', marginBottom: '25px', color: '#666' }}>
                ยังไม่มีสินค้าแนะนำในขณะนี้
              </p>
              <Link 
                to="/products" 
                className="btn btn-primary"
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '12px 30px',
                  textDecoration: 'none',
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  border: 'none'
                }}
              >
                ดูสินค้าทั้งหมด
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter" style={{ 
        padding: '60px 0', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div className="newsletter-content" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '30px'
          }}>
            <div className="newsletter-text" style={{ flex: '1', minWidth: '300px' }}>
              <h3 style={{ fontSize: '2rem', marginBottom: '10px' }}>📧 รับข่าวสารและโปรโมชั่น</h3>
              <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>สมัครรับข่าวสารเพื่อไม่พลาดโปรโมชั่นดีๆ</p>
            </div>
            <form 
              className="newsletter-form" 
              onSubmit={(e) => {
                e.preventDefault();
                alert('ขอบคุณสำหรับการสมัครรับข่าวสาร! (ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้)');
              }}
              style={{ 
                display: 'flex', 
                gap: '10px',
                flex: '1',
                minWidth: '300px',
                maxWidth: '400px'
              }}
            >
              <input 
                type="email" 
                placeholder="อีเมลของคุณ..."
                className="newsletter-input"
                required
                style={{
                  flex: '1',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  padding: '12px 25px',
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                สมัคร
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CSS Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .category-card:hover {
            transform: translateY(-5px) !important;
          }
          
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }
          
          @media (max-width: 768px) {
            .hero-title {
              font-size: 2rem !important;
            }
            
            .hero-subtitle {
              font-size: 1rem !important;
            }
            
            .hero-actions {
              flex-direction: column !important;
              align-items: center !important;
            }
            
            .newsletter-content {
              flex-direction: column !important;
              text-align: center !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default Home;