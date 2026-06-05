function toggleFaq(btn) {
  const isExpanded = btn.getAttribute('aria-expanded') === 'true';
  const content = btn.nextElementSibling;
  const icon = btn.querySelector('svg');

  btn.setAttribute('aria-expanded', String(!isExpanded));
  content.classList.toggle('grid-rows-[0fr]', isExpanded);
  content.classList.toggle('grid-rows-[1fr]', !isExpanded);
  icon.classList.toggle('rotate-45', !isExpanded);
  btn.parentElement.classList.toggle('border-blue-200', !isExpanded);
  btn.parentElement.classList.toggle('bg-white', !isExpanded);
  btn.parentElement.classList.toggle('shadow-lg', !isExpanded);
  btn.parentElement.classList.toggle('shadow-blue-500/5', !isExpanded);
  btn.parentElement.classList.toggle('bg-gray-50/30', isExpanded);
}

const ACADEMY_FALLBACK_VIDEO_SRC = 'https://www.youtube.com/embed/MtE8z9CXBas?si=-z5-Ebz4WrPifdhX';
let academyVideoLastTrigger = null;

function getAcademyVideoModal() {
  let modal = document.getElementById('academy-video-modal');
  if (modal) return modal;

  const isEnglishPage = document.documentElement.lang === 'en';
  const closeLabel = isEnglishPage ? 'Close video' : 'Video schliessen';

  modal = document.createElement('div');
  modal.id = 'academy-video-modal';
  modal.className = 'academy-video-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'academy-video-modal-title');
  modal.innerHTML = `
    <div class="academy-video-dialog">
      <button type="button" class="academy-video-close" data-academy-video-close aria-label="${closeLabel}">
        <i data-lucide="x" class="h-6 w-6"></i>
      </button>
      <div class="academy-video-shell">
        <h2 id="academy-video-modal-title" class="academy-video-sr-only">Academy Video</h2>
        <div class="academy-video-frame-wrap">
          <iframe id="academy-video-frame" class="academy-video-frame" title="Academy Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function withAutoplay(src) {
  if (!src) return '';
  return `${src}${src.includes('?') ? '&' : '?'}autoplay=1&rel=0`;
}

function openAcademyVideoModal(card) {
  const modal = getAcademyVideoModal();
  const frame = modal.querySelector('#academy-video-frame');
  const modalTitle = modal.querySelector('#academy-video-modal-title');
  const closeButton = modal.querySelector('[data-academy-video-close]');
  const cardTitle = card.querySelector('h3')?.textContent.trim() || 'Academy Video';
  const videoSrc = card.getAttribute('data-video-src') || ACADEMY_FALLBACK_VIDEO_SRC;

  academyVideoLastTrigger = card;
  modalTitle.textContent = cardTitle;
  frame.title = cardTitle;
  frame.src = withAutoplay(videoSrc);
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  if (closeButton) closeButton.focus();
}

function closeAcademyVideoModal() {
  const modal = document.getElementById('academy-video-modal');
  if (!modal || !modal.classList.contains('is-open')) return false;

  const frame = modal.querySelector('#academy-video-frame');
  if (frame) frame.src = '';
  modal.classList.remove('is-open');
  document.body.style.overflow = '';

  if (academyVideoLastTrigger) academyVideoLastTrigger.focus();
  academyVideoLastTrigger = null;
  return true;
}

function closeNewsletterPopup() {
  const popup = document.getElementById('newsletter-popup');
  if (!popup) return;
  popup.classList.add('hidden');
  popup.classList.remove('flex');
  document.body.style.overflow = '';
}

function showNewsletterPopup() {
  const popup = document.getElementById('newsletter-popup');
  if (!popup) return;
  popup.classList.remove('hidden');
  popup.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

document.addEventListener('DOMContentLoaded', function () {
  const videoActionLabel = document.documentElement.lang === 'en' ? 'Play video' : 'Video ansehen';
  const videoPendingLabel = document.documentElement.lang === 'en' ? 'Video in progress' : 'Video in Bearbeitung';
  const videoCards = document.querySelectorAll('.video-card');
  videoCards.forEach(function (card) {
    const title = card.querySelector('h3')?.textContent.trim() || 'Academy Video';
    if (card.hasAttribute('data-video-pending')) {
      card.setAttribute('aria-label', `${videoPendingLabel}: ${title}`);
      return;
    }
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${videoActionLabel}: ${title}`);
    card.addEventListener('click', function () {
      openAcademyVideoModal(card);
    });
    card.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openAcademyVideoModal(card);
    });
  });

  const videoModal = getAcademyVideoModal();
  videoModal.addEventListener('click', function (event) {
    if (event.target === videoModal || event.target.closest('[data-academy-video-close]')) {
      closeAcademyVideoModal();
    }
  });

  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
  }

  const popup = document.getElementById('newsletter-popup');
  if (popup) {
    popup.addEventListener('click', function (event) {
      if (event.target === popup) closeNewsletterPopup();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (closeAcademyVideoModal()) return;
    closeNewsletterPopup();
  });

  document.addEventListener('submit', function (event) {
    const newsletterForm = event.target.closest('form[data-sv-form="8647011"]');
    if (!newsletterForm) return;

    event.preventDefault();
    const emailInput = newsletterForm.querySelector('input[name="email_address"]');
    fetch(newsletterForm.action, { method: 'POST', body: new FormData(newsletterForm), mode: 'no-cors' })
      .finally(function () {
        showNewsletterPopup();
        if (emailInput) emailInput.value = '';
      });
  });
});
