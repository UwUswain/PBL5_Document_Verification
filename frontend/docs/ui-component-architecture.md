# UI & COMPONENT ARCHITECTURE SPECIFICATION
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL SOURCE OF TRUTH
**Target Audience:** AI Agents & Senior Engineers

---

## 1. Core UI Philosophy
Kiến trúc giao diện người dùng (UI) được xây dựng dựa trên sự kỷ luật và tính nhất quán:
* **UI Consistency:** Mọi thành phần giao diện phải tuân thủ hệ thống thiết kế chung, đảm bảo người dùng có trải nghiệm đồng bộ trên toàn bộ dashboard.
* **Predictable Component Boundaries:** Ranh giới giữa các components phải rõ ràng, dễ dự đoán về mặt trách nhiệm (responsibility).
* **Separation of Presentation vs Logic:** Tách biệt hoàn toàn phần hiển thị (vẻ ngoài) và phần logic xử lý dữ liệu.
* **Reusable Primitives:** Ưu tiên xây dựng và sử dụng lại các thành phần cơ bản (atoms/molecules) thay vì code lại từ đầu.
* **Scalable Feature UI:** Giao diện tính năng được thiết kế để có thể mở rộng mà không làm ảnh hưởng đến các phần khác của hệ thống.

---

## 2. Official Component Hierarchy
Cấu trúc phân cấp component và hướng phụ thuộc (Dependency Direction):

```text
components/ui/      (Shared Primitives - Pure UI)
    ↓
features/*/components/ (Domain Components - Business Logic)
    ↓
features/*/pages/   (Feature Page Composition)
    ↓
app/ (routing)      (App Router Entry Points)
```

**Nguyên tắc phụ thuộc:**
* Component tầng trên được phép import component tầng dưới.
* **KHÔNG ĐƯỢC PHÉP** import ngược từ tầng dưới lên tầng trên (VD: `components/ui` không được import từ `features`).
* Hạn chế import chéo giữa các features (Cross-feature imports).

---

## 3. UI Component Rules (`components/ui/`)
Đây là thư viện các thành phần cơ bản của dự án.
* **Presentation-only:** Chỉ lo việc hiển thị, nhận dữ liệu qua `props`.
* **Reusable Primitives:** Có tính tái sử dụng cao trên toàn app.
* **Tuyệt đối KHÔNG:** Gọi API, chứa logic nghiệp vụ (business logic), check Auth, hoặc sử dụng React Query.

**Ví dụ:** `Button`, `StatusBadge`, `EmptyState`, `SkeletonTable`, `PageHeader`.

---

## 4. Feature Component Rules (`features/*/components/`)
Các component đặc thù của riêng một tính năng.
* **Feature-specific UI:** Chỉ phục vụ nghiệp vụ của tính năng đó.
* **Logic Integration:** Được phép sử dụng custom hooks, gọi React Query, và quản lý trạng thái cục bộ của feature.
* **Phối hợp:** Điều phối các UI primitives để tạo ra một khối chức năng hoàn chỉnh.

**Tuyệt đối KHÔNG:** Quản lý Auth state toàn cục hoặc khởi tạo các API clients riêng lẻ.

---

## 5. Smart vs Dumb Component Rules
Phân chia trách nhiệm để code dễ bảo trì và dễ test:

* **Smart (Container) Components:**
  * Chịu trách nhiệm fetch dữ liệu (`useQuery`).
  * Quản lý các action thay đổi dữ liệu (`useMutation`).
  * Truyền dữ liệu và callback xuống Dumb components.
  * *Ví dụ: DocumentTableContainer.tsx*
* **Dumb (Presentation) Components:**
  * Nhận dữ liệu và hàm xử lý qua `props`.
  * Không biết dữ liệu từ đâu đến.
  * Chỉ lo việc hiển thị và tương tác người dùng.
  * *Ví dụ: DocumentTable.tsx*

---

## 6. Modal & Drawer Architecture
Quản lý các thành phần nổi (overlays) để tránh hỗn loạn state:
* **Ownership:** Modal/Drawer nên nằm cùng thư mục với feature sử dụng nó.
* **State Management:** Trạng thái đóng/mở nên được quản lý bởi component cha hoặc thông qua URL params (nếu cần share link).
* **Async Handling:** Khi Modal chứa Form, logic mutation nên nằm ở tầng Smart Component bọc ngoài hoặc custom hook của feature.

**TUYỆT ĐỐI CẤM:** Gọi API trực tiếp bên trong một "Pure Modal UI" được thiết kế để dùng chung.

---

