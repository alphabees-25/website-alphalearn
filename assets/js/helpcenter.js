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
    if (event.key === 'Escape') closeNewsletterPopup();
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
