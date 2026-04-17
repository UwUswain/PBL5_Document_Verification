import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, BarChart3, Trash2, FolderOpen } from "lucide-react" // Thêm icon cho demo
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
    file_name: "He_thong_dang_ket_noi.pdf",
    category: "decision",
    status: "pending",
    summary: "Đang tải dữ liệu thực tế từ Database...",
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

  // 1. Tính toán thống kê
  const stats = useMemo(() => ({
    total: documents.length,
    verified: documents.filter((d) => d.status === "verified").length,
    pending: documents.filter((d) => d.status === "pending").length,
  }), [documents]);

  // 2. Lọc tài liệu theo thanh tìm kiếm
  const filteredDocuments = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await docService.getDocs()
      // BACKEND trả về dạng { items: [...] }, nên phải lấy res.data.items
      const data = res.data.items || [];
      console.log("Dữ liệu thật từ Back:", data);
      setDocuments([...data].reverse())
    } catch (error) {
      console.error("Lỗi API:", error);
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        setDocuments(mockDocuments) // Chỉ hiện mock khi sập mạng
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("pbl5_token");
    if (token) {
      setIsAuthenticated(true);
      loadDocuments();
    }
  }, [loadDocuments])

  const handleLogin = async (username, password) => {
    try {
      await docService.login(username, password);
      setIsAuthenticated(true);
      loadDocuments();
    } catch (err) {
      alert("Đăng nhập thất bại! Kiểm tra lại tài khoản.");
      throw err;
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
      alert("Lỗi upload!")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentClick = (doc) => {
    setSelectedDocument(doc)
    setIsDrawerOpen(true)
  }

  // 3. LOGIC RENDER NỘI DUNG CHÍNH (Dùng để demo đa tính năng)
  const renderMainContent = () => {
    switch (activeNav) {
      case "overview":
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <StatsCards stats={stats} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <DocumentTable
                  documents={filteredDocuments}
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
        );
      case "documents":
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <DocumentTable
                documents={filteredDocuments}
                onDocumentClick={handleDocumentClick}
                onRefresh={loadDocuments}
                isLoading={isLoading}
              />
          </div>
        );
      default:
        return (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="rounded-full bg-indigo-50 p-4">
              <BarChart3 className="h-10 w-10 text-indigo-300" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900 uppercase">Tính năng {activeNav}</h3>
            <p className="mt-2 text-xs text-slate-500 max-w-xs">Dữ liệu đang được đồng bộ từ module AI/Vector Search của hệ thống...</p>
          </div>
        );
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {isAuthenticated && (
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} onLogout={handleLogout} />
      )}

      <main className={isAuthenticated ? "flex-1 md:ml-64 transition-all" : "flex-1"}>
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
            <div className="mx-auto max-w-7xl">
              {renderMainContent()}
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