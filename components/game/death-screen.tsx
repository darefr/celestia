"use client"

import { Skull } from "lucide-react"
import { useGameStore } from "@/lib/game-store"

export function DeathScreen() {
  const dead = useGameStore((s) => s.dead)
  const respawn = useGameStore((s) => s.respawn)

  if (!dead) return null

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-red-950/70 to-slate-950/90 backdrop-blur-sm">
      <div className="mx-4 flex max-w-sm flex-col items-center rounded-2xl border border-red-500/30 bg-slate-950/80 p-8 text-center shadow-2xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <Skull className="h-9 w-9" />
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-wide text-red-400">You Died</h1>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-white/60">
          The wilds got the better of you. Your progress, coins, and XP are safe.
        </p>
        <button
          onClick={respawn}
          className="mt-6 w-full rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg transition hover:bg-emerald-400 active:scale-[0.98]"
        >
          Respawn
        </button>
      </div>
    </div>
  )
}
