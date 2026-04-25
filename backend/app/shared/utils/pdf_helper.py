import os
import uuid
from pdf2image import convert_from_path
from pathlib import Path

def handle_pdf_to_image(file_path: str, storage_dir: str) -> str:
    """
    Gatekeeper: Chuyển đổi PDF sang ảnh JPG (chỉ trang đầu) nếu là file PDF.
    Giúp YOLO và Gemini Vision có thể xử lý nội dung PDF trực quan hơn.
    """
    # 1. Kiểm tra nếu không phải PDF thì trả về đường dẫn gốc
    if not file_path.lower().endswith('.pdf'):
        return file_path

    try:
        # 2. Tạo thư mục chứa ảnh preview của PDF
        temp_dir = Path(storage_dir) / "pdf_previews"
        temp_dir.mkdir(parents=True, exist_ok=True)

        # 3. Chuyển đổi trang đầu tiên
        # Lưu ý: Nếu Poppler chưa được thêm vào System PATH, bạn có thể truyền thêm 
        # tham số poppler_path vào hàm convert_from_path bên dưới.
        images = convert_from_path(
            file_path, 
            first_page=1, 
            last_page=1,
            fmt="jpeg"
        )

        if images:
            # 4. Lưu ảnh với tên UUID duy nhất để tránh trùng lặp
            image_name = f"pdf_ref_{uuid.uuid4().hex}.jpg"
            output_path = temp_dir / image_name
            
            images[0].save(str(output_path), "JPEG", quality=95)
            
            print(f"✅ [PDF Gatekeeper] Đã rasterize trang đầu PDF sang: {output_path}")
            return str(output_path)
            
    except Exception as e:
        print(f"⚠️ [PDF Gatekeeper] Cảnh báo: Không thể convert PDF ({e})")
        # Nếu lỗi (vd: thiếu Poppler), trả về file gốc để các module AI tự xử lý fallback
        return file_path
        
    return file_path
