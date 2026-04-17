"use client"

import { FileText, CheckCircle, Clock } from "lucide-react"
import type { StatsData } from "@/lib/types"

interface StatsCardsProps {
  stats: StatsData
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Documents",
      value: stats.total,
      icon: FileText,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Verified",
      value: stats.verified,
      icon: CheckCircle,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-md border border-slate-200 bg-white p-4"
          >
            <div className={`rounded-md p-3 ${card.iconBg}`}>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
