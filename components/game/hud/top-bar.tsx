"use client"

import { Music, VolumeX, Footprints, Sun, Moon } from "lucide-react"
import { useGameStore } from "@/lib/game-store"

function formatClock(t: number) {
  const totalMinutes = Math.floor(t * 24 * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export function TopBar() {
  const timeOfDay = useGameStore((s) => s.timeOfDay)
  const musicEnabled = useGameStore((s) => s.musicEnabled)
  const footstepsEnabled = useGameStore((s) => s.footstepsEnabled)
  const toggleMusic = useGameStore((s) => s.toggleMusic)
  const toggleFootsteps = useGameStore((s) => s.toggleFootsteps)

  const isDay = timeOfDay > 0.25 && timeOfDay < 0.75

  return (
    <div className="pointer-events-none absolute left-4 top-[176px] z-20 flex items-center gap-2 sm:left-1/2 sm:top-4 sm:-translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 text-white backdrop-blur-sm">
        {isDay ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-sky-200" />}
        <span className="font-mono text-sm tabular-nums">{formatClock(timeOfDay)}</span>
      </div>

      <button
        data-hud
        onClick={toggleMusic}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
        aria-label={musicEnabled ? "Mute music" : "Play music"}
        aria-pressed={musicEnabled}
      >
        {musicEnabled ? <Music className="h-4 w-4 text-emerald-300" /> : <VolumeX className="h-4 w-4 text-white/60" />}
      </button>

      <button
        data-hud
        onClick={toggleFootsteps}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
        aria-label={footstepsEnabled ? "Disable footstep sounds" : "Enable footstep sounds"}
        aria-pressed={footstepsEnabled}
      >
        <Footprints className={`h-4 w-4 ${footstepsEnabled ? "text-emerald-300" : "text-white/60"}`} />
      </button>
    </div>
  )
}
