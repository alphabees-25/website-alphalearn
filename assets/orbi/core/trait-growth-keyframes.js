/**
 * Orbi wächst mit Eigenschaften.
 *
 * Orbi startet als kleiner Keimling. Drei Eigenschafts-Wörter erscheinen
 * nacheinander neben bzw. über Orbi, holen kurz Schwung und schießen in einem
 * Bogen in Orbi hinein. Jede Aufnahme löst einen gerichteten Einschlag,
 * eine Blob-Welle, einen Ring-Puls und einen Wachstumsschritt aus.
 * Nach dem dritten Wort hat Orbi seine normale Größe und macht einen
 * Freudenhüpfer. Endzustand: vollständig neutral, alle Wörter unsichtbar.
 *
 * Alle Zeiten sind in Millisekunden definiert (`TIMING_MS`) und werden erst
 * am Ende in Timeline-Offsets umgerechnet – Tempo-Feintuning nur dort.
 */

export const TRAIT_GROWTH_DURATION = 5500;

/** Zentraler Tempo-Block (ms). */
export const TIMING_MS = Object.freeze({
  impacts: [1350, 2550, 3750], // Wort taucht in Orbi ein
  appearLead: 1000, // Wort erscheint so lange vor dem Einschlag
  flight: 280, // Bogenflug vom Schwungholen bis in Orbi
  settle: 480, // Wachstum mit Überschwingen nach dem Einschlag
  hopStart: 4300, // Freudenhüpfer im Finale
});

/** Standard-Wörter (Reihenfolge: links, rechts, oben). Austausch per `setGrowthTraits()`. */
export const DEFAULT_GROWTH_TRAITS = Object.freeze(["Kurse", "IP-Rechte", "Lernerprofile"]);

/** Orbi-Größe vor dem ersten Wort und nach jedem aufgenommenen Wort. */
export const GROWTH_SCALES = Object.freeze([.42, .62, .81, 1]);

const round = (value, digits = 3) => Number(value.toFixed(digits));
/** Millisekunden → Timeline-Offset. */
const t = (ms) => round(Math.min(TRAIT_GROWTH_DURATION, Math.max(0, ms)) / TRAIT_GROWTH_DURATION, 4);

/** Zeitpunkte (Timeline-Offset), an denen die Wörter in Orbi eintauchen. */
export const GROWTH_IMPACTS = Object.freeze(TIMING_MS.impacts.map(t));

/**
 * Startpositionen der Wörter relativ zur Stage-Mitte (px) und Blickrichtung.
 * Wort 1 links, Wort 2 rechts, Wort 3 von oben – Orbi ist dann schon groß.
 */
export const TRAIT_ORIGINS = Object.freeze([
  { x: -228, y: -58, side: -1, glanceX: -3.4, glanceY: -1.2 },
  { x: 232, y: -96, side: 1, glanceX: 3.4, glanceY: -1.8 },
  { x: 0, y: -182, side: 0, glanceX: 0, glanceY: -3.2 },
]);

/**
 * Hält die Wort-Startpunkte innerhalb der sichtbaren Stage.
 * `width`/`height`: Stage-Größe in px; `traitSizes`: gemessene Breite/Höhe der Wort-Pillen.
 * Auf großen Stages bleiben die Standardpositionen unverändert.
 */
export function fitTraitOrigins({ width, height, traitSizes = [], margin = 14 } = {}) {
  if (!width || !height) return TRAIT_ORIGINS;
  return TRAIT_ORIGINS.map((origin, index) => {
    const size = traitSizes[index] || { width: 150, height: 46 };
    const maxX = Math.max(0, width / 2 - size.width / 2 - margin);
    const maxY = Math.max(0, height / 2 - size.height / 2 - margin);
    return {
      ...origin,
      x: round(Math.max(-maxX, Math.min(maxX, origin.x)), 1),
      y: round(Math.max(-maxY, Math.min(maxY, origin.y)), 1),
    };
  });
}

const ORBI_SIZE = 220;
/** transform-origin des Actors liegt bei 88 % der Höhe → Orbi wächst vom Boden aus. */
const ACTOR_PIVOT_Y = ORBI_SIZE * .88 - ORBI_SIZE / 2;

/** Vertikale Position der Kugelmitte bei Skalierung `scale` relativ zur Stage-Mitte. */
export const orbiCenterY = (scale) => round(ACTOR_PIVOT_Y * (1 - scale), 2);

