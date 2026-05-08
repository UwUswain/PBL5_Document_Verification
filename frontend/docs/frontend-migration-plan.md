# Frontend Migration Master Plan
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** Master Migration Handbook
**Target Audience:** Senior Engineers & AI Agents

---

## 1. Migration Philosophy
Quá trình chuyển đổi kiến trúc Frontend của dự án này phải diễn ra an toàn, không được làm gián đoạn hệ thống. Dưới đây là triết lý thực thi cốt lõi:

* **Incremental Migration (Chuyển đổi tăng dần):** Thay vì "đập đi xây lại" (Big-bang rewrite) có rủi ro vỡ hệ thống cực cao, chúng ta sẽ refactor từng mảnh nhỏ. Hệ thống cũ và mới phải chạy song song được với nhau.
* **Auth Stabilization First:** Auth là xương sống của mọi trang protected. Nếu Auth bị lỗi, toàn bộ ứng dụng chết. Phải giải quyết các lỗi race-condition và hydration của Auth trước tiên để tạo nền móng an toàn cho các bước sau.
* **Feature Isolation:** Quá trình bóc tách logic thành từng `feature/` riêng biệt giúp thu hẹp phạm vi ảnh hưởng (Blast Radius). Khi refactor tính năng `documents`, tính năng `users` vẫn sẽ hoạt động bình thường trên code cũ.
* **Continuous Verification:** Sau mỗi phase hoặc mỗi PR, hệ thống phải build thành công và vượt qua các bài kiểm thử cơ bản để đảm bảo không gãy (break) luồng hiện hành.

---

## 2. Global Migration Strategy
Quá trình migration được chia thành 8 Phase tuyến tính. Mỗi phase có độ phụ thuộc chặt chẽ vào phase trước đó.

* **Phase 0 → Freeze & Governance:** Đóng băng việc thêm tính năng mới trên core cũ, thiết lập quy tắc, cấu trúc thư mục mới.
* **Phase 1 → Auth Stabilization:** Fix các lỗi Auth hiện tại, chuẩn hoá Hydration và Single Source of Truth cho user.
* **Phase 2 → API Layer Infrastructure:** Tách `lib/apiClient.ts` từ `services/api.ts` hiện tại.
* **Phase 3 → Auth Feature Refactor:** Chuyển đổi hoàn toàn luồng Auth sang chuẩn Feature-Sliced.
* **Phase 4 → Profile & Users Migration:** Di dời tính năng quản lý Users và Profile.
* **Phase 5 → Documents Feature Migration:** Di dời tính năng lõi (Dashboard, Upload, Search, Repository).
* **Phase 6 → Shared UI Cleanup:** Gom các components còn lại vào `components/ui/` và dọn dẹp AppLayout.
* **Phase 7 → Dead Code Removal:** Xóa bỏ hoàn toàn code cũ (đặc biệt là file `services/api.ts` khổng lồ).
* **Phase 8 → Optimization:** Tối ưu hóa render, caching và bundle size.

---

## 3. Phase-by-Phase Breakdown

### Phase 1: Auth Stabilization
* **Mục tiêu:** Cầm máu các lỗi race-condition, tách Auth Provider khỏi logic routing cứng và chuẩn hóa fetching.
* **Files Affected:** `providers/AuthProvider.tsx`, `services/api.ts`.
* **Migration Steps:** Xoá duplicate `localStorage.setItem`, hợp nhất React Query và Context cho việc fetch User Profile. Sửa lỗi `loading` flash.
* **Risks:** Mất khả năng đăng nhập hoặc infinite redirect loop.
* **Rollback:** Revert commit thay đổi `AuthProvider.tsx`.
* **Success Criteria:** F5 trang không bị chớp, đăng nhập một lần là ăn, thông tin User đồng bộ toàn app.

### Phase 2: API Layer Infrastructure
* **Mục tiêu:** Tạo nền móng mạng lưới (network foundation).
* **Files Affected:** `lib/apiClient.ts` (mới), `services/api.ts` (cũ).
* **Migration Steps:** Viết `lib/apiClient.ts` cấu hình Axios và Interceptors chuẩn mực. Tạm thời giữ lại `services/api.ts` cho các API cũ chưa migrate.
* **Risks:** Mất token header trong các request mới.
* **Rollback:** Xóa thư mục `lib/` hoặc rollback thay đổi.
* **Success Criteria:** `lib/apiClient.ts` hoạt động song song và bắt được 401 interceptor chính xác mà không đụng chạm đến code cũ.

### Phase 3 & 4 & 5: Feature Migrations (Lần lượt)
* **Mục tiêu:** Bóc tách dần logic nghiệp vụ từ `src/components` và `services/api.ts` vào thư mục `features/`.
* **Files Affected:** `features/*`, `app/(dashboard)/*`.
* **Migration Steps:**
  1. Tạo thư mục feature (`api`, `hooks`, `components`, `types`).
  2. Viết API hooks sử dụng `lib/apiClient.ts`.
  3. Bứng component từ nơi cũ sang nơi mới, refactor cho phù hợp.
  4. Trỏ file trong `app/` tới component mới.
* **Risks:** Code cũ và mới conflict state.
* **Rollback:** Trỏ lại import trong `app/` về thư mục component cũ.
* **Success Criteria:** Toàn bộ API của feature gọi thông qua `features/*/api`, không còn dùng chung `services/api.ts`.

### Phase 6 & 7: Cleanup
* **Mục tiêu:** Cắt đuôi tech debt. Dọn sạch rác.
* **Files Affected:** `services/api.ts` (xoá bỏ), `components/` (dọn dẹp).
* **Migration Steps:** Đảm bảo không còn bất kỳ file nào import `services/api.ts`. Xóa file. Đưa các component UI thuần túy vào `components/ui/`.
* **Success Criteria:** Workspace sạch sẽ theo đúng Target Architecture.

