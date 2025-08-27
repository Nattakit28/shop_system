import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    };

    updateCartCount();
    
    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const searchTerm = e.target.search.value;
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="navbar">
          <Link to="/" className="logo">
            <span className="logo-icon">🛍️</span>
            <span className="logo-text">ร้านออนไลน์</span>
          </Link>
          
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              name="search"
              placeholder="ค้นหาสินค้า..."
              className="search-input"
            />
            <button type="submit" className="search-btn">
              🔍
            </button>
          </form>
          
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link">หน้าแรก</Link>
            <Link to="/products" className="nav-link">สินค้าทั้งหมด</Link>
            <Link to="/cart" className="nav-link cart-link">
              <span className="cart-icon">🛒</span>
              <span className="cart-text">ตะกร้า</span>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </Link>
            <Link to="/admin/login" className="nav-link">Login</Link>
          </div>

          <button 
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;