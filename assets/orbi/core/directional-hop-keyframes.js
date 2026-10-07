function transform({ x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0 }) {
  return `translateX(${x}px) translateY(${y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
}

/**
 * Two outward hops followed by one return hop to the exact center.
 * `direction` is -1 for left and 1 for right.
 */
export function createDirectionalHopFrames(direction) {
  if (direction !== -1 && direction !== 1) {
    throw new RangeError("Directional hop expects -1 (left) or 1 (right).");
  }

  const x = (value) => value * direction;
  const rotation = (value) => value * direction;

  return {
    body: [
      { transform: transform({}), offset: 0 },
      { transform: transform({ y: 3, scaleX: 1.08, scaleY: .92 }), offset: .05, easing: "cubic-bezier(.4,0,.75,.35)" },
      { transform: transform({ x: x(16), y: -26, scaleX: .97, scaleY: 1.06, rotation: rotation(2.4) }), offset: .14, easing: "cubic-bezier(.12,.72,.25,1)" },
      { transform: transform({ x: x(30), y: 2, scaleX: 1.09, scaleY: .91, rotation: rotation(.8) }), offset: .22, easing: "cubic-bezier(.48,.02,.78,.5)" },
      { transform: transform({ x: x(30), y: 3, scaleX: 1.075, scaleY: .925, rotation: rotation(.4) }), offset: .28 },
      { transform: transform({ x: x(47), y: -29, scaleX: .965, scaleY: 1.07, rotation: rotation(2.8) }), offset: .38, easing: "cubic-bezier(.12,.72,.25,1)" },
      { transform: transform({ x: x(62), y: 2, scaleX: 1.10, scaleY: .90, rotation: rotation(.8) }), offset: .47, easing: "cubic-bezier(.48,.02,.78,.5)" },
      { transform: transform({ x: x(62), scaleX: 1.04, scaleY: .96, rotation: rotation(.3) }), offset: .56 },
      { transform: transform({ x: x(31), y: -32, scaleX: .96, scaleY: 1.075, rotation: rotation(-2.6) }), offset: .68, easing: "cubic-bezier(.12,.72,.25,1)" },
      { transform: transform({ y: 3, scaleX: 1.12, scaleY: .88 }), offset: .80, easing: "cubic-bezier(.48,.02,.78,.5)" },
      { transform: transform({ y: -6, scaleX: .99, scaleY: 1.02 }), offset: .89, easing: "cubic-bezier(.16,.78,.3,1)" },
      { transform: transform({}), offset: 1, easing: "cubic-bezier(.16,1,.3,1)" },
    ],
    shadow: [
      { transform: `translateX(0px) scaleX(1)`, opacity: .28, offset: 0 },
      { transform: `translateX(0px) scaleX(1.10)`, opacity: .33, offset: .05 },
      { transform: `translateX(${x(16)}px) scaleX(.66)`, opacity: .15, offset: .14 },
      { transform: `translateX(${x(30)}px) scaleX(1.15)`, opacity: .36, offset: .22 },
      { transform: `translateX(${x(30)}px) scaleX(1.10)`, opacity: .33, offset: .28 },
      { transform: `translateX(${x(47)}px) scaleX(.62)`, opacity: .14, offset: .38 },
      { transform: `translateX(${x(62)}px) scaleX(1.17)`, opacity: .37, offset: .47 },
      { transform: `translateX(${x(62)}px) scaleX(1.04)`, opacity: .30, offset: .56 },
      { transform: `translateX(${x(31)}px) scaleX(.58)`, opacity: .13, offset: .68 },
      { transform: `translateX(0px) scaleX(1.20)`, opacity: .39, offset: .80 },
      { transform: `translateX(0px) scaleX(.84)`, opacity: .21, offset: .89 },
      { transform: `translateX(0px) scaleX(1)`, opacity: .28, offset: 1 },
    ],
  };
}

/**
 * Five large hops: left, right, left, right and back to the center.
 */
export function createZigzagHopFrames() {
  return {
    body: [
      { transform: transform({}), offset: 0 },
      { transform: transform({ y: 4, scaleX: 1.13, scaleY: .87 }), offset: .035, easing: "cubic-bezier(.4,0,.75,.35)" },
      { transform: transform({ x: -32, y: -58, scaleX: .93, scaleY: 1.10, rotation: -3.2 }), offset: .105, easing: "cubic-bezier(.12,.72,.25,1)" },
      { transform: transform({ x: -64, y: 4, scaleX: 1.16, scaleY: .84, rotation: -.7 }), offset: .18, easing: "cubic-bezier(.48,.02,.78,.5)" },

      { transform: transform({ x: -64, y: 5, scaleX: 1.11, scaleY: .89, rotation: -.3 }), offset: .21 },
      { transform: transform({ x: 0, y: -65, scaleX: .92, scaleY: 1.12, rotation: 3.6 }), offset: .29, easing: "cubic-bezier(.12,.72,.25,1)" },
      { transform: transform({ x: 64, y: 4, scaleX: 1.17, scaleY: .83, rotation: .7 }), offset: .36, easing: "cubic-bezier(.48,.02,.78,.5)" },

      { transform: transform({ x: 64, y: 5, scaleX: 1.11, scaleY: .89, rotation: .3 }), offset: .39 },
      { transform: transform({ x: 0, y: -63, scaleX: .92, scaleY: 1.12, rotation: -3.6 }), offset: .47, easing: "cubic-bezier(.12,.72,.25,1)" },
      { transform: transform({ x: -64, y: 4, scaleX: 1.17, scaleY: .83, rotation: -.7 }), offset: .54, easing: "cubic-bezier(.48,.02,.78,.5)" },

      { transform: transform({ x: -64, y: 5, scaleX: 1.11, scaleY: .89, rotation: -.3 }), offset: .57 },
      { transform: transform({ x: 0, y: -65, scaleX: .92, scaleY: 1.12, rotation: 3.6 }), offset: .65, easing: "cubic-bezier(.12,.72,.25,1)" },
      { transform: transform({ x: 64, y: 4, scaleX: 1.17, scaleY: .83, rotation: .7 }), offset: .72, easing: "cubic-bezier(.48,.02,.78,.5)" },

      { transform: transform({ x: 64, y: 5, scaleX: 1.11, scaleY: .89, rotation: .3 }), offset: .75 },
      { transform: transform({ x: 32, y: -56, scaleX: .935, scaleY: 1.10, rotation: -2.8 }), offset: .84, easing: "cubic-bezier(.12,.72,.25,1)" },
      { transform: transform({ y: 4, scaleX: 1.18, scaleY: .82 }), offset: .92, easing: "cubic-bezier(.48,.02,.78,.5)" },
      { transform: transform({ y: -8, scaleX: .985, scaleY: 1.025 }), offset: .965, easing: "cubic-bezier(.16,.78,.3,1)" },
      { transform: transform({}), offset: 1, easing: "cubic-bezier(.16,1,.3,1)" },
    ],
    shadow: [
      { transform: "translateX(0px) scaleX(1)", opacity: .28, offset: 0 },
      { transform: "translateX(0px) scaleX(1.16)", opacity: .36, offset: .035 },
      { transform: "translateX(-32px) scaleX(.45)", opacity: .09, offset: .105 },
      { transform: "translateX(-64px) scaleX(1.24)", opacity: .40, offset: .18 },
      { transform: "translateX(-64px) scaleX(1.17)", opacity: .36, offset: .21 },
      { transform: "translateX(0px) scaleX(.40)", opacity: .08, offset: .29 },
      { transform: "translateX(64px) scaleX(1.25)", opacity: .41, offset: .36 },
      { transform: "translateX(64px) scaleX(1.17)", opacity: .36, offset: .39 },
      { transform: "translateX(0px) scaleX(.41)", opacity: .08, offset: .47 },
      { transform: "translateX(-64px) scaleX(1.25)", opacity: .41, offset: .54 },
      { transform: "translateX(-64px) scaleX(1.17)", opacity: .36, offset: .57 },
      { transform: "translateX(0px) scaleX(.40)", opacity: .08, offset: .65 },
      { transform: "translateX(64px) scaleX(1.25)", opacity: .41, offset: .72 },
      { transform: "translateX(64px) scaleX(1.17)", opacity: .36, offset: .75 },
      { transform: "translateX(32px) scaleX(.46)", opacity: .10, offset: .84 },
      { transform: "translateX(0px) scaleX(1.27)", opacity: .42, offset: .92 },
      { transform: "translateX(0px) scaleX(.78)", opacity: .18, offset: .965 },
      { transform: "translateX(0px) scaleX(1)", opacity: .28, offset: 1 },
    ],
  };
}
