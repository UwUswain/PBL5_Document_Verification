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
_embedding_func = None

def get_embedding_function():
    """Singleton: Chỉ load model AI 1 lần duy nhất để tránh treo 20s mỗi request"""
    global _embedding_func
    if _embedding_func is None:
        start_time = time.time()
        print("🧠 [Vector] Loading SentenceTransformer model (Warm-up)...")
        _embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="paraphrase-multilingual-MiniLM-L12-v2"
        )
        print(f"✅ [Vector] Model loaded in {time.time() - start_time:.2f}s")
    return _embedding_func

def get_collection():
    global _collection, _client
    if _collection is None:
        try:
            os.makedirs(CHROMA_DATA_PATH, exist_ok=True)
            if _client is None:
                _client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
            
            embedding_func = get_embedding_function()
            _collection = _client.get_or_create_collection(
                name=COLLECTION_NAME,
                embedding_function=embedding_func
            )
            print(f"✅ [Chroma] Collection '{COLLECTION_NAME}' ready.")
        except Exception as e:
            print(f"❌ [Chroma] Error: {e}")
            return None
    return _collection

async def add_document_to_vector_db(doc_id: str, text: str, metadata: dict):
    """Đẩy tác vụ add vào thread pool để không block API"""
    try:
        collection = get_collection()
        if not collection or not text: return False
        
        def _add():
            collection.add(ids=[str(doc_id)], documents=[text], metadatas=[metadata])
            
        await asyncio.to_thread(_add)
        return True
    except Exception as e:
        # Tự động reset nếu lệch dimension (Fix phẫu thuật)
        if "dimension" in str(e).lower():
            print("⚠️ [Vector] Dimension mismatch. Resetting collection...")
            global _collection, _client
            if _client:
                _client.delete_collection(COLLECTION_NAME)
                _collection = None
                return await add_document_to_vector_db(doc_id, text, metadata)
        print(f"❌ [Vector Add] Error: {e}")
        return False

async def search_semantic_ids(query: str, n_results: int = 15) -> list[tuple[str, float]]:
    """Tìm kiếm vector với Timing Logs và Threading"""
    start_total = time.time()
    try:
        collection = get_collection()
        if not collection: return []

        # Chạy query đồng bộ trong thread riêng để không block FastAPI Event Loop
        def _query():
            return collection.query(query_texts=[query], n_results=n_results)
        
        start_q = time.time()
        results = await asyncio.to_thread(_query)
        print(f"🕒 [Timing] Chroma Query took: {time.time() - start_q:.4f}s")

        if results and results['ids'] and results['distances']:
            print(f"🕒 [Timing] Total Stage 1 took: {time.time() - start_total:.4f}s")
            return list(zip(results['ids'][0], results['distances'][0]))
        return []
    except Exception as e:
        print(f"❌ [Vector Search] Error: {e}")
        return []

async def delete_from_vector_db(doc_id: str):
    try:
        collection = get_collection()
        if collection:
            await asyncio.to_thread(collection.delete, ids=[str(doc_id)])
            return True
    except Exception as e:
        print(f"❌ [Vector Delete] Error: {e}")
    return False