# AUTH STABILIZATION PHASE
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** AUTH RUNTIME STABILIZATION HANDBOOK
**Focus:** Centralizing Auth Ownership & Eliminating Runtime Inconsistency

---

## 1. Core Auth Philosophy
* **Stabilize Before Redesign:** Phải vá các lỗi runtime hiện tại của hệ thống Auth trước khi thay đổi kiến trúc hay giao diện.
* **Auth is Runtime-Critical:** Bất kỳ sai sót nhỏ nào trong luồng Auth cũng có thể làm gãy toàn bộ ứng dụng (Redirect loops, black screens).
* **Hydration Stability First:** Luồng xác thực phải đồng bộ tuyệt đối với quá trình Hydration của Next.js để tránh chớp nháy UI.
* **Single Source of Auth Truth:** Chỉ có một nguồn dữ liệu duy nhất quyết định trạng thái đăng nhập.
* **Predictable Redirect Lifecycle:** Các hành động chuyển trang (Redirect) phải có trình tự và logic dự đoán được.

---

## 2. Current Auth Risk Profile
Các rủi ro hiện tại cần được xử lý triệt để:
* **Stale Auth State:** Navbar/Header không cập nhật đúng thông tin User.
* **Duplicate Auth Ownership:** Logic check quyền nằm rải rác ở cả `AuthProvider`, `layout.tsx` và từng Component.
* **Expired Token Loops:** Token hết hạn gây ra vòng lặp Redirect vô hạn.
* **Hydration Mismatch:** UI render ra trạng thái "Authenticated" trong khi dữ liệu thực tế chưa tải xong.
* **Unauthorized Redirect Loops:** Lỗi 401 không được xử lý nhất quán, gây spam request.
* **Inconsistent User Bootstrap:** Mỗi trang có một cách "khởi động" thông tin người dùng khác nhau.

---

## 3. Official Auth Ownership Model
Chúng ta xác lập `AuthProvider` là **Chủ sở hữu duy nhất (Single Owner)** cho các mảng sau:
* **Token Lifecycle Owner:** Chịu trách nhiệm đọc/ghi/xóa token.
* **Current-User Owner:** Nắm giữ thông tin người dùng đang đăng nhập.
* **Auth-Loading Owner:** Quyết định khi nào ứng dụng đã "sẵn sàng" (Auth resolved).

**TUYỆT ĐỐI CẤM:**
* Các component con tự quản lý trạng thái Auth độc lập.
* Các hàm bootstrap thông tin user chạy riêng lẻ ngoài `AuthProvider`.

---

## 4. Auth Lifecycle Design
Vòng đời xác thực tiêu chuẩn cho mỗi phiên làm việc:

```text
App Start (F5 / Mở tab)
    ↓
Token Read (Đọc từ localStorage thông qua Utility)
    ↓
Auth Bootstrap (Gửi request lấy /users/me nếu có token)
    ↓
User Verification (Xác minh tính hợp lệ từ Backend)
    ↓
Hydration Complete (isHydrating = false)
    ↓
Protected Routes Enabled (Mở khóa giao diện Dashboard)
```

---

## 5. Hydration Stability Rules (CRITICAL)
Để chấm dứt tình trạng chớp nháy UI (UI Flicker):
* **BẮT BUỘC:** Chặn hiển thị (Render) các trang bảo mật (Protected Pages) chừng nào Auth chưa được giải quyết (Resolved).
* **KHÔNG ĐƯỢC:** Thực hiện Redirect (`router.push`) trước khi quá trình Hydration hoàn tất.
* **Loading UI:** Luôn hiển thị một màn hình chờ (Splash Screen) hoặc Skeleton chuẩn mực trong lúc đang xác thực.

---

## 6. Protected Route Governance
Quy định trạng thái cho các route bảo vệ:
* **Loading:** Đang kiểm tra token/fetch user.
* **Authenticated:** User hợp lệ -> Hiển thị Dashboard.
* **Unauthenticated:** Không có token/token sai -> Redirect về `/login`.

**Quy tắc:** Phải phân biệt rõ ràng giữa trạng thái "Chưa có dữ liệu" (Loading) và "Không có quyền" (Unauthorized) để tránh Redirect nhầm.

---

## 7. Token Lifecycle Governance
Quản lý vòng đời JWT:
* **Storage:** Chỉ lưu ở một nơi duy nhất (`localStorage` hoặc `Cookie` tùy cấu hình).
* **Injection:** Tự động gắn vào Header `Authorization` qua `apiClient`.
* **Expiration Handling:** Khi Token hết hạn, phải kích hoạt luồng Logout sạch sẽ (Clear storage, Clear cache).
* **CẤM:** Lưu trữ token ở nhiều biến local hoặc biến global chồng chéo nhau.

