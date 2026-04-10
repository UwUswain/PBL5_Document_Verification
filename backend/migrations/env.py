import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# 1. Thêm đường dẫn để Python tìm thấy folder 'app'
sys.path.append(os.getcwd())

# 2. Load biến môi trường
load_dotenv()

# 3. Cấu hình Logging (ghi nhật ký lỗi)
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 4. Import Base và Models (Sửa lại cho đúng folder modules)
from app.db.base import Base 
# Sửa dòng này cho khớp với file models.py của bro
from app.modules.documents.models import Document 
# Nếu có bảng User thì import luôn để Alembic thấy hết metadata
from app.modules.users.models import User

target_metadata = Base.metadata

# 5. Cấu hình Database URL từ .env
db_url = os.getenv("DATABASE_URL")
# Alembic chạy đồng bộ nên nếu URL là asyncpg, ta chuyển sang psycopg2
if db_url and "asyncpg" in db_url:
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
config.set_main_option("sqlalchemy.url", db_url)

def run_migrations_offline() -> None:
    """Chạy migration ở chế độ offline (không cần kết nối DB trực tiếp)"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Chạy migration ở chế độ online (kết nối trực tiếp DB)"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()