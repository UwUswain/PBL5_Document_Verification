---
name: fastapi-ocr-yolov8
description: Build and debug FastAPI services that run document AI pipelines using PaddleOCR (text detection/recognition) and YOLOv8 (object detection/segmentation). Use when the user mentions FastAPI, OpenAPI, routers, dependencies, PaddleOCR, OCR, Ultralytics, YOLOv8, inference, training, exporting models, or integrating OCR/vision into an API.
---

# FastAPI + PaddleOCR + YOLOv8

## Scope and defaults

- **Goal**: help implement a reliable API around OCR + detection, using official docs for FastAPI, PaddleOCR, and YOLOv8.
- **Default assumptions** (adjust if repo shows otherwise):
  - Python backend
  - CPU-safe by default
  - Stateless HTTP API with optional async/background processing
  - Model loading is expensive; reuse instances across requests

## Workflow

### 1) Identify the request/response contract first

- Prefer **Pydantic models** for request/response schemas.
- Decide input form:
  - **File upload** (`multipart/form-data`) for images/PDFs
  - **URL input** (`{"url": "..."}`) if the service fetches media
  - **Base64** only if necessary (heavier + error-prone)
- Decide output structure:
  - raw OCR boxes + text + confidence
  - YOLO detections (bbox, class, confidence)
  - merged “document fields” if there is post-processing

### 2) Follow FastAPI structure patterns

- Use `APIRouter` per module and include it from the app entrypoint.
- Keep “thin routers”: validation + calling a service layer.
- Use dependencies for cross-cutting concerns:
  - auth, settings, db sessions, rate limiting
- For long-running jobs, consider:
  - async task queue (preferred in production)
  - or `BackgroundTasks` for simple cases

### 3) Model lifecycle: load once, reuse safely

- Load PaddleOCR and YOLO models once at startup (or lazy-init with a lock).
- Avoid creating model objects per request.
- Keep inference code in a **service** module with a small API:
  - `run_ocr(image) -> ocr_result`
  - `run_yolo(image) -> det_result`
  - `merge_results(ocr_result, det_result) -> response_payload`

### 4) Media handling (common pitfalls)

- Normalize images to a consistent format early:
  - decode bytes → numpy/PIL
  - ensure RGB/BGR expectations match the library used
- If PDFs are involved:
  - split into pages (rasterize) before OCR/detection
  - be explicit about DPI
- Validate size limits; reject huge payloads early.

### 5) When something breaks, diagnose systematically

- **Import / dependency errors**: confirm package names and entrypoints from official docs.
- **Slow inference / timeouts**:
  - confirm models are not reloaded per request
  - cap input resolution
  - add basic timing logs around decode → OCR → YOLO → postprocess
- **Wrong boxes / rotated text**:
  - check image orientation (EXIF)
  - confirm PaddleOCR language/model config
- **YOLO output mismatch**:
  - confirm model task (detect/segment/classify)
  - confirm confidence/IoU thresholds

## How to use the official docs effectively

- Treat documentation as the source of truth for:
  - FastAPI: routing, dependency injection, request forms, response models, OpenAPI behavior
  - PaddleOCR: supported inference APIs, model selection, expected input formats, CPU/GPU notes
  - YOLOv8: `ultralytics` usage, predictor outputs, training/inference/export flags

## Implementation guidance (high signal)

### FastAPI endpoint patterns to prefer

- For upload OCR:
  - `POST /ocr` with `UploadFile`
- For combined pipeline:
  - `POST /analyze` returning a typed response model
- Return clear error codes:
  - 400 invalid input
  - 413 payload too large
  - 422 validation errors (FastAPI default)
  - 500 only for unexpected failures

### Concurrency / async notes

- FastAPI endpoints can be `async def`, but most ML inference is CPU/GPU bound:
  - run sync inference in a threadpool if needed (or keep endpoints sync)
- Protect non-thread-safe model calls if the library requires it:
  - single shared instance + lock
  - or per-worker process (gunicorn/uvicorn workers)

## Additional resources

- For curated links and quick-check snippets, see [reference.md](reference.md).
