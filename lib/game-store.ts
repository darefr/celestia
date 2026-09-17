"use client"

import { create } from "@/lib/tiny-store"
import { QUESTS, type QuestId } from "@/lib/entities-config"
import { playerCommands } from "@/lib/player-ref"

const SAVE_KEY = "anime-open-world-save-v2"

export type QuestStatus = "inactive" | "active" | "complete"

export interface QuestProgress {
  status: QuestStatus
  progress: number
  collected: number[] // orb indices collected (for the orb quest)
}

export interface DialogueState {
  npcId: string
  index: number
}

export interface SaveData {
  position: [number, number, number]
  health: number
  stamina: number
  maxHealth: number
  maxStamina: number
  level: number
  xp: number
  coins: number
  quests: Record<string, QuestProgress>
}

export interface GameState {
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number

  // Progression
  level: number
  xp: number
  coins: number
  levelUpAt: number // ms timestamp of last level-up (drives the popup)

  // Live player state (updated from the frame loop, throttled for the mini-map).
  playerX: number
  playerZ: number
  playerYaw: number
  moving: boolean
  running: boolean

  // Interaction / dialogue / quests
  nearbyNpcId: string | null
  dialogue: DialogueState | null
  quests: Record<string, QuestProgress>
  questLogOpen: boolean

  // Death
  dead: boolean

  // Time of day, 0..1 (0 = midnight, 0.5 = noon)
  timeOfDay: number

  // Audio toggles
  musicEnabled: boolean
  footstepsEnabled: boolean

  started: boolean

  setStarted: (v: boolean) => void
  setHealth: (v: number) => void
  setStamina: (v: number) => void
  damagePlayer: (n: number) => void
  healPlayer: (n: number) => void
  setPlayerTransform: (x: number, z: number, yaw: number, moving: boolean, running: boolean) => void
  setTimeOfDay: (v: number) => void
  toggleMusic: () => void
  toggleFootsteps: () => void

  // Progression actions
  gainXp: (amount: number) => void
  addCoins: (n: number) => void

  // Interaction / dialogue
  setNearbyNpc: (id: string | null) => void
  openDialogue: (npcId: string) => void
  nextDialogue: () => void
  closeDialogue: () => void

  // Quests
  startQuest: (id: QuestId) => void
  addQuestProgress: (id: QuestId, amount: number) => void
  collectOrb: (id: QuestId, orbIndex: number) => void
  completeQuest: (id: QuestId) => void
  toggleQuestLog: () => void
  setQuestLogOpen: (v: boolean) => void

  // Death / respawn
  respawn: () => void
}

export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 75
}

function defaultQuests(): Record<string, QuestProgress> {
  const out: Record<string, QuestProgress> = {}
  for (const q of QUESTS) out[q.id] = { status: "inactive", progress: 0, collected: [] }
  return out
}

export function loadSave(): SaveData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SaveData
    if (!Array.isArray(data.position)) return null
    return data
  } catch {
    return null
  }
}

export function writeSave(data: SaveData) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    // ignore quota / privacy-mode errors
  }
}

// Merge saved quest data with the current quest definitions (so newly added
// quests still appear for an old save).
function mergeQuests(saved?: Record<string, QuestProgress>): Record<string, QuestProgress> {
  const base = defaultQuests()
  if (!saved) return base
  for (const id of Object.keys(base)) {
    if (saved[id]) {
      base[id] = {
        status: saved[id].status ?? "inactive",
        progress: saved[id].progress ?? 0,
        collected: Array.isArray(saved[id].collected) ? saved[id].collected : [],
      }
    }
  }
  return base
}

const saved = typeof window !== "undefined" ? loadSave() : null

const initialMaxHealth = saved?.maxHealth ?? 100
const initialMaxStamina = saved?.maxStamina ?? 100

// If the player saved while dead or critically low (e.g. reloaded on the death
// screen), restore them to a safe amount so they don't spawn helpless.
const initialHealth =
  saved?.health && saved.health > 5 ? saved.health : initialMaxHealth

