# Authentication Flow Analysis Report
**Project:** PBL5 Document Verification (NextJS App Router)
**Date:** 2026-05-08

---

## 1. Login Flow Runtime Order

Dưới đây là sequence chi tiết của quá trình đăng nhập và điều hướng, từ lúc User click button đến khi Dashboard render:

1. **User Action:** Submit form tại `app/login/page.tsx`.
2. **Component Handler:** Hàm `onFinish` gọi `login(username, password)` từ `useAuth()`.
3. **API Request (1):** `docService.login()` thực hiện POST `/auth/login`.
4. **Token Storage (1):** Request thành công, `docService.login` trong `api.ts` chủ động set `localStorage.setItem('pbl5_token', access_token)`.
5. **Token Storage (2):** Trở về hàm `login` trong `AuthProvider`, tiếp tục set `localStorage.setItem('pbl5_token', ...)` (Đang bị ghi đè/duplicate logic).
6. **API Request (2):** `AuthProvider` gọi tiếp `docService.getProfile()` để lấy dữ liệu User hiện tại.
7. **Auth State Update:** Hàm `setUser(profileRes.data)` chạy, cập nhật React Context.
8. **Effect Trigger:** State `user` thay đổi, kích hoạt `useEffect` thứ 2 (Route Protection) trong `AuthProvider`.
9. **Redirect:** `useEffect` kiểm tra thấy đang ở public path (`/login`), có `token` và có `user`, gọi `router.push('/dashboard')`.
10. **Render Dashboard:** Next.js Router chuyển sang trang mới, `AppLayout` render và lấy `user` từ Context để hiển thị thông tin.

---

## 2. Token Storage Architecture

* **Vị trí lưu trữ:** Persistent state tại Browser `localStorage` với key `pbl5_token`.
* **Người ghi (Writers):** 
  * `src/services/api.ts` (trong hàm `docService.login`).
  * `src/providers/AuthProvider.tsx` (trong hàm `login`).
* **Người đọc (Readers):**
  * `src/services/api.ts`: Axios Request Interceptor đọc token gắn vào header `Authorization: Bearer <token>`. Lại lưu một bản backup vào biến `_token` của config request.
  * `src/providers/AuthProvider.tsx`: Đọc trong `useEffect` lúc mount (Hydration) và `useEffect` theo dõi Route.
* **Người xoá (Clearers):**
  * Hành động thủ công: `AuthProvider.logout()` xoá và redirect.
  * Hành động tự động: Axios Response Interceptor khi bắt được mã lỗi `401 Unauthorized` (so khớp token) sẽ clear storage và dùng `window.location.href = "/login"`.
  * Hydration fail: API `getProfile` trong lần load đầu bị lỗi sẽ tự remove.

---

## 3. AuthProvider Lifecycle

Component `AuthProvider` đóng vai trò Controller trung tâm, sở hữu 2 vòng đời chính:

1. **Initial Mount:**
   * Khởi tạo với `user: null`, `loading: true`, `initialized: false`.
