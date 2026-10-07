import { createSmallHopFrames } from "../../core/hop-keyframes.js?v=0.3.0";

export const meta = Object.freeze({
  id: "hop-small",
  label: "Kleiner Hüpfer",
  duration: 620,
  description: "Ein kurzer, leichter Hüpfer für Reaktionen und schnelle Wiederholungen.",
  tags: ["body", "light", "one-shot", "loopable"],
});

export async function run({ elements, animate }) {
  const frames = createSmallHopFrames();
  const body = animate(elements.actor, frames.body, {
    duration: meta.duration,
    easing: "linear",
  });
  const shadow = animate(elements.shadow, frames.shadow, {
    duration: meta.duration,
    easing: "linear",
  });

  await Promise.allSettled([body.finished, shadow.finished]);
}
