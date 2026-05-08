# AUTHENTICATION ARCHITECTURE SPECIFICATION
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL SOURCE OF TRUTH
**Purpose:** Định nghĩa vòng đời và kiến trúc xác thực tiêu chuẩn

> **WARNING:** Đây là tài liệu ĐẶC TẢ KIẾN TRÚC XÁC THỰC (Auth Governance Layer). Tất cả các quy tắc liên quan đến Token, Login, Logout, Protected Routes và React Query tích hợp bắt buộc phải tuân theo tài liệu này.

---

## 1. Core Auth Philosophy
Hệ thống xác thực được thiết kế dựa trên các nguyên lý cốt lõi:
* **Single Source of Truth:** Trạng thái đăng nhập của toàn bộ UI và App Router chỉ phụ thuộc vào một nguồn duy nhất (Context Provider kết hợp React Query cache). Không có trạng thái rác rải rác.
* **Centralized Auth Ownership:** Logic Auth phải được gom về một trung tâm kiểm soát, tuyệt đối không rải rác lệnh check token ở các components con.
* **Deterministic Auth Lifecycle:** Vòng đời (Lifecycle) từ khi bật web, kiểm tra token, đến lúc hiển thị dữ liệu phải mang tính tất định (có trình tự trước sau rành mạch).
* **Hydration-First Rendering:** Hệ thống phải hoàn tất bước Hydration (tải và khôi phục trạng thái User từ cache/storage) trước khi đánh giá quyền truy cập (Route Protection).
* **Predictable Unauthorized Handling:** Xử lý lỗi 401 Unauthorized theo một luồng dự đoán được, chặn đứng các vòng lặp vô hạn (infinite loops).

---

## 2. Official Auth Architecture
Sơ đồ phân cấp quyền lực (Ownership) trong hệ thống Auth:

```text
AuthProvider (Context / React Query wrapper)
    ↓
useAuth() (Global Hook)
    ↓
Protected Layout / Guards (Route Protection layer)
    ↓
Feature Pages (Business UI)
```

**Ownership Checklist:**
* **Token:** API Interceptor và Utility Helpers nắm quyền đọc/ghi.
* **User State:** Được quản lý trực tiếp bởi React Query (làm Data Store) và truyền xuống qua `AuthProvider`.
* **Hydration State:** `AuthProvider` là chủ sở hữu (quyết định khi nào `isHydrating = false`).
* **Login/Logout Actions:** Triển khai thông qua `useAuth()` hook.

---

## 3. Auth Lifecycle Specification
Luồng sống (Lifecycle) của quá trình xác thực từ lúc bắt đầu:

```text
App Start (F5 hoặc mở tab mới)
    ↓
Hydration Start (isHydrating = true)
    ↓
Read Token (từ localStorage)
    ↓
Validate Session (Nếu có token -> fetch current user)
    ↓
Fetch Current User (thông qua React Query)
    ↓
Hydration Complete (isHydrating = false)
    ↓
Render Protected App (Nếu thỏa điều kiện Route Protection)
```

* **Loading Semantics:** Cờ `isHydrating` xác định UI có hiển thị màn hình Skeleton/Spinner hay không.
* **Pending States:** Trong lúc `isHydrating = true`, tuyệt đối không thực hiện redirect.
* **Unauthorized States:** Nếu không có token hoặc fetch user trả về 401, chuyển sang trạng thái Unauthenticated.
* **Retry Behavior:** API fetch user không được tự động retry liên tục khi trả về lỗi 401 hoặc 403 để tránh spam backend.

---

## 4. Hydration Rules (CRITICAL)
Sự tương tác giữa Client-Side Hydration và Route Protection là nguyên nhân chính gây lỗi chớp nháy (flashing) hoặc gãy layout. Bắt buộc tuân thủ:

**CẤM TUYỆT ĐỐI:**
* Redirect (sử dụng `router.push` hoặc `window.location`) TRƯỚC KHI trạng thái `isHydrating` kết thúc.
* Check Auth rải rác ở Component con khi chưa Hydration xong.
* Tạo ra nhiều cờ (flags) quản lý Hydration chồng chéo.