2. **Hydration Flow (`useEffect` #1 - Chạy 1 lần):**
   * Đọc token. Nếu không có: Set `loading: false`, `initialized: true` -> Dừng.
   * Nếu có: Fetch `getProfile()`. Bất kể thành công (set user) hay thất bại (remove token), khối `finally` luôn set `loading: false`, `initialized: true`.
3. **Route Protection (`useEffect` #2 - Chạy theo dependency):**
   * Chờ `initialized === true`.
   * Kiểm tra public path (`/login`, `/`).
   * Nếu không token & ở trang private -> `router.push('/login')`.
   * Nếu có token & ở trang public & **đã có user** -> `router.push('/dashboard')`.

---

## 4. `/api/users/me` Flow

API lấy current user đang bị phân mảnh ở 2 nơi với 2 cách gọi khác nhau:

* **Call 1 (Bắt buộc):** Từ `AuthProvider` thông qua `docService.getProfile()`.
  * **Timing:** Gọi khi vừa F5 trang web (có token) hoặc ngay sau khi gọi API login thành công.
  * **Dependency:** Phụ thuộc Axios Interceptor để inject token.
  * **Cache:** Không cache. Quản lý trực tiếp bằng React State.
* **Call 2 (Mục đích cục bộ):** Từ `app/(dashboard)/profile/page.tsx` thông qua `useQuery(['currentUserProfile'])`.
  * **Timing:** Gọi khi user vào route `/profile`.
  * **Cache:** Quản lý bởi React Query (mặc định staleTime 1 phút theo `QueryProvider`).
  * **Invalidation:** Được invalidate sau khi update profile qua `mutation`.

---

## 5. Protected Route Flow & Timing Risk

**Mô tả luồng chặn truy cập trái phép:**
1. User nhập `/dashboard` trực tiếp lên thanh địa chỉ mà chưa đăng nhập.
2. Next.js load trang, render `AppLayout`. Vì `loading = true` của AuthProvider, UI hiển thị màn hình *Đang khởi tạo hệ thống...*.
3. Hydration xong, `loading = false`, `initialized = true`.
4. `AppLayout` bắt đầu render cây component bên trong (Header, Sidebar, ...).
5. Đồng thời, Route Protection `useEffect` bị kích hoạt, gọi `router.push('/login')`.

**Rủi ro ở đây (Hydration Timing Issue):**
Bởi vì Next.js render dựa vào Client-side Effect, sẽ có một khoảnh khắc rất ngắn Component bảo vệ (như `dashboard/page.tsx`) bị render một nhịp (hoặc throw lỗi nếu truy cập sâu vào object User) trước khi `router.push` kịp chuyển hướng.

---

## 6. React Query / Cache Interaction

Hiện tại sự tương tác giữa Auth State và React Query gây ra Technical Debt nghiêm trọng:

* **Duplicate Auth Source:** Context đang lưu 1 bản sao của `user`, còn React Query ở trang Profile đang lưu 1 bản sao khác.
* **Stale Auth State (Race Condition):** Khi user thay đổi thông tin cá nhân (VD: đổi tên, avatar) tại trang `/profile`, mutation gọi `queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] })`. 
* **Hậu quả:** Dữ liệu user ở trang Profile được update mới nhất, nhưng `AuthProvider` (và theo đó là Sider, Header của `AppLayout`) vẫn dùng state cũ không được cập nhật. Người dùng sẽ thấy Tên ở Header khác Tên ở giữa màn hình trang Profile.

---

## 7. Hydration & App Router Risks

* **Thiếu Middleware:** Next.js App Router cung cấp cơ chế bảo vệ Route hoàn hảo nhất là qua Server Middleware. Việc thiếu vắng Middleware đồng nghĩa hệ thống hiện tại đang để lọt mọi request HTML trang protected về phía Client, và chỉ giấu UI đi bằng Client logic (`if (loading) return null`). Điều này không chuẩn về mặt bảo mật (dữ liệu có thể lọt vào trang tĩnh).
* **Mismatch Risk:** Check `typeof window !== 'undefined'` xuất hiện nhiều trong `api.ts`, chứng tỏ sự "vật lộn" giữa SSR và Browser APIs (localStorage).

---

## 8. Current Problems Summary

1. **Race Condition & Duplicated Source of Truth:** User State tồn tại song song giữa React State (Context) và Server Cache (React Query). Cập nhật Profile không đồng bộ được Navbar UI.
2. **Duplicate Token Logic:** `docService.login` và `AuthProvider.login` gọi hàm lưu `pbl5_token` trùng lặp lên nhau.
3. **Redundant 401 Handle:** `api.ts` dùng `window.location.href = "/login"` trong khi React code dùng `router.push`. Việc hard-reload URL làm mất hoàn toàn Client State và trải nghiệm SPA.
4. **Layout Flashing Timing:** Route protection chạy *sau* khi state `loading` chuyển thành `false`, gây lọt frame render cho các component con yêu cầu bảo mật.

---

## 9. Source of Truth

Hiện trạng kiến trúc chưa có "Single Source of Truth" thuần nhất:

* **Source of Truth cho Token:** `localStorage('pbl5_token')`.
* **Source of Truth cho Access Control (Routing):** State `user` trong `AuthProvider`.
* **Source of Truth cho Profile View:** Cache `['currentUserProfile']` của React Query ở module người dùng.

---

## 10. Critical Risk Files

Dưới đây là các file tiềm ẩn rủi ro race-condition cao nhất và cần ưu tiên cấu trúc lại:

1. **`src/providers/AuthProvider.tsx`**: (Cần Refactor ngay) Đang handle routing (useEffect), hydration (useEffect), state management. File này nên giao phó nhiệm vụ kiểm tra token ban đầu cho Middleware.
2. **`src/app/(dashboard)/profile/page.tsx`**: Trang tạo ra 2 version của user. (Cần refactor: Gộp API fetch User về 1 nguồn duy nhất quản lý bởi React Query, và AuthProvider chỉ nên wrap `useQuery` này thay vì tự gọi `getProfile`).
3. **`src/services/api.ts`**: Interceptor đang chứa logic Hard-redirect `window.location.href`. Nên bắn event hoặc reject Promise để tầng Context tự quyết định Router Push.
