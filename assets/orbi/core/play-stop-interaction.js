import {
  createPlayButtonFrames,
  createPlayButtonReturnFrames,
  createPlayToStopFrames,
  createStopHoverFrames,
  createStopResetFrames,
} from "./play-button-keyframes.js?v=0.2.0";

const TARGETS = Object.freeze({
  eyes: "eyes",
  play: "playIcon",
  stop: "stopIcon",
  tint: "interactionTint",
});

function requestEvent(root, type) {
  root.dispatchEvent(new CustomEvent(type, {
    bubbles: true,
    composed: true,
    detail: { orbiId: root.id, sequence: "play-button" },
  }));
}

export function runPlayStopInteraction({ root, elements, animate, signal }) {
  const required = [elements.eyes, elements.playIcon, elements.stopIcon, elements.interactionTint];
  if (required.some((element) => !element)) {
    throw new Error("Die Play-/Stop-Interaktion benötigt Augen, Play-, Stop-Symbol und Farbebene im Orbi-SVG.");
  }

  const originalAccessibility = {
    role: root.getAttribute("role"),
    label: root.getAttribute("aria-label"),
    tabindex: root.getAttribute("tabindex"),
  };

  return new Promise((resolve) => {
    let state = "idle";
    let settled = false;
    let activeAnimations = [];

    const setState = (nextState) => {
      state = nextState;
      root.dataset.playStopState = nextState;
      root.setAttribute("aria-label", nextState.startsWith("stop") ? "Orbi Stop" : "Orbi Play");
      root.dispatchEvent(new CustomEvent("orbi-interaction-state", {
        bubbles: true,
        detail: { state: nextState },
      }));
    };

    const playFrames = (frameMap, duration) => {
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations = Object.entries(frameMap).map(([channel, frames]) => animate(
        elements[TARGETS[channel]],
        frames,
        { duration, easing: "linear", transient: true },
      ));
      return Promise.allSettled(activeAnimations.map(({ finished }) => finished));
    };

    const cleanup = () => {
      root.removeEventListener("pointerenter", onPointerEnter);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("click", onActivate);
      root.removeEventListener("keydown", onKeyDown);
      signal.removeEventListener("abort", finish);
      root.removeAttribute("data-play-stop-state");
      Object.entries(originalAccessibility).forEach(([attribute, value]) => {
        const name = attribute === "label" ? "aria-label" : attribute;
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
      });
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const onPointerEnter = () => {
      if (state === "idle") {
        setState("play-hover");
        playFrames(createPlayButtonFrames(), 420);
      } else if (state === "stop") {
        setState("stop-hover");
        playFrames(createStopHoverFrames(true), 220);
      }
    };

    const onPointerLeave = () => {
      if (state === "play-hover") {
        setState("idle");
        playFrames(createPlayButtonReturnFrames(), 360);
      } else if (state === "stop-hover") {
        setState("stop");
        playFrames(createStopHoverFrames(false), 220);
      }
    };

    const onActivate = () => {
      if (state === "idle" || state === "play-hover") {
        setState("stop");
        requestEvent(root, "orbi-play-request");
        playFrames(createPlayToStopFrames(), 460).then(() => {
          if (!signal.aborted && state === "stop" && root.matches(":hover")) {
            setState("stop-hover");
            playFrames(createStopHoverFrames(true), 220);
          }
        });
        return;
      }
      if (state === "stop" || state === "stop-hover") {
        state = "resetting";
        root.dataset.playStopState = state;
        requestEvent(root, "orbi-stop-request");
        playFrames(createStopResetFrames(), 500).then(() => {
          if (!signal.aborted) finish();
        });
      }
    };

    const onKeyDown = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onActivate();
    };

    root.setAttribute("role", "button");
    root.setAttribute("tabindex", "0");
    root.addEventListener("pointerenter", onPointerEnter);
    root.addEventListener("pointerleave", onPointerLeave);
    root.addEventListener("click", onActivate);
    root.addEventListener("keydown", onKeyDown);
    signal.addEventListener("abort", finish, { once: true });
    setState("idle");
  });
}
