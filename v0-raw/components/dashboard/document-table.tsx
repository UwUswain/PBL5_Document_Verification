"use client"

import { CheckCircle, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Document } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DocumentTableProps {
  documents: Document[]
  onDocumentClick: (doc: Document) => void
  onRefresh: () => void
  isLoading?: boolean
}

function getCategoryStyle(category: string): string {
  switch (category?.toLowerCase()) {
    case "decision":
      return "bg-red-600 text-white"
    case "contract":
      return "bg-green-600 text-white"
    case "dispatch":
      return "bg-blue-600 text-white"
    default:
      return "bg-slate-200 text-slate-700"
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function DocumentTable({
  documents,
  onDocumentClick,
  onRefresh,
  isLoading,
}: DocumentTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Document List</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              File Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {documents.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                No documents found
              </td>
            </tr>
          ) : (
            documents.map((doc) => (
              <tr
                key={doc.id}
                onClick={() => onDocumentClick(doc)}
                className="cursor-pointer transition-colors hover:bg-slate-50"
              >
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {doc.file_name}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-block rounded-md px-2 py-1 text-xs font-semibold uppercase",
                      getCategoryStyle(doc.category)
                    )}
                  >
                    {doc.category || "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {doc.status === "verified" ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-green-600 px-2 py-1 text-xs font-medium text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-600 px-2 py-1 text-xs font-medium text-amber-600">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {formatDate(doc.created_at)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
