(() => {
  const headerTarget = document.getElementById('site-header');
  const footerTarget = document.getElementById('site-footer');
  const CONSENT_KEY = 'ab_cookie_consent_v1';
  const CONSENT_VERSION = 1;
  const GA_MEASUREMENT_ID = 'G-R1NYZ0V0HK';
  let activeConsent = null;

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const setCookie = (name, value, days = 365) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  };

  const readConsent = () => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        essential: true,
        functional: !!parsed.functional,
        analytics: !!parsed.analytics,
        version: parsed.version || CONSENT_VERSION,
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    } catch (err) {
      console.warn('[consent] Failed to read consent', err);
      return null;
    }
  };

  const saveConsent = (consent) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  };

  const clearAnalyticsCookies = () => {
    const cookieNames = document.cookie.split(';').map((entry) => entry.trim().split('=')[0]);
    cookieNames.forEach((name) => {
      if (!name) return;
      if (
        name.startsWith('_ga') ||
        name.startsWith('_gid') ||
        name.startsWith('_gat') ||
        name.startsWith('_gac_') ||
        name.startsWith('_gcl_')
      ) {
        deleteCookie(name);
      }
    });
  };

  const clearFunctionalStorage = () => {
    localStorage.removeItem('preferredLang');
    deleteCookie('lang');
  };

  const loadAnalytics = () => {
    if (window.__abAnalyticsLoaded) return;
    window.__abAnalyticsLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = window.gtag || gtag;
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  };

  const applyConsent = (consent) => {
    if (consent && consent.analytics) {
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
      loadAnalytics();
    } else {
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      clearAnalyticsCookies();
    }

    if (!consent || !consent.functional) {
      clearFunctionalStorage();
    }
  };

  const setConsent = (partial) => {
    const next = {
      essential: true,
      functional: !!partial.functional,
      analytics: !!partial.analytics,
      version: CONSENT_VERSION,
      updatedAt: new Date().toISOString()
    };
    saveConsent(next);
    activeConsent = next;
    applyConsent(next);
  };

  window.abCookieConsent = {
    get: () => activeConsent || readConsent(),
    set: (partial) => setConsent(partial)
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

  activeConsent = readConsent();
  applyConsent(activeConsent);

  const hasFunctionalConsent = () => !!(activeConsent && activeConsent.functional);
  const storedLang = hasFunctionalConsent() ? getStoredLang() : null;
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
        if (hasFunctionalConsent()) {
          localStorage.setItem('preferredLang', lang);
          setCookie('lang', lang);
        } else {
          localStorage.removeItem('preferredLang');
          deleteCookie('lang');
        }
        const page = getCurrentPage();
        const target = page === 'index.html' ? `/${lang}/` : `/${lang}/${page}`;
        window.location.href = target;
      });
    });
  };

  const initCookieBanner = () => {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    const settingsPanel = document.getElementById('cookie-settings-panel');
    const acceptBtn = document.getElementById('cookie-accept');
    const rejectBtn = document.getElementById('cookie-reject');
    const saveBtn = document.getElementById('cookie-save');
    const settingsBtn = document.getElementById('cookie-settings-toggle');
    const functionalToggle = document.getElementById('cookie-functional');
    const analyticsToggle = document.getElementById('cookie-analytics');

    const updateToggles = () => {
      const consent = activeConsent || readConsent();
      if (!consent) return;
      if (functionalToggle) functionalToggle.checked = !!consent.functional;
      if (analyticsToggle) analyticsToggle.checked = !!consent.analytics;
    };

    const showBanner = (openSettings = false) => {
      banner.classList.remove('hidden');
      if (settingsPanel) {
        settingsPanel.classList.toggle('hidden', !openSettings);
        if (settingsBtn) {
          settingsBtn.setAttribute('aria-expanded', openSettings ? 'true' : 'false');
        }
      }
    };

    const hideBanner = () => {
      banner.classList.add('hidden');
      if (settingsPanel) settingsPanel.classList.add('hidden');
      if (settingsBtn) settingsBtn.setAttribute('aria-expanded', 'false');
    };

    acceptBtn?.addEventListener('click', () => {
      setConsent({ functional: true, analytics: true });
      hideBanner();
    });

    rejectBtn?.addEventListener('click', () => {
      setConsent({ functional: false, analytics: false });
      hideBanner();
    });

    saveBtn?.addEventListener('click', () => {
      setConsent({
        functional: !!functionalToggle?.checked,
        analytics: !!analyticsToggle?.checked
      });
      hideBanner();
    });

    settingsBtn?.addEventListener('click', () => {
      const isHidden = settingsPanel?.classList.contains('hidden');
      if (!settingsPanel) return;
      settingsPanel.classList.toggle('hidden');
      settingsBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    document.querySelectorAll('[data-cookie-settings]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        updateToggles();
        showBanner(true);
      });
    });

    if (!activeConsent) {
      showBanner(false);
    } else {
      updateToggles();
    }
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
      initCookieBanner();
      refreshIcons();
    })
    .catch((err) => {
      console.error('[layout] partial load failed', err);
    });
})();
