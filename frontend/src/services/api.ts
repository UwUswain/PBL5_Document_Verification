import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 

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

  getImageUrl: (path: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    
    // Nếu path bắt đầu bằng /storage thì nối thẳng BASE_URL
    if (path.startsWith('/storage')) {
      return `${BASE_URL}${path}`;
    }

    // Fallback cho logic cũ nếu path chỉ là tên file
    const fileName = path.split(/[\\/]/).pop();
    return `${BASE_URL}/storage/uploads/${fileName}`;
  },
  
  searchDocs: (query: string) => api.get("/docs/search", { params: { query } }),
  
  deleteDoc: (id: string) => api.delete(`/docs/${id}`),
  
  getProfile: () => api.get("/users/me"),
  
  manualVerify: (docId: string, file: Blob, labelType: string) => {
    const formData = new FormData();
    formData.append("file", file, 'manual_crop.png');
    return api.post(`/docs/${docId}/manual-verify`, formData, {
      params: { label_type: labelType },
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getPendingReview: (limit = 20, offset = 0) => api.get("/docs/admin/pending-review", { params: { limit, offset } }),

  // Admin User Management
  adminGetAllUsers: () => api.get("/users/"),
  adminUpdateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  adminDeleteUser: (id: string) => api.delete(`/users/${id}`),

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
