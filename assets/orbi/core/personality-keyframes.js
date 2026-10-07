export const CONFETTI_VECTORS = Object.freeze([
  [-142, -112, 24], [-112, -154, 38], [-82, -126, 52], [-54, -170, 68],
  [-26, -138, 81], [12, -178, 96], [42, -132, 113], [72, -164, 129],
  [103, -124, 146], [136, -151, 164], [158, -96, 181], [-158, -82, 199],
  [-126, -62, 218], [-94, -94, 235], [-60, -72, 253], [-21, -104, 271],
  [28, -78, 288], [64, -108, 306], [97, -70, 323], [127, -96, 341],
  [151, -55, 359], [8, -128, 377], [-170, -118, 394], [-138, -176, 411],
  [-38, -172, 428], [54, -174, 445], [118, -168, 462], [170, -114, 479],
]);

const neutralBody = "translateX(0px) translateY(0px) scale(1, 1) rotate(0deg)";
const hiddenMouth = { opacity: 0, transform: "scale(.72)", offset: 0 };

export function createThinkingFrames() {
  return {
    body: [
      { transform: neutralBody, offset: 0 },
      { transform: "translateX(-2px) translateY(1px) scale(1.015, .985) rotate(-2deg)", offset: .14 },
      { transform: "translateX(2px) translateY(-2px) scale(.995, 1.012) rotate(3.6deg)", offset: .28, easing: "cubic-bezier(.16,.8,.24,1)" },
      { transform: "translateX(2px) translateY(-2px) scale(.995, 1.012) rotate(3.6deg)", offset: .70 },
      { transform: "translateX(-1px) translateY(0) scale(1.006, .996) rotate(-1deg)", offset: .86 },
      { transform: neutralBody, offset: 1 },
    ],
    eyes: [
      { transform: "translate(0px, 0px) scale(1, 1)", offset: 0 },
      { transform: "translate(2px, -2px) scale(1, .96)", offset: .18 },
      { transform: "translate(5px, -4px) scale(1, .94)", offset: .31, easing: "cubic-bezier(.16,.8,.25,1)" },
      { transform: "translate(5px, -4px) scale(1, .94)", offset: .72 },
      { transform: "translate(0px, 0px) scale(1, 1)", offset: .90 },
      { transform: "translate(0px, 0px) scale(1, 1)", offset: 1 },
    ],
    brows: [
      { opacity: 0, transform: "translateY(2px)", offset: 0 },
      { opacity: 1, transform: "translateY(0)", offset: .18 },
      { opacity: 1, transform: "translateY(0)", offset: .76 },
      { opacity: 0, transform: "translateY(1px)", offset: .90 },
      { opacity: 0, transform: "translateY(1px)", offset: 1 },
    ],
    browLeft: [
      { transform: "translateY(0) rotate(0deg)", offset: 0 },
      { transform: "translateY(1px) rotate(-5deg)", offset: .24 },
      { transform: "translateY(1px) rotate(-5deg)", offset: .76 },
      { transform: "translateY(0) rotate(0deg)", offset: 1 },
    ],
    browRight: [
      { transform: "translateY(0) rotate(0deg)", offset: 0 },
      { transform: "translateY(-4px) rotate(8deg)", offset: .24, easing: "cubic-bezier(.16,.8,.25,1)" },
      { transform: "translateY(-4px) rotate(8deg)", offset: .76 },
      { transform: "translateY(0) rotate(0deg)", offset: 1 },
    ],
    mouth: [
      hiddenMouth,
      { opacity: 1, transform: "scale(.92)", offset: .22 },
      { opacity: 1, transform: "scale(.92)", offset: .76 },
      { opacity: 0, transform: "scale(.72)", offset: .90 },
      { opacity: 0, transform: "scale(.72)", offset: 1 },
    ],
    thoughtBubble: [
      { opacity: 0, transform: "translateY(8px) scale(.68)", offset: 0 },
      { opacity: 0, transform: "translateY(8px) scale(.68)", offset: .20 },
      { opacity: 1, transform: "translateY(0) scale(1.04)", offset: .34, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "translateY(0) scale(1)", offset: .76 },
      { opacity: 0, transform: "translateY(-6px) scale(.90)", offset: .90 },
      { opacity: 0, transform: "translateY(-6px) scale(.90)", offset: 1 },
    ],
  };
}

