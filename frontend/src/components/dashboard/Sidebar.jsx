import { LayoutDashboard, FileText, Search, BarChart3, Trash2, LogOut } from "lucide-react"
import { cn } from "../../lib/utils";

const navItems = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "documents", label: "Kho văn bản", icon: FileText },
  { id: "search", label: "Vector Search", icon: Search },
  { id: "analytics", label: "AI Analytics", icon: BarChart3 },
  { id: "trash", label: "Thùng rác", icon: Trash2 },
]

export function Sidebar({ activeNav, onNavChange, onLogout }) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white md:flex z-40 shadow-sm">
      {/* Brand Logo */}
      <div className="border-b border-slate-100 px-6 py-6 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">L</div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">PBL5 AI System</h2>
            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">BKDN Engineering</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6">
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id

            return (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-xs font-bold transition-all duration-200 uppercase tracking-wider",
                  isActive
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
                )}
                <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-indigo-600" : "text-slate-400")} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer & Logout */}
      <div className="border-t border-slate-100 px-4 py-4 space-y-3">
        <button 
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest"
        >
          <LogOut className="h-4 w-4" /> Đăng xuất
        </button>
        <div className="px-4 text-[9px] text-slate-400 font-bold uppercase tracking-tighter opacity-50">
          © 2026 LE DINH HOAI LONG
        </div>
      </div>
    </aside>
  )
}