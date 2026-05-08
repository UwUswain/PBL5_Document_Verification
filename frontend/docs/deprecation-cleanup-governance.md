# DEPRECATION & CLEANUP GOVERNANCE
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL CLEANUP SYSTEM
**Target Audience:** AI Agents & Senior Engineers

---

## 1. Core Cleanup Philosophy
Quá trình dọn dẹp mã nguồn cũ (Cleanup) là một phần không thể tách rời của kiến trúc. Chúng ta tuân thủ các nguyên lý:
* **Cleanup is Part of Architecture:** Một kiến trúc tốt không chỉ nằm ở code mới, mà còn ở việc loại bỏ sạch sẽ code cũ.
* **Safe Deletion Over Aggressive Rewrite:** Ưu tiên việc xóa bỏ an toàn hơn là việc viết lại một cách vội vã và cực đoan.
* **Preserve Rollback Windows:** Luôn giữ lại một "cửa sổ quay lui" (rollback window) cho đến khi code mới được xác nhận ổn định 100%.
* **Incremental Deprecation:** Loại bỏ từng phần, không thực hiện dọn dẹp hàng loạt (Big-bang cleanup) dễ gây lỗi dây chuyền.
* **Controlled Technical Debt Removal:** Việc trả nợ kỹ thuật phải nằm trong tầm kiểm soát và có kế hoạch.

---

## 2. Deprecation Lifecycle
Mọi thành phần cũ của hệ thống phải đi qua vòng đời chuẩn hóa trước khi biến mất:

1.  **Active:** Code đang vận hành bình thường.
2.  **Legacy:** Đã có giải pháp thay thế mới, nhưng code cũ vẫn là logic chính.
3.  **Deprecated:** Đã bị đánh dấu lỗi thời (`@deprecated`), cấm viết code mới dựa trên thành phần này.
4.  **Scheduled-for-removal:** Đã migrate xong 100% consumers, chỉ còn tồn tại file vật lý để dự phòng.
5.  **Removed:** Đã được xóa hoàn toàn khỏi repository.

---

## 3. Safe Cleanup Workflow
Quy trình dọn dẹp 6 bước bắt buộc:

1.  **Identify:** Xác định thành phần cần dọn dẹp (file, function, hook).
2.  **Mark Deprecated:** Gắn tag cảnh báo và thông báo cho team/AI.
3.  **Create Compatibility Layer:** Xây dựng lớp tương thích (Adapter) nếu cần thiết để hỗ trợ quá trình chuyển đổi.
4.  **Migrate Consumers:** Trỏ tất cả các nơi đang sử dụng code cũ sang code mới.
5.  **Verify Runtime:** Kiểm tra hệ thống chạy thực tế, đảm bảo không có side-effect.
6.  **Remove Safely:** Xóa code cũ sau khi đã vượt qua quá trình kiểm chứng.

**CẤM:** Xóa file lập tức khi chưa migrate xong consumers hoặc xóa hàng loạt hệ thống đang ổn định.

---

## 4. Compatibility Layer Rules
Lớp tương thích (Compatibility Layer) là cầu nối tạm thời giữa cũ và mới:
* **Temporary Adapters:** Dùng để bao bọc code cũ bằng interface mới hoặc ngược lại.
* **Transitional Wrappers:** Dùng để migrate dần các components phức tạp.
* **Rollback Value:** Nếu code mới lỗi, lớp adapter này giúp việc quay lại code cũ diễn ra trong vài giây.

---

## 5. Deprecated System Identification
Các đối tượng cần ưu tiên đưa vào danh sách Deprecation:
* **Duplicated Hooks:** Các hooks fetch dữ liệu trùng lặp.
* **Duplicated Auth Logic:** Logic check token nằm ngoài `AuthProvider`.
* **Legacy API Services:** Toàn bộ file `services/api.ts` (God Object).
* **Obsolete Components:** Các components UI cũ không tuân thủ Design System mới.
* **Dead Routes:** Các routes cũ đã được thay thế bởi App Router mới.

---

