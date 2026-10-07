export const WIDGET_HIDDEN_X = 224;
export const WIDGET_REVEALED_X = -160;
export const WIDGET_REVEAL_DURATION = 1180;
export const WIDGET_RETURN_DURATION = 1050;

/**
 * FINE-TUNING-PLATZHALTER FÜR DIE SPÄTERE PORTAL-INTEGRATION
 *
 * Alle Werte sind Millisekunden. Für unregelmäßigere oder ruhigere Peeks muss
 * später ausschließlich dieser Zeitplan verändert werden; die Keyframes und
 * die `quiz-correct`-Eventlogik bleiben dabei unangetastet.
 *
 * - hiddenBefore: unsichtbare Wartezeit vor dem nächsten Hervorschauen
 * - anticipation: kurzes Schwungholen hinter dem Widget
 * - enter: Bewegung bis zur sichtbaren Peek-Pose
 * - visible: Dauer, in der Orbi an der Kante beobachtet
 * - leave: Rückzug hinter das Widget
 * - hiddenAfter: zusätzliche Ruhezeit am Zyklusende
 */
export const WIDGET_PEEK_TIMING = Object.freeze([
  Object.freeze({ hiddenBefore: 1300, anticipation: 260, enter: 340, visible: 1300, leave: 450, hiddenAfter: 680, x: 64, y: -2, lean: -2.2 }),
  Object.freeze({ hiddenBefore: 4800, anticipation: 280, enter: 360, visible: 950, leave: 440, hiddenAfter: 900, x: 74, y: 3, lean: -1.2 }),
  Object.freeze({ hiddenBefore: 2400, anticipation: 240, enter: 330, visible: 1700, leave: 480, hiddenAfter: 1200, x: 58, y: -5, lean: -2.8 }),
  Object.freeze({ hiddenBefore: 6900, anticipation: 300, enter: 390, visible: 1100, leave: 420, hiddenAfter: 700, x: 69, y: 1, lean: -1.7 }),
  Object.freeze({ hiddenBefore: 750, anticipation: 250, enter: 330, visible: 900, leave: 400, hiddenAfter: 500, x: 55, y: -4, lean: -3.1 }),
]);

const transform = (x, y = 0, rotate = 0, scaleX = 1, scaleY = 1) =>
  `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`;

export function createWidgetPanelEntranceFrames() {
  return [
    { opacity: 0, transform: "translateX(26px) scale(.97)", offset: 0 },
    { opacity: 1, transform: "translateX(0) scale(1)", offset: .72, easing: "cubic-bezier(.16,1,.3,1)" },
    { opacity: 1, transform: "translateX(0) scale(1)", offset: 1 },
  ];
}

export function createWidgetHideFrames() {
  return [
    { transform: transform(0), offset: 0 },
    { transform: transform(20, 2, .4, 1.03, .97), offset: .16, easing: "cubic-bezier(.55,0,.8,.45)" },
    { transform: transform(146, -4, 1.2, .98, 1.02), offset: .52, easing: "cubic-bezier(.2,.7,.25,1)" },
    { transform: transform(WIDGET_HIDDEN_X, 4, .8, .98, 1.02), offset: .84, easing: "cubic-bezier(.16,1,.3,1)" },
    { transform: transform(WIDGET_HIDDEN_X, 4, .8, .98, 1.02), offset: 1 },
  ];
}

