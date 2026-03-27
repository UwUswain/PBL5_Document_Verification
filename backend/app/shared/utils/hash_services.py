import hashlib

async def calculate_sha256(file_content: bytes) -> str:
    """
    Tính toán mã vân tay SHA-256 cho tài liệu.
    Đảm bảo tính toàn vẹn cho đồ án PBL5.
    """
    sha256_hash = hashlib.sha256()
    sha256_hash.update(file_content)
    return sha256_hash.hexdigest()