export function createThoughtDotFrames(index) {
  const enter = .31 + index * .075;
  const pulse = enter + .09;
  return [
    { opacity: 0, transform: "translateY(2px) scale(.3)", offset: 0 },
    { opacity: 0, transform: "translateY(2px) scale(.3)", offset: enter },
    { opacity: 1, transform: "translateY(-1px) scale(1.18)", offset: pulse, easing: "cubic-bezier(.16,1,.3,1)" },
    { opacity: .74, transform: "translateY(0) scale(1)", offset: .74 },
    { opacity: 0, transform: "translateY(-3px) scale(.5)", offset: .89 },
    { opacity: 0, transform: "translateY(-3px) scale(.5)", offset: 1 },
  ];
}

export function createHeadShakeFrames() {
  return {
    body: [
      { transform: neutralBody, offset: 0 },
      { transform: "translateX(-10px) translateY(0) scale(1.02, .99) rotate(-6deg)", offset: .12 },
      { transform: "translateX(12px) translateY(-1px) scale(.99, 1.01) rotate(7deg)", offset: .25 },
      { transform: "translateX(-11px) translateY(0) scale(1.015, .99) rotate(-6.5deg)", offset: .38 },
      { transform: "translateX(9px) translateY(-1px) scale(.995, 1.006) rotate(5deg)", offset: .51 },
      { transform: "translateX(-6px) translateY(0) scale(1.008, .996) rotate(-3.5deg)", offset: .64 },
      { transform: "translateX(4px) translateY(0) scale(1, 1) rotate(2deg)", offset: .77 },
      { transform: neutralBody, offset: 1, easing: "cubic-bezier(.16,1,.3,1)" },
    ],
    eyes: [
      { transform: "translateX(0px) scale(1, 1)", offset: 0 },
      { transform: "translateX(2px) scale(1, .82)", offset: .12 },
      { transform: "translateX(-2px) scale(1, .82)", offset: .25 },
      { transform: "translateX(2px) scale(1, .82)", offset: .38 },
      { transform: "translateX(-1px) scale(1, .88)", offset: .64 },
      { transform: "translateX(0px) scale(1, 1)", offset: 1 },
    ],
    mouth: [
      hiddenMouth,
      { opacity: 1, transform: "scale(1)", offset: .10 },
      { opacity: 1, transform: "scale(1.08, .9)", offset: .78 },
      { opacity: 0, transform: "scale(.72)", offset: .92 },
      { opacity: 0, transform: "scale(.72)", offset: 1 },
    ],
    shadow: [
      { transform: "translateX(0px) scaleX(1)", opacity: .28, offset: 0 },
      { transform: "translateX(-5px) scaleX(1.05)", opacity: .30, offset: .12 },
      { transform: "translateX(6px) scaleX(.96)", opacity: .27, offset: .25 },
      { transform: "translateX(-5px) scaleX(1.04)", opacity: .29, offset: .38 },
      { transform: "translateX(4px) scaleX(.98)", opacity: .27, offset: .51 },
      { transform: "translateX(0px) scaleX(1)", opacity: .28, offset: 1 },
    ],
  };
}

