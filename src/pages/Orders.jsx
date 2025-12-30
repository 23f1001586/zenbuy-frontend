import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getUserOrders } from '../services/api';
import './Orders.css';

function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }

    // Apply theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    const bodyClass = savedTheme === 'dark' ? 'dark-theme' : '';
    document.body.className = bodyClass;

    // Fetch orders - try backend first, fallback to localStorage
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getUserOrders(user.id);
        const backendOrders = response.data || [];
        
        // Also get orders from localStorage (for PayU pending orders)
        const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const payuOrders = localOrders.filter(o => o.paymentMethod === 'PAYU' && o.paymentStatus === 'PENDING');
        
        // Combine and deduplicate (backend orders take priority)
        const backendOrderNumbers = new Set(backendOrders.map(o => o.orderNumber));
        const combinedOrders = [...backendOrders, ...payuOrders.filter(o => !backendOrderNumbers.has(o.orderNumber))];
        
        // Sort by date
        combinedOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        setOrders(combinedOrders);
        setError('');
      } catch (err) {
        console.error('Error fetching orders:', err);
        // Fallback to localStorage if backend fails
        const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        localOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        setOrders(localOrders);
        setError('');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user.id, navigate]);

  // Show success message if order was just placed
  useEffect(() => {
    if (location.state?.message) {
      alert(location.state.message);
    }
  }, [location.state]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const status = paymentStatus?.toLowerCase() || 'pending';
    let displayStatus = paymentStatus || 'PENDING';
    
    // Map status for better display
    if (status === 'pending') {
      displayStatus = 'VERIFICATION';
    }
    
    return (
      <span className={`payment-status-badge ${status}`}>
        {displayStatus}
      </span>
    );
  };

  const getPaymentMethodDisplay = (method) => {
    if (!method) return 'N/A';
    const methodMap = {
      'CARD': 'Credit/Debit Card',
      'UPI': 'UPI',
      'NETBANKING': 'Net Banking',
      'WALLET': 'Digital Wallet',
      'PAYU': 'PayU',
      'COD': 'Cash on Delivery'
    };
    return methodMap[method.toUpperCase()] || method;
  };

  return (
    <div className={`orders-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <header className="orders-header">
        <div className="orders-header-content">
          <h1 className="orders-logo">ZENBUY</h1>
          <Link to="/products" className="back-to-products">
            ← Back to Products
          </Link>
        </div>
      </header>

      <main className="orders-main">
        <div className="orders-container">
          <h2 className="orders-title">My Orders</h2>

          {loading ? (
            <div className="loading-orders">
              <div className="spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : error ? (
            <div className="error-orders">
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="orders-button primary">
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <svg className="empty-orders-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3>No orders yet</h3>
              <p>Your order history will appear here once you place an order.</p>
              <Link to="/products" className="orders-button primary">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-header-left">
                      <h3 className="order-id">Order #{order.orderNumber || order.id}</h3>
                      <span className="order-date">{formatDate(order.orderDate)}</span>
                    </div>
                    <div className="order-header-right">
                      <span className={`order-status ${order.status?.toLowerCase() || 'pending'}`}>
                        {order.status || 'Pending'}
                      </span>
                      <span className="order-total">₹{order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  {/* Payment Verification Section */}
                  <div className="order-payment-info">
                    <div className="payment-info-row">
                      <span className="payment-info-label">Payment Status:</span>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                    <div className="payment-info-row">
                      <span className="payment-info-label">Payment Method:</span>
                      <span className="payment-method">{getPaymentMethodDisplay(order.paymentMethod)}</span>
                    </div>
                    {order.paymentStatus === 'COMPLETED' && (
                      <div className="payment-verified">
                        <svg className="verified-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>Payment Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="order-summary">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    {order.shipping > 0 && (
                      <div className="summary-row">
                        <span>Shipping:</span>
                        <span>₹{order.shipping?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="summary-row discount">
                        <span>Discount:</span>
                        <span>-₹{order.discount?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>₹{order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  <div className="order-items">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={item.id || index} className="order-item">
                          {item.imageUrl && (
                            <div className="order-item-image">
                              <img src={item.imageUrl} alt={item.productName || item.name} />
                            </div>
                          )}
                          <div className="order-item-details">
                            <h4 className="order-item-name">{item.productName || item.name}</h4>
                            <div className="order-item-info">
                              <span className="order-item-quantity">Quantity: {item.quantity}</span>
                              <span className="order-item-price">₹{item.price?.toFixed(2) || '0.00'} each</span>
                            </div>
                          </div>
                          <div className="order-item-total">
                            ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-items">No items found</p>
                    )}
                  </div>

                  {/* Shipping Address */}
                  {(order.shippingFlatNo || order.shippingLocality) && (
                    <div className="order-shipping">
                      <h4>Shipping Address</h4>
                      <p>
                        {order.shippingFlatNo && `${order.shippingFlatNo}, `}
                        {order.shippingLocality && `${order.shippingLocality}, `}
                        {order.shippingCity && `${order.shippingCity} - `}
                        {order.shippingPincode && order.shippingPincode}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Orders;

