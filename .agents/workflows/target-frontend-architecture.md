# Target Frontend Architecture
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** Target Guidelines

---

## 1. Core Architecture Constraints
Dự án sử dụng kiến trúc **Hybrid Feature-Sliced Design (FSD)** dựa trên Next.js App Router.

**Cho phép:**
* NextJS App Router
* Route Groups
* Layout-based routing
* Client/Server component boundaries

**Tuyệt đối KHÔNG được:**
* Chuyển architecture sang SPA/Vite style
* Bỏ App Router
* Gom toàn bộ logic vào các file services global (God Object)
* Tạo giant shared business layer (một lớp nghiệp vụ khổng lồ dùng chung)

---

## 2. Directory Structure Blueprint
Hệ thống tuân thủ cấu trúc thư mục phân lớp rõ ràng:

```text
app/                    ← Chỉ dùng cho routing (App Router)
features/               ← Chứa business domains (Logic nghiệp vụ theo tính năng)
components/ui/          ← Pure reusable UI (Các component giao diện thuần túy)
lib/                    ← Infrastructure/Core (Cấu hình core, utils hạ tầng)
providers/              ← Global providers only (Chỉ chứa Context Providers cấp hệ thống)
hooks/                  ← Truly global hooks only (Chỉ các hooks dùng chung toàn app)
types/                  ← Shared types only (Chỉ các type/interface dùng chung)
```

---

## 3. Feature-Based Rules
Mỗi tính năng (Feature) phải mang tính self-contained (đóng gói và độc lập).

**Cấu trúc ví dụ:**
```text
features/
  ├── auth/
  │   ├── api/          # Lớp gọi API đặc thù của Auth
  │   ├── hooks/        # Hooks nghiệp vụ của Auth
  │   ├── components/   # UI components có gắn logic của Auth
  │   └── types/        # Domain types của Auth
  │
  └── documents/
      ├── api/
      ├── hooks/
      ├── components/
      └── types/
```

**Nguyên tắc:**
* Mỗi feature tự sở hữu: API logic, hooks, domain types, feature UI, business logic.
* **KHÔNG ĐƯỢC:**
  * Đặt business logic vào `components/ui` (shared components).
  * Gọi API trực tiếp trong file `page.tsx` của Next.js.
  * Tạo duplicated auth state rải rác ngoài feature `auth`.

---

## 4. API Layer Rules
Tầng giao tiếp dữ liệu phải có tính phân cấp (Hierarchy).

**Sơ đồ luồng dữ liệu:**
```text
lib/apiClient.ts
    ↓
features/*/api/*Client.ts
```

**Nhiệm vụ:**
* `lib/apiClient.ts` **chỉ xử lý**:
  * Cấu hình khởi tạo Axios instance.
  * Interceptors (Request/Response).
  * Token attachment (Đính kèm Access Token).
  * Base config (Base URL, Timeout...).
* `features/*/api/*Client.ts` **chỉ xử lý**:
  * Các domain endpoints (Ví dụ: `/auth/login`, `/users/me`).
  * DTO mapping (Data Transfer Object).
  * Các request đặc thù của feature.

**KHÔNG DÙNG:** `services/api.ts` chứa toàn bộ hệ thống (God Object hiện tại phải bị loại bỏ).

---

## 5. Next.js App Router Rules
Thư mục `app/` chỉ được dùng cho mục đích định tuyến và sắp xếp bố cục.

**Chỉ chứa:**
* Routing (định tuyến file-based)
* Layouts (bố cục giao diện)
* Route groups (phân nhóm route như `(dashboard)`)
* Page composition (tập hợp các component từ features thành một trang hoàn chỉnh)

**KHÔNG đặt:**
* Business logic lớn, phức tạp
* API logic
* Auth logic trực tiếp

*Toàn bộ Business logic phải được chuyển vào thư mục `features/`.*

---

## 6. Shared Component Rules
Thư mục `components/ui/` là thư mục chứa các component UI thuần túy.

**Chỉ chứa:**
* Reusable UI primitives (Button, Input, Modal, Table...)
* Presentation-only components (Chỉ nhận props và hiển thị, gọi callback khi có action)

**KHÔNG chứa:**
* API calls (Tuyệt đối không gọi dữ liệu)
* Auth logic (Không check quyền hạn trong này)
* Domain business logic
* Query logic (Không dùng React Query)

---

## 7. Global State Rules
Các nhà cung cấp trạng thái toàn cục (Global Providers) bị giới hạn nghiêm ngặt.

**Chỉ dùng Global Providers cho:**
1. Authentication (Auth)
2. Query Client (React Query)
3. Theme (Chế độ sáng/tối)
4. Language (Đa ngôn ngữ i18n)

*Feature state đặc thù (VD: trạng thái form đăng ký, bộ lọc tìm kiếm tài liệu) phải nằm cục bộ trong thư mục `features/` tương ứng.*
