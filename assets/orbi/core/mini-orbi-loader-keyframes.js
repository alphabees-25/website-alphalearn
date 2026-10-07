import { MINI_ORBI_SIZES } from "./split-swarm-keyframes.js?v=0.8.11";

export const MINI_ORBI_LOADER_COMPLETE_SIGNAL = "mini-orbi-loader-complete";
export const MINI_ORBI_LOADER_DURATION = 2200;
export const MINI_ORBI_LOADER_INDICES = Object.freeze([2, 4, 6]);
export const MINI_ORBI_LOADER_HOME_X = Object.freeze([-64, 0, 64]);

const JUGGLE_HOPS_PER_CYCLE = 2;
const JUGGLE_OUTBOUND_FRACTION = 2 / 3;
const JUGGLE_X_RADIUS = 64;
const JUGGLE_HIGH_ARC = 70;
const JUGGLE_RETURN_ARC = 25;
const JUGGLE_SAMPLE_COUNT = 48;
const JUGGLE_PHASES = Object.freeze([0, 1 / 3, 2 / 3]);
const BLINK_SCHEDULES = Object.freeze([
  Object.freeze([Object.freeze([.14]), Object.freeze([.58]), Object.freeze([])]),
  Object.freeze([Object.freeze([]), Object.freeze([.83]), Object.freeze([.29])]),
  Object.freeze([Object.freeze([.69]), Object.freeze([]), Object.freeze([.16, .28])]),
  Object.freeze([Object.freeze([.39]), Object.freeze([.91]), Object.freeze([])]),
]);

const round = (value) => Number(value.toFixed(2));

const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;

function createJugglePose(slotIndex, offset) {
  const sourceIndex = MINI_ORBI_LOADER_INDICES[slotIndex];
  const size = MINI_ORBI_SIZES[sourceIndex];
  const groundY = 94 - size / 2;
  const phase = modulo(offset * JUGGLE_HOPS_PER_CYCLE + JUGGLE_PHASES[slotIndex], 1);
  const outbound = phase < JUGGLE_OUTBOUND_FRACTION;
  const legProgress = outbound
    ? phase / JUGGLE_OUTBOUND_FRACTION
    : (phase - JUGGLE_OUTBOUND_FRACTION) / (1 - JUGGLE_OUTBOUND_FRACTION);
  const arc = 4 * legProgress * (1 - legProgress);
  const arcHeight = outbound ? JUGGLE_HIGH_ARC : JUGGLE_RETURN_ARC;
  const height = arcHeight * arc;
  const xDirection = outbound ? 1 : -1;
  const x = xDirection > 0
    ? -JUGGLE_X_RADIUS + JUGGLE_X_RADIUS * 2 * legProgress
    : JUGGLE_X_RADIUS - JUGGLE_X_RADIUS * 2 * legProgress;
  const y = groundY - height;
  const distanceToOuterContact = Math.min(
    modulo(phase, 1),
    1 - modulo(phase, 1),
    Math.abs(phase - JUGGLE_OUTBOUND_FRACTION),
  );
  const contactPulse = Math.max(0, 1 - distanceToOuterContact / .055);
  const rotation = xDirection * (1 - legProgress * 2) * (outbound ? 8 : 4);
  const scaleX = 1 + contactPulse * .10;
  const scaleY = 1 - contactPulse * .12;
  return {
    arc,
    groundY,
    heightNorm: height / JUGGLE_HIGH_ARC,
    rotation,
    scaleX,
    scaleY,
    x,
    y,
  };
}

function createJuggleBodyFrame(slotIndex, offset) {
  const pose = createJugglePose(slotIndex, offset);
  return {
    transform: `translate(${round(pose.x)}px, ${round(pose.y)}px) rotate(${round(pose.rotation)}deg) scale(${round(pose.scaleX)}, ${round(pose.scaleY)})`,
    opacity: 1,
    offset,
  };
}

function createJuggleShadowFrame(slotIndex, offset) {
  const pose = createJugglePose(slotIndex, offset);
  const shadowScale = .42 + (1 - pose.heightNorm) * .58;
  const shadowOpacity = .07 + (1 - pose.heightNorm) * .13;
  return {
    transform: `translateX(${round(pose.x)}px) scaleX(${round(shadowScale)})`,
    opacity: round(shadowOpacity),
    offset,
  };
}

