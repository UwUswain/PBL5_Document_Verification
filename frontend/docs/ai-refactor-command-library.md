# AI REFACTOR COMMAND LIBRARY
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL PROMPT SYSTEM
**Purpose:** Standardized AI Execution & Governance Compliance

---

## 1. Core AI Collaboration Philosophy
AI không chỉ là một công cụ viết code, mà là một trợ lý kỹ thuật có kỷ luật:
* **Architecture-First Prompting:** Luôn đặt câu hỏi về kiến trúc trước khi viết code.
* **Scoped Refactor:** Tập trung vào phạm vi hẹp để kiểm soát rủi ro, không viết lại tràn lan.
* **Deterministic Execution:** Kết quả thực thi phải có thể dự đoán và nhất quán.
* **Verification-First Workflow:** Việc kiểm chứng (Verification) quan trọng ngang với việc triển khai (Implementation).

---

## 2. Official AI Session Startup Prompt
Sử dụng prompt này khi bắt đầu một phiên làm việc mới để đồng bộ bối cảnh:

> "Bạn là một AI Architect chịu trách nhiệm refactor Frontend dự án PBL5. 
> Nhiệm vụ đầu tiên: Hãy đọc các file `docs/governance-index.md`, `AGENTS.md` và `docs/frontend-migration-status.md`.
> Sau khi đọc, hãy tóm tắt: 
> 1. Trạng thái kiến trúc hiện tại.
> 2. Phase đang thực thi và các mục tiêu ưu tiên.
> 3. Các quy tắc an toàn quan trọng nhất bạn cần tuân thủ.
> Đừng sửa code cho đến khi tôi xác nhận bạn đã nắm rõ bối cảnh."

---

## 3. Feature Migration Prompt Template
Sử dụng khi di dời một module sang kiến trúc Feature-based:

> "Hãy thực hiện migrate feature [Tên Feature] sang cấu trúc mới theo `docs/feature-migration-template.md`. 
> Các bước yêu cầu:
> 1. Audit implementation hiện tại của feature này.
> 2. Bóc tách API layer sang `api/*Client.ts`.
> 3. Bóc tách logic React Query sang `hooks/`.
> 4. Phân chia UI/Business logic rõ ràng.
> Yêu cầu: Đảm bảo không thay đổi runtime behavior và không làm đứt quãng luồng Auth."

---

## 4. Auth Refactor Prompt Template
Sử dụng cho các tác vụ liên quan đến xác thực:

> "Hãy refactor luồng Auth liên quan đến [Vấn đề: Hydration/Redirect/Token]. 
> Bạn phải tuân thủ tuyệt đối `docs/auth-architecture-spec.md`.
> Yêu cầu: 
> 1. Giữ nguyên ngữ nghĩa xác thực (Auth semantics).
> 2. Đảm bảo quy tắc Hydration-first.
> 3. Tuyệt đối không tạo ra vòng lặp redirect vô hạn."

---

## 5. API & React Query Refactor Prompt Template
Sử dụng để chuẩn hóa tầng dữ liệu:

> "Hãy chuẩn hóa tầng API và Server State cho [Feature/Module]. 
> Tuân thủ `docs/server-state-governance.md`.
> Yêu cầu: 
> 1. Sử dụng duy nhất `apiClient` từ `lib/`.
> 2. Chuẩn hóa Query Keys theo cấp bậc.
> 3. Loại bỏ fetch trùng lặp (duplicate fetching) và đảm bảo tính nhất quán của Invalidation."

---

## 6. UI Refactor Prompt Template
Sử dụng để dọn dẹp và chuẩn hóa giao diện:

> "Hãy refactor component [Tên Component] theo `docs/ui-component-architecture.md`.
> Yêu cầu:
> 1. Chia nhỏ các Mega-components.
> 2. Sử dụng lại các UI Primitives từ `components/ui/`.
> 3. Loại bỏ các props Ant Design lỗi thời và đảm bảo tính nhất quán của Dashboard UX."

---

## 7. Cleanup & Deprecation Prompt Template
Sử dụng để xóa bỏ nợ kỹ thuật:

