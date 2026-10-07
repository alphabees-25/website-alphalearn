const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeQueueSteps(sequenceSteps) {
  const input = Array.isArray(sequenceSteps) ? sequenceSteps : [sequenceSteps];
  if (input.length === 0) throw new RangeError("Eine Orbi-Queue benötigt mindestens einen Schritt.");

  return input.map((entry, index) => {
    const step = typeof entry === "string" ? { name: entry } : entry;
    if (!step || typeof step !== "object" || typeof step.name !== "string" || !step.name.trim()) {
      throw new TypeError(`Ungültiger Orbi-Queue-Schritt an Position ${index + 1}.`);
    }

    return Object.freeze({
      name: step.name.trim(),
      repeat: clamp(Math.floor(Number(step.repeat) || 1), 1, 20),
      speed: clamp(Number(step.speed) || 1, .25, 3),
      pauseAfter: clamp(Math.floor(Number(step.pauseAfter) || 0), 0, 5000),
    });
  });
}

export class OrbiController extends EventTarget {
  #orbi;
  #registry;
  #active = null;
  #queueing = false;
  #cancelPause = null;
  #runId = 0;
  #retainedAnimations = new Set();

  constructor(orbi, registry) {
    super();
    this.#orbi = orbi;
    this.#registry = registry;
  }