**QUY ĐỊNH:**
* Protected routes **PHẢI WAIT** hydration: Giao diện bảo mật không bao giờ được render chừng nào `isHydrating` chưa chuyển sang `false`.
* **Loading Ownership:** Màn hình chờ (Suspense/Loading spinner) trong quá trình hydrate là trách nhiệm của một lớp bao bọc (Wrapper Component) chuyên biệt, thường nằm ở Auth Guard.

---

## 5. Protected Route Strategy
Phân loại các loại route rõ ràng:

```text
/login, /register, /             → Public (Guest Routes - Đăng nhập rồi thì không vào được, tự đẩy về dashboard)
/verify/*, /public/*             → Semi-public (Ai cũng vào được)
/dashboard/*, /profile/*, /users/* → Protected (Bắt buộc phải có token và User State hợp lệ)
```

**Route Protection Ownership:**
* Logic chặn route phải nằm ở cấp cao nhất (Thường là thông qua Wrapper `<AuthGuard>` hoặc middleware), không để logic redirect nhúng sâu trong Component UI của Feature.

---

## 6. JWT Lifecycle Rules
Xử lý Token JWT là thao tác rất nhạy cảm.

**Quy định:**
* **Token Storage Ownership:** Được đóng gói thành một helper module (ví dụ: `lib/auth.ts` gồm `getToken`, `setToken`, `clearToken`).
* **Token Attachment Strategy:** Gắn vào API request TỰ ĐỘNG qua Axios Interceptor.
* **Expired Token Handling:** Trả về 401 -> Interceptor kích hoạt -> Xóa Token -> Chuyển sang trạng thái `expired`.
* **Logout-on-expire Behavior:** Token hết hạn là bị ép logout lập tức, đẩy user về `/login`.

**CẤM:**
* Parsing/Decode Token trực tiếp bên trong các trang UI.
* Có quá 1 nơi gọi `localStorage.setItem('token')` trong hệ thống.
* Viết rải rác logic kiểm tra token bằng `if(localStorage.getItem)` trong các file component.

---

## 7. Login Flow Specification
Luồng tiêu chuẩn, đảm bảo không có race-condition:

```text
Submit Login (UI Component)
    ↓
API /auth/login trả về Token
    ↓
Utility Store Token (lib/auth.ts)
    ↓
Invalidate / Refetch Query `currentUser` (React Query)
    ↓
Đợi dữ liệu Current User tải xong (Hydration Stable)
    ↓
Gọi router.push('/dashboard')
```

* **Loading States:** UI phải hiển thị trạng thái đang xử lý (Spinner trên nút bấm) từ lúc submit đến khi Redirect thành công.
* **Race Conditions:** Không Redirect trước khi React Query tải xong dữ liệu user, nếu không AppLayout sẽ render bị trống do `user` chưa kịp update vào Context.

---

## 8. Logout Flow Specification
* **Clear Token:** Xoá khỏi Storage thông qua Utility.
* **Clear Queries:** Gọi `queryClient.clear()` hoặc xoá cache `currentUser` để bảo mật dữ liệu khỏi session tiếp theo.
* **Clear Auth State:** Reset React Context về `null`.
* **Redirect Semantics:** Redirect về `/login`.
* **Cleanup Sequence:** Bắt buộc tuân thủ đúng trình tự: Xóa data/token trước -> Redirect sau.

---

## 9. React Query Integration
React Query là một phần quan trọng để quản lý Auth Data Store.

* **Auth Query Ownership:** Query lấy `currentUser` phải được quản lý tập trung và chỉ gọi ở 1 nơi (khi Hydration).
* **Invalidation Strategy:** Bất cứ Mutation nào thay đổi Role, Avatar, Name của user phải invalidate Query `currentUser` này.
* **Query Synchronization:** Context `user` và React Query cache của `currentUser` phải luôn là một. Giải pháp lý tưởng là AuthProvider sẽ bọc (wrap) `useQuery(['currentUser'])` và phân phối dữ liệu đó xuống toàn App. Tuyệt đối không tạo 2 endpoint hoặc 2 query key khác nhau cho cùng một object user.

