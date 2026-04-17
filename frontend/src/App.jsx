import { useState, useEffect, useCallback } from "react"
// Import các component từ đúng folder src/components
import { Sidebar } from "./components/dashboard/Sidebar";
import { Header } from "./components/dashboard/Header";
import { StatsCards } from "./components/dashboard/StatsCards";
import { DocumentTable } from "./components/dashboard/DocumentTable";
import { DocumentDrawer } from "./components/dashboard/DocumentDrawer";
import { LoginForm } from "./components/ui/LoginForm";
import { UploadSection } from "./components/dashboard/UploadSection";
// Import dịch vụ kết nối API
import { docService } from "./services/api";

// Dữ liệu mẫu để hiển thị khi Backend chưa trả về kết quả
const mockDocuments = [
  {
    id: "1",
    file_name: "QD_2024_001.pdf",
    category: "decision",
    status: "verified",
    summary: "Quyết định phê duyệt dự án nghiên cứu năm 2024 với ngân sách 2.5 tỷ đồng.",
    raw_text: "QUYẾT ĐỊNH\nSố: 001/QĐ-BKDN...",
    sha256_hash: "a1b2c3d4e5f678901234567890abcdef",
    image_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    qr_path: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PBL5-DOC-001",
    ai_results: {
      entities: [
        { label: "chu_ky", confidence: 0.95, bbox: { x: 65, y: 75, width: 20, height: 10 } },
        { label: "con_dau", confidence: 0.92, bbox: { x: 70, y: 70, width: 15, height: 15 } },
      ],
    },
    created_at: new Date().toISOString(),
  }
]

export default function App() {
  const [activeNav, setActiveNav] = useState("overview")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Tính toán thống kê dựa trên danh sách documents
  const stats = {
    total: documents.length,
    verified: documents.filter((d) => d.status === "verified").length,
    pending: documents.filter((d) => d.status === "pending").length,
  }

  // Hàm tải danh sách tài liệu từ Database
  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await docService.getDocs()
      // Nếu API trả về mảng trực tiếp, dùng res.data
      setDocuments(Array.isArray(res.data) ? res.data.reverse() : res.data.items.reverse())
    } catch (error) {
      console.error("Kết nối Backend thất bại, dùng dữ liệu Mock:", error)
      setDocuments(mockDocuments)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Tạm thời auto-login để vào thẳng Dashboard khi test
    setIsAuthenticated(true)
    loadDocuments()
  }, [loadDocuments])

  const handleLogin = async (email, password) => {
    setIsAuthenticated(true)
    loadDocuments()
  }

  // Hàm xử lý khi nhấn nút "XÁC THỰC AI"
  const handleUpload = async (file) => {
    setIsLoading(true)
    try {
      await docService.upload(file)
      await loadDocuments() // Tải lại danh sách sau khi upload thành công
    } catch (e) {
      console.error("Lỗi upload:", e)
      alert("Lỗi upload! Kiểm tra kết nối Backend hoặc định dạng file.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentClick = (doc) => {
    setSelectedDocument(doc)
    setIsDrawerOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar cố định bên trái */}
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />

      <main className="flex-1 md:ml-64">
        {/* Header chứa thanh tìm kiếm */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={() => {}}
        />

        <div className="p-6">
          {!isAuthenticated ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <LoginForm onLogin={handleLogin} />
            </div>
          ) : (
            <div className="space-y-6">
              <StatsCards stats={stats} />
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <DocumentTable
                    documents={documents}
                    onDocumentClick={handleDocumentClick}
                    onRefresh={loadDocuments}
                    isLoading={isLoading}
                  />
                </div>
                <div className="lg:col-span-4">
                  <UploadSection onUpload={handleUpload} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Drawer trượt ra khi click vào một dòng trong bảng */}
      <DocumentDrawer
        document={selectedDocument}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        getImageUrl={docService.getImageUrl} // Sử dụng logic lấy ảnh từ /storage của Backend
      />
    </div>
  )
}