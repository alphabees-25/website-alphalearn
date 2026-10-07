const smooth = "cubic-bezier(.16,1,.3,1)";
const accelerate = "cubic-bezier(.55,0,.8,.35)";

export function createPlayButtonFrames() {
  return {
    eyes: [
      { opacity: 1, transform: "translateX(0px) scale(1, 1)", offset: 0 },
      { opacity: .72, transform: "translateX(0px) scale(.72, .88)", offset: .42, easing: accelerate },
      { opacity: .18, transform: "translateX(0px) scale(.24, .66)", offset: .74, easing: accelerate },
      { opacity: 0, transform: "translateX(0px) scale(.14, .62)", offset: 1 },
    ],
    play: [
      { opacity: 0, transform: "translateX(-2px) rotate(-8deg) scale(.24)", offset: 0 },
      { opacity: .32, transform: "translateX(-1px) rotate(-5deg) scale(.48)", offset: .42, easing: smooth },
      { opacity: 1, transform: "translateX(1px) rotate(1deg) scale(1.10)", offset: .82, easing: smooth },
      { opacity: 1, transform: "translateX(0px) rotate(0deg) scale(1)", offset: 1, easing: smooth },
    ],
  };
}

export function createPlayButtonReturnFrames() {
  return {
    eyes: [
      { opacity: 0, transform: "translateX(0px) scale(.14, .62)", offset: 0 },
      { opacity: .32, transform: "translateX(0px) scale(.42, .76)", offset: .45, easing: smooth },
      { opacity: 1, transform: "translateX(0px) scale(1.04, 1.02)", offset: .86, easing: smooth },
      { opacity: 1, transform: "translateX(0px) scale(1, 1)", offset: 1 },
    ],
    play: [
      { opacity: 1, transform: "translateX(0px) rotate(0deg) scale(1)", offset: 0 },
      { opacity: .46, transform: "translateX(1px) rotate(4deg) scale(.64)", offset: .55, easing: accelerate },
      { opacity: 0, transform: "translateX(2px) rotate(7deg) scale(.24)", offset: 1 },
    ],
  };
}

export function createPlayToStopFrames() {
  return {
    eyes: [
      { opacity: 0, transform: "translateX(0px) scale(.14, .62)", offset: 0 },
      { opacity: 0, transform: "translateX(0px) scale(.12, .58)", offset: 1 },
    ],
    play: [
      { opacity: 1, transform: "translateX(0px) rotate(0deg) scale(1)", offset: 0 },
      { opacity: .28, transform: "translateX(2px) rotate(9deg) scale(.42)", offset: .58, easing: accelerate },
      { opacity: 0, transform: "translateX(2px) rotate(9deg) scale(.24)", offset: 1 },
    ],
    stop: [
      { opacity: 0, transform: "rotate(-8deg) scale(.28)", offset: 0 },
      { opacity: .45, transform: "rotate(-4deg) scale(.58)", offset: .42, easing: smooth },
      { opacity: 1, transform: "rotate(1deg) scale(1.10)", offset: .82, easing: smooth },
      { opacity: 1, transform: "rotate(0deg) scale(1)", offset: 1, easing: smooth },
    ],
    tint: [
      { opacity: 0, offset: 0 },
      { opacity: .24, offset: 1, easing: smooth },
    ],
  };
}

export function createStopHoverFrames(active) {
  return active ? {
    stop: [
      { opacity: 1, transform: "scale(1)", offset: 0 },
      { opacity: 1, transform: "scale(1.08)", offset: 1, easing: smooth },
    ],
    tint: [{ opacity: .24, offset: 0 }, { opacity: .42, offset: 1, easing: smooth }],
  } : {
    stop: [
      { opacity: 1, transform: "scale(1.08)", offset: 0 },
      { opacity: 1, transform: "scale(1)", offset: 1, easing: smooth },
    ],
    tint: [{ opacity: .42, offset: 0 }, { opacity: .24, offset: 1, easing: smooth }],
  };
}

export function createStopResetFrames() {
  return {
    eyes: [
      { opacity: 0, transform: "translateX(0px) scale(.12, .58)", offset: 0 },
      { opacity: .36, transform: "translateX(0px) scale(.46, .78)", offset: .56, easing: smooth },
      { opacity: 1, transform: "translateX(0px) scale(1.05, 1.02)", offset: .88, easing: smooth },
      { opacity: 1, transform: "translateX(0px) scale(1, 1)", offset: 1 },
    ],
    play: [
      { opacity: 0, transform: "scale(.24)", offset: 0 },
      { opacity: 0, transform: "scale(.24)", offset: 1 },
    ],
    stop: [
      { opacity: 1, transform: "rotate(0deg) scale(1)", offset: 0 },
      { opacity: .35, transform: "rotate(5deg) scale(.58)", offset: .58, easing: accelerate },
      { opacity: 0, transform: "rotate(8deg) scale(.24)", offset: 1 },
    ],
    tint: [
      { opacity: .42, offset: 0 },
      { opacity: 0, offset: 1, easing: smooth },
    ],
  };
}