const actorTransform = (y, rotation, scaleX, scaleY = scaleX) =>
  `translateY(${round(y, 2)}px) rotate(${round(rotation, 2)}deg) scale(${round(scaleX)}, ${round(scaleY)})`;

const traitTransform = (x, y, rotation, scaleX, scaleY = scaleX) =>
  `translate(calc(-50% + ${round(x, 1)}px), calc(-50% + ${round(y, 1)}px)) rotate(${round(rotation, 2)}deg) scale(${round(scaleX)}, ${round(scaleY)})`;

/** Zeitpunkte eines Wortes in Millisekunden. */
function traitTimingMs(index) {
  const impact = TIMING_MS.impacts[index];
  return {
    appear: impact - TIMING_MS.appearLead,
    launch: impact - TIMING_MS.flight,
    impact,
    settled: impact + TIMING_MS.settle,
  };
}

/** Zeitpunkte eines Wortes als Timeline-Offsets. */
export function traitTiming(index) {
  const ms = traitTimingMs(index);
  return { appear: t(ms.appear), launch: t(ms.launch), impact: t(ms.impact), settled: t(ms.settled) };
}

function createActorFrames() {
  const [seed] = GROWTH_SCALES;
  const frames = [
    { transform: actorTransform(0, 0, .06), opacity: 0, offset: 0 },
    { transform: actorTransform(0, 0, seed * 1.14, seed * .82), opacity: 1, offset: t(160), easing: "cubic-bezier(.16,1,.3,1)" },
    { transform: actorTransform(0, 0, seed * .93, seed * 1.09), opacity: 1, offset: t(260) },
    { transform: actorTransform(0, 0, seed * 1.03, seed * .975), opacity: 1, offset: t(350) },
    { transform: actorTransform(0, 0, seed), opacity: 1, offset: t(430) },
  ];
  let lastMs = 430;

  TIMING_MS.impacts.forEach((impact, index) => {
    const from = GROWTH_SCALES[index];
    const to = GROWTH_SCALES[index + 1];
    const { appear, launch } = traitTimingMs(index);
    const lean = TRAIT_ORIGINS[index].side * 4;
    const leanStart = Math.max(appear + 200, lastMs + 30);

    frames.push(
      // Neugierig zur Seite des Wortes neigen
      { transform: actorTransform(0, lean, from), opacity: 1, offset: t(leanStart), easing: "cubic-bezier(.3,0,.3,1)" },
      { transform: actorTransform(0, lean * .8, from * 1.015, from * .99), opacity: 1, offset: t(launch - 60) },
      // Einatmen, kurz bevor das Wort ankommt
      { transform: actorTransform(0, lean * .3, from * 1.07, from * .95), opacity: 1, offset: t(impact - 130), easing: "cubic-bezier(.5,0,.85,.4)" },
      // Einschlag
      { transform: actorTransform(2, 0, from * 1.2, from * .8), opacity: 1, offset: t(impact), easing: "cubic-bezier(.12,.86,.24,1)" },
      // Wachstum mit Überschwingen
      { transform: actorTransform(-3, 0, to * .93, to * 1.11), opacity: 1, offset: t(impact + 140), easing: "cubic-bezier(.3,.6,.4,1)" },
      { transform: actorTransform(0, 0, to * 1.05, to * .955), opacity: 1, offset: t(impact + 260) },
      { transform: actorTransform(0, 0, to * .985, to * 1.012), opacity: 1, offset: t(impact + 370) },
      { transform: actorTransform(0, 0, to), opacity: 1, offset: t(impact + TIMING_MS.settle) },
    );
    lastMs = impact + TIMING_MS.settle;
  });

  // Freudenhüpfer in voller Größe
  const h = TIMING_MS.hopStart;
  frames.push(
    { transform: actorTransform(0, 0, 1), opacity: 1, offset: t(h) },
    { transform: actorTransform(6, 0, 1.1, .86), opacity: 1, offset: t(h + 120), easing: "cubic-bezier(.2,.7,.3,1)" },
    { transform: actorTransform(-30, 0, .94, 1.08), opacity: 1, offset: t(h + 270), easing: "cubic-bezier(.2,.6,.35,1)" },
    { transform: actorTransform(-46, 0, 1, 1), opacity: 1, offset: t(h + 420), easing: "cubic-bezier(.45,0,.85,.4)" },
    { transform: actorTransform(3, 0, 1.12, .87), opacity: 1, offset: t(h + 610), easing: "cubic-bezier(.16,.8,.3,1)" },
    { transform: actorTransform(-2, 0, .97, 1.035), opacity: 1, offset: t(h + 760) },
    { transform: actorTransform(0, 0, 1.01, .99), opacity: 1, offset: t(h + 890) },
    { transform: actorTransform(0, 0, 1), opacity: 1, offset: 1 },
  );
  return frames;
}

