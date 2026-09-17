// Central world configuration shared by terrain, zones, and the mini-map.
// Keeping these constants in one place means the visual mesh, the physics
// collider, and the 2D mini-map all agree on the same coordinate space.

export const WORLD_SIZE = 300 // world units, terrain spans -150..150 on X/Z
export const TERRAIN_SEGMENTS = 120 // grid resolution of the heightfield mesh

export type ZoneId = "city" | "village" | "forest"

export interface ZoneDef {
  id: ZoneId
  label: string
  center: [number, number] // x, z
  radius: number
  color: string // mini-map color
}

export const ZONES: ZoneDef[] = [
  { id: "city", label: "City", center: [-80, -80], radius: 42, color: "#7dd3fc" },
  { id: "village", label: "Village", center: [82, -78], radius: 40, color: "#fbbf24" },
  { id: "forest", label: "Forest & Mtns", center: [0, 82], radius: 55, color: "#4ade80" },
]

// Smooth pseudo-noise built from summed sines. Deterministic, no deps.
function noise2D(x: number, z: number): number {
  return (
    Math.sin(x * 0.055) * Math.cos(z * 0.045) * 1.0 +
    Math.sin(x * 0.13 + 1.7) * Math.cos(z * 0.11 - 0.6) * 0.45 +
    Math.sin(x * 0.021 - 2.1) * Math.cos(z * 0.03 + 1.2) * 1.6
  )
}

function dist(x: number, z: number, cx: number, cz: number): number {
  return Math.hypot(x - cx, z - cz)
}

// Height of the terrain at any world (x, z). Used to build both the mesh and
// to place props on the ground. Flattens city/village so they are buildable,
// raises the forest zone into rolling hills / mountains.
export function terrainHeight(x: number, z: number): number {
  const edge = Math.max(Math.abs(x), Math.abs(z))
  let h = noise2D(x, z) * 1.2

  // Mountains in the forest zone
  const [fx, fz] = ZONES[2].center
  const dForest = dist(x, z, fx, fz)
  if (dForest < 90) {
    const m = Math.max(0, 1 - dForest / 90)
    h += Math.pow(m, 1.8) * 26 * (0.6 + 0.4 * Math.sin(x * 0.08) * Math.cos(z * 0.08))
  }

  // Flatten the city
  const [cx, cz] = ZONES[0].center
  const dCity = dist(x, z, cx, cz)
  if (dCity < ZONES[0].radius) {
    const t = 1 - dCity / ZONES[0].radius
    h = h * (1 - t) + 0.2 * t
  }

  // Flatten the village
  const [vx, vz] = ZONES[1].center
  const dVillage = dist(x, z, vx, vz)
  if (dVillage < ZONES[1].radius) {
    const t = 1 - dVillage / ZONES[1].radius
    h = h * (1 - t) + 0.2 * t
  }

  // Raised rim / falloff near the map edge to act as a natural boundary
  if (edge > 130) {
    h += (edge - 130) * (edge - 130) * 0.02
  }

  return h
}

// Which zone (if any) a world point falls inside.
export function zoneAt(x: number, z: number): ZoneId | null {
  for (const zone of ZONES) {
    if (dist(x, z, zone.center[0], zone.center[1]) < zone.radius) return zone.id
  }
  return null
}

// Rough test for "on a path": near the straight lines connecting zone centers
// and the world origin (spawn hub).
export function isOnPath(x: number, z: number): boolean {
  const hub: [number, number] = [0, 0]
  const targets: [number, number][] = [ZONES[0].center, ZONES[1].center, ZONES[2].center]
  for (const t of targets) {
    if (distanceToSegment(x, z, hub[0], hub[1], t[0], t[1]) < 5) return true
  }
  return false
}

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax
  const dz = bz - az
  const len2 = dx * dx + dz * dz
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (pz - az) * dz) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz))
}
