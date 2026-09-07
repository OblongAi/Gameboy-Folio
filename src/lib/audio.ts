let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function resumeAudio() {
  const c = context();
  if (c && c.state === "suspended") void c.resume();
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  gain = 0.08,
  type: OscillatorType = "square",
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function playBootChime() {
  const c = context();
  if (!c) return;
  const t = c.currentTime + 0.02;
  tone(c, 392, t, 0.16, 0.07);
  tone(c, 587, t + 0.14, 0.28, 0.08);
}

export function playClick() {
  const c = context();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 180, t, 0.04, 0.045, "square");
}

export function playConfirm() {
  const c = context();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 520, t, 0.06, 0.05);
  tone(c, 690, t + 0.05, 0.07, 0.045);
}

export function playBack() {
  const c = context();
  if (!c) return;
  tone(c, 220, c.currentTime, 0.06, 0.04);
}
