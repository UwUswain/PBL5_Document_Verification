"use client"

import { useState, useMemo } from "react"
import { FileText, Bot, Hash, ChevronDown, ChevronUp, QrCode, Shield, Clock } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageZoomLens } from "./image-zoom-lens"
import { AutoZoomCard } from "./auto-zoom-card"
import type { Document } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DocumentDrawerProps {
  document: Document | null
  open: boolean
  onClose: () => void
  getImageUrl: (path: string | undefined) => string
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

export function DocumentDrawer({
  document,
  open,
  onClose,
  getImageUrl,
}: DocumentDrawerProps) {
  const [ocrExpanded, setOcrExpanded] = useState(false)

  const { signatureEntity, sealEntity, allEntities } = useMemo(() => {
    const entities = document?.ai_results?.entities || []
    return {
      signatureEntity: entities.find((e) => e.label === "chu_ky"),
      sealEntity: entities.find((e) => e.label === "con_dau"),
      allEntities: entities,
    }
  }, [document?.ai_results?.entities])

  if (!document) return null

  const imageUrl = getImageUrl(document.file_path || document.image_url)
  const qrUrl = getImageUrl(document.qr_path || document.qr_url)

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-5xl"
      >
        {/* Header */}
        <SheetHeader className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-base font-semibold text-slate-900">
                {document.file_name}
              </SheetTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-semibold uppercase",
                    getCategoryStyle(document.category)
                  )}
                >
                  {document.category || "Unknown"}
                </span>
                {document.status === "verified" ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-green-600 px-2 py-1 text-xs font-medium text-green-600">
                    <Shield className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-600 px-2 py-1 text-xs font-medium text-amber-600">
                    <Clock className="h-3 w-3" />
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          {/* Two-Column Layout: 60/40 */}
          <div className="grid gap-6 p-6 lg:grid-cols-5">
            {/* Left Column - Visual (60%) */}
            <div className="space-y-4 lg:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Visual Verification
              </h3>

              {/* Document Image with Magnifier */}
              {imageUrl && (
                <ImageZoomLens
                  src={imageUrl}
                  alt={document.file_name}
                  entities={allEntities}
                />
              )}

              {/* Auto-Zoom Cards */}
              <div className="grid grid-cols-2 gap-4">
                <AutoZoomCard
                  title="Trích xuất chữ ký"
                  entity={signatureEntity}
                  imageSrc={imageUrl}
                  notFoundText="Không phát hiện chữ ký"
                />
                <AutoZoomCard
                  title="Trích xuất con dấu"
                  entity={sealEntity}
                  imageSrc={imageUrl}
                  notFoundText="Không phát hiện con dấu"
                />
              </div>
            </div>

            {/* Right Column - AI Info (40%) */}
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                AI Insights
              </h3>

              {/* Gemini Summary */}
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Gemini Summary
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  {document.summary ||
                    document.ai_results?.summary ||
                    "AI chưa tóm tắt tài liệu này."}
                </p>
              </div>

              {/* Detected Entities */}
              {allEntities.length > 0 && (
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detected Entities
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allEntities.map((entity, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-indigo-600 px-2 py-1 text-xs font-medium text-indigo-600"
                      >
                        {entity.label} ({Math.round(entity.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {qrUrl && (
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      QR Code
                    </span>
                  </div>
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="QR Code"
                      className="h-28 w-28 rounded-md border border-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* SHA-256 Hash */}
              {document.sha256_hash && (
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      SHA-256 Hash
                    </span>
                  </div>
                  <p className="break-all font-mono text-xs text-slate-500">
                    {document.sha256_hash}
                  </p>
                </div>
              )}

              {/* OCR Content - Collapsible */}
              <div className="rounded-md border border-slate-200 bg-white">
                <button
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50"
                  onClick={() => setOcrExpanded(!ocrExpanded)}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    OCR Content
                  </span>
                  {ocrExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {ocrExpanded && (
                  <div className="border-t border-slate-200 p-4">
                    <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-slate-600">
                      {document.raw_text || "Không có dữ liệu OCR."}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
