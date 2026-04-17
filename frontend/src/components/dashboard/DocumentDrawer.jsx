import { useState, useMemo } from "react"
import { FileText, Bot, Hash, ChevronDown, ChevronUp, QrCode, Shield, Clock } from "lucide-react"
import { AutoZoomCard } from "./AutoZoomCard"
// Bỏ chữ src đi vì mình đang đứng ở src rồi
import { cn } from "../../lib/utils";

export function DocumentDrawer({ document, open, onClose, getImageUrl }) {
  const [ocrExpanded, setOcrExpanded] = useState(false)

  const { signatureEntity, sealEntity, allEntities } = useMemo(() => {
    const entities = document?.ai_results?.entities || []
    return {
      signatureEntity: entities.find((e) => e.label === "chu_ky"),
      sealEntity: entities.find((e) => e.label === "con_dau"),
      allEntities: entities,
    }
  }, [document])

  if (!open || !document) return null

  const imageUrl = getImageUrl(document.file_path || document.image_url)
  const qrUrl = document.qr_path || document.qr_url

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-5xl animate-in slide-in-from-right bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{document.file_name}</h2>
              <div className="mt-1 flex gap-2">
                <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  {document.category || "Khác"}
                </span>
                <span className="flex items-center gap-1 rounded border border-green-600 px-2 py-0.5 text-[10px] font-bold text-green-600 uppercase">
                  <Shield className="h-3 w-3" /> {document.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕ Đóng</button>
        </div>

        {/* Body Scroll Area */}
        <div className="h-[calc(100vh-80px)] overflow-y-auto p-6">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Cột trái: Ảnh & Zoom (60%) */}
            <div className="space-y-6 lg:col-span-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Đối soát hình ảnh</h3>
              
              {/* Ảnh gốc có vẽ Bounding Box */}
              <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <img src={imageUrl} alt="Document" className="w-full h-auto" />
                {allEntities.map((entity, idx) => (
                  <div
                    key={idx}
                    className="absolute border-2 border-red-500 bg-red-500/10"
                    style={{
                      left: `${entity.bbox.x}%`,
                      top: `${entity.bbox.y}%`,
                      width: `${entity.bbox.width}%`,
                      height: `${entity.bbox.height}%`,
                    }}
                  >
                    <span className="absolute -top-4 left-0 bg-red-500 px-1 text-[8px] font-bold text-white uppercase">
                      {entity.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hai ô Auto Zoom cận cảnh */}
              <div className="grid grid-cols-2 gap-4">
                <AutoZoomCard title="Trích xuất chữ ký" entity={signatureEntity} imageSrc={imageUrl} notFoundText="Không thấy chữ ký" />
                <AutoZoomCard title="Trích xuất con dấu" entity={sealEntity} imageSrc={imageUrl} notFoundText="Không thấy con dấu" />
              </div>
            </div>

            {/* Cột phải: Thông tin AI (40%) */}
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kết quả phân tích AI</h3>
              
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                <div className="mb-2 flex items-center gap-2 text-indigo-600">
                  <Bot className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Tóm tắt văn bản</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 italic">"{document.summary || "Đang cập nhật..."}"</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px]">
                  <QrCode className="h-4 w-4" /> QR Chứng thực
                </div>
                <div className="flex justify-center">
                  <img src={qrUrl} className="h-32 w-32 border p-1 rounded bg-white" alt="QR" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 font-mono">
                <div className="mb-1 text-[10px] text-slate-400 font-bold uppercase">Mã SHA-256</div>
                <div className="break-all text-[10px] text-slate-500 leading-tight">{document.sha256_hash}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}