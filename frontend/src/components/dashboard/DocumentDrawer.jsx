import { useState, useMemo } from "react"
import { FileText, Bot, QrCode, Shield, X, Search } from "lucide-react"
import { AutoZoomCard } from "./AutoZoomCard"
import { cn } from "../../lib/utils";

export function DocumentDrawer({ document, open, onClose, getImageUrl }) {
  const [isZoomed, setIsZoomed] = useState(false);
  // 🔥 State lưu vị trí chuột để làm tâm phóng
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const aiData = useMemo(() => {
    if (!document || !document.ai_results) return { all: [], summary: document?.summary || "" };
    let entities = [];
    try {
      const parsed = typeof document.ai_results === "string" 
        ? JSON.parse(document.ai_results) : document.ai_results;
      const raw = parsed.entities || (Array.isArray(parsed) ? parsed : []);
      entities = raw.map(e => {
        if (e.box) {
          const [x1, y1, x2, y2] = e.box;
          return { ...e, bbox: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } };
        }
        return e;
      }).filter(e => (e.confidence || 0) > 0.2);
    } catch (e) { console.error(e); }

    return {
      signature: entities.find(e => e.label === "chu_ky" || e.label === "Signature"),
      seal: entities.find(e => e.label === "con_dau" || e.label === "Seal"),
      all: entities,
      summary: document.summary || "AI đang tổng hợp dữ liệu..."
    };
  }, [document]);

  // 🔥 Hàm tính toán vị trí chuột tương đối trong khung ảnh
  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePos({ x, y });
  };

  if (!open || !document) return null;

  const imageUrl = getImageUrl(document.file_path || document.sha256_hash, 'uploads');
  const qrUrl = getImageUrl(document.qr_path);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="h-full w-full max-w-6xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white"><FileText size={20} /></div>
            <div>
              <h2 className="font-bold text-slate-900">{document.file_name}</h2>
              <div className="flex gap-2 mt-0.5">
                <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">{document.category || "Văn bản"}</span>
                <span className="border border-green-600 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Shield size={10} /> VERIFIED</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X /></button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-auto p-6 grid grid-cols-5 gap-6 bg-white">
          <div className="col-span-3 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đối soát AI Detection</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                <Search size={12} /> DI CHUỘT VÀO VÙNG MUỐN SOI CHI TIẾT
              </div>
            </div>
            
            {/* KHUNG CHỨA ẢNH - SMART ZOOM */}
            <div 
              className="relative border-2 border-slate-100 rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in shadow-inner"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  className={cn(
                    "w-full h-auto transition-transform duration-200 ease-out", 
                    isZoomed ? "scale-[2.5]" : "scale-100"
                  )} 
                  style={{
                    // 🔥 Tâm phóng to chính là vị trí chuột
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                  }}
                  alt="Scan" 
                />
              )}

              {/* Bounding Box - Ẩn khi đang zoom để không bị rối mắt */}
              {!isZoomed && aiData.all.map((e, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none transition-opacity"
                  style={{
                    left: `${e.bbox.x}%`, top: `${e.bbox.y}%`,
                    width: `${e.bbox.width}%`, height: `${e.bbox.height}%`,
                  }}
                >
                  <span className="absolute -top-4 left-0 bg-red-500 text-[8px] text-white px-1 font-bold">
                    {e.label === "chu_ky" ? "Chữ ký" : "Con dấu"}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <AutoZoomCard title="Trích xuất Chữ ký" entity={aiData.signature} imageSrc={imageUrl} />
              <AutoZoomCard title="Trích xuất Con dấu" entity={aiData.seal} imageSrc={imageUrl} />
            </div>
          </div>

          <div className="col-span-2 space-y-6">
            <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-xl shadow-indigo-100">
              <div className="flex items-center gap-2 mb-3 opacity-80"><Bot size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest">Tóm tắt AI</span></div>
              <p className="text-sm leading-relaxed font-medium italic">"{aiData.summary}"</p>
            </div>

            <div className="border border-slate-200 p-8 rounded-2xl bg-white text-center shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Mã QR Chứng thực</span>
              {qrUrl ? (
                <div className="relative inline-block group">
                  <img src={qrUrl} className="mx-auto w-40 h-40 border-4 border-slate-50 p-2 rounded-xl shadow-sm bg-white" alt="QR" />
                  <p className="mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">LDHL Verified System</p>
                </div>
              ) : (
                <div className="w-40 h-40 mx-auto bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 italic text-[10px]">QR không khả dụng</div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-tighter">SHA-256 Checksum</p>
              <p className="text-[9px] font-mono text-slate-500 break-all leading-tight">{document.sha256_hash}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}