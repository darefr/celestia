"use client"

import { useMemo, useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Sky, Stars } from "@react-three/drei"
import * as THREE from "three"
import { useGameStore } from "@/lib/game-store"

const CYCLE_SECONDS = 120 // full day/night loop
const SUN_DISTANCE = 400

const DAY_SKY = new THREE.Color("#8ec5ff")
const DUSK_SKY = new THREE.Color("#f6a26b")
const NIGHT_SKY = new THREE.Color("#0b1026")

const DAY_LIGHT = new THREE.Color("#fff4e0")
const DUSK_LIGHT = new THREE.Color("#ff9d5c")
const NIGHT_LIGHT = new THREE.Color("#6f86c9")

export function DayNightCycle() {
  const { scene } = useThree()
  const sunLight = useRef<THREE.DirectionalLight>(null)
  const ambient = useRef<THREE.AmbientLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const sunMesh = useRef<THREE.Mesh>(null)
  const moonMesh = useRef<THREE.Mesh>(null)

  const time = useRef(useGameStore.getState().timeOfDay)
  const storeThrottle = useRef(0)
  const [sunPos, setSunPos] = useState<[number, number, number]>([100, 100, 50])
  const lastSkyUpdate = useRef(-1)

  const fog = useMemo(() => new THREE.Fog("#9ec5ff", 60, 260), [])
  scene.fog = fog

  const _sky = useRef(new THREE.Color())

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    time.current = (time.current + dt / CYCLE_SECONDS) % 1
    const t = time.current

    // Sun direction. t=0 midnight (down), t=0.5 noon (up).
    const phase = t * Math.PI * 2
    const sunY = -Math.cos(phase)
    const sunX = Math.sin(phase)
    const sunZ = 0.35
    const dir = new THREE.Vector3(sunX, sunY, sunZ).normalize()

    // Elevation 0..1 for daytime brightness
    const elevation = Math.max(0, sunY)
    const dayness = THREE.MathUtils.smoothstep(sunY, -0.15, 0.35) // 0 night -> 1 day
    const duskness = 1 - Math.abs(sunY) // peaks near horizon

    // Directional (sun) light
    if (sunLight.current) {
      sunLight.current.position.set(dir.x * 120, Math.max(dir.y * 120, 2), dir.z * 120)
      sunLight.current.intensity = 0.15 + elevation * 2.0
      sunLight.current.color
        .copy(NIGHT_LIGHT)
        .lerp(DUSK_LIGHT, THREE.MathUtils.clamp(duskness * 1.3, 0, 1))
        .lerp(DAY_LIGHT, dayness)
    }
    if (ambient.current) ambient.current.intensity = 0.18 + dayness * 0.5
    if (hemi.current) hemi.current.intensity = 0.15 + dayness * 0.6

    // Sun & moon billboards ride opposite ends of the arc
    if (sunMesh.current) {
      sunMesh.current.position.set(dir.x * SUN_DISTANCE, dir.y * SUN_DISTANCE, dir.z * SUN_DISTANCE)
      sunMesh.current.visible = sunY > -0.1
    }
    if (moonMesh.current) {
      moonMesh.current.position.set(-dir.x * SUN_DISTANCE, -dir.y * SUN_DISTANCE, -dir.z * SUN_DISTANCE)
      moonMesh.current.visible = sunY < 0.1
    }

    // Fog + background color follow the sky mood
    _sky.current.copy(NIGHT_SKY).lerp(DUSK_SKY, THREE.MathUtils.clamp(duskness * 1.2, 0, 1)).lerp(DAY_SKY, dayness)
    fog.color.copy(_sky.current)

    // Throttle React updates for the <Sky> sun position (smooth enough)
    if (Math.abs(t - lastSkyUpdate.current) > 0.004) {
      lastSkyUpdate.current = t
      setSunPos([dir.x, dir.y, dir.z])
    }

    // Throttle store update for the HUD clock
    storeThrottle.current += dt
    if (storeThrottle.current > 0.5) {
      storeThrottle.current = 0
      useGameStore.getState().setTimeOfDay(t)
    }
  })

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={sunPos}
        turbidity={8}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <Stars radius={300} depth={60} count={3000} factor={5} saturation={0} fade speed={0.5} />

      <ambientLight ref={ambient} intensity={0.4} />
      <hemisphereLight ref={hemi} args={["#bcd3ff", "#4a5a3a", 0.5]} />
      <directionalLight
        ref={sunLight}
        castShadow
        position={[100, 100, 50]}
        intensity={2}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0004}
      />

      {/* Sun billboard */}
      <mesh ref={sunMesh}>
        <sphereGeometry args={[18, 24, 24]} />
        <meshBasicMaterial color="#fff2c4" toneMapped={false} />
      </mesh>
      {/* Moon billboard */}
      <mesh ref={moonMesh}>
        <sphereGeometry args={[12, 24, 24]} />
        <meshBasicMaterial color="#dfe7ff" toneMapped={false} />
      </mesh>
    </>
  )
}
