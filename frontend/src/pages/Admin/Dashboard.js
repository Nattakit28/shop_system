import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total_customers: 0,
    total_products: 0, 
    total_orders: 0,
    total_revenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [shopSettings, setShopSettings] = useState({});
  const [apiErrors, setApiErrors] = useState([]); // ✅ ติดตาม API errors
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Get admin data from localStorage if available
    const storedAdminData = localStorage.getItem('adminData');
    if (storedAdminData) {
      try {
        setAdminData(JSON.parse(storedAdminData));
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
    
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setApiErrors([]); // รีเซ็ต errors
      console.log('🔄 กำลังโหลดข้อมูลแดชบอร์ด...');
      
      const errors = [];
      
      // ✅ Fetch dashboard stats
      try {
        const statsRes = await adminAPI.getDashboardStats();
        if (statsRes.data) {
          setStats(statsRes.data);
          console.log('✅ โหลดสถิติสำเร็จ:', statsRes.data);
        }
      } catch (err) {
        console.warn('⚠️ ไม่สามารถโหลดสถิติได้:', err.message);
        errors.push('ไม่สามารถโหลดสถิติได้');
        setStats({
          total_customers: 0,
          total_products: 0,
          total_orders: 0,
          total_revenue: 0
        });
      }

      // ✅ Fetch recent orders
      try {
        const ordersRes = await adminAPI.getRecentOrders();
        if (ordersRes.data && Array.isArray(ordersRes.data)) {
          setRecentOrders(ordersRes.data.slice(0, 5));
          
          // Calculate orders by status
          const statusCount = ordersRes.data.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
          }, {});
          setOrdersByStatus(statusCount);
          console.log('✅ โหลดคำสั่งซื้อสำเร็จ:', ordersRes.data.length, 'รายการ');
        }
      } catch (err) {
        console.warn('⚠️ ไม่สามารถโหลดคำสั่งซื้อล่าสุดได้:', err.message);
        errors.push('ไม่สามารถโหลดคำสั่งซื้อได้');
        setRecentOrders([]);
        setOrdersByStatus({});
      }

      // ✅ Fetch top products
      try {
        const productsRes = await adminAPI.getTopProducts();
        if (productsRes.data && Array.isArray(productsRes.data)) {
          setTopProducts(productsRes.data.slice(0, 5));
          console.log('✅ โหลดสินค้าขายดีสำเร็จ:', productsRes.data.length, 'รายการ');
        }
      } catch (err) {
        console.warn('⚠️ ไม่สามารถโหลดสินค้าขายดีได้:', err.message);
        errors.push('ไม่สามารถโหลดสินค้าขายดีได้');
        setTopProducts([]);
      }

      // ✅ Fetch shop settings
      try {
        const settingsRes = await adminAPI.getSettings();
        if (settingsRes.data && Array.isArray(settingsRes.data)) {
          const settingsObj = settingsRes.data.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {});
          setShopSettings(settingsObj);
          console.log('✅ โหลดการตั้งค่าสำเร็จ');
        }
      } catch (err) {
        console.warn('⚠️ ไม่สามารถโหลดการตั้งค่าได้:', err.message);
        errors.push('ไม่สามารถโหลดการตั้งค่าได้');
        setShopSettings({});
      }

      // ✅ แสดงข้อผิดพลาดที่เกิดขึ้น
      if (errors.length > 0) {
        setApiErrors(errors);
        showToast(`API มีปัญหา: ${errors.length} รายการ`, 'warning');
      } else {
        console.log('✅ โหลดข้อมูลแดชบอร์ดสำเร็จทั้งหมด');
        showToast('โหลดข้อมูลแดชบอร์ดสำเร็จ', 'success');
      }

    } catch (error) {
      console.error('❌ ข้อผิดพลาดร้ายแรงในการโหลดข้อมูลแดชบอร์ด:', error);
      showToast('เกิดข้อผิดพลาดร้ายแรง กรุณาตรวจสอบการเชื่อมต่อ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    
    const colors = {
      error: '#f56565',
      success: '#48bb78',
      info: '#4299e1',
      warning: '#ed8936'
    };
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      animation: slideInRight 0.3s ease;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  const handleLogout = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะออกจากระบบ?')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      
      showToast('ออกจากระบบสำเร็จ', 'success');
      
      setTimeout(() => {
        navigate('/admin/login');
      }, 1000);
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
      }).format(amount || 0);
    } catch (error) {
      return `฿${(amount || 0).toLocaleString()}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'รูปแบบวันที่ไม่ถูกต้อง';
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: { bg: '#fef3c7', color: '#92400e', text: 'รอชำระ' },
      paid: { bg: '#d1fae5', color: '#065f46', text: 'ชำระแล้ว' },
      confirmed: { bg: '#dbeafe', color: '#1e40af', text: 'ยืนยันแล้ว' },
      shipped: { bg: '#e0e7ff', color: '#3730a3', text: 'จัดส่งแล้ว' },
      completed: { bg: '#dcfce7', color: '#166534', text: 'เสร็จสิ้น' },
      cancelled: { bg: '#fee2e2', color: '#991b1b', text: 'ยกเลิก' }
    };
    
    const style = statusColors[status] || statusColors.pending;
    
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title">
          <h1>🛡️ {shopSettings.shop_name || 'ระบบจัดการร้านออนไลน์'}</h1>
          <p>แดชบอร์ดสำหรับผู้ดูแลระบบ</p>
          {/* ✅ แสดงสถานะ API */}
          {apiErrors.length > 0 && (
            <div style={{ 
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: '#fed7d7',
              color: '#9b2c2c',
              borderRadius: '4px',
              fontSize: '0.8rem'
            }}>
              ⚠️ API มีปัญหา {apiErrors.length} รายการ
            </div>
          )}
        </div>
        <div className="admin-actions">
          {adminData && (
            <div className="admin-info">
              <span className="admin-greeting">
                สวัสดี, {adminData.first_name} {adminData.last_name}
              </span>
              <span className="admin-role">({adminData.role})</span>
            </div>
          )}
          <button 
            onClick={() => window.open('/', '_blank')}
            className="btn btn-outline"
          >
            👁️ ดูหน้าร้าน
          </button>
          <button 
            onClick={fetchDashboardData}
            className="btn btn-info"
            title="รีเฟรชข้อมูล"
          >
            🔄 รีเฟรช
          </button>
          <button onClick={handleLogout} className="btn btn-secondary">
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 ภาพรวม
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 จัดการคำสั่งซื้อ
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 จัดการสินค้า
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ ตั้งค่าร้าน
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Dashboard Stats */}
            <div className="dashboard-stats">
              <div className="stat-card orders">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>คำสั่งซื้อทั้งหมด</h3>
                  <p className="stat-number">{stats.total_orders || 0}</p>
                  <span className="stat-label">รายการ</span>
                </div>
              </div>
              
              <div className="stat-card customers">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>ลูกค้าทั้งหมด</h3>
                  <p className="stat-number">{stats.total_customers || 0}</p>
                  <span className="stat-label">คน</span>
                </div>
              </div>
              
              <div className="stat-card products">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>สินค้าทั้งหมด</h3>
                  <p className="stat-number">{stats.total_products || 0}</p>
                  <span className="stat-label">รายการ</span>
                </div>
              </div>
              
              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>ยอดขายรวม</h3>
                  <p className="stat-number revenue">{formatCurrency(stats.total_revenue || 0)}</p>
                  <span className="stat-label">บาท</span>
                </div>
              </div>
            </div>

            {/* Order Status Overview */}
            {Object.keys(ordersByStatus).length > 0 && (
              <div className="order-status-overview">
                <h2>📈 สถานะคำสั่งซื้อ</h2>
                <div className="status-grid">
                  {Object.entries(ordersByStatus).map(([status, count]) => (
                    <div key={status} className="status-item">
                      <div className="status-count">{count}</div>
                      <div className="status-label">{getStatusBadge(status)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className="recent-orders">
                <h2>🛒 คำสั่งซื้อล่าสุด</h2>
                <div className="orders-table">
                  <table>
                    <thead>
                      <tr>
                        <th>เลขที่คำสั่งซื้อ</th>
                        <th>ลูกค้า</th>
                        <th>ยอดรวม</th>
                        <th>สถานะ</th>
                        <th>วันที่</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="order-number">{order.order_number}</td>
                          <td>{order.customer_name}</td>
                          <td className="amount">{formatCurrency(order.total_amount)}</td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td className="date">{formatDate(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Products */}
            {topProducts.length > 0 && (
              <div className="top-products">
                <h2>🏆 สินค้าขายดี</h2>
                <div className="products-grid">
                  {topProducts.map((product) => (
                    <div key={product.id} className="product-card">
                      <div className="product-info">
                        <h4>{product.name}</h4>
                        <p className="product-price">{formatCurrency(product.price)}</p>
                        <p className="product-stock">
                          คงเหลือ: <span className={product.stock_quantity < 10 ? 'low-stock' : 'normal-stock'}>
                            {product.stock_quantity}
                          </span> ชิ้น
                        </p>
                        {product.total_sold && (
                          <p className="product-sold">ขายได้: {product.total_sold} ชิ้น</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>⚡ การดำเนินการด่วน</h2>
              <div className="action-grid">
                <button 
                  className="action-card"
                  onClick={() => setActiveTab('orders')}
                >
                  <div className="action-icon">📋</div>
                  <div>
                    <h3>ตรวจสอบคำสั่งซื้อ</h3>
                    <p>ดูและจัดการคำสั่งซื้อใหม่</p>
                  </div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveTab('products')}
                >
                  <div className="action-icon">➕</div>
                  <div>
                    <h3>เพิ่มสินค้าใหม่</h3>
                    <p>เพิ่มสินค้าเข้าสู่ระบบ</p>
                  </div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveTab('settings')}
                >
                  <div className="action-icon">⚙️</div>
                  <div>
                    <h3>ตั้งค่าร้าน</h3>
                    <p>จัดการข้อมูลร้านและ PromptPay</p>
                  </div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => window.open('/', '_blank')}
                >
                  <div className="action-icon">👁️</div>
                  <div>
                    <h3>ดูหน้าร้าน</h3>
                    <p>เปิดหน้าร้านในแท็บใหม่</p>
                  </div>
                </button>
              </div>
            </div>

            {/* API Status Section */}
            {apiErrors.length > 0 && (
              <div className="api-status-section">
                <h2>⚠️ สถานะ API</h2>
                <div className="api-status-card">
                  <div className="status-details">
                    <div className="status-item">
                      <span className="label">🔧 สถานะระบบ:</span>
                      <span className="value warning">มีปัญหาบางส่วน</span>
                    </div>
                    <div className="status-item">
                      <span className="label">📊 ข้อมูลที่แสดง:</span>
                      <span className="value">ข้อมูลจากฐานข้อมูลล่าสุด</span>
                    </div>
                    <div className="status-item">
                      <span className="label">🛠️ การแก้ไข:</span>
                      <span className="value">ตรวจสอบ Backend API และฐานข้อมูล</span>
                    </div>
                  </div>
                  <div className="error-list">
                    <h4>รายการปัญหา:</h4>
                    <ul>
                      {apiErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Info Section */}
            {adminData && (
              <div className="admin-info-section">
                <h2>👤 ข้อมูลผู้ดูแลระบบ</h2>
                <div className="admin-info-card">
                  <div className="admin-details">
                    <div className="detail-item">
                      <span className="label">👤 ชื่อผู้ใช้:</span>
                      <span className="value">{adminData.username}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">📧 อีเมล:</span>
                      <span className="value">{adminData.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">👨‍💼 ชื่อ-นามสกุล:</span>
                      <span className="value">{adminData.first_name} {adminData.last_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">🛡️ บทบาท:</span>
                      <span className="value role">{adminData.role}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">🟢 สถานะ:</span>
                      <span className="value status">{adminData.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'settings' && <ShopSettings shopSettings={shopSettings} onSettingsUpdate={fetchDashboardData} />}
      </div>
    </div>
  );
};

// Simple placeholder components
const OrderManagement = () => (
  <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '8px' }}>
    <h2>📋 จัดการคำสั่งซื้อ</h2>
    <p>ฟีเจอร์นี้กำลังพัฒนา</p>
    <p>สามารถเพิ่มการจัดการคำสั่งซื้อ การอัปเดตสถานะ และการติดตามการจัดส่งได้ที่นี่</p>
  </div>
);

const ProductManagement = () => (
  <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '8px' }}>
    <h2>📦 จัดการสินค้า</h2>
    <p>ฟีเจอร์นี้กำลังพัฒนา</p>
    <p>สามารถเพิ่มสินค้าใหม่ แก้ไขสินค้า และจัดการหมวดหมู่สินค้าได้ที่นี่</p>
  </div>
);

const ShopSettings = ({ shopSettings, onSettingsUpdate }) => {
  const [settings, setSettings] = useState({
    shop_name: '',
    promptpay_number: '',
    shop_address: '',
    shop_phone: '',
    shop_email: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings({
      shop_name: shopSettings.shop_name || '',
      promptpay_number: shopSettings.promptpay_number || '',
      shop_address: shopSettings.shop_address || '',
      shop_phone: shopSettings.shop_phone || '',
      shop_email: shopSettings.shop_email || ''
    });
  }, [shopSettings]);

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    
    const colors = {
      error: '#f56565',
      success: '#48bb78',
      info: '#4299e1',
      warning: '#ed8936'
    };
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      animation: slideInRight 0.3s ease;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSaving(true);

    try {
      console.log('🔄 กำลังบันทึกการตั้งค่า:', settings);
      const response = await adminAPI.updateSettings(settings);
      
      if (response.data) {
        showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว!', 'success');

        // Refresh dashboard data
        if (onSettingsUpdate) {
          onSettingsUpdate();
        }
      }
      
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการบันทึกการตั้งค่า:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="shop-settings">
      <div className="shop-settings-card">
        <div className="settings-header">
          <h2>⚙️ ตั้งค่าร้าน</h2>
          <p>จัดการข้อมูลร้านค้าและการตั้งค่าต่างๆ</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="settings-section">
            <h3>🏪 ข้อมูลร้านค้า</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>ชื่อร้าน</label>
                <input
                  type="text"
                  name="shop_name"
                  value={settings.shop_name}
                  onChange={handleChange}
                  placeholder="ชื่อร้านค้า"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>เบอร์โทรร้าน</label>
                <input
                  type="tel"
                  name="shop_phone"
                  value={settings.shop_phone}
                  onChange={handleChange}
                  placeholder="เบอร์โทรติดต่อ"
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>อีเมลร้าน</label>
              <input
                type="email"
                name="shop_email"
                value={settings.shop_email}
                onChange={handleChange}
                placeholder="อีเมลติดต่อ"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>ที่อยู่ร้าน</label>
              <textarea
                name="shop_address"
                value={settings.shop_address}
                onChange={handleChange}
                rows="3"
                placeholder="ที่อยู่ร้านค้า"
                className="form-textarea"
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>💳 การตั้งค่า PromptPay</h3>
            
            <div className="form-group">
              <label>หมายเลข PromptPay</label>
              <input
                type="text"
                name="promptpay_number"
                value={settings.promptpay_number}
                onChange={handleChange}
                placeholder="เบอร์โทรหรือเลขบัตรประชาชน"
                className="form-input"
              />
              <small className="form-help">
                💡 สามารถใช้เบอร์โทรศัพท์ (10 หลัก) หรือเลขบัตรประชาชน (13 หลัก)
              </small>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={saving}
              className={`btn-save ${saving ? 'saving' : ''}`}
            >
              {saving ? (
                <>
                  <div className="loading-spinner-small"></div>
                  กำลังบันทึก...
                </>
              ) : (
                '💾 บันทึกการตั้งค่า'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;