
import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import { formatCurrency } from '../../utils/promptpay';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    is_featured: false,
    image_file: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        productAPI.getAll(),
        productAPI.getCategories()
      ]);
      
      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use mock data for demo
      setProducts([
        {
          id: 1,
          name: 'เสื้อยืดสีขาว',
          description: 'เสื้อยืดผ้าคอตตอน 100% สีขาว',
          price: 450,
          stock_quantity: 25,
          category_id: 1,
          category_name: 'เสื้อผ้า',
          is_featured: true,
          is_active: true,
          image_url: '/api/placeholder/100/100'
        },
        {
          id: 2,
          name: 'กางเกงยีนส์',
          description: 'กางเกงยีนส์ผู้ชาย สีน้ำเงิน',
          price: 800,
          stock_quantity: 15,
          category_id: 1,
          category_name: 'เสื้อผ้า',
          is_featured: false,
          is_active: true,
          image_url: '/api/placeholder/100/100'
        }
      ]);
      
      setCategories([
        { id: 1, name: 'เสื้อผ้า' },
        { id: 2, name: 'ของใช้' },
        { id: 3, name: 'อาหาร' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               type === 'file' ? files[0] : value
    }));
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      category_id: '',
      is_featured: false,
      image_file: null
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      Object.keys(productForm).forEach(key => {
        if (productForm[key] !== null && productForm[key] !== '') {
          formData.append(key, productForm[key]);
        }
      });

      if (editingProduct) {
        await productAPI.update(editingProduct.id, formData);
        
        // Update local state
        setProducts(prev => prev.map(p => 
          p.id === editingProduct.id 
            ? { ...p, ...productForm, image_url: productForm.image_file ? URL.createObjectURL(productForm.image_file) : p.image_url }
            : p
        ));
        
        // Show success message
        const message = document.createElement('div');
        message.className = 'toast-message success';
        message.textContent = 'อัปเดตสินค้าเรียบร้อยแล้ว!';
        document.body.appendChild(message);
        
        setTimeout(() => message.remove(), 3000);
      } else {
        const response = await productAPI.create(formData);
        
        // Add to local state
        const newProduct = {
          id: response.data.productId,
          ...productForm,
          category_name: categories.find(c => c.id.toString() === productForm.category_id)?.name,
          is_active: true,
          image_url: productForm.image_file ? URL.createObjectURL(productForm.image_file) : '/api/placeholder/100/100'
        };
        
        setProducts(prev => [newProduct, ...prev]);
        
        // Show success message
        const message = document.createElement('div');
        message.className = 'toast-message success';
        message.textContent = 'เพิ่มสินค้าใหม่เรียบร้อยแล้ว!';
        document.body.appendChild(message);
        
        setTimeout(() => message.remove(), 3000);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกสินค้า');
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      category_id: product.category_id,
      is_featured: product.is_featured,
      image_file: null
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const deleteProduct = async (productId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) {
      try {
        await productAPI.delete(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        
        // Show success message
        const message = document.createElement('div');
        message.className = 'toast-message success';
        message.textContent = 'ลบสินค้าเรียบร้อยแล้ว!';
        document.body.appendChild(message);
        
        setTimeout(() => message.remove(), 3000);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('เกิดข้อผิดพลาดในการลบสินค้า');
      }
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await productAPI.toggle(productId);
      
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, is_active: !currentStatus }
          : p
      ));
      
      // Show success message
      const message = document.createElement('div');
      message.className = 'toast-message success';
      message.textContent = 'อัปเดตสถานะสินค้าเรียบร้อยแล้ว!';
      document.body.appendChild(message);
      
      setTimeout(() => message.remove(), 3000);
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดสินค้า...</p>
      </div>
    );
  }

  return (
    <div className="product-management">
      <div className="product-header">
        <div className="header-content">
          <h2>📦 จัดการสินค้า</h2>
          <p>เพิ่ม แก้ไข และจัดการสินค้าทั้งหมด</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            ➕ เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-products">
          <div className="empty-icon">📦</div>
          <h3>ยังไม่มีสินค้า</h3>
          <p>เริ่มต้นด้วยการเพิ่มสินค้าแรกของคุณ</p>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            ➕ เพิ่มสินค้าใหม่
          </button>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>รูปภาพ</th>
                <th>ชื่อสินค้า</th>
                <th>หมวดหมู่</th>
                <th>ราคา</th>
                <th>คงเหลือ</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.image_url || '/api/placeholder/50/50'} 
                      alt={product.name}
                      className="product-thumbnail"
                    />
                  </td>
                  <td>
                    <div className="product-name-cell">
                      <strong>{product.name}</strong>
                      {product.is_featured && (
                        <span className="featured-badge">⭐ แนะนำ</span>
                      )}
                    </div>
                  </td>
                  <td>{product.category_name}</td>
                  <td className="price-cell">{formatCurrency(product.price)}</td>
                  <td className="stock-cell">
                    <span className={product.stock_quantity <= 5 ? 'low-stock' : ''}>
                      {product.stock_quantity} ชิ้น
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active)}
                      className={`status-toggle ${product.is_active ? 'active' : 'inactive'}`}
                    >
                      {product.is_active ? '✅ เปิดขาย' : '❌ ปิดขาย'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => editProduct(product)}
                        className="btn btn-outline btn-sm"
                      >
                        ✏️ แก้ไข
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !saving && resetForm()}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}</h3>
              <button 
                onClick={resetForm} 
                className="btn-close"
                disabled={saving}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-section">
                  <h4>📝 ข้อมูลสินค้า</h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">ชื่อสินค้า *</label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={productForm.name}
                        onChange={handleFormChange}
                        placeholder="ชื่อสินค้า"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="category_id">หมวดหมู่ *</label>
                      <select
                        id="category_id"
                        name="category_id"
                        value={productForm.category_id}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">เลือกหมวดหมู่</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">รายละเอียดสินค้า</label>
                    <textarea
                      id="description"
                      name="description"
                      value={productForm.description}
                      onChange={handleFormChange}
                      rows="3"
                      placeholder="รายละเอียดสินค้า..."
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="price">ราคา (บาท) *</label>
                      <input
                        id="price"
                        type="number"
                        name="price"
                        value={productForm.price}
                        onChange={handleFormChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="stock_quantity">จำนวนในสต็อก *</label>
                      <input
                        id="stock_quantity"
                        type="number"
                        name="stock_quantity"
                        value={productForm.stock_quantity}
                        onChange={handleFormChange}
                        min="0"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>📷 รูปภาพสินค้า</h4>
                  
                  <div className="form-group">
                    <label htmlFor="image_file">เลือกรูปภาพ</label>
                    <div className="file-upload-area">
                      <input
                        id="image_file"
                        type="file"
                        name="image_file"
                        onChange={handleFormChange}
                        accept="image/*"
                        className="file-input"
                      />
                      <div className="file-upload-display">
                        {productForm.image_file ? (
                          <div className="file-preview">
                            <img 
                              src={URL.createObjectURL(productForm.image_file)}
                              alt="ตัวอย่างรูปภาพ"
                              className="preview-image"
                            />
                            <div className="file-info">
                              <span className="file-name">📎 {productForm.image_file.name}</span>
                              <span className="file-size">
                                ({Math.round(productForm.image_file.size / 1024)} KB)
                              </span>
                            </div>
                          </div>
                        ) : editingProduct && editingProduct.image_url ? (
                          <div className="current-image">
                            <img 
                              src={editingProduct.image_url}
                              alt="รูปภาพปัจจุบัน"
                              className="preview-image"
                            />
                            <span className="current-label">รูปภาพปัจจุบัน</span>
                          </div>
                        ) : (
                          <div className="file-placeholder">
                            <span className="upload-icon">📷</span>
                            <span>คลิกเพื่อเลือกรูปภาพ</span>
                            <small>รองรับ JPG, PNG ขนาดไม่เกิน 5MB</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>⚙️ การตั้งค่า</h4>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={productForm.is_featured}
                        onChange={handleFormChange}
                      />
                      <span className="checkbox-text">
                        ⭐ สินค้าแนะนำ (แสดงในหน้าแรก)
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    className="btn btn-secondary"
                    disabled={saving}
                  >
                    ❌ ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="loading-spinner small"></span>
                        {editingProduct ? 'กำลังอัปเดต...' : 'กำลังเพิ่ม...'}
                      </>
                    ) : (
                      editingProduct ? '💾 อัปเดตสินค้า' : '➕ เพิ่มสินค้า'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;