---

## 10. Unauthorized Handling (401 Flows)
Tránh vòng lặp vô hạn (Infinite redirect loops):

* **401 Interceptor Flow:** Khi nhận 401 từ backend:
  1. Kiểm tra request này có phải từ `/login` hay không (bỏ qua nếu đúng).
  2. Emit event hoặc gọi callback (không gọi thẳng `window.location.href` nếu có thể làm qua Router React).
  3. Xóa Token và Cache.
* **Auto Logout Strategy:** Đảm bảo interceptor không gọi vòng lặp nếu API login bị 401. Trạng thái stale protected UI không được phép lưu trên màn hình sau khi đã bị 401.

---

## 11. Auth State Machine
Hệ thống Auth hoạt động như một Finite State Machine (Cỗ máy trạng thái hữu hạn). Mọi lúc, app chỉ được phép ở một trong các trạng thái sau:

* `idle`: Bắt đầu load app.
* `hydrating`: Đang đọc token và gọi API lấy user. UI đang bị khóa bởi loading spinner.
* `authenticated`: Quá trình hydrate thành công, token hợp lệ, user hợp lệ. (Được truy cập Protected).
* `unauthenticated`: Không có token, hoặc token không hợp lệ. (Chỉ được truy cập Public).
* `logging_out`: Đang trong quá trình clear dữ liệu.

*(Không được phép tạo ra các trạng thái dị thường như: Có user nhưng không có token, hoặc có token hợp lệ nhưng unauthenticated).*

---

## 12. AI-Agent Auth Rules
**Luật dành cho AI Agents khi Refactor:**

* **AI KHÔNG ĐƯỢC PHÉP:**
  * Tạo thêm một Auth System song song với hệ thống hiện tại.
  * Lách qua `AuthProvider` (Bypass) bằng cách tự check quyền ở các hooks cục bộ.
  * Phá vỡ logic token lifecycle đã thiết lập.
* **AI BẮT BUỘC PHẢI:**
  * Kế thừa và bảo tồn vòng đời Auth (Auth Lifecycle).
  * Bảo toàn logic Hydration (luôn đảm bảo trạng thái Loading kết thúc đúng lúc).
  * Bảo toàn hành vi chặn route (Route Guards).

---

## 13. Auth Verification Checklist
Bất kỳ PR hoặc bước di dời nào đụng chạm đến Auth cũng phải đi qua Checklist này:

* [ ] **Login works:** Đăng nhập, nhận token, tự động redirect sang dashboard, UI cập nhật avatar.
* [ ] **Logout works:** Logout xóa sạch token, về lại trang đăng nhập, back lại trang trước (thông qua trình duyệt) không vô được dashboard.
* [ ] **Protected Routes Stable:** F5 ở `/dashboard` khi có token -> Màn hình load -> Hiển thị Dashboard.
* [ ] **Hydration Stable:** Không chớp màn hình trắng hoặc giật tung UI khi Hydrating.
* [ ] **No Redirect Loops:** Truy cập trái phép, bị đẩy về `/login` 1 lần duy nhất, không bị nháy liên tục.
* [ ] **No Stale Auth State:** Đổi tên trong màn Profile, Navbar Header tự update lập tức.
* [ ] **Expired Token Handled:** Mở Devtool, cố tình xóa token, chuyển tab bấm 1 nút gọi API -> bị đẩy về `/login`.

---

## 14. Future Extension Guidelines
* **Refresh Tokens:** Nếu trong tương lai áp dụng, interceptor sẽ hứng 401, gọi `/refresh` giữ nguyên các pending request, sau đó retry.
* **Role-Based Access (RBAC):** Mở rộng `<ProtectedRoute requiredRole="admin">`.
* **Multi-session / OAuth:** Trạng thái User State Machine phải được thiết kế để hỗ trợ mảng token.

> Tài liệu này được áp dụng VÔ ĐIỀU KIỆN cho mọi mã nguồn frontend hiện tại.
