import { CheckCircle, Clock, RefreshCw, Calendar } from "lucide-react"
import { cn } from "../../lib/utils";

export function DocumentTable({ documents, onDocumentClick, onRefresh, isLoading }) {
  
  // Sửa triệt để logic mapping: Chấp nhận cả dữ liệu tiếng Anh (v0) và tiếng Việt (Database thật)
  // const getCategoryInfo = (cat) => {
  //   const text = cat?.toLowerCase() || "";
  //   if (text.includes("quyết định") || text === "decision") {
  //     return { label: "QUYẾT ĐỊNH", style: "bg-red-600 text-white" };
  //   }
  //   if (text.includes("hợp đồng") || text === "contract") {
  //     return { label: "HỢP ĐỒNG", style: "bg-green-600 text-white" };
  //   }
  //   if (text.includes("công văn") || text === "dispatch") {
  //     return { label: "CÔNG VĂN", style: "bg-blue-600 text-white" };
  //   }
  //   if (text.includes("đơn từ")) {
  //     return { label: "ĐƠN TỪ", style: "bg-amber-600 text-white" };
  //   }
  //   return { label: "KHÁC", style: "bg-slate-200 text-slate-700" };
  // }
  const getCategoryInfo = (cat) => {
    const text = cat?.toLowerCase() || "";
    // Check từ khóa tiếng Việt có dấu
    if (text.includes("quyết định")) return { label: "QUYẾT ĐỊNH", style: "bg-red-600 text-white" };
    if (text.includes("công văn")) return { label: "CÔNG VĂN", style: "bg-blue-600 text-white" };
    if (text.includes("đơn từ")) return { label: "ĐƠN TỪ", style: "bg-amber-600 text-white" };
    if (text.includes("hợp đồng")) return { label: "HỢP ĐỒNG", style: "bg-green-600 text-white" };
    
    return { label: "KHÁC", style: "bg-slate-200 text-slate-700" };
  }
  // Hàm định dạng ngày tháng để bảng nhìn chuyên nghiệp hơn
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Danh sách tài liệu</h3>
        <button 
          onClick={onRefresh} 
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-50 transition-colors"
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
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Ngày tạo</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-xs text-slate-400 italic">
                  Chưa có tài liệu nào trong hệ thống...
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const catInfo = getCategoryInfo(doc.category);
                return (
                  <tr 
                    key={doc.id} 
                    onClick={() => onDocumentClick(doc)} 
                    className="group cursor-pointer hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 group-hover:text-indigo-600 truncate max-w-[200px]">
                      {doc.file_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded px-2 py-0.5 text-[9px] font-bold", catInfo.style)}>
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 font-medium">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-bold uppercase", 
                        doc.status === 'verified' ? 'border-green-600 text-green-600 bg-green-50' : 'border-amber-600 text-amber-600 bg-amber-50'
                      )}>
                        {doc.status === 'verified' ? <CheckCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                        {doc.status === 'verified' ? 'Đã xác thực' : 'Đang xử lý'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}