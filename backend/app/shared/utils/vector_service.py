import chromadb
from chromadb.utils import embedding_functions
import os

# Đường dẫn lưu trữ database vector local
CHROMA_DATA_PATH = "backend/storage/vector_db"
COLLECTION_NAME = "pbl5_documents"

# Khởi tạo client
client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)

# Sử dụng model đa ngôn ngữ cực nhẹ để chạy local mượt
# Model này hiểu được mối quan hệ giữa "nghỉ lễ" và "Tết"
embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)

# Lấy hoặc tạo mới collection
collection = client.get_or_create_collection(
    name=COLLECTION_NAME,
    embedding_function=embedding_func
)

async def add_document_to_vector_db(doc_id: str, text: str, metadata: dict):
    """Lưu văn bản vào bộ nhớ Vector"""
    try:
        collection.add(
            ids=[doc_id],
            documents=[text],
            metadatas=[metadata]
        )
        return True
    except Exception as e:
        print(f"Lỗi Vector DB: {e}")
        return False

async def search_semantic(query: str, n_results: int = 5):
    """Tìm kiếm theo ý nghĩa"""
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )
    return results