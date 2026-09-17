"use client"

import { useEffect } from "react"
import { ScrollText, X, Check } from "lucide-react"
import { useGameStore } from "@/lib/game-store"
import { QUESTS } from "@/lib/entities-config"

export function QuestSystem() {
  const open = useGameStore((s) => s.questLogOpen)
  const quests = useGameStore((s) => s.quests)
  const setOpen = useGameStore((s) => s.setQuestLogOpen)
  const toggle = useGameStore((s) => s.toggleQuestLog)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyQ") {
        e.preventDefault()
        useGameStore.getState().toggleQuestLog()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const visibleQuests = QUESTS.filter((q) => {
    const p = quests[q.id]
    return p && p.status !== "inactive"
  })

  const activeCount = visibleQuests.filter((q) => quests[q.id]?.status === "active").length

  return (
    <>
      {/* Toggle button (bottom-left cluster on desktop, above joystick on mobile) */}
      <button
        data-hud
        onClick={toggle}
        className="pointer-events-auto absolute right-4 top-[164px] z-30 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-black/60 sm:top-[212px]"
        aria-label="Toggle quest log"
        aria-pressed={open}
      >
        <ScrollText className="h-4 w-4 text-amber-300" />
        <span className="hidden sm:inline">Quests</span>
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-950">
            {activeCount}
          </span>
        )}
        <kbd className="ml-0.5 hidden rounded bg-white/15 px-1 font-mono text-[10px] sm:inline">Q</kbd>
      </button>

      {open && (
        <div className="pointer-events-auto absolute right-4 top-[212px] z-30 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/15 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md sm:top-[260px]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <ScrollText className="h-4 w-4 text-amber-300" /> Quest Log
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-white/50 transition hover:text-white"
              aria-label="Close quest log"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {visibleQuests.length === 0 ? (
            <p className="text-pretty text-xs leading-relaxed text-white/60">
              No active quests yet. Explore the city and village and talk to characters marked with a
              <span className="mx-1 font-bold text-amber-300">!</span>
              above their head.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visibleQuests.map((q) => {
                const p = quests[q.id]
                const done = p.status === "complete"
                const pct = Math.min(100, (p.progress / q.target) * 100)
                return (
                  <li
                    key={q.id}
                    className={`rounded-xl border p-3 ${
                      done ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white">{q.title}</h3>
                      {done ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                          <Check className="h-3 w-3" /> Done
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono tabular-nums text-amber-300">
                          {p.progress}/{q.target}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-pretty text-xs leading-relaxed text-white/60">{q.desc}</p>
                    {!done && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                        <div className="h-full rounded-full bg-amber-400 transition-[width]" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    <p className="mt-2 text-[10px] text-white/40">
                      Reward: {q.reward.xp} XP, {q.reward.coins} coins
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
