# PROJECT_ANALYSIS.md

Đây là tài liệu phân tích kỹ thuật toàn diện của dự án **DocuMind** (PBL5) dựa trên mã nguồn thực tế. Tài liệu này đóng vai trò cơ sở dữ liệu kỹ thuật trung thực, không suy đoán, dùng để xây dựng các chương báo cáo, vẽ biểu đồ UML và ERD.

---

## 1. PROJECT OVERVIEW

- **Tên dự án:** DocuMind (Hệ thống xác thực và phân tích văn bản hành chính thông minh).
- **Loại hình:** Project Based Learning 5 (PBL5).
- **Trạng thái phát triển:** Solo developer.
- **Mục tiêu dự án:** Số hóa, tự động trích xuất thông tương, tóm tắt và xác minh tính toàn vẹn, hợp lệ của văn bản hành chính bằng AI.
- **Đối tượng sử dụng:**
  - Khách vãng lai (Public User): Quét mã QR để kiểm tra văn bản.
  - Người dùng nội bộ (User): Tải lên, quản lý, tra cứu tài liệu trong không gian lưu trữ (My Space).
  - Quản trị viên (Admin): Duyệt các văn bản có dấu hiệu đáng ngờ (Human-in-the-loop) và quản lý tài khoản.
- **Bài toán cần giải quyết:** Giảm rủi ro giả mạo văn bản hành chính, tiết kiệm thời gian trích xuất dữ liệu thủ công, cung cấp công cụ tra cứu văn bản theo ngữ nghĩa một cách nhanh chóng.
- **Các chức năng chính:** Quản lý văn bản, Bóc tách thực thể (chữ ký, con dấu), Phân tích ngữ nghĩa & tóm tắt, Tìm kiếm AI (Semantic Search), Xác thực tính toàn vẹn (SHA-256, QR Code).

---

## 2. SYSTEM ARCHITECTURE

Hệ thống được thiết kế theo kiến trúc Client-Server hiện đại, tích hợp một AI Pipeline bất đồng bộ ở phía Backend.

```text
[ Client Layer ]
      |
(Next.js App Router, React Query, Ant Design)
      |
      v
[ API Gateway & Business Logic Layer ]
      |
(FastAPI, Uvicorn, JWT Auth)
      |
      +---> [ DB Layer ] ---> PostgreSQL (Relational Data: Users, Documents)
      |
      +---> [ Vector Store ] ---> ChromaDB (Semantic Search Embeddings)
      |
      v
[ AI Pipeline Layer ]
      |-- OCR Service (Trích xuất Text thô)
      |-- Computer Vision (YOLOv8: Bóc tách chữ ký, con dấu)
      |-- NLP/LLM Service (Gemini API: Phân loại, tóm tắt, trích xuất dữ liệu)
      |-- Cross-Encoder (Local Reranking cho Search)
      |-- Integrity Check (SHA-256 Hashing, QR Generation)
```

---

## 3. TECHNOLOGY STACK

**Frontend Technologies**
- **Framework:** Next.js 14.2.5 (App Router)
- **Library:** React 18, React DOM
- **UI Components:** Ant Design 6.3.6, Tailwind CSS 3.4.1
- **State Management/Data Fetching:** `@tanstack/react-query` 5.99
- **Ngôn ngữ:** TypeScript 5

**Backend Technologies**
- **Framework:** FastAPI 0.110.0
- **Ngôn ngữ:** Python 3.10+
- **Server:** Uvicorn 0.29.0
- **Security:** bcrypt 5.0.0, python-jose 3.5.0, passlib 1.7.4

**Database Technologies**
- **RDBMS:** PostgreSQL (truy cập qua `asyncpg` 0.29.0)
- **ORM:** SQLAlchemy 2.0.29 (AsyncSession)
- **Migrations:** Alembic 1.13.1
- **Vector DB:** ChromaDB 1.5.8 (Lưu trữ vector cho Semantic Search)

**AI / NLP Technologies**
- **Computer Vision:** YOLOv8 (`ultralytics` 8.2.0) để nhận diện vùng chữ ký, con dấu.
- **LLM / Generative AI:** Google Gemini API (`google-generativeai` 0.8.6) dùng cho Deep Semantic Extraction và AI Summary (Model chính: `gemini-3.1-flash-lite-preview` / `gemini-1.5-flash`).
- **Semantic Search (Reranking):** Sentence Transformers (`sentence-transformers` 5.4.1) sử dụng mô hình Cross-Encoder để local rerank.
- **OCR:** PaddleOCR 2.7.3 (`paddleocr`, `paddlepaddle`).

