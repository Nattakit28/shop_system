import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/api";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    total_customers: 0,
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
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
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    // Get admin data from localStorage if available
    const storedAdminData = localStorage.getItem("adminData");
    if (storedAdminData) {
      try {
        setAdminData(JSON.parse(storedAdminData));
      } catch (error) {
        console.error("Error parsing admin data:", error);
      }
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setApiErrors([]); // รีเซ็ต errors
      console.log("🔄 กำลังโหลดข้อมูลแดชบอร์ด...");

      const errors = [];

      // ✅ Fetch dashboard stats
      try {
        const statsRes = await adminAPI.getDashboardStats();
        if (statsRes.data) {
          setStats(statsRes.data);
          console.log("✅ โหลดสถิติสำเร็จ:", statsRes.data);
        }
      } catch (err) {
        console.warn("⚠️ ไม่สามารถโหลดสถิติได้:", err.message);
        errors.push("ไม่สามารถโหลดสถิติได้");
        setStats({
          total_customers: 0,
          total_products: 0,
          total_orders: 0,
          total_revenue: 0,
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
          console.log(
            "✅ โหลดคำสั่งซื้อสำเร็จ:",
            ordersRes.data.length,
            "รายการ"
          );
        }
      } catch (err) {
        console.warn("⚠️ ไม่สามารถโหลดคำสั่งซื้อล่าสุดได้:", err.message);
        errors.push("ไม่สามารถโหลดคำสั่งซื้อได้");
        setRecentOrders([]);
        setOrdersByStatus({});
      }

      // ✅ Fetch top products
      try {
        const productsRes = await adminAPI.getTopProducts();
        if (productsRes.data && Array.isArray(productsRes.data)) {
          setTopProducts(productsRes.data.slice(0, 5));
          console.log(
            "✅ โหลดสินค้าขายดีสำเร็จ:",
            productsRes.data.length,
            "รายการ"
          );
        }
      } catch (err) {
        console.warn("⚠️ ไม่สามารถโหลดสินค้าขายดีได้:", err.message);
        errors.push("ไม่สามารถโหลดสินค้าขายดีได้");
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
          console.log("✅ โหลดการตั้งค่าสำเร็จ");
        }
      } catch (err) {
        console.warn("⚠️ ไม่สามารถโหลดการตั้งค่าได้:", err.message);
        errors.push("ไม่สามารถโหลดการตั้งค่าได้");
        setShopSettings({});
      }

      // ✅ แสดงข้อผิดพลาดที่เกิดขึ้น
      if (errors.length > 0) {
        setApiErrors(errors);
        showToast(`API มีปัญหา: ${errors.length} รายการ`, "warning");
      } else {
        console.log("✅ โหลดข้อมูลแดชบอร์ดสำเร็จทั้งหมด");
        showToast("โหลดข้อมูลแดชบอร์ดสำเร็จ", "success");
      }
    } catch (error) {
      console.error("❌ ข้อผิดพลาดร้ายแรงในการโหลดข้อมูลแดชบอร์ด:", error);
      showToast("เกิดข้อผิดพลาดร้ายแรง กรุณาตรวจสอบการเชื่อมต่อ", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `toast-message ${type}`;
    toast.textContent = message;

    const colors = {
      error: "#f56565",
      success: "#48bb78",
      info: "#4299e1",
      warning: "#ed8936",
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
      toast.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  const handleLogout = () => {
    if (window.confirm("คุณแน่ใจหรือไม่ที่จะออกจากระบบ?")) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");

      showToast("ออกจากระบบสำเร็จ", "success");

      setTimeout(() => {
        navigate("/admin/login");
      }, 1000);
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 0,
      }).format(amount || 0);
    } catch (error) {
      return `฿${(amount || 0).toLocaleString()}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "ไม่ระบุ";
    try {
      return new Date(dateString).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "รูปแบบวันที่ไม่ถูกต้อง";
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: { bg: "#fef3c7", color: "#92400e", text: "รอชำระ" },
      paid: { bg: "#d1fae5", color: "#065f46", text: "ชำระแล้ว" },
      confirmed: { bg: "#dbeafe", color: "#1e40af", text: "ยืนยันแล้ว" },
      shipped: { bg: "#e0e7ff", color: "#3730a3", text: "จัดส่งแล้ว" },
      completed: { bg: "#dcfce7", color: "#166534", text: "เสร็จสิ้น" },
      cancelled: { bg: "#fee2e2", color: "#991b1b", text: "ยกเลิก" },
    };

    const style = statusColors[status] || statusColors.pending;

    return (
      <span
        style={{
          backgroundColor: style.bg,
          color: style.color,
          padding: "0.25rem 0.5rem",
          borderRadius: "0.375rem",
          fontSize: "0.75rem",
          fontWeight: "600",
        }}
      >
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
          <h1>🛡️ {shopSettings.shop_name || "ระบบจัดการร้านออนไลน์"}</h1>
          <p>แดชบอร์ดสำหรับผู้ดูแลระบบ</p>
          {/* ✅ แสดงสถานะ API */}
          {apiErrors.length > 0 && (
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem",
                background: "#fed7d7",
                color: "#9b2c2c",
                borderRadius: "4px",
                fontSize: "0.8rem",
              }}
            >
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
            onClick={() => window.open("/", "_blank")}
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
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 ภาพรวม
        </button>
        <button
          className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          📋 จัดการคำสั่งซื้อ
        </button>
        <button
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          📦 จัดการสินค้า
        </button>
        <button
          className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          ⚙️ ตั้งค่าร้าน
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
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
                  <p className="stat-number revenue">
                    {formatCurrency(stats.total_revenue || 0)}
                  </p>
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
                      <div className="status-label">
                        {getStatusBadge(status)}
                      </div>
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
                          <td className="amount">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td className="date">
                            {formatDate(order.created_at)}
                          </td>
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
                        <p className="product-price">
                          {formatCurrency(product.price)}
                        </p>
                        <p className="product-stock">
                          คงเหลือ:{" "}
                          <span
                            className={
                              product.stock_quantity < 10
                                ? "low-stock"
                                : "normal-stock"
                            }
                          >
                            {product.stock_quantity}
                          </span>{" "}
                          ชิ้น
                        </p>
                        {product.total_sold && (
                          <p className="product-sold">
                            ขายได้: {product.total_sold} ชิ้น
                          </p>
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
                  onClick={() => setActiveTab("orders")}
                >
                  <div className="action-icon">📋</div>
                  <div>
                    <h3>ตรวจสอบคำสั่งซื้อ</h3>
                    <p>ดูและจัดการคำสั่งซื้อใหม่</p>
                  </div>
                </button>

                <button
                  className="action-card"
                  onClick={() => setActiveTab("products")}
                >
                  <div className="action-icon">➕</div>
                  <div>
                    <h3>เพิ่มสินค้าใหม่</h3>
                    <p>เพิ่มสินค้าเข้าสู่ระบบ</p>
                  </div>
                </button>

                <button
                  className="action-card"
                  onClick={() => setActiveTab("settings")}
                >
                  <div className="action-icon">⚙️</div>
                  <div>
                    <h3>ตั้งค่าร้าน</h3>
                    <p>จัดการข้อมูลร้านและ PromptPay</p>
                  </div>
                </button>

                <button
                  className="action-card"
                  onClick={() => window.open("/", "_blank")}
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
                      <span className="value">
                        ตรวจสอบ Backend API และฐานข้อมูล
                      </span>
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
            (adminData || shopSettings) && (
            <div className="admin-info-section">
              <h2>� รายละเอียดข้อมูล</h2>
              <div className="admin-info-card">
                <div className="admin-details">
                  {adminData && (
                    <>
                      <div className="detail-item">
                        <span className="label">ชื่อผู้ใช้:</span>{" "}
                        <span className="value">{adminData.username}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">อีเมลผู้ดูแล:</span>{" "}
                        <span className="value">{adminData.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">ชื่อ-นามสกุล:</span>{" "}
                        <span className="value">
                          {adminData.first_name} {adminData.last_name}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">บทบาท:</span>{" "}
                        <span className="value role">{adminData.role}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">สถานะ:</span>{" "}
                        <span className="value status">{adminData.status}</span>
                      </div>
                    </>
                  )}
                  {shopSettings && (
                    <>
                      <div className="detail-item">
                        <span className="label">ชื่อร้าน:</span>{" "}
                        <span className="value">{shopSettings.shop_name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">อีเมลร้าน:</span>{" "}
                        <span className="value">{shopSettings.shop_email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">เบอร์โทรร้าน:</span>{" "}
                        <span className="value">{shopSettings.shop_phone}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">ที่อยู่ร้าน:</span>{" "}
                        <span className="value">
                          {shopSettings.shop_address}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">PromptPay:</span>{" "}
                        <span className="value">
                          {shopSettings.promptpay_number}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            )
          </div>
        )}

        {activeTab === "orders" && <OrderManagement />}
        {activeTab === "products" && <ProductManagement />}
        {activeTab === "settings" && (
          <ShopSettings
            shopSettings={shopSettings}
            onSettingsUpdate={fetchDashboardData}
          />
        )}
      </div>
    </div>
  );
};

// Order Management Component
const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRecentOrders();
      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    console.log("Updating order status:", { orderId, newStatus });
    try {
      console.log("Updating order status:", { orderId, newStatus });
      const response = await adminAPI.updateOrderStatus(orderId, newStatus);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to update order status"
        );
      }

      console.log(`Order ${orderId} updated to status: ${newStatus}`);
      // ... (อัปเดตสถานะใน state)
    } catch (error) {
      console.error("Error updating order status:", error.message);
      showToast("เกิดข้อผิดพลาดในการอัปเดตสถานะ", "error");
    }
  };

  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `toast-message ${type}`;
    toast.textContent = message;

    const colors = {
      error: "#f56565",
      success: "#48bb78",
      info: "#4299e1",
      warning: "#ed8936",
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
      toast.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "รอชำระ",
      paid: "ชำระแล้ว",
      confirmed: "ยืนยันแล้ว",
      shipped: "จัดส่งแล้ว",
      completed: "เสร็จสิ้น",
      cancelled: "ยกเลิก",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: { bg: "#fef3c7", color: "#92400e" },
      paid: { bg: "#d1fae5", color: "#065f46" },
      confirmed: { bg: "#dbeafe", color: "#1e40af" },
      shipped: { bg: "#e0e7ff", color: "#3730a3" },
      completed: { bg: "#dcfce7", color: "#166534" },
      cancelled: { bg: "#fee2e2", color: "#991b1b" },
    };
    return statusColors[status] || statusColors.pending;
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 0,
      }).format(amount || 0);
    } catch (error) {
      return `฿${(amount || 0).toLocaleString()}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "ไม่ระบุ";
    try {
      return new Date(dateString).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "รูปแบบวันที่ไม่ถูกต้อง";
    }
  };

  // กรองคำสั่งซื้อตามสถานะและคำค้นหา
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  useEffect(() => {
    console.log("[DEBUG] selectedOrder updated:", selectedOrder);
  }, [selectedOrder]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            margin: "0 0 1rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          📋 จัดการคำสั่งซื้อ
          <span
            style={{
              fontSize: "0.9rem",
              background: "#e2e8f0",
              color: "#4a5568",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
            }}
          >
            {filteredOrders.length} รายการ
          </span>
        </h2>

        {/* ตัวกรองและค้นหา */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <label style={{ marginRight: "0.5rem", fontWeight: "bold" }}>
              สถานะ:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                background: "white",
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอชำระ</option>
              <option value="paid">ชำระแล้ว</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="shipped">จัดส่งแล้ว</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>

          <div>
            <label style={{ marginRight: "0.5rem", fontWeight: "bold" }}>
              ค้นหา:
            </label>
            <input
              type="text"
              placeholder="เลขที่คำสั่งซื้อ, ชื่อลูกค้า, เบอร์โทร"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                width: "300px",
              }}
            />
          </div>

          <button
            onClick={fetchOrders}
            style={{
              padding: "0.5rem 1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            🔄 รีเฟรช
          </button>
        </div>
      </div>

      {/* ตารางคำสั่งซื้อ */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <p>ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  เลขที่คำสั่งซื้อ
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  ลูกค้า
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  เบอร์โทร
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  ยอดรวม
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  สถานะ
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  วันที่สั่ง
                </th>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => {
                const statusStyle = getStatusColor(order.status);
                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom:
                        index < filteredOrders.length - 1
                          ? "1px solid #e5e7eb"
                          : "none",
                      ":hover": { background: "#f9fafb" },
                    }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{ fontFamily: "monospace", fontWeight: "bold" }}
                      >
                        {order.order_number}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>{order.customer_name}</td>
                    <td style={{ padding: "1rem", fontFamily: "monospace" }}>
                      {order.customer_phone}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                        }}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        color: "#6b7280",
                      }}
                    >
                      {formatDate(order.created_at)}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => openOrderDetail(order)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          ดูรายละเอียด
                        </button>

                        {order.status === "pending" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "confirmed")
                            }
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            ยืนยัน
                          </button>
                        )}

                        {order.status === "confirmed" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "shipped")
                            }
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "#8b5cf6",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            จัดส่ง
                          </button>
                        )}

                        {order.status === "shipped" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, "completed")
                            }
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "#059669",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            เสร็จสิ้น
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal รายละเอียดคำสั่งซื้อ */}
      {showOrderDetail && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setShowOrderDetail(false)}
          onStatusUpdate={updateOrderStatus}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusText={getStatusText}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
};

