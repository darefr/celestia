"use client"

import { Heart, Zap } from "lucide-react"
import { useGameStore } from "@/lib/game-store"

function Bar({
  value,
  max,
  color,
  trackColor,
  icon,
  label,
}: {
  value: number
  max: number
  color: string
  trackColor: string
  icon: React.ReactNode
  label: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-white">{icon}</div>
      <div className="w-24 sm:w-40">
        <div className="mb-0.5 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-white/80">
          <span>{label}</span>
          <span>{Math.round(value)}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: trackColor }}>
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  )
}

export function StatBars() {
  const health = useGameStore((s) => s.health)
  const maxHealth = useGameStore((s) => s.maxHealth)
  const stamina = useGameStore((s) => s.stamina)
  const maxStamina = useGameStore((s) => s.maxStamina)

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-col gap-2 rounded-xl bg-black/25 p-3 backdrop-blur-sm">
      <Bar
        value={health}
        max={maxHealth}
        color="#ef4444"
        trackColor="rgba(0,0,0,0.45)"
        icon={<Heart className="h-4 w-4" fill="currentColor" />}
        label="Health"
      />
      <Bar
        value={stamina}
        max={maxStamina}
        color="#22d3aa"
        trackColor="rgba(0,0,0,0.45)"
        icon={<Zap className="h-4 w-4" fill="currentColor" />}
        label="Stamina"
      />
    </div>
  )
}
