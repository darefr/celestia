"use client"

import { useCallback, useEffect } from "react"
import { MessageCircle } from "lucide-react"
import { useGameStore } from "@/lib/game-store"
import { NPCS, QUESTS } from "@/lib/entities-config"

function npcById(id: string) {
  return NPCS.find((n) => n.id === id)
}

// Resolve which dialogue lines to show + what happens when the conversation
// ends, based on the NPC's quest state.
function resolveDialogue(npcId: string) {
  const npc = npcById(npcId)
  if (!npc) return { npc: null, lines: [] as string[], onEnd: () => {} }

  const store = useGameStore.getState()
  const noop = () => {}

  if (!npc.questId) {
    return { npc, lines: npc.dialogue.intro, onEnd: noop }
  }

  const quest = store.quests[npc.questId]
  const def = QUESTS.find((q) => q.id === npc.questId)
  const target = def?.target ?? 0

  if (!quest || quest.status === "inactive") {
    return {
      npc,
      lines: npc.dialogue.intro,
      onEnd: () => useGameStore.getState().startQuest(npc.questId!),
    }
  }
  if (quest.status === "active" && quest.progress >= target) {
    return {
      npc,
      lines: npc.dialogue.ready ?? npc.dialogue.intro,
      onEnd: () => {
        const s = useGameStore.getState()
        if (def) {
          s.addCoins(def.reward.coins)
          s.gainXp(def.reward.xp)
        }
        s.completeQuest(npc.questId!)
      },
    }
  }
  if (quest.status === "active") {
    return { npc, lines: npc.dialogue.active ?? npc.dialogue.intro, onEnd: noop }
  }
  // complete
  return { npc, lines: npc.dialogue.done ?? npc.dialogue.intro, onEnd: noop }
}

export function Dialogue() {
  const dialogue = useGameStore((s) => s.dialogue)
  const nearbyNpcId = useGameStore((s) => s.nearbyNpcId)
  const dead = useGameStore((s) => s.dead)
  // Subscribe to quests so the prompt/label reacts to quest state changes.
  useGameStore((s) => s.quests)

  const openDialogue = useGameStore((s) => s.openDialogue)
  const nextDialogue = useGameStore((s) => s.nextDialogue)
  const closeDialogue = useGameStore((s) => s.closeDialogue)

  const advance = useCallback(() => {
    const state = useGameStore.getState()
    const d = state.dialogue
    if (!d) return
    const { lines, onEnd } = resolveDialogue(d.npcId)
    if (d.index >= lines.length - 1) {
      onEnd()
      closeDialogue()
    } else {
      nextDialogue()
    }
  }, [closeDialogue, nextDialogue])

  const interact = useCallback(() => {
    const state = useGameStore.getState()
    if (state.dead) return
    if (state.dialogue) {
      advance()
    } else if (state.nearbyNpcId) {
      openDialogue(state.nearbyNpcId)
    }
  }, [advance, openDialogue])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        e.preventDefault()
        interact()
      } else if (e.code === "Escape") {
        if (useGameStore.getState().dialogue) closeDialogue()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [interact, closeDialogue])

  // --- Interaction prompt (no dialogue open) ---
  if (!dialogue) {
    if (!nearbyNpcId || dead) return null
    const npc = npcById(nearbyNpcId)
    if (!npc) return null
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-36 z-30 flex justify-center px-4 sm:bottom-28">
        <button
          data-hud
          onPointerDown={(e) => {
            e.preventDefault()
            interact()
          }}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition active:scale-95"
        >
          <MessageCircle className="h-4 w-4 text-emerald-300" />
          <span>
            Talk to <span className="font-semibold text-emerald-300">{npc.name}</span>
          </span>
          <kbd className="ml-1 hidden rounded bg-white/15 px-1.5 py-0.5 font-mono text-xs sm:inline">E</kbd>
        </button>
      </div>
    )
  }

  // --- Dialogue panel ---
  const { npc, lines } = resolveDialogue(dialogue.npcId)
  if (!npc) return null
  const line = lines[Math.min(dialogue.index, lines.length - 1)] ?? ""
  const isLast = dialogue.index >= lines.length - 1

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-4 sm:pb-6">
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          {/* Portrait placeholder */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 text-xl font-bold text-white shadow-inner"
            style={{ background: `linear-gradient(140deg, ${npc.bodyColor}, ${npc.accentColor})` }}
            aria-hidden
          >
            {npc.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold tracking-wide text-emerald-300">{npc.name}</p>
              <span className="text-[10px] uppercase tracking-widest text-white/40">
                {dialogue.index + 1}/{lines.length}
              </span>
            </div>
            <p className="mt-1 min-h-[2.5rem] text-pretty text-sm leading-relaxed text-white/90">{line}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            data-hud
            onPointerDown={(e) => {
              e.preventDefault()
              closeDialogue()
            }}
            className="pointer-events-auto rounded-lg px-3 py-1.5 text-xs font-medium text-white/60 transition hover:text-white"
          >
            Close
          </button>
          <button
            data-hud
            onPointerDown={(e) => {
              e.preventDefault()
              advance()
            }}
            className="pointer-events-auto rounded-lg bg-emerald-500 px-5 py-1.5 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 active:scale-95"
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}
