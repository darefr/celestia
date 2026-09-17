import * as THREE from "three"
import type { EnemyType } from "./entities-config"

// Runtime registry of live enemies. This is the shared source of truth for
// enemy health and position so the Combat system can deal damage and the
// mini-map / markers can read positions without prop drilling or re-renders.
export interface EnemyRuntime {
  id: string
  type: EnemyType
  position: THREE.Vector3
  health: number
  maxHealth: number
  alive: boolean
  lastHitAt: number // ms timestamp for hit-flash
}

export const enemyRegistry = new Map<string, EnemyRuntime>()

export function registerEnemy(e: EnemyRuntime) {
  enemyRegistry.set(e.id, e)
}

export function unregisterEnemy(id: string) {
  enemyRegistry.delete(id)
}
