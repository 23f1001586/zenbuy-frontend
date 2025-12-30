import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductList from './components/ProductList';
import OAuthCallback from './pages/OAuthCallback';
import EditProfile from './pages/EditProfile';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/oauth2/success" element={<OAuthCallback />} />
        <Route path="/oauth2/failure" element={<OAuthCallback />} />
      </Routes>
    </Router>
  );
}

export default App;
