import { applyOrbiType, getOrbiType } from "./palettes.js";

let instanceCounter = 0;

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

const GAZES = ["scan", "left", "right", "center"];

/** Wo im Umlauf ein Orbi startet: innerhalb der Haltephase seiner Richtung,
 *  damit zwei Orbis nicht im selben Moment zur Seite schauen. Beim Pendel
 *  (`scan`) über den ganzen Umlauf — sonst starteten alle nach rechts. */
const GAZE_HOLD = { scan: [0, 1], right: [0, 0.8], left: [0, 0.8], center: [0, 0.35] };

/** Wo Blinzeln und lachende Augen im Takt starten (0–1). Gleiche Werte bei
 *  mehreren Orbis = alle blinzeln und lachen gleichzeitig. */
function applyIdlePhases(root, blinkPhase, smilePhase) {
  const clamp = (value) => String(Math.min(1, Math.max(0, Number(value) || 0)));
  root.style.setProperty("--orbi-blink-phase", clamp(blinkPhase));
  root.style.setProperty("--orbi-smile-phase", clamp(smilePhase));
}

function applyGaze(root, gaze, jitter) {
  const mode = GAZES.includes(gaze) ? gaze : "scan";
  if (mode === "scan") delete root.dataset.gaze;
  else root.dataset.gaze = mode;
  const [from, to] = GAZE_HOLD[mode];
  const amount = Math.min(1, Math.max(0, Number(jitter) || 0));
  root.style.setProperty("--orbi-gaze-phase", String(from + (to - from) * amount));
  return mode;
}

/** `--orbi-look` (−1 links … 0 geradeaus … 1 rechts) trägt Blick, Biegung und
 *  Verkürzung der Augen. Nur registriert ist er eine Zahl, die die Animation
 *  stufenlos überblendet — per JS statt `@property`, weil das im Shadow-DOM
 *  des Chat-Widgets nicht greift. Ohne Registrierung springt der Blick. */
let lookRegistered = false;
function registerLookProperty() {
  if (lookRegistered) return;
  lookRegistered = true;
  try {
    globalThis.CSS?.registerProperty?.({ name: "--orbi-look", syntax: "<number>", inherits: true, initialValue: "1" });
  } catch {
    // schon registriert (zweites Bundle auf derselben Seite)
  }
}

/** Ein Auge aus fünf überlappenden Kapseln (Mitte, je zwei nach oben und
 *  unten). Die äußeren drehen verschachtelt um ihr Gelenk — die Biegung
 *  verteilt sich so auf vier Gelenke und läuft rund statt mit Knick. Oben
 *  zuletzt: die Glanzpunkte hängen an der obersten Kapsel und lägen sonst
 *  unter der mittleren. */
const EYE_CAPS = [50, 53.2, 56.4, 59.6, 62.8, 66];
function eyeCapsules(x, attributes = "", lights = "") {
  const capsule = (from, to) =>
    `<rect${attributes} x="${x}" y="${Number((from - 7).toFixed(2))}" width="14" height="${Number((to - from + 14).toFixed(2))}" rx="7"/>`;
  const [a, b, c, d, e, f] = EYE_CAPS;
  return capsule(c, d)
    + `<g class="orbi__eye-seg orbi__eye-seg--down">${capsule(d, e)}<g class="orbi__eye-seg orbi__eye-seg--down2">${capsule(e, f)}</g></g>`
    + `<g class="orbi__eye-seg orbi__eye-seg--up">${capsule(b, c)}<g class="orbi__eye-seg orbi__eye-seg--up2">${capsule(a, b)}${lights}</g></g>`;
}
const EYE_LIGHTS = (bigX, smallX) =>
  `<circle class="orbi__eye-light" cx="${bigX}" cy="49.6" r="2.2" opacity=".9"/>` +
  `<circle class="orbi__eye-light orbi__eye-light--small" cx="${smallX}" cy="52.8" r="1.45" opacity=".9"/>`;

