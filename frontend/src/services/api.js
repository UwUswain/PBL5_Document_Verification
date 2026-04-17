import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// TỰ ĐỘNG DÁN TOKEN: Cứ mỗi khi gửi request, nó sẽ tự lấy token từ máy ông dán vào Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pbl5_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const docService = {
  // Đăng nhập thật: Lấy access_token từ FastAPI
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const res = await api.post('/auth/login', formData);
    if (res.data.access_token) {
      localStorage.setItem("pbl5_token", res.data.access_token);
    }
    return res.data;
  },

  // Đăng xuất: Xóa token
  logout: () => {
    localStorage.removeItem("pbl5_token");
  },

  getDocs: () => api.get('/docs'),

  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/docs/upload', fd);
  },

  getImageUrl: (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${BASE_URL}/storage/${path.replace(/^\//, '')}`;
  }
};