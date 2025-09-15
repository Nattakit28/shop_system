// ไฟล์ api.js - ปรับปรุงการจัดการ Settings และ Error Handling
import axios from "axios";

// การตั้งค่า
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";
const TIMEOUT = 10000; // 10 วินาที

// สร้าง axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response Success:", response);
    return response;
  },
  (error) => {
    console.error("❌ API Response Error:", error);
    console.error("❌ Error Config:", error.config);
    console.error("❌ Error Request:", error.request);
    console.error("❌ Error Response:", error.response);
    return Promise.reject(error);
  }
);

// ✅ เพิ่ม request interceptor เพื่อดีบัก
api.interceptors.request.use(
  (config) => {
    console.log("📤 API Request:", config);
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

let isOnlineMode = true;

// Test connection และ initialize API mode
export const initializeAPI = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    isOnlineMode = true;
    console.log("✅ เชื่อมต่อ API สำเร็จ - โหมดออนไลน์");
    return { success: true, mode: "online" };
  } catch (error) {
    isOnlineMode = false;
    console.error("❌ เชื่อมต่อ API ล้มเหลว:", error.message);
    return { success: false, mode: "offline", error: error.message };
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ส่งคำขอ: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ ข้อผิดพลาดในการส่งคำขอ:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => {
    console.log(
      `📥 ได้รับการตอบกลับ: ${response.status} ${response.statusText}`
    );
    return response;
  },
  (error) => {
    console.error(
      `❌ ข้อผิดพลาด API: ${error.response?.status} ${error.response?.statusText}`
    );

    // Enhanced error logging
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    } else if (error.request) {
      console.error("Request timeout/network error:", error.message);
    } else {
      console.error("Error setting up request:", error.message);
    }

    if (error.response?.status === 401) {
      // Clear authentication data
      localStorage.removeItem("adminToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("adminData");
      localStorage.removeItem("user");

      // Redirect to appropriate login page
      const currentPath = window.location.pathname;
      if (currentPath.includes("/admin")) {
        window.location.href = "/admin/login";
      } else {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// =================== API Endpoints ===================

// Admin API endpoints with enhanced error handling
export const adminAPI = {
  // Authentication
  login: async (credentials) => {
    try {
      const response = await api.post("/admin/login", credentials);

      // Store admin data and token
      if (response.data?.token) {
        localStorage.setItem("adminToken", response.data.token);
      }

      if (response.data?.admin) {
        localStorage.setItem("adminData", JSON.stringify(response.data.admin));
      }

      console.log("✅ เข้าสู่ระบบผู้ดูแลสำเร็จ");
      return response;
    } catch (error) {
      console.error(
        "❌ เข้าสู่ระบบผู้ดูแลล้มเหลว:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    console.log("✅ ออกจากระบบผู้ดูแลสำเร็จ");
    return Promise.resolve();
  },

  verify: () => api.get("/admin/verify"),

  // Dashboard data - ปรับปรุงให้ใช้ endpoint ใหม่
  getDashboardStats: async () => {
    try {
      console.log("📊 ดึงสถิติแดชบอร์ด...");
      const response = await api.get("/admin/dashboard/stats");
      console.log("✅ ดึงสถิติสำเร็จ:", response.data);
      return response;
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการดึงสถิติ:", error.message);
      throw error;
    }
  },

  getRecentOrders: async () => {
    try {
      console.log("📊 ดึงคำสั่งซื้อล่าสุด...");
      const response = await api.get("/admin/orders/recent");
      console.log("✅ ดึงคำสั่งซื้อสำเร็จ:", response.data.length, "รายการ");
      return response;
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการดึงคำสั่งซื้อ:", error.message);
      throw error;
    }
  },

  getTopProducts: async () => {
    try {
      console.log("📊 ดึงสินค้าขายดี...");
      const response = await api.get("/admin/products/top");
      console.log("✅ ดึงสินค้าขายดีสำเร็จ:", response.data.length, "รายการ");
      return response;
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการดึงสินค้าขายดี:", error.message);
      throw error;
    }
  },

  // Orders management
  getOrders: (params = {}) => api.get("/admin/orders", { params }),
  updateOrderStatus: (orderId, status) =>
    api.patch(`/admin/orders/${orderId}/status`, { status }),

  // Products management
  getProducts: (params = {}) => api.get("/admin/products", { params }),
  createProduct: (productData) => api.post("/admin/products", productData),
  updateProduct: (productId, productData) =>
    api.put(`/admin/products/${productId}`, productData),
  deleteProduct: (productId) => api.delete(`/admin/products/${productId}`),

  // Categories management
  getCategories: () => api.get("/admin/categories"),

  // Settings management - ปรับปรุงให้มีการ Error Handling ที่ดีขึ้น
  getSettings: async () => {
    try {
      console.log("📊 ดึงการตั้งค่าร้าน...");
      const response = await api.get("/admin/settings");

      // ตรวจสอบว่า response เป็น array หรือไม่
      let settingsData = [];
      if (Array.isArray(response.data)) {
        settingsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        settingsData = response.data.data;
      } else {
        console.warn("⚠️ รูปแบบข้อมูลการตั้งค่าไม่ถูกต้อง:", response.data);
        settingsData = [];
      }

      console.log("✅ ดึงการตั้งค่าสำเร็จ:", settingsData.length, "รายการ");

      return {
        ...response,
        data: settingsData,
      };
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการดึงการตั้งค่า:", error.message);

      // ส่งคืน fallback data หากเกิดข้อผิดพลาด
      return {
        data: [],
        status: 200,
        statusText: "OK (Fallback)",
        fallback: true,
      };
    }
  },

  updateSettings: async (settings) => {
    try {
      console.log("🔄 กำลังอัปเดตการตั้งค่า:", settings);

      // Validate settings before sending
      if (!settings.shop_name || !settings.promptpay_number) {
        throw new Error("กรุณาระบุชื่อร้านและหมายเลข PromptPay");
      }

      const response = await api.put("/admin/settings", settings);
      console.log("✅ อัปเดตการตั้งค่าสำเร็จ:", response.data);
      return response;
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการอัปเดตการตั้งค่า:", error.message);

      // Enhanced error message handling
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า");
      }
    }
  },

  // File upload
  uploadImage: (file, folder = "general") => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    return api.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Legacy method for backward compatibility
  getStats: () => adminAPI.getDashboardStats(),
};

// Customer API endpoints
export const customerAPI = {
  // Authentication
  register: (data) => api.post("/customers/register", data),
  login: async (credentials) => {
    try {
      const response = await api.post("/customers/login", credentials);

      // Store customer data and token
      if (response.data?.token) {
        localStorage.setItem("authToken", response.data.token);
      }

      if (response.data?.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      console.log("✅ เข้าสู่ระบบลูกค้าสำเร็จ");
      return response;
    } catch (error) {
      console.error(
        "❌ เข้าสู่ระบบลูกค้าล้มเหลว:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    console.log("✅ ออกจากระบบลูกค้าสำเร็จ");
    return Promise.resolve();
  },

  // Profile
  getProfile: () => api.get("/customers/profile"),
  updateProfile: (data) => api.put("/customers/profile", data),
};

// Product API endpoints
export const productAPI = {
  getProducts: (params = {}) => {
    console.log("🔍 ดึงข้อมูลสินค้าจาก Database:", params);
    return api.get("/products", { params });
  },

  getProduct: (id) => {
    console.log("🔍 ดึงข้อมูลสินค้า ID:", id);
    return api.get(`/products/${id}`);
  },

  getFeaturedProducts: () => {
    console.log("🔍 ดึงข้อมูลสินค้าแนะนำจาก Database");
    return api.get("/products/featured");
  },

  getCategories: () => {
    console.log("🔍 ดึงข้อมูลหมวดหมู่สินค้าจาก Database");
    return api.get("/products/categories");
  },

  searchProducts: (query, params = {}) => {
    const searchParams = { ...params, search: query };
    console.log("🔍 ค้นหาสินค้าจาก Database:", searchParams);
    return api.get("/products", { params: searchParams });
  },
};

// Public API endpoints
export const publicAPI = {
  // Health check
  getHealth: () => api.get("/health"),

  // Products
  getProducts: (params = {}) => productAPI.getProducts(params),
  getProduct: (id) => productAPI.getProduct(id),
  getFeaturedProducts: () => productAPI.getFeaturedProducts(),
  getProductCategories: () => productAPI.getCategories(),

  // Categories - ปรับปรุง Error Handling
  getCategories: async () => {
    try {
      console.log("🔍 ดึงข้อมูลหมวดหมู่สินค้าจาก Database");
      const response = await api.get("/categories");
      console.log("✅ ดึงข้อมูลหมวดหมู่สำเร็จ:", response.data);
      return response;
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:", error);
      throw error;
    }
  },

  // Shop info
  getShopInfo: () => {
    console.log("🔍 ดึงข้อมูลร้านค้าจาก Database");
    return api.get("/shop/info");
  },

  // Debug
  getTables: () => api.get("/debug/tables"),
  getDebugCategories: () => api.get("/debug/categories"),
};

// Order API endpoints
export const orderAPI = {
  create: async (orderData) => {
    try {
      console.log("📝 กำลังสร้างคำสั่งซื้อใหม่:", orderData);
      const response = await api.post("/orders", orderData);
      console.log("✅ สร้างคำสั่งซื้อสำเร็จ:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการสร้างคำสั่งซื้อ:", error.message);
      throw error; // ส่งต่อข้อผิดพลาดเพื่อจัดการในส่วนอื่น
    }
  },

  getOrder: async (orderNumber) => {
    try {
      console.log("🔍 กำลังดึงข้อมูลคำสั่งซื้อ:", orderNumber);
      const response = await api.get(`/orders/${orderNumber}`);
      console.log("✅ ดึงข้อมูลคำสั่งซื้อสำเร็จ:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ ข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ:", error.message);
      throw error; // ส่งต่อข้อผิดพลาดเพื่อจัดการในส่วนอื่น
    }
  },
};

// Payment API endpoints
export const paymentAPI = {
  submitPayment: (data) => {
    console.log("💳 ส่งข้อมูลการชำระเงิน:", data);

    const formData = new FormData();

    // เพิ่มข้อมูลทั่วไป
    Object.keys(data).forEach((key) => {
      if (key !== "paymentSlip") {
        formData.append(key, data[key]);
      }
    });

    // เพิ่มไฟล์รูปภาพ (ถ้ามี)
    if (data.paymentSlip) {
      formData.append("paymentSlip", data.paymentSlip);
      formData.append("folder", "payments");
    }

    return api.post("/payments", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// Test connection
export const testConnection = async () => {
  try {
    console.log("🔄 ทดสอบการเชื่อมต่อ Database...");
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    console.log("✅ ทดสอบการเชื่อมต่อสำเร็จ");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ ทดสอบการเชื่อมต่อล้มเหลว:", error.message);
    return { success: false, error: error.message };
  }
};

// Test database connection
export const testDatabase = async () => {
  try {
    console.log("🔄 ทดสอบการเชื่อมต่อ Database...");
    const response = await publicAPI.getTables();
    console.log("✅ ทดสอบ Database สำเร็จ");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ ทดสอบ Database ล้มเหลว:", error.message);
    return { success: false, error: error.message };
  }
};

// ฟังก์ชันแสดงสถานะ API
export const getAPIStatus = () => {
  return {
    mode: isOnlineMode ? "online" : "offline",
    baseURL: API_BASE_URL,
    hasConnection: isOnlineMode,
    databaseOnly: true,
  };
};

// Utility functions
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

export const getCurrentAdmin = () => {
  try {
    const adminData = localStorage.getItem("adminData");
    return adminData ? JSON.parse(adminData) : null;
  } catch (error) {
    console.error("Error parsing admin data:", error);
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("authToken");
};

export const isAdminAuthenticated = () => {
  return !!localStorage.getItem("adminToken");
};

// Enhanced error handling utility
export const handleApiError = (error, context = "API call") => {
  let errorMessage = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;

    if (data && data.message) {
      errorMessage = data.message;
    } else {
      switch (status) {
        case 400:
          errorMessage = "ข้อมูลที่ส่งไม่ถูกต้อง";
          break;
        case 401:
          errorMessage = "ไม่ได้รับอนุญาตให้เข้าถึง";
          break;
        case 403:
          errorMessage = "ไม่มีสิทธิ์ในการดำเนินการ";
          break;
        case 404:
          errorMessage = "ไม่พบข้อมูลที่ต้องการ";
          break;
        case 500:
          errorMessage = "เกิดข้อผิดพลาดในเซิร์ฟเวอร์";
          break;
        default:
          errorMessage = `เกิดข้อผิดพลาด: ${status}`;
      }
    }
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
  } else if (error.message) {
    // Something else happened
    errorMessage = error.message;
  }

  console.error(`❌ ${context}:`, {
    message: errorMessage,
    originalError: error.message,
    status: error.response?.status,
    data: error.response?.data,
  });

  return {
    success: false,
    message: errorMessage,
    status: error.response?.status,
    originalError: error,
  };
};

// Database connection test with detailed error info
export const testDatabaseConnection = async () => {
  try {
    console.log("🔄 ทดสอบการเชื่อมต่อฐานข้อมูลแบบรายละเอียด...");

    const tests = [];

    // Test 1: Health check
    try {
      const healthResponse = await api.get("/health");
      tests.push({
        test: "Health Check",
        status: "success",
        data: healthResponse.data,
      });
    } catch (error) {
      tests.push({
        test: "Health Check",
        status: "failed",
        error: handleApiError(error, "Health Check"),
      });
    }

    // Test 2: Admin authentication check
    try {
      const token = localStorage.getItem("adminToken");
      if (token) {
        const verifyResponse = await api.get("/admin/verify");
        tests.push({
          test: "Admin Token Verification",
          status: "success",
          data: verifyResponse.data,
        });
      } else {
        tests.push({
          test: "Admin Token Verification",
          status: "skipped",
          message: "ไม่มี Admin Token",
        });
      }
    } catch (error) {
      tests.push({
        test: "Admin Token Verification",
        status: "failed",
        error: handleApiError(error, "Admin Token Verification"),
      });
    }

    // Test 3: Settings endpoint
    try {
      const settingsResponse = await adminAPI.getSettings();
      tests.push({
        test: "Settings API",
        status: "success",
        data: { count: settingsResponse.data?.length || 0 },
      });
    } catch (error) {
      tests.push({
        test: "Settings API",
        status: "failed",
        error: handleApiError(error, "Settings API"),
      });
    }

    const successCount = tests.filter((t) => t.status === "success").length;
    const totalTests = tests.filter((t) => t.status !== "skipped").length;

    console.log("✅ ทดสอบฐานข้อมูลเสร็จสิ้น:", {
      successCount,
      totalTests,
      tests,
    });

    return {
      success: successCount === totalTests,
      summary: {
        total: tests.length,
        success: successCount,
        failed: tests.filter((t) => t.status === "failed").length,
        skipped: tests.filter((t) => t.status === "skipped").length,
      },
      tests,
    };
  } catch (error) {
    console.error("❌ ข้อผิดพลาดในการทดสอบฐานข้อมูล:", error);
    return {
      success: false,
      error: handleApiError(error, "Database Connection Test"),
    };
  }
};

export default api;
