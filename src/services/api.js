import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api"
});

export const fetchProducts = () => API.get("/products");

export const signup = (name, email, password, profilePic, flatNo, locality, city, pincode, age) => 
  API.post("/auth/signup", { name, email, password, profilePic, flatNo, locality, city, pincode, age });

export const login = (email, password) => 
  API.post("/auth/login", { email, password });

export const updateProfile = (userId, name, email, profilePic, flatNo, locality, city, pincode, age) => 
  API.put(`/auth/profile/${userId}`, { name, email, profilePic, flatNo, locality, city, pincode, age });

export const adminLogin = (email, password) => 
  API.post("/auth/admin/login", { email, password });

export const getAdminStats = () => API.get("/admin/stats");
export const getAllUsers = () => API.get("/admin/users");
export const deleteUser = (userId) => API.delete(`/admin/users/${userId}`);
export const createProduct = (product) => API.post("/products", product);
export const updateProduct = (productId, product) => API.put(`/products/${productId}`, product);
export const deleteProduct = (productId) => API.delete(`/products/${productId}`);
export const getAllCoupons = () => API.get("/admin/coupons");
export const createCoupon = (coupon) => API.post("/admin/coupons", coupon);
export const updateCoupon = (couponId, coupon) => API.put(`/admin/coupons/${couponId}`, coupon);
export const deleteCoupon = (couponId) => API.delete(`/admin/coupons/${couponId}`);
export const validateCoupon = (code, orderAmount) => API.get(`/coupons/validate/${code}`, { params: { orderAmount } });
export const processPayment = (userId, orderData) => API.post("/orders/payment", { userId, order: orderData });
export const getUserOrders = (userId) => API.get(`/orders/user/${userId}`);