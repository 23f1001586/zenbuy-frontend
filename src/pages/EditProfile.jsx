import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../services/api';
import './Auth.css';

function EditProfile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    profilePic: user.profilePic || '',
    flatNo: user.flatNo || '',
    locality: user.locality || '',
    city: user.city || '',
    pincode: user.pincode || '',
    age: user.age || ''
  });
  const [profilePicPreview, setProfilePicPreview] = useState(user.profilePic || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user.id) {
      navigate('/login');
    }
  }, [user.id, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({
          ...formData,
          profilePic: base64String
        });
        setProfilePicPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.age && (isNaN(formData.age) || formData.age < 1 || formData.age > 150)) {
      setError('Please enter a valid age (1-150)');
      return;
    }
    
    setLoading(true);

    try {
      const response = await updateProfile(
        user.id,
        formData.name, 
        formData.email,
        formData.profilePic || null,
        formData.flatNo || null,
        formData.locality || null,
        formData.city || null,
        formData.pincode || null,
        formData.age ? parseInt(formData.age) : null
      );
      
      // Update user in localStorage
      const updatedUser = {
        ...user,
        ...response.data.user
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSuccess('Profile updated successfully!');
      
      // Redirect to products page after 1.5 seconds
      setTimeout(() => {
        navigate('/products');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">ZENBUY</h1>
          <h2>Edit Profile</h2>
          <p>Update your profile information</p>
        </div>
        
        <div className="form-group profile-pic-group">
          <label htmlFor="profilePic">Profile Picture</label>
          <div className="profile-pic-upload-container">
            <label htmlFor="profilePic" className="profile-pic-upload-label">
              <input
                type="file"
                id="profilePic"
                name="profilePic"
                accept="image/*"
                onChange={handleFileChange}
                className="profile-pic-input"
              />
              {profilePicPreview ? (
                <div className="profile-pic-preview">
                  <img 
                    src={profilePicPreview} 
                    alt="Profile preview" 
                    className="profile-pic-image"
                  />
                  <div className="profile-pic-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>Change Photo</span>
                  </div>
                </div>
              ) : (
                <div className="profile-pic-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="profile-pic-text">Upload Photo</span>
                  <span className="profile-pic-hint">Click to browse</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Email cannot be changed
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter your age"
              min="1"
              max="150"
            />
          </div>

          <div className="address-section">
            <label className="address-section-label">Address</label>
            <div className="address-fields">
              <div className="form-group address-field-group">
                <label htmlFor="flatNo">Flat / House No.</label>
                <input
                  type="text"
                  id="flatNo"
                  name="flatNo"
                  value={formData.flatNo}
                  onChange={handleChange}
                  placeholder="e.g., 123, Block A"
                />
              </div>
              
              <div className="form-group address-field-group">
                <label htmlFor="locality">Area / Locality</label>
                <input
                  type="text"
                  id="locality"
                  name="locality"
                  value={formData.locality}
                  onChange={handleChange}
                  placeholder="e.g., Downtown, Main Street"
                />
              </div>
              
              <div className="form-group address-field-group">
                <label htmlFor="city">City / Town</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., New York, Mumbai"
                />
              </div>
              
              <div className="form-group address-field-group">
                <label htmlFor="pincode">Pincode / Zip Code</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g., 10001, 400001"
                  pattern="[0-9]*"
                  maxLength="10"
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message" style={{ 
              background: '#e8f5e9', 
              color: '#2e7d32', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #c8e6c9'
            }}>
              {success}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              type="button"
              className="auth-button"
              style={{ 
                background: '#757575', 
                flex: 1 
              }}
              onClick={() => navigate('/products')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="auth-button"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;

