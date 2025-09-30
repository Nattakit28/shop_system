import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';

const ProductManagement = () => {
  const [activeView, setActiveView] = useState('products'); // 'products', 'add-product', 'categories'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching products...', filters);
      const response = await productAPI.getAllProducts(filters);
      
      if (response.data && response.data.success) {
        setProducts(response.data.data || []);
        console.log('✅ Products loaded:', response.data.data.length, 'items');
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      showToast('ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      
      if (response.data && response.data.success) {
        setCategories(response.data.data || []);
        console.log('✅ Categories loaded:', response.data.data.length, 'items');
      } else {
        console.warn('⚠️ Unexpected categories response:', response.data);
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      showToast('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้', 'error');
      setCategories([]);
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
    }, 3000);
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0
      }).format(amount || 0);
    } catch (error) {
      return `฿${(amount || 0).toLocaleString()}`;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <h2 style={{ margin: 0 }}>📦 จัดการสินค้า</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveView('add-product')}
            style={{
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ➕ เพิ่มสินค้าใหม่
          </button>
          <button
            onClick={() => setActiveView('categories')}
            style={{
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🏷️ จัดการหมวดหมู่
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveView('products')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeView === 'products' ? '#3b82f6' : 'transparent',
            color: activeView === 'products' ? 'white' : '#374151',
            border: 'none',
            borderBottom: activeView === 'products' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeView === 'products' ? 'bold' : 'normal'
          }}
        >
          📋 รายการสินค้า ({products.length})
        </button>
        <button
          onClick={() => setActiveView('add-product')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeView === 'add-product' ? '#3b82f6' : 'transparent',
            color: activeView === 'add-product' ? 'white' : '#374151',
            border: 'none',
            borderBottom: activeView === 'add-product' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeView === 'add-product' ? 'bold' : 'normal'
          }}
        >
          ➕ เพิ่มสินค้า
        </button>
        <button
          onClick={() => setActiveView('categories')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeView === 'categories' ? '#3b82f6' : 'transparent',
            color: activeView === 'categories' ? 'white' : '#374151',
            border: 'none',
            borderBottom: activeView === 'categories' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeView === 'categories' ? 'bold' : 'normal'
          }}
        >
          🏷️ หมวดหมู่ ({categories.length})
        </button>
      </div>

      {/* Content */}
      {activeView === 'products' && (
        <ProductList 
          products={products}
          categories={categories}
          loading={loading}
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={fetchProducts}
          formatCurrency={formatCurrency}
          showToast={showToast}
          setActiveView={setActiveView}
        />
      )}

      {activeView === 'add-product' && (
        <AddProductForm 
          categories={categories}
          onSuccess={() => {
            fetchProducts();
            setActiveView('products');
          }}
          showToast={showToast}
        />
      )}

      {activeView === 'categories' && (
        <CategoryManagement 
          categories={categories}
          onSuccess={fetchCategories}
          showToast={showToast}
        />
      )}
    </div>
  );
};