export function createWidgetPeekFrames(cycleIndex = 0) {
  const variant = WIDGET_PEEK_TIMING[Math.abs(cycleIndex) % WIDGET_PEEK_TIMING.length];
  const duration = variant.hiddenBefore
    + variant.anticipation
    + variant.enter
    + variant.visible
    + variant.leave
    + variant.hiddenAfter;
  const at = (milliseconds) => milliseconds / duration;
  const waitEnd = variant.hiddenBefore;
  const anticipationEnd = waitEnd + variant.anticipation;
  const enterSettle = anticipationEnd + variant.enter * .68;
  const enterEnd = anticipationEnd + variant.enter;
  const visibleMid = enterEnd + variant.visible * .46;
  const visibleEnd = enterEnd + variant.visible;
  const leaveMid = visibleEnd + variant.leave * .46;
  const leaveEnd = visibleEnd + variant.leave;
  const blinkClose = enterEnd + variant.visible * .48;
  const blinkOpen = enterEnd + variant.visible * .54;
  const hidden = transform(WIDGET_HIDDEN_X, 4, .8, .98, 1.02);
  const peek = transform(variant.x, variant.y, variant.lean, 1, 1);
  return {
    duration,
    timing: variant,
    root: [
      { transform: hidden, offset: 0 },
      { transform: hidden, offset: at(waitEnd) },
      { transform: transform(WIDGET_HIDDEN_X + 8, 6, 1.3, .95, 1.05), offset: at(anticipationEnd), easing: "cubic-bezier(.55,0,.8,.45)" },
      { transform: transform(variant.x + 14, variant.y + 1, variant.lean - .8, .98, 1.02), offset: at(enterSettle), easing: "cubic-bezier(.16,1,.3,1)" },
      { transform: peek, offset: at(enterEnd), easing: "cubic-bezier(.16,1,.3,1)" },
      { transform: transform(variant.x - 3, variant.y - 2, variant.lean - .4, 1.01, .995), offset: at(visibleMid) },
      { transform: peek, offset: at(visibleEnd) },
      { transform: transform(variant.x + 38, variant.y + 1, variant.lean + .8, .98, 1.02), offset: at(leaveMid), easing: "cubic-bezier(.55,0,.8,.45)" },
      { transform: hidden, offset: at(leaveEnd), easing: "cubic-bezier(.2,.7,.25,1)" },
      { transform: hidden, offset: 1 },
    ],
    eyes: [
      { transform: "translateX(0)", offset: 0 },
      { transform: "translateX(0)", offset: at(enterSettle) },
      { transform: "translateX(-4px)", offset: at(enterEnd + variant.visible * .12), easing: "cubic-bezier(.16,1,.3,1)" },
      { transform: "translateX(-1px)", offset: at(enterEnd + variant.visible * .38) },
      { transform: "translateX(3px)", offset: at(enterEnd + variant.visible * .64), easing: "cubic-bezier(.4,0,.2,1)" },
      { transform: "translateX(-2px)", offset: at(enterEnd + variant.visible * .82) },
      { transform: "translateX(0)", offset: at(leaveMid) },
      { transform: "translateX(0)", offset: 1 },
    ],
    blink: [
      { transform: "scaleY(1)", offset: 0 },
      { transform: "scaleY(1)", offset: at(blinkClose - 45) },
      { transform: "scaleY(.06)", offset: at(blinkClose) },
      { transform: "scaleY(1)", offset: at(blinkOpen) },
      { transform: "scaleY(1)", offset: 1 },
    ],
  };
}