export function createDisappointedFrames() {
  return {
    body: [
      { transform: neutralBody, offset: 0 },
      { transform: "translateX(0) translateY(-2px) scale(.99, 1.02) rotate(0deg)", offset: .12 },
      { transform: "translateX(0) translateY(7px) scale(1.04, .95) rotate(-1deg)", offset: .30, easing: "cubic-bezier(.45,0,.8,.5)" },
      { transform: "translateX(0) translateY(9px) scale(1.015, .985) rotate(-2deg)", offset: .48 },
      { transform: "translateX(0) translateY(9px) scale(1.015, .985) rotate(-2deg)", offset: .76 },
      { transform: "translateX(0) translateY(3px) scale(.995, 1.01) rotate(.5deg)", offset: .90 },
      { transform: neutralBody, offset: 1 },
    ],
    eyes: [
      { transform: "translate(0px, 0px) scale(1, 1)", offset: 0 },
      { transform: "translate(0px, 3px) scale(1, .72)", offset: .27 },
      { transform: "translate(-1px, 4px) scale(1, .66)", offset: .48 },
      { transform: "translate(-1px, 4px) scale(1, .66)", offset: .78 },
      { transform: "translate(0px, 0px) scale(1, 1)", offset: 1 },
    ],
    brows: [
      { opacity: 0, transform: "translateY(1px)", offset: 0 },
      { opacity: 1, transform: "translateY(1px)", offset: .23 },
      { opacity: 1, transform: "translateY(2px)", offset: .79 },
      { opacity: 0, transform: "translateY(1px)", offset: .94 },
      { opacity: 0, transform: "translateY(1px)", offset: 1 },
    ],
    browLeft: [
      { transform: "rotate(0deg)", offset: 0 },
      { transform: "rotate(11deg)", offset: .28 },
      { transform: "rotate(11deg)", offset: .80 },
      { transform: "rotate(0deg)", offset: 1 },
    ],
    browRight: [
      { transform: "rotate(0deg)", offset: 0 },
      { transform: "rotate(-11deg)", offset: .28 },
      { transform: "rotate(-11deg)", offset: .80 },
      { transform: "rotate(0deg)", offset: 1 },
    ],
    mouth: [
      hiddenMouth,
      { opacity: 1, transform: "translateY(1px) scale(.96)", offset: .26 },
      { opacity: 1, transform: "translateY(2px) scale(1.04)", offset: .78 },
      { opacity: 0, transform: "translateY(0) scale(.72)", offset: .94 },
      { opacity: 0, transform: "translateY(0) scale(.72)", offset: 1 },
    ],
    glow: [
      { opacity: .48, offset: 0 },
      { opacity: .34, offset: .32 },
      { opacity: .32, offset: .76 },
      { opacity: .48, offset: 1 },
    ],
  };
}

export function createCelebrationFrames() {
  return {
    body: [
      { transform: neutralBody, offset: 0 },
      { transform: "translateX(0) translateY(4px) scale(1.10, .90) rotate(0deg)", offset: .055 },
      { transform: "translateX(-8px) translateY(-42px) scale(.94, 1.08) rotate(-5deg)", offset: .153, easing: "cubic-bezier(.14,.72,.24,1)" },
      { transform: "translateX(-3px) translateY(3px) scale(1.15, .84) rotate(-1deg)", offset: .26 },
      { transform: "translateX(9px) translateY(-30px) scale(.96, 1.06) rotate(6deg)", offset: .359, easing: "cubic-bezier(.14,.72,.24,1)" },
      { transform: "translateX(3px) translateY(3px) scale(1.13, .86) rotate(1deg)", offset: .459 },
      { transform: "translateX(-8px) translateY(-7px) scale(1.03, .98) rotate(-5deg)", offset: .535 },
      { transform: "translateX(8px) translateY(-5px) scale(.99, 1.02) rotate(5deg)", offset: .604 },
      { transform: "translateX(-3px) translateY(-2px) scale(1.01, .995) rotate(-2deg)", offset: .67 },
      { transform: "translateX(0) translateY(4px) scale(1.10, .90) rotate(0deg)", offset: .73 },
      { transform: "translateX(-7px) translateY(-18px) scale(.97, 1.05) rotate(-4deg)", offset: .79, easing: "cubic-bezier(.14,.72,.24,1)" },
      { transform: "translateX(-2px) translateY(3px) scale(1.12, .87) rotate(-1deg)", offset: .84 },
      { transform: "translateX(7px) translateY(-13px) scale(.98, 1.04) rotate(4deg)", offset: .89, easing: "cubic-bezier(.14,.72,.24,1)" },
      { transform: "translateX(2px) translateY(2px) scale(1.08, .91) rotate(1deg)", offset: .94 },
      { transform: neutralBody, offset: 1 },
    ],
    shadow: [
      { transform: "translateX(0) scaleX(1)", opacity: .28, offset: 0 },
      { transform: "translateX(0) scaleX(1.14)", opacity: .36, offset: .055 },
      { transform: "translateX(-5px) scaleX(.48)", opacity: .10, offset: .153 },
      { transform: "translateX(-2px) scaleX(1.22)", opacity: .40, offset: .26 },
      { transform: "translateX(6px) scaleX(.58)", opacity: .12, offset: .359 },
      { transform: "translateX(2px) scaleX(1.18)", opacity: .38, offset: .459 },
      { transform: "translateX(0) scaleX(1)", opacity: .28, offset: .67 },
      { transform: "translateX(0) scaleX(1.14)", opacity: .36, offset: .73 },
      { transform: "translateX(-4px) scaleX(.65)", opacity: .14, offset: .79 },
      { transform: "translateX(-1px) scaleX(1.18)", opacity: .38, offset: .84 },
      { transform: "translateX(4px) scaleX(.72)", opacity: .16, offset: .89 },
      { transform: "translateX(1px) scaleX(1.12)", opacity: .36, offset: .94 },
      { transform: "translateX(0) scaleX(1)", opacity: .28, offset: 1 },
    ],
    mouth: [
      hiddenMouth,
      { opacity: 1, transform: "translateY(0) scale(1.04)", offset: .10 },
      { opacity: 1, transform: "translateY(1px) scale(1.08)", offset: .90 },
      { opacity: 0, transform: "translateY(0) scale(.72)", offset: .98 },
      { opacity: 0, transform: "translateY(0) scale(.72)", offset: 1 },
    ],
    glow: [
      { opacity: .48, offset: 0 },
      { opacity: .82, offset: .15 },
      { opacity: .72, offset: .90 },
      { opacity: .48, offset: 1 },
    ],
  };
}

