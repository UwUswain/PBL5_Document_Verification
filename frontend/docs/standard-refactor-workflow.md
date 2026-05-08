# STANDARD FRONTEND REFACTOR WORKFLOW
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** ACTIVE WORKFLOW DOCUMENT
**Purpose:** AI-Assisted Development & Safe Migration Workflow

> **WARNING:** Đây là tài liệu Hướng dẫn Quy trình Tiêu chuẩn (Standard Operating Procedure - SOP) dành cho mọi hoạt động refactor trên Frontend. Toàn bộ AI Agents và Kỹ sư phải tuân thủ luồng công việc này để tránh rủi ro vỡ hệ thống.

---

## 1. Core Workflow Philosophy
Mọi hành động can thiệp vào codebase đều phải thấm nhuần triết lý:
* **Think Before Refactor:** Phân tích kỹ hậu quả trước khi sửa code. Không bao giờ code theo bản năng.
* **Audit Before Modify:** Phải đọc, tìm hiểu (`view_file`, `grep_search`) code hiện hành trước khi đè code mới lên.
* **Verify Before Continue:** Không chuyển sang bước tiếp theo nếu bước hiện tại chưa pass mọi test/build.
* **Incremental Over Rewrite:** Ưu tiên bóc tách từng hàm, từng component thay vì xóa file cũ và viết lại từ đầu.
* **Preserve Runtime Stability:** Sự ổn định của app trên môi trường chạy thực (runtime) là ranh giới không được phép xâm phạm.

---

## 2. Standard Refactor Lifecycle
Vòng đời tiêu chuẩn của một tác vụ Refactor gồm 10 bước tuyến tính:

* **Step 1 → Read Governance Docs:** Đọc lại `ai-refactor-execution-protocol.md` và `target-frontend-architecture.md`.
* **Step 2 → Identify Migration Scope:** Giới hạn chính xác những file/logic sẽ thay đổi.
* **Step 3 → Audit Current Implementation:** Phân tích code cũ hoạt động như thế nào.
* **Step 4 → Identify Dependencies:** Ai đang gọi file này? File này gọi ai?
* **Step 5 → Design Migration Approach:** Xác định sẽ dùng Adapter, bóc tách dần (Extract), hay di dời hẳn (Move).
* **Step 6 → Refactor Minimal Scope:** Thực hiện sửa code trên phạm vi hẹp nhất có thể.
* **Step 7 → Verify Build/Runtime:** Chạy build, check type, test UI nhanh.
* **Step 8 → Regression Testing:** Kiểm tra xem các tính năng liên quan có bị chết lây không.
* **Step 9 → Cleanup:** Xóa các adapter thừa hoặc code cũ (sau khi đã verified).
* **Step 10 → Update Docs:** Cập nhật tài liệu kiến trúc nếu có sự thay đổi về cấu trúc thư mục/luồng dữ liệu.

---

## 3. Pre-Refactor Checklist
Bắt buộc AI phải check và nắm rõ các thông tin sau trước khi phát lệnh sửa code:

* [ ] **Source of Truth:** Đâu là nơi chứa state gốc của luồng dữ liệu này?
* [ ] **Auth Impact:** Thay đổi này có ảnh hưởng việc lưu token hay check quyền không?
* [ ] **Query Impact:** Có làm vô hiệu hóa (invalidate) sai cache của React Query không?
* [ ] **Route Impact:** Có đổi logic redirect hay phá vỡ cấu trúc Layout của App Router không?
* [ ] **Shared Dependencies:** Có component nào khác đang dùng chung hook/utility này không?

*Nguyên tắc cho AI:* Luôn search (`grep_search`) existing implementation trước. Tránh tạo lại bánh xe. Nắm rõ runtime flow hiện tại.

---

## 4. Scope Isolation Workflow
Quy trình giới hạn phạm vi rủi ro (Blast Radius).

* **Chỉ 1 Feature mỗi lần Migration:** Không migrate `Users` và `Documents` cùng một lúc.
* **Chỉ 1 Architectural Objective:** Đang sửa logic Auth thì không kết hợp sửa CSS UI của component.

**Ví dụ GOOD Scope:** "Tách logic fetch profile ra khỏi AuthProvider và đẩy vào `features/auth/api/`".
**Ví dụ BAD Scope:** "Tách fetch profile, sẵn tiện sửa luôn màu nút Login và đổi route của Dashboard".

---

## 5. Safe Refactor Workflow
Các bước thao tác an toàn trên code:

1. **Extract:** Bóc tách logic cần sửa ra một file/hàm mới, độc lập hoàn toàn với code cũ.
2. **Adapt:** Tạo một lớp kết nối (Adapter) tạm thời giữa code mới và hệ thống cũ để kiểm thử tích hợp.
3. **Verify:** Chạy hệ thống với lớp Adapter để đảm bảo logic mới hoạt động tốt.
4. **Deprecate:** Gắn tag `@deprecated` vào code cũ và comment cảnh báo. Đổi hướng các nơi đang trỏ vào code cũ sang code mới.
5. **Remove:** Khi 100% project đã trỏ về code mới, thực hiện xóa bỏ code cũ an toàn.