export const useGameStore = create<GameState>((set, get) => ({
  health: initialHealth,
  maxHealth: initialMaxHealth,
  stamina: saved?.stamina ?? initialMaxStamina,
  maxStamina: initialMaxStamina,

  level: saved?.level ?? 1,
  xp: saved?.xp ?? 0,
  coins: saved?.coins ?? 0,
  levelUpAt: 0,

  playerX: saved?.position?.[0] ?? 0,
  playerZ: saved?.position?.[2] ?? 0,
  playerYaw: 0,
  moving: false,
  running: false,

  nearbyNpcId: null,
  dialogue: null,
  quests: mergeQuests(saved?.quests),
  questLogOpen: false,

  dead: false,

  timeOfDay: 0.32,

  musicEnabled: false,
  footstepsEnabled: true,

  started: false,

  setStarted: (v) => set({ started: v }),
  setHealth: (v) => set((s) => ({ health: Math.max(0, Math.min(s.maxHealth, v)) })),
  setStamina: (v) => set((s) => ({ stamina: Math.max(0, Math.min(s.maxStamina, v)) })),
  damagePlayer: (n) =>
    set((s) => {
      if (s.dead) return {}
      const health = Math.max(0, s.health - n)
      return { health, dead: health <= 0 }
    }),
  healPlayer: (n) => set((s) => ({ health: Math.max(0, Math.min(s.maxHealth, s.health + n)) })),
  setPlayerTransform: (x, z, yaw, moving, running) => set({ playerX: x, playerZ: z, playerYaw: yaw, moving, running }),
  setTimeOfDay: (v) => set({ timeOfDay: v }),
  toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
  toggleFootsteps: () => set((s) => ({ footstepsEnabled: !s.footstepsEnabled })),

  gainXp: (amount) =>
    set((s) => {
      let xp = s.xp + amount
      let level = s.level
      let maxHealth = s.maxHealth
      let maxStamina = s.maxStamina
      let leveled = false
      while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level)
        level += 1
        maxHealth += 20
        maxStamina += 10
        leveled = true
      }
      if (leveled) {
        return { xp, level, maxHealth, maxStamina, health: maxHealth, stamina: maxStamina, levelUpAt: Date.now() }
      }
      return { xp }
    }),
  addCoins: (n) => set((s) => ({ coins: s.coins + n })),

  setNearbyNpc: (id) => set((s) => (s.nearbyNpcId === id ? {} : { nearbyNpcId: id })),
  openDialogue: (npcId) => set({ dialogue: { npcId, index: 0 } }),
  nextDialogue: () => set((s) => (s.dialogue ? { dialogue: { ...s.dialogue, index: s.dialogue.index + 1 } } : {})),
  closeDialogue: () => set({ dialogue: null }),

  startQuest: (id) =>
    set((s) => {
      const q = s.quests[id]
      if (!q || q.status !== "inactive") return {}
      return { quests: { ...s.quests, [id]: { ...q, status: "active" } } }
    }),
  addQuestProgress: (id, amount) =>
    set((s) => {
      const q = s.quests[id]
      if (!q || q.status !== "active") return {}
      const def = QUESTS.find((d) => d.id === id)
      const target = def?.target ?? Number.POSITIVE_INFINITY
      const progress = Math.min(target, q.progress + amount)
      return { quests: { ...s.quests, [id]: { ...q, progress } } }
    }),
  collectOrb: (id, orbIndex) =>
    set((s) => {
      const q = s.quests[id]
      if (!q || q.status !== "active" || q.collected.includes(orbIndex)) return {}
      const collected = [...q.collected, orbIndex]
      const def = QUESTS.find((d) => d.id === id)
      const target = def?.target ?? Number.POSITIVE_INFINITY
      const progress = Math.min(target, collected.length)
      return { quests: { ...s.quests, [id]: { ...q, collected, progress } } }
    }),
  completeQuest: (id) =>
    set((s) => {
      const q = s.quests[id]
      if (!q || q.status === "complete") return {}
      return { quests: { ...s.quests, [id]: { ...q, status: "complete" } } }
    }),
  toggleQuestLog: () => set((s) => ({ questLogOpen: !s.questLogOpen })),
  setQuestLogOpen: (v) => set({ questLogOpen: v }),

  respawn: () => {
    playerCommands.respawn = true
    const s = get()
    set({ health: s.maxHealth, stamina: s.maxStamina, dead: false })
  },
}))

// Build a full save snapshot from the current store state plus a fresh position.
export function buildSave(position: [number, number, number]): SaveData {
  const s = useGameStore.getState()
  return {
    position,
    health: s.health,
    stamina: s.stamina,
    maxHealth: s.maxHealth,
    maxStamina: s.maxStamina,
    level: s.level,
    xp: s.xp,
    coins: s.coins,
    quests: s.quests,
  }
}
