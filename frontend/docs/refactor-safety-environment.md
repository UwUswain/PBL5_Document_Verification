# REFACTOR SAFETY ENVIRONMENT
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** ARCHITECTURE GUARDRAILS
**Focus:** Enforcing Boundaries & Preventing Architecture Drift

---

## 1. Core Safety Philosophy
* **Architecture Safety Over Migration Speed:** Sự an toàn của cấu trúc quan trọng hơn tốc độ di dời. Một bước đi sai lầm trong import có thể dẫn đến nợ kỹ thuật lâu dài.
* **Constrained Refactor is Safer:** Refactor trong một phạm vi bị giới hạn (constrained) luôn an toàn hơn là thay đổi tự do.
* **Predictable Imports:** Mọi đường dẫn import phải phản ánh đúng quyền sở hữu và cấu trúc thư mục.
* **Feature Isolation First:** Ưu tiên hàng đầu là cô lập các tính năng (features), biến chúng thành các hộp đen (black boxes).
* **AI Must Operate Inside Boundaries:** AI Agent phải hoạt động trong khuôn khổ các quy tắc này, không được lách luật import.

---

## 2. Official Path Alias Strategy
Sử dụng các bí danh đường dẫn (Path Aliases) để làm sạch code và quản lý quyền sở hữu:
* `@/features/*`: Điểm đến của mọi business logic.
* `@/components/*`: Chứa các UI primitives dùng chung.
* `@/lib/*`: Hạ tầng và tiện ích cốt lõi.
* `@/types/*`: Định nghĩa kiểu dữ liệu toàn cục.
* `@/constants/*`: Các hằng số dùng chung.

**Mục tiêu:** Loại bỏ các đường dẫn tương đối sâu (`../../../../`) gây khó khăn khi audit dependency.

---

## 3. Import Governance Rules
**QUY TẮC CHO PHÉP:**
* `Shared Layer (@/lib, @/components/ui)` → `Features`.
* `Features` → `App Router (app/*)`.
* `Types/Constants` → `Toàn bộ dự án`.

**QUY TẮC CẤM:**
* **Feature A → Feature B:** Tuyệt đối không import trực tiếp giữa các feature. Nếu cần xài chung, hãy đẩy logic xuống Shared Layer.
* **Circular Dependencies:** Không tạo ra vòng lặp import (A gọi B, B gọi A).
* **Hidden Cross-feature Imports:** Không import lén lút thông qua các file trung gian.

---

## 4. Feature Isolation Rules
Mỗi Feature phải là một thực thể tự cung tự cấp (Self-contained):
* **Sở hữu:** Local business logic, local hooks, local API clients, local components.
* **Cấm:** Không được phép can thiệp (mutate) vào dữ liệu nội bộ của feature khác. Không lách qua ranh giới feature để gọi API trực tiếp.

---

## 5. Shared Layer Governance
Định nghĩa những gì thuộc về tầng dùng chung (Shared Layer):
* **`components/ui/`:** Các components thuần giao diện, không mang logic nghiệp vụ.
* **`lib/`:** Các utilities (format, validation) và hạ tầng (apiClient).
* **`types/` & `constants/`:** Các định nghĩa dùng chung cho toàn bộ domain.
* **Lưu ý:** Nếu một thứ chỉ dùng cho 1 feature, nó **PHẢI** nằm ở feature đó, không được đẩy lên Shared Layer.

---

## 6. Anti-Circular Dependency Strategy
* **Dependency Direction:** Luôn đi từ ngoài vào trong hoặc từ trên xuống dưới theo phân cấp.
* **Feature Independence:** Mỗi feature phải có khả năng hoạt động độc lập hoặc chỉ phụ thuộc vào Shared Layer.
* **Ví dụ:**
  * `Feature A` → `Shared Layer` (Hợp lệ ✅)
  * `Feature A` → `Feature B` (Vi phạm ❌)

---

## 7. Page Boundary Rules
Tệp `page.tsx` trong `app/` là ranh giới định tuyến:
* **Nhiệm vụ:** Lắp ghép các Feature Components.
* **KHÔNG ĐƯỢC PHÉP:** Nắm giữ trạng thái (state) khổng lồ, chứa logic gọi API hoặc các quy tắc nghiệp vụ phức tạp.

---

## 8. Provider Governance
Quản lý các tầng cung cấp dữ liệu (Providers):
* **Global Stability:** Providers phải ổn định và bao quát toàn app.
* **Cấm:** Tạo ra quá nhiều providers đặc thù cho từng feature ở cấp global. Không nhân bản hệ thống quản lý Auth hay Query.

---

## 9. AI-Agent Safety Constraints
**AI Agent KHÔNG ĐƯỢC:**
* Di chuyển file khi chưa audit toàn bộ các tham chiếu (dependency audit).
* Tạo ra các liên kết ngầm (hidden coupling) giữa các feature.
* Tự ý tạo thêm các stores quản lý state trùng lặp.

**AI Agent PHẢI:**
* Giải thích tác động đến cây phụ thuộc (dependency graph) trước khi sửa code.
* Xác minh tính ổn định của import sau khi refactor.

---

## 10. ESLint & Static-Analysis Recommendations
Đề xuất cấu hình để tự động hóa việc bảo vệ ranh giới:
* **Import Order:** Sắp xếp import theo nhóm (External, Internal, Feature, Relative).
* **No Relative Parent Import:** Cấm dùng `../` vượt quá ranh giới thư mục mẹ.
* **Circular Dependency Detection:** Sử dụng plugin để phát hiện vòng lặp import.
* **Feature Boundary Linting:** Cấm import từ `features/A/*` vào `features/B/*`.

---

## 11. Runtime Safety Verification
Sau mỗi lượt di dời:
* [ ] Hệ thống build không lỗi.
* [ ] Các đường dẫn import được giải quyết chính xác.
* [ ] Định tuyến (Routing) hoạt động bình thường.
* [ ] Luồng Auth và Query không bị ảnh hưởng.
* [ ] Không phát sinh lỗi Hydration do import sai Component Client/Server.

---

## 12. Recommended tsconfig Strategy
* **Strict Mode:** Luôn bật để bắt lỗi type sớm.
* **Path Aliases:** Cấu hình đầy đủ trong `tsconfig.json` và `next.config.js`.
* **Module Boundaries:** Sử dụng `baseUrl` để ổn định việc phân giải module.

---

## 13. Recommended Folder Ownership Model
* **`features/documents/*`**: Thuộc sở hữu tuyệt đối của team/logic Document.
* **`components/ui/*`**: Thuộc sở hữu chung (Shared UI Ownership), bất kỳ ai cũng có thể dùng nhưng không ai được nhúng business logic vào.

---

## 14. High-Risk Refactor Patterns
Cảnh giác với các mẫu refactor nguy hiểm:
* Di chuyển các file lớn mà không dùng công cụ refactor của IDE.
* Lạm dụng "Barrel exports" (`index.ts`) gây lỗi circular dependency khó tìm.
* Sử dụng trạng thái dùng chung (shared mutable state) giữa hai features.
* Gọi API chéo giữa các features.

---

## 15. Exit Criteria
Môi trường refactor được coi là sẵn sàng khi:
* ✅ Toàn bộ Path Aliases đã được chuẩn hóa.
* ✅ Quy tắc Import được thiết lập và linter đã sẵn sàng.
* ✅ Ranh giới các feature (Feature Boundaries) đã được xác định rõ ràng.
* ✅ AI Agent đã nắm rõ các ràng buộc thực thi (Constraints).

---
**Hàng rào kỹ thuật vững chắc là sự bảo đảm cho một kiến trúc sạch.**
