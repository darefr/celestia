"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { RigidBody } from "@react-three/rapier"
import { WORLD_SIZE, TERRAIN_SEGMENTS, terrainHeight, zoneAt, isOnPath } from "@/lib/world-config"

// Terrain palette (kept small + cohesive)
const C_GRASS = new THREE.Color("#5a8f4e")
const C_GRASS_ALT = new THREE.Color("#6ea24e")
const C_CITY = new THREE.Color("#8a8f99")
const C_VILLAGE = new THREE.Color("#c9a86a")
const C_PATH = new THREE.Color("#b79b6e")
const C_ROCK = new THREE.Color("#6b6f73")
const C_SNOW = new THREE.Color("#eef2f5")

function colorAt(x: number, z: number, h: number, target: THREE.Color) {
  if (h > 18) return target.copy(C_SNOW)
  if (h > 9) return target.copy(C_ROCK)

  const zone = zoneAt(x, z)
  if (isOnPath(x, z)) return target.copy(C_PATH)
  if (zone === "city") return target.copy(C_CITY)
  if (zone === "village") return target.copy(C_VILLAGE)

  // grass with subtle variation
  const t = (Math.sin(x * 0.3) * Math.cos(z * 0.3) + 1) / 2
  return target.copy(C_GRASS).lerp(C_GRASS_ALT, t * 0.4)
}

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
    geo.rotateX(-Math.PI / 2) // make it horizontal (XZ plane)

    const pos = geo.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const tmp = new THREE.Color()

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const h = terrainHeight(x, z)
      pos.setY(i, h)
      colorAt(x, z, h, tmp)
      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={0}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>
    </RigidBody>
  )
}