---

## 8. Unauthorized Handling Rules
Khi gặp lỗi `401 Unauthorized`:
1.  Dừng mọi request đang chờ (Pending requests).
2.  Xóa sạch Token và User State.
3.  Thông báo cho User (nếu cần).
4.  Redirect về `/login` một lần duy nhất.
5.  **KHÔNG ĐƯỢC** để xảy ra tình trạng "Storm" (hàng chục request 401 cùng lúc kích hoạt hàng chục lệnh Redirect).

---

## 9. Redirect Lifecycle Rules
* **Login Redirect:** Chỉ Redirect sang Dashboard sau khi đã lưu Token và Fetch User thành công.
* **Logout Redirect:** Chỉ chuyển về Login sau khi đã xóa sạch dữ liệu cục bộ.
* **Expired-session Redirect:** Chuyển hướng kèm theo `callbackUrl` để user quay lại trang cũ sau khi đăng nhập lại.
* **CẤM:** Có nhiều component cùng tranh giành quyền thực hiện lệnh `navigation`.

---

## 10. Auth Query Governance (React Query)
* **Ownership:** Query lấy `currentUser` phải được bọc trong `AuthProvider`.
* **Invalidation:** Khi Logout, phải gọi `queryClient.clear()` hoặc `removeQueries(['currentUser'])`.
* **Stale Prevention:** Đảm bảo dữ liệu user không bị cũ (stale) quá 1 phút.

---

## 11. AI-Agent Auth Rules
**AI Agent PHẢI:**
* Bảo toàn sự ổn định runtime khi sửa code Auth.
* Kiểm chứng (Verify) kỹ lưỡng luồng Redirect và Hydration.
* Luôn test trường hợp Token hết hạn (Expired token handling).

**AI Agent KHÔNG ĐƯỢC:**
* Tự ý thay đổi toàn bộ kiến trúc Auth khi chưa có ADR.
* Viết lại logic backend auth.
* Di chuyển logic sở hữu Auth (Ownership) ra khỏi `AuthProvider`.

---

## 12. Verification Checklist
* [ ] **Login works:** Đăng nhập thành công, vào được dashboard.
* [ ] **Refresh works:** F5 trang dashboard không bị đá ra ngoài, không bị chớp màn hình trắng.
* [ ] **Logout works:** Đăng xuất sạch sẽ dữ liệu.
* [ ] **Protected routes stable:** Không thể vào dashboard khi chưa login.
* [ ] **No redirect loops:** Không bị kẹt ở vòng lặp login -> dashboard -> login.
* [ ] **Expired token handled:** Xóa token thủ công trong DevTool, bấm nút gọi API -> bị đẩy về Login an toàn.

---

## 13. Known High-Risk Areas
* **Route Guards:** Nơi dễ gây lỗi vòng lặp Redirect nhất.
* **Auth Bootstrap Timing:** Nếu bootstrap quá chậm, UI sẽ bị treo.
* **Duplicated Providers:** Có nhiều hơn 1 `AuthProvider` bọc lẫn nhau.
* **Premature Rendering:** Trang Dashboard hiện lên khi `user` object vẫn đang là `null`.

---

## 14. Recommended Execution Order
1.  **Audit auth ownership:** Tìm tất cả những nơi đang tự ý quản lý auth state.
2.  **Stabilize hydration:** Sửa lỗi chớp nháy UI khi load trang.
3.  **Normalize protected routes:** Thống nhất cách chặn truy cập trái phép.
4.  **Normalize unauthorized handling:** Xử lý lỗi 401 đồng bộ qua `apiClient`.
5.  **Normalize redirects:** Thống nhất các lệnh chuyển trang.
6.  **Cleanup duplicate auth state:** Xóa bỏ code rác và state dư thừa.

---

## 15. Exit Criteria
Phase này kết thúc khi:
* ✅ Quyền sở hữu Auth (Ownership) tập trung 100% tại `AuthProvider`.
* ✅ Quá trình Hydration diễn ra mượt mà, không chớp nháy.
* ✅ Luồng Redirect hoạt động tất định (Deterministic).
* ✅ Không còn tình trạng "Stale Auth State" trên giao diện.

---
**Sự ổn định của Auth là sự sống còn của toàn bộ ứng dụng.**
