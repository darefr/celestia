"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Billboard } from "@react-three/drei"
import * as THREE from "three"
import type { Group, Mesh, MeshStandardMaterial } from "three"
import {
  ENEMY_SPAWNS,
  ENEMY_STATS,
  type EnemySpawn,
  type EnemyType,
} from "@/lib/entities-config"
import { terrainHeight } from "@/lib/world-config"
import { playerRef } from "@/lib/player-ref"
import { registerEnemy, unregisterEnemy, type EnemyRuntime } from "@/lib/entity-refs"
import { useGameStore } from "@/lib/game-store"

// Head height per type (for the floating health bar / quest marker).
const HEAD_Y: Record<EnemyType, number> = { slime: 1.1, wolf: 1.5, goblin: 2.0, brute: 3.4 }

function EnemyMesh({
  type,
  matRef,
}: {
  type: EnemyType
  matRef: React.MutableRefObject<MeshStandardMaterial | null>
}) {
  const s = ENEMY_STATS[type]
  const color = s.color
  const accent = s.accent

  if (type === "slime") {
    return (
      <group scale={[1, 0.75, 1]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial ref={matRef} color={color} transparent opacity={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0.2, 0.7, 0.5]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-0.2, 0.7, 0.5]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>
    )
  }

  if (type === "wolf") {
    return (
      <group>
        {/* body */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[0.5, 0.5, 1.2]} />
          <meshStandardMaterial ref={matRef} color={color} roughness={0.85} />
        </mesh>
        {/* head */}
        <mesh position={[0, 0.85, 0.75]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.45]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* snout */}
        <mesh position={[0, 0.78, 1.02]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.25]} />
          <meshStandardMaterial color={accent} roughness={0.8} />
        </mesh>
        {/* ears */}
        <mesh position={[0.14, 1.12, 0.72]}>
          <coneGeometry args={[0.1, 0.22, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.14, 1.12, 0.72]}>
          <coneGeometry args={[0.1, 0.22, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* legs */}
        {[
          [0.2, 0.45],
          [-0.2, 0.45],
          [0.2, -0.45],
          [-0.2, -0.45],
        ].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.25, lz]} castShadow>
            <boxGeometry args={[0.14, 0.5, 0.14]} />
            <meshStandardMaterial color={accent} roughness={0.9} />
          </mesh>
        ))}
        {/* tail */}
        <mesh position={[0, 0.8, -0.75]} rotation={[0.5, 0, 0]}>
          <coneGeometry args={[0.1, 0.5, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  if (type === "goblin") {
    return (
      <group>
        {/* legs */}
        <mesh position={[0.14, 0.4, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.35, 4, 8]} />
          <meshStandardMaterial color="#3f3a1e" roughness={0.9} />
        </mesh>
        <mesh position={[-0.14, 0.4, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.35, 4, 8]} />
          <meshStandardMaterial color="#3f3a1e" roughness={0.9} />
        </mesh>
        {/* body */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.4, 4, 10]} />
          <meshStandardMaterial ref={matRef} color={color} roughness={0.8} />
        </mesh>
        {/* arms */}
        <mesh position={[0.36, 1.0, 0]} rotation={[0, 0, 0.3]} castShadow>
          <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[-0.36, 1.0, 0]} rotation={[0, 0, -0.3]} castShadow>
          <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshStandardMaterial color={accent} roughness={0.7} />
        </mesh>
        {/* ears */}
        <mesh position={[0.32, 1.55, 0]} rotation={[0, 0, -1]}>
          <coneGeometry args={[0.09, 0.35, 5]} />
          <meshStandardMaterial color={accent} />
        </mesh>
        <mesh position={[-0.32, 1.55, 0]} rotation={[0, 0, 1]}>
          <coneGeometry args={[0.09, 0.35, 5]} />
          <meshStandardMaterial color={accent} />
        </mesh>
        {/* eyes */}
        <mesh position={[0.1, 1.52, 0.24]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#b91c1c" emissive="#ef4444" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-0.1, 1.52, 0.24]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#b91c1c" emissive="#ef4444" emissiveIntensity={0.6} />
        </mesh>
      </group>
    )
  }

  // brute
  return (
    <group>
      {/* legs */}
      <mesh position={[0.24, 0.5, 0]} castShadow>
        <boxGeometry args={[0.28, 0.7, 0.3]} />
        <meshStandardMaterial color="#3b0f0f" roughness={0.9} />
      </mesh>
      <mesh position={[-0.24, 0.5, 0]} castShadow>
        <boxGeometry args={[0.28, 0.7, 0.3]} />
        <meshStandardMaterial color="#3b0f0f" roughness={0.9} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[0.95, 0.9, 0.6]} />
        <meshStandardMaterial ref={matRef} color={color} roughness={0.8} />
      </mesh>
      {/* arms */}
      <mesh position={[0.62, 1.2, 0]} castShadow>
        <boxGeometry args={[0.28, 0.85, 0.32]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-0.62, 1.2, 0]} castShadow>
        <boxGeometry args={[0.28, 0.85, 0.32]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>
      {/* horns */}
      <mesh position={[0.2, 2.3, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.1, 0.4, 6]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[-0.2, 2.3, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.1, 0.4, 6]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      {/* eyes */}
      <mesh position={[0.12, 1.97, 0.26]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.12, 1.97, 0.26]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

interface EnemyProps {
  spawn: EnemySpawn
  onDeath: (pos: [number, number, number], coins: number, xp: number) => void
}

function Enemy({ spawn, onDeath }: EnemyProps) {
  const stats = ENEMY_STATS[spawn.type]
  const root = useRef<Group>(null)
  const model = useRef<Group>(null)
  const matRef = useRef<MeshStandardMaterial | null>(null)
  const barFg = useRef<Mesh>(null)
  const barGroup = useRef<Group>(null)
  const markerRef = useRef<Mesh>(null)

  const [removed, setRemoved] = useState(false)

  const cur = useRef(new THREE.Vector3(spawn.pos[0], terrainHeight(spawn.pos[0], spawn.pos[1]), spawn.pos[1]))
  const yaw = useRef(0)
  const phase = useRef(Math.random() * Math.PI * 2)
  const waypoint = useRef(new THREE.Vector3(spawn.pos[0], 0, spawn.pos[1]))
  const wpTimer = useRef(0)
  const attackCd = useRef(0)
  const dying = useRef(false)
  const dyingT = useRef(0)
  const deathFired = useRef(false)

  // Reactive: is the hunt quest active (drives the objective marker)?
  const huntActive = useGameStore((s) => s.quests.hunt?.status === "active")

  const runtime = useMemo<EnemyRuntime>(
    () => ({
      id: spawn.id,
      type: spawn.type,
      position: cur.current.clone(),
      health: stats.maxHealth,
      maxHealth: stats.maxHealth,
      alive: true,
      lastHitAt: 0,
    }),
    [spawn.id, spawn.type, stats.maxHealth],
  )

  useEffect(() => {
    registerEnemy(runtime)
    return () => unregisterEnemy(spawn.id)
  }, [runtime, spawn.id])

  const pickWaypoint = useCallback(() => {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * spawn.patrolRadius
    waypoint.current.set(spawn.pos[0] + Math.cos(a) * r, 0, spawn.pos[1] + Math.sin(a) * r)
    wpTimer.current = 2 + Math.random() * 3
  }, [spawn.patrolRadius, spawn.pos])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    phase.current += dt
    const store = useGameStore.getState()

    // --- Death handling ---
    if (!dying.current && runtime.health <= 0) {
      dying.current = true
      runtime.alive = false
    }
    if (dying.current) {
      dyingT.current += dt
      const k = Math.max(0, 1 - dyingT.current / 0.5)
      if (root.current) {
        root.current.scale.setScalar(stats.scale * k)
        root.current.position.y = cur.current.y + (1 - k) * 1.2
      }
      if (barGroup.current) barGroup.current.visible = false
      if (dyingT.current >= 0.5 && !deathFired.current) {
        deathFired.current = true
        onDeath([cur.current.x, cur.current.y, cur.current.z], stats.coins, stats.xp)
        unregisterEnemy(spawn.id)
        setRemoved(true)
      }
      return
    }

    if (!store.started) {
      // idle only before the game starts
      if (model.current) model.current.position.y = Math.sin(phase.current * 2) * 0.04
      return
    }

    // --- Decide movement: chase or patrol ---
    const px = playerRef.position.x
    const pz = playerRef.position.z
    const dx = px - cur.current.x
    const dz = pz - cur.current.z
    const dist = Math.hypot(dx, dz)
    const playerDead = store.dead

    let dirX = 0
    let dirZ = 0
    let moveSpeed = 0

    if (!playerDead && dist < stats.detectRadius) {
      // chase
      const stop = stats.attackRange * 0.85
      if (dist > stop) {
        dirX = dx / (dist || 1)
        dirZ = dz / (dist || 1)
        moveSpeed = stats.speed
      }
      // attack
      attackCd.current -= dt
      if (dist <= stats.attackRange && attackCd.current <= 0) {
        attackCd.current = stats.attackCooldown
        store.damagePlayer(stats.damage)
        // lunge
        if (model.current) model.current.position.z = 0.25
      }
    } else {
      // patrol wander
      wpTimer.current -= dt
      const wdx = waypoint.current.x - cur.current.x
      const wdz = waypoint.current.z - cur.current.z
      const wd = Math.hypot(wdx, wdz)
      if (wd < 1 || wpTimer.current <= 0) {
        pickWaypoint()
      } else {
        dirX = wdx / (wd || 1)
        dirZ = wdz / (wd || 1)
        moveSpeed = stats.speed * 0.4
      }
    }

    if (moveSpeed > 0) {
      cur.current.x += dirX * moveSpeed * dt
      cur.current.z += dirZ * moveSpeed * dt
      const targetYaw = Math.atan2(dirX, dirZ)
      let delta = targetYaw - yaw.current
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      yaw.current += delta * Math.min(1, dt * 8)
    }
    cur.current.y = terrainHeight(cur.current.x, cur.current.z)

    // --- Apply transform ---
    if (root.current) {
      root.current.position.set(cur.current.x, cur.current.y, cur.current.z)
      root.current.rotation.y = yaw.current
      root.current.scale.setScalar(stats.scale)
    }
    runtime.position.copy(cur.current)

    // --- Animation: bob / relax lunge ---
    if (model.current) {
      const bobAmp = moveSpeed > 0 ? 0.12 : 0.05
      const bobRate = moveSpeed > 0 ? 10 : 2
      model.current.position.y = Math.abs(Math.sin(phase.current * bobRate)) * bobAmp
      model.current.position.z += (0 - model.current.position.z) * Math.min(1, dt * 8)
    }

    // --- Hit flash ---
    if (matRef.current) {
      const since = performance.now() - runtime.lastHitAt
      matRef.current.emissive.setRGB(1, 1, 1)
      matRef.current.emissiveIntensity = since < 140 ? 0.8 : 0
    }

    // --- Health bar ---
    const frac = Math.max(0, runtime.health / runtime.maxHealth)
    if (barGroup.current) barGroup.current.visible = frac < 0.999
    if (barFg.current) {
      barFg.current.scale.x = frac
      barFg.current.position.x = -(1 - frac) * 0.5
      const mat = barFg.current.material as MeshStandardMaterial
      mat.color.setStyle(frac > 0.5 ? "#4ade80" : frac > 0.25 ? "#facc15" : "#ef4444")
    }

    // --- Objective marker (hunt quest) ---
    if (markerRef.current) {
      markerRef.current.visible = huntActive
      markerRef.current.rotation.y += dt * 2.2
      markerRef.current.position.y = HEAD_Y[spawn.type] + 0.9 + Math.sin(phase.current * 2.4) * 0.12
    }
  })

  if (removed) return null

  const barY = HEAD_Y[spawn.type] + 0.35

  return (
    <group ref={root} position={[cur.current.x, cur.current.y, cur.current.z]}>
      <group ref={model}>
        <EnemyMesh type={spawn.type} matRef={matRef} />
      </group>

      {/* Health bar (billboarded) */}
      <Billboard>
        <group ref={barGroup} position={[0, barY, 0]} visible={false}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.04, 0.16]} />
            <meshBasicMaterial color="#0b0f1a" />
          </mesh>
          <mesh ref={barFg} position={[0, 0, 0]}>
            <planeGeometry args={[1, 0.12]} />
            <meshBasicMaterial color="#4ade80" toneMapped={false} />
          </mesh>
        </group>
      </Billboard>

      {/* Hunt objective marker */}
      <mesh ref={markerRef} position={[0, HEAD_Y[spawn.type] + 0.9, 0]} visible={false}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#fca5a5" emissive="#ef4444" emissiveIntensity={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

