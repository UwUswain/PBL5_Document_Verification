import { LayoutDashboard, FileText, Search, BarChart3, Trash2 } from "lucide-react"
// Bỏ chữ src đi vì mình đang đứng ở src rồi
import { cn } from "../../lib/utils";

const navItems = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "search", label: "Vector Search", icon: Search },
  { id: "analytics", label: "AI Analytics", icon: BarChart3 },
  { id: "trash", label: "Trash", icon: Trash2 },
]

export function Sidebar({ activeNav, onNavChange }) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">PBL5 AI</h2>
        <p className="mt-0.5 text-[10px] uppercase tracking-tighter text-slate-500 font-bold">BKDN Engineering</p>
      </div>

      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id

            return (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-slate-100 text-indigo-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
                )}
                <Icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
      <div className="border-t border-slate-200 px-6 py-4">
        <p className="text-[10px] text-slate-400 font-mono">© 2026 LE DINH HOAI LONG</p>
      </div>
    </aside>
  )
}