*Không Rewrite lập tức. Không Delete quá sớm. Không Move mọi thứ cùng một lúc.*

---

## 6. Verification Workflow
AI hoặc kỹ sư phải trigger chuỗi kiểm thử sau bất kỳ commit/migration nào:

1. `npm run build` (Next.js production build)
2. `npx tsc --noEmit` (Strict TypeScript Check)
3. **Auth Test:** Login/Logout flow có nguyên vẹn không?
4. **Protected Route Test:** Truy cập URL ẩn danh có bị redirect đúng không?
5. **Query Test:** Bật Network tab, đảm bảo không có duplicate API calls do React Query cấu hình sai.
6. **Hydration Test:** F5 trang không bị chớp màn hình (layout shift) do lỗi SSR/CSR.
7. **Route Navigation Test:** Chuyển trang qua lại mượt mà, layout không unmount sai cách.

*(Rollback Trigger: Nếu trượt bất kỳ test nào trong quá trình kiểm chứng, phải Rollback ngay lập tức lập tức).*

---

## 7. Auth-Sensitive Workflow
Đối với các file trọng yếu: `AuthProvider.tsx`, Route guards, Token helpers (`localStorage`), Login flow.

* **Extra Verification Required:** Cần test kỹ lưỡng với nhiều luồng: Token hết hạn, User role khác nhau, Hydration delay.
* **No Simultaneous UI Redesign:** Tuyệt đối không thay đổi giao diện (UI) trong lúc refactor luồng Auth.
* **Preserve Auth Semantics:** Hành vi redirect (`router.push`, `window.location`) phải giữ nguyên mục đích ban đầu.

---

## 8. API Migration Workflow
Sử dụng **Strangler Fig Pattern** để di dời API Layer.

**Sơ đồ chuyển dịch:**
`services/api.ts (Legacy)` → `lib/apiClient.ts (Core)` → `features/*/api/*Client.ts (Domain)`

* **Compatibility Layer Strategy:** Giữ nguyên `services/api.ts` cho đến khi tính năng cuối cùng được migrate. 
* **Temporary Adapters:** Nếu `features/A/api/client.ts` cần xài chung token logic với `services/api.ts`, đảm bảo cả hai gọi chung một utility lấy token thay vì duplicate code.
* **Phased Migration:** Migrate từng endpoint một thay vì cắt toàn bộ module API.

---

## 9. Documentation Update Workflow
Hệ thống tài liệu phải Sống (Live) cùng với Codebase. Sau mỗi Major Migration (xong 1 phase):

* Cập nhật lại sơ đồ `current-frontend-architecture.md` cho khớp hiện trạng.
* Gạch bỏ các mục đã hoàn thành trong `frontend-migration-plan.md`.
* Bổ sung luật vào `AGENTS.md` (hoặc các file doc khác) nếu phát hiện ra quy tắc mới.
* Document rõ ràng các file/hệ thống đã bị deprecated.

---

## 10. AI Collaboration Workflow
Quy tắc giao tiếp và báo cáo dành cho AI Agents:

* **AI Must Explain Reasoning:** AI phải giải thích "Vì sao lại chọn cách refactor này?" trước khi viết code.
* **AI Must Identify Risks:** Nêu rõ file nào có nguy cơ gãy cao nhất do sửa đổi này.
* **AI Must State Modified Files:** Liệt kê rõ các file sẽ chạm vào.
* **AI Must State Expected Runtime Impact:** Nêu rõ màn hình nào, luồng nào sẽ thay đổi hoặc giữ nguyên.

**Nghiêm cấm AI:** Âm thầm thay đổi cấu trúc, âm thầm đổi hành vi Auth, âm thầm đổi logic Routing.

---

## 11. Recovery Workflow
Khi quá trình migration làm gãy hệ thống (Break build/runtime):

1. **Stop & Freeze:** Ngừng ngay lập tức mọi hoạt động refactor.
2. **Revert Checkpoint:** Sử dụng git checkout/revert để quay về commit an toàn gần nhất. Không cố fix bug đè lên bug.
3. **Recovery Sequence:** Khôi phục lại import, bỏ qua code mới, dùng lại code cũ.
4. **Stabilize Procedure:** Đảm bảo hệ thống build pass. Sau đó mới ngồi phân tích lại nguyên nhân thất bại và design lại Migration Approach (Step 5).

---

## 12. Final Workflow Principles
Cốt lõi của Workflow này xoay quanh 5 nguyên tắc:

1. **Small Safe Steps:** Đi những bước nhỏ và an toàn.
2. **Architecture Consistency:** Giữ tính nhất quán của kiến trúc theo Target Architecture.
3. **Runtime Stability:** Chạy ứng dụng thực tế quan trọng hơn code đẹp.
4. **Governance-First Engineering:** Quản trị làm đầu, lập trình theo sau. Mọi thứ phải có luật.
5. **Predictable Migration Process:** Mọi bước chuyển đổi phải dễ đoán, có kế hoạch rõ ràng và dễ dàng hoàn tác.
