import os
import sys
from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from alembic import context
from dotenv import load_dotenv

# ==============================
# PATH CONFIG (QUAN TRỌNG NHẤT)
# ==============================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Thêm backend vào PYTHONPATH
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

# ==============================
# LOAD ENV
# ==============================

load_dotenv(os.path.join(BASE_DIR, ".env"))

db_url = os.getenv("DATABASE_URL")

if not db_url:
    raise Exception("❌ DATABASE_URL không tồn tại. Kiểm tra file .env")

print(f"✅ Database URL: {db_url[:30]}...")

# Nếu dùng asyncpg → đổi sang sync cho Alembic
if "asyncpg" in db_url:
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

# ==============================
# ALEMBIC CONFIG
# ==============================

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Gán URL cho Alembic (KHÔNG phụ thuộc alembic.ini)
config.set_main_option("sqlalchemy.url", db_url)

# ==============================
# IMPORT MODELS
# ==============================

from app.db.base import Base
from app.modules.documents.models import Document
from app.modules.users.models import User

target_metadata = Base.metadata

# ==============================
# OFFLINE MODE
# ==============================

def run_migrations_offline():
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,   # 👈 detect thay đổi column type
    )

    with context.begin_transaction():
        context.run_migrations()

# ==============================
# ONLINE MODE
# ==============================

def run_migrations_online():
    connectable = create_engine(
        db_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # 👈 detect thay đổi schema
        )

        with context.begin_transaction():
            context.run_migrations()

# ==============================
# RUN
# ==============================

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()