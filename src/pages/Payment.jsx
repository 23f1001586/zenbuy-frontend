import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { processPayment } from '../services/api';
import './Payment.css';

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [theme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  // Card payment form
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    saveCard: false
  });

  // UPI payment form
  const [upiForm, setUpiForm] = useState({
    upiId: ''
  });

  // Net Banking form
  const [netBankingForm, setNetBankingForm] = useState({
    bank: ''
  });

  // Wallet form
  const [walletForm, setWalletForm] = useState({
    wallet: ''
  });

  // PayU payment form
  const [payuForm, setPayuForm] = useState({
    transactionId: ''
  });

  // Payment verification screen state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationOrderId, setVerificationOrderId] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!savedUser.id) {
      navigate('/login');
      return;
    }
    setUser(savedUser);

    // Get order data from location state (passed from checkout)
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
    } else {
      // If no order data, redirect back to checkout
      navigate('/checkout');
      return;
    }

    // Apply theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    const bodyClass = savedTheme === 'dark' ? 'dark-theme' : '';
    document.body.className = bodyClass;
  }, [navigate, location]);

  const handleCardChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'cardNumber') {
      // Format card number with spaces
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formatted.length <= 19) {
        setCardForm({ ...cardForm, [name]: formatted });
      }
    } else {
      setCardForm({
        ...cardForm,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleUpiChange = (e) => {
    setUpiForm({ ...upiForm, upiId: e.target.value });
  };

  const handleNetBankingChange = (e) => {
    setNetBankingForm({ ...netBankingForm, bank: e.target.value });
  };

  const handleWalletChange = (e) => {
    setWalletForm({ ...walletForm, wallet: e.target.value });
  };

  const handlePayuChange = (e) => {
    setPayuForm({ ...payuForm, transactionId: e.target.value });
  };

  const validateCardForm = () => {
    if (!cardForm.cardNumber || cardForm.cardNumber.replace(/\s/g, '').length < 16) {
      alert('Please enter a valid card number');
      return false;
    }
    if (!cardForm.cardName || cardForm.cardName.length < 3) {
      alert('Please enter cardholder name');
      return false;
    }
    if (!cardForm.expiryMonth || !cardForm.expiryYear) {
      alert('Please select expiry date');
      return false;
    }
    if (!cardForm.cvv || cardForm.cvv.length < 3) {
      alert('Please enter CVV');
      return false;
    }
    return true;
  };

  const validateUpiForm = () => {
    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiForm.upiId || !upiPattern.test(upiForm.upiId)) {
      alert('Please enter a valid UPI ID (e.g., name@paytm)');
      return false;
    }
    return true;
  };

  const validateNetBankingForm = () => {
    if (!netBankingForm.bank) {
      alert('Please select a bank');
      return false;
    }
    return true;
  };

  const validateWalletForm = () => {
    if (!walletForm.wallet) {
      alert('Please select a wallet');
      return false;
    }
    return true;
  };

  const validatePayuForm = () => {
    if (!payuForm.transactionId || payuForm.transactionId.trim().length < 5) {
      alert('Please enter a valid transaction ID');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    setLoading(true);

    // Validate based on selected payment method
    let isValid = false;
    switch (selectedPaymentMethod) {
      case 'card':
        isValid = validateCardForm();
        break;
      case 'upi':
        isValid = validateUpiForm();
        break;
      case 'netbanking':
        isValid = validateNetBankingForm();
        break;
      case 'wallet':
        isValid = validateWalletForm();
        break;
      case 'payu':
        isValid = validatePayuForm();
        break;
      case 'cod':
        isValid = true;
        break;
      default:
        isValid = false;
    }

    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      // Transform orderData to backend format
      const codCharges = selectedPaymentMethod === 'cod' ? 50 : 0;
      const finalTotal = orderData.total + codCharges;

      const orderRequest = {
        items: orderData.items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl || ''
        })),
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        discount: orderData.discount,
        total: finalTotal,
        paymentMethod: selectedPaymentMethod.toUpperCase(),
        shippingAddress: {
          flatNo: orderData.shippingAddress.flatNo,
          locality: orderData.shippingAddress.locality,
          city: orderData.shippingAddress.city,
          pincode: orderData.shippingAddress.pincode
        }
      };

      // For PayU, just save locally and redirect - simple flow
      if (selectedPaymentMethod === 'payu') {
        const orderNumber = `ORD-${Date.now()}`;
        
        // Create order object for localStorage
        const order = {
          id: Date.now(),
          orderNumber: orderNumber,
          userId: orderData.userId,
          items: orderData.items,
          subtotal: orderData.subtotal,
          shipping: orderData.shipping,
          discount: orderData.discount,
          total: orderData.total,
          paymentMethod: 'PAYU',
          paymentStatus: 'PENDING',
          transactionId: payuForm.transactionId.trim(),
          status: 'CONFIRMED',
          orderDate: new Date().toISOString(),
          shippingAddress: orderData.shippingAddress
        };

        // Save to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Clear cart
        localStorage.removeItem('cart');

        // Show verification screen and redirect
        setVerificationOrderId(orderNumber);
        setShowVerification(true);
        setLoading(false);
        
        // Auto-redirect after 10 seconds
        setTimeout(() => {
          navigate('/products');
        }, 10000);
        
        return;
      }

      // For other payment methods, call the backend API
      const response = await processPayment(orderData.userId, orderRequest);

      // Clear cart on successful payment
      localStorage.removeItem('cart');

      // Navigate to order success page
      navigate('/orders', {
        state: {
          message: response.data.message || 'Payment successful! Order placed successfully!',
          orderPlaced: true,
          orderNumber: response.data.orderNumber
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.message || 'Payment failed. Please try again.';
      alert(errorMessage);
      setLoading(false);
    }
  };

  if (!user || !orderData) {
    return null; // Will redirect
  }

  // Payment Verification Screen
  if (showVerification) {
    return (
      <div className={`payment-verification-screen ${theme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="verification-container">
          <div className="verification-animation">
            <div className="checkmark-circle">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <div className="pulse-ring"></div>
          </div>
          <h2 className="verification-title">Order Accepted!</h2>
          <p className="verification-message">
            Your payment is under verification and will be notified when accepted.
          </p>
          {verificationOrderId && (
            <p className="verification-order-id">
              Order ID: <strong>{verificationOrderId}</strong>
            </p>
          )}
          <div className="verification-loader">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
          <p className="verification-redirect">
            Redirecting to products page in a moment...
          </p>
        </div>
      </div>
    );
  }

  const banks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'IndusInd Bank',
    'Yes Bank',
    'Union Bank of India'
  ];

  const wallets = ['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay', 'MobiKwik'];

  return (
    <div className={`payment-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <header className="payment-header">
        <div className="payment-header-content">
          <Link to="/checkout" className="back-link">← Back to Checkout</Link>
          <h1 className="payment-logo">ZENBUY</h1>
        </div>
      </header>

      <main className="payment-main">
        <div className="payment-container">
          <h2 className="payment-title">Payment</h2>

          <div className="payment-content">
            <div className="payment-methods-section">
              <h3 className="section-title">Select Payment Method</h3>

              {/* Payment Method Tabs */}
              <div className="payment-method-tabs">
                <button
                  className={`payment-tab ${selectedPaymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('card')}
                >
                  <svg className="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  Card
                </button>
                <button
                  className={`payment-tab ${selectedPaymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('upi')}
                >
                  <svg className="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  UPI
                </button>
                <button
                  className={`payment-tab ${selectedPaymentMethod === 'netbanking' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('netbanking')}
                >
                  <svg className="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  Net Banking
                </button>
                <button
                  className={`payment-tab ${selectedPaymentMethod === 'wallet' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('wallet')}
                >
                  <svg className="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="6" x2="12" y2="12"></line>
                    <line x1="16" y1="10" x2="12" y2="12"></line>
                  </svg>
                  Wallet
                </button>
                <button
                  className={`payment-tab ${selectedPaymentMethod === 'payu' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('payu')}
                >
                  <svg className="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    <line x1="12" y1="11" x2="12" y2="17"></line>
                    <line x1="9" y1="14" x2="15" y2="14"></line>
                  </svg>
                  PayU
                </button>
                <button
                  className={`payment-tab ${selectedPaymentMethod === 'cod' ? 'active' : ''}`}
                  onClick={() => setSelectedPaymentMethod('cod')}
                >
                  <svg className="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                    <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                    <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  Cash on Delivery
                </button>
              </div>

              {/* Card Payment Form */}
              {selectedPaymentMethod === 'card' && (
                <div className="payment-form-container">
                  <div className="card-icons">
                    <span className="card-icon visa">VISA</span>
                    <span className="card-icon mastercard">MC</span>
                    <span className="card-icon rupay">RuPay</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={cardForm.cardNumber}
                      onChange={handleCardChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cardName">Cardholder Name</label>
                    <input
                      type="text"
                      id="cardName"
                      name="cardName"
                      value={cardForm.cardName}
                      onChange={handleCardChange}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryMonth">Expiry Month</label>
                      <select
                        id="expiryMonth"
                        name="expiryMonth"
                        value={cardForm.expiryMonth}
                        onChange={handleCardChange}
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="expiryYear">Expiry Year</label>
                      <select
                        id="expiryYear"
                        name="expiryYear"
                        value={cardForm.expiryYear}
                        onChange={handleCardChange}
                      >
                        <option value="">YYYY</option>
                        {Array.from({ length: 20 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <input
                        type="password"
                        id="cvv"
                        name="cvv"
                        value={cardForm.cvv}
                        onChange={handleCardChange}
                        placeholder="123"
                        maxLength="4"
                      />
                    </div>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="saveCard"
                        checked={cardForm.saveCard}
                        onChange={handleCardChange}
                      />
                      Save card for future payments
                    </label>
                  </div>
                </div>
              )}

              {/* UPI Payment Form */}
              {selectedPaymentMethod === 'upi' && (
                <div className="payment-form-container">
                  <div className="upi-info">
                    <p>Enter your UPI ID to pay instantly</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="upiId">UPI ID</label>
                    <input
                      type="text"
                      id="upiId"
                      name="upiId"
                      value={upiForm.upiId}
                      onChange={handleUpiChange}
                      placeholder="name@paytm / name@ybl / name@upi"
                    />
                  </div>
                  <div className="upi-apps">
                    <div className="upi-app">
                      <div className="upi-app-icon">P</div>
                      <span>Paytm</span>
                    </div>
                    <div className="upi-app">
                      <div className="upi-app-icon">PP</div>
                      <span>PhonePe</span>
                    </div>
                    <div className="upi-app">
                      <div className="upi-app-icon">GP</div>
                      <span>Google Pay</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking Form */}
              {selectedPaymentMethod === 'netbanking' && (
                <div className="payment-form-container">
                  <div className="form-group">
                    <label htmlFor="bank">Select Bank</label>
                    <select
                      id="bank"
                      name="bank"
                      value={netBankingForm.bank}
                      onChange={handleNetBankingChange}
                    >
                      <option value="">Choose your bank</option>
                      {banks.map((bank, index) => (
                        <option key={index} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="netbanking-info">
                    <p>You will be redirected to your bank's secure page to complete the payment</p>
                  </div>
                </div>
              )}

              {/* Wallet Form */}
              {selectedPaymentMethod === 'wallet' && (
                <div className="payment-form-container">
                  <div className="wallet-options">
                    {wallets.map((wallet, index) => (
                      <label key={index} className="wallet-option">
                        <input
                          type="radio"
                          name="wallet"
                          value={wallet}
                          checked={walletForm.wallet === wallet}
                          onChange={handleWalletChange}
                        />
                        <div className="wallet-option-content">
                          <span className="wallet-name">{wallet}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* PayU Payment Form */}
              {selectedPaymentMethod === 'payu' && (
                <div className="payment-form-container">
                  <div className="payu-info">
                    <div className="payu-logo">PayU</div>
                    <h4>PayU Payment Gateway</h4>
                    <p>Enter your transaction ID after completing payment on PayU</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="transactionId">Transaction ID</label>
                    <input
                      type="text"
                      id="transactionId"
                      name="transactionId"
                      value={payuForm.transactionId}
                      onChange={handlePayuChange}
                      placeholder="Enter transaction ID (e.g., T123456789)"
                      required
                    />
                    <small className="form-hint">
                      You can find your transaction ID in the payment confirmation email/SMS from PayU
                    </small>
                  </div>
                </div>
              )}

              {/* Cash on Delivery */}
              {selectedPaymentMethod === 'cod' && (
                <div className="payment-form-container">
                  <div className="cod-info">
                    <div className="cod-icon">💵</div>
                    <h4>Cash on Delivery</h4>
                    <p>Pay cash when your order is delivered</p>
                    <p className="cod-note">Additional ₹50 handling charges may apply</p>
                  </div>
                </div>
              )}

              {/* Pay Button */}
              <button
                className="pay-button"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing Payment...
                  </>
                ) : (
                  `Pay ₹${orderData.total.toFixed(2)}`
                )}
              </button>

              <div className="payment-security">
                <svg className="security-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Your payment is secured with 256-bit SSL encryption</span>
              </div>
            </div>

            {/* Order Summary */}
            <div className="payment-summary">
              <h3 className="summary-title">Order Summary</h3>
              
              <div className="summary-items">
                {orderData.items.map((item) => (
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
                  <span>₹{orderData.subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>₹{orderData.shipping.toFixed(2)}</span>
                </div>
                {orderData.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount</span>
                    <span>-₹{orderData.discount.toFixed(2)}</span>
                  </div>
                )}
                {selectedPaymentMethod === 'cod' && (
                  <div className="summary-row">
                    <span>COD Charges</span>
                    <span>₹50.00</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{(orderData.total + (selectedPaymentMethod === 'cod' ? 50 : 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="summary-address">
                <h4>Delivery Address</h4>
                <p>
                  {orderData.shippingAddress.flatNo}, {orderData.shippingAddress.locality}<br />
                  {orderData.shippingAddress.city} - {orderData.shippingAddress.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Payment;

