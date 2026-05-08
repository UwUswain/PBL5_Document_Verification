# FEATURE MIGRATION PHASE
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** MAIN FRONTEND EXECUTION HANDBOOK
**Focus:** Large-Scale Feature Extraction & Business Domain Isolation

---

## 1. Core Feature-Migration Philosophy
* **Feature-First Architecture:** Mỗi tính năng lớn là một "vương quốc" độc lập với API, Logic và UI riêng.
* **Domain Isolation:** Cô lập các miền nghiệp vụ (Documents, Users, Auth) để giảm thiểu sự phụ thuộc chéo.
* **Thin Pages:** Các file `page.tsx` phải cực kỳ mỏng, chỉ đóng vai trò lắp ghép các thành phần của feature.
* **Local Ownership:** Mọi thứ thuộc về một tính năng phải nằm trong thư mục của tính năng đó.
* **Runtime-Safe Incremental Migration:** Di dời từng bước nhỏ, đảm bảo hệ thống luôn chạy được trong suốt quá trình chuyển đổi.

---

## 2. Official Feature Architecture
Cấu trúc chuẩn mực cho một thư mục trong `features/`:

```text
features/[feature-name]/
  ├── api/          # Các hàm gọi API (Client)
  ├── hooks/        # React Query hooks & logic nghiệp vụ
  ├── components/   # UI components của riêng feature
  ├── types/        # Interfaces & Types dành riêng cho feature
  ├── pages/        # Composition components (Trang hoàn chỉnh của feature)
  └── constants/    # Hằng số cục bộ (Query keys, route paths)
```

---

## 3. Migration Scope Rules
Để kiểm soát rủi ro, mỗi lượt di dời (Migration Session) phải tuân thủ:
* **Migrate ONE feature scope:** Không tham lam migrate nhiều tính năng cùng lúc.
* **Preserve runtime behavior:** Giữ nguyên cách thức hoạt động cũ, chỉ thay đổi cấu trúc mã nguồn.
* **Avoid cross-feature rewrites:** Không sửa logic của Feature B khi đang migrate Feature A.
* **Minimize blast radius:** Giới hạn phạm vi ảnh hưởng ở mức thấp nhất.

---

## 4. Thin-Page Governance
Chuẩn hóa các file trong thư mục `app/`:
* **Nhiệm vụ:** Chỉ đóng vai trò cấu hình Route, Layout và import Component từ Feature.
* **KHÔNG ĐƯỢC PHÉP:** Chứa logic nghiệp vụ phức tạp, chứa logic fetch dữ liệu khổng lồ, hoặc chứa cây UI (JSX) quá sâu.

---

## 5. Feature Ownership Rules
Một Feature phải hoàn toàn sở hữu và quản lý:
* Toàn bộ Components và UI đặc thù.
* Toàn bộ Hooks (Queries & Mutations) liên quan.
* Định nghĩa Types và Constants cục bộ.
* **Mục tiêu:** Xóa bỏ tình trạng logic bị rải rác hoặc ẩn giấu trong các file dùng chung.

---

## 6. Feature API Architecture
* **Chuẩn hóa:** Luôn đặt tại `features/*/api/*Client.ts`.
* **Sử dụng:** Bắt buộc sử dụng `shared apiClient` từ `lib/`.
* **CẤM:** Gọi `fetch` hoặc `axios` trực tiếp bên trong các UI components.

---

## 7. Feature Query Governance
* **Local Query Hooks:** Đóng gói logic React Query vào các hooks riêng (VD: `useDocuments`).
* **Centralized Query Keys:** Quản lý keys tập trung trong feature để dễ dàng invalidate.
* **Stable Invalidation:** Đảm bảo sau khi Mutation thành công, dữ liệu liên quan phải được làm mới ngay lập tức.

---

## 8. Component Decomposition Rules
Quy tắc chia nhỏ các file khổng lồ (>500 lines):
* Tách bảng danh sách (`Table`), bộ lọc (`Filters`), Modals, Drawers và chi tiết (`DetailView`) ra các file riêng.
* **CẤM:** Duy trì các file trang hàng nghìn dòng code nhồi nhét mọi thứ.
* **Modal Ownership:** Modal thuộc về feature nào thì phải nằm trong folder của feature đó.

