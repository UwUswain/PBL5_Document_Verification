import qrcode
import os
from pathlib import Path

# Đường dẫn đến folder storage/qrcodes
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent # Trỏ về folder backend
QR_DIR = os.path.join(BASE_DIR, "storage", "qrcodes")

# Đảm bảo folder tồn tại
os.makedirs(QR_DIR, exist_ok=True)

async def generate_document_qr(document_id: str):
    """
    Tạo mã QR chứa link xác thực tài liệu.
    """
    # Link này sau này sẽ trỏ về trang Verify của bro
    # Tạm thời để localhost để demo trên máy
    verify_url = f"http://192.168.100.236:8000/api/docs/verify/{document_id}"    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(verify_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # Lưu file với tên là ID của Document
    file_name = f"{document_id}.png"
    file_path = os.path.join(QR_DIR, file_name)
    img.save(file_path)
    
    # Trả về đường dẫn để hiển thị lên Web
    return f"/storage/qrcodes/{file_name}"