function createShadowFrames() {
  const [seed] = GROWTH_SCALES;
  const shadow = (scaleX, opacity, ms) => ({ transform: `scaleX(${round(scaleX)})`, opacity: round(opacity), offset: t(ms) });
  const frames = [
    shadow(.05, 0, 0),
    shadow(seed * 1.2, .22, 160),
    shadow(seed, .18, 430),
  ];
  TIMING_MS.impacts.forEach((impact, index) => {
    const from = GROWTH_SCALES[index];
    const to = GROWTH_SCALES[index + 1];
    const opacityFor = (scale) => .12 + scale * .16;
    frames.push(
      shadow(from * 1.06, opacityFor(from), impact - 130),
      shadow(from * 1.26, opacityFor(from) + .06, impact),
      shadow(to * .94, opacityFor(to), impact + 140),
      shadow(to, opacityFor(to), impact + TIMING_MS.settle),
    );
  });
  const h = TIMING_MS.hopStart;
  frames.push(
    shadow(1, .28, h),
    shadow(1.2, .36, h + 120),
    shadow(.7, .14, h + 270),
    shadow(.6, .1, h + 420),
    shadow(1.24, .37, h + 610),
    shadow(.96, .27, h + 760),
    shadow(1, .28, TRAIT_GROWTH_DURATION),
  );
  return frames;
}

function createBlobFrames() {
  const blob = (transform, ms) => ({ transform, offset: t(ms) });
  const frames = [blob("scale(1, 1) rotate(0deg)", 0)];
  TIMING_MS.impacts.forEach((impact, index) => {
    const side = TRAIT_ORIGINS[index].side || (index % 2 ? 1 : -1);
    frames.push(
      blob("scale(1, 1) rotate(0deg)", impact + 30),
      blob(`scale(.9, 1.1) rotate(${round(side * 2.6, 2)}deg)`, impact + 120),
      blob(`scale(1.07, .94) rotate(${round(-side * 1.7, 2)}deg)`, impact + 220),
      blob(`scale(.97, 1.03) rotate(${round(side * .8, 2)}deg)`, impact + 320),
      blob("scale(1.01, .99) rotate(0deg)", impact + 410),
      blob("scale(1, 1) rotate(0deg)", impact + TIMING_MS.settle),
    );
  });
  frames.push(blob("scale(1, 1) rotate(0deg)", TRAIT_GROWTH_DURATION));
  return frames;
}

function createTraitFrames(index, origin = TRAIT_ORIGINS[index]) {
  const { appear, launch, impact } = traitTimingMs(index);
  const target = { x: 0, y: orbiCenterY(GROWTH_SCALES[index]) };
  const outward = Math.hypot(origin.x - target.x, origin.y - target.y) || 1;
  const away = { x: (origin.x - target.x) / outward, y: (origin.y - target.y) / outward };
  const tilt = origin.side * -3;
  const flightTilt = origin.side * 14;
  const arcLift = origin.side === 0 ? 0 : 40;
  const mid = {
    x: origin.x + (target.x - origin.x) * .5,
    y: origin.y + (target.y - origin.y) * .5 - arcLift,
  };
  const near = {
    x: origin.x + (target.x - origin.x) * .88,
    y: origin.y + (target.y - origin.y) * .88 - arcLift * .25,
  };
  const windUp = launch - 90;

  return [
    { transform: traitTransform(origin.x, origin.y + 14, 0, .3), opacity: 0, offset: 0 },
    { transform: traitTransform(origin.x, origin.y + 14, 0, .3), opacity: 0, offset: t(appear) },
    // Aufploppen
    { transform: traitTransform(origin.x, origin.y - 4, tilt, 1.12, 1.08), opacity: 1, offset: t(appear + 150), easing: "cubic-bezier(.16,1,.3,1)" },
    { transform: traitTransform(origin.x, origin.y + 1, tilt * .5, .96, 1.02), opacity: 1, offset: t(appear + 260) },
    { transform: traitTransform(origin.x, origin.y, 0, 1), opacity: 1, offset: t(appear + 350), easing: "cubic-bezier(.45,0,.55,1)" },
    // Kurzes Schweben, damit das Wort lesbar bleibt
    { transform: traitTransform(origin.x, origin.y - 6, tilt * -.5, 1), opacity: 1, offset: t(windUp), easing: "cubic-bezier(.4,0,.6,1)" },
    // Schwung holen (leicht von Orbi weg)
    { transform: traitTransform(origin.x + away.x * 14, origin.y - 3 + away.y * 14, -flightTilt * .4, 1.06, .93), opacity: 1, offset: t(launch), easing: "cubic-bezier(.55,0,.85,.25)" },
    // Schneller Bogenflug
    { transform: traitTransform(mid.x, mid.y, flightTilt, .82, .76), opacity: 1, offset: t(launch + TIMING_MS.flight * .55), easing: "cubic-bezier(.4,0,.9,.55)" },
    // Einsaugen
    { transform: traitTransform(near.x, near.y, flightTilt * .5, .42, .32), opacity: .92, offset: t(impact - 40) },
    { transform: traitTransform(target.x, target.y, 0, .06, .04), opacity: 0, offset: t(impact) },
    { transform: traitTransform(target.x, target.y, 0, .06, .04), opacity: 0, offset: 1 },
  ];
}