export function createConfettiFrames(index) {
  const [x, lift, rotation] = CONFETTI_VECTORS[index];
  const delay = (index % 7) * .004 + Math.floor(index / 7) * .003;
  const glideDirection = index % 2 ? 1 : -1;
  const sway = 14 + (index % 4) * 4;
  const lateFall = 18 + (index % 5) * 8;
  const exitFall = 72 + (index % 5) * 10;
  return [
    { opacity: 0, transform: "translate(0px, 0px) rotate(0deg) scale(.45)", offset: 0 },
    { opacity: 0, transform: "translate(0px, 0px) rotate(0deg) scale(.45)", offset: .07 + delay },
    { opacity: 1, transform: `translate(${x * .22}px, ${lift * .45}px) rotate(${rotation * .30}deg) scale(1.04)`, offset: .12 + delay, easing: "cubic-bezier(.12,.72,.22,1)" },
    { opacity: 1, transform: `translate(${x * .72}px, ${lift}px) rotate(${rotation}deg) scale(.96)`, offset: .22 + delay, easing: "cubic-bezier(.12,.02,.28,1)" },
    { opacity: .98, transform: `translate(${x * .84 + sway * glideDirection}px, ${lift * .78}px) rotate(${rotation + 95 * glideDirection}deg) scale(.92)`, offset: .38 + delay, easing: "cubic-bezier(.25,.1,.25,1)" },
    { opacity: .94, transform: `translate(${x * .96 - sway * .75 * glideDirection}px, ${lift * .34}px) rotate(${rotation - 130 * glideDirection}deg) scale(.86)`, offset: .56 + delay, easing: "cubic-bezier(.25,.1,.25,1)" },
    { opacity: .82, transform: `translate(${x * 1.04 + sway * .55 * glideDirection}px, ${lateFall}px) rotate(${rotation + 220 * glideDirection}deg) scale(.78)`, offset: .72, easing: "cubic-bezier(.25,.1,.25,1)" },
    { opacity: 0, transform: `translate(${x * 1.10 - sway * .25 * glideDirection}px, ${exitFall}px) rotate(${rotation - 300 * glideDirection}deg) scale(.70)`, offset: .87, easing: "cubic-bezier(.3,.1,.55,1)" },
    { opacity: 0, transform: `translate(${x * 1.10 - sway * .25 * glideDirection}px, ${exitFall}px) rotate(${rotation - 300 * glideDirection}deg) scale(.70)`, offset: 1 },
  ];
}

