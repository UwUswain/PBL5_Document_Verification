"use client"

import { Search } from "lucide-react"

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearchSubmit: () => void
}

export function Header({ searchQuery, onSearchChange, onSearchSubmit }: HeaderProps) {
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Hệ thống phân loại, tóm tắt, tìm kiếm văn bản scan
        </h1>
        <p className="text-sm text-slate-500">
          OCR &amp; Gemini AI Document Processing
        </p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm ngữ nghĩa..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearchSubmit()
            }
          }}
          className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
        />
      </div>
    </header>
  )
}
