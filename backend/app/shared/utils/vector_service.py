import os
import time
import asyncio
import chromadb
from chromadb.utils import embedding_functions

# --- FIX LỖI DLL CHO WINDOWS ---
def load_torch_dlls():
    try:
        import torch
        torch_lib_path = os.path.join(os.path.dirname(torch.__file__), "lib")
        if os.path.exists(torch_lib_path):
            os.add_dll_directory(torch_lib_path)
    except Exception:
        pass

load_torch_dlls()

# --- CẤU HÌNH SINGLETON ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CHROMA_DATA_PATH = os.path.join(BASE_DIR, "storage", "vector_db")
COLLECTION_NAME = "pbl5_documents"

_client = None
_collection = None
_bi_encoder = None
_cross_encoder = None

def get_bi_encoder():
    """Bi-Encoder để tạo Vector Embedding (384-dim)"""
    global _bi_encoder
    if _bi_encoder is None:
        print("🧠 [Model] Loading Bi-Encoder (MiniLM-L12)...")
        _bi_encoder = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="paraphrase-multilingual-MiniLM-L12-v2"
        )
    return _bi_encoder

def get_cross_encoder():
    """Cross-Encoder để Rerank kết quả (Surgical Accuracy)"""
    global _cross_encoder
    if _cross_encoder is None:
        from sentence_transformers import CrossEncoder
        print("🚀 [Model] Loading Local Cross-Encoder (Reranker)...")
        # Model này cực nhẹ và chuyên dụng cho việc xếp hạng lại
        _cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512)
    return _cross_encoder

def get_collection():
    global _collection, _client
    if _collection is None:
        try:
            os.makedirs(CHROMA_DATA_PATH, exist_ok=True)
            if _client is None:
                _client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
            
            _collection = _client.get_or_create_collection(
                name=COLLECTION_NAME,
                embedding_function=get_bi_encoder()
            )
        except Exception as e:
            print(f"❌ [Chroma] Error: {e}")
            return None
    return _collection

async def search_semantic_ids(query: str, n_results: int = 25) -> list[tuple[str, float]]:
    """Stage 1: Fast Vector Retrieval"""
    try:
        collection = get_collection()
        if not collection: return []
        
        # Chạy query đồng bộ trong thread riêng
        results = await asyncio.to_thread(collection.query, query_texts=[query], n_results=n_results)
        
        if results and results['ids'] and results['distances']:
            return list(zip(results['ids'][0], results['distances'][0]))
        return []
    except Exception as e:
        print(f"❌ [Vector Search] Error: {e}")
        return []

async def local_rerank(query: str, documents: list) -> list:
    """Stage 2: Local Cross-Encoder Reranking"""
    if not documents: return []
    try:
        model = await asyncio.to_thread(get_cross_encoder)
        
        # Tạo cặp (query, doc_content) để reranker đánh giá
        # Chúng ta dùng summary + một phần raw_text để rerank
        pairs = [[query, f"{doc.file_name} {doc.summary}"] for doc in documents]
        
        scores = await asyncio.to_thread(model.predict, pairs)
        
        # Gán điểm và sắp xếp lại
        for i, doc in enumerate(documents):
            doc.temp_score = scores[i]
            
        # Sắp xếp theo điểm Cross-Encoder (cao nhất lên đầu)
        documents.sort(key=lambda x: x.temp_score, reverse=True)
        
        # Lọc nhiễu: Chỉ lấy những kết quả có điểm rerank > 0 (ngưỡng an toàn)
        return [doc for doc in documents if doc.temp_score > -2.0]
    except Exception as e:
        print(f"⚠️ [Rerank] Error: {e}. Returning original order.")
        return documents

async def add_document_to_vector_db(doc_id: str, text: str, metadata: dict):
    try:
        collection = get_collection()
        if collection:
            await asyncio.to_thread(collection.add, ids=[str(doc_id)], documents=[text], metadatas=[metadata])
            return True
    except Exception as e:
        print(f"❌ [Add Vector] Error: {e}")
        return False

async def delete_from_vector_db(doc_id: str):
    try:
        collection = get_collection()
        if collection:
            await asyncio.to_thread(collection.delete, ids=[str(doc_id)])
            return True
    except Exception as e:
        print(f"❌ [Delete Vector] Error: {e}")
    return False