---

## 9. UI Reuse Strategy
* **Shared UI (`components/ui/`):** Chỉ chứa các thành phần nguyên tử (Atoms) không mang logic nghiệp vụ.
* **Feature-specific UI:** Chứa các thành phần phức hợp (Molecules/Organisms) phục vụ riêng cho domain đó.
* **Quy tắc:** Không nhân bản các thành phần cơ bản. Đảm bảo trạng thái Loading/Empty đồng bộ toàn app.

---

## 10. Feature Migration Workflow
Trình tự 7 bước di dời một tính năng:
1.  **Audit feature:** Đọc hiểu code cũ và xác định dependency.
2.  **Extract API layer:** Di dời các hàm gọi backend.
3.  **Extract hooks:** Xây dựng các React Query hooks.
4.  **Extract components:** Chia nhỏ và di dời UI.
5.  **Thin page:** Cấu trúc lại file `page.tsx` trong `app/`.
6.  **Verify runtime:** Kiểm tra tính ổn định thực tế.
7.  **Cleanup legacy code:** Xóa bỏ code cũ và các tham chiếu thừa.

---

## 11. AI-Agent Feature Rules
**AI Agent PHẢI:**
* Giữ nguyên 100% logic chạy của tính năng.
* Bảo toàn các Route hiện có và ngữ nghĩa xác thực (Auth semantics).
* Thu hẹp phạm vi di dời ở mức tối đa.

**AI Agent KHÔNG ĐƯỢC:**
* Viết lại toàn bộ app trong một lần.
* Âm thầm thay đổi cấu trúc hạ tầng dùng chung.
* Di dời đồng thời nhiều tính năng có rủi ro cao.

---

## 12. Verification Checklist
Sau mỗi Feature Migration:
* [ ] Định tuyến (Routes) hoạt động ổn định.
* [ ] Luồng Auth và check quyền không bị đứt gãy.
* [ ] Dữ liệu hiển thị đúng, cache React Query hoạt động tốt.
* [ ] Các Modals/Drawers đóng mở và xử lý dữ liệu chính xác.
* [ ] Phân trang (Pagination) và các bộ lọc (Filters) chạy đúng.
* [ ] Không phát sinh request API trùng lặp.

---

## 13. Recommended Migration Order
Trình tự đề xuất (từ rủi ro thấp đến cao):
1.  **Documents / Repository:** Cốt lõi của app, cần migrate sớm để chuẩn hóa dữ liệu.
2.  **Dashboard:** Nơi tổng hợp thông tin, phụ thuộc vào nhiều nguồn.
3.  **Search:** Tính năng bổ trợ.
4.  **Profile:** Liên quan chặt chẽ đến Auth.
5.  **Users / Admin:** Hệ thống quản trị nội bộ.

---

## 14. Known Migration Risks
* **Hidden Dependencies:** Các thành phần phụ thuộc ngầm định không hiện ra khi audit sơ bộ.
* **Shared Modal State:** Trạng thái modal bị dùng chung giữa nhiều features.
* **Stale Queries:** Cache bị cũ do quên invalidate sau khi di dời.
* **Auth Coupling:** Logic feature bị dính quá chặt với `AuthProvider` cũ.

---

## 15. Exit Criteria
Phase di dời feature được coi là hoàn thành khi:
* ✅ Các miền nghiệp vụ (Features) được cô lập hoàn toàn.
* ✅ Các trang (`app/`) trở nên cực kỳ mỏng và dễ đọc.
* ✅ Quyền sở hữu (Ownership) về API, Hooks, UI được xác lập rõ ràng.
* ✅ Hệ thống vận hành ổn định và sẵn sàng cho việc mở rộng tính năng mới.

---
**Kiến trúc dựa trên Feature là nền tảng cho sự phát triển bền vững.**
