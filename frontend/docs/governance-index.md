# FRONTEND GOVERNANCE INDEX
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** ROOT GOVERNANCE DOCUMENT
**Purpose:** Architecture Map & Engineering Entrypoint

---

## 1. Governance Ecosystem Overview
Hệ sinh thái quản trị (Governance Ecosystem) được thiết lập để đảm bảo:
* **Kiến trúc nhất quán:** Ngăn chặn sự phân mảnh kiến trúc (architecture drift) trong quá trình phát triển lâu dài.
* **Refactor an toàn:** Đặc biệt khi có sự hỗ trợ của AI, việc có các quy tắc rõ ràng giúp tránh các lỗi phá vỡ hệ thống (breaking changes).
* **Tính ổn định cao:** Đảm bảo quá trình di dời (migration) diễn ra tịnh tiến và có thể kiểm soát.
* **Bảo trì dễ dàng:** Codebase được tổ chức theo các tiêu chuẩn kỹ thuật chuyên nghiệp, dễ đọc và dễ mở rộng.

---

## 2. Official Governance Hierarchy
Thứ tự ưu tiên và phân cấp của các tài liệu quản trị:

```text
governance-index.md (Root)
    ↓
AGENTS.md (Execution Rules)
    ↓
Architecture Specs (Auth, Server State, UI)
    ↓
Workflow & Protocol Docs (Standard SOPs)
    ↓
Migration Status & ADR (Tracking & History)
```

**Conflict Resolution:** Nếu có sự mâu thuẫn giữa các tài liệu, quyền ưu tiên được áp dụng theo thứ tự từ trên xuống dưới trong sơ đồ này.

---

## 3. Source of Truth Map
Định nghĩa nguồn sự thật duy nhất cho từng phân mảng:

* **Authentication:** `auth-architecture-spec.md`
* **API & Server State:** `server-state-governance.md`
* **UI & Components:** `ui-component-architecture.md`
* **Migration Progress:** `frontend-migration-status.md`
* **Coding Conventions:** `frontend-engineering-conventions.md`

---

## 4. Official Document Catalog
Danh mục toàn bộ tài liệu trong hệ sinh thái:

| Document | Purpose | Authority Level | When to Read |
| :--- | :--- | :--- | :--- |
| `AGENTS.md` | Luật thi hành cho AI | Critical | Bắt đầu session |
| `frontend-migration-plan.md` | Lộ trình di dời 8 Phase | Strategic | Trước mỗi Phase |
| `auth-architecture-spec.md` | Đặc tả xác thực | Technical | Sửa logic Auth |
| `server-state-governance.md` | Quản trị API & React Query | Technical | Sửa logic Data |
| `ui-component-architecture.md` | Quản trị giao diện & UI | Technical | Tạo/Sửa UI |
| `frontend-engineering-conventions.md` | Quy chuẩn đặt tên & code | Standards | Luôn luôn |
| `deprecation-cleanup-governance.md` | Quy tắc dọn dẹp code cũ | Operational | Sau migration |
| `architecture-decision-records.md` | Lịch sử quyết định | Historical | Thay đổi kiến trúc |
| `frontend-migration-status.md` | Theo dõi tiến độ thực tế | Tactical | Sau mỗi task |
| `standard-refactor-workflow.md` | Quy trình SOP refactor | Process | Bắt đầu task |
| `feature-migration-template.md` | Mẫu cấu trúc feature | Blueprint | Tạo feature mới |
| `ai-refactor-execution-protocol.md` | Quy chế an toàn AI | Governance | Luôn luôn |

---

## 5. AI-Agent Onboarding Workflow
Bắt buộc đối với mọi AI Agent khi bắt đầu một phiên làm việc mới:

1. **Step 1:** Đọc `governance-index.md` để nắm bản đồ tài liệu.
2. **Step 2:** Đọc `AGENTS.md` để hiểu các quy tắc thực thi.
3. **Step 3:** Kiểm tra `frontend-migration-status.md` để biết Phase hiện tại và các task ưu tiên.
4. **Step 4:** Đọc Spec tương ứng (Auth, Server, hoặc UI) dựa trên phạm vi task.
5. **Step 5:** Thực hiện refactor trong phạm vi hẹp (scoped refactor).

---

## 6. Developer Onboarding Workflow
Dành cho kỹ sư con người:
1. Đọc **Target Architecture** để hiểu tầm nhìn.
2. Đọc **Engineering Conventions** để hiểu ngôn ngữ chung.
3. Tìm hiểu **Feature Migration Template** để biết cách tổ chức mã nguồn.
4. Theo dõi **Migration Plan** để nắm được lộ trình đóng góp.

---

## 7. Governance Update Rules
* **Khi nào cập nhật:** Khi có quyết định kiến trúc mới (ADR), khi hoàn thành một mốc di dời (Status), hoặc khi phát hiện quy trình cần tối ưu (Workflow).
* **Nguyên tắc:** Cập nhật các tài liệu "Source of Truth" trước, sau đó mới cập nhật các tài liệu bổ trợ. Tuyệt đối không để xảy ra mâu thuẫn giữa các docs.

---

## 8. Conflict Resolution Rules
Trong trường hợp các tài liệu mâu thuẫn:
1. Ưu tiên **Architecture Spec** đối với các vấn đề kỹ thuật chuyên sâu.
2. Ưu tiên **ADR** nếu đó là một quyết định lịch sử cụ thể.
3. Ưu tiên **Migration Status** đối với hiện trạng thực tế của codebase.

---

## 9. Governance Maintenance Workflow
* **Định kỳ dọn dẹp:** Kiểm tra và loại bỏ các tài liệu đã lỗi thời hoặc đã được thay thế.
* **Ngăn chặn Architecture Drift:** Đối chiếu code thực tế với các Specs hàng tuần.
* **Cập nhật ADR:** Đảm bảo mọi thay đổi lớn đều có hồ sơ ghi chép.

---

## 10. Recommended Daily Workflow
Chu trình làm việc hàng ngày của sự kết hợp AI + Human:
1. Đọc trạng thái di dời (`migration-status`).
2. Xác định phạm vi task (Isolation scope).
3. Đọc Spec liên quan.
4. Thực thi refactor tối giản.
5. Kiểm chứng Runtime (Verify).
6. Cập nhật tài liệu trạng thái.

---

## 11. Governance Scalability Strategy
Hệ thống này có thể mở rộng cho:
* **Nhiều cộng tác viên:** Quy trình SOP giúp mọi người làm việc đồng bộ.
* **Hệ thống Backend:** Áp dụng mô hình ADR và Spec tương tự cho Python/FastAPI.
* **CI/CD:** Tích hợp kiểm tra quy chuẩn linter tự động dựa trên Conventions.

---

## 12. Final Governance Principles
* **Governance-First Engineering:** Quản trị đi trước, lập trình theo sau.
* **Predictable Evolution:** Sự phát triển của kiến trúc phải nằm trong dự tính.
* **AI Synchronization:** AI phải là một bánh răng trong cỗ máy quản trị.
* **Documentation-Driven Development:** Tài liệu là la bàn cho mọi hành động sửa code.

---
**Chỉ có sự kỷ luật mới giúp một dự án lớn thành công bền vững.**