interface DropData {
  id: number
  pos: [number, number, number]
  coins: number
  xp: number
}

function Drop({ data, onCollect }: { data: DropData; onCollect: (id: number, coins: number, xp: number) => void }) {
  const mesh = useRef<Group>(null)
  const collected = useRef(false)
  const phase = useRef(0)
  const ground = terrainHeight(data.pos[0], data.pos[2])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    phase.current += dt
    if (mesh.current) {
      mesh.current.rotation.y += dt * 3
      mesh.current.position.y = ground + 0.8 + Math.sin(phase.current * 3) * 0.15
    }
    if (collected.current) return
    const d = Math.hypot(playerRef.position.x - data.pos[0], playerRef.position.z - data.pos[2])
    if (d < 3.2) {
      collected.current = true
      onCollect(data.id, data.coins, data.xp)
    }
  })

  return (
    <group ref={mesh} position={[data.pos[0], ground + 0.8, data.pos[2]]}>
      {/* coin */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* xp spark */}
      <mesh position={[0, 0.45, 0]}>
        <icosahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color="#a5f3fc" emissive="#22d3ee" emissiveIntensity={1.2} />
      </mesh>
      <pointLight color="#fbbf24" intensity={3} distance={4} />
    </group>
  )
}

// Parent manager: spawns all enemies (fresh each load) and owns transient drops.
export function Enemies() {
  const [drops, setDrops] = useState<DropData[]>([])
  const nextId = useRef(1)

  const handleDeath = useCallback((pos: [number, number, number], coins: number, xp: number) => {
    setDrops((d) => [...d, { id: nextId.current++, pos, coins, xp }])
    // Count toward the hunt quest.
    useGameStore.getState().addQuestProgress("hunt", 1)
  }, [])

  const handleCollect = useCallback((id: number, coins: number, xp: number) => {
    const s = useGameStore.getState()
    s.addCoins(coins)
    s.gainXp(xp)
    setDrops((d) => d.filter((x) => x.id !== id))
  }, [])

  return (
    <group>
      {ENEMY_SPAWNS.map((spawn) => (
        <Enemy key={spawn.id} spawn={spawn} onDeath={handleDeath} />
      ))}
      {drops.map((d) => (
        <Drop key={d.id} data={d} onCollect={handleCollect} />
      ))}
    </group>
  )
}
