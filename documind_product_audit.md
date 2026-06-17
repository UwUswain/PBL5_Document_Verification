# DOCUMIND (PBL5) PRODUCT AUDIT REPORT

Báo cáo này được thực hiện qua việc phân tích kiến trúc, API và mã nguồn của hệ thống DocuMind. Mục tiêu là định vị hiện trạng (Current State), nhận diện Nợ kỹ thuật (Technical Debt) và vạch ra lộ trình (Roadmap) tối đa hóa giá trị sản phẩm.

---

## 1. EXISTING FEATURES (Hiện trạng tính năng)

| Tính năng | Trạng thái | Ghi chú / Chi tiết |
| :--- | :--- | :--- |
| **Authentication & Role** | Đã hoàn thiện | JWT Auth, Role-based (Admin/User). |
| **Document Upload** | Đã hoàn thiện | Hỗ trợ Image/PDF, xử lý form-data. |
| **OCR Pipeline** | Đã hoàn thiện | VietOCR trích xuất chữ từ ảnh/PDF sang `raw_text`. |
| **AI Analysis** | Đã hoàn thiện | Dùng Gemini phân tích Category, Insight, Keywords, Main points. |
| **Semantic Search** | Đã hoàn thiện | Tìm kiếm ngữ nghĩa bằng ChromaDB & Vector Embeddings. |
| **QR Verification** | Đã hoàn thiện | Sinh Public Token & Mã QR để xác thực văn bản công khai. |
| **Dashboard Analytics** | Đã hoàn thiện | Thống kê số liệu thực tế bằng Recharts (Overview, Trend, Pie). |
| **Activity History** | Đã hoàn thiện | Lịch sử luân chuyển và Processing Timeline trên giao diện. |
| **Document Detail** | Đã hoàn thiện | Card Layout hiển thị đầy đủ thông tin AI và thông tin cơ bản. |
| **Export PDF Report** | Đã hoàn thiện | CSS Print API layout gọn gàng (Zero-dependency). |
| **AI Assistant (Chat)** | Đã hoàn thiện | Chat riêng với từng văn bản bằng Context-First Prompting. |

---

## 2. HIDDEN FEATURES (Tính năng "ngầm" chưa khai thác hết)

1. **Manual Signature/Seal Verification**: 
   - *Thực trạng*: Backend đã có API `POST /documents/{id}/manual-verify` hỗ trợ Admin tự crop lại ảnh chữ ký/con dấu để xác thực thủ công.
   - *Thiếu sót*: Frontend chưa có giao diện Crop ảnh chuyên dụng để truyền tọa độ hoặc ảnh cắt lên API này.
2. **Pagination (Phân trang)**:
   - *Thực trạng*: Backend `/docs` hỗ trợ cực tốt `limit` và `offset`.
   - *Thiếu sót*: Frontend Dashboard đang hardcode `getDocs(100, 0)`, nếu hệ thống có 10,000 file sẽ bị tràn RAM hoặc load cực chậm.
3. **User Management**:
   - *Thực trạng*: Database có bảng User, có phân quyền Role.
   - *Thiếu sót*: Admin chưa có trang Dashboard quản lý (Khóa/Mở/Xóa) người dùng.
4. **VectorDB Re-indexing**:
   - *Thực trạng*: Backend có script `reindex_vectors.py` cực xịn.
   - *Thiếu sót*: UI không có nút "Đồng bộ lại dữ liệu Search" cho Admin.

---

## 3. MISSING FEATURES (Tính năng Doanh nghiệp còn thiếu)

Với chuẩn của một **AI Document Management System (DMS)**, hệ thống đang khuyết các tính năng sau:
1. **Document Versioning**: Lịch sử phiên bản (Version 1.0, 1.1) khi có cập nhật file đính kèm.
2. **Approval Workflow**: Luồng phê duyệt (Trình ký -> Chờ duyệt -> Đã duyệt -> Ban hành).
3. **Audit Trail (System Log)**: Nhật ký hệ thống ghi lại lịch sử thao tác của mọi User (User A tải file lúc 8h, Admin B xóa file lúc 9h).
4. **Bulk Operations**: Các thao tác hàng loạt (Chọn nhiều file để Xóa, Tải về file ZIP, Phê duyệt nhiều file).
5. **Real-time Notifications**: Thông báo chuông (Websocket) khi OCR xong, AI chạy xong hoặc file bị lỗi.
6. **OCR Correction UI**: Giao diện cho phép người dùng sửa lại chữ bị nhận diện sai trước khi nạp vào AI.
7. **Document Watermarking**: Đóng dấu chìm tên người tải xuống file (Chống leak dữ liệu).

---

## 4. QUICK WINS (Top 10 - Tăng giá trị cực nhanh, Rủi ro thấp, < 1 ngày)