---

## 4. FRONTEND SCREEN INVENTORY

| Route | Tên màn hình | Mục đích | Component chính |
| :--- | :--- | :--- | :--- |
| `/` | Landing Page | Giới thiệu hệ thống, tính năng, thống kê. | `page.tsx` |
| `/login` | Đăng nhập | Xác thực tài khoản người dùng. | `page.tsx` |
| `/register` | Đăng ký | Đăng ký tài khoản mới. | `page.tsx` |
| `/verify/[token]` | Xác thực QR | Xem công khai kết quả xác thực tài liệu bằng QR. | `page.tsx` |
| `/dashboard` | Dashboard | Thống kê FSM, tài liệu cộng đồng, trạng thái AI. | `page.tsx` |
| `/repository` | My Space | Quản lý, tải lên tài liệu cá nhân, phân loại. | `page.tsx`, `DocumentDetailDrawer` |
| `/search` | Tra cứu thông minh | Tìm kiếm ngữ nghĩa tài liệu, reranking. | `page.tsx` |
| `/profile` | Hồ sơ cá nhân | Quản lý thông tin tài khoản, thống kê cá nhân. | `page.tsx` |
| `/users` | Quản trị người dùng | Admin quản lý tài khoản, thay đổi quyền, khóa user. | `page.tsx` |

---

## 5. FUNCTIONAL ANALYSIS

- **Đăng ký / Đăng nhập:**
  - **Actor:** Khách
  - **Mô tả:** Đăng ký tài khoản mới và đăng nhập nhận JWT Token. Mật khẩu được băm (bcrypt).
  - **API:** `POST /api/auth/register`, `POST /api/auth/login`
- **Tải lên & Xử lý văn bản (Pipeline):**
  - **Actor:** User
  - **Mô tả:** Nhận file PDF/Image, băm SHA-256 (kiểm tra trùng lặp), chạy OCR, phân tích bằng Gemini, quét chữ ký bằng YOLOv8, lưu vào DB và ChromaDB.
  - **API:** `POST /api/docs/upload`
- **Quản lý không gian lưu trữ (My Space):**
  - **Actor:** User
  - **Mô tả:** Lấy danh sách văn bản cá nhân, xem chi tiết (hiển thị AI crops, tóm tắt), xóa văn bản.
  - **API:** `GET /api/docs`, `DELETE /api/docs/{id}`
- **Tra cứu văn bản (Semantic Search):**
  - **Actor:** User
  - **Mô tả:** Tìm kiếm văn bản bằng từ khóa ngữ nghĩa. Hệ thống truy xuất ChromaDB và Rerank kết quả bằng Cross-Encoder.
  - **API:** `GET /api/docs/search`
- **Kiểm duyệt thủ công (Human-in-the-loop):**
  - **Actor:** Admin
  - **Mô tả:** Xem danh sách các văn bản "SUSPICIOUS" (không nhận diện được chữ ký/con dấu), tự tay cắt vùng chữ ký/con dấu để xác thực bù.
  - **API:** `GET /api/docs/admin/pending-review`, `POST /api/docs/{id}/manual-verify`
- **Xác thực công khai (Public Verify):**
  - **Actor:** Khách vãng lai
  - **Mô tả:** Nhập token hoặc quét QR để xem trạng thái hợp lệ, thông tin bóc tách AI của văn bản mà không cần đăng nhập.
  - **API:** `GET /api/docs/verify/{public_token}`
- **Chia sẻ cộng đồng:**
  - **Actor:** User
  - **Mô tả:** Cho phép chia sẻ văn bản thành "Public" để người dùng khác tìm kiếm (mocking logic ẩn danh tên người chia sẻ).
  - **API:** Cập nhật biến `is_public` (Logic frontend có gọi giả lập nhưng phụ thuộc API backend).

---

## 6. USE CASE CANDIDATES

