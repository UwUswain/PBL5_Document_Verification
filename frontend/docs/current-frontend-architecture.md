# Frontend Architecture Audit Report
**Project:** PBL5 Document Verification (NextJS App Router)
**Date:** 2026-05-08

---

## 1. Framework & Core Stack

Hệ thống frontend hiện tại được xây dựng trên một stack hiện đại và phổ biến, tập trung vào React và hệ sinh thái Next.js:

* **Core Framework:** Next.js `14.2.5` (sử dụng hoàn toàn mô hình App Router).
* **Language:** TypeScript (`^5`).
* **UI Library & Styling:** 
  * Ant Design (`antd ^6.3.6`) tích hợp với `@ant-design/nextjs-registry` để hỗ trợ Server-Side Rendering (SSR).
  * Tailwind CSS (`^3.4.1`) cho utility-first styling.
  * Ant Design Icons (`@ant-design/icons`).
* **State Management & Data Fetching:** 
  * React Query / TanStack Query (`^5.99.2`) để quản lý server state và caching.
  * React Context API cho global client state (Auth, Language).
  * Axios (`^1.15.1`) cho HTTP Client Layer.
* **Các thư viện bổ trợ:** `react-image-crop` (xử lý ảnh thủ công), `recharts` (vẽ biểu đồ dashboard), `moment` (xử lý thời gian).

---

## 2. Current Folder Structure

Dự án tuân theo cấu trúc chuẩn của Next.js kết hợp mô hình phân chia theo domain:

```text
src/
├── app/          # Chứa toàn bộ logic routing (App Router) và pages
├── components/   # Chứa các React components (UI và Business logic)
│   ├── dashboard/   # Components đặc thù cho tính năng dashboard
│   ├── layout/      # Components dựng khung ứng dụng (AppLayout)
│   ├── shared/      # Components dùng chung giữa nhiều module
│   └── ui/          # Dumb components (chỉ presentational)
├── lib/          # Các utility functions và localized services (VD: user.service.ts)
├── providers/    # Chứa toàn bộ global Context Providers (Auth, Query, Lang)
└── services/     # Chứa API layer (Axios instance, interceptors, API definition)
```

**Dependency & Responsibility:**
* `app/` phụ thuộc trực tiếp vào `components/` và `providers/`.
* `components/` phụ thuộc vào `services/` để gọi API trực tiếp, hoặc qua React Query hooks.
* `providers/` (như AuthProvider) phụ thuộc trực tiếp vào `services/api.ts` để thao tác xác thực.
* `services/` độc lập với giao diện, nhưng có sự gắn kết mạnh với `localStorage` trên môi trường browser.

---

## 3. Routing Architecture

Hệ thống sử dụng App Router với việc phân chia Public và Protected routes qua cấu trúc thư mục:

* **Public Routes:**
  * `app/page.tsx`: Landing page (marketing page).
  * `app/login/page.tsx`: Trang đăng nhập.
  * `app/verify/`: Các route liên quan đến xác minh tài liệu công khai (public verify).
* **Protected Routes (Route Groups):**
  * `app/(dashboard)/`: Nhóm route yêu cầu xác thực.
  * Bao gồm các route con: `dashboard`, `profile`, `repository`, `search`, `users`.
* **Nested Layouts:**
  * `app/layout.tsx`: Root layout, chứa thẻ `<html>`, `<body>` và bọc ứng dụng bởi các tầng Providers.
  * `app/(dashboard)/layout.tsx`: Layout bảo vệ cho nhóm dashboard, inject component `AppLayout` (chứa Sidebar, Header).

---

## 4. Providers Architecture

Providers được quản lý tập trung và inject tại `app/layout.tsx` theo thứ tự từ ngoài vào trong:
`AntdRegistry -> ConfigProvider -> AntdApp -> QueryProvider -> LanguageProvider -> AuthProvider`

* **`AuthProvider` (Global, Critical):** Quản lý trạng thái người dùng hiện tại, tự động kiểm tra token từ `localStorage`, fetch profile user và thực thi logic điều hướng (redirect) để bảo vệ route.
* **`QueryProvider` (Global):** Khởi tạo `QueryClient` cho TanStack Query với cấu hình mặc định `staleTime: 60s` và `retry: 1`. Quản lý caching state cho mọi API call trên UI.
* **`LanguageProvider` (Global):** Quản lý ngôn ngữ hiển thị (i18n) với các hàm chuyển đổi `vi/en` và tệp dịch cục bộ đơn giản.

---

## 5. API Layer

Kiến trúc tầng mạng được tập trung mạnh vào file `src/services/api.ts`:

* **Axios Instance:** Được tạo sẵn với `baseURL` từ biến môi trường.
* **Request Interceptor:** Trích xuất token `pbl5_token` từ `localStorage` và đính kèm vào header `Authorization: Bearer <token>`. Đồng thời lưu `_token` vào config của request để tracking.
* **Response Interceptor:** Bắt các lỗi `401 Unauthorized` toàn cục. Nếu lỗi không phải từ endpoint login và token lỗi trùng với token hiện hành, hệ thống sẽ tự động clear `localStorage` và ép `window.location.href = "/login"`.
* **`docService` Object:** Gói gọn HẦU HẾT các lời gọi API của hệ thống (Login, Register, Upload, Search, Get Profile, Admin Users, Chat). Đây là một thiết kế kiểu "God Object".

