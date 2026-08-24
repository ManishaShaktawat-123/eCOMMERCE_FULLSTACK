import axios from "axios";

// During development, Vite proxies /api to the FastAPI backend (see vite.config.js).
// In production, set VITE_API_BASE_URL to your deployed backend URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({ baseURL: BASE_URL });

export const getHealth = () => api.get("/api/health").then((r) => r.data);

export const getSummary = () => api.get("/api/summary").then((r) => r.data);

export const getScatter = (sampleSize = 1200) =>
  api.get("/api/scatter", { params: { sample_size: sampleSize } }).then((r) => r.data);

export const getProducts = (q = "") =>
  api.get("/api/products", { params: q ? { q } : {} }).then((r) => r.data.products);

export const searchProduct = (name) =>
  api.get(`/api/product/${encodeURIComponent(name)}`).then((r) => r.data);

export default api;
