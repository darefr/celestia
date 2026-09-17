"use client"

import { useEffect, useRef, useState } from "react"
import { playerRef } from "@/lib/player-ref"
import { ZONES, WORLD_SIZE } from "@/lib/world-config"

export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState(160) // px

  useEffect(() => {
    const onResize = () => setSize(window.innerWidth < 640 ? 108 : 160)
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const SIZE = size
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    const half = WORLD_SIZE / 2
    const toPx = (world: number) => ((world + half) / WORLD_SIZE) * SIZE

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE)

      // background
      ctx.fillStyle = "#1c2432"
      ctx.fillRect(0, 0, SIZE, SIZE)

      // paths from hub (0,0) to each zone
      ctx.strokeStyle = "rgba(183,155,110,0.7)"
      ctx.lineWidth = 3
      const hubX = toPx(0)
      const hubY = toPx(0)
      for (const zone of ZONES) {
        ctx.beginPath()
        ctx.moveTo(hubX, hubY)
        ctx.lineTo(toPx(zone.center[0]), toPx(zone.center[1]))
        ctx.stroke()
      }

      // zones
      for (const zone of ZONES) {
        const cx = toPx(zone.center[0])
        const cy = toPx(zone.center[1])
        const r = (zone.radius / WORLD_SIZE) * SIZE
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(zone.color, 0.28)
        ctx.fill()
        ctx.strokeStyle = zone.color
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = "rgba(255,255,255,0.85)"
        ctx.font = "9px system-ui, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(zone.label, cx, cy - r - 3)
      }

      // player dot + facing
      const px = toPx(playerRef.position.x)
      const py = toPx(playerRef.position.z)
      const yaw = playerRef.yaw

      // facing triangle
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(-yaw)
      ctx.beginPath()
      ctx.moveTo(0, -8)
      ctx.lineTo(5, 5)
      ctx.lineTo(-5, 5)
      ctx.closePath()
      ctx.fillStyle = "#ffffff"
      ctx.fill()
      ctx.restore()

      ctx.beginPath()
      ctx.arc(px, py, 3.2, 0, Math.PI * 2)
      ctx.fillStyle = "#f43f5e"
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 1.5
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [size])

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-xl border border-white/15 bg-black/30 p-1.5 backdrop-blur-sm">
      <canvas ref={canvasRef} style={{ width: size, height: size }} className="rounded-lg" />
      <div className="mt-1 text-center text-[9px] font-semibold uppercase tracking-widest text-white/60">Map</div>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "")
  const r = Number.parseInt(h.substring(0, 2), 16)
  const g = Number.parseInt(h.substring(2, 4), 16)
  const b = Number.parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
