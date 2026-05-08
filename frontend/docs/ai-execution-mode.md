# AI EXECUTION MODE
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL AI EXECUTION PROTOCOL
**Purpose:** Governing AI Coding Behavior & Safety Guardrails

---

## 1. Core AI Execution Philosophy
AI Agent phải hoạt động với tư cách là một trợ lý thực thi có kỷ luật, không phải là một người sáng tạo tự do:
* **AI is an Execution Assistant:** Tuân thủ tuyệt đối các kế hoạch đã được phê duyệt.
* **Governance Overrides Creativity:** Các quy tắc quản trị luôn quan trọng hơn sự sáng tạo cá nhân của AI.
* **Constrained Edits are Safer:** Sửa đổi có giới hạn luôn an toàn hơn thay đổi diện rộng.
* **Predictable Execution:** Kết quả thực thi phải nhất quán và có thể dự đoán được.
* **Runtime Preservation First:** Ưu tiên số 1 là giữ cho ứng dụng luôn chạy được.

---

## 2. Official AI Execution Workflow
Quy trình thực thi 6 bước bắt buộc cho AI:

```text
Read Scope (Đọc hiểu phạm vi task)
    ↓
Audit Dependencies (Kiểm tra các thành phần liên quan)
    ↓
Explain Intended Changes (Giải thích những gì sắp sửa)
    ↓
Perform Minimal Edits (Thực hiện sửa đổi tối giản)
    ↓
Verify Runtime (Kiểm tra ứng dụng đang chạy)
    ↓
Report Affected Files (Báo cáo các file đã tác động)
```

---

## 3. Scope-Lock Rules
* **Phạm vi:** AI chỉ được phép sửa đổi các file nằm trong phạm vi Task đã được phê duyệt.
* **Dependency:** Chỉ thay đổi các thành phần phụ thuộc trực tiếp đến task.
* **CẤM:** Chạm vào các features không liên quan, thực hiện cleanup các hệ thống khác, hoặc âm thầm thay đổi kiến trúc tổng thể.

---

## 4. Minimal-Edit Strategy
* **Bảo tồn:** Giữ nguyên hành vi runtime và các public interfaces hiện có.
* **Ưu tiên:** Trích xuất (Extraction) logic thay vì viết lại (Replacement) toàn bộ.
* **KHÔNG ĐƯỢC:** Viết lại các hệ thống đang ổn định một cách không cần thiết hoặc thay đổi style code theo ý thích cá nhân.

---

## 5. Runtime Preservation Rules
Sau mỗi lần sửa code, AI phải đảm bảo:
* Luồng Auth (Đăng nhập/Xác thực) vẫn ổn định.
* Các định tuyến (Routes) không bị lỗi.
* Các Queries vẫn lấy được dữ liệu.
* Quá trình Hydration diễn ra bình thường.
* Toàn bộ các luồng hiện tại vẫn hoạt động tốt.

---

## 6. Dependency Audit Requirements
Trước khi di chuyển hoặc trích xuất bất kỳ file nào, AI **PHẢI** xác định:
* [ ] Các file đang import tệp này.
* [ ] Quyền sở hữu runtime (ai đang gọi nó?).
* [ ] Sự phụ thuộc vào Providers, Auth và Query.

---

## 7. AI Explanation Requirements
Trước khi thực hiện lệnh sửa code, AI **PHẢI** giải thích:
* Danh sách các file bị ảnh hưởng.
* Mục đích của việc di dời.
* Tác động dự kiến đến Runtime.
* Chiến lược kiểm chứng và phương án Rollback.

---

## 8. Verification-First Rules
AI **KHÔNG ĐƯỢC** thực hiện dồn dập nhiều task di dời mà chưa kiểm chứng. Sau mỗi task:
* [ ] Kiểm tra Build stability.
* [ ] Kiểm tra Runtime stability.
* [ ] Kiểm tra Auth & Query stability.
* [ ] Kiểm tra Import stability.

---

## 9. Cleanup Governance
* **Được phép:** Xóa code chết đã được xác nhận, xóa các import thừa, xóa các adapters tạm thời đã thay thế.
* **CẤM:** Cleanup diện rộng, cleanup theo phong cách cá nhân, hoặc thực hiện "hiện đại hóa" code không liên quan đến task.

---

## 10. Architecture Drift Prevention
AI Agent tuyệt đối không được:
* Âm thầm đưa vào các patterns mới.
* Tạo ra các kiến trúc song song gây nhầm lẫn.
* Nhân bản các hệ thống quản lý state/ownership.
* Lách qua các quy chuẩn quản trị đã thiết lập.

---

## 11. Auth Safety Constraints
* **KHÔNG ĐƯỢC:** Thay đổi quyền sở hữu Auth (Auth ownership) một cách tùy tiện.
* **KHÔNG ĐƯỢC:** Thay đổi luồng Redirect ngầm định.
* **PHẢI:** Xác minh kỹ lưỡng mọi thay đổi liên quan đến Auth.

---

## 12. File-Move Governance
Mọi hành động di chuyển file phải được giải thích rõ ràng về tác động import. Khuyến khích giữ lại khả năng tương thích tạm thời để tránh làm vỡ hệ thống build của dự án lớn.

---

## 13. Incremental Migration Rules
Di dời từng bước, kiểm chứng liên tục, giữ cho việc Rollback luôn dễ dàng và thu hẹp tối đa "bán kính sát thương".

---

## 14. Reporting Requirements
Sau mỗi task, AI phải báo cáo:
* Các file đã sửa đổi.
* Logic đã được trích xuất.
* Các rủi ro còn sót lại.
* Kết quả kiểm chứng Runtime.
* Đề xuất Task tiếp theo.

---

## 15. Forbidden AI Behaviors
* ❌ Viết lại mã nguồn diện rộng (Giant rewrites).
* ❌ Cleanup ngầm định (Hidden cleanup).
* ❌ Thay đổi thiết kế kiến trúc mà không xin phép.
* ❌ Tự ý tối ưu hóa dựa trên suy đoán (Speculative optimization).
* ❌ Thay đổi nhiều feature cùng lúc không kiểm soát.

---

## 16. Recommended AI Response Structure
AI nên trả lời theo cấu trúc sau để đảm bảo tính minh bạch:
1.  **Scope Audit:** Đánh giá phạm vi.
2.  **Planned Edits:** Các thay đổi dự kiến.
3.  **Risks:** Rủi ro tiềm ẩn.
4.  **File Changes:** Thực thi sửa đổi.
5.  **Verification:** Kết quả kiểm chứng.
6.  **Remaining Work:** Công việc còn lại.

---

## 17. Human Oversight Model
* **Con người:** Phê duyệt phạm vi, review tác động runtime và xác nhận mục tiêu di dời.
* **AI:** Thực thi các bước di dời một cách an toàn trong khuôn khổ các ràng buộc.

---

## 18. Success Criteria
Phiên làm việc của AI được coi là lành mạnh khi:
* ✅ Các thay đổi luôn giữ quy mô nhỏ.
* ✅ Runtime luôn ổn định.
* ✅ Việc Rollback luôn sẵn sàng.
* ✅ Kiến trúc luôn nhất quán với bộ Quản trị.

---
**Sự kỷ luật của AI là sự bảo đảm cho chất lượng của mã nguồn.**
