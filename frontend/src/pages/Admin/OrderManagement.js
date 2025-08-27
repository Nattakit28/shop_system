
import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/promptpay';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await orderAPI.getAll(params);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Use mock data for demo
      const mockOrders = [
        {
          id: 1,
          order_number: 'ORD1704123456',
          customer_name: 'สมชาย ใจดี',
          customer_phone: '081-234-5678',
          customer_address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
          total_amount: 1340,
          status: 'paid',
          created_at: '2024-01-15T10:30:00',
          items: [
            { id: 1, product_name: 'เสื้อยืดสีขาว', quantity: 2, price: 450, image_url: '/api/placeholder/50/50' },
            { id: 2, product_name: 'กางเกงยีนส์', quantity: 1, price: 890, image_url: '/api/placeholder/50/50' }
          ],
          payment_slip: 'slip-123.jpg',
          payment_date_time: '2024-01-15T11:00:00',
          payment_status: 'pending',
          payment_notes: 'โอนผ่าน ธ.กสิกรไทย'
        },
        {
          id: 2,
          order_number: 'ORD1704123457',
          customer_name: 'สมหญิง รักดี',
          customer_phone: '082-345-6789',
          customer_address: '456 ถนนพหลโยธิน เชียงใหม่ 50200',
          total_amount: 650,
          status: 'confirmed',
          created_at: '2024-01-14T14:20:00',
          items: [
            { id: 3, product_name: 'กระเป๋าสะพาย', quantity: 1, price: 650, image_url: '/api/placeholder/50/50' }
          ],
          payment_slip: 'slip-124.jpg',
          payment_date_time: '2024-01-14T15:00:00',
          payment_status: 'verified',
          payment_notes: 'โอนผ่าน ธ.ไทยพาณิชย์'
        }
      ];
      
      const filteredOrders = filter === 'all' 
        ? mockOrders 
        : mockOrders.filter(order => order.status === filter);
        
      setOrders(filteredOrders);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะเปลี่ยนสถานะเป็น "${getStatusText(newStatus)}"?`)) {
      return;
    }

    setUpdating(true);

    try {
      await orderAPI.updateStatus(orderId, newStatus);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      // Update selected order if it's the same
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      
      // Show success message
      const message = document.createElement('div');
      message.className = 'toast-message success';
      message.textContent = 'อัปเดตสถานะเรียบร้อยแล้ว!';
      document.body.appendChild(message);
      
      setTimeout(() => {
        message.remove();
      }, 3000);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      paid: '#17a2b8',
      confirmed: '#28a745',
      shipped: '#6f42c1',
      completed: '#007bff',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'รอชำระเงิน',
      paid: 'ชำระเงินแล้ว',
      confirmed: 'ยืนยันคำสั่งซื้อ',
      shipped: 'จัดส่งแล้ว',
      completed: 'สำเร็จ',
      cancelled: 'ยกเลิก'
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      paid: '💳',
      confirmed: '✅',
      shipped: '🚚',
      completed: '🎉',
      cancelled: '❌'
    };
    return icons[status] || '📋';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดคำสั่งซื้อ...</p>
      </div>
    );
  }

  return (
    <div className="order-management">
      <div className="order-header">
        <div className="header-content">
          <h2>📋 จัดการคำสั่งซื้อ</h2>
          <p>ดูและจัดการคำสั่งซื้อทั้งหมด</p>
        </div>
        <div className="header-actions">
          <div className="order-filters">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">ทั้งหมด ({orders.length})</option>
              <option value="pending">รอชำระเงิน</option>
              <option value="paid">ชำระเงินแล้ว</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="shipped">จัดส่งแล้ว</option>
              <option value="completed">สำเร็จ</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
          <button 
            onClick={fetchOrders}
            className="btn btn-outline"
            disabled={loading}
          >
            🔄 รีเฟรช
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-icon">📋</div>
          <h3>ไม่มีคำสั่งซื้อ</h3>
          <p>ยังไม่มีคำสั่งซื้อในระบบ</p>
        </div>
      ) : (
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>หมายเลขคำสั่งซื้อ</th>
                <th>ผู้สั่งซื้อ</th>
                <th>ยอดรวม</th>
                <th>สถานะ</th>
                <th>วันที่สั่งซื้อ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <div className="order-number">
                      <strong>{order.order_number}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="customer-info">
                      <strong>{order.customer_name}</strong>
                      <br />
                      <small>{order.customer_phone}</small>
                    </div>
                  </td>
                  <td>
                    <span className="amount">{formatCurrency(order.total_amount)}</span>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(order.status),
                        color: 'white'
                      }}
                    >
                      {getStatusIcon(order.status)} {getStatusText(order.status)}
                    </span>
                  </td>
                  <td>
                    <span className="date">
                      {formatDate(order.created_at)}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-primary btn-sm"
                    >
                      👁️ ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 รายละเอียดคำสั่งซื้อ {selectedOrder.order_number}</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="btn-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="order-details">
                {/* Customer Info */}
                <div className="detail-section">
                  <h4>👤 ข้อมูลลูกค้า</h4>
                  <div className="detail-content">
                    <p><strong>ชื่อ:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>เบอร์โทร:</strong> {selectedOrder.customer_phone}</p>
                    {selectedOrder.customer_address && (
                      <p><strong>ที่อยู่:</strong> {selectedOrder.customer_address}</p>
                    )}
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="detail-section">
                  <h4>🛒 รายการสินค้า</h4>
                  <div className="order-items">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="order-item">
                        <img 
                          src={item.image_url || '/api/placeholder/50/50'} 
                          alt={item.product_name}
                          className="item-image"
                        />
                        <div className="item-details">
                          <h5>{item.product_name}</h5>
                          <p>{formatCurrency(item.price)} x {item.quantity}</p>
                        </div>
                        <div className="item-total">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                    <div className="order-total">
                      <strong>รวมทั้งหมด: {formatCurrency(selectedOrder.total_amount)}</strong>
                    </div>
                  </div>
                </div>
                
                {/* Payment Info */}
                {selectedOrder.payment_slip && (
                  <div className="detail-section">
                    <h4>💳 ข้อมูลการชำระเงิน</h4>
                    <div className="payment-info">
                      <p><strong>วันที่โอน:</strong> {formatDate(selectedOrder.payment_date_time)}</p>
                      {selectedOrder.payment_notes && (
                        <p><strong>หมายเหตุ:</strong> {selectedOrder.payment_notes}</p>
                      )}
                      <div className="payment-slip">
                        <p><strong>สลิปการโอน:</strong></p>
                        <img 
                          src={`/uploads/${selectedOrder.payment_slip}`} 
                          alt="สลิปการโอน"
                          className="slip-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div style={{display: 'none'}} className="slip-placeholder">
                          📄 ไม่สามารถแสดงสลิปได้
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Status Update */}
                <div className="detail-section">
                  <h4>🔄 อัปเดตสถานะ</h4>
                  <div className="status-update">
                    <div className="current-status">
                      <span>สถานะปัจจุบัน: </span>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(selectedOrder.status),
                          color: 'white'
                        }}
                      >
                        {getStatusIcon(selectedOrder.status)} {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    
                    <div className="status-buttons">
                      {selectedOrder.status === 'paid' && (
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                          className="btn btn-success"
                          disabled={updating}
                        >
                          ✅ ยืนยันคำสั่งซื้อ
                        </button>
                      )}
                      
                      {selectedOrder.status === 'confirmed' && (
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                          className="btn btn-info"
                          disabled={updating}
                        >
                          🚚 จัดส่งแล้ว
                        </button>
                      )}
                      
                      {selectedOrder.status === 'shipped' && (
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                          className="btn btn-primary"
                          disabled={updating}
                        >
                          🎉 สำเร็จ
                        </button>
                      )}
                      
                      {['pending', 'paid', 'confirmed'].includes(selectedOrder.status) && (
                        <button 
                          onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                          className="btn btn-danger"
                          disabled={updating}
                        >
                          ❌ ยกเลิก
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;