// Product List Component
const ProductList = ({ 
  products, 
  categories, 
  loading, 
  filters, 
  onFilterChange, 
  onRefresh, 
  formatCurrency,
  showToast,
  setActiveView  
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูลสินค้า...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="ค้นหาสินค้า..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            minWidth: '200px'
          }}
        />
        
        <select
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}
        >
          <option value="all">ทุกหมวดหมู่</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}
        >
          <option value="all">ทุกสถานะ</option>
          <option value="active">เปิดใช้งาน</option>
          <option value="inactive">ปิดใช้งาน</option>
        </select>

        <button
          onClick={onRefresh}
          style={{
            padding: '0.5rem 1rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 รีเฟรช
        </button>
      </div>

      {/* Products Table/Grid */}
      {products.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3>📦 ยังไม่มีสินค้าในระบบ</h3>
          <p>คลิก "เพิ่มสินค้าใหม่" เพื่อเริ่มต้นเพิ่มสินค้า</p>
          <button
            onClick={() => setActiveView('add-product')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '1rem'
            }}
          >
            ➕ เพิ่มสินค้าแรก
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product}
              formatCurrency={formatCurrency}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, formatCurrency, showToast }) => {
  const isLowStock = product.stock_quantity < 10;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Product Image */}
      {product.image_url ? (
        <img
          src={`http://localhost:3001${product.image_url}`}
          alt={product.name}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div style={{
        width: '100%',
        height: '200px',
        background: '#f3f4f6',
        display: product.image_url ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        marginBottom: '1rem',
        color: '#9ca3af'
      }}>
        📷 ไม่มีรูปภาพ
      </div>

      {/* Product Info */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ 
          margin: '0 0 0.5rem 0',
          fontSize: '1.1rem',
          fontWeight: 'bold'
        }}>
          {product.name}
        </h3>
        
        {product.description && (
          <p style={{
            margin: '0 0 0.5rem 0',
            color: '#6b7280',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            {product.description.length > 100 
              ? product.description.substring(0, 100) + '...'
              : product.description
            }
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ 
            fontSize: '1.2rem', 
            fontWeight: 'bold',
            color: '#059669'
          }}>
            {formatCurrency(product.price)}
          </span>
          
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            background: product.is_active ? '#d1fae5' : '#fee2e2',
            color: product.is_active ? '#065f46' : '#991b1b'
          }}>
            {product.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </span>
        </div>

        {/* Stock Status */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            คงเหลือ:
          </span>
          <span style={{
            fontWeight: 'bold',
            color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#059669'
          }}>
            {product.stock_quantity} ชิ้น
            {isOutOfStock && ' (หมด)'}
            {isLowStock && !isOutOfStock && ' (ใกล้หมด)'}
          </span>
        </div>

        {product.category_name && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              หมวดหมู่:
            </span>
            <span style={{
              padding: '0.25rem 0.5rem',
              background: '#e0e7ff',
              color: '#3730a3',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              {product.category_name}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => showToast('ฟีเจอร์แก้ไขสินค้ากำลังพัฒนา', 'info')}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          ✏️ แก้ไข
        </button>
        
        <button
          onClick={() => showToast('ฟีเจอร์เปิด/ปิดสินค้ากำลังพัฒนา', 'info')}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: product.is_active ? '#ef4444' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          {product.is_active ? '🚫 ปิด' : '✅ เปิด'}
        </button>
      </div>
    </div>
  );
};

// Add Product Form Component
const AddProductForm = ({ categories, onSuccess, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    sku: '',
    features: '',
    is_active: 1
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock_quantity) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    try {
      setSaving(true);

      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      if (image) {
        submitData.append('image', image);
      }

      const response = await productAPI.createProduct(submitData);
      
      if (response.data && response.data.success) {
        showToast('เพิ่มสินค้าสำเร็จ!', 'success');
        onSuccess();
      }
    } catch (error) {
      console.error('❌ Error creating product:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ marginBottom: '1.5rem' }}>➕ เพิ่มสินค้าใหม่</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Product Image */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              รูปภาพสินค้า
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                width: '100%'
              }}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '200px',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  marginTop: '0.5rem'
                }}
              />
            )}
          </div>

          {/* Product Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              ชื่อสินค้า *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                width: '100%'
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              รายละเอียดสินค้า
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                width: '100%',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Price and Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                ราคา (บาท) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  width: '100%'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                จำนวนสต็อก *
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                required
                min="0"
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              หมวดหมู่
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                width: '100%'
              }}
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: saving ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {saving ? '🔄 กำลังบันทึก...' : '💾 บันทึกสินค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Management Component
const CategoryManagement = ({ categories, onSuccess, showToast }) => {
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    sort_order: 0
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name) {
      showToast('กรุณากรอกชื่อหมวดหมู่', 'error');
      return;
    }

    try {
      setSaving(true);
      const response = await productAPI.createCategory(newCategory);
      
      if (response.data && response.data.success) {
        showToast('เพิ่มหมวดหมู่สำเร็จ!', 'success');
        setNewCategory({ name: '', description: '' });
        onSuccess();
      }
    } catch (error) {
      console.error('❌ Error creating category:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Add Category Form */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        height: 'fit-content'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>➕ เพิ่มหมวดหมู่ใหม่</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              ชื่อหมวดหมู่ *
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              required
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                width: '100%'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              คำอธิบาย
            </label>
            <textarea
              value={newCategory.description}
              onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                width: '100%',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem',
              background: saving ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {saving ? '🔄 กำลังบันทึก...' : '💾 เพิ่มหมวดหมู่'}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>🏷️ หมวดหมู่ที่มีอยู่</h3>
        
        {categories.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            ยังไม่มีหมวดหมู่ในระบบ
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {categories.map(category => (
              <div
                key={category.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#f9fafb'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'start',
                  marginBottom: '0.5rem'
                }}>
                  <h4 style={{ margin: 0, fontWeight: 'bold' }}>
                    {category.name}
                  </h4>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    {category.product_count || 0} สินค้า
                  </span>
                </div>
                
                {category.description && (
                  <p style={{ 
                    margin: '0',
                    color: '#6b7280',
                    fontSize: '0.9rem'
                  }}>
                    {category.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;