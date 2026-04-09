import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000/api" });

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──
export const registerUser = (email: string, password: string, name: string) =>
  API.post("/auth/register", { email, password, name });

export const loginUser = (email: string, password: string) =>
  API.post("/auth/login", { email, password });

export const getMe = () => API.get("/auth/me");

// ── Products ──
export const getProducts = (category?: string) =>
  API.get("/products/", { params: category ? { category } : {} });

export const getProduct = (id: string) => API.get(`/products/${id}`);

// ── Cart ──
export const getCart = () => API.get("/cart/");
export const addToCart = (product_id: string, quantity = 1) =>
  API.post("/cart/add", { product_id, quantity });
export const updateCartItem = (product_id: string, quantity: number) =>
  API.put("/cart/update", { product_id, quantity });
export const removeFromCart = (product_id: string) =>
  API.delete(`/cart/remove/${product_id}`);
export const clearCart = () => API.delete("/cart/clear");

// ── Payment ──
export const initiatePayment = (upi_id: string, amount: number) =>
  API.post("/payment/initiate", { upi_id, amount });
export const verifyOTP = (transaction_id: string, otp: string) =>
  API.post("/payment/verify-otp", { transaction_id, otp });
export const getPaymentHistory = () => API.get("/payment/history");

export default API;
