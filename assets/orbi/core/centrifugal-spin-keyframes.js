export const VERTICAL_TURN_ENDS = Object.freeze([.346667, .573333, .8]);

const TURN_START = .12;
const TURN_LENGTH = (.8 - TURN_START) / VERTICAL_TURN_ENDS.length;
const offsetAt = (turn, phase) => Number((TURN_START + TURN_LENGTH * (turn + phase)).toFixed(6));

function createFaceOrbitFrames(amplitude = 24) {
  const frames = [
    { transform: "translateX(0px) scaleX(1)", opacity: 1, offset: 0 },
    { transform: "translateX(0px) scaleX(1)", opacity: 1, offset: .08 },
  ];

  for (let turn = 0; turn < 3; turn += 1) {
    if (turn === 0) {
      frames.push({ transform: "translateX(0px) scaleX(1)", opacity: 1, offset: offsetAt(turn, 0) });
    }
    frames.push(
      { transform: `translateX(${amplitude * .72}px) scaleX(.72)`, opacity: 1, offset: offsetAt(turn, .18) },
      { transform: `translateX(${amplitude}px) scaleX(.12)`, opacity: .18, offset: offsetAt(turn, .25) },
      { transform: `translateX(${amplitude * 1.06}px) scaleX(.06)`, opacity: 0, offset: offsetAt(turn, .31) },
      { transform: `translateX(${-amplitude * 1.06}px) scaleX(.06)`, opacity: 0, offset: offsetAt(turn, .69) },
      { transform: `translateX(${-amplitude}px) scaleX(.12)`, opacity: .18, offset: offsetAt(turn, .75) },
      { transform: `translateX(${-amplitude * .72}px) scaleX(.72)`, opacity: 1, offset: offsetAt(turn, .82) },
      { transform: "translateX(0px) scaleX(1)", opacity: 1, offset: offsetAt(turn, 1) },
    );
  }

  frames.push(
    { transform: "translateX(-2px) scaleX(.98)", opacity: 1, offset: .9 },
    { transform: "translateX(0px) scaleX(1)", opacity: 1, offset: 1 },
  );
  return frames;
}

function createSurfaceOrbitFrames({ amplitude, frontOpacity, backOpacity }) {
  const neutral = "translateX(0px) scaleX(1)";
  const frames = [
    { transform: neutral, opacity: frontOpacity, offset: 0 },
    { transform: neutral, opacity: frontOpacity, offset: .08 },
  ];

  for (let turn = 0; turn < 3; turn += 1) {
    if (turn === 0) frames.push({ transform: neutral, opacity: frontOpacity, offset: offsetAt(turn, 0) });
    frames.push(
      { transform: `translateX(${amplitude}px) scaleX(.42)`, opacity: frontOpacity * .8, offset: offsetAt(turn, .25) },
      { transform: "translateX(0px) scaleX(-.92)", opacity: backOpacity, offset: offsetAt(turn, .5) },
      { transform: `translateX(${-amplitude}px) scaleX(.42)`, opacity: frontOpacity * .8, offset: offsetAt(turn, .75) },
      { transform: neutral, opacity: frontOpacity, offset: offsetAt(turn, 1) },
    );
  }

  frames.push({ transform: neutral, opacity: frontOpacity, offset: 1 });
  return frames;
}

/**
 * Three rotations around Orbi's vertical axis. The silhouette stays frontal;
 * face, shine and surface bands travel around it and disappear on the back.
 */
export function createCentrifugalSpinFrames() {
  return {
    body: [
      { transform: "translateY(0) scale(1, 1)", offset: 0 },
      { transform: "translateY(0) scale(.97, 1.03)", offset: .08, easing: "cubic-bezier(.4,0,.75,.35)" },
      { transform: "translateY(0) scale(1.05, .97)", offset: .12, easing: "cubic-bezier(.16,.7,.28,1)" },
      { transform: "translateY(0) scale(1.10, .95)", offset: .346667 },
      { transform: "translateY(0) scale(1.12, .94)", offset: .573333 },
      { transform: "translateY(0) scale(1.08, .96)", offset: .8 },
      { transform: "translateY(0) scale(.98, 1.02)", offset: .9, easing: "cubic-bezier(.16,.78,.3,1)" },
      { transform: "translateY(0) scale(1, 1)", offset: 1, easing: "cubic-bezier(.16,1,.3,1)" },
    ],
    eyes: createFaceOrbitFrames(24),
    shine: createFaceOrbitFrames(18),
    surfaceA: createSurfaceOrbitFrames({ amplitude: 23, frontOpacity: .94, backOpacity: .32 }),
    surfaceB: createSurfaceOrbitFrames({ amplitude: 18, frontOpacity: .72, backOpacity: .24 }),
    shadow: [
      { transform: "scaleX(1)", opacity: .28, offset: 0 },
      { transform: "scaleX(1.08)", opacity: .31, offset: .12 },
      { transform: "scaleX(1.25)", opacity: .25, offset: .346667 },
      { transform: "scaleX(1.30)", opacity: .23, offset: .573333 },
      { transform: "scaleX(1.20)", opacity: .26, offset: .8 },
      { transform: "scaleX(1)", opacity: .28, offset: 1 },
    ],
    glow: [
      { opacity: .48, offset: 0 },
      { opacity: .62, offset: .12 },
      { opacity: .78, offset: .346667 },
      { opacity: .88, offset: .573333 },
      { opacity: .70, offset: .8 },
      { opacity: .48, offset: 1 },
    ],
    speedBack: [
      { opacity: 0, transform: "translate(-50%, -50%) translateX(0px) scale(.84, .9)", offset: 0 },
      { opacity: .22, transform: "translate(-50%, -50%) translateX(-10px) scale(.94, .96)", offset: .12 },
      { opacity: .78, transform: "translate(-50%, -50%) translateX(12px) scale(1, 1)", offset: .346667 },
      { opacity: .96, transform: "translate(-50%, -50%) translateX(-12px) scale(1.04, 1)", offset: .573333 },
      { opacity: .74, transform: "translate(-50%, -50%) translateX(10px) scale(1, .98)", offset: .8 },
      { opacity: 0, transform: "translate(-50%, -50%) translateX(18px) scale(1.08, 1)", offset: .9 },
      { opacity: 0, transform: "translate(-50%, -50%) translateX(0px) scale(1, 1)", offset: 1 },
    ],
    speedFront: [
      { opacity: 0, transform: "translate(-50%, -50%) translateX(0px) scale(.84, .9)", offset: 0 },
      { opacity: .18, transform: "translate(-50%, -50%) translateX(10px) scale(.94, .96)", offset: .12 },
      { opacity: .72, transform: "translate(-50%, -50%) translateX(-12px) scale(1, 1)", offset: .346667 },
      { opacity: .92, transform: "translate(-50%, -50%) translateX(12px) scale(1.04, 1)", offset: .573333 },
      { opacity: .68, transform: "translate(-50%, -50%) translateX(-10px) scale(1, .98)", offset: .8 },
      { opacity: 0, transform: "translate(-50%, -50%) translateX(-18px) scale(1.08, 1)", offset: .9 },
      { opacity: 0, transform: "translate(-50%, -50%) translateX(0px) scale(1, 1)", offset: 1 },
    ],
    speedStreaks: [
      { strokeDashoffset: "0px", offset: 0 },
      { strokeDashoffset: "0px", offset: .12 },
      { strokeDashoffset: "-180px", offset: .346667 },
      { strokeDashoffset: "-360px", offset: .573333 },
      { strokeDashoffset: "-540px", offset: .8 },
      { strokeDashoffset: "0px", offset: 1 },
    ],
  };
}