## 7. Table & Data Display Standards
Đối với Dashboard và các trang danh sách:
* **Pattern:** Sử dụng Ant Design Table kết hợp với cấu hình chuẩn của dự án.
* **Pagination:** Phân trang dựa trên URL hoặc Query State từ server (Server-side pagination).
* **States:** Luôn phải xử lý đủ 3 trạng thái: Loading (Skeleton), Empty (EmptyState), và Data (Table).
* **Logic:** Logic sắp xếp (sorting) và lọc (filtering) phải được đẩy về Server thông qua query params.

---

## 8. Form Architecture Rules
* **Ownership:** Form logic thuộc về Feature.
* **Validation:** Sử dụng thư viện validation (như Zod/Yup) hoặc Ant Design Rules đồng nhất.
* **Lifecycle:** Quản lý chặt chẽ các trạng thái: `isSubmitting`, `isDirty`, `isValid`.
* **TUYỆT ĐỐI CẤM:** Gọi API trực tiếp bên trong `onFinish` của form nằm ở tầng UI. Phải qua `useMutation` hook.

---

## 9. Loading, Empty & Error State Standards
* **Skeleton Usage:** Sử dụng Skeleton thay cho Spinner tròn cho các vùng nội dung lớn để tránh nhảy layout (layout shift).
* **Empty States:** Sử dụng component `EmptyState` thống nhất, có hình ảnh minh họa và nút Call-to-Action nếu cần.
* **Error Display:** Hiển thị lỗi thân thiện (Notification hoặc Alert), cung cấp nút "Thử lại" (Retry) cho các queries quan trọng.

---

## 10. Ant Design Governance
Quản lý việc sử dụng thư viện Ant Design:
* **Approved Patterns:** Chỉ sử dụng các components đã được dự án quy định.
* **Deprecated Props:** Tuyệt đối không dùng các props đã bị Ant Design đánh dấu lỗi thời (ví dụ: `dropdownClassName` thay bằng `popupClassName` trong các bản antd mới).
* **Style Chaos:** Hạn chế tối đa inline-style (`style={{...}}`). Ưu tiên sử dụng CSS Modules hoặc Tailwind classes.
* **Typography:** Tuân thủ hệ thống Font-size và Color-palette đã định nghĩa trong `ConfigProvider`.

---

## 11. Feature Page Composition Rules
Cách thức lắp ghép một trang:
1. `app/(dashboard)/documents/page.tsx` (Server/Client entry point).
2. Gọi `features/documents/pages/DocumentsPage.tsx`.
3. `DocumentsPage` phối hợp các Smart Components (`DocumentListContainer`, `DocumentStatsContainer`).
4. Các Containers sử dụng Dumb Components và UI Primitives.

---

## 12. AI-Agent UI Rules
AI Agent khi thao tác giao diện phải:
* **KHÔNG ĐƯỢC** tạo ra các "Mega-components" hàng nghìn dòng.
* **KHÔNG ĐƯỢC** nhân bản các UI primitives đã tồn tại (phải search trước).
* **KHÔNG ĐƯỢC** nhúng logic Auth hay API vào tầng UI dùng chung.
* **PHẢI** ưu tiên sử dụng lại `components/ui/` để giữ tính nhất quán.
* **PHẢI** đảm bảo tính responsive (hiển thị tốt trên Mobile/Desktop).

---

## 13. Component Verification Checklist
Sau mỗi lần refactor UI:
* [ ] Layout Dashboard không bị vỡ/lệch.
* [ ] Trạng thái Loading hiển thị đúng chỗ, không giật lag.
* [ ] Modals/Drawers đóng mở mượt mà, xóa sạch state sau khi đóng.
* [ ] Không có request API bị gọi thừa thãi khi re-render.
* [ ] UI đồng bộ về màu sắc và typography theo chuẩn Teal/Blue của dự án.

---

## 14. Future UI Scalability Guidelines
* **Theming:** Hỗ trợ đổi màu chủ đạo dễ dàng qua `ConfigProvider`.
* **Dark Mode:** Đảm bảo mọi custom component đều hỗ trợ variable colors cho dark/light.
* **Accessibility:** Tuân thủ các tiêu chuẩn ARIA cơ bản cho trình đọc màn hình.
* **Virtualization:** Sử dụng cho các danh sách tài liệu cực lớn để tối ưu hiệu năng.

---
**Tài liệu này là kim chỉ nam cho mọi hoạt động xây dựng giao diện. Sự tùy tiện trong UI sẽ dẫn đến sự sụp đổ của trải nghiệm người dùng.**
