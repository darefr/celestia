"use client"

import { GameCanvas } from "./game-canvas"
import { Hud } from "./hud/hud"
import { AudioManager } from "./audio-manager"

export function Game() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#8ec5ff]">
      <GameCanvas />
      <Hud />
      <AudioManager />
    </main>
  )
}
