// Fully procedural audio built with the Web Audio API so the game needs no
// external audio files. Ambient pad = a few detuned oscillators through a
// lowpass + slow tremolo. Footsteps = short filtered noise thuds triggered on
// a cadence while the player is moving.

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private oscillators: OscillatorNode[] = []
  private noiseBuffer: AudioBuffer | null = null
  private started = false

  private musicOn = false
  private footstepsOn = true

  init() {
    if (this.ctx) return
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctx()

    this.master = this.ctx.createGain()
    this.master.gain.value = 0.9
    this.master.connect(this.ctx.destination)

    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0
    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = 0.9
    this.musicGain.connect(this.master)
    this.sfxGain.connect(this.master)

    // Pre-render a short noise buffer for footsteps
    const len = Math.floor(this.ctx.sampleRate * 0.2)
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = this.noiseBuffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1

    this.buildAmbient()
  }

  private buildAmbient() {
    if (!this.ctx || !this.musicGain) return
    const now = this.ctx.currentTime

    const filter = this.ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 900
    filter.Q.value = 0.6
    filter.connect(this.musicGain)

    // Gentle tremolo on the whole pad
    const tremolo = this.ctx.createGain()
    tremolo.gain.value = 0.5
    tremolo.connect(filter)
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.08
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 0.18
    lfo.connect(lfoGain)
    lfoGain.connect(tremolo.gain)
    lfo.start(now)
    this.oscillators.push(lfo)

    // Soft major-9 style chord
    const freqs = [130.81, 196.0, 261.63, 329.63]
    for (const f of freqs) {
      const osc = this.ctx.createOscillator()
      osc.type = "triangle"
      osc.frequency.value = f
      osc.detune.value = (Math.random() - 0.5) * 8
      const g = this.ctx.createGain()
      g.gain.value = 0.12
      osc.connect(g)
      g.connect(tremolo)
      osc.start(now)
      this.oscillators.push(osc)
    }
  }

  resume() {
    this.ctx?.resume()
    this.started = true
  }

  setMusic(on: boolean) {
    this.musicOn = on
    if (!this.ctx || !this.musicGain) return
    const now = this.ctx.currentTime
    this.musicGain.gain.cancelScheduledValues(now)
    this.musicGain.gain.linearRampToValueAtTime(on ? 0.5 : 0, now + 1.2)
  }

  setFootsteps(on: boolean) {
    this.footstepsOn = on
  }

  playFootstep(strong: boolean) {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer || !this.footstepsOn || !this.started) return
    const now = this.ctx.currentTime

    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer

    const bp = this.ctx.createBiquadFilter()
    bp.type = "bandpass"
    bp.frequency.value = strong ? 220 : 160
    bp.Q.value = 1.2

    const g = this.ctx.createGain()
    const vol = strong ? 0.5 : 0.32
    g.gain.setValueAtTime(vol, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

    src.connect(bp)
    bp.connect(g)
    g.connect(this.sfxGain)
    src.start(now)
    src.stop(now + 0.16)
  }

  get isMusicOn() {
    return this.musicOn
  }
}

export const audioEngine = new AudioEngine()