function createRingFrames() {
  const ring = (y, scale, opacity, ms) => ({
    transform: `translate(-50%, calc(-50% + ${round(y, 1)}px)) scale(${round(scale)})`,
    opacity: round(opacity),
    offset: t(ms),
  });
  const frames = [ring(0, .18, 0, 0)];
  TIMING_MS.impacts.forEach((impact, index) => {
    const y = orbiCenterY(GROWTH_SCALES[index + 1]);
    const size = GROWTH_SCALES[index + 1];
    frames.push(
      ring(y, .4 * size, 0, impact - 8),
      ring(y, .62 * size, .78, impact + 45),
      ring(y, 1.55 * size, 0, impact + 440),
    );
  });
  frames.push(ring(0, .18, 0, TRAIT_GROWTH_DURATION));
  return frames;
}

/** Vier Funken pro Wort: 12 Funken der Schwarm-Stage, je Einschlag ein radialer Kranz. */
function createSparkFrames(sparkIndex) {
  const traitIndex = Math.floor(sparkIndex / 4);
  const slot = sparkIndex % 4;
  const impact = TIMING_MS.impacts[traitIndex];
  const scale = GROWTH_SCALES[traitIndex + 1];
  const centerY = orbiCenterY(scale);
  const angle = (-Math.PI / 2) + (slot - 1.5) * .72 + traitIndex * .4;
  const near = 44 * scale + 8;
  const far = 92 * scale + 34;
  const rotation = round(angle * 180 / Math.PI);
  const point = (radius) => ({ x: Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius });
  const a = point(near);
  const b = point(far);
  const spark = (p, scaleValue, opacity, ms) => ({
    transform: `translate(${round(p.x, 1)}px, ${round(p.y, 1)}px) rotate(${rotation}deg) scale(${round(scaleValue)}, ${round(scaleValue)})`,
    opacity: round(opacity),
    offset: t(ms),
  });
  const delay = slot * 20;
  return [
    spark(a, .2, 0, 0),
    spark(a, .2, 0, impact + delay),
    spark(a, 1, .9, impact + delay + 45),
    spark(b, .4, 0, impact + delay + 380),
    spark(b, .4, 0, TRAIT_GROWTH_DURATION),
  ];
}

function createEyeFrames() {
  const openEyes = [{ opacity: 1, transform: "scaleY(1)", offset: 0 }];
  const smileEyes = [{ opacity: 0, transform: "scale(.84, .68) translateY(2px)", offset: 0 }];
  const squint = (open, smile, ms) => {
    openEyes.push({ ...open, offset: t(ms) });
    smileEyes.push({ ...smile, offset: t(ms) });
  };
  const OPEN = [{ opacity: 1, transform: "scaleY(1)" }, { opacity: 0, transform: "scale(.84, .68) translateY(2px)" }];
  const CROSS_IN = [{ opacity: .28, transform: "scaleY(.62)" }, { opacity: .68, transform: "scale(.96, .9) translateY(.5px)" }];
  const SMILE = [{ opacity: 0, transform: "scaleY(.44)" }, { opacity: 1, transform: "scale(1.04, 1.04) translateY(0)" }];
  const CROSS_OUT = [{ opacity: .34, transform: "scaleY(.68)" }, { opacity: .48, transform: "scale(.97, .82) translateY(1px)" }];
  const POP = [{ opacity: 1, transform: "scaleY(1.06)" }, { opacity: 0, transform: "scale(.91, .62) translateY(2px)" }];

  const smileWindow = (start, end) => {
    squint(...OPEN, start);
    squint(...CROSS_IN, start + 80);
    squint(...SMILE, start + 170);
    squint(...SMILE, end);
    squint(...CROSS_OUT, end + 90);
    squint(...POP, end + 180);
    squint(...OPEN, end + 260);
  };

  const { impacts } = TIMING_MS;
  const lastIndex = impacts.length - 1;
  impacts.slice(0, lastIndex).forEach((impact) => smileWindow(impact + 30, impact + 520));
  // Nach dem letzten Wort durchgehend lächeln, bis der Freudenhüpfer gelandet ist
  smileWindow(impacts[lastIndex] + 30, TIMING_MS.hopStart + 720);
  if (openEyes.at(-1).offset < 1) squint(...OPEN, TRAIT_GROWTH_DURATION);
  return { openEyes, smileEyes };
}

