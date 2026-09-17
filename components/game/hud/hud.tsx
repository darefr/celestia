"use client"

import { StatBars } from "./stat-bars"
import { MiniMap } from "./mini-map"
import { TopBar } from "./top-bar"
import { MobileControls } from "./mobile-controls"
import { StartOverlay } from "./start-overlay"
import { XpSystem } from "../xp-system"
import { QuestSystem } from "../quest-system"
import { Dialogue } from "../dialogue"
import { DeathScreen } from "../death-screen"

export function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <StatBars />
      <XpSystem />
      <MiniMap />
      <TopBar />
      <QuestSystem />
      <Dialogue />
      <MobileControls />
      <DeathScreen />
      <StartOverlay />
    </div>
  )
}
