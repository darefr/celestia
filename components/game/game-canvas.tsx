"use client"

import { Suspense, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { Terrain } from "./terrain"
import { Zones } from "./zones"
import { Player } from "./player"
import { CameraController } from "./camera-controller"
import { DayNightCycle } from "./day-night-cycle"
import { Npcs } from "./npc"
import { Enemies } from "./enemy"
import { Combat } from "./combat"
import { Collectibles } from "./collectibles"
import { attachKeyboard } from "@/lib/input"

export function GameCanvas() {
  useEffect(() => {
    const detach = attachKeyboard()
    return () => detach?.()
  }, [])

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 55, near: 0.1, far: 1200, position: [0, 8, 14] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#8ec5ff"]} />
      <Suspense fallback={null}>
        <DayNightCycle />
        <Physics gravity={[0, -22, 0]} timeStep="vary">
          <Terrain />
          <Zones />
          <Player />
          <Npcs />
          <Enemies />
          <Collectibles />
          <Combat />
        </Physics>
        <CameraController />
      </Suspense>
    </Canvas>
  )
}
