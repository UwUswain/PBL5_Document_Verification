---
description: 
---

# PROJECT: PBL5 - AI DOCUMENT CLASSIFICATION (SOLO)
- Tech Stack: FastAPI, PostgreSQL (SQLAlchemy), YOLOv8, PaddleOCR, Gemini 3.1 API, Pydantic.

# DATABASE ARCHITECTURE (Based on PBL-DB)
- Primary Key: Luôn sử dụng UUID cho bảng `documents`.
- Auth: Hệ thống phân quyền Role-based (ADMIN/USER). Khi viết API, chú ý lọc dữ liệu theo `owner_id`.
- Model Schema: Bảng documents gồm các trường: id(UUID), owner_id, file_name, sha256_hash, raw_text, ai_results(JSON), status, created_at.

# CORE BUSINESS LOGIC (Pipeline)
1. Integrity First: Mọi file upload PHẢI được tính SHA-256 hash ngay lập tức. Check hash trong DB trước khi xử lý để tránh trùng lặp tài liệu.
2. AI Orchestration: Tách biệt logic theo luồng: Router -> Orchestrator -> Service.
3. Model Loading: Sử dụng Singleton Pattern cho YOLOv8 Model Loader để tối ưu RAM, weights nằm tại `@weights/best.pt`.
4. AI Flow: YOLO (Detect signature/seal) -> PaddleOCR (Extract text) -> Gemini (Classify & Summarize).

# GOAL
- Xây dựng hệ thống Production-ready, code sạch, dễ dàng scale lên Web với React/Next.js sau này.