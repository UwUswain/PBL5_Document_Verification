import { useMemo } from "react"
import { FileText, Bot, QrCode, Shield, X } from "lucide-react"
import { AutoZoomCard } from "./AutoZoomCard"

export function DocumentDrawer({ document, open, onClose, getImageUrl }) {
  const aiData = useMemo(() => {
    if (!document) return { allEntities: [], summaryText: "" };
    let entities = [];
    if (document.ai_results) {
      try {
        const parsed = typeof document.ai_results === "string"
            ? JSON.parse(document.ai_results) : document.ai_results;

        entities = (parsed.entities || [])
          .filter((e) => e.confidence > 0.3)
          .map((e) => {
            const [x1, y1, x2, y2] = e.box;
            return {
              ...e,
              bbox: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
            };
          });
      } catch (e) { console.error("Lỗi parse AI:", e); }
    }
    return {
      signatureEntity: entities.find(e => e.label === "chu_ky" || e.label === "Signature"),
      sealEntity: entities.find(e => e.label === "con_dau" || e.label === "Seal"),
      allEntities: entities,
      summaryText: document.summary || "AI đang tổng hợp...",
    };
  }, [document]);

  if (!open || !document) return null;

  const imageUrl = getImageUrl(document.file_path || document.image_url, "uploads");
  const qrUrl = getImageUrl(document.qr_path, "qrcodes");

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-5xl bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white"><FileText size={20} /></div>
            <div>
              <h2 className="font-bold text-slate-900">{document.file_name}</h2>
              <div className="flex gap-2 mt-1">
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{document.category || "Văn bản"}</span>
                <span className="border border-green-600 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Shield size={10} /> VERIFIED
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-6 grid grid-cols-5 gap-8 bg-slate-50/50">
          <div className="col-span-3 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đối soát AI Detection</h3>
            {imageUrl && (
              <div className="relative border-2 border-white rounded-xl overflow-hidden shadow-lg bg-white">
                <img src={imageUrl} className="w-full h-auto" alt="Scan" />
                {aiData.allEntities.map((e, i) => (
                  <div
                    key={i}
                    className="absolute border-2 border-red-500 bg-red-500/10"
                    style={{
                      left: `${e.bbox.x}%`, // Đã thêm đơn vị %
                      top: `${e.bbox.y}%`,
                      width: `${e.bbox.width}%`,
                      height: `${e.bbox.height}%`,
                    }}
                  >
                    <span className="absolute -top-5 left-0 bg-red-500 text-[8px] text-white px-1 font-bold">
                      {e.label === "chu_ky" ? "CHỮ KÝ" : "CON DẤU"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <AutoZoomCard title="Chữ ký" entity={aiData.signatureEntity} imageSrc={imageUrl} />
              <AutoZoomCard title="Con dấu" entity={aiData.sealEntity} imageSrc={imageUrl} />
            </div>
          </div>

          <div className="col-span-2 space-y-6">
            <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl shadow-indigo-100">
              <div className="flex items-center gap-2 mb-4 opacity-80"><Bot size={18} /> <span className="text-[10px] font-bold uppercase tracking-widest">Tóm tắt AI</span></div>
              <p className="text-sm leading-relaxed italic">"{aiData.summaryText}"</p>
            </div>
            {qrUrl && (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">QR Chứng thực Blockchain</span>
                <img src={qrUrl} className="mx-auto w-40 h-40 border-4 border-slate-50 p-2 rounded-xl" alt="QR" />
                <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase">BKDN Verified</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}