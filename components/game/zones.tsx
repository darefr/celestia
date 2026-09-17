"use client"

import { useMemo } from "react"
import { RigidBody } from "@react-three/rapier"
import { ZONES, terrainHeight } from "@/lib/world-config"

// Tiny deterministic PRNG so prop layout is stable across reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Placed {
  x: number
  z: number
  rot: number
  s: number
  variant: number
}

function scatter(seed: number, count: number, cx: number, cz: number, radius: number, minR = 6): Placed[] {
  const rand = mulberry32(seed)
  const out: Placed[] = []
  let guard = 0
  while (out.length < count && guard < count * 40) {
    guard++
    const ang = rand() * Math.PI * 2
    const r = minR + rand() * (radius - minR)
    const x = cx + Math.cos(ang) * r
    const z = cz + Math.sin(ang) * r
    // keep clear of the central path corridor to each zone
    if (out.some((p) => Math.hypot(p.x - x, p.z - z) < 7)) continue
    out.push({ x, z, rot: rand() * Math.PI * 2, s: 0.8 + rand() * 0.6, variant: Math.floor(rand() * 3) })
  }
  return out
}

const CITY_COLORS = ["#c3cad6", "#a9b4c4", "#d8dde6", "#8f9bb0"]
const CITY_ACCENT = ["#7dd3fc", "#f9a8d4", "#fcd34d"]
const HOUSE_WALL = ["#efe3cf", "#e8d4b0", "#f3ead9"]
const ROOF = ["#b5533f", "#8a5a3b", "#6b7d8a"]

function Building({ p }: { p: Placed }) {
  const h = 8 + p.variant * 6 + p.s * 6
  const w = 4 + p.s * 3
  const d = 4 + p.s * 3
  const ground = terrainHeight(p.x, p.z)
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[p.x, ground + h / 2, p.z]} rotation={[0, p.rot, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={CITY_COLORS[p.variant % CITY_COLORS.length]} roughness={0.7} />
      </mesh>
      {/* accent rooftop cube (decorative, part of same body) */}
      <mesh position={[0, h / 2 + 0.6, 0]} castShadow>
        <boxGeometry args={[w * 0.5, 1.2, d * 0.5]} />
        <meshStandardMaterial
          color={CITY_ACCENT[p.variant % CITY_ACCENT.length]}
          emissive={CITY_ACCENT[p.variant % CITY_ACCENT.length]}
          emissiveIntensity={0.35}
          roughness={0.4}
        />
      </mesh>
    </RigidBody>
  )
}

function House({ p }: { p: Placed }) {
  const w = 5 * p.s
  const bodyH = 3.4 * p.s
  const roofH = 2.4 * p.s
  const ground = terrainHeight(p.x, p.z)
  return (
    <group position={[p.x, ground, p.z]} rotation={[0, p.rot, 0]}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, bodyH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, bodyH, w]} />
          <meshStandardMaterial color={HOUSE_WALL[p.variant % HOUSE_WALL.length]} roughness={0.85} />
        </mesh>
      </RigidBody>
      {/* Roof is decorative (no collider needed) */}
      <mesh position={[0, bodyH + roofH / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[w * 0.82, roofH, 4]} />
        <meshStandardMaterial color={ROOF[p.variant % ROOF.length]} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Tree({ p }: { p: Placed }) {
  const trunkH = 3 * p.s
  const ground = terrainHeight(p.x, p.z)
  const foliage = "#3f7a3a"
  return (
    <group position={[p.x, ground, p.z]}>
      {/* Trunk carries the collider */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, trunkH / 2, 0]} castShadow>
          <cylinderGeometry args={[0.45 * p.s, 0.6 * p.s, trunkH, 6]} />
          <meshStandardMaterial color="#6b4a2f" roughness={1} />
        </mesh>
      </RigidBody>
      {/* Layered foliage cones (decorative) */}
      <mesh position={[0, trunkH + 1.6 * p.s, 0]} castShadow>
        <coneGeometry args={[2.4 * p.s, 3.4 * p.s, 7]} />
        <meshStandardMaterial color={foliage} roughness={0.9} />
      </mesh>
      <mesh position={[0, trunkH + 3.4 * p.s, 0]} castShadow>
        <coneGeometry args={[1.7 * p.s, 2.6 * p.s, 7]} />
        <meshStandardMaterial color="#4d8f45" roughness={0.9} />
      </mesh>
    </group>
  )
}

// Big decorative mountain rocks in the forest zone (with colliders)
function Rock({ p }: { p: Placed }) {
  const ground = terrainHeight(p.x, p.z)
  const s = 2 + p.s * 3
  return (
    <RigidBody type="fixed" colliders="hull" position={[p.x, ground + s * 0.3, p.z]} rotation={[p.rot, p.rot, 0]}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[s, 0]} />
        <meshStandardMaterial color="#6b6f73" roughness={1} flatShading />
      </mesh>
    </RigidBody>
  )
}

export function Zones() {
  const city = useMemo(() => scatter(101, 16, ZONES[0].center[0], ZONES[0].center[1], ZONES[0].radius - 4), [])
  const village = useMemo(() => scatter(202, 18, ZONES[1].center[0], ZONES[1].center[1], ZONES[1].radius - 4), [])
  const trees = useMemo(() => scatter(303, 46, ZONES[2].center[0], ZONES[2].center[1], ZONES[2].radius + 15), [])
  const rocks = useMemo(() => scatter(404, 10, ZONES[2].center[0], ZONES[2].center[1], ZONES[2].radius), [])

  return (
    <group>
      {city.map((p, i) => (
        <Building key={`b${i}`} p={p} />
      ))}
      {village.map((p, i) => (
        <House key={`h${i}`} p={p} />
      ))}
      {trees.map((p, i) => (
        <Tree key={`t${i}`} p={p} />
      ))}
      {rocks.map((p, i) => (
        <Rock key={`r${i}`} p={p} />
      ))}
    </group>
  )
}
