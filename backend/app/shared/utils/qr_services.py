import qrcode
import os
from pathlib import Path

# Đường dẫn đến folder storage/qrcodes
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
QR_DIR = os.path.join(BASE_DIR, "storage", "qrcodes")

# Đảm bảo folder tồn tại
os.makedirs(QR_DIR, exist_ok=True)

async def generate_document_qr(qr_data: str, document_id: str):
    """
    qr_data: Nội dung link (URL) để mã hóa vào QR.
    document_id: Dùng làm tên file (UUID) để lưu xuống ổ cứng (tránh kí tự đặc biệt).
    """
    os.makedirs(QR_DIR, exist_ok=True)
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data) # Mã hóa URL vào đây
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # CHỈ DÙNG ID làm tên file (Windows sẽ không báo lỗi nữa)
    file_name = f"{document_id}.png"
    file_path = os.path.join(QR_DIR, file_name)
    img.save(file_path)
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_data) # Nạp URL vào đây
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(file_path)
    return f"/storage/qrcodes/{file_name}"