// Order Detail Modal Component
const OrderDetailModal = ({
  order,
  onClose,
  onStatusUpdate,
  formatCurrency,
  formatDate,
  getStatusText,
  getStatusColor,
}) => {
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [currentOrder, setCurrentOrder] = useState(order);

  useEffect(() => {
    fetchOrderItems();
  }, []);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  const fetchOrderItems = async () => {
    try {
      setLoadingItems(true);
      // จำลองข้อมูลรายการสินค้า เนื่องจาก API ยังไม่พร้อม
      // ในอนาคตจะแทนที่ด้วย: const response = await adminAPI.getOrderItems(order.id);
      const mockItems = [
        {
          id: 1,
          product_id: 1,
          product_name: "สินค้าตัวอย่าง 1",
          product_description: "รายละเอียดสินค้า",
          quantity: 2,
          price: 450.0,
        },
        {
          id: 2,
          product_id: 2,
          product_name: "สินค้าตัวอย่าง 2",
          product_description: "รายละเอียดสินค้า",
          quantity: 1,
          price: 890.0,
        },
      ];
      setOrderItems(mockItems);
    } catch (error) {
      console.error("Error fetching order items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const statusStyle = getStatusColor(currentOrder.status);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "2rem",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ margin: 0 }}>รายละเอียดคำสั่งซื้อ</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* ข้อมูลคำสั่งซื้อ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
            padding: "1rem",
            background: "#f9fafb",
            borderRadius: "6px",
          }}
        >
          <div>
            <strong>เลขที่คำสั่งซื้อ:</strong>
            <br />
            <span style={{ fontFamily: "monospace", fontSize: "1.1rem" }}>
              {currentOrder.order_number}
            </span>
          </div>
          <div>
            <strong>ชื่อลูกค้า:</strong>
            <br />
            {currentOrder.customer_name}
          </div>
          <div>
            <strong>เบอร์โทร:</strong>
            <br />
            <span style={{ fontFamily: "monospace" }}>
              {currentOrder.customer_phone}
            </span>
          </div>
          <div>
            <strong>วันที่สั่ง:</strong>
            <br />
            {formatDate(currentOrder.created_at)}
          </div>
          <div>
            <strong>สถานะ:</strong>
            <br />
            <span
              style={{
                background: statusStyle.bg,
                color: statusStyle.color,
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.875rem",
                fontWeight: "bold",
              }}
            >
              {getStatusText(currentOrder.status)}
            </span>
          </div>
          <div>
            <strong>ยอดรวม:</strong>
            <br />
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#059669",
              }}
            >
              {formatCurrency(currentOrder.total_amount)}
            </span>
          </div>
        </div>

        {/* ที่อยู่จัดส่ง */}
        {currentOrder.customer_address && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>ที่อยู่จัดส่ง:</h3>
            <div
              style={{
                padding: "1rem",
                background: "#f3f4f6",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
              }}
            >
              {currentOrder.customer_address}
            </div>
          </div>
        )}

        {/* หมายเหตุ */}
        {currentOrder.notes && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>หมายเหตุ:</h3>
            <div
              style={{
                padding: "1rem",
                background: "#fef3c7",
                borderRadius: "6px",
                border: "1px solid #fbbf24",
              }}
            >
              {currentOrder.notes}
            </div>
          </div>
        )}

        {/* รายการสินค้า */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>รายการสินค้า:</h3>

          {loadingItems ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div className="loading-spinner"></div>
              <p>กำลังโหลดรายการสินค้า...</p>
            </div>
          ) : orderItems.length === 0 ? (
            <p>ไม่พบรายการสินค้า</p>
          ) : (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th
                      style={{
                        padding: "0.75rem",
                        textAlign: "left",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      สินค้า
                    </th>
                    <th
                      style={{
                        padding: "0.75rem",
                        textAlign: "center",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      จำนวน
                    </th>
                    <th
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      ราคาต่อหน่วย
                    </th>
                    <th
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      รวม
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom:
                          index < orderItems.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                      }}
                    >
                      <td style={{ padding: "0.75rem" }}>
                        <div>
                          <div style={{ fontWeight: "bold" }}>
                            {item.product_name ||
                              `สินค้า ID: ${item.product_id}`}
                          </div>
                          {item.product_description && (
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "#6b7280",
                                marginTop: "0.25rem",
                              }}
                            >
                              {item.product_description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        {formatCurrency(item.price)}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f9fafb" }}>
                    <td
                      colSpan="3"
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: "bold",
                        borderTop: "2px solid #e5e7eb",
                      }}
                    >
                      ยอดรวมทั้งสิ้น:
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                        color: "#059669",
                        borderTop: "2px solid #e5e7eb",
                      }}
                    >
                      {formatCurrency(currentOrder.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ปุ่มจัดการสถานะ */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {currentOrder.status === "pending" && (
            <>
              <button
                onClick={() => {
                  onStatusUpdate(currentOrder.id, "confirmed");
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✅ ยืนยันคำสั่งซื้อ
              </button>
              <button
                onClick={() => {
                  onStatusUpdate(currentOrder.id, "cancelled");
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ❌ ยกเลิกคำสั่งซื้อ
              </button>
            </>
          )}

          {currentOrder.status === "confirmed" && (
            <button
              onClick={() => {
                onStatusUpdate(currentOrder.id, "shipped");
              }}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🚚 จัดส่งสินค้า
            </button>
          )}

          {currentOrder.status === "shipped" && (
            <button
              onClick={() => {
                onStatusUpdate(currentOrder.id, "completed");
              }}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#059669",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✅ เสร็จสิ้น
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductManagement = () => (
  <div
    style={{
      padding: "2rem",
      textAlign: "center",
      background: "white",
      borderRadius: "8px",
    }}
  >
    <h2>📦 จัดการสินค้า</h2>
    <p>ฟีเจอร์นี้กำลังพัฒนา</p>
    <p>สามารถเพิ่มสินค้าใหม่ แก้ไขสินค้า และจัดการหมวดหมู่สินค้าได้ที่นี่</p>
  </div>
);

const ShopSettings = ({ shopSettings, onSettingsUpdate }) => {
  const [settings, setSettings] = useState({
    shop_name: "",
    promptpay_number: "",
    shop_address: "",
    shop_phone: "",
    shop_email: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings({
      shop_name: shopSettings.shop_name || "",
      promptpay_number: shopSettings.promptpay_number || "",
      shop_address: shopSettings.shop_address || "",
      shop_phone: shopSettings.shop_phone || "",
      shop_email: shopSettings.shop_email || "",
    });
  }, [shopSettings]);

  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `toast-message ${type}`;
    toast.textContent = message;

    const colors = {
      error: "#f56565",
      success: "#48bb78",
      info: "#4299e1",
      warning: "#ed8936",
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
      toast.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      console.log("🔄 กำลังบันทึกการตั้งค่า:", settings);
      const response = await adminAPI.updateSettings(settings);

      if (response.data) {
        showToast("บันทึกการตั้งค่าเรียบร้อยแล้ว!", "success");

        // Refresh dashboard data
        if (onSettingsUpdate) {
          onSettingsUpdate();
        }
      }
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการบันทึกการตั้งค่า:", error);
      showToast("เกิดข้อผิดพลาดในการบันทึกการตั้งค่า", "error");
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
              className={`btn-save ${saving ? "saving" : ""}`}
            >
              {saving ? (
                <>
                  <div className="loading-spinner-small"></div>
                  กำลังบันทึก...
                </>
              ) : (
                "💾 บันทึกการตั้งค่า"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