export function createIdleWhistleFrames() {
  return {
    body: [
      { transform: neutralBody, offset: 0 },
      { transform: "translateX(-3px) translateY(-1px) scale(1.005, 1) rotate(-2deg)", offset: .18 },
      { transform: "translateX(3px) translateY(-2px) scale(.998, 1.006) rotate(2deg)", offset: .42 },
      { transform: "translateX(-2px) translateY(-1px) scale(1.004, .999) rotate(-1.4deg)", offset: .66 },
      { transform: "translateX(2px) translateY(-2px) scale(1, 1.004) rotate(1.2deg)", offset: .82 },
      { transform: neutralBody, offset: 1 },
    ],
    eyes: [
      { transform: "translate(0px, 0px) scale(1, 1)", offset: 0 },
      { transform: "translate(2px, -5px) scale(1, .92)", offset: .16 },
      { transform: "translate(-2px, -5px) scale(1, .92)", offset: .40 },
      { transform: "translate(3px, -4px) scale(1, .94)", offset: .64 },
      { transform: "translate(0px, -5px) scale(1, .92)", offset: .82 },
      { transform: "translate(0px, 0px) scale(1, 1)", offset: 1 },
    ],
    mouth: [
      hiddenMouth,
      { opacity: 0, transform: "translateX(0) scale(.72)", offset: 1 },
    ],
    mouthClosed: [
      { opacity: 0, transform: "translateX(3px) scale(.82)", offset: 0 },
      { opacity: 1, transform: "translateX(0px) scale(.82)", offset: .04, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "translateX(0px) scale(1.03)", offset: .07, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "translateX(0px) scale(1.32)", offset: .10, easing: "cubic-bezier(.4,0,.6,1)" },
      { opacity: 1, transform: "translateX(4px) scale(1.06)", offset: .13, easing: "cubic-bezier(.2,.8,.2,1)" },
      { opacity: 1, transform: "translateX(9px) scale(.80)", offset: .16, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "translateX(10px) scale(.88)", offset: .26 },
      { opacity: 1, transform: "translateX(9px) scale(.78)", offset: .36 },
      { opacity: 1, transform: "translateX(10px) scale(.86)", offset: .44 },
      { opacity: 0, transform: "translateX(10px) scale(.82)", offset: .47 },
      { opacity: 0, transform: "translateX(0px) scale(.82)", offset: .49 },
      { opacity: 1, transform: "translateX(0px) scale(.82)", offset: .50, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "translateX(0px) scale(1.03)", offset: .53, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "translateX(0px) scale(1.32)", offset: .56, easing: "cubic-bezier(.4,0,.6,1)" },
      { opacity: 1, transform: "translateX(4px) scale(1.06)", offset: .59, easing: "cubic-bezier(.2,.8,.2,1)" },
      { opacity: 1, transform: "translateX(9px) scale(.80)", offset: .62, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "translateX(10px) scale(.88)", offset: .70 },
      { opacity: 1, transform: "translateX(9px) scale(.78)", offset: .80 },
      { opacity: 1, transform: "translateX(10px) scale(.88)", offset: .90 },
      { opacity: 0, transform: "translateX(10px) scale(.82)", offset: .94 },
      { opacity: 0, transform: "translateX(0) scale(.82)", offset: 1 },
    ],
  };
}

export function createWhistleNoteFrames(index) {
  const direction = index % 2 ? 1 : -1;
  const releaseX = 14 + index * 3;
  const riseX = 34 + index * 8;
  const upperX = 48 + index * 18 + direction * 2;
  const outsideX = 60 + index * 26 + direction * 3;
  const exitX = 74 + index * 32 + direction * 4;
  const burst = (enter, drift = 0, compact = false) => {
    const riseOffset = compact ? .05 : .08;
    const upperOffset = compact ? .08 : .16;
    const outsideOffset = compact ? .11 : .26;
    const exitOffset = compact ? .14 : .39;
    return [
    { opacity: 0, transform: `translate(${drift}px, 0px) rotate(0deg) scale(.55)`, offset: enter },
    { opacity: 1, transform: `translate(${releaseX + drift}px, -3px) rotate(${direction * 3}deg) scale(.72)`, offset: enter + .03, easing: "cubic-bezier(.16,1,.3,1)" },
    { opacity: 1, transform: `translate(${riseX + drift}px, -40px) rotate(${direction * 8}deg) scale(1.05)`, offset: enter + riseOffset, easing: "cubic-bezier(.22,.72,.28,1)" },
    { opacity: 1, transform: `translate(${upperX + drift}px, -92px) rotate(${direction * 13}deg) scale(1.40)`, offset: enter + upperOffset },
    { opacity: .86, transform: `translate(${outsideX + drift}px, -148px) rotate(${direction * 17}deg) scale(1.80)`, offset: enter + outsideOffset },
    { opacity: 0, transform: `translate(${exitX + drift}px, -205px) rotate(${direction * 22}deg) scale(2.15)`, offset: Math.min(.98, enter + exitOffset) },
    ];
  };
  const firstEnter = .18 + index * .05;
  const secondEnter = .64 + index * .045;
  return [
    { opacity: 0, transform: "translate(0px, 0px) rotate(0deg) scale(.55)", offset: 0 },
    ...burst(firstEnter),
    ...burst(secondEnter, 4, true),
    { opacity: 0, transform: `translate(${exitX + 4}px, -205px) rotate(${direction * 22}deg) scale(2.15)`, offset: 1 },
  ];
}