- **UC01:** Đăng ký tài khoản (Khách)
- **UC02:** Đăng nhập hệ thống (User, Admin)
- **UC03:** Xem trang chủ giới thiệu (Khách)
- **UC04:** Xác thực văn bản qua mã QR (Khách)
- **UC05:** Tải lên văn bản hành chính (User)
- **UC06:** Quản lý văn bản cá nhân (Xem, Xóa) (User)
- **UC07:** Chia sẻ văn bản lên cộng đồng (User)
- **UC08:** Tìm kiếm văn bản theo ngữ nghĩa (User)
- **UC09:** Quản lý thông tin hồ sơ cá nhân (User)
- **UC10:** Duyệt văn bản đáng ngờ thủ công (Admin)
- **UC11:** Quản lý tài khoản người dùng (Admin)

---

## 7. API INVENTORY

**Authentication (`/api/auth`)**
- `POST /api/auth/register` - Đăng ký (No Auth)
- `POST /api/auth/login` - Đăng nhập nhận JWT (No Auth)

**Users (`/api/users`)**
- `GET /api/users/me` - Lấy thông tin tài khoản đang đăng nhập (Auth: Yes)
- `GET /api/users/` - Lấy danh sách toàn bộ người dùng (Auth: Yes, Role: Admin)
- `PUT /api/users/{user_id}` - Cập nhật người dùng (Auth: Yes, Role: Admin)
- `DELETE /api/users/{user_id}` - Xóa người dùng (Auth: Yes, Role: Admin)

**Documents (`/api/docs`)**
- `GET /api/docs/dashboard/stats` - Lấy thống kê tổng quan (Auth: Yes)
- `GET /api/docs/public` - Lấy danh sách tài liệu chia sẻ cộng đồng (Auth: No)
- `GET /api/docs` - Lấy danh sách tài liệu cá nhân (Auth: Yes)
- `GET /api/docs/verify/{public_token}` - Xác minh tài liệu qua QR (Auth: No)
- `POST /api/docs/upload` - Tải lên & kích hoạt AI Pipeline (Auth: Yes)
- `GET /api/docs/search` - Tìm kiếm semantic search (Auth: Yes)
- `GET /api/docs/admin/pending-review` - Lấy tài liệu SUSPICIOUS (Auth: Yes, Role: Admin)
- `POST /api/docs/{document_id}/manual-verify` - Xác nhận thủ công (Auth: Yes, Role: Admin)
- `DELETE /api/docs/{document_id}` - Xóa tài liệu (Auth: Yes, Role: Admin)

---

## 8. DATABASE ANALYSIS

**Table: `users`**
- **Mục đích:** Lưu trữ thông tin tài khoản và phân quyền.
- **Cột:**
  - `id` (UUID, PK)
  - `created_at`, `updated_at` (DateTime)
  - `deleted_at` (DateTime, Nullable - Xóa mềm)
  - `email` (String 255, Unique)
  - `password_hash` (String 255)
  - `full_name` (String 255, Nullable)
  - `phone_number` (String 20, Nullable)
  - `avatar_url` (String 500, Nullable)
  - `role` (Enum: 'admin', 'user')
  - `is_active` (Boolean)
- **Quan hệ:** 1 User có N Documents.

**Table: `documents`**
- **Mục đích:** Lưu trữ thông tin metadata, kết quả phân tích AI và trạng thái văn bản.
- **Cột:**
  - `id` (UUID, PK)
  - `created_at`, `updated_at` (DateTime)
  - `owner_id` (UUID, Nullable, FK -> `users.id`)
  - `file_name`, `file_path` (String)
  - `sha256_hash` (String 64, Unique)
  - `qr_path` (String 500, Nullable)
  - `public_token` (String 64, Unique)
  - `raw_text` (Text, Nullable) - Kết quả OCR
  - `category` (String 100, Nullable) - Phân loại AI
  - `summary` (Text, Nullable) - Tóm tắt AI
  - `ai_results` (JSON, Nullable) - Tọa độ crop YOLO và insight Gemini
  - `status` (String 20) - Trạng thái FSM (RECEIVED, PROCESSING, OCR_DONE, ENRICHING, COMPLETED, FAILED)
  - `verification_status` (String 20) - Mức độ tin cậy (VERIFIED, SUSPICIOUS, PENDING)
  - `is_public` (Boolean)
- **Quan hệ:** N Documents thuộc 1 User.

---

## 9. AUTHENTICATION & AUTHORIZATION

