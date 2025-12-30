import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <header className="homepage-header">
        <div className="header-buttons">
          <button 
            className="btn-login" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="btn-signup" 
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
        </div>
      </header>
      
      <main className="homepage-main">
        <div className="logo-container">
          <h1 className="zenbuy-logo">ZENBUY</h1>
          <p className="tagline">Your Zen Shopping Experience</p>
        </div>
      </main>
    </div>
  );
}

export default HomePage;

