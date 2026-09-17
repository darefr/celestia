// Frame-loop combat input singleton, mirroring the movement input pattern.
// The Combat system consumes a queued attack each frame; keyboard/mouse/touch
// all funnel through queueAttack().

export const combat = {
  attackQueued: false,
}

export function queueAttack() {
  combat.attackQueued = true
}

export function consumeAttack(): boolean {
  if (combat.attackQueued) {
    combat.attackQueued = false
    return true
  }
  return false
}
