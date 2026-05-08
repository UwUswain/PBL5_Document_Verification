# MIGRATION DRY RUN SYSTEM
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL SIMULATION LAYER
**Purpose:** Pre-Execution Impact Analysis & Risk Prediction

---

## 1. Core Dry Run Philosophy
Nguyên lý của chúng ta là: **"Mô phỏng trước khi thực thi"**:
* **Never Execute Without Simulation:** Không bao giờ sửa code khi chưa mô phỏng tác động.
* **Prediction Reduces Runtime Risk:** Việc dự đoán giúp giảm thiểu rủi ro cho ứng dụng đang chạy.
* **Dependency Awareness is Critical:** Hiểu rõ các mối quan hệ phụ thuộc là chìa khóa của sự an toàn.
* **AI Must Think Before Acting:** AI Agent phải phân tích kỹ lưỡng trước khi đưa ra lệnh thay đổi.

---

## 2. Dry Run Workflow
Quy trình mô phỏng 6 bước bắt buộc:

```text
Parse Task (Đọc hiểu nhiệm vụ)
    ↓
Identify Affected Files (Xác định các tệp bị ảnh hưởng)
    ↓
Map Dependencies (Lập bản đồ phụ thuộc)
    ↓
Predict Runtime Impact (Dự đoán tác động runtime)
    ↓
Simulate Changes (Mô phỏng các thay đổi)
    ↓
Validate Risk Level (Xác nhận mức độ rủi ro)
```

---

## 3. Task Impact Simulation Model
Với mỗi Task, AI phải dự báo:
* Danh sách các file sẽ bị sửa đổi/xóa/tạo mới.
* Các dependency trực tiếp (Direct dependencies).
* Các dependency gián tiếp (Indirect dependencies).
* Tác động dự kiến đến luồng chạy (Runtime impact).
* Mức độ rủi ro tổng thể (Risk level).

---

## 4. Dependency Graph Simulation
AI Agent phải thực hiện phân tích:
* **Import Chains:** Ai đang gọi tệp này và tệp này đang gọi những ai?
* **Feature Coupling:** Thay đổi này có ảnh hưởng đến tính năng khác không?
* **Provider/Auth/Query Dependencies:** Tệp này có phụ thuộc vào các hệ thống toàn cục không?

---

## 5. Risk Prediction Model
Phân loại rủi ro dựa trên mô phỏng:
* **LOW:** Chỉ sửa đổi UI cục bộ, không có logic API/Auth.
* **MEDIUM:** Trích xuất logic API/Hook, ảnh hưởng đến 1 feature.
* **HIGH:** Thay đổi logic Auth hoặc Shared Providers toàn cục.
* **CRITICAL:** Thay đổi cấu trúc Routing hoặc hệ thống Token.

---

## 6. Execution Path Simulation
Ví dụ mô phỏng Task trích xuất API:
* **Bước 1:** Tạo file Client mới -> Tác động: 0.
* **Bước 2:** Di chuyển logic từ file cũ -> Tác động: Có thể gây lỗi import.
* **Bước 3:** Cập nhật các nơi sử dụng -> Tác động: Cần verify runtime.
* **Bước 4:** Xóa code cũ -> Tác động: Cần đảm bảo không còn dependency ngầm.

---

## 7. Side Effect Prediction
AI phải dự báo các "tác dụng phụ":
* Gãy import do sai đường dẫn bí danh (alias).
* Lỗi hook dependency trong `useEffect`/`useMemo`.
* Vấn đề làm mới cache (cache invalidation) của React Query.
* Tác động đến tần suất render (re-render) của UI.

---

## 8. Safe Execution Validation Rules
Một Task chỉ được phép thực thi (Execute) khi:
* ✅ Bài mô phỏng (Simulation) đã hoàn tất và được duyệt.
* ✅ Mức độ rủi ro nằm trong ngưỡng cho phép.
* ✅ Đã xác định rõ phương án quay lui (Rollback).

---

## 9. High-Risk Pattern Detection
Cảnh báo đỏ nếu mô phỏng phát hiện:
* Chỉnh sửa chéo giữa các features (Cross-feature edits).
* Thay đổi liên quan đến luồng Auth/Redirect.
* Thay đổi các Providers lõi.
* Di chuyển các thư mục lớn một cách hung hãn.

---

## 10. AI Pre-Execution Checklist
Trước khi thực thi, AI **BẮT BUỘC** phải:
1. Liệt kê toàn bộ file bị tác động.
2. Giải thích chuỗi phụ thuộc (Dependency chain).
3. Giải thích tác động runtime dự kiến.
4. Gán mức độ rủi ro (Risk level).
5. Đề xuất phương án Rollback cụ thể.

---

## 11. Simulation vs Execution Rule
* **Simulation:** Là bước bắt buộc phải có trong mọi lượt refactor.
* **Execution:** Chỉ diễn ra sau khi con người hoặc hệ thống quản trị phê duyệt kết quả mô phỏng.
* **CẤM:** Gộp chung bước mô phỏng và thực thi vào một lệnh duy nhất.

---

## 12. Failure Scenario Modeling
AI phải tự đặt câu hỏi:
* Điều gì sẽ xảy ra nếu giả định về API của tôi sai?
* Hệ thống sẽ gãy ở đâu nếu tôi quên cập nhật một import ngầm định?
* Nếu logic trích xuất hooks bị lỗi, user sẽ nhìn thấy gì?

---

## 13. Migration Safety Thresholds
Chỉ được thực thi tự động khi:
* Mức độ rủi ro ≤ **MEDIUM**.
* Các dependency đã được map 100%.
* Baseline đã tồn tại để đối chiếu.

---

## 14. Integration With Command Center
Kết quả mô phỏng (Dry Run Output) phải được đẩy vào:
* `docs/migration-command-center.md` để theo dõi rủi ro.
* `docs/documents-migration-task-system.md` để cập nhật trạng thái.

---

## 15. AI-Agent Behavior Constraints
AI Agent **KHÔNG ĐƯỢC PHÉP**:
* Bỏ qua bước mô phỏng (Dry run).
* Suy đoán dependency dựa trên cảm tính.
* Thực thi các thay đổi khi còn nghi ngờ về rủi ro.

---

## 16. Success Criteria
Hệ thống Dry Run được coi là hiệu quả khi:
* ✅ Số lượng các cuộc di dời bị lỗi (wrong migrations) giảm thiểu.
* ✅ Các lỗi thụt lùi (regressions) được phát hiện trước khi sửa code.
* ✅ Độ chính xác thực thi của AI tăng lên.
* ✅ Tầm nhìn về dependency của toàn bộ hệ thống được cải thiện.

---
**Nhìn thấu tương lai để bảo vệ hiện tại.**
