"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DocumentTable } from "@/components/dashboard/document-table"
import { DocumentDrawer } from "@/components/dashboard/document-drawer"
import { LoginForm } from "@/components/dashboard/login-form"
import { UploadSection } from "@/components/dashboard/upload-section"
import { apiService } from "@/lib/api-service"
import type { Document, NavItem, StatsData } from "@/lib/types"

// Mock data for demonstration - includes ai_results with entity detection
const mockDocuments: Document[] = [
  {
    id: "1",
    file_name: "QD_2024_001.pdf",
    category: "decision",
    status: "verified",
    summary: "Quyết định về việc phê duyệt kế hoạch dự án năm 2024. Nội dung bao gồm các mục tiêu chính và ngân sách dự kiến cho các hoạt động nghiên cứu và phát triển.",
    raw_text: "QUYẾT ĐỊNH\nSố: 001/QĐ-BKDN\nVề việc phê duyệt kế hoạch dự án năm 2024\n\nCĂN CỨ:\n- Luật Giáo dục đại học số 08/2012/QH13\n- Quy chế tổ chức và hoạt động của Trường\n\nQUYẾT ĐỊNH:\nĐiều 1. Phê duyệt kế hoạch dự án nghiên cứu với ngân sách 2.5 tỷ đồng.\nĐiều 2. Thời gian thực hiện: 01/04/2024 - 31/12/2024.\n\nNơi nhận:\n- Ban Giám hiệu\n- Các đơn vị liên quan\n- Lưu VT",
    sha256_hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    image_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    qr_path: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PBL5-DOC-001",
    ai_results: {
      summary: "Quyết định phê duyệt kế hoạch dự án nghiên cứu năm 2024 với ngân sách 2.5 tỷ đồng.",
      entities: [
        { label: "chu_ky", confidence: 0.95, bbox: { x: 65, y: 75, width: 20, height: 10 } },
        { label: "con_dau", confidence: 0.92, bbox: { x: 70, y: 70, width: 15, height: 15 } },
      ],
    },
    created_at: "2024-03-15T10:30:00Z",
  },
  {
    id: "2",
    file_name: "HD_ThueVanPhong_2024.pdf",
    category: "contract",
    status: "verified",
    summary: "Hợp đồng thuê văn phòng tại tòa nhà ABC với thời hạn 2 năm. Bao gồm các điều khoản về giá thuê, bảo trì và các dịch vụ đi kèm.",
    raw_text: "HỢP ĐỒNG THUÊ VĂN PHÒNG\nSố: HD-2024-001\n\nHôm nay, ngày 15 tháng 3 năm 2024, tại văn phòng Công ty ABC\n\nBÊN A (Bên cho thuê): Công ty TNHH ABC\nBÊN B (Bên thuê): Trường Đại học Bách Khoa\n\nĐIỀU 1: Đối tượng hợp đồng\nBên A đồng ý cho Bên B thuê văn phòng tầng 5, diện tích 200m2.\n\nĐIỀU 2: Giá thuê\nGiá thuê: 50.000.000 VND/tháng (đã bao gồm VAT)\n\nĐại diện Bên A          Đại diện Bên B",
    sha256_hash: "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a",
    image_url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
    qr_path: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PBL5-DOC-002",
    ai_results: {
      summary: "Hợp đồng thuê văn phòng 200m2 tại tòa nhà ABC với giá 50 triệu/tháng, thời hạn 2 năm.",
      entities: [
        { label: "chu_ky", confidence: 0.88, bbox: { x: 15, y: 80, width: 18, height: 8 } },
        { label: "chu_ky", confidence: 0.91, bbox: { x: 65, y: 80, width: 18, height: 8 } },
      ],
    },
    created_at: "2024-03-14T14:20:00Z",
  },
  {
    id: "3",
    file_name: "CV_DieuDong_NhanSu.pdf",
    category: "dispatch",
    status: "pending",
    summary: "Công văn điều động nhân sự giữa các phòng ban. Yêu cầu nhân viên Nguyễn Văn A chuyển sang phòng Kỹ thuật từ ngày 01/04/2024.",
    raw_text: "CÔNG VĂN\nSố: CV-2024-015\nV/v: Điều động nhân sự\n\nKính gửi: Phòng Tổ chức - Nhân sự\n\nCăn cứ vào nhu cầu công việc và năng lực của nhân viên, Ban Giám hiệu quyết định:\n\n1. Điều động ông Nguyễn Văn A từ Phòng Hành chính sang Phòng Kỹ thuật.\n2. Thời gian thực hiện: Từ ngày 01/04/2024.\n3. Các chế độ đãi ngộ giữ nguyên theo quy định.\n\nĐề nghị các đơn vị liên quan phối hợp thực hiện.\n\nTrưởng phòng TCHC",
    sha256_hash: "c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab",
    image_url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800",
    ai_results: {
      summary: "Công văn điều động nhân viên Nguyễn Văn A sang Phòng Kỹ thuật từ 01/04/2024.",
      entities: [
        { label: "con_dau", confidence: 0.89, bbox: { x: 68, y: 72, width: 18, height: 18 } },
      ],
    },
    created_at: "2024-03-13T09:15:00Z",
  },
  {
    id: "4",
    file_name: "QD_BoNhiem_GiamDoc.pdf",
    category: "decision",
    status: "pending",
    summary: "Quyết định bổ nhiệm Giám đốc Chi nhánh mới tại Đà Nẵng. Hiệu lực từ ngày 01/05/2024.",
    raw_text: "QUYẾT ĐỊNH\nSố: 045/QĐ-BKDN\nVề việc bổ nhiệm Giám đốc Chi nhánh\n\nHỘI ĐỒNG QUẢN TRỊ CÔNG TY\n\nCăn cứ Điều lệ tổ chức và hoạt động của Công ty;\nCăn cứ biên bản họp Hội đồng quản trị ngày 10/03/2024;\nXét năng lực và phẩm chất đạo đức của cán bộ;\n\nQUYẾT ĐỊNH:\nĐiều 1. Bổ nhiệm ông Trần Văn B giữ chức Giám đốc Chi nhánh Đà Nẵng.\nĐiều 2. Quyết định có hiệu lực từ ngày 01/05/2024.\n\nCHỦ TỊCH HĐQT",
    sha256_hash: "d4e5f6789012345678901234567890abcdef1234567890abcdef1234567abc",
    image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
    ai_results: {
      summary: "Quyết định bổ nhiệm ông Trần Văn B làm Giám đốc Chi nhánh Đà Nẵng từ 01/05/2024.",
      entities: [],
    },
    created_at: "2024-03-12T16:45:00Z",
  },
  {
    id: "5",
    file_name: "HD_CungCap_ThietBi.pdf",
    category: "contract",
    status: "verified",
    summary: "Hợp đồng cung cấp thiết bị máy tính và phần cứng cho dự án PBL5. Giá trị hợp đồng: 500 triệu VND.",
    raw_text: "HỢP ĐỒNG CUNG CẤP THIẾT BỊ\nSố: HD-2024-032\n\nGiữa Công ty TNHH Thiết Bị Công Nghệ XYZ (Bên A)\nVà Trường Đại học Bách Khoa Đà Nẵng (Bên B)\n\nĐIỀU 1: NỘI DUNG HỢP ĐỒNG\n- 50 bộ máy tính để bàn Dell OptiPlex\n- 10 máy chủ HP ProLiant\n- 5 thiết bị mạng Cisco\n\nĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG\nTổng giá trị: 500.000.000 VND\n\nĐIỀU 3: THỜI GIAN GIAO HÀNG\nTrong vòng 30 ngày kể từ ngày ký hợp đồng.\n\nĐại diện Bên A          Đại diện Bên B",
    sha256_hash: "e5f6789012345678901234567890abcdef1234567890abcdef1234567abcd",
    image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800",
    qr_path: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PBL5-DOC-005",
    ai_results: {
      summary: "Hợp đồng cung cấp thiết bị CNTT trị giá 500 triệu VND cho dự án PBL5.",
      entities: [
        { label: "chu_ky", confidence: 0.94, bbox: { x: 12, y: 82, width: 20, height: 10 } },
        { label: "chu_ky", confidence: 0.93, bbox: { x: 62, y: 82, width: 20, height: 10 } },
        { label: "con_dau", confidence: 0.97, bbox: { x: 72, y: 75, width: 16, height: 16 } },
      ],
    },
    created_at: "2024-03-11T11:00:00Z",
  },
]

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState<NavItem>("overview")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const stats: StatsData = {
    total: documents.length,
    verified: documents.filter((d) => d.status === "verified").length,
    pending: documents.filter((d) => d.status === "pending").length,
  }

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      // Try to fetch from real API
      const docs = await apiService.getDocuments()
      setDocuments(docs.reverse())
    } catch {
      // Fallback to mock data for demonstration
      setDocuments(mockDocuments)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check if already authenticated
    if (apiService.isAuthenticated()) {
      setIsAuthenticated(true)
      loadDocuments()
    } else {
      // For demo purposes, auto-authenticate with mock data
      setIsAuthenticated(true)
      setDocuments(mockDocuments)
    }
  }, [loadDocuments])

  const handleLogin = async (email: string, password: string) => {
    try {
      await apiService.login(email, password)
      setIsAuthenticated(true)
      loadDocuments()
    } catch {
      // For demo, allow login anyway
      setIsAuthenticated(true)
      setDocuments(mockDocuments)
    }
  }

  const handleUpload = async (file: File) => {
    try {
      await apiService.uploadDocument(file)
      loadDocuments()
    } catch {
      // For demo, add a mock document
      const newDoc: Document = {
        id: String(Date.now()),
        file_name: file.name,
        category: "decision",
        status: "pending",
        summary: "AI is processing this document...",
        created_at: new Date().toISOString(),
      }
      setDocuments((prev) => [newDoc, ...prev])
    }
  }

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc)
    setIsDrawerOpen(true)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments()
      return
    }

    setIsLoading(true)
    try {
      const results = await apiService.searchDocuments(searchQuery)
      setDocuments(results)
    } catch {
      // Fallback to local filtering
      const filtered = mockDocuments.filter(
        (doc) =>
          doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setDocuments(filtered)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDocuments = searchQuery
    ? documents.filter(
        (doc) =>
          doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />

      <main className="flex-1 md:ml-64">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearch}
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
          )}
        </div>
      </main>

      <DocumentDrawer
        document={selectedDocument}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        getImageUrl={apiService.getImageUrl.bind(apiService)}
      />
    </div>
  )
}
