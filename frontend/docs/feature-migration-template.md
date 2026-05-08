# FEATURE MIGRATION TEMPLATE
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** ACTIVE BLUEPRINT DOCUMENT
**Purpose:** Standard Feature Architecture & AI Refactor Blueprint

> **WARNING:** Đây là tài liệu Thiết kế Mẫu (Blueprint) chính thức. Mọi thao tác migrate tính năng (feature migration) phải tuân thủ nghiêm ngặt cấu trúc và triết lý được định nghĩa trong file này nhằm ngăn chặn rác kiến trúc (architecture drift).

---

## 1. Feature Architecture Philosophy
Mỗi tính năng trong hệ thống được coi là một phân hệ độc lập (Feature-Sliced Design).
* **Feature Isolation:** Tính năng nào quản lý state và UI của tính năng đó. Không "với tay" sang state của tính năng khác.
* **Self-contained Modules:** Một feature phải có thể tự sống sót nếu bị nhấc ra khỏi dự án (bao gồm đủ API, Hooks, Types, UI).
* **Separation of Concerns:** Component lo hiển thị (UI), Hook lo gọi dữ liệu (State/Data), API Client lo giao tiếp backend (Network).
* **Minimal Coupling:** Hạn chế tối đa việc hai feature import chéo nhau. Nếu cần chia sẻ, hãy đẩy logic đó xuống tầng `shared/` hoặc `lib/`.
* **Predictable Structure:** Mở bất kỳ folder feature nào ra cũng phải thấy một bộ khung giống hệt nhau.

---

## 2. Official Feature Folder Structure
Khi tạo mới hoặc migrate một feature, bắt buộc tạo cấu trúc sau:

```text
features/[feature-name]/
  ├── api/          # Lớp giao tiếp với backend (chứa *Client.ts)
  ├── hooks/        # Lớp quản lý server state (React Query) và local state
  ├── components/   # Smart Components và Presentational Components của riêng feature
  ├── types/        # Định nghĩa DTO, Request/Response interface
  ├── utils/        # (Optional) Các hàm format, helper dành riêng cho feature
  └── constants/    # (Optional) Các hằng số cục bộ, query keys...
```

---

## 3. API Layer Template
Tất cả các lệnh gọi API của feature phải nằm trong thư mục `api/`.

* **Quy tắc Naming:** Sử dụng hậu tố `*Client.ts` (Ví dụ: `documentsClient.ts`).
* **Không được phép:** Khởi tạo lại Axios instance. Gọi thẳng fetch trong Component.
* **Trách nhiệm:** Map DTO (Data Transfer Object), gọi `lib/apiClient.ts` và trả về Promise.

**Ví dụ `features/documents/api/documentsClient.ts`:**
```typescript
import { apiClient } from '@/lib/apiClient';
import type { DocumentResponse, UploadDocumentDTO } from '../types';

export const documentsClient = {
  getDocuments: (limit: number, offset: number) => {
    return apiClient.get<DocumentResponse[]>('/docs', { params: { limit, offset } });
  },
  uploadDocument: (data: UploadDocumentDTO) => {
    const formData = new FormData();
    formData.append('file', data.file);
    return apiClient.post<DocumentResponse>('/docs/upload', formData);
  }
};
```

---

## 4. Hooks Template
Tất cả React Query hooks phải được gói gọn trong thư mục `hooks/`.

* **Quy tắc Naming:** Sử dụng tiền tố `use*` (Ví dụ: `useDocuments.ts`, `useUploadDocument.ts`).
* **Trách nhiệm:** Trả về `data`, `isLoading`, `error`, và các hàm `mutate`. Ẩn đi sự phức tạp của React Query đối với UI Component.

**Ví dụ `features/documents/hooks/useDocuments.ts`:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { documentsClient } from '../api/documentsClient';
import { DOCUMENT_QUERY_KEYS } from '../constants';

