# MIGRATION PRIORITY MATRIX
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL MIGRATION ROADMAP
**Purpose:** Safe Sequencing & Risk-Aware Execution Prioritization

---

## 1. Core Prioritization Philosophy
Việc sắp xếp thứ tự di dời (Sequencing) là yếu tố quyết định sự sống còn của dự án:
* **Safest-First Migrations:** Thực hiện các cuộc di dời an toàn nhất trước để củng cố niềm tin vào hệ thống quản trị.
* **Stabilize Foundations Before Critical Systems:** Ổn định hạ tầng dùng chung trước khi chạm vào các hệ thống quan trọng.
* **Incremental Confidence Building:** Xây dựng sự tự tin thông qua các mốc thành công nhỏ.
* **Runtime Preservation Over Cleanup Speed:** Sự ổn định khi chạy quan trọng hơn tốc độ dọn dẹp code.

---

## 2. Official Migration Risk Levels
Phân loại mức độ rủi ro của các thành phần:
* **LOW:** Cô lập tốt, ít dependency, không ảnh hưởng đến Auth (VD: Search).
* **MEDIUM:** Có logic nghiệp vụ riêng, phụ thuộc vào hạ tầng chung (VD: Documents).
* **HIGH:** Liên quan chặt chẽ đến Auth, Routing hoặc State toàn cục (VD: Profile, Users).
* **CRITICAL:** Ảnh hưởng đến toàn bộ vòng đời ứng dụng (VD: Auth Stabilization, Dashboard).

---

## 3. Feature Dependency Analysis
Audit các mối liên kết phụ thuộc:
* **Auth Dependencies:** Hầu hết các trang đều phụ thuộc vào trạng thái đăng nhập.
* **Provider Dependencies:** Các widgets trên Dashboard phụ thuộc vào nhiều nguồn dữ liệu.
* **Query Dependencies:** Một số tính năng dùng chung cache hoặc query keys.
* **Route Dependencies:** Các trang con phụ thuộc vào cấu trúc layout của App Router.

---

## 4. Recommended Migration Order
Thứ tự di dời đề xuất để đảm bảo an toàn tối đa:

1.  **PHASE-01 — Repository/Documents:** Kiểm chứng kiến trúc Feature-based.
2.  **PHASE-02 — Search:** Di dời module bổ trợ, cô lập tốt.
3.  **PHASE-03 — Profile:** Bắt đầu chạm vào logic liên quan đến Auth (mức độ vừa).
4.  **PHASE-04 — Users/Admin:** Xử lý các nghiệp vụ quản trị phức tạp.
5.  **PHASE-05 — Dashboard:** Di dời "bộ mặt" của ứng dụng (rủi ro cao).
6.  **PHASE-06 — Auth Stabilization:** Ổn định hóa hệ thống xác thực khi hạ tầng đã vững.

---

## 5. Why Documents Feature Comes First
* **Độ phức tạp trung bình:** Đủ để kiểm chứng kiến trúc nhưng không quá khó.
* **Độ nhạy Auth thấp:** Chủ yếu là CRUD tài liệu.
* **Giá trị kiểm chứng cao:** Xác thực được toàn bộ luồng API -> Hook -> UI Components.
* **Bán kính sát thương thấp:** Nếu lỗi, chỉ ảnh hưởng đến trang tài liệu.

---

## 6. Search Feature Priority Analysis
* **Tính cô lập:** Rất cao, ít ảnh hưởng đến các module khác.
* **Dễ chuẩn hóa:** Là môi trường tốt để test việc chuẩn hóa Query Governance và UI Primitives.

---

## 7. Profile Feature Priority Analysis
* **Liên kết Auth:** Bắt đầu làm quen với việc sử dụng `user` object từ `AuthProvider`.
* **Độ phức tạp UI:** Vừa phải, chủ yếu là các Form hiển thị và chỉnh sửa.

---

## 8. Users/Admin Feature Priority Analysis
* **Nghiệp vụ phức tạp:** Chứa nhiều logic phân quyền (RBAC) và mutation phức tạp.
* **Rủi ro:** Ảnh hưởng đến luồng quản trị viên, cần kiểm chứng kỹ lưỡng phân trang và filter.

---

## 9. Dashboard Migration Priority Analysis
* **Độ phụ thuộc cao nhất:** Kết hợp dữ liệu từ nhiều nguồn (Stats, Activity, Documents).
* **Rủi ro Runtime:** Là trang đầu tiên user nhìn thấy, mọi lỗi Hydration đều bị lộ rõ.
* **Sắp xếp:** Để cuối cùng để tận dụng các components/hooks đã được chuẩn hóa từ các phase trước.

---

## 10. Auth Stabilization Priority Analysis
* **Rủi ro cực đại:** Mọi thay đổi đều có thể làm "vỡ" app.
* **Thời điểm:** Nên thực hiện sau khi cấu trúc kiến trúc đã trở nên tất định (predictable) và các features khác đã ổn định.

---

## 11. Parallel-Migration Rules
* **Được phép:** Di dời song song các features hoàn toàn độc lập (VD: Search và Documents).
* **CẤM:** Di dời đồng thời Auth + Dashboard hoặc sửa nhiều Providers cùng lúc.

---

## 12. Runtime Safety Gates
Một Feature chỉ được phép bắt đầu migrate khi:
* ✅ Phase trước đó đã đạt trạng thái STABLE.
* ✅ Phương án Rollback đã sẵn sàng.
* ✅ Mốc Baseline đã được capture.

---

## 13. AI-Agent Coordination Rules
AI Agent phải tôn trọng thứ tự di dời này, không được tự ý thực hiện các cuộc "cách mạng" kiến trúc ở các module rủi ro cao khi chưa hoàn thành các bước cơ sở.

---

## 14. Recommended Migration Milestones
* **MILESTONE-01:** Kiến trúc Documents được xác nhận thành công.
* **MILESTONE-02:** Quy chuẩn React Query được ổn định hóa trên toàn app.
* **MILESTONE-03:** Hệ thống UI Components dùng chung được chuẩn hóa 100%.

---

## 15. High-Risk Migration Patterns
Cần tránh tuyệt đối:
* Viết lại Auth ngay từ đầu.
* Di dời Dashboard khi hạ tầng API/Hook chưa chuẩn.
* Thay đổi diện rộng Shared Layer mà không có baseline.

---

## 16. Rollback-Aware Execution
Mỗi Phase phải đảm bảo có thể hoàn tác độc lập mà không gây ra sự mất ổn định dây chuyền cho toàn bộ ứng dụng.

---

## 17. Success Criteria
Thứ tự di dời được coi là lành mạnh khi:
* ✅ Sự ổn định runtime được duy trì xuyên suốt.
* ✅ Niềm tin vào quá trình di dời tăng dần qua từng phase.
* ✅ Việc Rollback luôn nằm trong tầm kiểm soát.
* ✅ Kiến trúc tiến hóa một cách dự đoán được.

---
**Đi đúng trình tự là cách nhanh nhất để về đích an toàn.**