Đây là các tính năng "Low hanging fruit" - làm cực nhanh, không đụng kiến trúc nhưng làm sản phẩm trông "Enterprise" hơn hẳn:
1. **Download Document File**: Nút "Tải file gốc" về máy (Hiện tại mới chỉ xem được).
2. **Copy OCR Text**: Nút "Sao chép toàn bộ văn bản gốc" trên giao diện chi tiết tài liệu.
3. **Advanced Filter UI**: Thêm bộ lọc Date Range (Khoảng thời gian) và Category Dropdown (thay vì chỉ dùng Search Text).
4. **Bulk Actions (Delete)**: Thêm Checkbox vào Ant Design Table để xóa nhiều văn bản cùng lúc.
5. **Share Public Link Button**: Nút "Copy Link Xác Thực" (Đường link của QR code) để user share nhanh qua Zalo/Email.
6. **Pagination Integration**: Gắn biến `page` vào hook `useQuery` để phân trang thực sự thay vì load cứng 100 file.
7. **Empty States**: Các hình ảnh báo lỗi / rỗng thân thiện (Ví dụ: Tab Suspicious nếu không có lỗi thì hiện hình "Mọi thứ đều hoàn hảo").
8. **Toast/Polling Update**: Thêm cơ chế tự động refresh (`refetchInterval`) 5 giây 1 lần cho đến khi tài liệu `PROCESSING` chuyển sang `COMPLETED` để user không phải tự F5.
9. **Admin Re-index Button**: Giao diện Cài đặt (Settings) có nút gọi API chạy lại ChromaDB.
10. **Global Dark Mode**: Kích hoạt Config Theme của Ant Design để hỗ trợ Chế độ tối.

---

## 5. MEDIUM FEATURES (1 - 3 ngày làm việc)

1. **User Management Dashboard**: Xây dựng trang `/users` cho Admin quản trị tài khoản nhân viên.
2. **Manual Verification Tool**: Giao diện tích hợp `react-image-crop`, cho phép Admin khoanh vùng chữ ký thủ công trên ảnh văn bản, gửi lên API xác thực.
3. **OCR Text Correction**: Giao diện Split-screen (Trái ảnh, Phải chữ) cho phép user chỉnh sửa text OCR bị sai sót trước khi "Ép AI đọc lại".
4. **Recycle Bin (Thùng rác)**: Implement Soft Delete (Thêm cờ `is_deleted` vào DB), cho phép khôi phục tài liệu lỡ xóa.

---

## 6. ADVANCED FEATURES (Định hướng làm Đồ án Tốt nghiệp / Commercial)

1. **AI Multi-Document Chat**: Cho phép chọn 2-5 văn bản cùng lúc và yêu cầu AI: "So sánh chính sách của 3 công văn này". (Sử dụng ChromaDB RAG tổng hợp).
2. **Dynamic Approval Workflow**: Engine cho phép Admin tự định nghĩa luồng duyệt (Vd: Nhân viên Upload -> Trưởng phòng duyệt OCR -> Giám đốc ký điện tử).
3. **Auto-Categorization Rules Engine**: Bộ lọc Rule (Vd: Nếu chứa chữ "Biên bản" tự động tag phòng "Hành chính", tự động cấp quyền cho người A, B).
4. **Digital Signature Integration**: Tích hợp ký số eSign / USB Token thật sự lên bản PDF.

---

## 7. TECHNICAL DEBT (Nợ kỹ thuật - Các điểm rủi ro cần lưu ý)

1. **Cơ chế Real-time (Websockets)**: Việc xử lý OCR và AI tốn thời gian, hiện tại dùng request truyền thống khiến trải nghiệm phải "chờ" hoặc "F5".
2. **Thiếu cơ chế Queuing mạnh (Celery/RabbitMQ)**: Nếu có 100 users upload 100 file cùng lúc, BackgroundTasks của FastAPI có thể bị nghẽn RAM và tràn Rate Limit của Gemini.
3. **Log lỗi gom chung (`status = FAILED`)**: Không phân tách rạch ròi được File bị lỗi do ảnh mờ (OCR hỏng) hay do AI sập/Timeout, dẫn đến khó debug.
4. **Hard Delete**: Xóa Document là bay luôn cả file vật lý và data trong DB, không có cơ chế Undo (Soft Delete).
5. **Rate Limit Handle**: Dù đã có code Retry 429 cho Gemini, nhưng khi Quota cạn kiệt, toàn bộ hệ thống trí tuệ sẽ tê liệt mà không có Fallback lưu Queue để chạy bù vào ngày mai.

---

## 8. ROADMAP PHÁT TRIỂN TIẾP THEO

**Tiêu chí**: Nâng tầm dự án lên mức sản phẩm Doanh nghiệp (Enterprise) với effort thấp nhất.

### PHASE 1: POLISH & QUICK WINS (Hoàn thiện trải nghiệm)
*Tập trung giải quyết các lỗi vặt và tối đa hóa UX (1 tuần).*
- Hoàn thiện Pagination cho bảng Dashboard.
- Nút Download file gốc & Copy Text.
- Cài đặt cơ chế Polling (tự động cập nhật data sau mỗi 5s cho các file `PROCESSING`).
- Tính năng Bulk Delete.

### PHASE 2: ADMIN & DATA GOVERNANCE (Kiểm soát dữ liệu)
*Nhắm vào nhóm người dùng Quản trị viên (2-3 tuần).*
- Dashboard Quản lý User (Thêm, Sửa, Xóa, Phân quyền).
- Tích hợp công cụ Manual Crop chữ ký (Giải quyết Hidden Feature).
- Khả năng sửa text OCR (Correction UI).
- Gắn Soft Delete (Thùng rác).

### PHASE 3: ADVANCED ENTERPRISE (Tương lai dài hạn)
*Phát triển các tính năng "Ăn tiền" (1-2 tháng).*
- AI Multi-Document Chat (RAG mở rộng).
- Workflow duyệt văn bản nhiều cấp.
- Watermarking & Security Logs (Audit Trail).
