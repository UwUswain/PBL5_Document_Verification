from pathlib import Path
from typing import Union, Optional

def normalize_path(p: Union[str, Path, None]) -> Optional[str]:
    """
    Chuyển đổi bất kỳ đối tượng đường dẫn nào về dạng chuỗi tuyệt đối (str).
    Đảm bảo tính tương thích 100% với SQLAlchemy và asyncpg.
    """
    if p is None:
        return None
    return str(Path(p).resolve())
