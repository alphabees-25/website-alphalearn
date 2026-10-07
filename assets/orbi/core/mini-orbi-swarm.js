import { createOrbi } from "./orbi.js?v=0.9.12";
import { getOrbiType } from "./palettes.js?v=0.3.0";
import { MINI_ORBI_SIZES } from "./split-swarm-keyframes.js?v=0.8.0";

export function createMiniOrbiSwarm({ type = "tutor", id = "orbi-mini-swarm" } = {}) {
  const root = document.createElement("div");
  root.id = id;
  root.className = "mini-orbi-swarm";
  root.setAttribute("aria-hidden", "true");

  const colors = getOrbiType(type).colors;
  root.style.setProperty("--swarm-color-a", colors.bandA2);
  root.style.setProperty("--swarm-color-b", colors.bandB3);
  root.style.setProperty("--swarm-color-c", colors.fill3);

  const ring = document.createElement("div");
  ring.className = "mini-orbi-swarm__ring";
  root.appendChild(ring);

  const sparks = Array.from({ length: 12 }, (_, index) => {
    const spark = document.createElement("i");
    spark.className = "mini-orbi-swarm__spark";
    spark.style.setProperty("--spark-color", `var(--swarm-color-${["a", "b", "c"][index % 3]})`);
    spark.style.setProperty("--spark-length", `${8 + (index % 4) * 3}px`);
    root.appendChild(spark);
    return spark;
  });

  const shadows = [];
  const bodies = MINI_ORBI_SIZES.map((size, index) => {
    const shadow = document.createElement("div");
    shadow.className = "mini-orbi__shadow";
    shadow.dataset.miniIndex = String(index);
    root.appendChild(shadow);
    shadows.push(shadow);

    const body = document.createElement("div");
    body.className = "mini-orbi__body";
    body.dataset.miniIndex = String(index);
    body.style.setProperty("--mini-orbi-size", `${size}px`);

    const mini = createOrbi({ type, id: `${id}-${index + 1}` });
    mini.root.classList.add("orbi--mini");
    mini.root.dataset.performing = "true";
    mini.root.removeAttribute("role");
    mini.root.setAttribute("aria-hidden", "true");
    body.appendChild(mini.root);
    root.appendChild(body);
    return body;
  });

  return { root, bodies, shadows, ring, sparks };
}
