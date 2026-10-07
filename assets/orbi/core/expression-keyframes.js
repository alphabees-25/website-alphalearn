/**
 * Shared open-eyes <-> smile-eyes transition.
 *
 * Both SVG eye groups stay mounted. The handoff uses a short squint pose
 * instead of a long dissolve, so expression changes remain readable without
 * showing two complete pairs of eyes at the same time.
 */
export function createSmileExpressionFrames({
  enterStart = .10,
  enterCross = .135,
  enterEnd = .17,
  exitStart = .84,
  exitCross = .875,
  exitEnd = .91,
  settleEnd = .95,
  smileHoldFrames = [],
} = {}) {
  const offsets = [0, enterStart, enterCross, enterEnd, exitStart, exitCross, exitEnd, settleEnd, 1];
  if (offsets.some((value, index) => index > 0 && value < offsets[index - 1])) {
    throw new RangeError("Expression offsets must be in ascending order.");
  }
  if (smileHoldFrames.some(({ offset }) => offset < enterEnd || offset > exitStart)) {
    throw new RangeError("Smile hold frames must sit between enterEnd and exitStart.");
  }

  return {
    openEyes: [
      { opacity: 1, transform: "scaleY(1)", offset: 0 },
      { opacity: 1, transform: "scaleY(1)", offset: enterStart },
      { opacity: .28, transform: "scaleY(.62)", offset: enterCross, easing: "cubic-bezier(.4,0,.7,1)" },
      { opacity: 0, transform: "scaleY(.44)", offset: enterEnd },
      { opacity: 0, transform: "scaleY(.44)", offset: exitStart },
      { opacity: .34, transform: "scaleY(.68)", offset: exitCross, easing: "cubic-bezier(.12,.72,.25,1)" },
      { opacity: 1, transform: "scaleY(1.06)", offset: exitEnd, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "scaleY(1)", offset: settleEnd },
      { opacity: 1, transform: "scaleY(1)", offset: 1 },
    ],
    smileEyes: [
      { opacity: 0, transform: "scale(.84, .68) translateY(2px)", offset: 0 },
      { opacity: 0, transform: "scale(.84, .68) translateY(2px)", offset: enterStart },
      { opacity: .68, transform: "scale(.96, .90) translateY(.5px)", offset: enterCross, easing: "cubic-bezier(.16,1,.3,1)" },
      { opacity: 1, transform: "scale(1.04, 1.04) translateY(0)", offset: enterEnd },
      ...smileHoldFrames,
      { opacity: 1, transform: "scale(1, 1) translateY(0)", offset: exitStart },
      { opacity: .48, transform: "scale(.97, .82) translateY(1px)", offset: exitCross, easing: "cubic-bezier(.4,0,.8,.45)" },
      { opacity: 0, transform: "scale(.91, .62) translateY(2px)", offset: exitEnd },
      { opacity: 0, transform: "scale(.91, .62) translateY(2px)", offset: settleEnd },
      { opacity: 0, transform: "scale(.91, .62) translateY(2px)", offset: 1 },
    ],
  };
}
