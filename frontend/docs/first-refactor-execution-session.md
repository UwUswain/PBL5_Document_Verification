# FIRST AI REFACTOR EXECUTION SESSION
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** MASTER BOOTSTRAP SESSION
**Purpose:** Architecture Synchronization & Refactor Initialization

---

## 1. Session Mission
Đây **KHÔNG PHẢI** là một phiên làm việc ưu tiên viết code. 
Sứ mệnh của phiên này là **Đồng bộ hóa Kiến trúc (Architecture Synchronization)**. AI Agent phải hiểu sâu sắc trạng thái hiện tại của dự án trước khi thực hiện bất kỳ thay đổi nào. Việc hiểu rõ rủi ro và nợ kỹ thuật là điều kiện tiên quyết (mandatory) để bắt đầu quá trình refactor.

---

## 2. Mandatory Reading Order
AI Agent **BẮT BUỘC** phải đọc các tài liệu sau theo đúng thứ tự, không được bỏ qua:

1.  `docs/governance-index.md` (Bản đồ quản trị)
2.  `AGENTS.md` (Luật thi hành cho AI)
3.  `docs/frontend-migration-status.md` (Trạng thái hiện tại)
4.  `docs/auth-architecture-spec.md` (Quy chuẩn xác thực)
5.  `docs/server-state-governance.md` (Quản trị dữ liệu)
6.  `docs/frontend-engineering-conventions.md` (Quy chuẩn đặt tên)
7.  `docs/deprecation-cleanup-governance.md` (Quy tắc dọn dẹp)
8.  `docs/frontend-migration-plan.md` (Lộ trình tổng thể)

---

## 3. Architecture Audit Requirements
Sau khi đọc tài liệu, AI phải thực hiện Audit thực tế trên codebase:
* **Folder Structure:** Cấu trúc hiện tại so với Target Architecture.
* **Auth Lifecycle:** Cách thức token được lưu, check quyền và redirect.
* **Providers:** Các tầng bọc (wrappers) đang tồn tại.
* **API Ownership:** Những file nào đang nắm giữ logic gọi API.
* **React Query:** Cách thức sử dụng cache và query keys hiện tại.
* **Routing:** Cấu trúc của App Router và các layouts.

---

## 4. Runtime Stability Audit
AI phải xác định các rủi ro có thể gây "vỡ" ứng dụng khi chạy:
* **Auth Instability:** Các race condition trong việc lấy thông tin user.
* **Hydration Risks:** Các lỗi gây chớp nháy hoặc sai lệch layout khi load trang.
* **Redirect Loops:** Nguy cơ bị đẩy vòng quanh các trang login/dashboard.
* **Duplicated Fetching:** Các API bị gọi thừa thãi gây tốn tài nguyên.

---

## 5. Migration Readiness Analysis
Đánh giá mức độ sẵn sàng cho việc di dời:
* **Safest First Migration:** Tính năng nào đơn giản và an toàn nhất để bắt đầu?
* **Highest-Risk Systems:** Vùng nào "đụng vào là gãy" cần cực kỳ cẩn trọng?
* **Unstable Areas:** Các phần kiến trúc đang bị chồng chéo.
* **Compatibility Layers:** Cần những lớp đệm nào để code cũ và mới chạy song song?

---

## 6. Governance Compliance Verification
Kiểm tra mức độ tuân thủ quy chuẩn hiện tại:
* Tên file/folder đã nhất quán chưa?
* Cách đặt tên Query Keys đã theo chuẩn chưa?
* Ranh giới các Feature có đang bị xâm phạm không?

---

## 7. Technical Debt Assessment
Xác định nợ kỹ thuật thực tế:
* Các component nào đang quá lớn (Giant components)?
* Logic nào đang bị lặp lại ở nhiều nơi?
* Code "chết" (Dead code) không còn sử dụng.
* Các trang (Pages) đang chứa quá nhiều business logic.

---

## 8. Safe First Migration Proposal
Sau khi Audit, AI phải đề xuất bước đi đầu tiên:
* **Scope:** Phạm vi di dời cực kỳ nhỏ (Minimal scope).
* **Files:** Danh sách các file sẽ bị ảnh hưởng.
* **Risks:** Các rủi ro dự kiến.
* **Rollback:** Phương án quay lui nếu gặp sự cố.
* **Verification:** Cách kiểm chứng kết quả.

---

## 9. Forbidden Actions During First Session
Trong phiên làm việc đầu tiên này, AI Agent **TUYỆT ĐỐI KHÔNG ĐƯỢC**:
* Viết lại mã nguồn trên diện rộng (Broad rewrite).
* Thay đổi kiến trúc gốc khi chưa có sự đồng ý.
* Dọn dẹp code cũ một cách hung hãn.
* Di chuyển các folder lớn mà không có kế hoạch audit.
* Xóa bỏ bất kỳ hệ thống đang vận hành nào.

---

## 10. Expected Final Output
Kết quả đầu ra bắt buộc của phiên này là một báo cáo bao gồm:
1.  **Architecture Audit Report:** Bản báo cáo chi tiết về thực trạng codebase.
2.  **Risk Assessment:** Đánh giá các rủi ro kỹ thuật.
3.  **Migration Readiness:** Phân tích mức độ sẵn sàng.
4.  **Proposed First Migration:** Đề xuất bước refactor đầu tiên.
5.  **Verification Strategy:** Chiến lược kiểm chứng.

---

## 11. Recommended Execution Philosophy
* **Incremental Migration:** Đi từng bước nhỏ.
* **Runtime Preservation:** Bảo toàn sự ổn định khi ứng dụng đang chạy.
* **Governance-First:** Tuân thủ luật trước, code sau.
* **Rollback-Aware:** Luôn có đường lui.

---

## 12. Success Criteria
Phiên làm việc này được coi là thành công khi:
* AI hiểu 100% thực trạng dự án qua lăng kính quản trị.
* Các rủi ro tiềm ẩn được xác định rõ ràng.
* Thứ tự ưu tiên di dời được xác lập.
* Không có code "ẩu" nào được thực thi.
* Xác định được bước đi an toàn tiếp theo.

---
**Khởi đầu đúng đắn là chìa khóa của một quá trình di dời thành công.**
