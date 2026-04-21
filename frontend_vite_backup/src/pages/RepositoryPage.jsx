import { useState, useEffect, useMemo } from "react"
import { DocumentTable } from "../components/dashboard/DocumentTable"
import { DocumentDrawer } from "../components/dashboard/DocumentDrawer"
import { docService } from "../services/api"
import { Filter } from "lucide-react"
import { motion } from "framer-motion"

const CATEGORIES = ["Tất cả", "Quyết định", "Hợp đồng", "Công văn", "Đơn từ", "Khác"]

export function RepositoryPage() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [activeCategory, setActiveCategory] = useState("Tất cả")

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const res = await docService.getDocs()
      const data = res.data?.items || []
      setDocuments([...data].reverse())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadDocuments() }, [])

  const filteredDocuments = useMemo(() => {
    if (activeCategory === "Tất cả") return documents
    return documents.filter(doc => {
      const cat = doc.category?.toLowerCase() || ""
      return cat.includes(activeCategory.toLowerCase())
    })
  }, [documents, activeCategory])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-lg shadow-indigo-100/30 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase px-2">
          <Filter className="h-4 w-4" /> Bộ lọc
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === cat 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                  : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-indigo-100/30 overflow-hidden">
        <DocumentTable 
          documents={filteredDocuments} 
          onDocumentClick={setSelectedDoc}
          onRefresh={loadDocuments}
          isLoading={isLoading}
          title="Kho lưu trữ tài liệu"
        />
      </div>

      <DocumentDrawer
        document={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        getImageUrl={docService.getImageUrl}
      />
    </motion.div>
  )
}
