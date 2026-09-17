"use client"

import { StatBars } from "./stat-bars"
import { MiniMap } from "./mini-map"
import { TopBar } from "./top-bar"
import { MobileControls } from "./mobile-controls"
import { StartOverlay } from "./start-overlay"

export function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <StatBars />
      <MiniMap />
      <TopBar />
      <MobileControls />
      <StartOverlay />
    </div>
  )
}
