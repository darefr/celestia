// Frame-loop input state. This is a plain mutable singleton read inside
// useFrame every frame, so updating it never triggers React re-renders.
// Keyboard and the on-screen joystick write into separate channels which the
// player merges each frame.

type MoveVec = { x: number; y: number } // x = strafe (+right), y = forward (+forward)

const keys = new Set<string>()

export const input = {
  keyboard: { x: 0, y: 0 } as MoveVec,
  joystick: { x: 0, y: 0 } as MoveVec,
  jumpQueued: false,
  runHeld: false, // from shift key
  joystickBoost: false, // joystick pushed far => run

  // Combined, clamped movement vector for this frame.
  getMove(): MoveVec {
    const x = clamp(this.keyboard.x + this.joystick.x, -1, 1)
    const y = clamp(this.keyboard.y + this.joystick.y, -1, 1)
    return { x, y }
  },

  wantsRun(): boolean {
    return this.runHeld || this.joystickBoost
  },

  consumeJump(): boolean {
    if (this.jumpQueued) {
      this.jumpQueued = false
      return true
    }
    return false
  },
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function recomputeKeyboard() {
  let x = 0
  let y = 0
  if (keys.has("KeyW") || keys.has("ArrowUp")) y += 1
  if (keys.has("KeyS") || keys.has("ArrowDown")) y -= 1
  if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1
  input.keyboard.x = x
  input.keyboard.y = y
  input.runHeld = keys.has("ShiftLeft") || keys.has("ShiftRight")
}

let attached = false

export function attachKeyboard() {
  if (attached || typeof window === "undefined") return
  attached = true

  const onDown = (e: KeyboardEvent) => {
    // Prevent page scroll on arrows / space while playing
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault()
    }
    if (e.code === "Space") {
      input.jumpQueued = true
      return
    }
    keys.add(e.code)
    recomputeKeyboard()
  }
  const onUp = (e: KeyboardEvent) => {
    keys.delete(e.code)
    recomputeKeyboard()
  }
  const onBlur = () => {
    keys.clear()
    recomputeKeyboard()
  }

  window.addEventListener("keydown", onDown, { passive: false })
  window.addEventListener("keyup", onUp)
  window.addEventListener("blur", onBlur)

  return () => {
    window.removeEventListener("keydown", onDown)
    window.removeEventListener("keyup", onUp)
    window.removeEventListener("blur", onBlur)
    attached = false
  }
}

// Called by the on-screen joystick.
export function setJoystick(x: number, y: number, boost: boolean) {
  input.joystick.x = x
  input.joystick.y = y
  input.joystickBoost = boost
}

export function queueJump() {
  input.jumpQueued = true
}
