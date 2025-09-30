import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [orderUpdating, setOrderUpdating] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log("📊 กำลังดึงข้อมูลคำสั่งซื้อ...");

      const response = await adminAPI.getAllOrders();

      console.log("📥 Orders response:", response);

      // ✅ รองรับหลาย response format
      let ordersData = [];

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        // Format 1: { success: true, data: [...] }
        ordersData = response.data.data;
      } else if (response.data && Array.isArray(response.data.orders)) {
        // Format 2: { orders: [...], pagination: {...} }
        ordersData = response.data.orders;
      } else if (Array.isArray(response.data)) {
        // Format 3: [...orders]
        ordersData = response.data;
      } else {
        console.warn("⚠️ รูปแบบข้อมูลไม่ถูกต้อง:", response.data);
        ordersData = [];
      }

      setOrders(ordersData);
      console.log("✅ ดึงข้อมูลคำสั่งซื้อสำเร็จ:", ordersData.length, "รายการ");
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      showToast("ไม่สามารถดึงข้อมูลคำสั่งซื้อได้", "error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setOrderUpdating(orderId);
      console.log(`🔄 Updating order ${orderId} to status: ${newStatus}`);

      // ✅ ใช้ method ที่มีอยู่แล้ว
      const response = await adminAPI.updateOrderStatus(orderId, newStatus);

      console.log("📥 Update response:", response);

      if (response.data && response.data.success) {
        console.log(
          "✅ Order status updated successfully:",
          response.data.message
        );

        // อัปเดต orders ใน state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  updated_at: new Date().toISOString(),
                }
              : order
          )
        );

        // แสดงข้อความสำเร็จ
        showToast(response.data.message || "อัปเดตสถานะสำเร็จ", "success");
      } else {
        throw new Error(response.data?.message || "Unknown error");
      }
    } catch (error) {
      console.error("❌ Error updating order status:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "เกิดข้อผิดพลาดในการอัปเดตสถานะ";

      showToast(errorMessage, "error");
    } finally {
      setOrderUpdating(null);
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
                const isUpdating = orderUpdating === order.id;
                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom:
                        index < filteredOrders.length - 1
                          ? "1px solid #e5e7eb"
                          : "none",
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
                            disabled={isUpdating}
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
  if (!order) return null;

  const statusStyle = getStatusColor(order.status);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem'
        }}>
          <h3 style={{ margin: 0 }}>📋 รายละเอียดคำสั่งซื้อ {order.order_number}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        {/* Order Info */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>👤 ข้อมูลลูกค้า</h4>
          <div style={{ 
            background: '#f9fafb', 
            padding: '1rem', 
            borderRadius: '6px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <strong>ชื่อ:</strong> {order.customer_name}
            </div>
            <div>
              <strong>เบอร์โทร:</strong> {order.customer_phone}
            </div>
            {order.customer_address && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>ที่อยู่:</strong> {order.customer_address}
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>🛒 รายการสินค้า</h4>
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            {order.items && order.items.length > 0 ? (
              <>
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      borderBottom: index < order.items.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <img
                      src={item.image_url || '/api/placeholder/50/50'}
                      alt={item.product_name}
                      style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        marginRight: '1rem'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{item.product_name}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                        {formatCurrency(item.price)} × {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
                <div style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>
                  รวมทั้งหมด: {formatCurrency(order.total_amount)}
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                ไม่มีข้อมูลรายการสินค้า
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        {order.payment_slip && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>💳 ข้อมูลการชำระเงิน</h4>
            <div style={{ 
              background: '#f9fafb', 
              padding: '1rem', 
              borderRadius: '6px'
            }}>
              {order.payment_date_time && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>วันที่โอน:</strong> {formatDate(order.payment_date_time)}
                </div>
              )}
              {order.payment_notes && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>หมายเหตุ:</strong> {order.payment_notes}
                </div>
              )}
              <div>
                <strong>สลิปการโอน:</strong>
                <img
                  src={`/uploads/${order.payment_slip}`}
                  alt="สลิปการโอน"
                  style={{
                    maxWidth: '200px',
                    height: 'auto',
                    borderRadius: '4px',
                    marginTop: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none', color: '#6b7280' }}>
                  📄 ไม่สามารถแสดงสลิปได้
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status & Actions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>🔄 จัดการสถานะ</h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '6px'
          }}>
            <div>
              <span>สถานะปัจจุบัน: </span>
              <span
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}
              >
                {getStatusText(order.status)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {order.status === 'pending' && (
                <button
                  onClick={() => onStatusUpdate(order.id, 'confirmed')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ ยืนยันคำสั่งซื้อ
                </button>
              )}

              {order.status === 'confirmed' && (
                <button
                  onClick={() => onStatusUpdate(order.id, 'shipped')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🚚 จัดส่งแล้ว
                </button>
              )}

              {order.status === 'shipped' && (
                <button
                  onClick={() => onStatusUpdate(order.id, 'completed')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🎉 สำเร็จ
                </button>
              )}

              {['pending', 'confirmed'].includes(order.status) && (
                <button
                  onClick={() => onStatusUpdate(order.id, 'cancelled')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ ยกเลิก
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Dates */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}>
          <div>
            <strong>วันที่สั่งซื้อ:</strong><br />
            {formatDate(order.created_at)}
          </div>
          {order.updated_at && order.updated_at !== order.created_at && (
            <div>
              <strong>อัปเดตล่าสุด:</strong><br />
              {formatDate(order.updated_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;