/**
 * Deterministische Comic-Action für „Rambo Orbi“.
 *
 * Die Zahlen in diesem Block sind der zentrale Fine-Tuning-Einstieg. Jeder
 * Schuss besitzt einen festen Zeitpunkt, eine feste Seite und vollständig
 * endliche Effekte. Es gibt keinen Laufzeit-Zufall und keine Endlosschleife.
 */
export const RAMBO_DURATION = 4800;
export const RAMBO_SHOT_COUNT = 20;
export const RAMBO_CASING_COUNT = RAMBO_SHOT_COUNT;
export const RAMBO_SHOT_START = .30;
export const RAMBO_SHOT_STEP = .022;

const round = (value, digits = 4) => Number(value.toFixed(digits));
const neutralBody = "translateX(0px) translateY(0px) scale(1, 1) rotate(0deg)";

export function ramboShotTiming(index) {
  if (!Number.isInteger(index) || index < 0 || index >= RAMBO_SHOT_COUNT) {
    throw new RangeError(`Ungültiger Rambo-Schussindex: ${index}`);
  }
  return Object.freeze({
    offset: round(RAMBO_SHOT_START + index * RAMBO_SHOT_STEP),
    side: index % 2 === 0 ? -1 : 1,
  });
}

function createActorFrames() {
  const frames = [
    { transform: neutralBody, offset: 0 },
    { transform: "translateX(0px) translateY(4px) scale(1.055, .945) rotate(0deg)", offset: .07 },
    { transform: "translateX(0px) translateY(-3px) scale(.985, 1.02) rotate(0deg)", offset: .14, easing: "cubic-bezier(.16,1,.3,1)" },
    { transform: "translateX(0px) translateY(0px) scale(1.025, .985) rotate(0deg)", offset: .285 },
  ];

  for (let index = 0; index < RAMBO_SHOT_COUNT; index += 1) {
    const { offset, side } = ramboShotTiming(index);
    const recoilX = side * -2.2;
    frames.push(
      {
        transform: `translateX(${recoilX}px) translateY(1px) scale(1.035, .975) rotate(${side * -1.1}deg)`,
        offset,
        easing: "cubic-bezier(.2,.7,.3,1)",
      },
      {
        transform: "translateX(0px) translateY(0px) scale(1.025, .985) rotate(0deg)",
        offset: round(offset + .014),
      },
    );
  }

  frames.push(
    { transform: "translateX(0px) translateY(0px) scale(1.025, .985) rotate(0deg)", offset: .76 },
    { transform: "translateX(0px) translateY(2px) scale(1.05, .96) rotate(0deg)", offset: .84 },
    { transform: "translateX(0px) translateY(-2px) scale(.985, 1.02) rotate(0deg)", offset: .91, easing: "cubic-bezier(.16,1,.3,1)" },
    { transform: neutralBody, offset: 1 },
  );
  return frames;
}

function createGunFrames(side) {
  const hiddenX = side * -26;
  const frames = [
    { opacity: 0, transform: `translateX(${hiddenX}px) translateY(8px) rotate(${side * -10}deg) scale(.28)`, offset: 0 },
    { opacity: 0, transform: `translateX(${hiddenX}px) translateY(8px) rotate(${side * -10}deg) scale(.28)`, offset: .16 },
    { opacity: 1, transform: `translateX(${side * 2}px) translateY(-1px) rotate(${side * 1.5}deg) scale(1.04)`, offset: .235, easing: "cubic-bezier(.16,1,.3,1)" },
    { opacity: 1, transform: "translateX(0px) translateY(0px) rotate(0deg) scale(1)", offset: .285 },
  ];

  for (let index = 0; index < RAMBO_SHOT_COUNT; index += 1) {
    const shot = ramboShotTiming(index);
    if (shot.side !== side) continue;
    frames.push(
      {
        opacity: 1,
        transform: `translateX(${side * -5}px) translateY(1px) rotate(${side * -2.2}deg) scale(.985, 1.015)`,
        offset: shot.offset,
      },
      {
        opacity: 1,
        transform: "translateX(0px) translateY(0px) rotate(0deg) scale(1)",
        offset: round(shot.offset + .013),
        easing: "cubic-bezier(.16,1,.3,1)",
      },
    );
  }

  frames.push(
    { opacity: 1, transform: "translateX(0px) translateY(0px) rotate(0deg) scale(1)", offset: .78 },
    { opacity: 0, transform: `translateX(${hiddenX * .8}px) translateY(6px) rotate(${side * -8}deg) scale(.45)`, offset: .90, easing: "cubic-bezier(.45,0,.8,.5)" },
    { opacity: 0, transform: `translateX(${hiddenX * .8}px) translateY(6px) rotate(${side * -8}deg) scale(.45)`, offset: 1 },
  );
  return frames;
}

