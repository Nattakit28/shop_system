import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, testConnection, initializeAPI } from '../services/api'; // เปลี่ยนจาก '../../services/api'

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [apiMode, setApiMode] = useState('unknown');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard');
      return;
    }

    // Test backend connection
    checkBackendConnection();
  }, [navigate]);

  const checkBackendConnection = async () => {
    try {
      setConnectionStatus('checking');
      const result = await initializeAPI();
      setConnectionStatus(result.success ? 'connected' : 'disconnected');
      setApiMode(result.mode);
      
      if (!result.success) {
        setError('⚠️ Backend server ไม่ทำงาน - ใช้โหมดทดสอบ (ข้อมูล: admin/admin123)');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('disconnected');
      setApiMode('mock');
      setError('⚠️ ไม่สามารถเชื่อมต่อ Backend ได้ - ใช้โหมดทดสอบ');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error && !error.includes('Backend')) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setLoading(true);
    
    // Clear previous non-connection errors
    if (error && !error.includes('Backend')) {
      setError('');
    }

    try {
      console.log('Attempting login with credentials:', credentials);
      
      const response = await adminAPI.login(credentials);
      console.log('Login response:', response);
      
      if (response.data?.token || response.data?.data?.token) {
        const token = response.data.token || response.data.data.token;
        localStorage.setItem('adminToken', token);
        
        // Show success message
        const message = document.createElement('div');
        message.className = 'toast-message success';
        message.textContent = `เข้าสู่ระบบสำเร็จ! (${apiMode === 'mock' ? 'โหมดทดสอบ' : 'โหมดปกติ'})`;
        document.body.appendChild(message);
        
        setTimeout(() => {
          message.remove();
          navigate('/admin/dashboard');
        }, 1000);
      } else {
        throw new Error('ไม่ได้รับ token จากเซิร์ฟเวอร์');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า Backend กำลังทำงานอยู่';
        setConnectionStatus('disconnected');
      } else if (err.response?.status === 401) {
        errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      } else if (err.response?.status === 500) {
        errorMessage = 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#f59e0b';
      case 'checking': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'เชื่อมต่อเซิร์ฟเวอร์แล้ว';
      case 'disconnected': return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
      case 'checking': return 'กำลังตรวจสอบการเชื่อมต่อ...';
      default: return 'ไม่ทราบสถานะ';
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <span className="logo-icon">🛡️</span>
              <h1>ระบบจัดการร้านออนไลน์</h1>
            </div>
            <p className="login-subtitle">เข้าสู่ระบบผู้ดูแล</p>
            
            {/* Connection Status Indicator */}
            <div className="connection-status" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: '1rem 0',
              padding: '0.5rem',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              fontSize: '0.85rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getConnectionStatusColor()
              }}></div>
              <span style={{ color: '#64748b' }}>
                {getConnectionStatusText()} 
                {apiMode !== 'unknown' && ` (${apiMode === 'mock' ? 'โหมดทดสอบ' : 'โหมดปกติ'})`}
              </span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="username">ชื่อผู้ใช้</label>
              <input
                id="username"
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className={error && !error.includes('Backend') ? 'error' : ''}
                placeholder="กรอกชื่อผู้ใช้"
                autoComplete="username"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">รหัสผ่าน</label>
              <input
                id="password"
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className={error && !error.includes('Backend') ? 'error' : ''}
                placeholder="กรอกรหัสผ่าน"
                autoComplete="current-password"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-lg login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner small"></span>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                '🔐 เข้าสู่ระบบ'
              )}
            </button>

            {/* Test Connection Button */}
            <button 
              type="button"
              onClick={checkBackendConnection}
              className="btn btn-outline btn-sm"
              style={{ marginTop: '1rem', width: '100%' }}
              disabled={connectionStatus === 'checking'}
            >
              🔄 ทดสอบการเชื่อมต่อ
            </button>
          </form>
          
          <div className="login-footer">
            <div className="demo-info">
              <h4>🔍 ข้อมูลสำหรับทดสอบ</h4>
              <div className="demo-credentials">
                <div className="demo-item">
                  <span className="label">ชื่อผู้ใช้:</span>
                  <span className="value">admin</span>
                </div>
                <div className="demo-item">
                  <span className="label">รหัสผ่าน:</span>
                  <span className="value">admin123</span>
                </div>
              </div>
              
              {connectionStatus === 'disconnected' && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: '#92400e'
                }}>
                  <strong>💡 หมายเหตุ:</strong> ระบบจะทำงานในโหมดทดสอบ หากต้องการใช้งานจริง กรุณาเริ่ม Backend server ที่ port 3001
                </div>
              )}
            </div>
            
            <div className="back-to-shop">
              <button 
                onClick={() => navigate('/')}
                className="btn btn-outline"
              >
                ← กลับไปร้านค้า
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;