- **Cơ chế xác thực:** JWT (JSON Web Token) truyền qua Header `Authorization: Bearer <token>`.
- **Luồng:** Người dùng gửi credentials (OAuth2PasswordRequestForm) -> Trả về `access_token` hợp lệ trong thời gian quy định -> Frontend gắn token vào API header qua middleware.
- **Phân quyền (RBAC):** Bảng User có Enum `role` (ADMIN, USER). API bảo vệ bằng Dependency `get_current_user` và `role_required(["admin"])`.

---

## 10. AI & DOCUMENT PROCESSING ANALYSIS

- **Text Extraction (OCR):**
  - **Công nghệ:** PaddleOCR / EasyOCR.
  - **File:** `app/shared/utils/ocr_service.py`
- **Deep Semantic Extraction & Summary:**
  - **Công nghệ:** Google Gemini API (`gemini-3.1-flash-lite-preview` / Fallback: `gemini-1.5-flash`).
  - **Logic:** Ép Gemini trả về JSON schema (category, issuer, summary_short, main_points, insight). Có cơ chế Fallback (Rule-based Regex) nếu AI bị chặn (Safety block) hoặc API quá tải.
  - **File:** `app/shared/utils/ai_service.py`
- **Computer Vision (Seal/Signature Detection):**
  - **Công nghệ:** YOLOv8.
  - **Logic:** Nhận diện và tự động crop ảnh các vùng chữ ký, con dấu. Lưu ảnh crop vào ổ cứng (`storage/crops/`) và lưu bounding box vào PostgreSQL (JSON).
  - **File:** `app/modules/documents/ai_logic.py` (SealDetector)
- **Semantic Search:**
  - **Công nghệ:** ChromaDB (Vector DB) + Bi-Encoder (Nhúng text thành Vector) + Cross-Encoder (Local Reranking).
  - **Logic:** Lọc 50 kết quả bằng ChromaDB, sau đó rerank lại bằng mô hình HuggingFace cục bộ để tăng độ chính xác.
  - **File:** `app/shared/utils/vector_service.py`
- **Integrity Check:**
  - **Công nghệ:** Hàm băm SHA-256 nội bộ Python, thư viện `qrcode`.
  - **Logic:** File stream tải lên được băm SHA-256 để chống trùng lặp dữ liệu. Gen QR chứa link đến trang Verify.
  - **File:** `app/shared/utils/hash_services.py`, `app/shared/utils/qr_services.py`

---

## 11. BUSINESS WORKFLOW ANALYSIS

**Luồng Xử lý Tài liệu (AI Pipeline FSM):**
1. **RECEIVED:** Nhận file từ User, tính toán mã băm SHA-256 kiểm tra trùng lặp. Khởi tạo record DB.
2. **PROCESSING:** Lưu file vật lý, chuyển đổi PDF sang ảnh (nếu cần).
3. **OCR_DONE:** Chạy mô hình OCR để bóc tách Text thô (raw_text).
4. **ENRICHING:** Gọi đồng thời LLM (Gemini) để phân loại/tóm tắt và YOLOv8 để định vị chữ ký/con dấu.
5. Kiểm duyệt nghiệp vụ (Business Evaluator): Nếu là Hợp đồng/Công văn mà không tìm thấy chữ ký -> Đánh dấu `SUSPICIOUS`. Nếu có -> Đánh dấu `VERIFIED`.
6. **COMPLETED:** Khởi tạo mã QR. Nhúng văn bản vào ChromaDB để phục vụ tìm kiếm.

---

## 12. PROJECT STRENGTHS

- **Human-in-the-loop Verification:** Admin có công cụ thủ công hỗ trợ cắt ảnh và chỉnh sửa trạng thái trực tiếp trên UI nếu mô hình AI thất bại.
- **Advanced Semantic Search:** Kết hợp cả Vector Search (ChromaDB) và Local Reranking (Cross-Encoder) - một kiến trúc RAG hiện đại giúp kết quả tìm kiếm chính xác hơn rất nhiều so với ElasticSearch thông thường.
- **Resilient AI Calling:** Cơ chế Retry khi gặp giới hạn Rate Limit của Google (lỗi 429), có Fallback về Regex / Rule-based nếu Gemini trả về sai định dạng JSON.
- **State Machine (FSM):** Quy trình xử lý văn bản được chia nhỏ thành các trạng thái minh bạch, chống crash toàn bộ hệ thống khi 1 thành phần AI (như YOLO hay Gemini) gặp lỗi.

