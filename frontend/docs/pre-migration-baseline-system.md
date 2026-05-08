# PRE-MIGRATION BASELINE SYSTEM
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** OFFICIAL RUNTIME SNAPSHOT PROTOCOL
**Purpose:** Regression Detection & Stability Preservation

---

## 1. Core Baseline Philosophy
Chúng ta không thể bảo toàn những gì chúng ta không đo lường được:
* **Migration Safety Requires Baseline Visibility:** Sự an toàn của việc di dời phụ thuộc vào việc chúng ta có nhìn thấy sự thay đổi của runtime hay không.
* **Runtime Behavior Over Code Elegance:** Hành vi thực tế của ứng dụng khi chạy quan trọng hơn vẻ đẹp của mã nguồn.
* **Visual Regressions Matter:** Các thay đổi về giao diện (dù nhỏ) cũng cần được ghi nhận.
* **Auth Regressions Must Be Detectable Immediately:** Lỗi liên quan đến xác thực phải được phát hiện ngay lập tức.

---

## 2. Official Baseline Categories
Chúng ta cần Snapshot các hạng mục sau trước khi thực thi Migration:
* **Routes:** Tất cả các đường dẫn có thể truy cập.
* **Auth Lifecycle:** Luồng login, logout và bảo vệ route.
* **Loading States:** Giao diện chờ của các trang.
* **UI Components:** Modals, Drawers, Tables, Pagination.
* **API & Query:** Các request gửi đi và cách thức cache dữ liệu.
* **Console Warnings:** Các cảnh báo hiện tại (Hydration, Deprecation).
* **Hydration Behavior:** Cách thức trang web hiển thị lần đầu.

---

## 3. Route Baseline Checklist
Ghi nhận danh sách các route chính và hành vi của chúng:
* `/login`: Trang đăng nhập.
* `/dashboard`: Trang tổng quan.
* `/repository`: Trang danh sách tài liệu.
* `/profile`: Trang cá nhân.
* `/search`: Trang tìm kiếm.
* `/users`: Trang quản lý người dùng (nếu có).

**Yêu cầu:** Ghi lại route nào được bảo vệ, route nào redirect về đâu khi chưa login.

---

## 4. Auth Runtime Baseline
Snapshot luồng xác thực:
* **Login flow:** Thời gian phản hồi, UI chuyển đổi.
* **Logout flow:** Dữ liệu có được xóa sạch không?
* **Token behavior:** Refresh token và xử lý khi token hết hạn.
* **Flicker check:** Có bị chớp màn hình trắng khi load trang Dashboard không?
* **Redirect loops:** Có bị đẩy vòng quanh các trang không?

---

## 5. UI Snapshot Strategy
Capture trạng thái giao diện hiện tại:
* **Dashboard:** Bố cục Bento, các chỉ số stats.
* **Repository:** Bảng danh sách, phân trang, các nút action.
* **Modals/Drawers:** Giao diện khi mở, khi đang submit, khi báo lỗi.
* **Empty/Error States:** Giao diện khi không có dữ liệu hoặc API lỗi.

---

## 6. API & Query Baseline
* **Network Tab:** Ghi lại số lượng request khi load trang. Phát hiện các request trùng lặp (Duplicate calls).
* **React Query:** Xem trạng thái cache trong DevTools. Invalidation diễn ra khi nào?
* **Retry behavior:** API tự động gọi lại bao nhiêu lần khi lỗi?

---

## 7. Console & Runtime Warning Baseline
Ghi lại "hiện trạng" lỗi trong Console:
* Các lỗi Hydration hiện có.
* Các cảnh báo `deprecated` của Ant Design.
* Các React warnings về keys hoặc props.
* **Mục tiêu:** Để đảm bảo sau migration, số lượng cảnh báo không tăng lên.

---

## 8. Performance Observation Baseline
Quan sát cảm quan về tốc độ:
* Tốc độ mở Modal/Drawer.
* Độ mượt của phân trang (Pagination).
* Thời gian chờ từ lúc click Login đến khi vào được Dashboard.

---

## 9. Migration Checkpoint System
Sau mỗi lượt Migration, AI Agent phải thực hiện so sánh:
1. So sánh hành vi Route.
2. So sánh hành vi Auth.
3. So sánh số lượng Console warnings.
4. So sánh UI snapshots (nếu có thể).
5. So sánh hành vi gọi API.

---

## 10. Recommended Snapshot Artifacts
Lưu trữ các baseline tại `docs/baselines/`:
* `routes.md`: Danh sách routes và quyền truy cập.
* `auth.md`: Mô tả luồng auth hiện tại.
* `console-warnings.md`: Chụp màn hình hoặc log các warnings hiện có.

---

## 11. AI-Agent Verification Rules
**AI Agent PHẢI:**
* Đối chiếu hành vi sau refactor với Baseline.
* Báo cáo ngay lập tức nếu phát hiện Regression (Sự thụt lùi).
* Tuyệt đối không giả định rằng "code chạy là behavior không đổi".

---

## 12. Regression Classification
Phân loại các lỗi thụt lùi:
* **Critical Regression:** App crash, Auth vỡ, Route không vào được.
* **Auth Regression:** Token không lưu, logout không sạch.
* **UI Regression:** Sai lệch layout, mất loading state.
* **Query Regression:** Request trùng lặp, cache không update.
* **Console Regression:** Phát sinh thêm lỗi Hydration mới.

---

## 13. Rollback Decision Rules
Yêu cầu Rollback ngay lập tức nếu:
* Luồng Auth không ổn định.
* Các routes chính bị hỏng.
* Xuất hiện vòng lặp Redirect.
* Xuất hiện các lỗi Hydration nghiêm trọng gây sai lệch giao diện.

---

## 14. Recommended Baseline Workflow
1. **Capture Baseline:** Ghi nhận hiện trạng.
2. **Perform Migration:** Thực hiện di dời code.
3. **Compare Behavior:** So sánh thực tế.
4. **Verify Regressions:** Xác minh các lỗi phát sinh.
5. **Approve/Rollback:** Phê duyệt hoặc quay lại.

---

## 15. Success Criteria
Hệ thống Baseline được coi là hoàn thiện khi:
* ✅ Các luồng nghiệp vụ quan trọng đã được tài liệu hóa.
* ✅ Hành vi Auth có thể đo lường và so sánh được.
* ✅ Các lỗi Console hiện có đã được "điểm mặt chỉ tên".
* ✅ Bất kỳ sự thụt lùi nào cũng được phát hiện sớm trước khi Merge.

---
**Chỉ khi có một điểm tựa ổn định, chúng ta mới có thể bẩy cả hệ thống lên.**
