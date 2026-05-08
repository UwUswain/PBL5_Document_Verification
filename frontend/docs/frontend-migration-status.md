# FRONTEND MIGRATION STATUS
**Project:** PBL5 Document Verification (NextJS App Router)
**Status:** ACTIVE TRACKER
**Last Updated:** 2026-05-08

---

## 1. Migration Overview
Báo cáo tổng quát về tiến độ chuyển đổi kiến trúc hệ thống Frontend:

* **Current Architecture Maturity:** 15% (Legacy / High Debt)
* **Migration Progress:** 5% (Giai đoạn thiết lập Governance)
* **Critical Risks:** Auth Race Condition, Duplicate Data Sources.
* **Stabilization Status:** Cần ưu tiên ổn định luồng Auth (Phase 1).
* **Overall Frontend Health:** Khá (Chạy được nhưng khó bảo trì và dễ lỗi runtime).

---

## 2. Current Refactor Phase
Hệ thống đang ở giai đoạn chuẩn bị và bắt đầu thực thi Phase đầu tiên.

* **Current Phase:** Phase 1 — Auth Stabilization
* **Current Migration Objective:** Đồng bộ hóa Auth Source of Truth, fix hydration race condition.
* **Current Highest Priority:** Refactor `AuthProvider.tsx` và `services/api.ts`.
* **Current Blockers:** Chưa có.
* **Current Risky Systems:** Luồng Login/Logout và Redirect logic.

---

## 3. Global Migration Progress Tracker
Bảng theo dõi tiến độ các giai đoạn chuyển đổi:

| Phase | Status | Progress | Risk Level | Dependencies | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0: Freeze & Governance** | ✅ Completed | 100% | Low | None | Pass |
| **P1: Auth Stabilization** | 🏃 In Progress | 0% | High | P0 | Pending |
| **P2: API Layer Refactor** | ⏳ Pending | 0% | Medium | P1 | Pending |
| **P3: Auth Feature Refactor** | ⏳ Pending | 0% | High | P2 | Pending |
| **P4: Profile & Users Migration** | ⏳ Pending | 0% | Medium | P3 | Pending |
| **P5: Documents Migration** | ⏳ Pending | 0% | High | P4 | Pending |
| **P6: UI Cleanup** | ⏳ Pending | 0% | Low | P5 | Pending |
| **P7: Dead Code Removal** | ⏳ Pending | 0% | Low | P6 | Pending |

---

## 4. Feature Migration Tracker
Trạng thái di dời của các tính năng nghiệp vụ:

| Feature | Status | Architecture | Query Status | UI Cleanup | Tech Debt | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | Legacy | Inconsistent | Manual Fetch | Low | High | Unstable |
| **Documents** | Legacy | Monolithic | Manual Fetch | Low | High | Pending |
| **Users** | Legacy | Scattered | Mixed | Low | Medium | Pending |
| **Dashboard** | Legacy | Monolithic | Manual Fetch | Low | High | Pending |
| **Repository** | Legacy | Monolithic | Manual Fetch | Low | High | Pending |
| **Search** | Legacy | Monolithic | Manual Fetch | Low | High | Pending |
| **Profile** | Legacy | Scattered | Duplicate Query | Low | Medium | Pending |

---

## 5. Auth Stabilization Status
* **Hydration Stability:** ❌ Unstable (Cần fix trong Phase 1)
* **Redirect Stability:** ⚠️ Partially Stable (Race conditions)
* **Token Lifecycle Stability:** ❌ Unstable (Duplicate logic)
* **Unauthorized Handling:** ⚠️ Partially Stable (Hard reload)
* **Logout Cleanup:** ⚠️ Partially Stable (Manual cleanup)
* **Duplicate Auth Removal:** ❌ Pending

---

## 6. API & Server-State Migration Status
* **apiClient Migration:** ⏳ Pending (Sẽ tạo `lib/apiClient.ts`)
* **Feature API Extraction:** ⏳ Pending
* **React Query Adoption:** ⚠️ Low (Mới chỉ dùng ở vài trang, chưa có quy chuẩn)
* **Duplicated Fetching Removal:** ❌ Pending
* **Query-Key Normalization:** ❌ Pending
* **Invalidation Stability:** ❌ Pending

---

## 7. UI Architecture Migration Status
* **Shared UI Cleanup:** ⏳ Pending (Chưa có `components/ui`)
* **Modal Consistency:** ❌ Low
* **Table Consistency:** ❌ Low
* **Loading State Consistency:** ❌ Low
* **Deprecated AntD Props:** ⚠️ High (Cần dọn dẹp)
* **Giant Component Cleanup:** ❌ Pending (VD: DocumentDetailDrawer)

---

## 8. Technical Debt Tracker
Danh sách các khoản nợ kỹ thuật ưu tiên xử lý:

| Item | Severity | Impact | Migration Priority |
| :--- | :--- | :--- | :--- |
| **Duplicate `getProfile` calls** | High | Performance/Consistency | High (Phase 1) |
| **Scattered `localStorage` access** | Medium | Maintainability | High (Phase 1) |
| **God Object `services/api.ts`** | High | Scalability | High (Phase 2) |
| **Mixed Smart/Dumb UI** | Medium | Reusability | Medium (Phase 5) |
| **Deprecated AntD Props** | Low | UI Stability | Low (Phase 6) |

---

## 9. AI Refactor Session Rules
Mỗi phiên làm việc (Session) của AI Agent **BẮT BUỘC** phải:
1. Xác định Feature/Phase đang thao tác.
2. Cập nhật bảng Migration Status sau khi hoàn thành.
3. Ghi lại các rủi ro mới phát sinh (nếu có).
4. Đảm bảo đã cập nhật các tài liệu kiến trúc liên quan.

---

## 10. Verification Status
* **Build Stability:** ✅ Passing
* **Auth Stability:** ⚠️ Unstable
* **Route Stability:** ✅ Passing
* **Query Stability:** ❌ Pending
* **UI Stability:** ⚠️ Partially Consistent
* **Runtime Stability:** ✅ Passing (no crashes)

---

## 11. Known Risks & Blockers
* **Dangerous Systems:** `AuthProvider.tsx` (Dễ gây loop redirect).
* **Unstable Areas:** Luồng đồng bộ thông tin User giữa Profile Page và Navbar.
* **Pending Migrations:** Toàn bộ API Client chưa được cấu trúc lại.

---

## 12. Recommended Next Actions
1. **Bắt đầu Phase 1:** Refactor `AuthProvider.tsx` để ổn định Hydration.
2. **Chuẩn hóa Token Utility:** Tạo `lib/auth.ts` để quản lý localStorage duy nhất.
3. **Cấu trúc lại `services/api.ts`:** Chuẩn bị tách sang `lib/apiClient.ts`.

---

## 13. Final Architecture Readiness Score
* **Auth Maturity:** 2/10
* **Feature Isolation:** 1/10
* **API Governance:** 1/10
* **UI Consistency:** 4/10
* **Scalability:** 3/10
* **AI-Governance Readiness:** 9/10 (Nhờ bộ tài liệu vừa thiết lập)

---
*Bảng theo dõi này sẽ được cập nhật liên tục sau mỗi bước di dời.*
