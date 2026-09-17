"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronUp, Sword } from "lucide-react"
import { setJoystick, queueJump } from "@/lib/input"
import { queueAttack } from "@/lib/combat"

const BASE = 120 // joystick base diameter (px)
const KNOB = 54
const MAX_R = (BASE - KNOB) / 2

export function MobileControls() {
  const [enabled, setEnabled] = useState(false)
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const pointerId = useRef<number | null>(null)
  const origin = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const check = () => {
      const touch =
        window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        "ontouchstart" in window ||
        window.matchMedia("(max-width: 820px)").matches
      setEnabled(touch)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  if (!enabled) return null

  const updateKnob = (dx: number, dy: number) => {
    const dist = Math.hypot(dx, dy)
    const clamped = Math.min(dist, MAX_R)
    const angle = Math.atan2(dy, dx)
    const kx = Math.cos(angle) * clamped
    const ky = Math.sin(angle) * clamped
    if (knobRef.current) knobRef.current.style.transform = `translate(${kx}px, ${ky}px)`

    // Normalized input: y forward is up (negative screen y)
    const nx = kx / MAX_R
    const ny = -ky / MAX_R
    const boost = dist > MAX_R * 0.92 // pushed to edge => run
    setJoystick(nx, ny, boost)
  }

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointerId.current = e.pointerId
    const rect = baseRef.current!.getBoundingClientRect()
    origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    updateKnob(e.clientX - origin.current.x, e.clientY - origin.current.y)
  }
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return
    updateKnob(e.clientX - origin.current.x, e.clientY - origin.current.y)
  }
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return
    pointerId.current = null
    if (knobRef.current) knobRef.current.style.transform = "translate(0px, 0px)"
    setJoystick(0, 0, false)
  }

  return (
    <>
      {/* Virtual joystick */}
      <div
        data-hud
        ref={baseRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="pointer-events-auto absolute bottom-8 left-8 z-30 touch-none select-none rounded-full border border-white/20 bg-black/30 backdrop-blur-sm"
        style={{ width: BASE, height: BASE }}
      >
        <div
          ref={knobRef}
          className="absolute left-1/2 top-1/2 rounded-full bg-white/70 shadow-lg"
          style={{ width: KNOB, height: KNOB, marginLeft: -KNOB / 2, marginTop: -KNOB / 2 }}
        />
      </div>

      {/* Attack button */}
      <button
        data-hud
        onPointerDown={(e) => {
          e.preventDefault()
          queueAttack()
        }}
        className="pointer-events-auto absolute bottom-32 right-8 z-30 flex h-16 w-16 touch-none select-none items-center justify-center rounded-full border border-white/25 bg-rose-500/75 text-white shadow-lg active:scale-95"
        aria-label="Attack"
      >
        <Sword className="h-7 w-7" />
        <span className="sr-only">Attack</span>
      </button>

      {/* Jump button */}
      <button
        data-hud
        onPointerDown={(e) => {
          e.preventDefault()
          queueJump()
        }}
        className="pointer-events-auto absolute bottom-10 right-8 z-30 flex h-20 w-20 touch-none select-none items-center justify-center rounded-full border border-white/25 bg-emerald-500/70 text-white shadow-lg active:scale-95"
        aria-label="Jump"
      >
        <ChevronUp className="h-8 w-8" />
        <span className="sr-only">Jump</span>
      </button>
    </>
  )
}
