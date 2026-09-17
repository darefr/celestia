"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { Group, Mesh } from "three"
import { NPCS, type NpcDef, QUESTS } from "@/lib/entities-config"
import { terrainHeight } from "@/lib/world-config"
import { playerRef } from "@/lib/player-ref"
import { useGameStore } from "@/lib/game-store"

const INTERACT_RANGE = 3.4
const FACE_RANGE = 6

// Marker colors above quest-giver heads.
const MARKER_AVAILABLE = "#fbbf24" // "!" quest to offer
const MARKER_READY = "#4ade80" // "?" ready to turn in

function NpcModel({ def }: { def: NpcDef }) {
  const skin = "#f3c9a6"
  return (
    <group>
      {/* Legs */}
      <mesh position={[0.12, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.4, 4, 8]} />
        <meshStandardMaterial color="#2f3545" roughness={0.9} />
      </mesh>
      <mesh position={[-0.12, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.4, 4, 8]} />
        <meshStandardMaterial color="#2f3545" roughness={0.9} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.44, 4, 10]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.75} />
      </mesh>
      {/* Accent sash */}
      <mesh position={[0, 0.98, 0.02]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[0.62, 0.12, 0.5]} />
        <meshStandardMaterial color={def.accentColor} roughness={0.6} />
      </mesh>
      {/* Arms */}
      <mesh position={[0.34, 1.02, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.75} />
      </mesh>
      <mesh position={[-0.34, 1.02, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color={def.bodyColor} roughness={0.75} />
      </mesh>
      {/* Neck + head */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <sphereGeometry args={[0.27, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.52, -0.02]} castShadow>
        <sphereGeometry args={[0.29, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={def.hairColor} roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.1, 1.42, 0.24]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#26313f" />
      </mesh>
      <mesh position={[-0.1, 1.42, 0.24]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#26313f" />
      </mesh>
    </group>
  )
}

function Npc({ def }: { def: NpcDef }) {
  const root = useRef<Group>(null)
  const model = useRef<Group>(null)
  const marker = useRef<Mesh>(null)
  const phase = useRef(Math.random() * Math.PI * 2)
  const yaw = useRef(0)

  const ground = terrainHeight(def.pos[0], def.pos[1])

  const quest = useGameStore((s) => (def.questId ? s.quests[def.questId] : undefined))
  let markerColor: string | null = null
  if (def.questId && quest) {
    const target = QUESTS.find((q) => q.id === def.questId)?.target ?? 0
    if (quest.status === "inactive") markerColor = MARKER_AVAILABLE
    else if (quest.status === "active" && quest.progress >= target) markerColor = MARKER_READY
  }

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    phase.current += dt

    // Idle bob
    if (model.current) model.current.position.y = Math.sin(phase.current * 1.6) * 0.05

    // Face the player when nearby
    const dx = playerRef.position.x - def.pos[0]
    const dz = playerRef.position.z - def.pos[1]
    const dist = Math.hypot(dx, dz)
    if (dist < FACE_RANGE) {
      const targetYaw = Math.atan2(dx, dz)
      let delta = targetYaw - yaw.current
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      yaw.current += delta * Math.min(1, dt * 6)
      if (model.current) model.current.rotation.y = yaw.current
    }

    // Spin the quest marker
    if (marker.current) {
      marker.current.rotation.y += dt * 2
      marker.current.position.y = 2.5 + Math.sin(phase.current * 2.2) * 0.12
    }
  })

  return (
    <group ref={root} position={[def.pos[0], ground, def.pos[1]]}>
      <group ref={model}>
        <NpcModel def={def} />
      </group>
      {markerColor && (
        <mesh ref={marker} position={[0, 2.5, 0]}>
          <octahedronGeometry args={[0.24, 0]} />
          <meshStandardMaterial
            color={markerColor}
            emissive={markerColor}
            emissiveIntensity={0.7}
            roughness={0.3}
          />
        </mesh>
      )}
    </group>
  )
}

// Renders all NPCs and drives nearest-NPC proximity detection for the
// interaction prompt. NPC positions are static, so a single manager loop can
// resolve the nearest candidate cheaply.
export function Npcs() {
  const started = useGameStore((s) => s.started)

  useFrame(() => {
    if (!started) return
    const store = useGameStore.getState()
    if (store.dead) {
      if (store.nearbyNpcId) store.setNearbyNpc(null)
      return
    }
    let nearestId: string | null = null
    let nearestDist = INTERACT_RANGE
    for (const npc of NPCS) {
      const d = Math.hypot(playerRef.position.x - npc.pos[0], playerRef.position.z - npc.pos[1])
      if (d < nearestDist) {
        nearestDist = d
        nearestId = npc.id
      }
    }
    store.setNearbyNpc(nearestId)
  })

  return (
    <group>
      {NPCS.map((def) => (
        <Npc key={def.id} def={def} />
      ))}
    </group>
  )
}
