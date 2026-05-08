# ARCHITECTURE DECISION RECORD SYSTEM
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL ADR GOVERNANCE
**Target Audience:** AI Agents & Senior Engineers

---

## 1. Core ADR Philosophy
Hệ thống ADR (Architecture Decision Record) là bộ nhớ kỹ thuật của dự án.
* **Decisions Must Be Recorded:** Mọi quyết định kiến trúc quan trọng phải được ghi lại, không được để tồn tại dưới dạng thỏa thuận miệng hoặc ngầm định.
* **Rationale is Key:** Lý do (tại sao chọn phương án này?) quan trọng ngang với việc triển khai (làm như thế nào?).
* **Historical Context:** Các phiên làm việc của AI trong tương lai cần bối cảnh lịch sử để không lặp lại sai lầm cũ.
* **Prevent Architectural Regression:** Chống lại sự suy thoái kiến trúc bằng cách bám sát các quyết định đã được phê duyệt.
* **Preserve Migration Intent:** Ghi lại ý đồ của việc di dời (Migration) để đảm bảo tính nhất quán qua các Phase.

---

## 2. Official ADR Lifecycle
Trạng thái của một quyết định kiến trúc:

1.  **Proposed:** Đang được đề xuất, đang chờ thảo luận/phê duyệt.
2.  **Accepted:** Đã được chấp thuận, sẵn sàng để thực thi.
3.  **Implemented:** Đã được triển khai hoàn tất vào mã nguồn.
4.  **Deprecated:** Đã lỗi thời, không khuyến khích áp dụng cho các phần mới.
5.  **Superseded:** Đã bị thay thế hoàn toàn bởi một quyết định mới hơn (ADR mới).

---

## 3. When ADRs Are Required
Bắt buộc phải tạo hoặc cập nhật ADR khi:
* Thiết kế lại hệ thống xác thực (Auth Redesign).
* Thay đổi cấu trúc định tuyến (Routing Redesign).
* Thay đổi kiến trúc tầng API (apiClient, featureClient).
* Thiết lập quy chuẩn React Query (Governance rules).
* Thay đổi cấu trúc Feature Architecture.
* Quyết định về các lớp tương thích tạm thời (Compatibility Layers).
* Các quyết định liên quan đến chiến lược quay lui (Rollback Strategies).

**Không cần ADR:** Sửa lỗi chính tả, thay đổi CSS nhỏ, tinh chỉnh giao diện không ảnh hưởng đến cấu trúc.

---

## 4. Official ADR Template
Mọi file ADR phải tuân thủ mẫu sau:

```markdown
# ADR-XXX — [Tên quyết định]

## Status
[Proposed | Accepted | Implemented | Deprecated | Superseded]

## Context
Mô tả vấn đề đang gặp phải, bối cảnh hiện tại và lý do tại sao cần đưa ra quyết định này.

## Decision
Chi tiết về quyết định kiến trúc. Chúng ta sẽ làm gì? Cấu trúc như thế nào?

## Consequences
Các tác động sau khi thực thi. Ưu điểm là gì? Nhược điểm/Rủi ro là gì?

## Alternatives Considered
Các phương án khác đã được xem xét và lý do tại sao chúng bị loại bỏ.
```

---

## 5. Migration Decision Rules
Đối với quá trình di dời (Migration):
* **Ghi rõ tính tạm thời:** Nếu quyết định chỉ dùng cho giai đoạn quá độ, phải ghi rõ "Temporary".
* **Remove Phase:** Dự kiến sẽ gỡ bỏ quyết định/lớp tương thích này ở Phase nào.
* **Rollback Strategy:** Ghi lại phương án khôi phục nếu quyết định này gây lỗi hệ thống.

---

## 6. AI-Agent ADR Rules
**AI Agent PHẢI:**
* Giải thích các thay đổi kiến trúc lớn thông qua ADR.
* Phân tích các đánh đổi (Trade-offs) và rủi ro.
* Luôn kiểm tra các ADR đã được "Accepted" trước khi đề xuất thay đổi mới.
* Đảm bảo tính liên tục của lịch sử kiến trúc.

**AI Agent KHÔNG ĐƯỢC:**
* Âm thầm thay đổi kiến trúc mà không báo cáo.
* Tự ý xóa bỏ các hệ thống lớn mà không có ADR phê duyệt.
* Phớt lờ các quyết định đã ghi trong lịch sử ADR.

---

## 7. Deprecated & Superseded ADR Handling
* **Không xóa ADR cũ:** Luôn giữ lại để tra cứu lịch sử.
* **Linkage:** Nếu ADR-007 thay thế ADR-003, phải ghi rõ: `Superseded by ADR-007` trong file ADR-003 và `Supersedes ADR-003` trong file ADR-007.

---

## 8. ADR Naming & Organization Rules
* **Thư mục:** `docs/adr/`
* **Đặt tên:** `ADR-[Số thứ tự]-[tên-kebab-case].md`
* **Ví dụ:**
  * `docs/adr/ADR-001-centralized-auth.md`
  * `docs/adr/ADR-002-react-query-governance.md`

---

## 9. Architecture Governance Integration
Hệ thống ADR là trái tim kết nối các tài liệu quản trị:
* Migration Workflow: Sử dụng ADR để quyết định các bước di dời.
* Cleanup Governance: Sử dụng ADR để quyết định khi nào xóa code cũ.
* Auth/Server-State Specs: Là kết quả cụ thể từ các ADR đã được thực thi.

---

## 10. Refactor Session Documentation Rules
Sau mỗi phiên Refactor lớn:
* Cập nhật trạng thái ADR từ `Accepted` sang `Implemented`.
* Ghi lại các bài học kinh nghiệm hoặc các rủi ro phát sinh trong thực tế triển khai.

---

## 11. ADR Review & Verification Workflow
Trước khi một ADR được chuyển sang trạng thái `Accepted`:
* Phải kiểm tra tính nhất quán với toàn bộ kiến trúc hiện tại.
* Đánh giá tác động đến hệ thống Auth và Routing.
* Xác minh tính khả thi của phương án Rollback.

---

## 12. Example ADRs
Dưới đây là một số tiêu đề ADR mẫu cần có:
1. **Centralized Auth Ownership:** Quyết định dồn toàn bộ logic auth vào AuthProvider và React Query.
2. **Feature-based Migration:** Quyết định migrate theo từng domain feature thay vì theo layer.
3. **ApiClient Standardization:** Quyết định sử dụng duy nhất một instance Axios với Interceptors chuẩn.
4. **Compatibility Layer Strategy:** Quyết định sử dụng Adapter để giữ code cũ chạy song song.

---

## 13. Long-Term Architecture Memory Strategy
* **Institutional Knowledge:** Lưu giữ kiến thức dự án qua nhiều thế hệ AI/Developer.
* **Onboarding:** Giúp người mới/AI mới nắm bắt nhanh tại sao hệ thống lại được xây dựng như hiện tại.
* **Prevent Architecture Amnesia:** Chống lại "bệnh quên kiến trúc" - khi không ai nhớ tại sao một đoạn code kỳ quặc lại tồn tại.

---
**Một kiến trúc không có ADR là một kiến trúc không có bối cảnh.**
