import { LayoutDashboard, FileText, Search, BarChart3, Trash2 } from "lucide-react"
import { cn } from "../lib/utils"

const navItems = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "documents", label: "Tài liệu", icon: FileText },
  { id: "search", label: "Tìm kiếm Vector", icon: Search },
  { id: "analytics", label: "Thống kê AI", icon: BarChart3 },
  { id: "trash", label: "Thùng rác", icon: Trash2 },
]

export function Sidebar({ activeNav, onNavChange }) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="border-b border-slate-200 px-6 py-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tighter">PBL5 <span className="text-indigo-600">AI</span></h2>
        <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Intelligence</p>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id

            return (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-all",
                  isActive
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
                )}
                <Icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-slate-400")} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="mt-auto border-t border-slate-100 p-6">
        <div className="rounded-xl bg-slate-900 p-4 text-white">
          <p className="text-[10px] font-bold uppercase text-slate-400">Project Status</p>
          <p className="mt-1 text-xs font-medium">Solo Mode: Active ⚡</p>
          <div className="mt-2 h-1 w-full rounded-full bg-slate-700">
            <div className="h-1 w-full rounded-full bg-indigo-500"></div>
          </div>
        </div>
        <p className="mt-4 text-center text-[9px] font-mono text-slate-400">BKDN Engineering - 2026</p>
      </div>
    </aside>
  )
}