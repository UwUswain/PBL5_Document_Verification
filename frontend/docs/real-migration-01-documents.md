# REAL MIGRATION #01 — DOCUMENTS FEATURE
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** FIRST GOVERNED FEATURE MIGRATION
**Focus:** Migrating Repository/Documents to Feature-based Architecture

---

## 1. Migration Mission
Cuộc di dời này không chỉ là về việc chuyển mã nguồn, mà là bài kiểm tra thực tế (Live Validation) cho toàn bộ hệ thống quản trị vừa thiết lập.
* **Mục tiêu tối thượng:** Chứng minh kiến trúc Feature-based có thể vận hành ổn định.
* **Ưu tiên:** Sự ổn định của Runtime (Runtime Stability) quan trọng hơn việc dọn dẹp code hoàn hảo.
* **Chiến thuật:** Trích xuất dần dần (Incremental Extraction), không viết lại (rewrite) diện rộng.

---

## 2. Current Feature Risk Assessment
Đánh giá thực trạng của tính năng Documents trước khi bắt đầu:
* **Overloaded `page.tsx`:** Tệp trang đang gánh vác quá nhiều trách nhiệm (Logic, State, UI).
* **Mixed State Ownership:** Trạng thái của Modal upload và Table danh sách đang bị trộn lẫn.
* **Inline Fetching:** Các hàm gọi API đang nằm trực tiếp trong component hoặc `useEffect`.
* **Duplicated Modal Logic:** Logic upload tài liệu có thể đang bị lặp lại ở nhiều nơi.
* **Query Duplication:** Nhiều nơi cùng gọi một endpoint mà không dùng chung cache hiệu quả.
* **UI Coupling:** Giao diện bảng danh sách đang bị dính chặt với logic xử lý dữ liệu của Dashboard.

---

## 3. Target Feature Structure
Mục tiêu cấu trúc sau khi kết thúc di dời:

```text
features/documents/
  ├── api/          # Nơi chứa documentsClient.ts
  ├── hooks/        # Nơi chứa useDocuments, useUploadDocument...
  ├── components/   # Nơi chứa DocumentTable, UploadModal...
  ├── types/        # Định nghĩa DocumentResponse, UploadDTO...
  ├── utils/        # Các helper format dành riêng cho Document
  └── pages/        # Composition component: DocumentsPage.tsx
```

---

## 4. Thin-Page Refactor Plan
Tệp `app/(dashboard)/repository/page.tsx` sẽ được rút gọn tối đa:
* **Sau Migration:** Chỉ làm nhiệm vụ import và render `<DocumentsPage />` từ `features/documents`.
* **CẤM:** Nắm giữ Business Logic, Queries, hoặc cây UI JSX khổng lồ.

---

## 5. API Extraction Plan
Trích xuất các hàm sau về `features/documents/api/documentsClient.ts`:
* `fetchDocuments` (Lấy danh sách)
* `uploadDocument` (Tải lên tài liệu)
* `deleteDocument` (Xóa tài liệu)
* `verifyDocument` (Xác thực tài liệu)

**Quy tắc:** Bắt buộc sử dụng `shared apiClient` từ `lib/`. Chuẩn hóa dữ liệu trả về và xử lý lỗi tập trung.

---

## 6. Query-Hook Extraction Plan
Xây dựng các custom hooks tại `features/documents/hooks/`:
* `useDocuments()`: Quản lý server state cho danh sách tài liệu.
* `useUploadDocument()`: Quản lý mutation tải lên.
* `useDeleteDocument()`: Quản lý mutation xóa.
* `useVerifyDocument()`: Quản lý mutation xác thực.

---

## 7. Component Decomposition Plan
Chia nhỏ file "khổng lồ" hiện tại thành các khối độc lập:
* `DocumentTable`: Chỉ lo việc hiển thị bảng.
* `DocumentFilters`: Bộ lọc tìm kiếm/trạng thái.
* `UploadDocumentModal`: Form tải lên tài liệu.
* `DocumentDetailDrawer`: Chi tiết tài liệu.
* `DocumentActionButtons`: Các nút thao tác.