export function createMiniOrbiLoaderEntranceFrames(slotIndex) {
  const sourceIndex = MINI_ORBI_LOADER_INDICES[slotIndex];
  const size = MINI_ORBI_SIZES[sourceIndex];
  const homeX = MINI_ORBI_LOADER_HOME_X[slotIndex];
  const groundY = 94 - size / 2;
  const delay = slotIndex * .075;
  const loopBodyStart = createJuggleBodyFrame(slotIndex, 0);
  const loopShadowStart = createJuggleShadowFrame(slotIndex, 0);
  const transform = (y, rotation, scaleX, scaleY) =>
    `translate(${homeX}px, ${y}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
  return {
    body: [
      { transform: transform(groundY + 14, slotIndex % 2 ? 7 : -7, .12, .12), opacity: 0, offset: 0 },
      { transform: transform(groundY + 14, slotIndex % 2 ? 7 : -7, .12, .12), opacity: 0, offset: delay },
      { transform: transform(groundY - 8, slotIndex % 2 ? -3 : 3, .82, 1.10), opacity: 1, offset: delay + .28, easing: "cubic-bezier(.16,1,.3,1)" },
      { ...loopBodyStart, offset: delay + .54, easing: "cubic-bezier(.16,1,.3,1)" },
      { ...loopBodyStart, offset: 1 },
    ],
    shadow: [
      { transform: `translateX(${homeX}px) scaleX(.18)`, opacity: 0, offset: 0 },
      { transform: `translateX(${homeX}px) scaleX(.18)`, opacity: 0, offset: delay },
      { transform: `translateX(${homeX}px) scaleX(.68)`, opacity: .10, offset: delay + .28 },
      { ...loopShadowStart, offset: delay + .54 },
      { ...loopShadowStart, offset: 1 },
    ],
  };
}

export function createMiniOrbiLoaderLoopFrames() {
  return MINI_ORBI_LOADER_INDICES.map((_, slotIndex) => {
    const body = [];
    const shadow = [];
    for (let sample = 0; sample < JUGGLE_SAMPLE_COUNT; sample += 1) {
      const offset = sample / JUGGLE_SAMPLE_COUNT;
      body.push(createJuggleBodyFrame(slotIndex, offset));
      shadow.push(createJuggleShadowFrame(slotIndex, offset));
    }
    body.push({ ...body[0], offset: 1 });
    shadow.push({ ...shadow[0], offset: 1 });
    return { body, shadow };
  });
}

export function createMiniOrbiLoaderBlinkFrames(slotIndex, cycleIndex = 0) {
  const cycle = BLINK_SCHEDULES[Math.abs(cycleIndex) % BLINK_SCHEDULES.length];
  const blinkTimes = cycle[slotIndex] || [];
  const frames = [{ transform: "scaleY(1)", offset: 0 }];
  blinkTimes.forEach((blinkAt) => {
    frames.push(
      { transform: "scaleY(1)", offset: round(blinkAt - .035) },
      { transform: "scaleY(.06)", offset: blinkAt },
      { transform: "scaleY(1)", offset: round(blinkAt + .045) },
    );
  });
  frames.push({ transform: "scaleY(1)", offset: 1 });
  return frames;
}

export function createMiniOrbiLoaderMainFrames() {
  return {
    hideActor: [
      { transform: "scale(1)", opacity: 1, offset: 0 },
      { transform: "scale(.82)", opacity: 0, offset: .56, easing: "cubic-bezier(.4,0,.7,1)" },
      { transform: "scale(.82)", opacity: 0, offset: 1 },
    ],
    hideShadow: [
      { transform: "scaleX(1)", opacity: .28, offset: 0 },
      { transform: "scaleX(.52)", opacity: 0, offset: .48 },
      { transform: "scaleX(.52)", opacity: 0, offset: 1 },
    ],
    showActor: [
      { transform: "scale(.82)", opacity: 0, offset: 0 },
      { transform: "scale(.82)", opacity: 0, offset: .34 },
      { transform: "scale(1)", opacity: 1, offset: 1, easing: "cubic-bezier(.16,1,.3,1)" },
    ],
    showShadow: [
      { transform: "scaleX(.52)", opacity: 0, offset: 0 },
      { transform: "scaleX(.52)", opacity: 0, offset: .34 },
      { transform: "scaleX(1)", opacity: .28, offset: 1 },
    ],
  };
}

export function createMiniOrbiLoaderExitFrames(slotIndex) {
  const startBody = createJuggleBodyFrame(slotIndex, 0);
  const startShadow = createJuggleShadowFrame(slotIndex, 0);
  const startPose = createJugglePose(slotIndex, 0);
  return {
    body: [
      { ...startBody, offset: 0 },
      { transform: `translate(${round(startPose.x)}px, ${round(startPose.y - 12)}px) rotate(0deg) scale(.12, .12)`, opacity: 0, offset: .72, easing: "cubic-bezier(.4,0,.7,1)" },
      { transform: `translate(${round(startPose.x)}px, ${round(startPose.y - 12)}px) rotate(0deg) scale(.12, .12)`, opacity: 0, offset: 1 },
    ],
    shadow: [
      { ...startShadow, offset: 0 },
      { transform: `translateX(${round(startPose.x)}px) scaleX(.18)`, opacity: 0, offset: .64 },
      { transform: `translateX(${round(startPose.x)}px) scaleX(.18)`, opacity: 0, offset: 1 },
    ],
  };
}