function createMuzzleFlashFrames(side) {
  const frames = [
    { opacity: 0, transform: "rotate(0deg) scale(.2)", offset: 0 },
    { opacity: 0, transform: "rotate(0deg) scale(.2)", offset: .29 },
  ];
  let localShot = 0;
  for (let index = 0; index < RAMBO_SHOT_COUNT; index += 1) {
    const shot = ramboShotTiming(index);
    if (shot.side !== side) continue;
    const angle = (localShot % 3 - 1) * 8 * side;
    frames.push(
      { opacity: 0, transform: `rotate(${angle}deg) scale(.25)`, offset: shot.offset },
      { opacity: 1, transform: `rotate(${angle}deg) scale(1.24)`, offset: round(shot.offset + .004) },
      { opacity: .92, transform: `rotate(${angle + side * 4}deg) scale(.92)`, offset: round(shot.offset + .009) },
      { opacity: 0, transform: `rotate(${angle}deg) scale(.35)`, offset: round(shot.offset + .015) },
    );
    localShot += 1;
  }
  frames.push({ opacity: 0, transform: "rotate(0deg) scale(.2)", offset: 1 });
  return frames;
}

export function createRamboFrames() {
  return {
    actor: createActorFrames(),
    shadow: [
      { opacity: .28, transform: "scaleX(1)", offset: 0 },
      { opacity: .34, transform: "scaleX(1.13)", offset: .07 },
      { opacity: .25, transform: "scaleX(.94)", offset: .14 },
      { opacity: .31, transform: "scaleX(1.08)", offset: .30 },
      { opacity: .31, transform: "scaleX(1.08)", offset: .74 },
      { opacity: .35, transform: "scaleX(1.13)", offset: .84 },
      { opacity: .28, transform: "scaleX(1)", offset: 1 },
    ],
    eyes: [
      { transform: "translate(0px, 0px) scale(1, 1)", offset: 0 },
      { transform: "translate(0px, 2px) scale(1.04, .72)", offset: .13 },
      { transform: "translate(0px, 2px) scale(1.04, .72)", offset: .83 },
      { transform: "translate(0px, 0px) scale(1, 1)", offset: .94 },
      { transform: "translate(0px, 0px) scale(1, 1)", offset: 1 },
    ],
    brows: [
      { opacity: 0, transform: "translateY(-2px)", offset: 0 },
      { opacity: 1, transform: "translateY(0px)", offset: .10 },
      { opacity: 1, transform: "translateY(0px)", offset: .84 },
      { opacity: 0, transform: "translateY(-2px)", offset: .94 },
      { opacity: 0, transform: "translateY(-2px)", offset: 1 },
    ],
    browLeft: [
      { transform: "rotate(0deg) translateY(0px)", offset: 0 },
      { transform: "rotate(12deg) translateY(1px)", offset: .12 },
      { transform: "rotate(12deg) translateY(1px)", offset: .84 },
      { transform: "rotate(0deg) translateY(0px)", offset: 1 },
    ],
    browRight: [
      { transform: "rotate(0deg) translateY(0px)", offset: 0 },
      { transform: "rotate(-12deg) translateY(1px)", offset: .12 },
      { transform: "rotate(-12deg) translateY(1px)", offset: .84 },
      { transform: "rotate(0deg) translateY(0px)", offset: 1 },
    ],
    mouth: [
      { opacity: 0, transform: "translateY(0px) scale(.72)", offset: 0 },
      { opacity: 1, transform: "translateY(0px) scale(1.15, .9)", offset: .13 },
      { opacity: 1, transform: "translateY(0px) scale(1.15, .9)", offset: .84 },
      { opacity: 0, transform: "translateY(0px) scale(.72)", offset: .94 },
      { opacity: 0, transform: "translateY(0px) scale(.72)", offset: 1 },
    ],
    headband: [
      { opacity: 0, transform: "translateY(-14px) scale(.45, .2)", offset: 0 },
      { opacity: 0, transform: "translateY(-14px) scale(.45, .2)", offset: .07 },
      { opacity: 1, transform: "translateY(0px) scale(1.04, 1)", offset: .14, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "translateY(0px) scale(1, 1)", offset: .20 },
      { opacity: 1, transform: "translateY(0px) scale(1, 1)", offset: .84 },
      { opacity: 0, transform: "translateY(-10px) scale(.82, .58)", offset: .93 },
      { opacity: 0, transform: "translateY(-10px) scale(.82, .58)", offset: 1 },
    ],
    gunLeft: createGunFrames(-1),
    gunRight: createGunFrames(1),
    flashLeft: createMuzzleFlashFrames(-1),
    flashRight: createMuzzleFlashFrames(1),
    glow: [
      { opacity: .48, offset: 0 },
      { opacity: .62, offset: .24 },
      { opacity: .78, offset: .31 },
      { opacity: .68, offset: .74 },
      { opacity: .48, offset: 1 },
    ],
  };
}