---

## 8. Modal & Drawer Governance
* **Local Ownership:** Trạng thái đóng/mở Modal/Drawer phải thuộc về Feature hoặc Page của Feature.
* **Isolated Handling:** Logic xử lý sau khi Submit form trong Modal phải nằm gọn trong mutation hook của feature đó.
* **CẤM:** Sử dụng các biến Global State không kiểm soát để điều khiển Modal.

---

## 9. Query & Cache Governance
* **Centralized Keys:** Sử dụng `DOCUMENT_QUERY_KEYS` để quản lý cache.
* **Stable Invalidation:** Sau khi upload/xóa, phải invalidate chính xác key danh sách để UI tự động cập nhật.
* **Optimistic Update:** Cân nhắc áp dụng cho hành động Xóa để tăng cảm giác mượt mà.

---

## 10. Transitional Compatibility Strategy
Để tránh gãy hệ thống trong lúc đang làm:
* **Temporary Wrappers:** Có thể bọc component cũ bằng component mới để test dần.
* **Transitional Exports:** Export các hàm từ thư mục mới nhưng vẫn giữ lại các tham chiếu cũ ở file `services/api.ts` (nếu cần).
* **Mục tiêu:** Giảm thiểu "bán kính sát thương" (Blast radius) của việc migration.

---

## 11. AI-Agent Execution Constraints
**AI Agent PHẢI:**
* Di dời một cách tịnh tiến (Incrementally).
* Liên tục kiểm chứng Runtime sau mỗi bước nhỏ.
* Bảo toàn luồng Auth và Routing hiện tại.

**AI Agent KHÔNG ĐƯỢC:**
* Refactor các feature không liên quan.
* Tự ý thay đổi kiến trúc dùng chung.
* Dọn dẹp code quá "hung hãn" trong khi đang trích xuất logic.

---

## 12. Runtime Verification Checklist
Sau mỗi bước di dời, phải xác nhận:
* [ ] Trang Documents vẫn render bình thường.
* [ ] Auth vẫn hoạt động (không bị đá ra ngoài).
* [ ] Danh sách tài liệu hiện đầy đủ dữ liệu.
* [ ] Tính năng Upload hoạt động chính xác.
* [ ] Modals/Drawers đóng mở đúng logic.
* [ ] Phân trang (Pagination) không bị lỗi.
* [ ] Không phát sinh duplicate request trong Network tab.

---

## 13. Rollback Strategy
Nếu phát hiện hệ thống không ổn định sau khi di dời:
1.  Hoàn tác (Revert) các hooks vừa trích xuất.
2.  Khôi phục lại cấu trúc `page.tsx` ban đầu.
3.  Vô hiệu hóa các Compatibility Adapters một cách an toàn.
4.  **CẤM:** Để lại mã nguồn ở trạng thái "di dời dở dang" (partial broken migration) gây lỗi build.

---

## 14. Success Criteria
Cuộc di dời này thành công khi:
* ✅ Feature Documents hoàn toàn độc lập (Isolated).
* ✅ Tệp `page.tsx` trở nên cực kỳ mỏng.
* ✅ API và Hooks được quản lý tập trung trong feature.
* ✅ Toàn bộ components được bóc tách và dễ bảo trì.
* ✅ Ứng dụng chạy mượt mà, không có lỗi runtime.

---

## 15. Post-Migration Review
Sau khi hoàn thành, AI Agent phải đánh giá:
* Những gì đã hoạt động tốt?
* Những khó khăn/nút thắt cổ chai trong quá trình di dời?
* Có lỗ hổng nào trong bộ quản trị (Governance Gaps) cần bổ sung không?
* Những mẫu thiết kế nào có thể tái sử dụng cho các cuộc di dời sau?

---
**Bước đi thực tế đầu tiên là bước đi quan trọng nhất của toàn bộ chiến dịch.**
