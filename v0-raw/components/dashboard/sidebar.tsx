"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Search, BarChart3, Trash2 } from "lucide-react"
import type { NavItem } from "@/lib/types"

interface SidebarProps {
  activeNav: NavItem
  onNavChange: (nav: NavItem) => void
}

const navItems: { id: NavItem; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "search", label: "Vector Search", icon: Search },
  { id: "analytics", label: "AI Analytics", icon: BarChart3 },
  { id: "trash", label: "Trash", icon: Trash2 },
]

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white md:flex">
      {/* Logo Section */}
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">PBL5 AI</h2>
        <p className="mt-0.5 text-xs text-slate-500">Document Management System</p>
      </div>

      {/* Navigation */}
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
                  "relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
                )}
                <Icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-slate-400")} strokeWidth={1.5} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4">
        <p className="text-xs text-slate-400">BKDN Engineering - 2026</p>
      </div>
    </aside>
  )
}
