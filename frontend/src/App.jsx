import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "./components/dashboard/Sidebar";
import { Header } from "./components/dashboard/Header";
import { StatsCards } from "./components/dashboard/StatsCards";
import { DocumentTable } from "./components/dashboard/DocumentTable";
import { DocumentDrawer } from "./components/dashboard/DocumentDrawer";
import { LoginForm } from "./components/ui/LoginForm";
import { UploadSection } from "./components/dashboard/UploadSection";
import { docService } from "./services/api";

const mockDocuments = [
  {
    id: "1",
    file_name: "QD_2024_001.pdf",
    category: "decision",
    status: "verified",
    summary: "Dữ liệu mẫu (Backend đang kết nối...)",
    ai_results: { entities: [] },
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

  const stats = {
    total: documents.length,
    verified: documents.filter((d) => d.status === "verified").length,
    pending: documents.filter((d) => d.status === "pending").length,
  }

  // Tải dữ liệu từ Backend
  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await docService.getDocs()
      // Xử lý linh hoạt nếu backend trả về list hoặc object chứa items
      const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
      setDocuments([...data].reverse())
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error)
      if (error.response?.status === 401) {
        handleLogout(); // Token hết hạn hoặc sai, bắt đăng nhập lại
      } else {
        setDocuments(mockDocuments)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP KHI MỞ APP
  useEffect(() => {
    const token = localStorage.getItem("pbl5_token");
    if (token) {
      setIsAuthenticated(true);
      loadDocuments();
    } else {
      setIsAuthenticated(false);
    }
  }, [loadDocuments])

  const handleLogin = async (username, password) => {
    try {
      await docService.login(username, password);
      setIsAuthenticated(true);
      loadDocuments();
    } catch (err) {
      alert("Đăng nhập thất bại! Vui lòng kiểm tra lại tài khoản.");
      throw err; // Để LoginForm hiển thị lỗi
    }
  }

  const handleLogout = () => {
    docService.logout();
    setIsAuthenticated(false);
    setDocuments([]);
  }

  const handleUpload = async (file) => {
    setIsLoading(true)
    try {
      await docService.upload(file)
      await loadDocuments()
    } catch (e) {
      alert("Lỗi upload! Có thể do Token hết hạn hoặc file sai định dạng.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentClick = (doc) => {
    setSelectedDocument(doc)
    setIsDrawerOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {isAuthenticated && (
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} onLogout={handleLogout} />
      )}

      <main className={isAuthenticated ? "flex-1 md:ml-64" : "flex-1"}>
        {isAuthenticated && (
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => {}}
          />
        )}

        <div className="p-6">
          {!isAuthenticated ? (
            <div className="flex min-h-[80vh] items-center justify-center">
              <LoginForm onLogin={handleLogin} />
            </div>
          ) : (
            <div className="mx-auto max-w-7xl space-y-6">
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

      <DocumentDrawer
        document={selectedDocument}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        getImageUrl={docService.getImageUrl}
      />
    </div>
  )
}