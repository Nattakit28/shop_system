import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentConfirmation from './pages/PaymentConfirmation';
import ThankYou from './pages/ThankYou';
import AdminLogin from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import './App.css';

function AppContent() {
  const location = useLocation();
  // ไม่แสดง Header ถ้าอยู่หน้า admin (ยกเว้น /admin/login)
  const isAdminPage = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  return (
    <div className="App">
      {!isAdminPage && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/:orderId" element={<PaymentConfirmation />} />
          <Route path="/thank-you/:orderNumber" element={<ThankYou />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;