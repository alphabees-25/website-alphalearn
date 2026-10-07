import { applyOrbiType, getOrbiType } from "./palettes.js";

let instanceCounter = 0;

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function createOrbi({ type = "tutor", id } = {}) {
  const instanceId = safeId(id || `orbi-${++instanceCounter}`);
  const ids = {
    clip: `${instanceId}-clip`,
    fill: `${instanceId}-fill`,
    glow: `${instanceId}-glow`,
    bandA: `${instanceId}-band-a`,
    bandB: `${instanceId}-band-b`,
    rim: `${instanceId}-rim`,
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
          <filter id="${ids.blur}" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8"/>
          </filter>
          <filter id="${ids.eyeGlow}" filterUnits="userSpaceOnUse" x="28" y="32" width="72" height="68" color-interpolation-filters="sRGB">
            <feGaussianBlur stdDeviation="2.4" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="${ids.expressionGlow}" filterUnits="userSpaceOnUse" x="34" y="34" width="60" height="62" color-interpolation-filters="sRGB">
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
          <circle class="orbi__interaction-tint" cx="64" cy="64" r="43" aria-hidden="true"/>

          <g class="orbi__eyes" filter="url(#${ids.eyeGlow})">
            <g class="orbi__eyes-open">
              <g class="orbi__blink">
                <rect class="orbi__eye" x="47" y="50" width="10" height="26" rx="5"/>
                <rect class="orbi__eye" x="71" y="50" width="10" height="26" rx="5"/>
                <circle class="orbi__eye-light" cx="50.5" cy="56" r="1.7" opacity=".72"/>
                <circle class="orbi__eye-light" cx="74.5" cy="56" r="1.7" opacity=".72"/>
              </g>
            </g>
            <g class="orbi__eyes-smile" fill="none" stroke-width="5" stroke-linecap="round">
              <path d="M47 68c2.5-6 7.5-6 10 0"/>
              <path d="M71 68c2.5-6 7.5-6 10 0"/>
            </g>
            <g class="orbi__eyes-sleep" fill="none" stroke-width="4.6" stroke-linecap="round">
              <path d="M47 62c2.5 6 7.5 6 10 0"/>
              <path d="M71 62c2.5 6 7.5 6 10 0"/>
            </g>
          </g>

          <g class="orbi__play-icon" filter="url(#${ids.eyeGlow})" aria-hidden="true">
            <path class="orbi__play-icon-triangle"
              d="M56 47.5c-1.6-.9-3.5.25-3.5 2.1v28.8c0 1.9 2 3 3.6 2.05L80.4 66.1c1.6-.95 1.6-3.25 0-4.2Z"/>
          </g>

          <g class="orbi__stop-icon" filter="url(#${ids.eyeGlow})" aria-hidden="true">
            <rect class="orbi__stop-icon-square" x="51" y="51" width="26" height="26" rx="5.2"/>
          </g>

          <g class="orbi__expression-layer" filter="url(#${ids.expressionGlow})" stroke="var(--orbi-eye)" stroke-linecap="round" stroke-linejoin="round">
            <g class="orbi__brows" fill="none" stroke-width="3.2">
              <path class="orbi__brow-left" d="M45 46.5c4-3 8-3 12 0"/>
              <path class="orbi__brow-right" d="M71 46.5c4-3 8-3 12 0"/>
            </g>
            <path class="orbi__mouth-flat" d="M59.5 82h9" fill="none" stroke-width="3.4"/>
            <path class="orbi__mouth-frown" d="M57 85c4-5 10-5 14 0" fill="none" stroke-width="3.8"/>
            <ellipse class="orbi__mouth-whistle" cx="64" cy="82" rx="3.8" ry="4.8" fill="none" stroke-width="3.2"/>
            <circle class="orbi__mouth-whistle-closed" cx="64" cy="82" r="4.2" fill="var(--orbi-eye)" stroke="none"/>
            <path class="orbi__mouth-party" d="M56.5 80.5c4.5 7 10.5 7 15 0" fill="none" stroke-width="4"/>
          </g>
        </g>

        <circle cx="64" cy="64" r="43" fill="none" stroke="url(#${ids.rim})" stroke-width="1.1"/>
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
  };
}
