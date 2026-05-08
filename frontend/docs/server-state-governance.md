# SERVER STATE GOVERNANCE
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL SOURCE OF TRUTH
**Target Audience:** AI Agents & Senior Engineers

---

## 1. Core Server-State Philosophy
Kiến trúc quản lý trạng thái từ server (Server State) phải tuân thủ các nguyên tắc cốt lõi:
* **Server State ≠ UI State:** Dữ liệu từ server là bản snapshot không đồng bộ, không phải trạng thái UI cục bộ.
* **React Query Owns Server State:** Toàn bộ vòng đời của dữ liệu server (fetching, caching, syncing, updating) do React Query quản lý.
* **Deterministic Cache Lifecycle:** Cache phải có vòng đời rõ ràng, có thể dự đoán được thông qua `staleTime` và `gcTime`.
* **Centralized Transport Layer:** Mọi giao tiếp mạng phải đi qua một lớp vận chuyển (transport layer) duy nhất.
* **Predictable Invalidation:** Việc làm mới dữ liệu (invalidation) phải xảy ra theo các quy tắc nghiệp vụ rõ ràng, không được trigger ngẫu nhiên.

---

## 2. Official API Architecture
Hệ thống phân tầng API được quy định như sau:

```text
lib/apiClient.ts         (Core Transport - Axios Instance)
    ↓
features/*/api/*Client.ts (Domain Endpoints - Feature Logic)
    ↓
features/*/hooks/use*.ts  (React Query Hooks - Server State)
    ↓
Feature Components        (UI Composition)
```

**Ownership Boundaries:**
* **Transport:** `lib/apiClient.ts` chịu trách nhiệm về kết nối, auth headers, và interceptors.
* **Endpoint Logic:** `*Client.ts` định nghĩa URL, DTO mapping và request params.
* **Queries/Mutations:** `hooks/` đóng gói logic React Query (query keys, options).
* **Cache:** React Query Global Store sở hữu dữ liệu đã fetch.

---

## 3. API Client Rules
* **Single Transport Layer:** Chỉ sử dụng duy nhất instance từ `lib/apiClient.ts`.
* **Centralized Interceptors:** Xử lý lỗi toàn cục (401, 500) và đính kèm token tại một nơi duy nhất.
* **Auth Attachment Ownership:** `apiClient` chịu trách nhiệm tự động đính kèm JWT từ storage.
* **Request/Response Normalization:** Dữ liệu trả về phải được chuẩn hóa (DTO) trước khi vào Query Cache.

**TUYỆT ĐỐI CẤM:**
* Tạo nhiều axios instances khác nhau.
* Sử dụng `fetch` hoặc `axios` trực tiếp bên trong UI components.
* Xử lý logic token (đọc/ghi localStorage) bên ngoài `apiClient` hoặc `auth feature`.

---

## 4. React Query Governance
* **Query Ownership:** Một query chỉ nên được định nghĩa một lần duy nhất dưới dạng custom hook.
* **Mutation Ownership:** Mọi hành động thay đổi dữ liệu phải qua `useMutation`.
* **Loading/Error Ownership:** Sử dụng trạng thái `isLoading`, `isError` từ React Query.
* **Stale Handling:** Cấu hình `staleTime` phù hợp để giảm tải server (mặc định 60s cho các dữ liệu ít biến động).
* **Retry Handling:** Chỉ retry các idempotent requests (GET). Không retry các mutations thất bại do lỗi 4xx.

---

## 5. Query Key Specification
Query keys phải được tổ chức theo cấp bậc (hierarchical) để dễ dàng invalidation:

**Cấu trúc chuẩn:**
* Danh sách: `[feature, 'list', filters]`
* Chi tiết: `[feature, 'detail', id]`
* Quan hệ: `[feature, 'detail', id, 'sub-resource']`

**Quy định:**
* Phải sử dụng `const` object hoặc function factory để quản lý keys (không dùng inline strings).
* Key phải chứa đủ các biến số ảnh hưởng đến kết quả request (pagination, search query).

---

## 6. Mutation & Invalidation Rules
Việc thay đổi dữ liệu phải kéo theo việc cập nhật cache:

* **Invalidation Ownership:** Mutation hook chịu trách nhiệm quyết định query nào cần invalidate sau khi thành công.
* **Optimistic Updates:** Áp dụng cho các tính năng yêu cầu tốc độ phản hồi cao (VD: like, toggle status).
* **Rollback Handling:** Phải có cơ chế khôi phục cache nếu optimistic update thất bại.
* **Mutation Sequencing:** Đảm bảo thứ tự các mutations không gây race condition.

