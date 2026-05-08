# MIGRATION COMMAND CENTER
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL OPERATIONS HUB
**Purpose:** Centralized Migration Tracking & Execution Control

---

## 1. Core Command-Center Philosophy
Quá trình di dời mà không có sự giám sát tập trung sẽ dẫn đến sự hỗn loạn:
* **Migration Visibility:** Mọi bước di dời phải được hiển thị công khai và minh bạch.
* **Runtime Stability Tracking:** Việc theo dõi sự ổn định của ứng dụng khi chạy là bắt buộc.
* **Measurable Progress:** Tiến độ di dời phải có thể đo lường được bằng các con số/trạng thái cụ thể.
* **Governance Compliance:** Phải quan sát được mức độ tuân thủ quy chuẩn trong từng lần sửa code.
* **Rollback Readiness:** Trạng thái sẵn sàng quay lui phải luôn ở mức cao nhất.

---

## 2. Official Migration Status Model
Sử dụng các trạng thái chuẩn sau để theo dõi Feature/Task:
* **PLANNED:** Đã có kế hoạch, chưa bắt đầu.
* **READY:** Đã audit, hạ tầng đã sẵn sàng để thực thi.
* **IN_PROGRESS:** Đang thực hiện thay đổi mã nguồn.
* **VERIFYING:** Đang kiểm chứng runtime và so sánh baseline.
* **STABLE:** Đã hoàn thành, đã kiểm chứng và hoạt động ổn định.
* **BLOCKED:** Đang gặp lỗi hoặc phụ thuộc chưa được giải quyết.
* **ROLLED_BACK:** Gặp sự cố và đã phải hoàn tác.

---

## 3. Feature Migration Tracking
Theo dõi trạng thái ở cấp độ tính năng lớn:
* **Documents / Repository:** [Status] | Risk: High | Rollback: Ready.
* **Dashboard:** [Status] | Risk: Medium | Rollback: Ready.
* **Users:** [Status] | Risk: Medium | Rollback: Ready.
* **Search:** [Status] | Risk: Low | Rollback: Ready.
* **Profile:** [Status] | Risk: Medium | Rollback: Ready.
* **Auth Stabilization:** [Status] | Risk: Critical | Rollback: Manual.

---

## 4. Task-Level Execution Tracking
Mỗi nhiệm vụ vi di chuyển (Micro-task) phải được ghi nhật ký:
* **Owner:** [AI Agent / Human]
* **Scope:** [Mô tả ngắn]
* **Affected Files:** [Danh sách file]
* **Verification Status:** [Kết quả verify]
* **Rollback Status:** [Khả năng hoàn tác]

**Ví dụ:** `TASK-04 — Extract DocumentTable` | Status: STABLE.

---

## 5. Runtime Stability Monitoring
Hệ thống giám sát các chỉ số "sức khỏe" runtime:
* **Auth:** Không có lỗi 401 giả, không có redirect loop.
* **Route:** Tốc độ chuyển trang ổn định.
* **Query:** Cache hit-rate cao, không gọi trùng request.
* **Hydration:** Không có lỗi "mismatch" trong Console.
* **Console Warnings:** Số lượng cảnh báo không tăng thêm.

---

## 6. Rollback Readiness Tracking
Mọi Migration phải báo cáo trạng thái sẵn sàng quay lui:
* Có bản sao lưu (Git commit) trước khi sửa không?
* Các lớp tương thích (Compatibility layers) có đang hoạt động không?
* Có bất kỳ "điểm không thể quay đầu" (points of no return) nào không?

---

## 7. AI-Agent Coordination Rules
Quy tắc phối hợp giữa các AI Agent:
* **Declare active task:** AI phải thông báo đang làm task nào.
* **No Overlapping:** Cấm thực hiện nhiều cuộc di dời chồng chéo lên nhau.
* **No Concurrent Rewrites:** Không sửa hai feature có phụ thuộc lẫn nhau cùng lúc.
* **Verification Reporting:** Phải báo cáo kết quả kiểm chứng trước khi chuyển task.

---

## 8. Migration Risk Dashboard
Bảng hiển thị các "vùng đỏ" cần lưu ý:
* Các features rủi ro cao (Auth, Documents).
* Các hệ thống nhạy cảm với Hydration.
* Các modules có quá nhiều dependency (Dependency-heavy).
* Các vùng Provider toàn cục.

---

## 9. Governance Compliance Tracking
Giám sát sự tuân thủ:
* Ranh giới Feature có bị xâm phạm không?
* Quy tắc Import có bị lách không?
* Quy tắc đặt tên (Conventions) có được thực thi đúng không?

---

## 10. Baseline Comparison Tracking
Thực hiện so sánh "Trước và Sau" (Diffing):
* So sánh log Console.
* So sánh hành vi Routing.
* So sánh Network Tab (Số lượng request).

---

## 11. Verification Pipeline
Quy trình kiểm chứng tự động/thủ công:
1. **Implement:** Sửa code.
2. **Build:** Chạy lệnh build.
3. **Runtime Verify:** Chạy app thực tế.
4. **Baseline Compare:** So sánh với mốc chuẩn.
5. **Approve:** Phê duyệt hoàn thành.

---

## 12. Recommended Operational Files
Lưu trữ hồ sơ vận hành tại `docs/operations/`:
* `migration-status.md`: Bảng tiến độ tổng thể.
* `runtime-health.md`: Nhật ký sức khỏe ứng dụng.
* `rollback-log.md`: Ghi lại các lần phải hoàn tác và nguyên nhân.
* `active-risks.md`: Các rủi ro hiện hữu.

---

## 13. Incident Response Workflow
Khi phát hiện sự cố (Unstable):
1. **Freeze:** Tạm dừng mọi hoạt động di dời.
2. **Capture:** Ghi lại lỗi và hiện tượng.
3. **Compare:** Đối chiếu với Baseline để tìm nguyên nhân.
4. **Rollback:** Hoàn tác mã nguồn về trạng thái STABLE gần nhất.
5. **Document:** Ghi chép lại sự cố để rút kinh nghiệm.

---

## 14. Long-Term Governance Maintenance
Command Center không chỉ dùng cho migration, mà còn để:
* Theo dõi mức độ áp dụng Governance.
* Ngăn chặn sự suy thoái kiến trúc theo thời gian.
* Duy trì khả năng hiển thị vận hành (Operational Visibility).

---

## 15. Success Criteria
Hệ thống vận hành được coi là lành mạnh khi:
* ✅ Toàn bộ các cuộc di dời đang diễn ra đều hiển thị rõ ràng.
* ✅ Sức khỏe Runtime có thể đo lường được.
* ✅ Trạng thái Rollback luôn sẵn sàng 100%.
* ✅ AI Agent phối hợp nhịp nhàng, không gây xung đột.

---
**Giám sát chặt chẽ là chìa khóa của sự an toàn.**
