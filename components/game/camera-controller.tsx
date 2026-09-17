"use client"

import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { playerRef, cameraState } from "@/lib/player-ref"

const MIN_POLAR = 0.35 // near top-down limit (radians from vertical)
const MAX_POLAR = 1.45 // near horizon
const MIN_DIST = 4
const MAX_DIST = 16

export function CameraController() {
  const { camera, gl } = useThree()
  const azimuth = useRef(Math.PI) // start looking at the character's front
  const polar = useRef(0.95)
  const distance = useRef(9)

  const dragging = useRef(false)
  const lastX = useRef(0)
  const lastY = useRef(0)
  const activePointer = useRef<number | null>(null)

  const _target = useRef(new THREE.Vector3())
  const _desired = useRef(new THREE.Vector3())

  useEffect(() => {
    const el = gl.domElement
    el.style.touchAction = "none"

    const onDown = (e: PointerEvent) => {
      // Ignore drags that start on HUD buttons (they set data-hud)
      const target = e.target as HTMLElement
      if (target?.closest?.("[data-hud]")) return
      dragging.current = true
      activePointer.current = e.pointerId
      lastX.current = e.clientX
      lastY.current = e.clientY
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || e.pointerId !== activePointer.current) return
      const dx = e.clientX - lastX.current
      const dy = e.clientY - lastY.current
      lastX.current = e.clientX
      lastY.current = e.clientY
      azimuth.current -= dx * 0.005
      polar.current = clamp(polar.current - dy * 0.005, MIN_POLAR, MAX_POLAR)
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId === activePointer.current) {
        dragging.current = false
        activePointer.current = null
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      distance.current = clamp(distance.current + e.deltaY * 0.01, MIN_DIST, MAX_DIST)
    }

    el.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    el.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      el.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      el.removeEventListener("wheel", onWheel)
    }
  }, [gl])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    // Publish azimuth so player movement is camera-relative
    cameraState.azimuth = azimuth.current

    // Look at a point slightly above the player's feet
    _target.current.copy(playerRef.position)
    _target.current.y += 1.4

    // Spherical -> cartesian offset
    const sinP = Math.sin(polar.current)
    const ox = distance.current * sinP * Math.sin(azimuth.current)
    const oy = distance.current * Math.cos(polar.current)
    const oz = distance.current * sinP * Math.cos(azimuth.current)
    _desired.current.set(_target.current.x + ox, _target.current.y + oy, _target.current.z + oz)

    // Smooth follow
    camera.position.lerp(_desired.current, Math.min(1, dt * 8))
    camera.lookAt(_target.current)
  })

  return null
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
