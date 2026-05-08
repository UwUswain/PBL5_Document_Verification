# FOUNDATION MIGRATION PHASE
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** PHASE 1 EXECUTION HANDBOOK
**Focus:** Frontend Foundation Extraction & Infrastructure Stabilization

---

## 1. Phase Mission
Sứ mệnh của Phase này là xây dựng một lớp nền tảng (Foundation Layer) vững chắc và ổn định cho hệ thống Frontend. 
Chúng ta ưu tiên việc **chuẩn hóa hạ tầng (Infrastructure-first)** trước khi di dời các tính năng nghiệp vụ. Mục tiêu là giảm thiểu sự hỗn loạn (entropy), tạo ra các công cụ dùng chung an toàn và chuẩn bị sẵn sàng cho việc bóc tách các Feature ở các giai đoạn sau mà không làm ảnh hưởng đến tính ổn định của Auth hay Routing.

---

## 2. Primary Objectives
* **Centralized apiClient:** Thiết lập một bộ máy giao tiếp mạng duy nhất, tin cậy.
* **Query-Key Normalization:** Chuẩn hóa cách đặt tên và quản lý cache của React Query.
* **Shared Constants Extraction:** Đưa các hằng số nằm rải rác về một mối.
* **Shared Types Normalization:** Thống nhất ngôn ngữ TypeScript trên toàn hệ thống.
* **Utility Consolidation:** Hợp nhất các hàm helper, tránh lặp lại logic.
* **Service-Boundary Cleanup:** Làm sạch ranh giới giữa các dịch vụ dùng chung.

---

## 3. Official Scope
**PHẠM VI BAO GỒM:**
* Thư mục `src/lib/`: Nơi chứa core logic (Axios, Utils).
* Hệ thống Query Keys dùng chung.
* Các hằng số (Constants) toàn cục (Routes, Status, Config).
* Các kiểu dữ liệu (Types) dùng chung và Domain Entities.
* Các API Adapters tạm thời để hỗ trợ migration.

**PHẠM VI KHÔNG BAO GỒM:**
* Viết lại hệ thống Auth (Auth rewrites).
* Viết lại các trang (Page rewrites).
* Thay đổi cấu trúc App Router hay Layouts.
* Refactor giao diện UI quy mô lớn.
* Thay đổi các Providers lõi.

---

## 4. Target Foundation Structure
Mục tiêu cấu trúc thư mục sau khi kết thúc Phase 1:

```text
src/
  ├── lib/            # Hạ tầng lõi
  │   ├── apiClient.ts  # Instance Axios & Interceptors
  │   ├── queryKeys.ts  # Nhà máy quản lý Query Keys
  │   └── utils.ts      # Các hàm helper dùng chung (clsx, format...)
  ├── constants/      # Hằng số toàn cục
  ├── types/          # Kiểu dữ liệu dùng chung & Domain Types
  └── features/       # (Sẵn sàng để nhận Feature logic ở Phase sau)
```

---

## 5. apiClient Standardization
Thiết lập `lib/apiClient.ts` là nguồn sự thật duy nhất cho giao tiếp API.
* **Trách nhiệm:** Quản lý Axios instance, tự động đính kèm token, xử lý lỗi 401/500 toàn cục, chuẩn hóa dữ liệu trả về.
* **Quy tắc:** Tất cả các API clients sau này (`features/*/api/*Client.ts`) **BẮT BUỘC** phải sử dụng instance này thay vì tạo mới hoặc gọi `axios` trực tiếp.

---

## 6. Query-Key Governance
Xây dựng `lib/queryKeys.ts` để quản lý cache tập trung.
* **Chuẩn hóa:** Sử dụng mảng (Arrays) thay vì chuỗi đơn lẻ.
* **Cấp bậc:** Phân cấp rõ ràng theo Feature và Entity để dễ dàng Invalidate cache.
* **Quy tắc:** Không được sử dụng "Magic Strings" làm query key trong các hooks.

---

