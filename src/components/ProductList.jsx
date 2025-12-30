import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../services/api";
import ProductCard from "./ProductCard";
import "./ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    return localStorage.getItem('theme') || 'light';
  });
  
  // Filter states
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10000);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Apply theme to body element immediately on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const bodyClass = savedTheme === 'dark' ? 'dark-theme' : '';
    document.body.className = bodyClass;
  }, []);

  // Apply theme to body element when theme changes
  useEffect(() => {
    const bodyClass = theme === 'dark' ? 'dark-theme' : '';
    document.body.className = bodyClass;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const res = await fetchProducts();
        setAllProducts(res.data);
        setProducts(res.data);
        // Calculate max price from products
        if (res.data.length > 0) {
          const prices = res.data.map(p => p.price);
          const calculatedMaxPrice = Math.max(...prices);
          setMaxPrice(Math.ceil(calculatedMaxPrice / 100) * 100); // Round up to nearest 100
          setPriceRange({ min: 0, max: Math.ceil(calculatedMaxPrice / 100) * 100 });
        }
      } catch (err) {
        setError("Failed to load products. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Get unique categories from products
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();

  // Filter products based on search query and filters
  useEffect(() => {
    let filtered = [...allProducts];

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        return (
          product.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
        );
      });
    }

    // Price filter
    if (priceRange.min !== undefined && priceRange.max !== undefined) {
      filtered = filtered.filter(product => {
        return product.price >= priceRange.min && product.price <= priceRange.max;
      });
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => {
        return selectedCategories.includes(product.category);
      });
    }

    // Stock filter
    if (inStockOnly) {
      filtered = filtered.filter(product => {
        return product.stockQuantity > 0;
      });
    }

    setProducts(filtered);
  }, [searchQuery, allProducts, priceRange, selectedCategories, inStockOnly]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handlePriceRangeChange = (preset) => {
    switch (preset) {
      case 'under-350':
        setPriceRange({ min: 0, max: 350 });
        break;
      case '350-500':
        setPriceRange({ min: 350, max: 500 });
        break;
      case '500-600':
        setPriceRange({ min: 500, max: 600 });
        break;
      case 'over-600':
        setPriceRange({ min: 600, max: maxPrice });
        break;
      default:
        setPriceRange({ min: 0, max: maxPrice });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleEditProfile = () => {
    setDropdownOpen(false);
    navigate('/edit-profile');
  };

  const handleSettings = () => {
    setDropdownOpen(false);
    // TODO: Navigate to settings page
    console.log("Settings clicked");
  };

  const handleTheme = () => {
    setDropdownOpen(false);
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleOrdersClick = () => {
    navigate('/orders');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  // Get initials for default avatar
  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className={`products-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <header className="products-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">ZENBUY</h1>
            <div className="search-container">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="header-actions">
            <button className="cart-icon-btn" onClick={handleCartClick} aria-label="Cart">
              <svg className="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
            <button className="cart-icon-btn orders-icon-btn" onClick={handleOrdersClick} aria-label="Orders">
              <svg className="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </button>
            <div className="profile-dropdown" ref={dropdownRef}>
              <button className="profile-pic-btn" onClick={toggleDropdown}>
                {user.profilePic ? (
                  <img 
                    src={user.profilePic} 
                    alt={user.name || "Profile"} 
                    className="profile-pic-img"
                  />
                ) : (
                  <div className="profile-pic-placeholder">
                    {getInitials(user.name)}
                  </div>
                )}
              </button>
              
              {dropdownOpen && (
                <div className="dropdown-menu">
                  {user.name && (
                    <div className="dropdown-header">
                      <div className="dropdown-user-name">{user.name}</div>
                      {user.email && (
                        <div className="dropdown-user-email">{user.email}</div>
                      )}
                    </div>
                  )}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleEditProfile}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Profile
                  </button>
                  <button className="dropdown-item" onClick={handleSettings}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6m9-9h-6M6 12H1m21 0a2 2 0 0 1-2 2h-3.34a2 2 0 0 0-1.32.5l-1.68 1.68a2 2 0 0 1-2.32 0L7.66 14.5a2 2 0 0 0-1.32-.5H3a2 2 0 0 1-2-2m21 0a2 2 0 0 0-2-2h-3.34a2 2 0 0 1-1.32-.5l-1.68-1.68a2 2 0 0 0-2.32 0L7.66 9.5a2 2 0 0 1-1.32.5H3a2 2 0 0 0 2-2"></path>
                    </svg>
                    Settings
                  </button>
                  <button className="dropdown-item" onClick={handleTheme}>
                    {theme === 'dark' ? (
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                      </svg>
                    ) : (
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                      </svg>
                    )}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="products-main">
        <div className="products-container">
          <h2 className="products-title">Our Products</h2>
          
          {loading && (
            <div className="loading-message">Loading products...</div>
          )}
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          {!loading && !error && (
            <div className="products-content">
              {/* Filters Sidebar */}
              <aside className="filters-sidebar">
                <h3 className="filters-title">Filters</h3>
                
                {/* Price Filter */}
                <div className="filter-section">
                  <h4 className="filter-heading">Price</h4>
                  {maxPrice > 0 && (
                    <div className="price-range-display">
                      ₹{priceRange.min} - ₹{priceRange.max >= maxPrice ? `${maxPrice}+` : priceRange.max}
                    </div>
                  )}
                  {maxPrice > 0 && (
                    <div className="price-slider-container">
                      <div className="price-slider-wrapper">
                        <div 
                          className="price-slider-active"
                          style={{
                            '--active-left': `calc(9px + ${(priceRange.min / maxPrice) * 100}% - ${(priceRange.min / maxPrice) * 18}px)`,
                            '--active-width': `calc(${((priceRange.max - priceRange.min) / maxPrice) * 100}% - ${((priceRange.max - priceRange.min) / maxPrice) * 18}px)`,
                          }}
                        ></div>
                        <input
                          type="range"
                          min="0"
                          max={maxPrice}
                          value={priceRange.min}
                          onChange={(e) => {
                            const value = Math.min(parseInt(e.target.value), priceRange.max);
                            setPriceRange(prev => ({ ...prev, min: value }));
                          }}
                          className="price-slider price-slider-min"
                        />
                        <input
                          type="range"
                          min="0"
                          max={maxPrice}
                          value={priceRange.max}
                          onChange={(e) => {
                            const value = Math.max(parseInt(e.target.value), priceRange.min);
                            setPriceRange(prev => ({ ...prev, max: value }));
                          }}
                          className="price-slider price-slider-max"
                        />
                      </div>
                    </div>
                  )}
                  <div className="price-presets">
                    <button
                      className={`price-preset-btn ${priceRange.min === 0 && priceRange.max === 350 ? 'active' : ''}`}
                      onClick={() => handlePriceRangeChange('under-350')}
                    >
                      Up to ₹350
                    </button>
                    <button
                      className={`price-preset-btn ${priceRange.min === 350 && priceRange.max === 500 ? 'active' : ''}`}
                      onClick={() => handlePriceRangeChange('350-500')}
                    >
                      ₹350 - ₹500
                    </button>
                    <button
                      className={`price-preset-btn ${priceRange.min === 500 && priceRange.max === 600 ? 'active' : ''}`}
                      onClick={() => handlePriceRangeChange('500-600')}
                    >
                      ₹500 - ₹600
                    </button>
                    <button
                      className={`price-preset-btn ${priceRange.min === 600 && priceRange.max === maxPrice ? 'active' : ''}`}
                      onClick={() => handlePriceRangeChange('over-600')}
                    >
                      Over ₹600
                    </button>
                  </div>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="filter-section">
                    <h4 className="filter-heading">Category</h4>
                    <div className="filter-options">
                      {categories.map(category => (
                        <label key={category} className="filter-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => handleCategoryToggle(category)}
                          />
                          <span>{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Filter */}
                <div className="filter-section">
                  <h4 className="filter-heading">Availability</h4>
                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    <span>In Stock Only</span>
                  </label>
                </div>

                {/* Clear Filters */}
                {(selectedCategories.length > 0 || inStockOnly || priceRange.min > 0 || priceRange.max < maxPrice) && (
                  <button className="clear-filters-btn" onClick={() => {
                    setSelectedCategories([]);
                    setInStockOnly(false);
                    setPriceRange({ min: 0, max: maxPrice });
                  }}>
                    Clear All Filters
                  </button>
                )}
              </aside>

              {/* Products Grid */}
              <div className="products-results">
                {products.length === 0 ? (
                  <div className="empty-message">
                    {searchQuery ? `No products found for "${searchQuery}"` : 'No products available at the moment.'}
                  </div>
                ) : (
                  <>
                    <div className="results-count">
                      {products.length} {products.length === 1 ? 'product' : 'products'} found
                    </div>
                    <div className="products-grid">
                      {products.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductList;
