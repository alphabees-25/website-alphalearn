export const ORBI_TYPES = Object.freeze({
  tutor: {
    label: "Tutor",
    personality: "zugewandt · verspielt",
    timing: { spinA: "11s", spinB: "15s", scan: "2.6s", blink: "7s" },
    colors: {
      fill1: "#ffffff", fill2: "#ffc8ff", fill3: "#9f8cff", fill4: "#5b6dff",
      glow2: "#f5c6ff", glow3: "#84a2ff",
      bandA1: "#fff4ff", bandA2: "#ff83f3", bandA3: "#8e84ff", bandA4: "#65e2ff",
      bandB1: "#ffc8f7", bandB2: "#8a83ff", bandB3: "#69bfff",
      rim2: "#ffc2ff", rim3: "#97a8ff",
      solidA: "#ff8bf6", solidB: "#68dbff", wave: "#756fff", eye: "#2e1b6b",
    },
  },
  twin: {
    label: "Twin",
    personality: "bedächtig · fokussiert",
    timing: { spinA: "14s", spinB: "19s", scan: "3.8s", blink: "9s" },
    colors: {
      fill1: "#ffffff", fill2: "#cbd8ff", fill3: "#5b78e8", fill4: "#16268f",
      glow2: "#b4c8ff", glow3: "#2f4ad8",
      bandA1: "#ecf2ff", bandA2: "#4f74e8", bandA3: "#1f34ac", bandA4: "#2f8ce0",
      bandB1: "#bccdff", bandB2: "#2438c4", bandB3: "#3f7de8",
      rim2: "#bacaff", rim3: "#5f7ff0",
      solidA: "#3a56e0", solidB: "#2f86e0", wave: "#1d2fa8", eye: "#0a1550",
    },
  },
  support: {
    label: "Support",
    personality: "wach · reaktiv",
    timing: { spinA: "7s", spinB: "10s", scan: "1.4s", blink: "4.5s" },
    colors: {
      fill1: "#ffffff", fill2: "#c4fff2", fill3: "#5fd4d8", fill4: "#12a5b8",
      glow2: "#b4fff0", glow3: "#31c2c8",
      bandA1: "#f0fffa", bandA2: "#4fe0c8", bandA3: "#2bb8c4", bandA4: "#8df0b8",
      bandB1: "#c0fff0", bandB2: "#22a8c0", bandB3: "#5fe6d4",
      rim2: "#bcfff0", rim3: "#68d4dc",
      solidA: "#4fe8d0", solidB: "#2f9fc8", wave: "#28b4c0", eye: "#0c3a45",
    },
  },
  assist: {
    label: "Assist",
    personality: "organisiert · lebendig",
    timing: { spinA: "9s", spinB: "13s", scan: "2.2s", blink: "6s" },
    colors: {
      fill1: "#ffffff", fill2: "#ffe6c4", fill3: "#ffab6a", fill4: "#ef6a4c",
      glow2: "#ffdcb0", glow3: "#ff9256",
      bandA1: "#fff8ec", bandA2: "#ffb054", bandA3: "#f87a5e", bandA4: "#ffd77a",
      bandB1: "#ffe0bc", bandB2: "#f5834e", bandB3: "#ffc24e",
      rim2: "#ffd6b4", rim3: "#ffa878",
      solidA: "#e0492f", solidB: "#ffdc5e", wave: "#d8412e", eye: "#5a2412",
    },
  },
  flexible: {
    label: "Flexible",
    personality: "wandlungsfähig · ruhig",
    timing: { spinA: "12s", spinB: "17s", scan: "3.2s", blink: "8s" },
    colors: {
      fill1: "#ffffff", fill2: "#e8d0ff", fill3: "#7c4ddb", fill4: "#3b1e8f",
      glow2: "#dcc0ff", glow3: "#6b35d8",
      bandA1: "#f8f0ff", bandA2: "#c060ff", bandA3: "#6a3ad0", bandA4: "#4a7cff",
      bandB1: "#e4ccff", bandB2: "#5a2fc0", bandB3: "#9a5cf0",
      rim2: "#e0c8ff", rim3: "#a68cff",
      solidA: "#b44df0", solidB: "#6a4ce8", wave: "#4a22b0", eye: "#200a52",
    },
  },
});

const COLOR_VARIABLES = {
  fill1: "--orbi-fill-1", fill2: "--orbi-fill-2", fill3: "--orbi-fill-3", fill4: "--orbi-fill-4",
  glow2: "--orbi-glow-2", glow3: "--orbi-glow-3",
  bandA1: "--orbi-band-a-1", bandA2: "--orbi-band-a-2", bandA3: "--orbi-band-a-3", bandA4: "--orbi-band-a-4",
  bandB1: "--orbi-band-b-1", bandB2: "--orbi-band-b-2", bandB3: "--orbi-band-b-3",
  rim2: "--orbi-rim-2", rim3: "--orbi-rim-3",
  solidA: "--orbi-solid-a", solidB: "--orbi-solid-b", wave: "--orbi-wave", eye: "--orbi-eye",
};

export function getOrbiType(type) {
  return ORBI_TYPES[type] || ORBI_TYPES.tutor;
}

export function applyOrbiType(element, type) {
  const config = getOrbiType(type);
  element.dataset.type = type in ORBI_TYPES ? type : "tutor";
  element.className = `orbi orbi--${element.dataset.type}`;

  Object.entries(COLOR_VARIABLES).forEach(([key, variable]) => {
    element.style.setProperty(variable, config.colors[key]);
  });

  element.style.setProperty("--orbi-spin-a-duration", config.timing.spinA);
  element.style.setProperty("--orbi-spin-b-duration", config.timing.spinB);
  element.style.setProperty("--orbi-scan-duration", config.timing.scan);
  element.style.setProperty("--orbi-blink-duration", config.timing.blink);
  element.setAttribute("aria-label", `Orbi ${config.label}`);
  return config;
}
