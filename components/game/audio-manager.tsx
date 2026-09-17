"use client"

import { useEffect } from "react"
import { audioEngine } from "@/lib/audio-engine"
import { useGameStore } from "@/lib/game-store"

// Bridges React store state -> the imperative audio engine, and drives the
// footstep cadence from the player's live movement flags.
export function AudioManager() {
  const started = useGameStore((s) => s.started)
  const musicEnabled = useGameStore((s) => s.musicEnabled)
  const footstepsEnabled = useGameStore((s) => s.footstepsEnabled)

  useEffect(() => {
    if (started) {
      audioEngine.init()
      audioEngine.resume()
    }
  }, [started])

  useEffect(() => {
    audioEngine.setMusic(musicEnabled)
  }, [musicEnabled])

  useEffect(() => {
    audioEngine.setFootsteps(footstepsEnabled)
  }, [footstepsEnabled])

  useEffect(() => {
    if (!started) return
    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = () => {
      const now = performance.now()
      const dt = (now - last) / 1000
      last = now
      const { moving, running } = useGameStore.getState()
      if (moving) {
        acc += dt
        const interval = running ? 0.28 : 0.45
        if (acc >= interval) {
          acc = 0
          audioEngine.playFootstep(running)
        }
      } else {
        acc = 0.5
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [started])

  return null
}
