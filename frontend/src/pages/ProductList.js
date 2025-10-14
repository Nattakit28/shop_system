import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { productAPI, publicAPI } from "../services/api";
import ProductCard from "../components/ProductCard";

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Get URL parameters
  const currentPage = parseInt(searchParams.get("page")) || 1;
  const selectedCategory = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "created_at";
  const sortOrder = searchParams.get("order") || "DESC";

  const handleAddToCart = async (product) => {
    try {
      console.log("🛒 เพิ่มสินค้าลงตะกร้า:", product.name);

      const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItem = existingCart.find((item) => item.id === product.id);

      let updatedCart;
      if (existingItem) {
        updatedCart = existingCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [
          ...existingCart,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1,
          },
        ];
      }

      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));

      showAddToCartMessage(product.name);

      console.log("✅ เพิ่มสินค้าลงตะกร้าสำเร็จ");
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      showErrorMessage("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
    }
  };

  const showAddToCartMessage = (productName) => {
    const toast = document.createElement("div");
    toast.className = "add-to-cart-toast";
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
        line-height: 1.4;
      ">
        🛒 เพิ่ม "${productName}" ลงตะกร้าแล้ว
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const showErrorMessage = (message) => {
    const toast = document.createElement("div");
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-weight: 500;
        max-width: 300px;
        line-height: 1.4;
      ">
        ❌ ${message}
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, selectedCategory, searchQuery, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      const response = await publicAPI.getCategories(); // ใช้ publicAPI.getCategories()
      const categoriesData = response?.data?.data || response?.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: pagination.limit,
        sort: sortBy,
        order: sortOrder,
      };

      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      console.log("Fetching products with params:", params);

      const response = await productAPI.getAllProducts(params);

      console.log("Products response:", response);

      const productsData = response?.data?.data || response?.data || [];
      const paginationData = response?.data?.pagination || {};

      setProducts(Array.isArray(productsData) ? productsData : []);
      setPagination((prev) => ({
        ...prev,
        ...paginationData,
        page: currentPage,
      }));
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่อีกครั้ง");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set("category", categoryId);
    } else {
      newParams.delete("category");
    }
    newParams.delete("page"); // Reset to first page
    setSearchParams(newParams);
  };

  const handleSearch = (query) => {
    const newParams = new URLSearchParams(searchParams);
    if (query.trim()) {
      newParams.set("search", query.trim());
    } else {
      newParams.delete("search");
    }
    newParams.delete("page"); // Reset to first page
    setSearchParams(newParams);
  };

  const handleSortChange = (sort, order) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", sort);
    newParams.set("order", order);
    newParams.delete("page"); // Reset to first page
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  const selectedCategoryData = categories.find(
    (cat) => cat.id.toString() === selectedCategory
  );

  return (
    <div className="product-list-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/">หน้าแรก</Link>
            <span>/</span>
            <span>สินค้าทั้งหมด</span>
            {selectedCategoryData && (
              <>
                <span>/</span>
                <span>{selectedCategoryData.name}</span>
              </>
            )}
          </div>

          <h1 className="page-title">
            {selectedCategoryData ? selectedCategoryData.name : "สินค้าทั้งหมด"}
            {searchQuery && ` - ผลการค้นหา "${searchQuery}"`}
          </h1>

          {selectedCategoryData?.description && (
            <p className="page-description">
              {selectedCategoryData.description}
            </p>
          )}
        </div>

        {/* Filters and Search */}
        <div
          className="filters-section"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            padding: "1.5rem",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          }}
        >
          {/* Search Bar */}
          <div
            className="search-bar"
            style={{
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              defaultValue={searchQuery}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e.target.value);
                }
              }}
              className="search-input"
              style={{
                flex: 1,
                padding: "0.75rem",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />
            <button
              onClick={(e) => {
                const input = e.target.previousElementSibling;
                handleSearch(input.value);
              }}
              className="search-button"
              style={{
                padding: "0.75rem 1rem",
                background: "#3182ce",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              🔍
            </button>
          </div>

          {/* Category Filter */}
          <div className="category-filter">
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#4a5568",
              }}
            >
              หมวดหมู่:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="category-select"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "1rem",
                outline: "none",
                background: "white",
              }}
            >
              <option value="">ทั้งหมด</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.product_count || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="sort-options">
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#4a5568",
              }}
            >
              เรียงตาม:
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split("-");
                handleSortChange(sort, order);
              }}
              className="sort-select"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "1rem",
                outline: "none",
                background: "white",
              }}
            >
              <option value="created_at-DESC">ใหม่ล่าสุด</option>
              <option value="created_at-ASC">เก่าที่สุด</option>
              <option value="price-ASC">ราคาต่ำ → สูง</option>
              <option value="price-DESC">ราคาสูง → ต่ำ</option>
              <option value="name-ASC">ชื่อ A → Z</option>
              <option value="name-DESC">ชื่อ Z → A</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info">
          {!loading && !error && (
            <p>
              แสดง {products.length} รายการ จากทั้งหมด {pagination.total} รายการ
              {selectedCategoryData &&
                ` ในหมวดหมู่ "${selectedCategoryData.name}"`}
              {searchQuery && ` ที่มีคำว่า "${searchQuery}"`}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>กำลังโหลดสินค้า...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-message">{error}</div>
            <button onClick={fetchProducts} className="btn btn-primary">
              ลองใหม่
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <div className="no-products-content">
              <h3>ไม่พบสินค้า</h3>
              <p>
                {searchQuery
                  ? `ไม่พบสินค้าที่มีคำว่า "${searchQuery}"`
                  : selectedCategoryData
                  ? `ยังไม่มีสินค้าในหมวดหมู่ "${selectedCategoryData.name}"`
                  : "ยังไม่มีสินค้าในระบบ"}
              </p>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchParams({});
                  }}
                  className="btn btn-outline"
                >
                  ดูสินค้าทั้งหมด
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div
              className="products-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
                padding: "1rem 0",
              }}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart}/>
              ))}
            </div>

            {/* Simple Pagination */}
            {pagination.pages > 1 && (
              <div
                className="simple-pagination"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                  margin: "2rem 0",
                  padding: "1rem",
                }}
              >
                <div
                  className="pagination-info"
                  style={{
                    color: "#666",
                    fontSize: "0.9rem",
                  }}
                >
                  หน้า {pagination.page} จาก {pagination.pages} (
                  {pagination.total} รายการ)
                </div>
                <div
                  className="pagination-buttons"
                  style={{
                    display: "flex",
                    gap: "1rem",
                  }}
                >
                  {pagination.page > 1 && (
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className="btn btn-outline"
                      style={{ padding: "0.5rem 1rem" }}
                    >
                      ← หน้าก่อน
                    </button>
                  )}

                  {pagination.page < pagination.pages && (
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="btn btn-outline"
                      style={{ padding: "0.5rem 1rem" }}
                    >
                      หน้าถัดไป →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Category Cards */}
        {!selectedCategory && !searchQuery && categories.length > 0 && (
          <section className="category-showcase">
            <h2>เลือกช้อปตามหมวดหมู่</h2>
            {/* Category Cards */}
            <div
              className="category-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1rem",
                marginTop: "2rem",
              }}
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="category-card"
                  onClick={() => handleCategoryChange(category.id.toString())}
                  style={{
                    background: "white",
                    padding: "1.5rem",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: "1px solid #e2e8f0",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-4px)";
                    e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                >
                  <div
                    className="category-icon"
                    style={{
                      fontSize: "2.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {category.icon ||
                      (category.id === 1
                        ? "👕"
                        : category.id === 2
                        ? "🏠"
                        : category.id === 3
                        ? "🍽️"
                        : category.id === 4
                        ? "📱"
                        : category.id === 5
                        ? "⚽"
                        : "📦")}
                  </div>
                  <h3
                    style={{
                      margin: "0 0 0.5rem",
                      color: "#2d3748",
                      fontSize: "1.1rem",
                    }}
                  >
                    {category.name}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 1rem",
                      color: "#718096",
                      fontSize: "0.9rem",
                    }}
                  >
                    {category.description}
                  </p>
                  <span
                    className="product-count"
                    style={{
                      display: "inline-block",
                      background: "#e2e8f0",
                      color: "#4a5568",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: "500",
                    }}
                  >
                    {category.product_count || 0} สินค้า
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductList;
