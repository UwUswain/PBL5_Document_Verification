import { useRef, useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
// Bỏ chữ src đi vì mình đang đứng ở src rồi
import { cn } from "../../lib/utils";

export function AutoZoomCard({ title, entity, imageSrc, notFoundText }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!entity || !canvasRef.current) {
      setLoading(false)
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setLoading(true)
    setError(false)

    const img = new Image()
    img.crossOrigin = "anonymous"
    
    img.onload = () => {
      // Tính toán vùng cắt dựa trên tọa độ % từ AI
      const cropX = (entity.bbox.x / 100) * img.width
      const cropY = (entity.bbox.y / 100) * img.height
      const cropW = (entity.bbox.width / 100) * img.width
      const cropH = (entity.bbox.height / 100) * img.height

      // Thêm lề (padding) xung quanh vùng cắt để nhìn rõ hơn
      const padding = Math.max(cropW, cropH) * 0.3
      const srcX = Math.max(0, cropX - padding)
      const srcY = Math.max(0, cropY - padding)
      const srcW = Math.min(img.width - srcX, cropW + padding * 2)
      const srcH = Math.min(img.height - srcY, cropH + padding * 2)

      // Kích thước ô hiển thị cố định
      const size = 160
      canvas.width = size
      canvas.height = size

      ctx.fillStyle = "#F8FAFC"
      ctx.fillRect(0, 0, size, size)

      // Vẽ ảnh đã cắt vào canvas
      const scale = Math.min(size / srcW, size / srcH)
      const drawW = srcW * scale
      const drawH = srcH * scale
      const offsetX = (size - drawW) / 2
      const offsetY = (size - drawH) / 2

      ctx.drawImage(img, srcX, srcY, srcW, srcH, offsetX, offsetY, drawW, drawH)
      setLoading(false)
    }

    img.onerror = () => {
      setError(true)
      setLoading(false)
    }

    img.src = imageSrc
  }, [entity, imageSrc])

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-3 py-2 bg-slate-50">
        <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {title}
        </h5>
      </div>
      <div className="p-3">
        {entity ? (
          <div className="flex flex-col items-center">
            <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              {loading ? (
                <div className="text-xs text-slate-400 animate-pulse">Đang trích xuất...</div>
              ) : error ? (
                <div className="flex flex-col items-center text-slate-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="mt-1 text-[10px]">Lỗi ảnh</span>
                </div>
              ) : (
                <canvas ref={canvasRef} className="max-h-full max-w-full" />
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                AI DETECTED
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {Math.round(entity.confidence * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50">
            <AlertCircle className="h-6 w-6 text-slate-300" />
            <p className="mt-2 text-center text-[10px] text-slate-400 uppercase font-medium">
              {notFoundText}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}