  get orbi() { return this.#orbi; }
  get currentSequence() { return this.#active?.name || null; }
  get isPlaying() { return this.#queueing; }

  notify(signalName, detail = null) {
    if (typeof signalName !== "string" || !signalName.trim()) {
      throw new TypeError("Ein externes Orbi-Signal benötigt einen Namen.");
    }
    this.#emit("external-signal", { name: signalName.trim(), detail });
  }

  play(name, options = {}) {
    return this.queue([name], options);
  }

  async queue(sequenceSteps, { loop = 1 } = {}) {
    const steps = normalizeQueueSteps(sequenceSteps);
    steps.forEach(({ name }) => {
      if (!this.#registry.has(name)) throw new Error(`Unbekannte Orbi-Sequenz: ${name}`);
    });

    this.stop();
    const runId = ++this.#runId;
    const cycles = loop === Infinity ? Infinity : Math.max(1, Number(loop) || 1);
    const names = steps.map(({ name }) => name);
    let cycle = 0;
    this.#queueing = true;

    this.#emit("queue-start", { names, steps, loop: cycles });

    try {
      while (runId === this.#runId && (cycles === Infinity || cycle < cycles)) {
        for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
          const step = steps[stepIndex];
          for (let repeatIndex = 0; repeatIndex < step.repeat; repeatIndex += 1) {
            if (runId !== this.#runId) return;
            await this.#runSequence(step, runId, cycle, stepIndex, repeatIndex);
          }
          if (step.pauseAfter > 0 && runId === this.#runId) {
            this.#emit("step-pause", { step, stepIndex, cycle });
            await this.#pause(step.pauseAfter);
          }
        }
        cycle += 1;
      }
      if (runId === this.#runId) this.#emit("queue-end", { names, steps, cycles: cycle });
    } finally {
      if (runId === this.#runId) {
        this.#queueing = false;
        this.#resetRoot();
      }
    }
  }

  stop() {
    const wasPlaying = this.#queueing || Boolean(this.#active) || this.#retainedAnimations.size > 0;
    this.#runId += 1;
    this.#queueing = false;
    this.#cancelPause?.();
    this.#cancelPause = null;
    if (this.#active) {
      this.#active.abortController.abort();
      this.#active.animations.forEach((animation) => animation.cancel());
      this.#active = null;
    }
    this.#releaseRetainedAnimations();
    if (wasPlaying) this.#emit("stop", {});
    this.#resetRoot();
  }

  async #runSequence(step, runId, cycle, stepIndex, repeatIndex) {
    const { name, speed } = step;
    const definition = this.#registry.get(name);
    this.#releaseRetainedAnimations();
    const abortController = new AbortController();
    const animations = new Set();
    this.#active = { name, step, animations, abortController };

    const { root, elements } = this.#orbi;
    const stage = root.closest(".stage");
    const scene = {
      stage,
      holeBack: stage?.querySelector("#orbi-hole-back") || null,
      holeFront: stage?.querySelector("#orbi-hole-front") || null,
      groundCover: stage?.querySelector("#stage-ground-cover") || null,
      speedLinesBack: stage?.querySelector("#spin-speed-lines-back") || null,
      speedLinesFront: stage?.querySelector("#spin-speed-lines-front") || null,
      speedLinePathsBack: Array.from(stage?.querySelectorAll("#spin-speed-lines-back .stage-speed-line") || []),
      speedLinePathsFront: Array.from(stage?.querySelectorAll("#spin-speed-lines-front .stage-speed-line") || []),
      miniSwarm: stage?.querySelector(".mini-orbi-swarm") || null,
      miniBodies: Array.from(stage?.querySelectorAll(".mini-orbi__body") || []),
      miniShadows: Array.from(stage?.querySelectorAll(".mini-orbi__shadow") || []),
      swarmRing: stage?.querySelector(".mini-orbi-swarm__ring") || null,
      swarmSparks: Array.from(stage?.querySelectorAll(".mini-orbi-swarm__spark") || []),
      thoughtBubble: stage?.querySelector(".orbi-thought-bubble") || null,
      thoughtDots: Array.from(stage?.querySelectorAll(".orbi-thought-bubble i") || []),
      confettiParticles: Array.from(stage?.querySelectorAll(".orbi-confetti-particle") || []),
      whistleNotes: Array.from(stage?.querySelectorAll(".orbi-whistle-note") || []),
      sleepZs: Array.from(stage?.querySelectorAll(".orbi-sleep-z") || []),
      tryMeBubble: stage?.querySelector(".orbi-try-me-bubble") || null,
      growthTraits: Array.from(stage?.querySelectorAll(".orbi-growth-trait") || []),
      effectsRoot: stage?.querySelector(".orbi-stage-effects") || null,
      learningWidget: stage?.querySelector(".learning-widget-demo") || null,
    };
    root.dataset.performing = "true";
    root.dataset.sequence = name;
    this.#emit("sequence-start", { name, step, cycle, stepIndex, repeatIndex, meta: definition.meta });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (element, keyframes, options = {}) => {
      const { transient = false, ...animationOptions } = options;
      const animation = element.animate(keyframes, {
        fill: "both",
        iterations: 1,
        ...animationOptions,
        duration: prefersReducedMotion ? 1 : Math.max(1, Number(animationOptions.duration) / speed),
      });
      animation.pause();
      animation.currentTime = 0;
      animation.play();
      animation.finished.catch(() => {});
      animations.add(animation);
      abortController.signal.addEventListener("abort", () => animation.cancel(), { once: true });
      if (transient) {
        animation.finished.then(
          () => {
            animation.cancel();
            animations.delete(animation);
          },
          () => animations.delete(animation),
        );
      }
      return animation;
    };

    let retainFinal = false;
    try {
      await definition.run({
        orbi: this.#orbi,
        root,
        elements,
        scene,
        animate,
        signal: abortController.signal,
        reducedMotion: prefersReducedMotion,
        step,
        waitForSignal: (signalName) => this.#waitForSignal(signalName, abortController.signal),
      });
      if (runId === this.#runId && !abortController.signal.aborted) {
        this.#emit("sequence-end", { name, step, cycle, stepIndex, repeatIndex, meta: definition.meta });
        retainFinal = definition.meta.persistFinal === true;
      }
    } finally {
      if (retainFinal) {
        this.#retainedAnimations = new Set(animations);
        root.dataset.retainedSequence = name;
      } else {
        animations.forEach((animation) => animation.cancel());
      }
      if (this.#active?.abortController === abortController) this.#active = null;
      root.removeAttribute("data-performing");
      root.removeAttribute("data-sequence");
    }
  }

  #pause(duration) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (this.#cancelPause === finish) this.#cancelPause = null;
        resolve();
      };
      const timer = setTimeout(finish, duration);
      this.#cancelPause = finish;
    });
  }

  #resetRoot() {
    this.#orbi.root.removeAttribute("data-performing");
    this.#orbi.root.removeAttribute("data-sequence");
  }

  #releaseRetainedAnimations() {
    this.#retainedAnimations.forEach((animation) => animation.cancel());
    this.#retainedAnimations.clear();
    this.#orbi.root.removeAttribute("data-retained-sequence");
  }

  #waitForSignal(signalName, abortSignal) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        this.removeEventListener("external-signal", onSignal);
        abortSignal.removeEventListener("abort", onAbort);
        resolve(result);
      };
      const onSignal = (event) => {
        if (event.detail?.name === signalName) {
          finish({ name: signalName, detail: event.detail.detail, aborted: false });
        }
      };
      const onAbort = () => finish({ name: signalName, detail: null, aborted: true });

      this.addEventListener("external-signal", onSignal);
      abortSignal.addEventListener("abort", onAbort, { once: true });
      if (abortSignal.aborted) onAbort();
    });
  }

  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
