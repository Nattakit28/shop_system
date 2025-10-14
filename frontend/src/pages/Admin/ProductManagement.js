import React, { useState, useEffect, useCallback } from "react";
import { productAPI } from "../../services/api";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all",
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const debugImages = async () => {
    try {
      console.log("🔍 เริ่มทำการ debug images...");

      const response = await fetch("http://localhost:3001/api/debug/products");
      const result = await response.json();

      console.log("🔍 Image Debug Results:", result);

      if (result.success) {
        console.table(result.data);

        result.data.forEach((product) => {
          console.log(`📦 Product ${product.id}: ${product.name}`);
          console.log(`   Image URL: ${product.image_url}`);
          console.log(`   Computed URL: ${product.computed_url}`);
          console.log(`   File Exists: ${product.file_exists ? "✅" : "❌"}`);
          console.log("---");
        });

        showToast(`Debug เสร็จสิ้น - ตรวจสอบ Console สำหรับรายละเอียด`, "info");
      } else {
        console.error("❌ Debug failed:", result.error);
        showToast("Debug ล้มเหลว - ตรวจสอบ Console", "error");
      }
    } catch (error) {
      console.error("❌ Debug error:", error);
      showToast("เกิดข้อผิดพลาดใน Debug", "error");
    }
  };

  const cleanupImages = async () => {
    try {
      console.log("🧹 เริ่มทำความสะอาดรูปภาพ...");

      const response = await fetch(
        "http://localhost:3001/api/debug/cleanup-images",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      console.log("🧹 Cleanup Results:", result);

      if (result.success) {
        showToast(
          `ทำความสะอาดเสร็จสิ้น - อัปเดต ${result.updated_products} รายการ`,
          "success"
        );

        if (result.missing_files.length > 0) {
          console.log("📋 รายการไฟล์ที่หาย:", result.missing_files);
        }

        // รีเฟรชข้อมูล
        setTimeout(() => {
          fetchProducts();
        }, 1000);
      } else {
        showToast("การทำความสะอาดล้มเหลว", "error");
      }
    } catch (error) {
      console.error("❌ Cleanup error:", error);
      showToast("เกิดข้อผิดพลาดในการทำความสะอาด", "error");
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAllProducts(filters);
      if (response.data && response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า", "error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await productAPI.getAllCategories();
      if (response.data && response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchProducts();
    }
  }, [refreshTrigger, fetchProducts]);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("th-TH").format(amount);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`คุณต้องการลบสินค้า "${product.name}" หรือไม่?`)) {
      try {
        await productAPI.deleteProduct(product.id);
        showToast("ลบสินค้าสำเร็จ!", "success");
        refreshData();
      } catch (error) {
        console.error("Error deleting product:", error);
        showToast("เกิดข้อผิดพลาดในการลบสินค้า", "error");
      }
    }
  };

  const handleToggleProductStatus = async (product) => {
    try {
      await productAPI.updateProductStatus(product.id, {
        is_active: !product.is_active,
      });
      showToast(
        `${product.is_active ? "ปิด" : "เปิด"}ใช้งานสินค้าสำเร็จ!`,
        "success"
      );
      refreshData();
    } catch (error) {
      console.error("Error toggling product status:", error);
      showToast("เกิดข้อผิดพลาดในการเปลี่ยนสถานะสินค้า", "error");
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    refreshData();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    refreshData();
  };

  const handleSearch = (searchValue) => {
    setFilters((prev) => ({ ...prev, search: searchValue }));
  };

  const handleCategoryFilter = (categoryValue) => {
    setFilters((prev) => ({ ...prev, category: categoryValue }));
  };

  const handleStatusFilter = (statusValue) => {
    setFilters((prev) => ({ ...prev, status: statusValue }));
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesCategory =
      filters.category === "all" ||
      product.category_id?.toString() === filters.category;
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && product.is_active) ||
      (filters.status === "inactive" && !product.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          fontSize: "1.2rem",
        }}
      >
        🔄 กำลังโหลดข้อมูลสินค้า...
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0, color: "#1f2937" }}>📦 จัดการสินค้า</h1>
        {/* ✅ เปลี่ยนจาก button เดี่ยวเป็น div ที่มี 2 buttons */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={debugImages}
            style={{
              padding: "0.75rem 1rem",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            🔍 Debug Images
          </button>

          <button
            onClick={cleanupImages}
            style={{
              padding: "0.75rem 1rem",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            🧹 ทำความสะอาด
          </button>

          <button
            onClick={handleAddProduct}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            ➕ เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            gap: "1rem",
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
                color: "#374151",
              }}
            >
              🔍 ค้นหาสินค้า
            </label>
            <input
              type="text"
              placeholder="ชื่อสินค้า..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
                color: "#374151",
              }}
            >
              📂 หมวดหมู่
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            >
              <option value="all">ทั้งหมด</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
                color: "#374151",
              }}
            >
              📊 สถานะ
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "1rem",
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">เปิดใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>

          <button
            onClick={refreshData}
            style={{
              padding: "0.75rem",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
            title="รีเฟรชข้อมูล"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Products Summary */}
      <div
        style={{
          background: "white",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
          📊 แสดง <strong>{filteredProducts.length}</strong> จาก{" "}
          <strong>{products.length}</strong> สินค้า
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "3rem",
            borderRadius: "8px",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
          <h3>ไม่พบสินค้า</h3>
          <p>ลองปรับเปลี่ยนตัวกรองหรือเพิ่มสินค้าใหม่</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              formatCurrency={formatCurrency}
              showToast={showToast}
              onEdit={handleEditProduct}
              onToggleStatus={handleToggleProductStatus}
              onDelete={handleDeleteProduct}
            />
          ))}
        </div>
      )}

      {/* ✅ เปลี่ยนชื่อ Component ที่เรียกใช้ */}
      {showAddModal && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          showToast={showToast}
        />
      )}

      {showEditModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          categories={categories}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "1rem 1.5rem",
            background:
              toast.type === "success"
                ? "#10b981"
                : toast.type === "error"
                ? "#ef4444"
                : "#3b82f6",
            color: "white",
            borderRadius: "6px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 1000,
            fontWeight: "bold",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

// ✅ เปลี่ยนชื่อจาก AddProductForm เป็น AddProductModal
const AddProductModal = ({ categories, onClose, onSuccess, showToast }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category_id: "",
    is_active: 1,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        showToast("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF)", "error");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("ขนาดไฟล์ต้องไม่เกิน 5MB", "error");
        e.target.value = "";
        return;
      }

      setImage(file);

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.stock_quantity) {
      showToast("กรุณากรอกข้อมูลที่จำเป็น", "error");
      return;
    }

    try {
      setSaving(true);

      const submitData = new FormData();

      submitData.append("name", formData.name);
      submitData.append("description", formData.description || "");
      submitData.append("price", formData.price);
      submitData.append("stock_quantity", formData.stock_quantity);
      submitData.append("category_id", formData.category_id || "");
      submitData.append("is_active", formData.is_active ? 1 : 0);

      if (image) {
        submitData.append("image", image);
      }

      console.log("📤 ส่งข้อมูลสินค้าใหม่");

      const response = await productAPI.createProduct(submitData);

      if (response.data && response.data.success) {
        showToast("เพิ่มสินค้าสำเร็จ!", "success");
        onSuccess();
      }
    } catch (error) {
      console.error("❌ Error creating product:", error);
      const errorMessage =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการเพิ่มสินค้า";
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

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
          maxWidth: "700px",
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
          <h2>➕ เพิ่มสินค้าใหม่</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Image Upload */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                รูปภาพสินค้า
              </label>

              {imagePreview && (
                <div style={{ marginBottom: "1rem" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: "200px",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                    }}
                  />
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                        document.getElementById("add-image-input").value = "";
                      }}
                      style={{
                        padding: "0.25rem 0.5rem",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      🗑️ ลบรูป
                    </button>
                  </div>
                </div>
              )}

              <input
                id="add-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                }}
              />

              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                {image ? (
                  <span style={{ color: "#10b981" }}>
                    ✅ เลือกรูปแล้ว: {image.name}
                  </span>
                ) : (
                  <span>📷 เลือกรูปภาพสินค้า (JPG, PNG, GIF, ไม่เกิน 5MB)</span>
                )}
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                ชื่อสินค้า *
              </label>
              <input
                type="text"
                name="name"
                placeholder="ชื่อสินค้า"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                รายละเอียดสินค้า
              </label>
              <textarea
                name="description"
                placeholder="รายละเอียดสินค้า"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                style={{
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Price and Stock */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  ราคา (บาท) *
                </label>
                <input
                  type="number"
                  name="price"
                  placeholder="ราคา"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    width: "100%",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  จำนวนคงเหลือ *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  placeholder="จำนวนสต็อก"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                  min="0"
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                หมวดหมู่
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                style={{
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                }}
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Status */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span style={{ fontWeight: "bold" }}>เปิดใช้งานสินค้า</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "1rem",
              }}
            >
              <button
                type="button"
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
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: saving ? "#9ca3af" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {saving ? "🔄 กำลังบันทึก..." : "💾 เพิ่มสินค้า"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// EditProductModal Component (ใช้เหมือนเดิม)
const EditProductModal = ({
  product,
  categories,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [formData, setFormData] = useState(product);
  const [saving, setSaving] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  useEffect(() => {
    if (product.image_url && !removeCurrentImage) {
      setImagePreview(`http://localhost:3001${product.image_url}`);
    }
  }, [product.image_url, removeCurrentImage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        showToast("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF)", "error");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("ขนาดไฟล์ต้องไม่เกิน 5MB", "error");
        e.target.value = "";
        return;
      }

      setNewImage(file);
      setRemoveCurrentImage(false);

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewImage(null);
    setImagePreview(null);
    setRemoveCurrentImage(true);
    const fileInput = document.getElementById("edit-image-input");
    if (fileInput) fileInput.value = "";
  };

  const handleKeepCurrentImage = () => {
    setNewImage(null);
    setRemoveCurrentImage(false);
    if (product.image_url) {
      setImagePreview(`http://localhost:3001${product.image_url}`);
    }
    const fileInput = document.getElementById("edit-image-input");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      showToast("กรุณากรอกข้อมูลที่จำเป็น", "error");
      return;
    }

    try {
      setSaving(true);

      const submitData = new FormData();

      submitData.append("name", formData.name);
      submitData.append("description", formData.description || "");
      submitData.append("price", formData.price);
      submitData.append("stock_quantity", formData.stock_quantity);
      submitData.append("category_id", formData.category_id || "");
      submitData.append("is_active", formData.is_active ? 1 : 0);

      if (newImage) {
        submitData.append("image", newImage);
      }

      console.log("📤 ส่งข้อมูลแก้ไขสินค้า ID:", product.id);

      const response = await productAPI.updateProduct(product.id, submitData);

      if (response.data && response.data.success) {
        showToast("แก้ไขสินค้าสำเร็จ!", "success");
        onSuccess();
      }
    } catch (error) {
      console.error("❌ Error updating product:", error);
      const errorMessage =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขสินค้า";
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

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
          maxWidth: "700px",
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
          <h2>✏️ แก้ไขสินค้า</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Image Upload Section */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                รูปภาพสินค้า
              </label>

              {imagePreview && (
                <div style={{ marginBottom: "1rem" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: "200px",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                    }}
                  />
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      gap: "0.5rem",
                    }}
                  >
                    {product.image_url && !newImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{
                          padding: "0.25rem 0.5rem",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ ลบรูป
                      </button>
                    )}

                    {newImage && (
                      <button
                        type="button"
                        onClick={handleKeepCurrentImage}
                        style={{
                          padding: "0.25rem 0.5rem",
                          background: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        ↶ ใช้รูปเดิม
                      </button>
                    )}
                  </div>
                </div>
              )}

              <input
                id="edit-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                }}
              />

              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                {newImage ? (
                  <span style={{ color: "#10b981" }}>✅ เลือกรูปใหม่แล้ว</span>
                ) : product.image_url && !removeCurrentImage ? (
                  <span>📷 มีรูปภาพอยู่แล้ว - เลือกไฟล์ใหม่เพื่อเปลี่ยน</span>
                ) : (
                  <span>📷 เลือกรูปภาพสินค้า (JPG, PNG, GIF, ไม่เกิน 5MB)</span>
                )}
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                ชื่อสินค้า *
              </label>
              <input
                type="text"
                placeholder="ชื่อสินค้า"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                style={{
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                รายละเอียดสินค้า
              </label>
              <textarea
                placeholder="รายละเอียดสินค้า"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows="3"
                style={{
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Price and Stock */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  ราคา (บาท) *
                </label>
                <input
                  type="number"
                  placeholder="ราคา"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  required
                  min="0"
                  step="0.01"
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    width: "100%",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  จำนวนคงเหลือ *
                </label>
                <input
                  type="number"
                  placeholder="จำนวนสต็อก"
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      stock_quantity: e.target.value,
                    }))
                  }
                  required
                  min="0"
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                หมวดหมู่
              </label>
              <select
                value={formData.category_id || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_id: e.target.value,
                  }))
                }
                style={{
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                }}
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Status */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked ? 1 : 0,
                    }))
                  }
                />
                <span style={{ fontWeight: "bold" }}>เปิดใช้งานสินค้า</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "1rem",
              }}
            >
              <button
                type="button"
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
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: saving ? "#9ca3af" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {saving ? "🔄 กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ProductCard Component
const ProductCard = ({
  product,
  formatCurrency,
  showToast,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const isLowStock = product.stock_quantity < 10;
  const isOutOfStock = product.stock_quantity === 0;
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getImageUrl = () => {
    if (!product.image_url) {
      console.log("❌ No image URL for product:", product.id);
      return null;
    }

    let finalUrl;

    if (product.image_url.startsWith("http")) {
      finalUrl = product.image_url;
    } else if (product.image_url.startsWith("/uploads/")) {
      finalUrl = `http://localhost:3001${product.image_url}`;
    } else {
      finalUrl = `http://localhost:3001/uploads/products/${product.image_url}`;
    }

    return `${finalUrl}?t=${product.updated_at || Date.now()}`;
  };

  const handleImageError = (e) => {
    console.error(`❌ ไม่สามารถโหลดรูปภาพได้:`, {
      product_id: product.id,
      image_url: product.image_url,
      computed_url: imageUrl,
      src: e.target.src,
    });
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log(`✅ ProductList image loaded:`, {
      product_id: product.id,
      image_url: product.image_url,
    });
    setImageError(false);
    setImageLoading(false);
  };

  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [product.id, product.image_url]);

  const imageUrl = getImageUrl();

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        opacity: product.is_active ? 1 : 0.7,
      }}
    >
      {/* Product Image */}
      <div
        style={{
          width: "100%",
          height: "200px",
          borderRadius: "6px",
          marginBottom: "1rem",
          position: "relative",
          overflow: "hidden",
          background: "#f3f4f6",
        }}
      >
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#9ca3af",
                  fontSize: "0.9rem",
                }}
              >
                🔄 กำลังโหลด...
              </div>
            )}

            <img
              key={`${product.id}-${product.updated_at || Date.now()}`} // ✅ Force re-render
              src={imageUrl}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: imageLoading ? "none" : "block",
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
            <div>{imageError ? "ไม่สามารถโหลดรูปได้" : "ไม่มีรูปภาพ"}</div>

            {imageError && product.image_url && (
              <div
                style={{
                  fontSize: "0.7rem",
                  marginTop: "0.25rem",
                  opacity: 0.7,
                  wordBreak: "break-all",
                  maxWidth: "100%",
                }}
              >
                URL: {product.image_url}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: "#1f2937",
          }}
        >
          {product.name}
        </h3>

        {product.description && (
          <p
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "0.9rem",
              color: "#6b7280",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.description}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#059669",
            }}
          >
            ฿{formatCurrency(product.price)}
          </span>

          <span
            style={{
              fontSize: "0.9rem",
              color: isOutOfStock
                ? "#dc2626"
                : isLowStock
                ? "#d97706"
                : "#6b7280",
              fontWeight: isOutOfStock || isLowStock ? "bold" : "normal",
            }}
          >
            คงเหลือ: {product.stock_quantity}
          </span>
        </div>

        {product.category_name && (
          <div
            style={{
              display: "inline-block",
              background: "#f3f4f6",
              color: "#374151",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.8rem",
              marginBottom: "0.5rem",
            }}
          >
            {product.category_name}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              fontSize: "0.8rem",
              fontWeight: "bold",
              background: product.is_active ? "#d1fae5" : "#fee2e2",
              color: product.is_active ? "#065f46" : "#991b1b",
            }}
          >
            {product.is_active ? "🟢 เปิดใช้งาน" : "🔴 ปิดใช้งาน"}
          </span>

          {isLowStock && !isOutOfStock && (
            <span
              style={{
                display: "inline-block",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: "bold",
                background: "#fef3c7",
                color: "#92400e",
              }}
            >
              ⚠️ ใกล้หมด
            </span>
          )}

          {isOutOfStock && (
            <span
              style={{
                display: "inline-block",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: "bold",
                background: "#fee2e2",
                color: "#991b1b",
              }}
            >
              ❌ หมด
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => onEdit(product)}
          style={{
            flex: "1",
            minWidth: "80px",
            padding: "0.5rem",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ✏️ แก้ไข
        </button>

        <button
          onClick={() => onToggleStatus(product)}
          style={{
            flex: "1",
            minWidth: "80px",
            padding: "0.5rem",
            background: product.is_active ? "#f59e0b" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {product.is_active ? "🔒 ปิด" : "🔓 เปิด"}
        </button>

        <button
          onClick={() => onDelete(product)}
          style={{
            flex: "1",
            minWidth: "60px",
            padding: "0.5rem",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🗑️ ลบ
        </button>
      </div>
    </div>
  );
};

export default ProductManagement;
