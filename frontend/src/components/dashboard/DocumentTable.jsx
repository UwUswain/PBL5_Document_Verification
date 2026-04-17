import { CheckCircle, Clock, RefreshCw } from "lucide-react"
// Bỏ chữ src đi vì mình đang đứng ở src rồi
import { cn } from "../../lib/utils";

export function DocumentTable({ documents, onDocumentClick, onRefresh, isLoading }) {
  const getCategoryStyle = (cat) => {
    const styles = {
      decision: "bg-red-600 text-white",
      contract: "bg-green-600 text-white",
      dispatch: "bg-blue-600 text-white"
    }
    return styles[cat?.toLowerCase()] || "bg-slate-200 text-slate-700"
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Danh sách tài liệu</h3>
        <button 
          onClick={onRefresh} 
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} /> LÀM MỚI
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Tên file</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Phân loại</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <tr><td colSpan="3" className="py-10 text-center text-xs text-slate-400 italic">Chưa có tài liệu nào...</td></tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} onClick={() => onDocumentClick(doc)} className="group cursor-pointer hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 group-hover:text-indigo-600">{doc.file_name}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded px-2 py-0.5 text-[9px] font-bold uppercase", getCategoryStyle(doc.category))}>
                      {doc.category || "Khác"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-bold uppercase", 
                      doc.status === 'verified' ? 'border-green-600 text-green-600' : 'border-amber-600 text-amber-600')}>
                      {doc.status === 'verified' ? <CheckCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}