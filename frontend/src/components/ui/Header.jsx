import { Search, UserCircle, Bell } from "lucide-react"

export function Header({ searchQuery, onSearchChange, onSearchSubmit }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-md">
      <div className="hidden lg:block">
        <h1 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Hệ thống phân tích văn bản AI</h1>
        <p className="text-[10px] text-slate-500 font-medium">Sử dụng OCR & Gemini Pro</p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung, mã file..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
          <button className="text-slate-400 hover:text-indigo-600 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-900 leading-none">Minh Nhật</p>
              <p className="text-[9px] text-slate-500 font-mono">ID: 102210xxx</p>
            </div>
            <UserCircle className="h-8 w-8 text-slate-300" />
          </div>
        </div>
      </div>
    </header>
  )
}