> "Hãy thực hiện dọn dẹp hệ thống cũ liên quan đến [Module]. 
> Tuân thủ `docs/deprecation-cleanup-governance.md`.
> Yêu cầu: 
> 1. Xác minh không còn consumer nào phụ thuộc vào code này.
> 2. Đảm bảo an toàn cho các đường lui (rollback paths).
> 3. Tuyệt đối không xóa các hydration protections quan trọng."

---

## 8. Verification Prompt Template
Sử dụng để kiểm chứng sau mỗi task:

> "Hãy thực hiện kiểm chứng (Verification) cho thay đổi vừa rồi. 
> Danh mục kiểm tra:
> 1. Build stability (npm run build).
> 2. Auth flow & Route guards.
> 3. React Query caching & invalidation.
> 4. Hydration & Navigation.
> Hãy liệt kê các luồng đã test và đánh giá các rủi ro còn sót lại."

---

## 9. ADR Creation Prompt Template
Sử dụng khi cần ghi lại một quyết định kiến trúc:

> "Dựa trên thay đổi kiến trúc vừa thực hiện cho [Module], hãy tạo một ADR mới trong `docs/adr/` theo mẫu trong `docs/architecture-decision-records.md`. 
> Hãy ghi rõ: Context, Decision, Consequences và các giải pháp thay thế đã xem xét."

---

## 10. Migration Status Update Prompt Template
Sử dụng ở cuối phiên làm việc:

> "Hãy cập nhật file `docs/frontend-migration-status.md`. 
> Cập nhật:
> 1. Tiến độ của Phase hiện tại.
> 2. Trạng thái của các Feature đã migrate.
> 3. Danh sách nợ kỹ thuật (Technical Debt) mới hoặc đã xử lý.
> 4. Các rủi ro (Known Risks) mới phát hiện."

---

## 11. Emergency Recovery Prompt Template
Sử dụng khi gặp sự cố nghiêm trọng:

> "HỆ THỐNG GẶP LỖI [Tên lỗi]. 
> Hãy thực hiện phục hồi khẩn cấp:
> 1. Rollback về commit/trạng thái ổn định gần nhất.
> 2. Khôi phục Auth stability hoặc Routing.
> 3. Phân tích nguyên nhân gãy và đề xuất phương án sửa đổi an toàn hơn."

---

## 12. AI-Agent Safety Rules
AI Agent phải luôn tự kiểm tra các luật này trước khi thực thi lệnh:
* **KHÔNG** rewrite diện rộng khi chưa audit kỹ.
* **KHÔNG** âm thầm thay đổi kiến trúc.
* **KHÔNG** xóa code mà không có phương án rollback.
* **PHẢI** giải thích rõ reasoning và rủi ro.

---

## 13. Prompt Usage Guidelines
* **Khi di dời:** Kết hợp *Startup* + *Feature Migration* + *Verification*.
* **Khi dọn dẹp:** Kết hợp *Cleanup* + *Verification* + *Status Update*.
* **Không lạm dụng:** Tránh nhồi nhét quá nhiều yêu cầu vào một prompt duy nhất để tránh AI bị "hallucinate".

---

## 14. Recommended AI Refactor Workflow
1. **Startup:** Đồng bộ bối cảnh.
2. **Action:** Thực thi lệnh Refactor chuyên biệt (Auth/API/UI).
3. **Verify:** Kiểm chứng kết quả.
4. **ADR/Status:** Ghi chép và cập nhật tiến độ.

---

## 15. Long-Term AI Governance Strategy
* **AI Continuity:** Đảm bảo kiến thức không bị mất đi khi đổi AI Agent.
* **Governance Drift Prevention:** Chống lại việc AI dần dần làm lỏng lẻo các quy tắc quản trị.
* **Architectural Integrity:** Giữ cho kiến trúc luôn sạch sẽ và đúng định hướng qua hàng trăm phiên làm việc.

---
**Prompts chuẩn là chìa khóa cho sự thực thi chuẩn.**