## 7. Shared Types Normalization
Thống nhất các thư mục `types/` để định nghĩa:
* **Domain Types:** Các thực thể nghiệp vụ (User, Document).
* **API Types:** Cấu trúc Response và DTO gửi lên server.
* **Shared Enums:** Các bộ hằng số định danh dùng chung cho cả UI và Logic.

---

## 8. Shared Constants Extraction
Bóc tách các hằng số đang bị nhúng trực tiếp (inline) trong Component hoặc Pages:
* **Routes:** Danh sách các đường dẫn (URL) của ứng dụng.
* **API Endpoints:** Danh sách các đầu mút của backend.
* **UI Constants:** Các giá trị cố định về giao diện (Teal colors, Spacing, Breakpoints).

---

## 9. Utility Consolidation
Hợp nhất các hàm helper vào `lib/utils.ts`:
* Loại bỏ các logic lặp lại (VD: có 3 hàm khác nhau cùng định dạng ngày tháng).
* Đảm bảo tính nhất quán về kết quả đầu ra của các tiện ích dùng chung.
* Sử dụng các thư viện chuẩn (như `clsx`, `tailwind-merge`) để xử lý logic UI.

---

## 10. Compatibility Layer Strategy
Để đảm bảo ứng dụng không bị "gãy" trong quá trình di dời:
* **Temporary Adapters:** Cho phép xuất (export) các hàm cũ từ file mới để không phải đổi hàng loạt import cùng lúc.
* **Transitional Exports:** Giữ lại các tham chiếu cũ trong một thời gian ngắn.
* **Rollback Value:** Giúp việc quay trở lại trạng thái cũ diễn ra nhanh chóng nếu có sự cố build.

---

## 11. AI-Agent Execution Rules
**AI Agent PHẢI:**
* Bảo toàn 100% hành vi runtime của ứng dụng.
* Thực hiện thay đổi trên phạm vi tối giản nhất (Minimize scope).
* Kiểm tra kỹ lưỡng các đường dẫn import sau khi di chuyển file.
* Giữ nguyên vòng đời xác thực (Auth lifecycle).

**AI Agent KHÔNG ĐƯỢC:**
* Đụng vào luồng Protected Route.
* Viết lại các Providers một cách hung hãn.
* Tự ý thay đổi cấu trúc Routing của Next.js.

---

## 12. Verification Checklist
Sau mỗi bước nhỏ trong Phase 1, phải xác nhận:
* [ ] Lệnh `npm run build` thành công.
* [ ] Không có lỗi import (Import stable).
* [ ] Chức năng Login/Logout vẫn hoạt động.
* [ ] Navigation giữa các trang dashboard không bị lỗi.
* [ ] Dữ liệu trên bảng/UI vẫn hiện đầy đủ.
* [ ] Không phát sinh request API trùng lặp.

---

## 13. Recommended Execution Order
Trình tự thực thi an toàn nhất:
1.  **apiClient:** Xây dựng instance Axios chuẩn.
2.  **queryKeys:** Thiết lập nhà máy sản xuất keys.
3.  **constants:** Trích xuất các hằng số ra khỏi component.
4.  **shared types:** Thống nhất các interfaces cơ bản.
5.  **utilities:** Hợp nhất các hàm helper.
6.  **API adapters:** Kết nối hệ thống cũ vào hạ tầng mới.

---

## 14. Known Risks
* **Auth Coupling:** Một số dịch vụ hạ tầng đang bị dính chặt với logic Auth.
* **Hidden Imports:** Các file cũ import lẫn lộn gây khó khăn khi di chuyển.
* **Stale Services:** Các đoạn code cũ không còn dùng nhưng vẫn gây lỗi build khi chạm vào.

---

## 15. Exit Criteria
Phase 1 được coi là hoàn thành khi:
* ✅ Một `apiClient` ổn định đang phục vụ toàn bộ các request mới.
* ✅ Hệ thống Query Keys đã được tập trung hóa.
* ✅ Các Types và Constants dùng chung đã được chuẩn hóa.
* ✅ Toàn bộ "nền móng" đã sẵn sàng để bóc tách các Feature (Phase 2).

---
**Nền móng vững chắc là cam kết cho sự ổn định lâu dài.**
