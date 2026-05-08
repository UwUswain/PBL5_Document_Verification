# DOCUMENTS FEATURE MIGRATION TASK SYSTEM
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL MICRO-MIGRATION EXECUTION SYSTEM
**Focus:** Granular & Safe Extraction of Documents Feature

---

## 1. Core Execution Philosophy
Chúng ta thực hiện di dời theo nguyên lý **"Vi di chuyển" (Micro-migration)**:
* **Small Migrations are Safer:** Chia nhỏ task để dễ kiểm soát rủi ro và dễ debug.
* **Incremental Extraction:** Trích xuất từng phần thay vì viết lại toàn bộ.
* **Runtime Verification:** Kiểm chứng thực tế sau MỖI task nhỏ.
* **Rollback-Ready:** Luôn có khả năng quay lại trạng thái ổn định ngay lập tức.
* **Constrained AI Execution:** Giới hạn AI làm đúng một việc tại một thời điểm.

---

## 2. Migration Task Breakdown Strategy
Mỗi Task trong hệ thống này phải đảm bảo:
* **Isolated Scope:** Phạm vi cô lập, không ảnh hưởng đến phần khác.
* **Minimal Files:** Chỉ tác động đến số lượng file ít nhất có thể.
* **Preserve Behavior:** Không thay đổi logic chạy của ứng dụng.
* **Independently Verifiable:** Có thể kiểm chứng độc lập.
* **Independently Revertable:** Có thể hoàn tác mà không kéo theo lỗi dây chuyền.

---

## 3. Official Task Execution Workflow
Quy trình thực thi bắt buộc cho mọi Task:

```text
Audit Task Scope (Đọc hiểu phạm vi)
    ↓
Implement Minimal Migration (Thực thi tối giản)
    ↓
Verify Runtime (Kiểm tra ứng dụng đang chạy)
    ↓
Verify Imports (Kiểm tra đường dẫn file)
    ↓
Verify Auth Stability (Kiểm tra luồng đăng nhập)
    ↓
Commit Checkpoint (Đánh dấu mốc hoàn thành)
```

---

## 4. Recommended Task Order
Trình tự thực thi 9 Task cho tính năng Documents:
1.  **TASK-01:** Extract Documents API Client.
2.  **TASK-02:** Extract Query Hooks.
3.  **TASK-03:** Extract Query Keys.
4.  **TASK-04:** Extract Document Table.
5.  **TASK-05:** Extract Filters.
6.  **TASK-06:** Extract Upload Modal.
7.  **TASK-07:** Extract Detail Drawer.
8.  **TASK-08:** Thin Repository Page.
9.  **TASK-09:** Legacy Cleanup.

---

## 5. TASK-01: Extract Documents API Client
* **Tạo:** `features/documents/api/documentsClient.ts`.
* **Di chuyển:** `fetchDocuments`, `uploadDocument`, `deleteDocument`, `verifyDocument`.
* **Quy tắc:** Sử dụng `shared apiClient`, không chứa logic UI, không chứa React hooks.
* **Kiểm chứng:** Trang repository vẫn load dữ liệu bình thường, upload vẫn chạy.
* **Rollback:** Khôi phục lại các hàm API inline tạm thời.

---

## 6. TASK-02: Extract Query Hooks
* **Tạo:** `useDocuments`, `useUploadDocument`, `useDeleteDocument`, `useVerifyDocument`.
* **Vị trí:** `features/documents/hooks/`.
* **Kiểm chứng:** Các queries và mutations hoạt động ổn định, cache được cập nhật đúng.
* **Quy tắc:** Không để logic fetch dữ liệu nằm trực tiếp trong UI components.

---

## 7. TASK-03: Extract Query Keys
* **Tạo:** `lib/queryKeys.ts` (hoặc tập trung vào feature keys).
* **Chuẩn hóa:** Phân cấp keys theo Entity (Documents).
* **Mục tiêu:** Đảm bảo việc Invalidate cache diễn ra chính xác và nhất quán.

---

## 8. TASK-04: Extract Document Table
* **Tách:** `DocumentTable.tsx` ra khỏi tệp trang chính.
* **Quy tắc:** Component này chỉ nhận dữ liệu qua props hoặc dùng hooks nội bộ của feature. Không nắm giữ API logic toàn cục.
* **Kiểm chứng:** Phân trang, sắp xếp và các nút hành động trên bảng vẫn chạy tốt.

---

## 9. TASK-05: Extract Filters
* **Tách:** `DocumentFilters.tsx`.
* **Quy tắc:** Sử dụng controlled props, cố gắng giữ component stateless (không state) nhất có thể.

---

## 10. TASK-06: Extract Upload Modal
* **Tách:** `UploadDocumentModal.tsx`.
* **Quy tắc:** Tự quản lý mutation upload và trạng thái hiển thị cục bộ. 
* **Kiểm chứng:** Luồng upload từ lúc mở modal đến khi hoàn thành và đóng modal phải trơn tru.

---

## 11. TASK-07: Extract Detail Drawer
* **Tách:** `DocumentDetailDrawer.tsx`.
* **Quy tắc:** Tách biệt việc hiển thị chi tiết tài liệu khỏi logic danh sách chính.

---

## 12. TASK-08: Thin Repository Page
* **Thực hiện:** Rút gọn `app/(dashboard)/repository/page.tsx`.
* **Nhiệm vụ:** Chỉ compose (lắp ghép) các components đã bóc tách.
* **CẤM:** Chứa các hàm business logic khổng lồ.

---

## 13. TASK-09: Legacy Cleanup
* **Thực hiện:** Dọn dẹp code "chết", các import thừa và các adapters tạm thời.
* **Quy tắc:** Chỉ xóa khi đã xác nhận 100% không còn dependency nào.

---

## 14. Runtime Verification Rules
Sau MỖI TASK, AI phải xác nhận:
* [ ] Build thành công.
* [ ] Auth vẫn ổn định.
* [ ] Routing không bị lỗi.
* [ ] Không có request API bị gọi thừa.
* [ ] Không có lỗi Hydration.

---

## 15. Rollback Governance
* Mỗi task phải có khả năng revert độc lập.
* Tránh để mã nguồn rơi vào trạng thái "dở dang" (partial unstable state).
* Giữ lại các compatibility layers tạm thời nếu cần thiết cho sự ổn định.

---

## 16. AI-Agent Execution Constraints
* **Chỉ làm MỘT task tại một thời điểm.**
* Giải thích rõ các file bị ảnh hưởng trước khi sửa.
* Kiểm tra kỹ lưỡng các đường dẫn import.
* **CẤM:** Tự ý dọn dẹp các phần không liên quan đến task hiện tại.

---

## 17. Success Criteria
Hệ thống di dời được coi là lành mạnh khi:
* ✅ Các task luôn giữ được quy mô nhỏ (Atomic).
* ✅ Ứng dụng luôn ở trạng thái chạy được (Always runnable).
* ✅ Việc Rollback diễn ra dễ dàng.
* ✅ Tiến độ di dời có thể đo lường rõ ràng.

---

## 18. Long-Term Reusability
Hệ thống Micro-migration này sẽ được tái sử dụng nguyên mẫu cho:
* Dashboard Migration.
* Users / Admin Migration.
* Search Migration.
* Profile Migration.

---
**Chia nhỏ để trị - Di dời an toàn - Kiến trúc vững bền.**