function createGlanceFrames() {
  const glance = (x, y, ms) => ({ transform: `translate(${round(x, 2)}px, ${round(y, 2)}px)`, offset: t(ms) });
  const frames = [glance(0, 0, 0)];
  let lastMs = 0;
  TIMING_MS.impacts.forEach((impact, index) => {
    const { appear, launch } = traitTimingMs(index);
    const { glanceX, glanceY } = TRAIT_ORIGINS[index];
    const start = Math.max(appear + 80, lastMs + 30);
    frames.push(
      glance(0, 0, start),
      glance(glanceX, glanceY, start + 200),
      glance(glanceX, glanceY, launch),
      glance(0, 0, impact - 30),
    );
    lastMs = impact - 30;
  });
  frames.push(glance(0, 0, TRAIT_GROWTH_DURATION));
  return frames;
}

function createMouthFrames() {
  const hidden = (ms) => ({ opacity: 0, transform: "scale(.72)", offset: t(ms) });
  const shown = (ms, scale = 1) => ({ opacity: 1, transform: `scale(${scale})`, offset: t(ms) });

  const partyFrames = [hidden(0)];
  const wowFrames = [hidden(0)];
  const { impacts } = TIMING_MS;
  const lastIndex = impacts.length - 1;
  impacts.forEach((impact, index) => {
    const { launch } = traitTimingMs(index);
    // „Oh!“ während das Wort anfliegt
    wowFrames.push(hidden(launch - 120), shown(launch, 1.18), shown(impact - 40, .9), hidden(impact + 30));
    // Lächeln direkt nach der Aufnahme; nach dem letzten Wort bis zum Ende des Freudenhüpfers
    partyFrames.push(hidden(impact + 30), shown(impact + 140, 1.06));
    if (index < lastIndex) partyFrames.push(shown(impact + 500), hidden(impact + 620));
  });
  const h = TIMING_MS.hopStart;
  partyFrames.push(shown(h + 120, 1.1), shown(h + 700, 1.08), hidden(h + 900), hidden(TRAIT_GROWTH_DURATION));
  wowFrames.push(hidden(TRAIT_GROWTH_DURATION));
  return { party: partyFrames, wow: wowFrames };
}

function createGlowFrames() {
  const glow = (opacity, ms) => ({ opacity, offset: t(ms) });
  const frames = [glow(.48, 0)];
  TIMING_MS.impacts.forEach((impact) => {
    frames.push(
      glow(.48, impact - 30),
      glow(.92, impact + 80),
      glow(.6, impact + 400),
      glow(.48, impact + 700),
    );
  });
  frames.push(glow(.48, TRAIT_GROWTH_DURATION));
  return frames;
}

export function createTraitGrowthFrames({ origins = TRAIT_ORIGINS } = {}) {
  const eyes = createEyeFrames();
  const mouth = createMouthFrames();
  return {
    actor: createActorFrames(),
    shadow: createShadowFrames(),
    blob: createBlobFrames(),
    traits: origins.map((origin, index) => createTraitFrames(index, origin)),
    ring: createRingFrames(),
    sparks: Array.from({ length: 12 }, (_, index) => createSparkFrames(index)),
    openEyes: eyes.openEyes,
    smileEyes: eyes.smileEyes,
    eyesGlance: createGlanceFrames(),
    mouthParty: mouth.party,
    mouthWow: mouth.wow,
    glow: createGlowFrames(),
  };
}
