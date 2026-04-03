from PIL import Image
import os

class QRProcessor:
    @staticmethod
    async def overlay_qr_on_document(document_path: str, qr_relative_path: str):
        """
        Chèn mã QR vào góc dưới bên phải của văn bản gốc.
        """
        # Chuyển path relative sang path tuyệt đối để Pillow đọc được
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        qr_full_path = os.path.join(base_dir, qr_relative_path.lstrip('/'))
        
        # Mở ảnh gốc và ảnh QR
        doc_img = Image.open(document_path).convert("RGBA")
        qr_img = Image.open(qr_full_path).convert("RGBA")

        # Resize QR cho vừa phải (ví dụ 1/10 chiều rộng văn bản)
        width, height = doc_img.size
        qr_size = int(width * 0.15) 
        qr_img = qr_img.resize((qr_size, qr_size))

        # Tính toán vị trí (góc dưới bên phải, cách lề 50px)
        position = (width - qr_size - 50, height - qr_size - 50)

        # Dán QR lên
        doc_img.paste(qr_img, position, qr_img)
        
        # Lưu đè lên file gốc hoặc lưu file mới tùy bro
        doc_img.convert("RGB").save(document_path)
        return document_path