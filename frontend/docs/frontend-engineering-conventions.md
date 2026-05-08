# FRONTEND ENGINEERING CONVENTIONS
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL CODING STANDARD
**Target Audience:** AI Agents & Senior Engineers

---

## 1. Core Engineering Philosophy
Mọi mã nguồn trong dự án này phải tuân thủ các nguyên lý kỹ thuật cốt lõi:
* **Consistency Over Creativity:** Sự nhất quán quan trọng hơn sự sáng tạo cá nhân. Một cách làm duy nhất tốt hơn nhiều cách làm tương đương.
* **Predictable Naming:** Tên gọi phải phản ánh đúng bản chất và vị trí của đối tượng, giúp người khác (và AI) dễ dàng dự đoán.
* **Scalable Organization:** Cấu trúc mã nguồn phải hỗ trợ việc mở rộng quy mô mà không làm rối loạn hệ thống hiện có.
* **Architecture Readability:** Nhìn vào tên file và folder phải hiểu ngay được vai trò kiến trúc của nó.
* **AI-assisted Maintainability:** Code được viết theo quy chuẩn để AI có thể hiểu, refactor và bảo trì một cách hiệu quả nhất.

---

## 2. Folder Naming Rules
* **Quy tắc:** Sử dụng `kebab-case` và số nhiều (plural) cho các thư mục chức năng.
* **Ví dụ:**
  * `features/`
  * `components/`
  * `hooks/`
  * `layouts/`
  * `providers/`
  * `lib/`
  * `types/`
  * `constants/`

---

## 3. File Naming Conventions
* **Components:** Sử dụng `PascalCase`. (Ví dụ: `DocumentsTable.tsx`)
* **Hooks/Utilities:** Sử dụng `camelCase`. (Ví dụ: `useDocuments.ts`, `authHelper.ts`)
* **API Clients:** Sử dụng hậu tố `Client.ts`. (Ví dụ: `documentsClient.ts`)
* **Types:** Sử dụng `*.types.ts` hoặc `types.ts` trong folder feature.
* **Constants:** Sử dụng `*.constants.ts` hoặc `constants.ts`.

---

## 4. Component Naming Rules
Tên component phải mang tính mô tả và phản ánh vị trí/vai trò:
* **Feature Components:** `[FeatureName][ComponentName]` (Ví dụ: `DocumentTable`, `UserList`).
* **Layout Components:** `[LayoutName]Layout` (Ví dụ: `AppLayout`, `DashboardLayout`).
* **Modals/Drawers:** Hậu tố `Modal` hoặc `Drawer` (Ví dụ: `UploadDocumentModal`, `DocumentDetailDrawer`).
* **Containers:** Hậu tố `Container` cho các Smart Components (Ví dụ: `DocumentTableContainer`).

---

## 5. Hook Naming Rules
* **Tiền tố:** Luôn bắt đầu bằng `use`.
* **Query Hooks:** `use[EntityName]` (Ví dụ: `useDocuments`, `useProfile`).
* **Mutation Hooks:** `use[Action][EntityName]` (Ví dụ: `useUploadDocument`, `useDeleteUser`).
* **Cấm:** Đặt tên mơ hồ như `useData`, `useStuff`. Tuyệt đối không dùng tiền tố `use` cho các hàm không phải là React Hook.

---

## 6. API & Query Naming Rules
* **API Client Object:** `[entity]Client` (Ví dụ: `documentsClient`).
* **Query Keys:** Sử dụng mảng hằng số (hierarchical).
  * Gốc: `['documents']`
  * Chi tiết: `['documents', id]`
  * Lọc: `['documents', filters]`
* **Mutation Names:** Phải mô tả hành động động từ (Ví dụ: `uploadDocument`, `verifyStamp`).

---

