# Reference: FastAPI + PaddleOCR + YOLOv8

## Official docs

- FastAPI: `https://fastapi.tiangolo.com/`
- PaddleOCR (GitHub): `https://github.com/PaddlePaddle/PaddleOCR`
- YOLOv8 / Ultralytics: `https://docs.ultralytics.com/`

## What to look up quickly

### FastAPI

- Routers: `APIRouter`, `include_router`
- Dependency injection: `Depends`
- File uploads: `UploadFile`, `File`, `Form`
- Response schemas: `response_model=...`, `BaseModel`
- Background jobs: `BackgroundTasks`
- Error handling: `HTTPException`, validation errors, status codes
- Concurrency guidance (async endpoints vs sync work)

### PaddleOCR

- How to instantiate `PaddleOCR` (language/model selection)
- Expected input formats (path vs numpy vs PIL)
- Output structure (boxes, text, confidence)
- Angle classification / rotated text options
- CPU/GPU setup notes and performance tips

### YOLOv8 (Ultralytics)

- Inference API for `ultralytics.YOLO` and what a “results” object contains
- Threshold knobs: confidence, IoU/NMS, image size
- Tasks: detect vs segment vs classify
- Export options (e.g., ONNX/TensorRT) and constraints

## Integration notes (common gotchas)

- Keep model instances warm (don’t reload per request).
- Normalize image color order consistently (RGB/BGR) before mixing libraries.
- Be explicit about coordinate systems and units when merging OCR boxes and YOLO boxes.
- If serving in production, prefer multiple worker processes over heavy multithreading for CPU-bound inference, unless the underlying libraries are known thread-safe in your setup.
