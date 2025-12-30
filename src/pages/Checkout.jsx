import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { validateCoupon } from '../services/api';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [theme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [formData, setFormData] = useState({
    flatNo: '',
    locality: '',
    city: '',
    pincode: '',
    phone: ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!savedUser.id) {
      navigate('/login');
      return;
    }
    setUser(savedUser);

    // Get cart items from localStorage
    const savedCart = localStorage.getItem('cart');
    if (!savedCart || JSON.parse(savedCart).length === 0) {
      navigate('/cart');
      return;
    }
    setCartItems(JSON.parse(savedCart));

    // Pre-fill form with user's saved address if available
    if (savedUser.flatNo) setFormData(prev => ({ ...prev, flatNo: savedUser.flatNo }));
    if (savedUser.locality) setFormData(prev => ({ ...prev, locality: savedUser.locality }));
    if (savedUser.city) setFormData(prev => ({ ...prev, city: savedUser.city }));
    if (savedUser.pincode) setFormData(prev => ({ ...prev, pincode: savedUser.pincode }));

    // Apply theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    const bodyClass = savedTheme === 'dark' ? 'dark-theme' : '';
    document.body.className = bodyClass;
  }, [navigate]);

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    return 0; // Free shipping
  };

  const calculateDiscount = () => {
    return discount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const discountAmount = calculateDiscount();
    return Math.max(0, subtotal + shipping - discountAmount);
  };

  const handleCouponApply = async () => {
    setCouponError('');
    
    const code = couponCode.toUpperCase().trim();
    
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const subtotal = calculateSubtotal();
      const response = await validateCoupon(code, subtotal);
      
      if (response.data.valid) {
        const couponData = response.data;
        let discountAmount = 0;
        
        if (couponData.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * couponData.discountValue) / 100;
        } else if (couponData.discountType === 'FLAT') {
          discountAmount = couponData.discountValue;
        }
        
        setDiscount(discountAmount);
        setCouponApplied(true);
        setCouponError('');
      }
    } catch (error) {
      setCouponError(error.response?.data?.error || 'Invalid coupon code');
      setCouponApplied(false);
      setDiscount(0);
    }
  };

  const handleCouponRemove = () => {
    setCouponCode('');
    setDiscount(0);
    setCouponApplied(false);
    setCouponError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create order object (without payment info, will be added in payment page)
      const orderData = {
        userId: user.id,
        items: cartItems,
        shippingAddress: {
          flatNo: formData.flatNo,
          locality: formData.locality,
          city: formData.city,
          pincode: formData.pincode,
          phone: formData.phone
        },
        subtotal: calculateSubtotal(),
        shipping: calculateShipping(),
        discount: discount,
        total: calculateTotal(),
        couponCode: couponApplied ? couponCode : null
      };

      // Navigate to payment page with order data
      navigate('/payment', { 
        state: { 
          orderData: orderData
        }
      });
    } catch (error) {
      console.error('Error preparing order:', error);
      alert('Failed to proceed to payment. Please try again.');
      setLoading(false);
    }
  };

  if (!user || cartItems.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className={`checkout-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <header className="checkout-header">
        <div className="checkout-header-content">
          <Link to="/cart" className="back-link">← Back to Cart</Link>
          <h1 className="checkout-logo">ZENBUY</h1>
        </div>
      </header>

      <main className="checkout-main">
        <div className="checkout-container">
          <h2 className="checkout-title">Checkout</h2>

          <div className="checkout-content">
            <div className="checkout-form-section">
              <form onSubmit={handleSubmit} className="checkout-form">
                {/* Shipping Address */}
                <section className="form-section">
                  <h3 className="section-title">Shipping Address</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="flatNo">Flat/House No.</label>
                      <input
                        type="text"
                        id="flatNo"
                        name="flatNo"
                        value={formData.flatNo}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="locality">Locality/Area</label>
                      <input
                        type="text"
                        id="locality"
                        name="locality"
                        value={formData.locality}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="pincode">Pincode</label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        pattern="[0-9]{6}"
                        required
                      />
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        pattern="[0-9]{10}"
                        placeholder="10-digit phone number"
                        required
                      />
                    </div>
                  </div>
                </section>

                {/* Coupon Code */}
                <section className="form-section">
                  <h3 className="section-title">Coupon Code</h3>
                  <div className="coupon-container">
                    {!couponApplied ? (
                      <div className="coupon-input-group">
                        <input
                          type="text"
                          className="coupon-input"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            setCouponError('');
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCouponApply();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="apply-coupon-btn"
                          onClick={handleCouponApply}
                        >
                          Apply
                        </button>
                      </div>
                    ) : (
                      <div className="coupon-applied">
                        <div className="coupon-success">
                          <span className="coupon-code-text">{couponCode}</span>
                          <span className="discount-amount">-₹{discount.toFixed(2)}</span>
                        </div>
                        <button
                          type="button"
                          className="remove-coupon-btn"
                          onClick={handleCouponRemove}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <div className="coupon-error">{couponError}</div>
                    )}
                  </div>
                </section>

                <button type="submit" className="place-order-btn" disabled={loading}>
                  {loading ? 'Processing...' : `Proceed to Payment - ₹${calculateTotal().toFixed(2)}`}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="checkout-summary">
              <h3 className="summary-title">Order Summary</h3>
              
              <div className="summary-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="summary-item">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="summary-item-image" />
                    )}
                    <div className="summary-item-details">
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                    <div className="summary-item-price">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                {couponApplied && discount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Discount</span>
                    <span className="discount-text">-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Checkout;

