# DEFINITION OF DONE
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL COMPLETION FRAMEWORK
**Purpose:** Preventing Overengineering & Ensuring Predictable Delivery

---

## 1. Core Completion Philosophy
* **Stable > Perfect:** Sự ổn định quan trọng hơn sự hoàn hảo. Một mã nguồn chạy tốt và ổn định có giá trị hơn một kiến trúc hoàn mỹ nhưng chưa được kiểm chứng.
* **Runtime Preservation Over Architectural Perfection:** Ưu tiên bảo toàn hành vi ứng dụng khi chạy hơn là theo đuổi sự thuần khiết về kiến trúc.
* **Predictable Delivery Matters:** Quá trình di dời phải có điểm kết thúc rõ ràng để đảm bảo tiến độ dự án.
* **“Good enough and stable” is valid engineering:** "Đủ tốt và ổn định" là một tiêu chuẩn kỹ thuật hoàn toàn hợp lệ.

---

## 2. Official Definition of Done
Một cuộc di dời (Migration) được coi là **DONE** khi:
* ✅ **Runtime stable:** Ứng dụng hoạt động bình thường, không crash.
* ✅ **Auth stable:** Luồng xác thực không bị ảnh hưởng.
* ✅ **Routes stable:** Định tuyến hoạt động chính xác.
* ✅ **Queries stable:** Dữ liệu được tải và hiển thị đúng.
* ✅ **Architecture improved measurably:** Cấu trúc mã nguồn đã được cải thiện theo hướng Feature-based.
* ✅ **Rollback no longer necessary:** Sau một thời gian kiểm chứng, không cần thiết phải quay lại code cũ.

**KHÔNG YÊU CẦU:** Phải dọn dẹp sạch sẽ 100% nợ kỹ thuật hoặc đạt đến sự hoàn mỹ tuyệt đối về code.

---

## 3. Task-Level Completion Criteria
Mỗi nhiệm vụ nhỏ (Task) hoàn thành khi:
* Hoàn tất phạm vi (Scope) đã được phê duyệt.
* Bảo toàn được hành vi Runtime.
* Vượt qua các bài kiểm tra xác minh (Verification).
* Giữ được khả năng Rollback an toàn.

**KHÔNG ĐƯỢC:** Tự ý mở rộng phạm vi (Scope creep) hoặc thực hiện các thay đổi không liên quan.

---

## 4. Feature-Level Completion Criteria
Một tính năng (Feature) được coi là đã di dời thành công khi:
* Tệp trang (`page.tsx`) đã đủ mỏng.
* Quyền sở hữu API được chuẩn hóa (`apiClient`).
* Các logic dữ liệu được bóc tách vào hooks.
* Components được chia nhỏ một cách hợp lý.
* Ranh giới tính năng (Feature boundaries) được tôn trọng.

---

## 5. Runtime Stability Requirements
Chỉ đánh dấu là STABLE khi:
* Không có lỗi thụt lùi về Auth (Auth regressions).
* Không có lỗi vỡ định tuyến (Route breakage).
* Không phát sinh các request API trùng lặp.
* Không có lỗi Hydration nghiêm trọng.
* Không có các lỗi đỏ (Critical errors) trong Console.

---

## 6. Acceptable Technical Debt
Chúng ta chấp nhận sự tồn tại tạm thời của:
* Các lớp tương thích (Adapters/Wrappers) tạm thời.
* Một chút sự lặp lại mã nguồn trong giai đoạn quá độ.
* Các ghi chú TODO không quan trọng.

**KHÔNG CHẤP NHẬN:** Sự mất ổn định của Auth, lỗi Runtime ẩn giấu, hoặc mâu thuẫn trực tiếp với kiến trúc lõi.

---

## 7. Cleanup Stop Rules
Việc dọn dẹp code cũ phải dừng lại khi:
* Bắt đầu gây rủi ro cho tính ổn định Runtime.
* Vượt quá phạm vi task đã được phê duyệt.
* Đã đạt được các mục tiêu di dời chính.

---

## 8. Anti-Overengineering Rules
* **KHÔNG** thiết kế lại toàn bộ hệ thống nếu không cần thiết.
* **KHÔNG** viết lại các components đang hoạt động ổn định một cách vô ích.
* **KHÔNG** theo đuổi sự thuần khiết kiến trúc một cách cực đoan (Endless polishing).

---

## 9. AI-Agent Stop Conditions
AI Agent phải dừng lại khi:
* Đã hoàn thành task được giao.
* Đã xác minh runtime ổn định.
* Đã đạt được các mục tiêu di dời đã đề ra.

**AI Agent KHÔNG ĐƯỢC:** Tự ý dọn dẹp thêm, tự ý sáng tạo các cuộc di dời mới, hoặc âm thầm mở rộng phạm vi task.

---

## 10. Rollback Completion Rules
Các phương án quay lui (Rollback) chỉ được gỡ bỏ khi:
* Quá trình di dời được chứng minh là ổn định qua thời gian.
* Đã vượt qua mọi bài kiểm tra so sánh Baseline.
* Không phát hiện bất kỳ lỗi thụt lùi nghiêm trọng nào.

---

## 11. Governance Completion Verification
Xác minh mức độ tuân thủ:
* Ranh giới feature được tôn trọng?
* Quy tắc import được tuân thủ?
* Quyền sở hữu (Ownership) đã được chuẩn hóa?

---

## 12. Post-Migration Review Requirements
Sau mỗi lần di dời Feature:
* Ghi lại các nợ kỹ thuật còn sót lại.
* Đề xuất các cải tiến trong tương lai.
* Tài liệu hóa các rủi ro chưa được giải quyết triệt để.

---

## 13. Recommended “Good Enough” Criteria
Tiêu chuẩn "Đủ tốt" để về đích:
* Trang mỏng (Thin page).
* Hooks ổn định.
* Queries được kiểm soát.
* Quyền sở hữu rõ ràng.
* Runtime hoạt động tốt.

---

## 14. Failure Patterns
Dấu hiệu của việc di dời không thành công:
* Dọn dẹp code không có điểm dừng (Endless cleanup).
* Tối ưu hóa vi mô quá mức.
* Chia nhỏ component vô hạn.
* Quá trình di dời kéo dài không rõ ngày kết thúc.

---

## 15. Long-Term Evolution Philosophy
Kiến trúc sẽ tiến hóa dần dần. Việc di dời lần này là để tạo ra một nền tảng ổn định, cho phép các lần refactor trong tương lai diễn ra an toàn và dễ dàng hơn.

---

## 16. Success Criteria
Hệ thống DoD được coi là lành mạnh khi:
* ✅ Các cuộc di dời kết thúc một cách dự đoán được.
* ✅ Sự ổn định runtime được bảo toàn.
* ✅ Phạm vi task luôn nằm trong tầm kiểm soát.
* ✅ Sự tự tin của đội ngũ kỹ thuật tăng lên sau mỗi lần "Done".

---
**Hoàn thành đúng hạn và ổn định là đỉnh cao của sự chuyên nghiệp.**
