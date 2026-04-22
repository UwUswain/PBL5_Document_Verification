import axios from 'axios';

const BASE_URL = "http://localhost:8000"; 

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem("pbl5_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("pbl5_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const docService = {
  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    const res = await api.post("/auth/login", formData);
    if (res.data.access_token && typeof window !== 'undefined') {
      localStorage.setItem("pbl5_token", res.data.access_token);
    }
    return res.data;
  },
  
  getDocs: (limit = 10, offset = 0) => api.get("/docs", { params: { limit, offset } }),
  
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/docs/upload", formData);
  },

  getImageUrl: (path: string, type = 'uploads') => {
    if (!path) return null;
    const BASE_URL = "http://localhost:8000";
    if (path.startsWith("http")) return path;

    const fileName = path.split(/[\\/]/).pop();
    if (path.includes("qrcodes")) {
      return `${BASE_URL}/storage/qrcodes/${fileName}`;
    }

    const finalFileName = fileName?.includes('.') ? fileName : `${fileName}.png`;
    return `${BASE_URL}/storage/uploads/${finalFileName}`;
  },
  
  searchDocs: (query: string) => api.get("/docs/search", { params: { query } }),

  chat: (message: string) => {
    return api.post("/chat", { message });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("pbl5_token");
      window.location.href = "/login";
    }
  }
};
