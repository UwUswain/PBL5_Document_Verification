# AI REFACTOR EXECUTION PROTOCOL
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** ACTIVE GOVERNANCE DOCUMENT
**Target Audience:** AI Agents & Senior Engineers

> **WARNING:** Tài liệu này là BỘ LUẬT VẬN HÀNH BẮT BUỘC (Operational Governance). Bất kỳ AI Agent nào tham gia vào quá trình refactor Frontend đều phải đọc, hiểu và tuân thủ tuyệt đối các nguyên tắc dưới đây.

---

## 1. Core Execution Philosophy
Mọi hành động refactor phải tuân thủ triết lý lõi:
* **Incremental Migration Only:** Refactor là một quá trình tịnh tiến. Không bao giờ được đập đi xây lại toàn bộ hệ thống cùng một lúc.
* **Preserve Runtime Behavior:** Hành vi của hệ thống (runtime semantics) phải hoàn toàn được giữ nguyên sau khi refactor. UI, trải nghiệm người dùng, thứ tự call API không được thay đổi trừ khi đó là mục tiêu rõ ràng của task.
* **Architecture Before Optimization:** Cấu trúc hệ thống phải đúng đắn trước. Không lạm dụng tối ưu hóa hiệu năng (performance optimization) nếu làm hỏng cấu trúc hoặc che khuất logic.
* **Stabilize Before Redesign:** Phải vá các lỗi hiện tại (đặc biệt là Auth) trước khi bóc tách chúng sang kiến trúc mới.
* **One Responsibility Per Refactor Step:** Mỗi bước refactor (hoặc mỗi PR) chỉ giải quyết đúng một nhiệm vụ duy nhất.

---

## 2. Refactor Scope Rules
Để giới hạn "Blast Radius" (bán kính sát thương khi có lỗi), AI Agent chịu sự ràng buộc nghiêm ngặt về phạm vi:

**AI CHỈ ĐƯỢC PHÉP:**
* Migrate **đúng 1 feature** tại một thời điểm.
* Chỉ chỉnh sửa các file thuộc phạm vi (scope) của objective được giao.
* Tránh tuyệt đối việc đụng chạm đến các modules/files không liên quan (unrelated changes).

**AI BỊ CẤM:**
* Thực hiện **Giant Rewrites** (viết lại hàng chục file cùng lúc).
* Âm thầm thay đổi cấu trúc nền tảng (Hidden architecture redesign) ngoài phạm vi task.
* Refactor đồng thời cả Auth + UI + Routing trong cùng một lượt.

---

## 3. File Modification Rules
Mức độ giám sát thay đổi theo mức độ nhạy cảm của file:

* **Extreme Caution Files (BẮT BUỘC BACKUP / HUMAN REVIEW):**
  * `src/providers/AuthProvider.tsx`: Tử huyệt của hệ thống bảo mật và định tuyến.
  * `src/services/api.ts`: Mạch máu của toàn hệ thống hiện tại.
  * `src/app/layout.tsx` & `src/app/(dashboard)/layout.tsx`: Shell của ứng dụng.
* **Quy định sửa đổi:**
  * Không bao giờ được xóa code ngay lập tức. Phải comment-out hoặc tạo file mới và redirect import.
  * Khi sửa các file Extreme Caution, phải đảm bảo không phá vỡ logic phụ thuộc của các feature chưa được migrate.

---

## 4. Runtime Safety Rules
An toàn khi chạy (Runtime Safety) là ưu tiên số một.

**AI PHẢI BẢO TOÀN:**
* **Login Flow:** Quá trình đăng nhập, lưu token và redirect phải mượt mà.
* **Route Behavior:** Trạng thái bảo mật của route (chặn chưa đăng nhập, đá về dashboard nếu đã đăng nhập) phải nguyên vẹn.
* **Query Behavior:** Cache của React Query không được bị stale hoặc duplicate bất thường.
* **API Contracts:** Dữ liệu gửi đi (Payload) và nhận về (Response) từ Backend không được thay đổi.

**AI BỊ CẤM:**
* Âm thầm thay đổi Runtime Semantics (VD: chuyển từ SSR sang CSR không báo trước).
* Vô ý làm thay đổi vòng đời của Auth (Auth lifecycle).
* Tự ý thêm logic Redirect mới mà không có trong tài liệu thiết kế.

---

## 5. Incremental Migration Rules
Cơ chế chuyển đổi an toàn theo nguyên lý **Strangler Fig Pattern**:

