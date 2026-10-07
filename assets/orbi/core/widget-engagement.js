export const WIDGET_ENGAGEMENT_SEQUENCE = "widget-peek-success";
export const QUIZ_CORRECT_SIGNAL = "quiz-correct";
export const WIDGET_STATE_EVENT = "orbi-widget-state";

export function createLearningWidgetDemo({ id = "learning-widget-demo" } = {}) {
  const root = document.createElement("section");
  root.id = id;
  root.className = "learning-widget-demo";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="learning-widget-demo__header">
      <span class="learning-widget-demo__avatar">a</span>
      <span class="learning-widget-demo__title">
        <strong>KI-Tutor</strong>
        <small>Lernbegleitung</small>
      </span>
      <span class="learning-widget-demo__dots">•••</span>
    </div>
    <div class="learning-widget-demo__body">
      <span class="learning-widget-demo__message learning-widget-demo__message--wide"></span>
      <span class="learning-widget-demo__message"></span>
      <span class="learning-widget-demo__answer"></span>
    </div>
    <div class="learning-widget-demo__composer">
      <span></span><i>↑</i>
    </div>`;
  return { root };
}

export function announceWidgetState(root, state) {
  root.dataset.widgetEngagementState = state;
  root.dispatchEvent(new CustomEvent(WIDGET_STATE_EVENT, {
    detail: { state },
  }));
}