**Ví dụ:**
```text
uploadDocument.onSuccess() 
    ↓
invalidate ['documents', 'list']
    ↓
(Tùy chọn) prefetch ['documents', 'detail', newId]
```

---

## 7. Loading & Error Ownership
* **React Query owns async state:** Không tạo thêm `const [loading, setLoading] = useState(false)` thủ công cho các tác vụ đã có React Query.
* **Avoid Duplicated State:** Tuyệt đối không copy dữ liệu từ query vào local state trừ khi cần chỉnh sửa nháp (drafting).

**TUYỆT ĐỐI CẤM:**
* Sử dụng `useEffect` để đồng bộ dữ liệu từ query vào state cục bộ.
* Theo dõi trạng thái loading bằng biến global/context tự chế.

---

## 8. Pagination & Infinite Query Rules
* **Pagination Ownership:** Logic phân trang (page, pageSize) nên nằm trong query key.
* **Cache Strategy:** Sử dụng `keepPreviousData: true` (hoặc `placeholderData` trong v5) để tránh giật lag khi đổi trang.
* **Infinite Scrolling:** Sử dụng `useInfiniteQuery` chuẩn của React Query, không tự tính toán scroll offsets thủ công.

---

## 9. Feature API Template
Mẫu cấu trúc chuẩn cho một feature:

```typescript
// features/documents/api/documentsClient.ts
export const documentsClient = {
  getDetail: (id: string) => apiClient.get(`/docs/${id}`),
};

// features/documents/hooks/useDocumentDetail.ts
export const useDocumentDetail = (id: string) => {
  return useQuery({
    queryKey: ['documents', 'detail', id],
    queryFn: () => documentsClient.getDetail(id),
  });
};
```

---

## 10. Auth + Query Integration
* **Auth Query Synchronization:** Khi `user` state trong AuthProvider thay đổi, các queries phụ thuộc phải được refetch hoặc invalidate.
* **Logout Cleanup:** Khi logout, bắt buộc gọi `queryClient.clear()` để xóa toàn bộ dữ liệu nhạy cảm khỏi bộ nhớ.
* **Unauthorized Invalidation:** Khi gặp lỗi 401, toàn bộ queries phải ngừng fetch và chuyển hướng login.

---

## 11. AI-Agent API Rules
AI Agent khi thực hiện refactor tầng API phải tuân thủ:
* **KHÔNG ĐƯỢC** lách qua React Query để gọi API trực tiếp.
* **KHÔNG ĐƯỢC** viết logic fetch bên trong UI components.
* **KHÔNG ĐƯỢC** tạo query keys trùng lặp hoặc không theo chuẩn hierarchical.
* **PHẢI** kiểm tra xem endpoint đã tồn tại trong `features/*/api` chưa trước khi tạo mới.
* **PHẢI** ưu tiên sử dụng lại các custom hooks đã có.

---

## 12. Verification Checklist
Sau khi refactor hoặc thêm API mới:
* [ ] Kiểm tra Network tab: Không có request bị lặp lại (duplicate).
* [ ] Kiểm tra Invalidation: Sau khi POST/PUT, danh sách dữ liệu phải tự động cập nhật.
* [ ] Kiểm tra Error State: Khi API lỗi, UI phải hiển thị đúng Error Component/Message.
* [ ] Kiểm tra Auth: Token được đính kèm đúng và 401 được xử lý global.
* [ ] Kiểm tra Caching: Chuyển trang qua lại không thấy loading spinner nếu dữ liệu còn trong `staleTime`.

---

## 13. Future Scalability Guidelines
* **Websocket:** Tích hợp `queryClient.setQueryData` để cập nhật realtime từ socket.
* **Polling:** Sử dụng `refetchInterval` cho các dashboard cần dữ liệu tươi.
* **Optimistic UI:** Triển khai cho các tác vụ CRUD đơn giản để tăng cảm giác "premium".
* **Streaming:** Tận dụng React Suspense và Next.js Streaming khi migrate lên các server components phức tạp hơn.

---
**Tài liệu này là quy chuẩn cao nhất cho việc quản lý Server State. Mọi hành vi vi phạm sẽ bị coi là gây nợ kỹ thuật (Technical Debt).**