1. **Extract Before Replace:** Bóc tách logic cũ ra thành file/module mới trước. Chạy thử song song. Khi thành công mới tiến hành tráo đổi (Replace) ở nơi gọi.
2. **Adapter Before Removal:** Khi đổi từ `services/api.ts` sang `lib/apiClient.ts`, phải giữ lại API cũ hoặc dùng Adapter pattern làm cầu nối tạm thời. Không được xoá API cũ khi vẫn còn component đang dùng nó.
3. **Deprecate Before Delete:** Gắn tag `@deprecated` vào code/hàm cũ. Đảm bảo toàn bộ project không còn tham chiếu mới được phép Delete file.

---

## 6. Verification Protocol
Sau MỖI BƯỚC migration, AI Agent phải hướng dẫn người dùng chạy, hoặc (nếu có công cụ) tự kiểm chứng Checklist sau:

* [ ] `npm run build` thành công.
* [ ] `npx tsc --noEmit` vượt qua kiểm tra kiểu (Type check) 100%.
* [ ] **Login Test:** Thử đăng nhập, đảm bảo token lưu đúng chỗ và redirect chính xác.
* [ ] **Protected Route Test:** Truy cập URL trực tiếp vào `/dashboard` ẩn danh, đảm bảo bị đá về `/login` không có lỗi nháy màn hình (Hydration flash).
* [ ] **Query Test:** Kiểm tra React Query Devtools không báo fetch trùng lặp.
* [ ] **Regression Checklist:** Các tính năng cũ chưa đụng tới vẫn hoạt động bình thường.

---

## 7. AI Change Constraints
Giới hạn sự sáng tạo của AI để đảm bảo tính nhất quán của hệ thống.

**AI KHÔNG ĐƯỢC PHÉP:**
* Tự phát minh ra một kiến trúc mới ngoài `target-frontend-architecture.md`.
* Tạo ra các hệ thống trùng lặp (Duplicate systems - VD: tạo thêm Redux khi đã có React Query + Context).
* Tạo luồng Auth song song (Parallel auth flow).
* Phớt lờ các nguyên tắc đã ghi trong `AGENTS.md`.

**AI PHẢI:**
* **Search First:** Luôn dùng `grep_search` hoặc `view_file` để tìm cách hệ thống đang giải quyết bài toán tương tự trước khi tự viết code.
* **Extend Existing Structure:** Mở rộng trên nền tảng sẵn có thay vì đập đi làm lại.
* **Preserve Source of Truth:** Tuân thủ một nguồn sự thật duy nhất (Single Source of Truth) cho mỗi domain data.

---

## 8. Commit & Branching Recommendations
Giao thức quản lý phiên bản cho quá trình refactor:
* **Feature Branch Naming:** `refactor/<feature-name>` (VD: `refactor/auth-provider`).
* **Migration Commit Naming:** Cú pháp rõ ràng, ví dụ: `refactor(auth): extract login logic to useAuth hook`.
* **Atomic Commits:** Mỗi commit chứa một thay đổi trọn vẹn, không gom chung nhiều module không liên quan.
* **Rollback Checkpoints:** Push code lên git sau mỗi Phase thành công để làm mốc khôi phục.

---

## 9. Dangerous Operations List
Các thao tác bị liệt vào hàng nguy hiểm cấp độ đỏ (Red-level Danger):

* **Dangerous Refactors:** Thay đổi cách hoạt động của React Query Provider (staleTime, retry).
* **Dangerous Files:** Sửa đổi `api.ts` interceptors hoặc `AuthProvider` `useEffect`.
* **Dangerous Timing Changes:** Chuyển đổi logic redirect từ trong Component Render sang `useEffect` (dễ gây hydration error).
* **Required Precautions:** Bắt buộc phải có Rollback Strategy rõ ràng trước khi thực hiện các tác vụ này.

---

## 10. Human Review Checkpoints
AI phải DỪNG và YÊU CẦU DUYỆT (Human Review) trong các trường hợp:

* **Phát hiện xung đột kiến trúc:** Khi thực tế code quá phức tạp so với tài liệu.
* **Chạm vào Extreme Caution Files:** Khi chuẩn bị ghi đè lên `AuthProvider.tsx` hoặc thay đổi cấu hình gốc.
* **Lỗi Build / Type Không Rõ Ràng:** Không được lạm dụng `@ts-ignore` hoặc `any` để vượt rào, phải hỏi ý kiến con người.

---

## 11. Final Safety Principles

Hệ tư tưởng cuối cùng cho mọi AI Agent thao tác trong dự án này:

> **STABILITY > SPEED** (Ổn định quan trọng hơn Tốc độ)
> **CONSISTENCY > CLEVERNESS** (Nhất quán quan trọng hơn Sự thông minh/Code ảo diệu)
> **INCREMENTAL > REWRITE** (Chuyển đổi tịnh tiến thay vì đập đi xây mới)
> **GOVERNANCE > IMPROVISATION** (Tuân thủ luật lệ quan trọng hơn Tùy cơ ứng biến)
