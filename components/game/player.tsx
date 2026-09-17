"use client"

import { useEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  CapsuleCollider,
  CoefficientCombineRule,
  RigidBody,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier"
import * as THREE from "three"
import type { Group } from "three"
import { CharacterModel, type CharacterLimbs } from "./character-model"
import { input } from "@/lib/input"
import { playerRef, cameraState, playerCommands } from "@/lib/player-ref"
import { useGameStore, buildSave, writeSave, loadSave } from "@/lib/game-store"
import { terrainHeight } from "@/lib/world-config"

const WALK_SPEED = 4.6
const RUN_SPEED = 8.6
const JUMP_VELOCITY = 8
const CAPSULE_HALF = 0.5
const CAPSULE_RADIUS = 0.42
const FEET_OFFSET = CAPSULE_HALF + CAPSULE_RADIUS // 0.92

export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<Group>(null)
  const limbs = useRef<CharacterLimbs>({ root: null, legL: null, legR: null, armL: null, armR: null, torso: null })
  const { rapier, world } = useRapier()

  const walkPhase = useRef(0)
  const currentYaw = useRef(0)
  const saveTimer = useRef(0)

  // Spawn position (restore from save or default hub)
  const spawn = useRef<[number, number, number]>([0, 0, 0])
  if (spawn.current[1] === 0) {
    const s = loadSave()
    const sx = s?.position?.[0] ?? 0
    const sz = s?.position?.[2] ?? 0
    const groundY = terrainHeight(sx, sz)
    spawn.current = [sx, groundY + FEET_OFFSET + 0.05, sz]
  }

  useEffect(() => {
    const onUnload = () => {
      if (!body.current) return
      const t = body.current.translation()
      writeSave(buildSave([t.x, t.y, t.z]))
    }
    window.addEventListener("beforeunload", onUnload)
    return () => window.removeEventListener("beforeunload", onUnload)
  }, [])

  const _fwd = useRef(new THREE.Vector3())
  const _right = useRef(new THREE.Vector3())
  const _move = useRef(new THREE.Vector3())

  useFrame((_, rawDt) => {
    const b = body.current
    if (!b) return
    const dt = Math.min(rawDt, 0.05) // clamp to avoid tunneling on frame spikes

    const store = useGameStore.getState()

    // --- One-shot respawn command from the HUD ---
    if (playerCommands.respawn) {
      playerCommands.respawn = false
      const gy = terrainHeight(0, 0) + FEET_OFFSET + 2
      b.setTranslation({ x: 0, y: gy, z: 0 }, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
    // Freeze horizontal control while in dialogue or dead (gravity still applies).
    const frozen = store.dead || store.dialogue !== null

    // --- Ground check via downward ray ---
    const t = b.translation()
    const rayOrigin = { x: t.x, y: t.y, z: t.z }
    const ray = new rapier.Ray(rayOrigin, { x: 0, y: -1, z: 0 })
    const hit = world.castRay(ray, FEET_OFFSET + 0.25, true, undefined, undefined, b.collider(0), b)
    const grounded = hit !== null
    playerRef.grounded = grounded

    // --- Camera-relative movement ---
    const az = cameraState.azimuth
    _fwd.current.set(-Math.sin(az), 0, -Math.cos(az))
    _right.current.set(-_fwd.current.z, 0, _fwd.current.x)

    const mv = frozen ? { x: 0, y: 0 } : input.getMove()
    _move.current.set(0, 0, 0)
    _move.current.addScaledVector(_fwd.current, mv.y)
    _move.current.addScaledVector(_right.current, mv.x)
    const moveLen = _move.current.length()
    const moving = moveLen > 0.08
    if (moveLen > 1) _move.current.multiplyScalar(1 / moveLen)

    // --- Stamina + run gating ---
    const maxStamina = store.maxStamina
    let stamina = store.stamina
    const wantRun = input.wantsRun() && moving && stamina > 1
    const speed = wantRun ? RUN_SPEED : WALK_SPEED

    if (wantRun) {
      stamina -= 20 * dt
    } else if (moving) {
      stamina += 6 * dt
    } else {
      stamina += 16 * dt
    }

    // --- Apply horizontal velocity, keep vertical from physics ---
    const linvel = b.linvel()
    const targetVx = moving ? _move.current.x * speed : 0
    const targetVz = moving ? _move.current.z * speed : 0
    b.setLinvel({ x: targetVx, y: linvel.y, z: targetVz }, true)

    // --- Jump ---
    const jumpPressed = !frozen && input.consumeJump()
    if (jumpPressed && grounded && stamina > 8) {
      b.setLinvel({ x: targetVx, y: JUMP_VELOCITY, z: targetVz }, true)
      stamina -= 12
    }
    stamina = Math.max(0, Math.min(maxStamina, stamina))

    // --- Facing / yaw ---
    if (moving) {
      const targetYaw = Math.atan2(_move.current.x, _move.current.z)
      // shortest-arc interpolation
      let delta = targetYaw - currentYaw.current
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      currentYaw.current += delta * Math.min(1, dt * 12)
    }
    if (visual.current) visual.current.rotation.y = currentYaw.current

    // --- Procedural animation ---
    const l = limbs.current
    if (!grounded) {
      // airborne pose: tuck legs, raise arms slightly
      lerpRot(l.legL, -0.5, dt)
      lerpRot(l.legR, -0.9, dt)
      lerpRot(l.armL, -1.6, dt)
      lerpRot(l.armR, -1.6, dt)
    } else if (moving) {
      const rate = wantRun ? 15 : 9.5
      const amp = wantRun ? 1.0 : 0.62
      walkPhase.current += dt * rate
      const p = walkPhase.current
      if (l.legL) l.legL.rotation.x = Math.sin(p) * amp
      if (l.legR) l.legR.rotation.x = Math.sin(p + Math.PI) * amp
      if (l.armL) l.armL.rotation.x = Math.sin(p + Math.PI) * amp * 0.85
      if (l.armR) l.armR.rotation.x = Math.sin(p) * amp * 0.85
      if (l.torso) l.torso.position.y = Math.abs(Math.sin(p)) * 0.04
    } else {
      // idle: settle limbs, gentle breathing bob
      lerpRot(l.legL, 0, dt)
      lerpRot(l.legR, 0, dt)
      lerpRot(l.armL, 0, dt)
      lerpRot(l.armR, 0, dt)
      if (l.torso) l.torso.position.y = Math.sin(performance.now() * 0.002) * 0.02
    }

    // --- Respawn safety if the player falls off the world ---
    if (t.y < -25) {
      b.setTranslation({ x: 0, y: terrainHeight(0, 0) + 3, z: 0 }, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }

    // --- Publish shared + store state ---
    playerRef.position.set(t.x, t.y, t.z)
    playerRef.yaw = currentYaw.current
    store.setStamina(stamina)
    store.setPlayerTransform(t.x, t.z, currentYaw.current, moving, wantRun)

    // --- Periodic autosave ---
    saveTimer.current += dt
    if (saveTimer.current > 3) {
      saveTimer.current = 0
      writeSave(buildSave([t.x, t.y, t.z]))
    }
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={spawn.current}
      enabledRotations={[false, false, false]}
      mass={1}
      linearDamping={0}
      canSleep={false}
      ccd
    >
      <CapsuleCollider
        args={[CAPSULE_HALF, CAPSULE_RADIUS]}
        friction={0}
        frictionCombineRule={CoefficientCombineRule.Min}
      />
      <group position={[0, -FEET_OFFSET, 0]}>
        <CharacterModel ref={visual} limbs={limbs} />
      </group>
    </RigidBody>
  )
}

function lerpRot(g: Group | null, target: number, dt: number) {
  if (!g) return
  g.rotation.x += (target - g.rotation.x) * Math.min(1, dt * 10)
}
