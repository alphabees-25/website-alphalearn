/**
 * Amplified version of the classic Orbi hop from `orbi-mascot.html`.
 *
 * The original pose timing stays intact while height, airborne stretch and
 * landing squash are pushed far enough to read clearly at mascot scale.
 */
export function createClassicHopFrames() {
  return {
    body: [
      { transform: "translateY(0) scale(1, 1)", offset: 0 },
      { transform: "translateY(3px) scale(1.12, .88)", offset: .08, easing: "cubic-bezier(.3,.05,.7,.4)" },
      { transform: "translateY(-62px) scale(.93, 1.10)", offset: .26, easing: "cubic-bezier(.15,.72,.28,1)" },
      { transform: "translateY(5px) scale(1.16, .84)", offset: .44, easing: "cubic-bezier(.48,.02,.78,.5)" },
      { transform: "translateY(-14px) scale(.98, 1.03)", offset: .52, easing: "cubic-bezier(.16,.78,.3,1)" },
      { transform: "translateY(0) scale(1, 1)", offset: .62, easing: "cubic-bezier(.16,1,.3,1)" },
      { transform: "translateY(0) scale(1, 1)", offset: 1 },
    ],
    shadow: [
      { transform: "scaleX(1)", opacity: .28, offset: 0 },
      { transform: "scaleX(1.14)", opacity: .34, offset: .08 },
      { transform: "scaleX(.42)", opacity: .08, offset: .26 },
      { transform: "scaleX(1.24)", opacity: .40, offset: .44 },
      { transform: "scaleX(.72)", opacity: .17, offset: .52 },
      { transform: "scaleX(1)", opacity: .28, offset: .62 },
      { transform: "scaleX(1)", opacity: .28, offset: 1 },
    ],
  };
}

/**
 * A short, light hop for reactions, chatter and repeated choreography beats.
 */
export function createSmallHopFrames() {
  return {
    body: [
      { transform: "translateY(0) scale(1, 1)", offset: 0 },
      { transform: "translateY(1px) scale(1.055, .945)", offset: .14, easing: "cubic-bezier(.3,.05,.7,.4)" },
      { transform: "translateY(-18px) scale(.975, 1.045)", offset: .42, easing: "cubic-bezier(.14,.72,.28,1)" },
      { transform: "translateY(2px) scale(1.075, .925)", offset: .68, easing: "cubic-bezier(.5,.02,.78,.48)" },
      { transform: "translateY(0) scale(1, 1)", offset: 1, easing: "cubic-bezier(.16,1,.3,1)" },
    ],
    shadow: [
      { transform: "scaleX(1)", opacity: .28, offset: 0 },
      { transform: "scaleX(1.06)", opacity: .31, offset: .14 },
      { transform: "scaleX(.72)", opacity: .18, offset: .42 },
      { transform: "scaleX(1.12)", opacity: .35, offset: .68 },
      { transform: "scaleX(1)", opacity: .28, offset: 1 },
    ],
  };
}
