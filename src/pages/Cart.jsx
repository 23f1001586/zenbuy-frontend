import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [theme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    // Get cart items from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    // Apply theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    const bodyClass = savedTheme === 'dark' ? 'dark-theme' : '';
    document.body.className = bodyClass;
  }, []);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
    }
  }, [user.id, navigate]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    
    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleRemoveItem = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  return (
    <div className={`cart-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <header className="cart-header">
        <div className="cart-header-content">
          <h1 className="cart-logo">ZENBUY</h1>
          <Link to="/products" className="back-to-products">
            ← Back to Products
          </Link>
        </div>
      </header>

      <main className="cart-main">
        <div className="cart-container">
          <h2 className="cart-title">Shopping Cart</h2>

          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <svg className="empty-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <h3>Your cart is empty</h3>
              <p>Start shopping to add items to your cart!</p>
              <Link to="/products" className="cart-button primary">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="cart-content">
              <div className="cart-items-section">
                <div className="cart-items-header">
                  <h3>Items ({cartItems.length})</h3>
                  <button className="clear-cart-btn" onClick={handleClearCart}>
                    Clear Cart
                  </button>
                </div>

                <div className="cart-items-list">
                  {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                      {item.imageUrl && (
                        <div className="cart-item-image">
                          <img src={item.imageUrl} alt={item.name} />
                        </div>
                      )}
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">{item.name}</h4>
                        {item.description && (
                          <p className="cart-item-description">{item.description}</p>
                        )}
                        <div className="cart-item-price">₹{item.price}</div>
                      </div>
                      <div className="cart-item-actions">
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <div className="cart-item-total">
                          ₹{item.price * item.quantity}
                        </div>
                        <button
                          className="remove-item-btn"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label="Remove item"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cart-summary">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
                <Link to="/checkout" className="checkout-btn">
                  Proceed to Checkout
                </Link>
                <Link to="/products" className="cart-button secondary">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Cart;

