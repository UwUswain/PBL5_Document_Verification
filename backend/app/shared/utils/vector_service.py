# import os
# import chromadb
# from chromadb.utils import embedding_functions

# # 1. Cấu hình đường dẫn lưu trữ Database Vector
# # Đảm bảo lưu vào đúng folder storage trong Rebuild
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# CHROMA_DATA_PATH = os.path.join(BASE_DIR, "storage", "vector_db")
# COLLECTION_NAME = "pbl5_documents"

# # 2. Khởi tạo Client lưu trữ bền vững (Persistent)
# # Dữ liệu sẽ không bị mất khi tắt server
# client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)

# # 3. Sử dụng model Đa ngôn ngữ (Multilingual) 
# # Model này hiểu tiếng Việt cực tốt, hỗ trợ tìm kiếm theo ý nghĩa (Semantic Search)
# embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(
#     model_name="paraphrase-multilingual-MiniLM-L12-v2"
# )

# # 4. Lấy hoặc tạo mới Collection
# collection = client.get_or_create_collection(
#     name=COLLECTION_NAME,
#     embedding_function=embedding_func
# )

# async def add_document_to_vector_db(doc_id: str, text: str, metadata: dict):
#     """
#     Lưu văn bản đã OCR vào bộ nhớ Vector để tìm kiếm sau này.
#     doc_id: Thường là ID của document trong PostgreSQL.
#     text: Nội dung thô (raw_text) thu được từ OCR.
#     metadata: Các thông tin bổ sung như tên file, category, ngày tạo.
#     """
#     try:
#         # Xử lý text trống để tránh lỗi DB
#         if not text or len(text.strip()) == 0:
#             return False
            
#         collection.add(
#             ids=[str(doc_id)],
#             documents=[text],
#             metadatas=[metadata]
#         )
#         print(f"✅ Đã vector hóa document: {doc_id}")
#         return True
#     except Exception as e:
#         print(f"❌ Lỗi Vector DB (Add): {str(e)}")
#         return False

# async def search_semantic(query: str, n_results: int = 5):
#     """
#     Tìm kiếm văn bản dựa trên ý nghĩa của câu truy vấn.
#     """
#     try:
#         results = collection.query(
#             query_texts=[query],
#             n_results=n_results
#         )
#         return results
#     except Exception as e:
#         print(f"❌ Lỗi Vector DB (Search): {str(e)}")
#         return None