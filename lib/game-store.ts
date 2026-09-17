"use client"

import { create } from "@/lib/tiny-store"

const SAVE_KEY = "anime-open-world-save-v1"

export interface SaveData {
  position: [number, number, number]
  health: number
  stamina: number
}

export interface GameState {
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number

  // Live player state (updated from the frame loop, throttled for the mini-map).
  playerX: number
  playerZ: number
  playerYaw: number
  moving: boolean
  running: boolean

  // Time of day, 0..1 (0 = midnight, 0.5 = noon)
  timeOfDay: number

  // Audio toggles
  musicEnabled: boolean
  footstepsEnabled: boolean

  started: boolean

  setStarted: (v: boolean) => void
  setHealth: (v: number) => void
  setStamina: (v: number) => void
  setPlayerTransform: (x: number, z: number, yaw: number, moving: boolean, running: boolean) => void
  setTimeOfDay: (v: number) => void
  toggleMusic: () => void
  toggleFootsteps: () => void
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

const saved = typeof window !== "undefined" ? loadSave() : null

export const useGameStore = create<GameState>((set) => ({
  health: saved?.health ?? 100,
  maxHealth: 100,
  stamina: saved?.stamina ?? 100,
  maxStamina: 100,

  playerX: saved?.position?.[0] ?? 0,
  playerZ: saved?.position?.[2] ?? 0,
  playerYaw: 0,
  moving: false,
  running: false,

  timeOfDay: 0.32,

  musicEnabled: false,
  footstepsEnabled: true,

  started: false,

  setStarted: (v) => set({ started: v }),
  setHealth: (v) => set({ health: Math.max(0, Math.min(100, v)) }),
  setStamina: (v) => set({ stamina: Math.max(0, Math.min(100, v)) }),
  setPlayerTransform: (x, z, yaw, moving, running) => set({ playerX: x, playerZ: z, playerYaw: yaw, moving, running }),
  setTimeOfDay: (v) => set({ timeOfDay: v }),
  toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
  toggleFootsteps: () => set((s) => ({ footstepsEnabled: !s.footstepsEnabled })),
}))
