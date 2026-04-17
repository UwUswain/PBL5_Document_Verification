import { Search } from "lucide-react"
// Bỏ chữ src đi vì mình đang đứng ở src rồi
import { cn } from "../../lib/utils";

export function Header({ searchQuery, onSearchChange, onSearchSubmit }) {
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-lg font-bold text-slate-900 uppercase">Hệ thống quản lý văn bản AI</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PBL5 - Solo Project</p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm nội dung (Semantic Search)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
          className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
        />
      </div>
    </header>
  )
}