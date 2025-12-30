import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats, getAllUsers, deleteUser, fetchProducts, createProduct, updateProduct, deleteProduct, getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../services/api';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [theme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, revenue: 0 });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, products, coupons
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '',
    stockQuantity: ''
  });
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    maxUses: '',
    minPurchaseAmount: '',
    description: ''
  });

  useEffect(() => {
    // Check if user is admin
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!savedUser.id || savedUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    
    setUser(savedUser);

    // Apply theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    const bodyClass = savedTheme === 'dark' ? 'dark-theme' : '';
    document.body.className = bodyClass;

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, productsRes, couponsRes] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        fetchProducts(),
        getAllCoupons()
      ]);
      
      // Log for debugging
      console.log('API Responses:', {
        stats: statsRes.data,
        usersCount: usersRes.data?.length,
        productsCount: productsRes.data?.length,
        couponsCount: couponsRes.data?.length
      });
      
      if (statsRes.data) {
        setStats(statsRes.data);
      }
      if (usersRes.data) {
        setUsers(usersRes.data);
      }
      if (productsRes.data) {
        setProducts(productsRes.data);
      }
      if (couponsRes.data) {
        setCoupons(couponsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error response:', error.response);
      alert(`Failed to load admin data: ${error.response?.data?.error || error.message}. Check the console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
    } catch (error) {
      alert('Failed to delete user');
      console.error(error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      setStats({ ...stats, totalProducts: stats.totalProducts - 1 });
    } catch (error) {
      alert('Failed to delete product');
      console.error(error);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      imageUrl: product.imageUrl || '',
      category: product.category || '',
      stockQuantity: product.stockQuantity || ''
    });
    setShowProductModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      category: '',
      stockQuantity: ''
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        imageUrl: productForm.imageUrl,
        category: productForm.category,
        stockQuantity: parseInt(productForm.stockQuantity)
      };

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, productData);
        setProducts(products.map(p => p.id === editingProduct.id ? updated.data : p));
      } else {
        const created = await createProduct(productData);
        setProducts([...products, created.data]);
        setStats({ ...stats, totalProducts: stats.totalProducts + 1 });
      }

      setShowProductModal(false);
      setProductForm({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        category: '',
        stockQuantity: ''
      });
    } catch (error) {
      alert('Failed to save product');
      console.error(error);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }
    
    try {
      await deleteCoupon(couponId);
      setCoupons(coupons.filter(c => c.id !== couponId));
    } catch (error) {
      alert('Failed to delete coupon');
      console.error(error);
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    const validFrom = coupon.validFrom ? coupon.validFrom.split('T')[0] : '';
    const validUntil = coupon.validUntil ? coupon.validUntil.split('T')[0] : '';
    setCouponForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'PERCENTAGE',
      discountValue: coupon.discountValue || '',
      validFrom: validFrom,
      validUntil: validUntil,
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      maxUses: coupon.maxUses || '',
      minPurchaseAmount: coupon.minPurchaseAmount || '',
      description: coupon.description || ''
    });
    setShowCouponModal(true);
  };

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setCouponForm({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      validFrom: tomorrow.toISOString().split('T')[0],
      validUntil: nextMonth.toISOString().split('T')[0],
      isActive: true,
      maxUses: '',
      minPurchaseAmount: '',
      description: ''
    });
    setShowCouponModal(true);
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format dates as local date-time strings (without timezone conversion)
      // This ensures the dates match the server's LocalDateTime comparison
      const formatLocalDateTime = (dateString, time) => {
        if (!dateString) return null;
        // Create date string in format: YYYY-MM-DDTHH:mm:ss
        return `${dateString}T${time}`;
      };

      const couponData = {
        code: couponForm.code,
        discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue),
        validFrom: formatLocalDateTime(couponForm.validFrom, '00:00:00'),
        validUntil: formatLocalDateTime(couponForm.validUntil, '23:59:59'),
        isActive: couponForm.isActive,
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : null,
        minPurchaseAmount: couponForm.minPurchaseAmount ? parseFloat(couponForm.minPurchaseAmount) : null,
        description: couponForm.description
      };

      if (editingCoupon) {
        const updated = await updateCoupon(editingCoupon.id, couponData);
        setCoupons(coupons.map(c => c.id === editingCoupon.id ? updated.data : c));
      } else {
        const created = await createCoupon(couponData);
        setCoupons([...coupons, created.data]);
      }

      setShowCouponModal(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save coupon');
      console.error(error);
    }
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className={`admin-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-logo">ZENBUY ADMIN</h1>
          <div className="admin-header-actions">
            <span className="admin-user-name">Welcome, {user.name}</span>
            <button className="admin-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-container">
          <div className="admin-tabs">
            <button 
              className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users ({users.length})
            </button>
            <button 
              className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Products ({products.length})
            </button>
            <button 
              className={`admin-tab ${activeTab === 'coupons' ? 'active' : ''}`}
              onClick={() => setActiveTab('coupons')}
            >
              Coupons ({coupons.length})
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <h2 className="admin-title">Admin Dashboard</h2>
              
              <div className="admin-stats">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p className="stat-value">{loading ? '...' : stats.totalUsers}</p>
                  <p className="stat-label">Registered Users</p>
                </div>
                <div className="stat-card">
                  <h3>Total Products</h3>
                  <p className="stat-value">{loading ? '...' : stats.totalProducts}</p>
                  <p className="stat-label">Available Products</p>
                </div>
                <div className="stat-card">
                  <h3>Total Orders</h3>
                  <p className="stat-value">{loading ? '...' : stats.totalOrders}</p>
                  <p className="stat-label">All Time Orders</p>
                </div>
                <div className="stat-card">
                  <h3>Revenue</h3>
                  <p className="stat-value">₹{loading ? '...' : stats.revenue.toFixed(2)}</p>
                  <p className="stat-label">Total Revenue</p>
                </div>
              </div>

              <div className="admin-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => navigate('/products')}>
                    View Products Page
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('users')}>
                    Manage Users
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('products')}>
                    Manage Products
                  </button>
                  <button className="action-btn" onClick={handleAddProduct}>
                    Add New Product
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="admin-section">
              <div className="section-header">
                <h2 className="admin-title">User Management</h2>
                <button className="refresh-btn" onClick={loadData}>Refresh</button>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Provider</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className={`role-badge ${u.role?.toLowerCase()}`}>{u.role || 'USER'}</span></td>
                        <td>{u.provider || 'local'}</td>
                        <td>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.role === 'ADMIN'}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="admin-section">
              <div className="section-header">
                <h2 className="admin-title">Product Management</h2>
                <div>
                  <button className="refresh-btn" onClick={loadData}>Refresh</button>
                  <button className="add-btn" onClick={handleAddProduct}>Add Product</button>
                </div>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.category}</td>
                        <td>₹{p.price}</td>
                        <td className={p.stockQuantity > 0 ? 'in-stock' : 'out-of-stock'}>{p.stockQuantity}</td>
                        <td>
                          <button className="edit-btn" onClick={() => handleEditProduct(p)}>Edit</button>
                          <button className="delete-btn" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="admin-section">
              <div className="section-header">
                <h2 className="admin-title">Coupon Management</h2>
                <div>
                  <button className="refresh-btn" onClick={loadData}>Refresh</button>
                  <button className="add-btn" onClick={handleAddCoupon}>Add Coupon</button>
                </div>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Valid From</th>
                      <th>Valid Until</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.code}</strong></td>
                        <td>{c.discountType}</td>
                        <td>
                          {c.discountType === 'PERCENTAGE' 
                            ? `${c.discountValue}%` 
                            : `₹${c.discountValue}`}
                        </td>
                        <td>{new Date(c.validFrom).toLocaleDateString()}</td>
                        <td>{new Date(c.validUntil).toLocaleDateString()}</td>
                        <td>
                          <span className={`role-badge ${c.isActive ? 'admin' : 'user'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button className="edit-btn" onClick={() => handleEditCoupon(c)}>Edit</button>
                          <button className="delete-btn" onClick={() => handleDeleteCoupon(c.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
            <form onSubmit={handleCouponSubmit}>
              <div className="form-group">
                <label>Coupon Code</label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="WELCOME10"
                />
              </div>
              <div className="form-group">
                <label>Discount Type</label>
                <select
                  value={couponForm.discountType}
                  onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                  required
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FLAT">Flat Amount</option>
                </select>
              </div>
              <div className="form-group">
                <label>Discount Value {couponForm.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={couponForm.discountType === 'PERCENTAGE' ? '100' : undefined}
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Valid From</label>
                <input
                  type="date"
                  value={couponForm.validFrom}
                  onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Valid Until</label>
                <input
                  type="date"
                  value={couponForm.validUntil}
                  onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Uses (leave empty for unlimited)</label>
                <input
                  type="number"
                  min="1"
                  value={couponForm.maxUses}
                  onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="form-group">
                <label>Minimum Purchase Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={couponForm.minPurchaseAmount}
                  onChange={(e) => setCouponForm({ ...couponForm, minPurchaseAmount: e.target.value })}
                  placeholder="No minimum"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="Coupon description"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={couponForm.isActive}
                    onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCouponModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  value={productForm.stockQuantity}
                  onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