## 6. Dead Code Detection Rules
Nguyên tắc phát hiện "Code Chết":
* **Unused Imports:** Tự động dọn dẹp bằng linter/formatter.
* **Orphan Components:** Các file component không được import ở bất kỳ đâu.
* **Unused Hooks:** Custom hooks không còn consumer.
* **Stale Pages:** Các file trong `app/` đã bị comment-out hoặc bỏ trống.

---

## 7. Safe File Removal Rules
Trước khi thực hiện lệnh xóa (Delete), AI Agent **PHẢI** xác nhận:
* [ ] Không còn bất kỳ file nào import đối tượng này.
* [ ] Không có route nào phụ thuộc vào đối tượng này.
* [ ] Không có feature nào đang sử dụng logic này (kể cả ngầm định).
* [ ] `npm run build` thành công sau khi xóa.
* [ ] Các luồng Auth và Query vẫn hoạt động bình thường.

---

## 8. Auth Cleanup Rules (CRITICAL)
Auth là vùng cực kỳ nhạy cảm, việc dọn dẹp phải tuân thủ:
* **KHÔNG ĐƯỢC** xóa Auth fallback (cơ chế dự phòng) quá sớm.
* **KHÔNG ĐƯỢC** gỡ bỏ các lớp bảo vệ Hydration khi chưa ổn định luồng mới.
* **PHẢI** xác minh 100% luồng Redirect và Unauthorized Handling trước khi xóa logic cũ.

---

## 9. API Cleanup Rules
Quá trình dọn dẹp tầng API:
* **Remove Duplicate Clients:** Xóa bỏ dần các hàm trong `api.ts` sau khi đã chuyển sang `features/*/api`.
* **Preserve Query-Key Consistency:** Tuyệt đối không xóa logic cũ nếu nó làm hỏng tính nhất quán của Query Keys đang chạy.

**Ví dụ:** `services/api.ts` → Mark as `@deprecated` → Xóa dần từng method → Xóa file.

---

## 10. UI Cleanup Rules
* **Giant Component Breakup:** Chia nhỏ các file khổng lồ (như `DocumentDetailDrawer`) thành các sub-components.
* **Duplicate Modals:** Hợp nhất các Modals có chức năng tương tự.
* **Deprecated Props:** Thay thế các props lỗi thời của Ant Design.
* **Inconsistent Layouts:** Xóa bỏ các đoạn CSS/Inline-style gây sai lệch layout chung.

---

## 11. AI-Agent Cleanup Rules
**Luật dành cho AI Agents:**
* **KHÔNG ĐƯỢC** xóa code một cách hung hãn (aggressively delete).
* **KHÔNG ĐƯỢC** gỡ bỏ các đường lui (rollback paths) quá sớm.
* **PHẢI** giải thích rõ tác động của việc dọn dẹp (Cleanup Impact).
* **PHẢI** xác minh tất cả consumers đã được di dời thành công.

---

## 12. Cleanup Verification Checklist
Sau mỗi lần dọn dẹp:
* [ ] Build hệ thống ổn định (no errors).
* [ ] Luồng Auth không bị ảnh hưởng.
* [ ] Các Queries React Query không bị mất dữ liệu.
* [ ] Không có lỗi "File not found" do import sai đường dẫn cũ.
* [ ] Không có lỗi "Dead Navigation" (click vào menu không ra trang).

---

## 13. Technical Debt Burn-Down Strategy
Chiến lược "trả nợ" theo thứ tự:
1. **Low-risk-first:** Dọn dẹp các files rời rạc, ít dependency.
2. **Architecture Convergence:** Ưu tiên dọn dẹp để đưa hệ thống về đúng Target Architecture.
3. **Risk-based:** Chỉ xử lý các vùng rủi ro cao sau khi các vùng an toàn đã được migrate xong.

---

## 14. Final Architecture Convergence Rules
Một quá trình migration được coi là hoàn tất khi:
* Toàn bộ Legacy Systems đã được chuyển sang trạng thái Removed.
* Không còn bất kỳ tham chiếu nào đến các cấu trúc kiến trúc cũ.
* Hệ thống đạt được trạng thái Architecture Stability (Kiến trúc ổn định).

---
**Dọn dẹp là hành động bảo vệ tương lai của dự án.**
