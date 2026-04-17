import axios from "axios";

const BASE_URL = "http://localhost:8000"; 

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pbl5_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Đổi tên từ apiService thành docService để khớp với App.jsx
export const docService = {
  login: async (username, password) => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    const res = await api.post("/auth/login", formData);
    if (res.data.access_token) {
      localStorage.setItem("pbl5_token", res.data.access_token);
    }
    return res.data;
  },
  
  // Sửa tên hàm cho khớp với App.jsx
  getDocs: () => api.get("/docs"),
  
  upload: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/docs/upload", formData);
  },

  getImageUrl: (path, type = 'uploads') => {
    if (!path) return null;
    const BASE_URL = "http://localhost:8000";

    if (path.startsWith("http")) return path;

    //Lấy duy nhất tên file (vứt bỏ D:\... hay /storage/...)
    const fileName = path.split(/[\\/]/).pop();

    // xử lý theo loại folder
    if (path.includes("qrcodes")) {
      return `${BASE_URL}/storage/qrcodes/${fileName}`;
    }

    // Xử lý ảnh Scan (Uploads)
    //file là .png. Nếu tên file chưa có đuôi, ta tự thêm vào.
    const finalFileName = fileName.includes('.') ? fileName : `${fileName}.png`;
    
    return `${BASE_URL}/storage/uploads/${finalFileName}`;
  },

  logout: () => {
    localStorage.removeItem("pbl5_token");
    window.location.reload(); // Reload để về màn login
  }
};