import qrcode
import os
from pathlib import Path
from app.core.config import get_settings

# Cấu hình từ settings tập trung
settings = get_settings()
QR_DIR = settings.STORAGE_DIR / "qrcodes"

# Đảm bảo folder tồn tại
os.makedirs(QR_DIR, exist_ok=True)

async def generate_document_qr(qr_data: str, document_id: str) -> str:
    """
    qr_data: Nội dung link (URL) để mã hóa vào QR.
    document_id: Dùng làm tên file (UUID) để lưu xuống ổ cứng.
    """
    os.makedirs(QR_DIR, exist_ok=True)
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data) 
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    file_name = f"{document_id}.png"
    file_path = QR_DIR / file_name
    
    # Lưu xuống file (Path object của pathlib được hỗ trợ bởi PIL/qrcode)
    img.save(str(file_path))
    
    # Trả về đường dẫn tuyệt đối dạng chuỗi để lưu vào DB đồng bộ với file_path
    return str(file_path.resolve())