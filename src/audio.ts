/** All sound is synthesised with Web Audio: no audio files. */

export const noteHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Pentatonic scale degrees as semitone offsets from the tonic. */
const PENTA = [0, 2, 4, 7, 9];
const MINOR_PENTA = [0, 3, 5, 7, 10];

/** Step `i` of the lead melody as a MIDI note, or null for a rest. Deterministic, loops every 32 steps. */
export function melody(i: number, night: boolean): number | null {
  const scale = night ? MINOR_PENTA : PENTA;
  const root = night ? 57 : 60;
  const k = i % 32;
  if (k % 4 === 3 && k % 8 !== 7) return null;
  const walk = [0, 2, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1, 0, 1];
  const d = walk[(k >> 1) % walk.length]! + (k >= 16 && k % 2 ? 1 : 0);
  return root + 12 + scale[d % 5]! + (d >= 5 ? 12 : 0);
}

/** Bass note for step `i`: root and fifth, changing every 8 steps. */
export function bass(i: number, night: boolean): number | null {
  if (i % 4) return null;
  const root = night ? 45 : 48;
  const chord = [0, 0, 5, 7][(i >> 3) % 4]!;
  return root + chord + (i % 8 === 4 ? 7 : 0);
}

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer = 0;
  private step = 0;
  private nextAt = 0;
  night = false;
  muted = true;

  /** Starts (or resumes) audio. Must follow a user gesture. */
  async start() {
    this.ctx ??= new AudioContext();
    this.master ??= this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.master.gain.value = this.muted ? 0 : 0.8;
    await this.ctx.resume();
    if (!this.timer) {
      this.nextAt = this.ctx.currentTime + 0.1;
      this.timer = window.setInterval(() => this.schedule(), 80);
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      if (!m) void this.ctx.resume();
      this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  suspend(hidden: boolean) {
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  private tone(
    type: OscillatorType,
    hz: number,
    at: number,
    dur: number,
    vol: number,
    slideTo?: number,
  ) {
    if (!this.ctx || !this.master || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(hz, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.master);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  /** Background loop: a lookahead scheduler so timing stays steady while the page is busy. */
  private schedule() {
    if (!this.ctx) return;
    const stepLen = this.night ? 0.24 : 0.19;
    while (this.nextAt < this.ctx.currentTime + 0.3) {
      const m = melody(this.step, this.night);
      const b = bass(this.step, this.night);
      if (m !== null)
        this.tone("square", noteHz(m), this.nextAt, stepLen * 0.9, 0.035);
      if (b !== null)
        this.tone("triangle", noteHz(b), this.nextAt, stepLen * 3, 0.1);
      this.nextAt += stepLen;
      this.step++;
    }
  }

  /** A footstep tick. */
  footstep() {
    if (!this.ctx || this.muted) return;
    this.tone("square", 150, this.ctx.currentTime, 0.04, 0.03, 60);
  }

  click() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone("square", 660, t, 0.06, 0.06);
    this.tone("square", 990, t + 0.05, 0.08, 0.06);
  }

  /** A short two-note meow. */
  meow() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this.tone("sawtooth", 520, t, 0.16, 0.05, 760);
    this.tone("sawtooth", 760, t + 0.15, 0.22, 0.05, 430);
  }

  /** A tiny squeak for small animals. */
  squeak() {
    if (!this.ctx || this.muted) return;
    this.tone("square", 1500, this.ctx.currentTime, 0.07, 0.04, 2300);
  }

  /** Distant thunder, `delay` seconds after the flash. */
  thunder(delay: number) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    this.tone("sawtooth", 90, t, 1.4, 0.09, 38);
    this.tone("triangle", 60, t + 0.1, 1.6, 0.1, 30);
  }

  /** Arrival chime for station `i`: a rising arpeggio, longer for later stations. */
  chime(i: number) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const root = 72 + (i % 3) * 2;
    [0, 4, 7, 12]
      .slice(0, 3 + (i % 2))
      .forEach((n, k) =>
        this.tone("square", noteHz(root + n), t + k * 0.07, 0.12, 0.04),
      );
  }
}