export const useDocuments = (limit = 10, offset = 0) => {
  return useQuery({
    queryKey: DOCUMENT_QUERY_KEYS.list(limit, offset),
    queryFn: () => documentsClient.getDocuments(limit, offset),
  });
};
```

---

## 5. Components Template
Phân tách rõ ràng giữa Smart và Presentation components.

* **Smart Components:** Chứa logic nghiệp vụ, gọi Hooks (`useDocuments`), quản lý state cục bộ.
* **Presentation Components:** Chỉ nhận `props` và render UI, không tự fetch data.

**Ví dụ Naming:** `DocumentTable.tsx` (Presentation), `DocumentFilters.tsx` (Presentation), `DocumentListContainer.tsx` (Smart).
* **Không được phép:** Đặt component khổng lồ (Mega-components) nhồi nhét cả fetch API, xử lý Form và CSS chung 1 file. Không để Auth logic lọt vào UI component.

---

## 6. Query & Cache Template
Chuẩn hóa cách dùng React Query để tránh Stale Data:

* **Query Key Naming:** Luôn định nghĩa mảng hằng số trong `constants/queryKeys.ts`.
  ```typescript
  export const DOCUMENT_QUERY_KEYS = {
    all: ['documents'] as const,
    list: (limit: number, offset: number) => [...DOCUMENT_QUERY_KEYS.all, 'list', limit, offset] as const,
    detail: (id: string) => [...DOCUMENT_QUERY_KEYS.all, 'detail', id] as const,
  };
  ```
* **Invalidation Strategy:** Các mutations (Create, Update, Delete) bắt buộc phải gọi `queryClient.invalidateQueries({ queryKey: ... })` trong `onSuccess`.

---

## 7. Type Organization Template
Mọi Type/Interface liên quan đến Feature phải nằm ở `types/index.ts` hoặc tách nhỏ ra.

* **Naming Conventions Bắt Buộc:**
  * Thêm hậu tố `DTO` cho dữ liệu gửi lên API: `UploadDocumentDTO`.
  * Thêm hậu tố `Response` cho dữ liệu trả về: `DocumentResponse`, `PaginatedDocumentResponse`.
  * Thêm hậu tố `FormValues` cho React Hook Form: `DocumentFormValues`.

---

## 8. Route Composition Template
Thư mục `app/` của NextJS chỉ đóng vai trò "Nhà phân phối" (Router/Composer).

**Luồng chuẩn:**
`app/(dashboard)/documents/page.tsx` CHỈ render Component từ Feature:
```tsx
import { DocumentsPage } from '@/features/documents/components/DocumentsPage';

export default function Page() {
  return <DocumentsPage />;
}
```
**Toàn bộ Business Logic** phải nằm ở `features/documents/components/DocumentsPage.tsx`.

---

## 9. Migration Workflow Template
Khi bắt tay vào bóc tách một tính năng cũ, AI Agent phải đi theo 7 bước:

1. **Audit Current Implementation:** Đọc kỹ code ở `services/api.ts` và component cũ.
2. **Extract API Layer:** Copy endpoint sang `features/X/api/*Client.ts`.
3. **Extract Types:** Xây dựng Interface/DTO.
4. **Extract Hooks:** Bọc API Client bằng React Query hooks.
5. **Extract Components:** Dời file UI sang `features/X/components/`, refactor để sử dụng Hooks mới.
6. **Route Wiring:** Trỏ file `page.tsx` trong `app/` về Component mới.
7. **Verify Runtime & Cleanup:** Chạy test, xóa code rác trong hệ thống cũ.

---

## 10. AI-Agent Feature Rules
Luật kiểm soát hành vi đối với AI Agent trong quá trình Migrate Feature:

* **AI PHẢI:**
  * Bảo toàn (Preserve) 100% runtime behavior của tính năng.
  * Tái sử dụng (Reuse) UI primitives từ `components/ui/` thay vì tự code lại nút bấm/bảng biểu.
  * Ngăn chặn cross-feature coupling (Feature A không được gọi thẳng Hook của Feature B).
* **AI BỊ CẤM:**
  * Vô ý gom nhóm Global Logic vào trong một Feature (Ví dụ: dời Auth logic vào trong Feature Documents).
  * Viết duplicate API calls nếu endpoint đã được migrate sang Feature khác.
  * Tự vẽ ra một luồng Auth thay thế.

---

## 11. Feature Verification Checklist
Sau khi Migrate xong một Feature, AI phải xác nhận:

* [ ] Lệnh `npm run build` không văng lỗi.
* [ ] Queries hoạt động tốt (Data hiện lên UI, không lỗi Network).
* [ ] Mạch xác thực Auth (Token, 401 redirect) không bị đứt.
* [ ] Loading States (`isLoading`) hiển thị chính xác.
* [ ] Errors (`isError`) được xử lý và thông báo cho người dùng.
* [ ] React Query Devtools báo KHÔNG CÓ Duplicate Requests trùng lặp.

---

## 12. Example Feature Blueprint
Dưới đây là cây thư mục mẫu chuẩn mực cho một tính năng:

```text
features/documents/
  ├── api/
  │   └── documentsClient.ts       # Định nghĩa API calls (get, upload, delete)
  ├── hooks/
  │   ├── useDocuments.ts          # Query hook list
  │   ├── useDocumentDetail.ts     # Query hook detail
  │   └── useUploadDocument.ts     # Mutation hook upload
  ├── components/
  │   ├── DocumentsPage.tsx        # Smart component (Page entry point)
  │   ├── DocumentTable.tsx        # Presentation component hiển thị danh sách
  │   └── UploadDocumentModal.tsx  # Presentation component form upload
  ├── types/
  │   └── index.ts                 # Chứa DocumentResponse, UploadDocumentDTO...
  └── constants/
      └── queryKeys.ts             # Chứa DOCUMENT_QUERY_KEYS
```
