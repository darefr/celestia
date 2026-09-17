"use client"

import { useGameStore } from "@/lib/game-store"
import { Keyboard, Mouse, Move } from "lucide-react"

export function StartOverlay() {
  const started = useGameStore((s) => s.started)
  const setStarted = useGameStore((s) => s.setStarted)

  if (started) return null

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-slate-900/90 to-slate-950/95 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Open World</p>
        <h1 className="mt-2 text-balance text-4xl font-bold text-white">Aetheria</h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-white/70">
          Explore a stylized world of city, village, and misty forest peaks. Wander, run, and leap across a living
          day and night.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-2 text-left text-sm text-white/80">
          <div className="flex items-center gap-3 rounded-lg bg-black/30 px-3 py-2">
            <Keyboard className="h-4 w-4 shrink-0 text-emerald-300" />
            <span>WASD / Arrows to move, Shift to run, Space to jump</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-black/30 px-3 py-2">
            <Mouse className="h-4 w-4 shrink-0 text-emerald-300" />
            <span>Drag to orbit the camera, scroll to zoom</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-black/30 px-3 py-2">
            <Move className="h-4 w-4 shrink-0 text-emerald-300" />
            <span>On touch devices: joystick to move, button to jump</span>
          </div>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="mt-7 w-full rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg transition hover:bg-emerald-400 active:scale-[0.98]"
        >
          Enter World
        </button>
        <p className="mt-3 text-xs text-white/40">Your position and stats are saved automatically.</p>
      </div>
    </div>
  )
}
