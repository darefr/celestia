import * as THREE from "three"

// Shared, mutable player transform written by the Player each frame and read by
// the camera controller + mini-map. Using a singleton avoids prop drilling
// through the R3F tree and keeps everything in sync with physics without
// triggering React re-renders.
export const playerRef = {
  position: new THREE.Vector3(0, 2, 0),
  yaw: 0,
  grounded: false,
}

// Camera controller writes its horizontal orbit angle here so the player can
// move relative to the current camera view.
export const cameraState = {
  azimuth: 0,
}

// One-shot commands issued from React (HUD) to the Player running in the frame
// loop. The Player reads and clears these each frame.
export const playerCommands = {
  respawn: false,
}
