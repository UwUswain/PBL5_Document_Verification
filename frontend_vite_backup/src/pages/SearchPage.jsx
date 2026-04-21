import { useState } from "react"
import { Search, Loader2, FileText, CheckCircle, Clock } from "lucide-react"
import { docService } from "../services/api"
import { DocumentDrawer } from "../components/dashboard/DocumentDrawer"
import { motion, AnimatePresence } from "framer-motion"

export function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setHasSearched(true)
    try {
      const res = await docService.searchAI ? await docService.searchAI(query) : await docService.getDocs()
      
      let items = res.data?.items || []
      
      if (!docService.searchAI) {
          items = items.filter(d => 
              d.file_name.toLowerCase().includes(query.toLowerCase()) || 
              (d.summary || "").toLowerCase().includes(query.toLowerCase())
          )
      }
      
      setResults(items)
    } catch (e) {
      console.error(e)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (cat) => {
    const text = cat?.toLowerCase() || "";
    if (text.includes("quyết định")) return "bg-red-500 text-white shadow-red-200"
    if (text.includes("công văn")) return "bg-blue-500 text-white shadow-blue-200"
    if (text.includes("đơn từ")) return "bg-amber-500 text-white shadow-amber-200"
    if (text.includes("hợp đồng")) return "bg-green-500 text-white shadow-green-200"
    return "bg-slate-500 text-white shadow-slate-200"
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] py-10 w-full max-w-5xl mx-auto space-y-10">
      
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full text-center space-y-4"
      >
        <div className="inline-flex items-center justify-center p-4 bg-indigo-100 text-indigo-600 rounded-2xl mb-4 shadow-inner">
          <Search size={40} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">AI Semantic Search</h1>
        <p className="text-slate-500 font-medium">Tìm kiếm thông minh dựa trên ngữ nghĩa và nội dung văn bản</p>

        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto mt-8 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
            <Search className="w-6 h-6 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-5 pl-16 pr-32 text-lg text-slate-900 bg-white/80 backdrop-blur-md border-2 border-white/50 rounded-full shadow-2xl shadow-indigo-100/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            placeholder="Ví dụ: Tìm hợp đồng thuê nhà tháng trước..."
          />
          <button 
            type="submit" 
            disabled={isLoading || !query.trim()}
            className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "TÌM KIẾM"}
          </button>
        </form>
      </motion.div>

      <div className="w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-400 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm font-bold uppercase tracking-widest animate-pulse">AI đang phân tích ngữ nghĩa...</p>
          </div>
        ) : hasSearched ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {results.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-400 font-medium">
                Không tìm thấy văn bản nào phù hợp với yêu cầu của bạn.
              </div>
            ) : (
              <AnimatePresence>
                {results.map((doc, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/50 shadow-xl shadow-slate-200/50 cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md ${getCategoryColor(doc.category)}`}>
                        {doc.category || "Khác"}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors flex items-start gap-2">
                      <FileText className="w-5 h-5 flex-shrink-0 text-indigo-400" />
                      {doc.file_name}
                    </h3>
                    
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1 italic border-l-2 border-indigo-100 pl-3">
                      {doc.summary || "Không có nội dung tóm tắt..."}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${doc.status === 'verified' ? 'text-green-600' : 'text-amber-500'}`}>
                        {doc.status === 'verified' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {doc.status === 'verified' ? 'Đã xác thực' : 'Đang xử lý'}
                      </div>
                      <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest group-hover:underline">
                        XEM CHI TIẾT
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        ) : null}
      </div>

      <DocumentDrawer
        document={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        getImageUrl={docService.getImageUrl}
      />
    </div>
  )
}