export function createOrbi({ type = "tutor", id, gaze = "scan", gazeJitter = 0, blinkPhase = 0, smilePhase = 0 } = {}) {
  const instanceId = safeId(id || `orbi-${++instanceCounter}`);
  const ids = {
    clip: `${instanceId}-clip`,
    fill: `${instanceId}-fill`,
    glow: `${instanceId}-glow`,
    bandA: `${instanceId}-band-a`,
    bandB: `${instanceId}-band-b`,
    rim: `${instanceId}-rim`,
    shade: `${instanceId}-shade`,
    eyeShadow: `${instanceId}-eye-shadow`,
    blur: `${instanceId}-blur`,
    eyeGlow: `${instanceId}-eye-glow`,
    expressionGlow: `${instanceId}-expression-glow`,
  };

  const root = document.createElement("div");
  root.id = instanceId;
  root.setAttribute("role", "img");
  root.innerHTML = `
    <div class="orbi__shadow" aria-hidden="true"></div>
    <div class="orbi__actor">
      <svg class="orbi__svg" xmlns="http://www.w3.org/2000/svg" viewBox="20 20 88 88" aria-hidden="true">
        <defs>
          <clipPath id="${ids.clip}"><circle cx="64" cy="64" r="43"/></clipPath>
          <radialGradient id="${ids.fill}" cx="35%" cy="23%" r="78%">
            <stop class="orbi-color-fill-1" offset="0"/>
            <stop class="orbi-color-fill-2" offset=".25"/>
            <stop class="orbi-color-fill-3" offset=".56"/>
            <stop class="orbi-color-fill-4" offset="1"/>
          </radialGradient>
          <radialGradient id="${ids.glow}" cx="48%" cy="40%" r="58%">
            <stop offset=".58" stop-color="#fff" stop-opacity="0"/>
            <stop class="orbi-color-glow-2" offset=".82"/>
            <stop class="orbi-color-glow-3" offset="1"/>
          </radialGradient>
          <linearGradient id="${ids.bandA}" x1="8" y1="19" x2="119" y2="105">
            <stop class="orbi-color-band-a-1"/>
            <stop class="orbi-color-band-a-2" offset=".38"/>
            <stop class="orbi-color-band-a-3" offset=".72"/>
            <stop class="orbi-color-band-a-4" offset="1"/>
          </linearGradient>
          <linearGradient id="${ids.bandB}" x1="7" y1="100" x2="118" y2="27">
            <stop class="orbi-color-band-b-1"/>
            <stop class="orbi-color-band-b-2" offset=".36"/>
            <stop class="orbi-color-band-b-3" offset=".77"/>
            <stop offset="1" stop-color="#fff" stop-opacity=".5"/>
          </linearGradient>
          <linearGradient id="${ids.rim}" x1="28" y1="28" x2="102" y2="104">
            <stop offset="0" stop-color="#fff" stop-opacity=".34"/>
            <stop class="orbi-color-rim-2" offset=".42"/>
            <stop class="orbi-color-rim-3" offset=".72"/>
            <stop offset="1" stop-color="#fff" stop-opacity=".12"/>
          </linearGradient>
          <!-- Kugel-Schattierung (Vorlage orbi-end-3d.svg): Licht von oben links,
               zum Rand hin dunkler, unten rechts am meisten. Farbe = Augenfarbe
               der Variante, damit jede Palette ihren eigenen Schatten bekommt. -->
          <radialGradient id="${ids.shade}" cx="42%" cy="37%" r="66%">
            <stop class="orbi-color-shade" offset=".6" stop-opacity="0"/>
            <stop class="orbi-color-shade" offset=".84" stop-opacity=".16"/>
            <stop class="orbi-color-shade" offset="1" stop-opacity=".46"/>
          </radialGradient>
          <filter id="${ids.eyeShadow}" x="-60%" y="-30%" width="220%" height="160%">
            <feGaussianBlur stdDeviation="1.5"/>
          </filter>
          <filter id="${ids.blur}" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8"/>
          </filter>
          <filter id="${ids.eyeGlow}" filterUnits="userSpaceOnUse" x="28" y="32" width="72" height="68" color-interpolation-filters="sRGB">
            <feGaussianBlur stdDeviation="2.4" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="${ids.expressionGlow}" filterUnits="userSpaceOnUse" x="34" y="30" width="60" height="66" color-interpolation-filters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.7" result="expressionHalo"/>
            <feComponentTransfer in="expressionHalo" result="softExpressionHalo">
              <feFuncA type="linear" slope=".78"/>
            </feComponentTransfer>
            <feGaussianBlur in="SourceGraphic" stdDeviation=".28" result="softExpression"/>
            <feMerge><feMergeNode in="softExpressionHalo"/><feMergeNode in="softExpression"/></feMerge>
          </filter>
        </defs>

        <g clip-path="url(#${ids.clip})">
          <circle cx="64" cy="64" r="43" fill="url(#${ids.fill})"/>
          <g class="orbi__spin-a" filter="url(#${ids.blur})" opacity=".94">
            <ellipse cx="60" cy="42" rx="60" ry="22" fill="url(#${ids.bandA})" transform="rotate(15 64 64)"/>
            <ellipse cx="69" cy="82" rx="65" ry="25" fill="url(#${ids.bandB})" transform="rotate(-12 64 64)"/>
            <path fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="10" stroke-linecap="round"
              d="M7 73c20-20 39-18 58-6 20 13 37 12 57-10"/>
          </g>
          <g class="orbi__spin-b" filter="url(#${ids.blur})" opacity=".72">
            <ellipse class="orbi__solid-a" cx="43" cy="67" rx="57" ry="18" opacity=".62" transform="rotate(-31 64 64)"/>
            <ellipse class="orbi__solid-b" cx="85" cy="61" rx="55" ry="17" opacity=".54" transform="rotate(27 64 64)"/>
            <path class="orbi__wave" fill="none" stroke-opacity=".42" stroke-width="14" stroke-linecap="round"
              d="M-2 52c28 18 47 19 72 2 18-12 33-13 60-1"/>
          </g>
          <circle class="orbi__glow" cx="64" cy="64" r="42.5" fill="url(#${ids.glow})" opacity=".48"/>
          <circle class="orbi__shade" cx="64" cy="64" r="43" fill="url(#${ids.shade})"/>
          <circle class="orbi__interaction-tint" cx="64" cy="64" r="43" aria-hidden="true"/>

          <g class="orbi__gaze">
            <g class="orbi__eyes" filter="url(#${ids.eyeGlow})">
              <g class="orbi__eyes-open">
                <g class="orbi__blink">
                  <g class="orbi__eye-unit orbi__eye-unit--left">
                    <!-- kleiner Schatten unter dem Auge, nach unten rechts versetzt -->
                    <g class="orbi__eye-shadow" transform="translate(1.3 2)" filter="url(#${ids.eyeShadow})">${eyeCapsules(45)}</g>
                    ${eyeCapsules(45, ' class="orbi__eye"', EYE_LIGHTS(49.6, 54.2))}
                  </g>
                  <g class="orbi__eye-unit orbi__eye-unit--right">
                    <g class="orbi__eye-shadow" transform="translate(1.3 2)" filter="url(#${ids.eyeShadow})">${eyeCapsules(69)}</g>
                    ${eyeCapsules(69, ' class="orbi__eye"', EYE_LIGHTS(73.6, 78.2))}
                  </g>
                </g>
              </g>
              <g class="orbi__eyes-smile" fill="none" stroke-width="5" stroke-linecap="round">
                <path d="M45 63c3.5-7.5 10.5-7.5 14 0"/>
                <path d="M69 63c3.5-7.5 10.5-7.5 14 0"/>
              </g>
              <g class="orbi__eyes-sleep" fill="none" stroke-width="4.6" stroke-linecap="round">
                <path d="M45 57c3.5 7.5 10.5 7.5 14 0"/>
                <path d="M69 57c3.5 7.5 10.5 7.5 14 0"/>
              </g>
            </g>
          </g>

          <g class="orbi__play-icon" filter="url(#${ids.eyeGlow})" aria-hidden="true">
            <path class="orbi__play-icon-triangle"
              d="M56 47.5c-1.6-.9-3.5.25-3.5 2.1v28.8c0 1.9 2 3 3.6 2.05L80.4 66.1c1.6-.95 1.6-3.25 0-4.2Z"/>
          </g>

          <g class="orbi__stop-icon" filter="url(#${ids.eyeGlow})" aria-hidden="true">
            <rect class="orbi__stop-icon-square" x="51" y="51" width="26" height="26" rx="5.2"/>
          </g>

          <g class="orbi__gaze" aria-hidden="true">
            <g class="orbi__expression-layer" filter="url(#${ids.expressionGlow})" stroke="var(--orbi-eye)" stroke-linecap="round" stroke-linejoin="round">
              <g class="orbi__brows" fill="none" stroke-width="3.2">
                <path class="orbi__brow-left" d="M44 37.5c5-3.5 11-3.5 16 0"/>
                <path class="orbi__brow-right" d="M68 37.5c5-3.5 11-3.5 16 0"/>
              </g>
              <path class="orbi__mouth-flat" d="M59.5 82h9" fill="none" stroke-width="3.4"/>
              <path class="orbi__mouth-frown" d="M57 85c4-5 10-5 14 0" fill="none" stroke-width="3.8"/>
              <ellipse class="orbi__mouth-whistle" cx="64" cy="82" rx="3.8" ry="4.8" fill="none" stroke-width="3.2"/>
              <circle class="orbi__mouth-whistle-closed" cx="64" cy="82" r="4.2" fill="var(--orbi-eye)" stroke="none"/>
              <path class="orbi__mouth-party" d="M56.5 80.5c4.5 7 10.5 7 15 0" fill="none" stroke-width="4"/>
            </g>
          </g>
        </g>

        <circle cx="64" cy="64" r="43" fill="none" stroke="url(#${ids.rim})" stroke-width="1.1"/>
        <g class="orbi__rambo-headband" aria-hidden="true">
          <path class="orbi__rambo-band" d="M31 48c18-5 43-5 66 0"/>
          <circle class="orbi__rambo-knot" cx="96.5" cy="47.5" r="3.8"/>
          <path class="orbi__rambo-tail" d="M98 49c8 2 11 7 13 12M98 48c8-3 12-1 17 3"/>
        </g>
        <g class="orbi__rambo-gun-angle" transform="translate(-8 0) rotate(12 42 69)" aria-hidden="true">
        <g class="orbi__rambo-gun orbi__rambo-gun--left">
          <path class="orbi__rambo-barrel" d="M44 67H8"/>
          <path class="orbi__rambo-body" d="M47 62H27c-2 0-3.5 1.8-3.5 4v8h22.3c2 0 3.2-1.5 3.2-3.4V65c0-1.7-.8-3-2-3Z"/>
          <path class="orbi__rambo-highlight" d="M29 65h14M14 64h15"/>
          <path class="orbi__rambo-grip" d="m41 73-2 11h-8l3-11"/>
          <path class="orbi__rambo-mag" d="m29 73-5 10h-8l6-10"/>
          <g class="orbi__rambo-flash orbi__rambo-flash--left">
            <path d="m8 68-8-6 2 7-7 3 8 1-2 8 7-7 5 4-1-7 6-3-7-2 1-7Z"/>
          </g>
        </g>
        </g>
        <g class="orbi__rambo-gun-angle" transform="translate(8 0) rotate(-12 86 69)" aria-hidden="true">
        <g class="orbi__rambo-gun orbi__rambo-gun--right">
          <path class="orbi__rambo-barrel" d="M84 67h36"/>
          <path class="orbi__rambo-body" d="M81 62h20c2 0 3.5 1.8 3.5 4v8H82.2c-2 0-3.2-1.5-3.2-3.4V65c0-1.7.8-3 2-3Z"/>
          <path class="orbi__rambo-highlight" d="M85 65h14m0-1h15"/>
          <path class="orbi__rambo-grip" d="m87 73 2 11h8l-3-11"/>
          <path class="orbi__rambo-mag" d="m99 73 5 10h8l-6-10"/>
          <g class="orbi__rambo-flash orbi__rambo-flash--right">
            <path d="m120 68 8-6-2 7 7 3-8 1 2 8-7-7-5 4 1-7-6-3 7-2-1-7Z"/>
          </g>
        </g>
        </g>
        <g class="orbi__party-hat" aria-hidden="true">
          <path d="M48 43 62 21 74 44Z" fill="var(--orbi-fill-3)" stroke="var(--orbi-eye)" stroke-opacity=".45" stroke-width="1.2"/>
          <path d="M52 38 68 31M56 30l12 10" fill="none" stroke="#fff" stroke-opacity=".72" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="62" cy="22" r="4.2" fill="var(--orbi-band-b-2)" stroke="#fff" stroke-opacity=".65" stroke-width="1.2"/>
        </g>
        <g class="orbi__shine" clip-path="url(#${ids.clip})">
          <path fill="#fff" fill-opacity=".26" filter="url(#${ids.blur})"
            d="M33 34c17-12 45-13 66 2 9 7 12 15 8 23-18-19-46-26-77-14z"/>
          <ellipse cx="89" cy="49" rx="12" ry="20" fill="#fff" opacity=".32"
            transform="rotate(-45 89 49)" filter="url(#${ids.blur})"/>
        </g>
      </svg>
    </div>`;

  applyOrbiType(root, type);
  registerLookProperty();
  applyGaze(root, gaze, gazeJitter);
  applyIdlePhases(root, blinkPhase, smilePhase);

  const elements = {
    root,
    actor: root.querySelector(".orbi__actor"),
    shadow: root.querySelector(".orbi__shadow"),
    svg: root.querySelector(".orbi__svg"),
    eyes: root.querySelector(".orbi__eyes"),
    surfaceA: root.querySelector(".orbi__spin-a"),
    surfaceB: root.querySelector(".orbi__spin-b"),
    openEyes: root.querySelector(".orbi__eyes-open"),
    smileEyes: root.querySelector(".orbi__eyes-smile"),
    sleepEyes: root.querySelector(".orbi__eyes-sleep"),
    playIcon: root.querySelector(".orbi__play-icon"),
    stopIcon: root.querySelector(".orbi__stop-icon"),
    interactionTint: root.querySelector(".orbi__interaction-tint"),
    blink: root.querySelector(".orbi__blink"),
    brows: root.querySelector(".orbi__brows"),
    browLeft: root.querySelector(".orbi__brow-left"),
    browRight: root.querySelector(".orbi__brow-right"),
    mouthFlat: root.querySelector(".orbi__mouth-flat"),
    mouthFrown: root.querySelector(".orbi__mouth-frown"),
    mouthWhistle: root.querySelector(".orbi__mouth-whistle"),
    mouthWhistleClosed: root.querySelector(".orbi__mouth-whistle-closed"),
    mouthParty: root.querySelector(".orbi__mouth-party"),
    partyHat: root.querySelector(".orbi__party-hat"),
    ramboHeadband: root.querySelector(".orbi__rambo-headband"),
    ramboGunLeft: root.querySelector(".orbi__rambo-gun--left"),
    ramboGunRight: root.querySelector(".orbi__rambo-gun--right"),
    ramboFlashLeft: root.querySelector(".orbi__rambo-flash--left"),
    ramboFlashRight: root.querySelector(".orbi__rambo-flash--right"),
    glow: root.querySelector(".orbi__glow"),
    shine: root.querySelector(".orbi__shine"),
  };

  return {
    id: instanceId,
    root,
    elements,
    get type() { return root.dataset.type; },
    get config() { return getOrbiType(root.dataset.type); },
    setType(nextType) { return applyOrbiType(root, nextType); },
    get gaze() { return root.dataset.gaze || "scan"; },
    /** `scan` = Pendel links/rechts im Wechsel; `left`/`right`/`center` =
     *  bleibt dort und schaut nur selten kurz weg. `jitter` 0–1 verschiebt den
     *  Startpunkt innerhalb der Haltephase. */
    setGaze(nextGaze, jitter = 0) { return applyGaze(root, nextGaze, jitter); },
  };
}
