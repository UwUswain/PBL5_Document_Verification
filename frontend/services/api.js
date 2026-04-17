import axios from 'axios';

const BASE_URL = 'http://localhost:8000'; // Cổng FastAPI của ông

const api = axios.create({
  baseURL: `${BASE_URL}/api`, 
});

export const docService = {
  // 1. Lấy danh sách: khớp với prefix /api/docs trong main.py
  getDocs: () => api.get('/docs'),

  // 2. Upload: khớp với router.post("/upload") trong module documents
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file); // Chú ý: 'file' phải khớp với tên tham số trong FastAPI
    return api.post('/docs/upload', fd);
  },

  // 3. Helper lấy URL ảnh: Khớp với app.mount("/storage", ...)
  getImageUrl: (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path; // Nếu là link mock
    // Nối với đường dẫn storage của Backend
    return `${BASE_URL}/storage/${path.replace(/^\//, '')}`;
  }
};