"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ZoomIn } from "lucide-react"
import type { DetectedEntity } from "@/lib/types"

interface ImageZoomLensProps {
  src: string
  alt: string
  entities?: DetectedEntity[]
}

export function ImageZoomLens({ src, alt, entities = [] }: ImageZoomLensProps) {
  const [isZooming, setIsZooming] = useState(false)
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 })
  const [bgPosition, setBgPosition] = useState({ x: 0, y: 0 })
  const [imgLoaded, setImgLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const ZOOM = 2.5
  const LENS = 120

  // Preload image
  useEffect(() => {
    const img = new Image()
    img.onload = () => setImgLoaded(true)
    img.src = src
  }, [src])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Clamp lens position
    const half = LENS / 2
    const lensX = Math.max(half, Math.min(x, rect.width - half))
    const lensY = Math.max(half, Math.min(y, rect.height - half))

    setLensPosition({ x: lensX, y: lensY })
    setBgPosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    })
  }, [])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative cursor-crosshair overflow-hidden rounded-md border border-slate-200"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-auto w-full"
          draggable={false}
        />

        {/* Bounding Boxes */}
        {entities.map((entity, idx) => (
          <div
            key={idx}
            className="absolute border-2 border-red-600"
            style={{
              left: `${entity.bbox.x}%`,
              top: `${entity.bbox.y}%`,
              width: `${entity.bbox.width}%`,
              height: `${entity.bbox.height}%`,
            }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap rounded-md bg-red-600 px-1 py-0.5 text-xs font-medium text-white">
              {entity.label}
            </span>
          </div>
        ))}

        {/* Magnifier Lens */}
        {isZooming && imgLoaded && (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-indigo-600"
            style={{
              width: LENS,
              height: LENS,
              left: lensPosition.x - LENS / 2,
              top: lensPosition.y - LENS / 2,
              backgroundImage: `url(${src})`,
              backgroundSize: `${ZOOM * 100}%`,
              backgroundPosition: `${bgPosition.x}% ${bgPosition.y}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}

        {/* Zoom Icon */}
        <div className="absolute right-2 top-2 rounded-md border border-slate-200 bg-white p-1.5">
          <ZoomIn className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      <p className="mt-1.5 text-center text-xs text-slate-400">
        Di chuột để phóng to
      </p>
    </div>
  )
}
