// Orbis auf der Website: Platzhalter <div class="orbi-host agent-…"> werden mit
// dem Orbi aus dem Lab gefüllt (orbi.js, palettes.js, orbi.css sind unveränderte
// Kopien aus AlphaTutor/tools/orbi-animation-lab/core vom 06.11.2026 — dort ändern, dann neu kopieren;
// ../core ist eine ältere Lab-Kopie für Startseite und 404).
// Wie auf den Agent-Kacheln im Portal: Blickrichtung, Versatz, Blinzeln und
// Lachen je Orbi zufällig, damit nebeneinander stehende Orbis nicht im Gleichtakt laufen.
import { createOrbi } from "./orbi.js";

const TYPES = { tutor: "tutor", dozent: "twin", twin: "twin", support: "support", assist: "assist" };
const GAZES = ["left", "right", "center"];

function typeOf(host) {
  const match = host.className.match(/\bagent-([a-z]+)/);
  return (match && TYPES[match[1]]) || "tutor";
}

function hydrate(host) {
  if (host.firstElementChild) return;
  const orbi = createOrbi({
    type: typeOf(host),
    gaze: GAZES[Math.floor(Math.random() * GAZES.length)],
    gazeJitter: Math.random(),
    blinkPhase: Math.random(),
    smilePhase: Math.random(),
  });
  host.appendChild(orbi.root);
}

function scan(node) {
  if (node.nodeType !== 1) return;
  if (node.classList.contains("orbi-host")) hydrate(node);
  node.querySelectorAll(".orbi-host").forEach(hydrate);
}

scan(document.body);
// Das Konfigurations-Band tauscht Orbis aus <template>s ein — die kommen leer an.
new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach(scan)))
  .observe(document.body, { childList: true, subtree: true });
