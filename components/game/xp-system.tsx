"use client"

import { useEffect, useRef, useState } from "react"
import { Coins, Star } from "lucide-react"
import { useGameStore, xpForLevel } from "@/lib/game-store"

export function XpSystem() {
  const level = useGameStore((s) => s.level)
  const xp = useGameStore((s) => s.xp)
  const coins = useGameStore((s) => s.coins)
  const levelUpAt = useGameStore((s) => s.levelUpAt)

  const [showLevelUp, setShowLevelUp] = useState(false)
  const firstRun = useRef(true)

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (levelUpAt === 0) return
    setShowLevelUp(true)
    const t = setTimeout(() => setShowLevelUp(false), 2200)
    return () => clearTimeout(t)
  }, [levelUpAt])

  const need = xpForLevel(level)
  const pct = Math.max(0, Math.min(100, (xp / need) * 100))

  return (
    <>
      {/* Progression panel: level, XP, coins (below the stat bars) */}
      <div className="pointer-events-none absolute left-4 top-[96px] z-20 flex w-[184px] flex-col gap-1.5 rounded-xl bg-black/25 p-3 backdrop-blur-sm sm:top-[104px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 rounded-md bg-amber-400/90 px-2 py-0.5 text-xs font-bold text-slate-950">
            <Star className="h-3 w-3" fill="currentColor" /> Lv {level}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-300">
            <Coins className="h-4 w-4" /> {coins}
          </span>
        </div>
        <div>
          <div className="mb-0.5 flex justify-between text-[9px] font-semibold uppercase tracking-wider text-white/70">
            <span>XP</span>
            <span>
              {Math.floor(xp)}/{need}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/45">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Level-up popup + particle burst */}
      {showLevelUp && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <div className="relative">
            {/* radiating sparks */}
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i / 10) * Math.PI * 2
              return (
                <span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-amber-300"
                  style={{
                    transform: `translate(${Math.cos(angle) * 70}px, ${Math.sin(angle) * 70}px)`,
                    animationDelay: `${(i % 5) * 80}ms`,
                  }}
                />
              )
            })}
            <div className="animate-in zoom-in-50 fade-in rounded-2xl border border-amber-300/40 bg-slate-950/85 px-8 py-5 text-center shadow-2xl backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Level Up</p>
              <p className="mt-1 text-4xl font-black text-white">Lv {level}</p>
              <p className="mt-1 text-xs text-white/60">+20 Max Health &middot; +10 Max Stamina</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