## 7. Type Naming Rules
* **DTO (Data Transfer Object - Gửi lên):** Hậu tố `DTO`. (Ví dụ: `DocumentUploadDTO`).
* **Response (Nhận về):** Hậu tố `Response`. (Ví dụ: `DocumentResponse`, `PaginatedUserResponse`).
* **Form Values:** Hậu tố `FormValues`. (Ví dụ: `LoginFormValues`).
* **Domain Entity:** Tên thực thể trực tiếp. (Ví dụ: `Document`, `User`).

---

## 8. Boolean & State Naming Rules
Tên biến Boolean phải mang tính khẳng định hoặc nghi vấn:
* **Nên dùng:** `isLoading`, `isAuthenticated`, `hasError`, `canUpload`, `shouldRedirect`, `isEditMode`.
* **Cấm dùng:** `loading`, `flag`, `ok`, `status2`, `temp`.

---

## 9. Async Function Naming Rules
Tên hàm bất đồng bộ phải bắt đầu bằng động từ mạnh:
* **Nên dùng:** `fetchDocuments`, `createDocument`, `deleteDocument`, `updateProfile`, `verifyAccount`.
* **Cấm dùng:** `handleStuff`, `processData`, `doThing`, `goGetIt`.

---

## 10. Event Handler Naming Rules
* **Quy tắc:** Bắt đầu bằng tiền tố `handle`.
* **Ví dụ:** `handleSubmit`, `handleUpload`, `handleDelete`, `handleCloseModal`, `handlePageChange`.

---

## 11. Route & Page Naming Rules
* **App Layer:** `page.tsx` phải cực kỳ tối giản (minimal), chỉ làm nhiệm vụ compose các Feature Pages.
* **Feature Pages:** Đặt trong `features/[feature]/pages/` với hậu tố `Page`.
* **Ví dụ:** `features/documents/pages/DocumentsPage.tsx`.

---

## 12. Constant & Enum Naming Rules
* **Quy tắc:** Sử dụng `UPPER_SNAKE_CASE`.
* **Ví dụ:**
  * `DOCUMENT_STATUS`
  * `QUERY_KEYS`
  * `AUTH_STATES`
  * `MAX_FILE_SIZE`

---

## 13. Import Organization Rules
Sắp xếp import theo thứ tự ưu tiên giảm dần:
1. React & External Libraries (npm packages).
2. Internal Infrastructure (`@/lib`, `@/providers`, `@/hooks`).
3. Feature Modules (API, Hooks, Components, Types).
4. Relative Imports (trong cùng thư mục).

*Hạn chế tối đa relative imports sâu (../../../). Sử dụng alias `@/` đã cấu hình.*

---

## 14. AI-Agent Convention Rules
AI Agent khi làm việc trên project này **BẮT BUỘC** phải:
* **Follow Naming Consistency:** Luôn đối chiếu tên biến/file mới với các mẫu đã có trong codebase.
* **Reuse Naming Patterns:** Không được tự ý đổi phong cách đặt tên (VD: đang dùng PascalCase không được chuyển sang camelCase cho component).
* **Preserve Vocabulary:** Sử dụng đúng bộ từ vựng kỹ thuật của dự án (VD: dùng `verification` thay vì `checking`).
* **KHÔNG ĐƯỢC** tạo ra các ngữ nghĩa trùng lặp (Duplicate semantics).

---

## 15. Convention Verification Checklist
Sau mỗi lần refactor hoặc thêm code mới:
* [ ] Tên file và folder đã tuân thủ kebab-case/PascalCase chưa?
* [ ] Các Boolean đã có tiền tố `is/has/can` chưa?
* [ ] API Client và Hooks đã có hậu tố/tiền tố chuẩn chưa?
* [ ] Các Type đã có hậu tố `DTO/Response/FormValues` chưa?
* [ ] Import đã được sắp xếp gọn gàng chưa?

---
**Sự thống nhất về ngôn ngữ lập trình là nền tảng của một hệ thống có khả năng bảo trì lâu dài.**