export function createSleepFrames() {
  return {
    body: [
      { transform: neutralBody, offset: 0 },
      { transform: "translateX(0px) translateY(1px) scale(1.008, .992) rotate(-.4deg)", offset: .08 },
      { transform: "translateX(0px) translateY(3px) scale(1.026, .976) rotate(-1.4deg)", offset: .15, easing: "cubic-bezier(.4,0,.6,1)" },
      { transform: "translateX(0px) translateY(-1px) scale(.994, 1.018) rotate(-1deg)", offset: .28, easing: "cubic-bezier(.37,0,.63,1)" },
      { transform: "translateX(0px) translateY(3px) scale(1.024, .978) rotate(-1.4deg)", offset: .41 },
      { transform: "translateX(0px) translateY(-1px) scale(.995, 1.017) rotate(-1deg)", offset: .54 },
      { transform: "translateX(0px) translateY(3px) scale(1.023, .979) rotate(-1.35deg)", offset: .67 },
      { transform: "translateX(0px) translateY(-1px) scale(.996, 1.016) rotate(-.9deg)", offset: .80 },
      { transform: "translateX(0px) translateY(2px) scale(1.015, .985) rotate(-.8deg)", offset: .90 },
      { transform: "translateX(0px) translateY(0px) scale(1.004, .997) rotate(-.2deg)", offset: .96 },
      { transform: neutralBody, offset: 1 },
    ],
    shadow: [
      { transform: "translateX(0px) scaleX(1)", opacity: .28, offset: 0 },
      { transform: "translateX(0px) scaleX(1.04)", opacity: .30, offset: .15 },
      { transform: "translateX(0px) scaleX(.95)", opacity: .25, offset: .28 },
      { transform: "translateX(0px) scaleX(1.035)", opacity: .30, offset: .41 },
      { transform: "translateX(0px) scaleX(.96)", opacity: .25, offset: .54 },
      { transform: "translateX(0px) scaleX(1.03)", opacity: .29, offset: .67 },
      { transform: "translateX(0px) scaleX(.97)", opacity: .25, offset: .80 },
      { transform: "translateX(0px) scaleX(1.02)", opacity: .29, offset: .90 },
      { transform: "translateX(0px) scaleX(1)", opacity: .28, offset: 1 },
    ],
    eyes: [
      { transform: "translate(0px, 0px)", offset: 0 },
      { transform: "translate(0px, 1px)", offset: .12 },
      { transform: "translate(0px, 1px)", offset: .91 },
      { transform: "translate(0px, 0px)", offset: 1 },
    ],
    openEyes: [
      { opacity: 1, transform: "scale(1, 1)", offset: 0 },
      { opacity: .72, transform: "scale(1, .80)", offset: .05 },
      { opacity: .20, transform: "scale(1, .35)", offset: .10 },
      { opacity: 0, transform: "scale(1, .20)", offset: .14 },
      { opacity: 0, transform: "scale(1, .20)", offset: .91 },
      { opacity: .28, transform: "scale(1, .45)", offset: .94 },
      { opacity: 1, transform: "scale(1, 1.04)", offset: .98, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "scale(1, 1)", offset: 1 },
    ],
    sleepEyes: [
      { opacity: 0, transform: "translateY(1px) scale(.86, .50)", offset: 0 },
      { opacity: 0, transform: "translateY(1px) scale(.86, .50)", offset: .06 },
      { opacity: .75, transform: "translateY(0px) scale(.98, .90)", offset: .10 },
      { opacity: 1, transform: "translateY(0px) scale(1, 1)", offset: .14, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "translateY(1px) scale(1.02, .96)", offset: .41 },
      { opacity: 1, transform: "translateY(0px) scale(.99, 1.02)", offset: .54 },
      { opacity: 1, transform: "translateY(1px) scale(1.02, .96)", offset: .67 },
      { opacity: 1, transform: "translateY(0px) scale(.99, 1.02)", offset: .80 },
      { opacity: 1, transform: "translateY(0px) scale(1, 1)", offset: .91 },
      { opacity: .60, transform: "translateY(1px) scale(.98, .82)", offset: .94 },
      { opacity: 0, transform: "translateY(1px) scale(.88, .54)", offset: .98 },
      { opacity: 0, transform: "translateY(1px) scale(.88, .54)", offset: 1 },
    ],
    mouth: [
      { opacity: 0, transform: "translateX(0px) scale(.64)", offset: 0 },
      { opacity: 0, transform: "translateX(0px) scale(.64)", offset: .12 },
      { opacity: .72, transform: "translateX(1px) scale(.68)", offset: .17 },
      { opacity: .86, transform: "translateX(1px) scale(.84)", offset: .28 },
      { opacity: .76, transform: "translateX(1px) scale(.72)", offset: .41 },
      { opacity: .86, transform: "translateX(1px) scale(.84)", offset: .54 },
      { opacity: .76, transform: "translateX(1px) scale(.72)", offset: .67 },
      { opacity: .86, transform: "translateX(1px) scale(.84)", offset: .80 },
      { opacity: .80, transform: "translateX(1px) scale(.76)", offset: .90 },
      { opacity: .46, transform: "translateX(0px) scale(.68)", offset: .94 },
      { opacity: 0, transform: "translateX(0px) scale(.62)", offset: .98 },
      { opacity: 0, transform: "translateX(0px) scale(.62)", offset: 1 },
    ],
    glow: [
      { opacity: .48, offset: 0 },
      { opacity: .38, offset: .15 },
      { opacity: .42, offset: .28 },
      { opacity: .36, offset: .41 },
      { opacity: .42, offset: .54 },
      { opacity: .36, offset: .67 },
      { opacity: .42, offset: .80 },
      { opacity: .39, offset: .91 },
      { opacity: .48, offset: 1 },
    ],
  };
}

