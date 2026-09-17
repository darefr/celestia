"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group, Mesh } from "three"
import { ORBS } from "@/lib/entities-config"
import { terrainHeight } from "@/lib/world-config"
import { playerRef } from "@/lib/player-ref"
import { useGameStore } from "@/lib/game-store"

const COLLECT_RANGE = 2.0
const ORB_XP = 12

function Orb({ index }: { index: number }) {
  const [x, z] = ORBS[index]
  const ground = terrainHeight(x, z)
  const orb = useRef<Mesh>(null)
  const marker = useRef<Mesh>(null)
  const group = useRef<Group>(null)
  const collected = useRef(false)
  const phase = useRef(index * 1.3)

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    phase.current += dt
    const bob = Math.sin(phase.current * 2) * 0.2
    if (orb.current) {
      orb.current.position.y = 1.3 + bob
      orb.current.rotation.y += dt * 1.5
    }
    if (marker.current) {
      marker.current.rotation.y += dt * 2.2
      marker.current.position.y = 2.6 + Math.sin(phase.current * 2.4) * 0.14
    }

    if (collected.current) return
    const d = Math.hypot(playerRef.position.x - x, playerRef.position.z - z)
    const dy = Math.abs(playerRef.position.y - (ground + 1.3 + bob))
    if (d < COLLECT_RANGE && dy < 3.5) {
      collected.current = true
      const s = useGameStore.getState()
      s.collectOrb("orbs", index)
      s.gainXp(ORB_XP)
    }
  })

  return (
    <group ref={group} position={[x, ground, z]}>
      {/* Glowing orb */}
      <mesh ref={orb} position={[0, 1.3, 0]} castShadow>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial
          color="#a5f3fc"
          emissive="#22d3ee"
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color="#22d3ee" intensity={6} distance={7} />
      {/* Objective marker */}
      <mesh ref={marker} position={[0, 2.6, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

// Renders the quest orbs while the orb quest is active. Orbs already collected
// (persisted in the save) do not reappear.
export function Collectibles() {
  const orbsQuest = useGameStore((s) => s.quests.orbs)

  if (!orbsQuest || orbsQuest.status !== "active") return null

  return (
    <group>
      {ORBS.map((_, i) =>
        orbsQuest.collected.includes(i) ? null : <Orb key={i} index={i} />,
      )}
    </group>
  )
}
