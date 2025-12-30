import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get user info from backend after OAuth redirect
        const response = await axios.get('http://localhost:8080/api/oauth2/user', {
          withCredentials: true
        });

        if (response.data.user) {
          // Store user info in localStorage
          localStorage.setItem('user', JSON.stringify(response.data.user));
          // Navigate to products page
          navigate('/products');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        navigate('/login?error=oauth_failed');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">ZENBUY</h1>
          <p>Completing your login...</p>
        </div>
      </div>
    </div>
  );
}

export default OAuthCallback;

