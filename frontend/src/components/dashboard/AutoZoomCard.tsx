'use client';

import { useRef, useEffect, useState } from "react";
import { WarningOutlined } from "@ant-design/icons";

interface AutoZoomCardProps {
  title: string;
  entity: any;
  imageSrc: string | null;
  notFoundText?: string;
}

export function AutoZoomCard({ title, entity, imageSrc, notFoundText = "KHÔNG TÌM THẤY" }: AutoZoomCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entity || !canvasRef.current || !imageSrc) {
      setLoading(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setLoading(true);
    setError(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const { width, height } = img;
      const cropX = (entity.bbox.x / 1000) * width;
      const cropY = (entity.bbox.y / 1000) * height;
      const cropW = (entity.bbox.width / 1000) * width;
      const cropH = (entity.bbox.height / 1000) * height;

      const padding = Math.max(cropW, cropH) * 0.4;
      const srcX = Math.max(0, Math.min(width - 1, cropX - padding));
      const srcY = Math.max(0, Math.min(height - 1, cropY - padding));
      const srcW = Math.max(1, Math.min(width - srcX, cropW + padding * 2));
      const srcH = Math.max(1, Math.min(height - srcY, cropH + padding * 2));

      const size = 200;
      canvas.width = size;
      canvas.height = size;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      const scale = Math.min(size / srcW, size / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const offsetX = (size - drawW) / 2;
      const offsetY = (size - drawH) / 2;

      try {
        ctx.drawImage(img, srcX, srcY, srcW, srcH, offsetX, offsetY, drawW, drawH);
        setLoading(false);
      } catch (e) {
        console.error("Canvas draw error:", e);
        setError(true);
        setLoading(false);
      }
    };

    img.onerror = () => {
      setError(true);
      setLoading(false);
    };

    img.src = imageSrc;
  }, [entity, imageSrc]);

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, background: '#fff' }}>
      <div style={{ padding: '8px 12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        <h5 style={{ margin: 0, fontSize: 11, fontWeight: 'bold', color: '#8c8c8c', textTransform: 'uppercase' }}>
          {title}
        </h5>
      </div>
      <div style={{ padding: 12 }}>
        {entity ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: 120, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 4, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ fontSize: 12, color: '#bfbfbf' }}>Đang trích xuất...</div>
              ) : error ? (
                <div style={{ textAlign: 'center', color: '#bfbfbf' }}>
                  <WarningOutlined style={{ fontSize: 20 }} />
                  <div style={{ fontSize: 11, marginTop: 4 }}>Lỗi ảnh</div>
                </div>
              ) : (
                <canvas ref={canvasRef} style={{ maxHeight: '100%', maxWidth: '100%' }} />
              )}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#1677ff', color: '#fff', fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4 }}>
                AI DETECTED
              </span>
              <span style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace' }}>
                {Math.round(entity.confidence * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 4, border: '1px dashed #d9d9d9' }}>
            <WarningOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
            <div style={{ marginTop: 8, fontSize: 11, color: '#bfbfbf', fontWeight: 500, textTransform: 'uppercase' }}>
              {notFoundText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