---

## 4. Auth Migration Strategy (CRITICAL)
Auth là tử huyệt của ứng dụng. Cần tuân thủ chiến lược sau:

* **Remove Duplicate Sources:** Không dùng Context `user` và React Query `['currentUserProfile']` cùng lúc. Sẽ chuyển AuthProvider sang wrap một `useQuery` để đảm bảo Single Source of Truth.
* **Remove Race Conditions:** Việc gọi `router.push('/dashboard')` bên trong `login` function hoặc qua một chuỗi `useEffect` rối rắm phải được refactor thành luồng định hướng đơn giản hơn, ưu tiên Server-side redirection/middleware nếu có thể, hoặc bọc `isMounted` hook.
* **Token Lifecycle:** Quản lý token thông qua một utility tách biệt `lib/auth.ts` (ví dụ `getToken()`, `setToken()`), không ghi trực tiếp `localStorage.setItem` lộn xộn trong các file.
* **Route Protection:** Cân nhắc tạo một `<ProtectedRoute>` wrapper thay vì gắn logic điều hướng vào trong core `AuthProvider`.

---

## 5. API Layer Migration Strategy
Tuyệt đối không xóa bỏ `services/api.ts` ngay lập tức. Chúng ta dùng chiến lược **Strangler Fig Pattern**:

* Tạo `lib/apiClient.ts`.
* Khi migrate Feature A, tạo `features/A/api/client.ts` sử dụng `lib/apiClient.ts`. Xóa các hàm liên quan đến Feature A trong `services/api.ts`.
* Feature B (chưa migrate) vẫn tiếp tục dùng `services/api.ts` bình thường.
* Lặp lại đến khi `services/api.ts` rỗng hoàn toàn, lúc đó mới xóa bỏ.
* **Rollback:** Bất cứ lúc nào bị lỗi mạng, chỉ cần khôi phục hàm của Feature đó vào lại `services/api.ts`.

---

## 6. Feature Migration Strategy
* Migrate từng Feature một. Từng luồng một. Không gom "Big-bang".
* **Thứ tự khuyến nghị:** `Users/Profile` (vì ít dependency) -> `Documents/Upload` (nhiều dependency, độ phức tạp trung bình) -> `Search/Dashboard` (phức tạp nhất vì yêu cầu ghép nối dữ liệu).
* **Component Extraction:** Nếu một màn hình có logic phức tạp (như `DocumentDetailDrawer`), phải bóc tách API logic thành custom hooks (vd: `useDocumentVerify()`), để lại UI là các presentation components trong thư mục của feature. Tránh tạo các Giant PRs chứa cả ngàn dòng code.

---

## 7. Verification Strategy
Sau mỗi Phase hoặc mỗi Feature Migration, phải thực hiện kiểm chứng:

* **Build & Type Checking:** Phải pass lệnh `npm run build` và `tsc --noEmit`. Không được để lọt `any` hoặc Type Error mới.
* **Auth Flow Testing:** Thử F5 trang, thử logout, thử login sai pass. Đảm bảo luồng chạy trơn tru.
* **Route Testing:** Thử truy cập trang bảo mật khi chưa login (phải bị đẩy về `/login`).
* **Regression Testing:** Chắc chắn tính năng không bị migrate chưa bị gãy do ảnh hưởng dây chuyền.

---

## 8. AI-Agent Execution Rules (QUAN TRỌNG)
Các AI Agent tham gia vào quá trình refactor phải tuyệt đối tuân thủ các quy định sinh tồn sau:

1. **One Feature at a Time:** AI chỉ được phép thao tác refactor một Feature (hoặc một Phase) trong một chu kỳ làm việc.
2. **Search Before Act:** Bắt buộc dùng lệnh `grep_search` hoặc `view_file` để tìm kiếm và nắm vững implementation cũ trước khi sinh ra code mới.
3. **No Redundant Inventions:** Không được phát minh ra các service hay tool mới nếu hệ thống đã có sẵn (Ví dụ không tạo custom fetcher nếu đã có axios instance).
4. **Preserve Runtime Behavior:** Sau khi refactor file, hành vi giao diện người dùng, flow API, thông báo thành công/thất bại phải Y HỆT như code cũ.
5. **Update Documentation:** Bất kỳ thay đổi cấu trúc nào mới mẻ phải được ghi nhận vào tài liệu kiến trúc.

---

## 9. Rollback & Recovery Strategy
* **Checkpoints:** Sau mỗi Phase thành công, tạo một Git Commit rõ ràng (VD: `chore: migrate users feature`).
* **Rollback Logic:** Nếu feature mới gây lỗi Production, sử dụng `git revert` hoặc trỏ import trong file `app/` về component/api cũ thay vì ráng fix bug trong tình trạng hoảng loạn.
* **Branching:** Mỗi phase hoặc feature migration nên nằm trên một branch riêng (`refactor/auth`, `refactor/docs-api`).

---

## 10. Final End-State Validation
Dự án được xem là Migration thành công khi:

1. **Clean Workspace:** Thư mục `services/api.ts` không còn tồn tại.
2. **Feature Sliced:** Toàn bộ business logic nằm gọn gàng trong `features/*`.
3. **Pure App Router:** Thư mục `app/` chỉ chứa logic định tuyến và inject Layout.
4. **Stable Auth:** Không còn chớp nháy UI, không còn fetch User trùng lặp 2 nơi. 
5. **Typesafe & Build:** Không có warning hay error trong quá trình `next build`.