export function createRamboCasingFrames(index) {
  const { offset: shot, side } = ramboShotTiming(index);
  const originX = side * 69;
  const originY = 7 + (index % 3) * 2;
  const outward = side * (24 + (index % 4) * 5);
  const spin = side * (260 + (index % 5) * 46);
  const launch = round(shot + .005);
  const frame = (x, y, rotation, scale, opacity, offset, easing) => ({
    opacity,
    transform: `translate(${round(x, 1)}px, ${round(y, 1)}px) rotate(${round(rotation, 1)}deg) scale(${scale})`,
    offset: round(offset),
    ...(easing ? { easing } : {}),
  });
  return [
    frame(originX, originY, 0, .5, 0, 0),
    frame(originX, originY, 0, .5, 0, launch),
    frame(originX + outward * .25, originY - 12, spin * .12, .95, 1, launch + .012, "cubic-bezier(.16,1,.3,1)"),
    frame(originX + outward * .72, originY - 34 - (index % 3) * 4, spin * .46, 1, 1, launch + .068),
    frame(originX + outward, originY - 37 - (index % 2) * 4, spin * .70, .94, .96, launch + .115),
    frame(originX + outward * 1.34, originY - 9, spin, .84, .80, launch + .18),
    frame(originX + outward * 1.58, originY + 76 + (index % 4) * 8, spin * 1.45, .7, 0, launch + .245, "cubic-bezier(.45,0,.82,.42)"),
    frame(originX + outward * 1.58, originY + 76 + (index % 4) * 8, spin * 1.45, .7, 0, 1),
  ];
}

export function createRamboStreakFrames(index) {
  const { offset: shot, side } = ramboShotTiming(index);
  const y = 2 + (index % 5) * 3;
  const rotation = side === -1 ? 192 : -12;
  const startX = side * 126;
  const endX = side * (238 + (index % 4) * 9);
  const transform = (x, scaleX) => `translate(${x}px, ${y}px) rotate(${rotation}deg) scaleX(${scaleX})`;
  return [
    { opacity: 0, transform: transform(startX, .12), offset: 0 },
    { opacity: 0, transform: transform(startX, .12), offset: shot },
    { opacity: 1, transform: transform(side * 144, .72), offset: round(shot + .004) },
    { opacity: .88, transform: transform(side * 202, 1), offset: round(shot + .023) },
    { opacity: 0, transform: transform(endX, .64), offset: round(shot + .045) },
    { opacity: 0, transform: transform(endX, .64), offset: 1 },
  ];
}