export function createSleepZFrames(index) {
  const enter = .17 + index * .115;
  const rise = enter + .08;
  const drift = enter + .23;
  const high = Math.min(.94, enter + .38);
  const exit = Math.min(.985, enter + .52);
  const sway = index % 2 ? 1 : -1;
  const releaseX = 12 + index * 2;
  const driftX = 36 + index * 8 + sway * 2;
  const highX = 62 + index * 14 - sway * 2;
  const exitX = 82 + index * 18 + sway * 3;
  const releaseY = -4 - index;
  const driftY = -42 - index * 5;
  const highY = -88 - index * 8;
  const exitY = -136 - index * 10;
  return [
    { opacity: 0, transform: "translate(0px, 0px) rotate(0deg) scale(.48)", offset: 0 },
    { opacity: 0, transform: "translate(0px, 0px) rotate(0deg) scale(.48)", offset: enter },
    { opacity: .82, transform: `translate(${releaseX}px, ${releaseY}px) rotate(${sway * -2}deg) scale(.62)`, offset: enter + .025, easing: "cubic-bezier(.16,1,.3,1)" },
    { opacity: 1, transform: `translate(${driftX}px, ${driftY}px) rotate(${sway * 3}deg) scale(.90)`, offset: rise, easing: "cubic-bezier(.22,.72,.28,1)" },
    { opacity: .98, transform: `translate(${highX}px, ${highY}px) rotate(${sway * 6}deg) scale(1.22)`, offset: drift },
    { opacity: .72, transform: `translate(${exitX - 16}px, ${exitY + 34}px) rotate(${sway * 9}deg) scale(1.46)`, offset: high },
    { opacity: 0, transform: `translate(${exitX}px, ${exitY}px) rotate(${sway * 12}deg) scale(1.68)`, offset: exit },
    { opacity: 0, transform: `translate(${exitX}px, ${exitY}px) rotate(${sway * 12}deg) scale(1.68)`, offset: 1 },
  ];
}

export function createTryMeBubbleFrames() {
  return [
    { opacity: 0, transform: "translateY(18px)", offset: 0 },
    { opacity: 0, transform: "translateY(18px)", offset: .05 },
    { opacity: .52, transform: "translateY(9px)", offset: .10, easing: "cubic-bezier(.16,1,.3,1)" },
    { opacity: 1, transform: "translateY(0px)", offset: .15, easing: "cubic-bezier(.16,1,.3,1)" },
    { opacity: 1, transform: "translateY(0px)", offset: .62 },
    { opacity: .92, transform: "translateY(-5px)", offset: .74, easing: "cubic-bezier(.4,0,.6,1)" },
    { opacity: .48, transform: "translateY(-16px)", offset: .87 },
    { opacity: 0, transform: "translateY(-32px)", offset: 1, easing: "cubic-bezier(.2,0,.4,1)" },
  ];
}
