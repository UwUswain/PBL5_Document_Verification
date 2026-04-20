import { CheckCircle, Clock, RefreshCw } from "lucide-react"
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion"

export function DocumentTable({ documents, onDocumentClick, onRefresh, isLoading, title = "Danh sách tài liệu" }) {
  
  const getCategoryInfo = (cat) => {
    const text = cat?.toLowerCase() || "";
    if (text.includes("quyết định")) return { label: "QUYẾT ĐỊNH", style: "bg-red-500 text-white shadow-sm shadow-red-200" };
    if (text.includes("công văn")) return { label: "CÔNG VĂN", style: "bg-blue-500 text-white shadow-sm shadow-blue-200" };
    if (text.includes("đơn từ")) return { label: "ĐƠN TỪ", style: "bg-amber-500 text-white shadow-sm shadow-amber-200" };
    if (text.includes("hợp đồng")) return { label: "HỢP ĐỒNG", style: "bg-green-500 text-white shadow-sm shadow-green-200" };
    return { label: "KHÁC", style: "bg-slate-400 text-white shadow-sm shadow-slate-200" };
  }

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  }

  return (
    <div className="overflow-hidden bg-transparent">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white/40">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h3>
        <button 
          onClick={onRefresh} 
          disabled={isLoading}
          className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-50 transition-colors uppercase tracking-widest bg-white py-1.5 px-3 rounded-full shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} /> LÀM MỚI
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tên file</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Phân loại</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày tạo</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 bg-white/20">
            {documents.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-16 text-center text-sm font-medium text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-100 rounded-full"><Clock className="w-6 h-6 text-slate-300" /></div>
                    Chưa có tài liệu nào trong hệ thống...
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {documents.map((doc, idx) => {
                  const catInfo = getCategoryInfo(doc.category);
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      whileHover={{ scale: 1.01, backgroundColor: "rgba(238, 242, 255, 0.7)" }}
                      key={doc.id} 
                      onClick={() => onDocumentClick(doc)} 
                      className="group cursor-pointer transition-all"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 group-hover:text-indigo-600 truncate max-w-[250px] transition-colors">
                        {doc.file_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("rounded-full px-3 py-1 text-[9px] font-black tracking-widest", catInfo.style)}>
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm", 
                          doc.status === 'verified' ? 'border-green-200 text-green-700 bg-green-50/80' : 'border-amber-200 text-amber-700 bg-amber-50/80'
                        )}>
                          {doc.status === 'verified' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {doc.status === 'verified' ? 'Đã xác thực' : 'Đang xử lý'}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}