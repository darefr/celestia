"use client"

import { forwardRef } from "react"
import type { Group } from "three"

export interface CharacterLimbs {
  root: Group | null
  legL: Group | null
  legR: Group | null
  armL: Group | null
  armR: Group | null
  torso: Group | null
}

interface Props {
  limbs: React.MutableRefObject<CharacterLimbs>
}

// Low-poly anime-style humanoid placeholder built from primitives.
// Measured from the feet (y = 0) upward; the Player offsets it so the feet sit
// at the bottom of the physics capsule. Model faces +Z by default.
export const CharacterModel = forwardRef<Group, Props>(function CharacterModel({ limbs }, ref) {
  const skin = "#f3c9a6"
  const hair = "#3a4a63"
  const shirt = "#4f7bd6"
  const pants = "#37415a"
  const shoe = "#2a2f3d"

  return (
    <group ref={ref}>
      {/* Torso group (breathing bob applied here) */}
      <group ref={(g) => (limbs.current.torso = g)}>
        {/* Chest */}
        <mesh position={[0, 1.12, 0]} castShadow>
          <capsuleGeometry args={[0.26, 0.36, 4, 10]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
        {/* Pelvis */}
        <mesh position={[0, 0.82, 0]} castShadow>
          <boxGeometry args={[0.44, 0.28, 0.28]} />
          <meshStandardMaterial color={pants} roughness={0.85} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 1.46, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.1, 0.12, 8]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        {/* Head (oversized, anime proportion) */}
        <mesh position={[0, 1.7, 0]} castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        {/* Hair cap */}
        <mesh position={[0, 1.8, -0.02]} castShadow>
          <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color={hair} roughness={0.7} />
        </mesh>
        {/* Hair fringe */}
        <mesh position={[0, 1.82, 0.18]} rotation={[0.5, 0, 0]} castShadow>
          <coneGeometry args={[0.26, 0.28, 8]} />
          <meshStandardMaterial color={hair} roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.1, 1.7, 0.25]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#26313f" />
        </mesh>
        <mesh position={[-0.1, 1.7, 0.25]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#26313f" />
        </mesh>
      </group>

      {/* Left arm (pivot at shoulder) */}
      <group ref={(g) => (limbs.current.armL = g)} position={[0.34, 1.34, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.42, 4, 8]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
      </group>

      {/* Right arm */}
      <group ref={(g) => (limbs.current.armR = g)} position={[-0.34, 1.34, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.42, 4, 8]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
      </group>

      {/* Left leg (pivot at hip) */}
      <group ref={(g) => (limbs.current.legL = g)} position={[0.14, 0.78, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.46, 4, 8]} />
          <meshStandardMaterial color={pants} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.66, 0.05]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.28]} />
          <meshStandardMaterial color={shoe} roughness={0.8} />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={(g) => (limbs.current.legR = g)} position={[-0.14, 0.78, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.46, 4, 8]} />
          <meshStandardMaterial color={pants} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.66, 0.05]} castShadow>
          <boxGeometry args={[0.16, 0.12, 0.28]} />
          <meshStandardMaterial color={shoe} roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
})
