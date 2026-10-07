// Orbi in der Sync-Grafik der Startseite: hüpft zweimal kurz, Pause – in Schleife (kein Nachdenken, Wunsch des Nutzers).
// Module aus dem orbi-animation-lab; Augen, Blinzeln und Lichtbänder laufen per CSS ohnehin.
import { createOrbi } from "./core/orbi.js?v=0.10.0";
import { createPersonalityEffects } from "./core/personality-effects.js?v=0.11.1";
import { OrbiController } from "./core/controller.js?v=0.11.0";
import * as hopSmall from "./sequences/hop-small/sequence.js?v=1";

const stage = document.querySelector("[data-orbi-sync]");
if (stage) {
  const mount = stage.querySelector(".orbi-mount");
  const orbi = createOrbi({ type: "tutor", id: "sync-orbi" });
  const effects = createPersonalityEffects({ type: "tutor", id: "sync-orbi-effects" });
  mount.appendChild(orbi.root);
  mount.after(effects.root);
  const controller = new OrbiController(orbi, new Map([[hopSmall.meta.id, hopSmall]]));
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let running = false;
  const start = () => {
    if (running || reduce) return;
    running = true;
    controller.queue([
      { name: hopSmall.meta.id, pauseAfter: 120 },
      { name: hopSmall.meta.id, pauseAfter: 3400 },
    ], { loop: Infinity }).catch(() => {}).finally(() => { running = false; });
  };
  const stop = () => { if (running) controller.stop(); running = false; };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.3 }).observe(stage);
  } else {
    start();
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
}