export function createWidgetRevealFrames(fromTransform) {
  const hidden = transform(WIDGET_HIDDEN_X, 4, .8, .98, 1.02);
  const revealed = transform(WIDGET_REVEALED_X);
  return {
    root: [
      { transform: fromTransform || hidden, offset: 0 },
      { transform: transform(WIDGET_HIDDEN_X + 10, 5, 1.4, .95, 1.05), offset: .12, easing: "cubic-bezier(.55,0,.8,.45)" },
      { transform: transform(62, 0, -2.4, .98, 1.02), offset: .38, easing: "cubic-bezier(.12,.7,.2,1)" },
      { transform: transform(WIDGET_REVEALED_X - 7, 0, -.8, 1.01, .99), offset: .66, easing: "cubic-bezier(.18,.75,.24,1)" },
      { transform: transform(WIDGET_REVEALED_X + 5, 0, .45, .995, 1.005), offset: .84, easing: "cubic-bezier(.16,1,.3,1)" },
      { transform: revealed, offset: 1 },
    ],
    actor: [
      { transform: "translateY(0) scale(1)", offset: 0 },
      { transform: "translateY(12px) scale(1.08, .86)", offset: .12, easing: "cubic-bezier(.55,0,.8,.45)" },
      { transform: "translateY(-76px) scale(.91, 1.11)", offset: .29, easing: "cubic-bezier(.12,.72,.2,1)" },
      { transform: "translateY(-114px) scale(.97, 1.04)", offset: .46, easing: "cubic-bezier(.22,.62,.35,1)" },
      { transform: "translateY(-109px) scale(1)", offset: .56 },
      { transform: "translateY(-30px) scale(1.02, .98)", offset: .75, easing: "cubic-bezier(.45,0,.9,.55)" },
      { transform: "translateY(9px) scale(1.13, .83)", offset: .84, easing: "cubic-bezier(.15,.75,.25,1)" },
      { transform: "translateY(-8px) scale(.98, 1.03)", offset: .93 },
      { transform: "translateY(0) scale(1)", offset: 1 },
    ],
    shadow: [
      { opacity: .26, transform: "scale(1)", offset: 0 },
      { opacity: .34, transform: "scale(1.12, .86)", offset: .12 },
      { opacity: .11, transform: "scale(.62)", offset: .29 },
      { opacity: .06, transform: "scale(.40)", offset: .50 },
      { opacity: .13, transform: "scale(.66)", offset: .70 },
      { opacity: .38, transform: "scale(1.18, .78)", offset: .84 },
      { opacity: .28, transform: "scale(1)", offset: 1 },
    ],
    eyes: [
      { transform: "translateX(-2px) scale(1)", offset: 0 },
      { transform: "translateX(-2px) scale(1)", offset: .34 },
      { transform: "translateX(0) scale(1.12, 1.08)", offset: .58, easing: "cubic-bezier(.16,1,.3,1)" },
      { transform: "translateX(0) scale(1)", offset: 1 },
    ],
    effects: [
      { transform: "translateX(0)", offset: 0 },
      { transform: `translateX(${WIDGET_REVEALED_X}px)`, offset: .68, easing: "cubic-bezier(.16,1,.3,1)" },
      { transform: `translateX(${WIDGET_REVEALED_X}px)`, offset: 1 },
    ],
  };
}

export function createWidgetReturnFrames() {
  const revealed = transform(WIDGET_REVEALED_X);
  const hidden = transform(WIDGET_HIDDEN_X, 4, .8, .98, 1.02);
  return {
    root: [
      { transform: revealed, offset: 0 },
      { transform: transform(WIDGET_REVEALED_X - 12, 1, -1, 1.04, .96), offset: .13, easing: "cubic-bezier(.55,0,.8,.45)" },
      { transform: transform(-94, 0, 1.4, .96, 1.04), offset: .30, easing: "cubic-bezier(.12,.72,.2,1)" },
      { transform: transform(24, 0, 2, .98, 1.02), offset: .49 },
      { transform: transform(154, 2, 1.2, .98, 1.02), offset: .68, easing: "cubic-bezier(.25,.05,.7,.4)" },
      { transform: hidden, offset: .82, easing: "cubic-bezier(.16,1,.3,1)" },
      { transform: hidden, offset: 1 },
    ],
    actor: [
      { transform: "translateY(0) scale(1)", offset: 0 },
      { transform: "translateY(10px) scale(1.07, .88)", offset: .13 },
      { transform: "translateY(-63px) scale(.93, 1.08)", offset: .30, easing: "cubic-bezier(.12,.72,.2,1)" },
      { transform: "translateY(-88px) scale(.98, 1.03)", offset: .46 },
      { transform: "translateY(-62px) scale(1)", offset: .59 },
      { transform: "translateY(0) scale(1)", offset: .79, easing: "cubic-bezier(.45,0,.9,.55)" },
      { transform: "translateY(0) scale(1)", offset: 1 },
    ],
    shadow: [
      { opacity: .28, transform: "scale(1)", offset: 0 },
      { opacity: .35, transform: "scale(1.12, .84)", offset: .13 },
      { opacity: .10, transform: "scale(.58)", offset: .36 },
      { opacity: .07, transform: "scale(.44)", offset: .48 },
      { opacity: .17, transform: "scale(.72)", offset: .65 },
      { opacity: .28, transform: "scale(1)", offset: .82 },
      { opacity: .28, transform: "scale(1)", offset: 1 },
    ],
    effects: [
      { transform: `translateX(${WIDGET_REVEALED_X}px)`, offset: 0 },
      { transform: `translateX(${WIDGET_REVEALED_X}px)`, offset: .52 },
      { transform: "translateX(0)", offset: .82, easing: "cubic-bezier(.16,1,.3,1)" },
      { transform: "translateX(0)", offset: 1 },
    ],
  };
}
