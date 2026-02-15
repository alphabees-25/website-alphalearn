(() => {
  const headerTarget = document.getElementById('site-header');
  const footerTarget = document.getElementById('site-footer');

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const setCookie = (name, value, days = 365) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  };

  const getStoredLang = () => {
    return localStorage.getItem('preferredLang') || getCookie('lang');
  };

  const getAutoLang = () => {
    const navLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    const navLower = navLang.toLowerCase();
    if (navLower.startsWith('de') || navLower.includes('-de') || navLower.includes('-at') || navLower.includes('-ch')) {
      return 'de';
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const deTimezones = new Set(['Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich']);
    if (deTimezones.has(tz)) return 'de';

    return 'en';
  };

  const getCurrentLangFromPath = () => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'de' || parts[0] === 'en') return parts[0];
    return null;
  };

  const getCurrentPage = () => {
    return window.location.pathname.split('/').pop() || 'index.html';
  };

  const redirectToLang = (lang) => {
    const page = getCurrentPage();
    const target = page === 'index.html' ? `/${lang}/` : `/${lang}/${page}`;
    window.location.replace(target);
  };

  const storedLang = getStoredLang();
  const autoLang = getAutoLang();
  const preferLang = storedLang || autoLang;
  const currentLang = getCurrentLangFromPath();

  if (!currentLang) {
    redirectToLang(preferLang);
    return;
  }

  if (!storedLang && currentLang && currentLang !== autoLang) {
    redirectToLang(autoLang);
    return;
  }

  if (storedLang && currentLang !== storedLang) {
    redirectToLang(storedLang);
    return;
  }

  document.documentElement.lang = currentLang;

  const loadPartial = async (target, url) => {
    if (!target) return;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load ${url}: ${res.status}`);
    }
    target.innerHTML = await res.text();
  };

  const setActiveNav = () => {
    const currentPage = getCurrentPage();
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('active');
      }
    });
  };

  const initMobileMenu = () => {
    const toggleBtn = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const iconMenu = document.getElementById('iconMenu');
    const iconClose = document.getElementById('iconClose');

    if (!toggleBtn || !mobileMenu || !iconMenu || !iconClose) return;

    toggleBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.toggle('hidden');
      const expanded = !isHidden;
      toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      iconMenu.classList.toggle('hidden', expanded);
      iconClose.classList.toggle('hidden', !expanded);
    });
  };

  const initLangToggle = () => {
    const toggles = document.querySelectorAll('[data-lang]');
    if (!toggles.length) return;

    toggles.forEach((btn) => {
      const lang = btn.getAttribute('data-lang');
      if (lang === currentLang) {
        btn.classList.add('lang-active');
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('preferredLang', lang);
        setCookie('lang', lang);
        const page = getCurrentPage();
        const target = page === 'index.html' ? `/${lang}/` : `/${lang}/${page}`;
        window.location.href = target;
      });
    });
  };

  const refreshIcons = () => {
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
    }
  };

  Promise.all([
    loadPartial(headerTarget, `/${currentLang}/partials/header.html`),
    loadPartial(footerTarget, `/${currentLang}/partials/footer.html`)
  ])
    .then(() => {
      setActiveNav();
      initMobileMenu();
      initLangToggle();
      refreshIcons();
    })
    .catch((err) => {
      console.error('[layout] partial load failed', err);
    });
})();
