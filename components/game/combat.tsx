"use client"

import { useEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group, Mesh } from "three"
import { playerRef } from "@/lib/player-ref"
import { enemyRegistry } from "@/lib/entity-refs"
import { combat, consumeAttack, queueAttack } from "@/lib/combat"
import { useGameStore } from "@/lib/game-store"

const HIT_RANGE = 3.0
const ARC_DOT = 0.35 // ~cos(69deg): frontal cone
const SWING_DUR = 0.28
const ATTACK_COOLDOWN = 0.42

function playerDamage(level: number) {
  return 18 + (level - 1) * 4
}

export function Combat() {
  const swingGroup = useRef<Group>(null)
  const blade = useRef<Mesh>(null)
  const swingT = useRef(0)
  const cooldown = useRef(0)

  // Desktop: quick left-click (not a camera drag, not on HUD) triggers an attack.
  useEffect(() => {
    let downX = 0
    let downY = 0
    let downT = 0
    let downValid = false

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (target?.closest?.("[data-hud]")) {
        downValid = false
        return
      }
      downValid = true
      downX = e.clientX
      downY = e.clientY
      downT = performance.now()
    }
    const onUp = (e: PointerEvent) => {
      if (!downValid || e.button !== 0) return
      downValid = false
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY)
      const elapsed = performance.now() - downT
      if (moved < 8 && elapsed < 300) queueAttack()
    }

    window.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
    }
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    cooldown.current -= dt

    const store = useGameStore.getState()
    const canAct = store.started && !store.dead && store.dialogue === null

    const wantsAttack = consumeAttack()
    if (wantsAttack && canAct && cooldown.current <= 0) {
      cooldown.current = ATTACK_COOLDOWN
      swingT.current = SWING_DUR

      // Hit detection: enemies within range and inside the frontal arc.
      const yaw = playerRef.yaw
      const fx = Math.sin(yaw)
      const fz = Math.cos(yaw)
      const px = playerRef.position.x
      const pz = playerRef.position.z
      const dmg = playerDamage(store.level)
      const now = performance.now()

      for (const e of enemyRegistry.values()) {
        if (!e.alive) continue
        const dx = e.position.x - px
        const dz = e.position.z - pz
        const dist = Math.hypot(dx, dz)
        if (dist > HIT_RANGE || dist < 0.001) continue
        const dot = (fx * dx + fz * dz) / dist
        if (dot < ARC_DOT) continue
        e.health -= dmg
        e.lastHitAt = now
      }
    } else if (wantsAttack) {
      // discard attack that couldn't be performed
      combat.attackQueued = false
    }

    // --- Swing visual ---
    if (swingT.current > 0) {
      swingT.current -= dt
      const progress = 1 - swingT.current / SWING_DUR // 0..1
      if (swingGroup.current) {
        swingGroup.current.visible = true
        swingGroup.current.position.set(playerRef.position.x, playerRef.position.y + 1.0, playerRef.position.z)
        swingGroup.current.rotation.y = playerRef.yaw
      }
      if (blade.current) {
        // sweep the blade from one side to the other
        blade.current.rotation.y = -1.1 + progress * 2.2
        const mat = blade.current.material as { opacity: number }
        mat.opacity = Math.sin(progress * Math.PI) * 0.8
      }
    } else if (swingGroup.current && swingGroup.current.visible) {
      swingGroup.current.visible = false
    }
  })

  return (
    <group ref={swingGroup} visible={false}>
      {/* Slash arc: a flattened ring segment swept in front of the player */}
      <mesh ref={blade} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.12, 8, 16, Math.PI * 0.7]} />
        <meshStandardMaterial
          color="#e0f2fe"
          emissive="#7dd3fc"
          emissiveIntensity={1.4}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