---

## 13. UNFINISHED FEATURES & TECHNICAL DEBT

- **TODO / Chưa hoàn thiện:**
  - Tính năng "Xác thực hai yếu tố (2FA)" trong Hồ sơ cá nhân (Chỉ có UI Tag: "Sắp ra mắt").
  - Đăng nhập bằng Google/Apple trong trang Đăng nhập (Mocking UI với thông báo: "Tính năng đang được phát triển").
- **Mock Data / Hardcoded:**
  - Gợi ý chủ đề tìm kiếm trong trang Search (Mock tag tĩnh: "Nghỉ lễ 30/4", "Bổ nhiệm cán bộ"...).
  - Thuật toán ẩn danh khi chia sẻ Public (Lấy `parts[0] *** parts[-1]`) vẫn khá thủ công.

---

## 14. ROUTE MAPPING (FRONTEND)

- `/` -> `src/app/page.tsx` (Không gọi API trực tiếp)
- `/login` -> `src/app/login/page.tsx` (Gọi `POST /api/auth/login`)
- `/register` -> `src/app/register/page.tsx` (Gọi `POST /api/auth/register`)
- `/verify/[token]` -> `src/app/verify/[token]/page.tsx` (Gọi `GET /api/docs/verify/{token}`)
- `/(dashboard)/dashboard` -> `src/app/(dashboard)/dashboard/page.tsx` (Gọi `GET /api/docs`, `GET /api/docs/dashboard/stats`, `GET /api/docs/public`)
- `/(dashboard)/repository` -> `src/app/(dashboard)/repository/page.tsx` (Gọi `GET /api/docs`, `DELETE /api/docs/{id}`)
- `/(dashboard)/search` -> `src/app/(dashboard)/search/page.tsx` (Gọi `GET /api/docs/search`)
- `/(dashboard)/profile` -> `src/app/(dashboard)/profile/page.tsx` (Gọi `GET /api/users/me`, `PUT /api/users/{id}`)
- `/(dashboard)/users` -> `src/app/(dashboard)/users/page.tsx` (Gọi `GET /api/users/`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`)

---

## 15. REPORT GENERATION ASSETS

*Gợi ý chuẩn bị cho báo cáo PBL5:*

- **HIGH PRIORITY:**
  - Dựa vào mục 8 để vẽ **Entity-Relationship Diagram (ERD)**.
  - Dựa vào mục 11 để vẽ **Activity Diagram** (Quy trình Pipeline xử lý AI).
  - Chụp màn hình (Screenshots) của toàn bộ 9 giao diện ở mục 4 để đính kèm báo cáo.
- **MEDIUM PRIORITY:**
  - Dựa vào mục 6 để vẽ **Use Case Diagram**.
  - Dựa vào mục 2 để vẽ **Architecture Diagram** (Sơ đồ triển khai hệ thống).
- **LOW PRIORITY:**
  - Sequence Diagram cho quy trình Upload -> Verify -> Semantic Search.

---

## 16. PBL5 REPORT READINESS CHECK

**Trạng thái sẵn sàng:** DỰ ÁN ĐÃ SẴN SÀNG ĐỂ VIẾT BÁO CÁO KẾT QUẢ TRIỂN KHAI.

**Đã có (Rất đầy đủ):**
- ✅ Màn hình hoàn thiện (9 màn hình UI đẹp mắt, xử lý đầy đủ nghiệp vụ).
- ✅ Cấu trúc Database rõ ràng (Users, Documents).
- ✅ API hoàn thiện (Đủ REST chuẩn, Auth bảo mật JWT).
- ✅ Chức năng lõi (YOLOv8 bóc tách, Gemini tóm tắt, Semantic Search Reranking, SHA-256) đã tích hợp sâu vào mã nguồn.

**Còn thiếu (Hành động cần làm tiếp theo):**
- ❌ Vẽ sơ đồ Use Case, ERD, Activity bằng công cụ (draw.io, starUML).
- ❌ Chụp ảnh thực tế các luồng chạy Demo (Tải lên văn bản, kết quả crop của AI, màn hình Dashboard).
- ❌ Tổng hợp viết văn bản báo cáo theo khung nội dung trên tài liệu này.
