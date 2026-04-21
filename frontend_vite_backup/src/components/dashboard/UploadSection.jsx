import { useState } from "react"
import { Upload, FileImage, Loader2 } from "lucide-react"
// Bỏ chữ src đi vì mình đang đứng ở src rồi
import { cn } from "../../lib/utils";

export function UploadSection({ onUpload }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      await onUpload(file)
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Tải lên văn bản</h3>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-all hover:border-indigo-400 hover:bg-indigo-50/30">
        <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        {file ? (
          <div className="text-center">
            <FileImage className="mx-auto mb-2 h-10 w-10 text-indigo-600" />
            <p className="text-xs font-bold text-slate-700">{file.name}</p>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p className="text-[10px] font-medium text-slate-400 uppercase">Kéo thả hoặc chọn ảnh scan</p>
          </div>
        )}
      </label>
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-4 flex w-full items-center justify-center rounded-md bg-indigo-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-700 disabled:bg-slate-300"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "XÁC THỰC AI"}
      </button>
    </div>
  )
}