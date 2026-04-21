import { FileText, CheckCircle, Clock } from "lucide-react"
// Bỏ chữ src đi vì mình đang đứng ở src rồi
import { cn } from "../../lib/utils";

export function StatsCards({ stats }) {
  const cards = [
    { label: "Tổng tài liệu", value: stats.total, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Đã xác thực", value: stats.verified, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Đang chờ", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className={`rounded-md p-3 ${card.bg}`}>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}