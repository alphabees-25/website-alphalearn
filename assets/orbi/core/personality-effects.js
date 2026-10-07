import { getOrbiType } from "./palettes.js?v=0.3.0";
import { DEFAULT_GROWTH_TRAITS } from "./trait-growth-keyframes.js?v=0.4.0";

const CONFETTI_COLORS = ["#ff6ea9", "#ffd34e", "#46d6c8", "#775cf6", "#72a8ff"];

export function createPersonalityEffects({ type = "tutor", id = "orbi-personality-effects", growthTraits: initialGrowthTraits = DEFAULT_GROWTH_TRAITS } = {}) {
  const colors = getOrbiType(type).colors;
  const root = document.createElement("div");
  root.id = id;
  root.className = "orbi-stage-effects";
  root.setAttribute("aria-hidden", "true");
  root.style.setProperty("--fx-a", colors.fill3);
  root.style.setProperty("--fx-b", colors.bandB3);

  const thoughtBubble = document.createElement("div");
  thoughtBubble.className = "orbi-thought-bubble";
  const thoughtDots = Array.from({ length: 3 }, () => {
    const dot = document.createElement("i");
    thoughtBubble.appendChild(dot);
    return dot;
  });
  root.appendChild(thoughtBubble);

  const confettiParticles = Array.from({ length: 28 }, (_, index) => {
    const particle = document.createElement("i");
    particle.className = "orbi-confetti-particle";
    particle.style.setProperty("--confetti-color", CONFETTI_COLORS[index % CONFETTI_COLORS.length]);
    particle.style.setProperty("--confetti-width", `${5 + (index % 3) * 2}px`);
    particle.style.setProperty("--confetti-height", `${9 + (index % 4) * 2}px`);
    root.appendChild(particle);
    return particle;
  });

  const noteSymbols = ["♪", "♫", "♪", "♬", "♪"];
  const noteSizes = [21, 25, 23, 27, 24];
  const whistleNotes = noteSymbols.map((symbol, index) => {
    const note = document.createElement("span");
    note.className = "orbi-whistle-note";
    note.textContent = symbol;
    note.style.setProperty("--note-size", `${noteSizes[index]}px`);
    root.appendChild(note);
    return note;
  });

  const sleepSymbols = ["z", "z", "Z", "Z"];
  const sleepSizes = [18, 22, 28, 34];
  const sleepZs = sleepSymbols.map((symbol, index) => {
    const z = document.createElement("span");
    z.className = "orbi-sleep-z";
    z.textContent = symbol;
    z.style.setProperty("--sleep-z-size", `${sleepSizes[index]}px`);
    root.appendChild(z);
    return z;
  });

  const tryMeBubble = document.createElement("div");
  tryMeBubble.className = "orbi-try-me-bubble";
  tryMeBubble.textContent = "Try me";
  root.appendChild(tryMeBubble);

  const traitColors = [
    [colors.bandA2, colors.fill3],
    [colors.fill3, colors.fill4],
    [colors.bandB3, colors.bandB2],
  ];
  const growthTraits = traitColors.map(([colorA, colorB], index) => {
    const trait = document.createElement("span");
    trait.className = "orbi-growth-trait";
    trait.dataset.traitIndex = String(index);
    trait.style.setProperty("--trait-a", colorA);
    trait.style.setProperty("--trait-b", colorB);
    root.appendChild(trait);
    return trait;
  });
  const setGrowthTraits = (words = DEFAULT_GROWTH_TRAITS) => {
    growthTraits.forEach((trait, index) => {
      trait.textContent = String(words[index] ?? DEFAULT_GROWTH_TRAITS[index]).trim() || DEFAULT_GROWTH_TRAITS[index];
    });
    return growthTraits.map((trait) => trait.textContent);
  };
  setGrowthTraits(initialGrowthTraits);

  return { root, thoughtBubble, thoughtDots, confettiParticles, whistleNotes, sleepZs, tryMeBubble, growthTraits, setGrowthTraits };
}
