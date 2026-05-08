# MIGRATION READINESS REVIEW
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** FINAL REFACTOR CHECKPOINT
**Purpose:** GO / NO-GO Migration Audit & Readiness Verification

---

## 1. Core Review Philosophy
* **Readiness Before Execution:** Không bắt đầu di dời khi chưa sẵn sàng về mặt hạ tầng và quy chuẩn.
* **Verify Before Migration:** Mọi giả định về kiến trúc phải được kiểm chứng thực tế trên codebase.
* **Architecture Consistency Over Speed:** Sự nhất quán của kiến trúc quan trọng hơn tốc độ hoàn thành.
* **Governance Adoption Must Be Real:** Các tài liệu quản trị phải được áp dụng thực tế, không chỉ là lý thuyết trên giấy.
* **Migration Safety First:** An toàn hệ thống là ưu tiên cao nhất.

---

## 2. Governance Consistency Audit
Kiểm tra tính nhất quán của hệ thống quản trị:
* [ ] `governance-index.md` đã đầy đủ và bao quát toàn bộ docs chưa?
* [ ] `AGENTS.md` có đồng bộ với các quy tắc thực thi mới nhất không?
* [ ] Các tài liệu Migration Phase có mâu thuẫn lẫn nhau không?
* [ ] Quyền sở hữu kiến trúc (Architecture Ownership) đã được định nghĩa rõ ràng chưa?
* [ ] Quy chuẩn đặt tên đã được thống nhất 100% chưa?

---

## 3. Runtime Stability Audit
Kiểm tra sự ổn định của ứng dụng hiện tại (Baseline):
* **Auth Runtime:** Đăng nhập/Đăng xuất có lỗi không?
* **Hydration:** Có lỗi "Hydration failed" nào trong Console không?
* **Route Stability:** Chuyển trang có bị treo hoặc loop không?
* **Query Stability:** Dữ liệu có hiện lên đúng lúc không?
* **Unauthorized Handling:** Lỗi 401 có gây crash app không?

---

## 4. Dependency Graph Audit
AI Agent phải quét codebase để phát hiện:
* **Circular Dependencies:** Các vòng lặp import chết người.
* **Hidden Imports:** Các file import từ những nơi không được phép.
* **Feature Coupling:** Hai tính năng đang dính chặt lấy nhau qua logic chung.
* **Shared-layer Violations:** Tầng dùng chung đang import ngược từ Feature.

---

## 5. Feature Readiness Audit
Đánh giá mức độ sẵn sàng của từng tính năng:
* **Difficulty:** Độ khó của việc bóc tách (Thấp/Trung bình/Cao).
* **Sensitivity:** Mức độ ảnh hưởng đến runtime (Cao: Auth, Dashboard).
* **Complexity:** Độ phức tạp của UI và Logic dữ liệu.

---

## 6. Migration Scope Validation
Xác nhận phạm vi di dời:
* [ ] Phạm vi di dời có đủ nhỏ để kiểm soát (Manageable blast radius) không?
* [ ] Có khả năng thực hiện Rollback nhanh chóng nếu lỗi không?
* [ ] Quá trình di dời có thể thực hiện theo kiểu "Strangler Fig" (từng phần) không?

**CẤM:** Kế hoạch di dời toàn bộ ứng dụng trong một lượt (Giant-bang).

---

## 7. Auth Criticality Review
Audit đặc biệt cho hệ thống xác thực:
* [ ] Ai đang sở hữu Token logic?
* [ ] Các Route Guards hoạt động dựa trên cơ chế nào?
* [ ] Luồng Redirect khi hết hạn token có ổn định không?
* [ ] **Rủi ro hiện tại:** Liệt kê các nguy cơ lớn nhất liên quan đến Auth.

---

## 8. Foundation Layer Verification
Kiểm tra tầng nền tảng:
* [ ] `apiClient` đã sẵn sàng thay thế cho axios trực tiếp chưa?
* [ ] Nhà máy `queryKeys` đã có đủ các keys cơ bản chưa?
* [ ] Các types và constants dùng chung đã được gom nhóm chưa?

---

## 9. AI-Agent Readiness Review
Kiểm tra khả năng thực thi của AI:
* [ ] Các Prompt Templates trong Command Library có hoạt động tốt không?
* [ ] Quy trình Rollback và Verification có đủ rõ ràng cho AI không?
* [ ] AI có bị giới hạn bởi các Constraints (Ràng buộc) an toàn không?

---

## 10. Technical Debt Assessment
Báo cáo nợ kỹ thuật hiện tại:
* Liệt kê các "Giant Components" (> 1000 dòng).
* Liệt kê các "Overloaded Pages".
* Liệt kê các code chết/logic trùng lặp cần xóa bỏ.

---

## 11. Recommended First Real Migration
Đề xuất bước di dời thực tế đầu tiên:
* **Feature:** [Tên Feature].
* **Affected Files:** Danh sách file dự kiến.
* **Risks:** Rủi ro cụ thể.
* **Rollback Plan:** Cách quay lại trạng thái cũ.
* **Verification:** Các kịch bản test runtime.

---

## 12. GO / NO-GO Decision Rules
* **QUYẾT ĐỊNH GO KHI:**
  * Runtime hiện tại ổn định.
  * Hệ thống quản trị nhất quán và được AI nắm rõ.
  * Phạm vi di dời thực tế và an toàn.
  * Có phương án Rollback khả thi.
* **QUYẾT ĐỊNH NO-GO KHI:**
  * Auth đang cực kỳ thiếu ổn định (Crash/Loops).
  * Tài liệu quản trị có mâu thuẫn lớn.
  * Dependency graph quá rối loạn không thể bóc tách.
  * Thiếu chiến lược Rollback.

---

## 13. Required Pre-Migration Fixes
Danh sách các "Blockers" phải sửa TRƯỚC KHI bắt đầu di dời:
* [ ] Fix lỗi [Tên lỗi].
* [ ] Cleanup [Tên module rác].
* [ ] Ổn định luồng [Tên luồng].

---

## 14. Success Criteria
Dự án được coi là **READY FOR REAL REFACTOR EXECUTION** khi:
* ✅ Hệ thống Quản trị được áp dụng (Adopted).
* ✅ Runtime Baseline ổn định.
* ✅ Luồng Auth ở trạng thái có thể kiểm soát.
* ✅ Phạm vi di dời (Scopes) được giới hạn chặt chẽ.
* ✅ Các ràng buộc dành cho AI (Constraints) đang hoạt động.

---

## 15. Final Execution Recommendation
Báo cáo cuối cùng:
* **GO / NO-GO Decision:** [Quyết định]
* **Confidence Level:** [0 - 100%]
* **Safest Migration Order:** [Thứ tự đề xuất]
* **Highest-risk Systems:** [Các vùng nguy hiểm]
* **Mandatory Monitoring Areas:** [Các vùng cần giám sát chặt]

---
**Chỉ khi vượt qua bài kiểm tra cuối cùng này, chúng ta mới thực sự chạm vào mã nguồn.**