---

## 6. Components Architecture

Components được phân nhóm khá rạch ròi, tuy nhiên sự ranh giới giữa Business Logic và Presentation chưa hoàn toàn triệt để:

* **Layout Components (`components/layout/AppLayout.tsx`):** Đóng vai trò là "Shell" của ứng dụng. Chứa logic phức tạp liên quan đến routing menu, responsive sidebar, toggle Dark Mode, đổi ngôn ngữ và thông tin User hiện tại.
* **Dashboard Components (`components/dashboard/`):** Chứa nhiều file lớn như `DocumentDetailDrawer.tsx` (gần 11KB) hoặc `ManualCropModal.tsx`. Những component này đang "ôm" cả UI phức tạp và Business logic (gọi API, xử lý state cục bộ khá nặng).
* **UI/Shared Components:** Chứa các block nhỏ có thể tái sử dụng, hoặc widgets độc lập như `AIChatWidget`.

---

## 7. State Management

Hệ thống phân mảnh các loại state ở những vị trí tương ứng hợp lý, nhưng có điểm chưa đồng nhất:

* **Auth State:** Nằm ở React Context (`AuthProvider`) và Persistent State tại `localStorage` (`pbl5_token`).
* **Server State:** Quản lý bằng `@tanstack/react-query` (được cấu hình trong `QueryProvider`).
* **Local UI State:** Nằm rải rác trong các component dùng `useState`, `useReducer`. 
* **Theme/Language State:** 
  * Language được lưu ở Context.
  * Theme (Dark mode) hiện tại đang bị quản lý dưới dạng local state của `AppLayout` và sync với `localStorage`, chưa đưa lên thành Global Context dẫn đến các trang nằm ngoài AppLayout không đồng nhất theme.

---

## 8. Current Authentication Architecture

**Structure & Flow:**
1. **Login:** User submit form tại `/login`. `AuthProvider.login()` được gọi -> Gửi request -> Nhận token -> Lưu vào `localStorage('pbl5_token')` -> Fetch Profile -> Cập nhật User State.
2. **Hydration:** Khi ứng dụng load, `useEffect` của `AuthProvider` kiểm tra `localStorage`. Nếu có token, tự động fetch `users/me` để nạp User state. Nếu API trả lỗi (hết hạn), tự xoá token.
3. **Route Protection (Client-side):** Một `useEffect` khác trong `AuthProvider` giám sát sự thay đổi của `pathname` và `user`. Nếu không có token và user đang ở trang không public, dùng `router.push('/login')`. Nếu có token và ở trang public, đẩy vào `/dashboard`.
4. **Logout:** Clear `localStorage`, set User State thành `null`, chuyển hướng về `/login`.

---

## 9. Current Problems / Technical Debt

* **Coupling & "God Object" Smell:** `src/services/api.ts` xuất file `docService` đang gánh toàn bộ domain logic từ auth, văn bản, admin users đến chat. Việc thiếu phân tách module API (như `auth.api.ts`, `user.api.ts`, `document.api.ts`) sẽ khiến file này ngày càng phình to và dễ gây conflict. Thêm vào đó, có sự xuất hiện rải rác của `lib/services/user.service.ts` gây nhập nhằng về "Source of Truth" cho API calls.
* **Hydration Risk & Route Protection Risk:** 
  * Xác thực hoàn toàn dựa trên Client-side Routing (`useEffect` trong AuthProvider). Việc không sử dụng Next.js Middleware để chặn server-side sẽ dễ dẫn tới tình trạng "Chớp nháy" giao diện (Layout shift) hoặc rò rỉ layout trước khi redirect kịp diễn ra.
* **Duplicated Responsibility trong AppLayout:** `AppLayout` đang quản lý cả Dark mode (theme), routing, menu rendering và user info presentation. Nên tách theme thành một `ThemeProvider` riêng biệt.
* **Security & Auth Risk:** Lưu trữ Access Token trong `localStorage` làm ứng dụng dễ dính rủi ro XSS. 

---

## 10. Critical Files

* **`src/providers/AuthProvider.tsx`**: Trái tim của hệ thống bảo mật frontend. Bất kỳ lỗi logic nào ở đây đều có thể dẫn đến vòng lặp vô hạn (infinite redirect loop) hoặc lỗ hổng bảo mật truy cập.
* **`src/services/api.ts`**: Nguồn sống (Source of Truth) cho các tác vụ trao đổi dữ liệu backend. Interceptors đang chứa logic xử lý global 401, nếu refactor nhầm có thể làm hỏng toàn bộ flow login/logout.
* **`src/app/layout.tsx`**: Nơi quyết định thứ tự bọc của các Providers. Sửa đổi có thể gây lỗi Context Undefined nếu một provider này cần truy cập dữ liệu của provider kia sai trật tự.
* **`src/components/layout/AppLayout.tsx`**: Khung xương của Dashboard. File ảnh hưởng sâu tới UX/UI của các component con nằm bên trong.
