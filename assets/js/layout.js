(() => {
  const headerTarget = document.getElementById('site-header');
  const footerTarget = document.getElementById('site-footer');
  const CONSENT_KEY = 'ab_cookie_consent_v1';
  const TEMP_LANG_KEY = 'ab_temp_lang';
  const CONSENT_VERSION = 1;
  const GA_MEASUREMENT_ID = 'G-R1NYZ0V0HK';
  let activeConsent = null;

  // Consent Mode v2: Default "denied" in den dataLayer pushen, BEVOR gtag.js
  // geladen/konfiguriert wird (Laden passiert weiterhin erst nach Zustimmung
  // über loadAnalytics — der bestehende Banner-Mechanismus bleibt unverändert).
  // Bewusst KEIN window.gtag-Stub: analytics.js prüft auf window.gtag und soll
  // vor erteilter Zustimmung keine Events in den dataLayer schreiben.
  window.dataLayer = window.dataLayer || [];
  function gtagPush() {
    window.dataLayer.push(arguments);
  }
  gtagPush('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

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
      gtagPush('consent', 'update', { analytics_storage: 'granted' });
      loadAnalytics();
    } else {
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      if (window.__abAnalyticsLoaded) {
        gtagPush('consent', 'update', { analytics_storage: 'denied' });
      }
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

    if (next.functional) {
      const tempLang = getTempLang();
      const current = getCurrentLangFromPath();
      const langToStore = tempLang || current;
      if (langToStore) {
        localStorage.setItem('preferredLang', langToStore);
        setCookie('lang', langToStore);
      }
      clearTempLang();
    } else {
      clearTempLang();
    }
  };

  window.abCookieConsent = {
    get: () => activeConsent || readConsent(),
    set: (partial) => setConsent(partial)
  };

  const getStoredLang = () => {
    return localStorage.getItem('preferredLang') || getCookie('lang');
  };

  const getTempLang = () => {
    return sessionStorage.getItem(TEMP_LANG_KEY);
  };

  const setTempLang = (lang) => {
    sessionStorage.setItem(TEMP_LANG_KEY, lang);
  };

  const clearTempLang = () => {
    sessionStorage.removeItem(TEMP_LANG_KEY);
  };

  const getAutoLang = () => {
    try {
      const navLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
      const navLower = navLang.toLowerCase();
      if (navLower.startsWith('de') || navLower.includes('-de') || navLower.includes('-at') || navLower.includes('-ch')) {
        return 'de';
      }

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const deTimezones = new Set(['Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich']);
      if (deTimezones.has(tz)) return 'de';
    } catch (err) {
      console.warn('[layout] Failed to detect preferred language', err);
    }

    return 'en';
  };

  const getCurrentLangFromPath = () => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'de' || parts[0] === 'en') return parts[0];
    const idx = parts.findIndex((part) => part === 'de' || part === 'en');
    if (idx !== -1) return parts[idx];
    return null;
  };

  const getBasePath = () => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((part) => part === 'de' || part === 'en');
    if (idx === -1) {
      if (parts.length <= 1) return '';
      const last = parts[parts.length - 1];
      const baseParts = last.includes('.html') ? parts.slice(0, -1) : parts;
      const base = baseParts.join('/');
      return base ? `/${base}` : '';
    }
    const base = parts.slice(0, idx).join('/');
    return base ? `/${base}` : '';
  };

  const normalizePath = (path) => path.replace(/\/{2,}/g, '/');

  const getCurrentPage = () => {
    return window.location.pathname.split('/').pop() || 'index.html';
  };

  const redirectToLang = (lang) => {
    const altLink = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
    if (altLink) {
      window.location.replace(altLink.getAttribute('href'));
      return;
    }
    const page = getCurrentPage();
    const basePath = getBasePath();
    const target = page === 'index.html' ? `${basePath}/${lang}/` : `${basePath}/${lang}/${page}`;
    window.location.replace(target);
  };

  activeConsent = readConsent();
  applyConsent(activeConsent);

  const hasFunctionalConsent = () => !!(activeConsent && activeConsent.functional);
  const storedLang = hasFunctionalConsent() ? getStoredLang() : null;
  const tempLang = !storedLang ? getTempLang() : null;
  const autoLang = getAutoLang();
  const preferLang = storedLang || tempLang || autoLang;
  const currentLang = getCurrentLangFromPath();

  // SEO: no automatic client-side language redirects on page load.
  // Language switching happens only via the explicit DE/EN toggle.
  document.documentElement.lang = currentLang || 'de';

  // Funnel-Event-Tracking zentral nachladen (statt auf jeder HTML-Seite).
  // analytics.js sendet nur, wenn window.gtag existiert — also erst nachdem
  // loadAnalytics() nach Analytics-Zustimmung gelaufen ist.
  const analyticsScript = document.createElement('script');
  analyticsScript.src = normalizePath(`${getBasePath()}/analytics.js`);
  analyticsScript.defer = true;
  document.head.appendChild(analyticsScript);

  const loadPartial = async (target, url) => {
    if (!target) return;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load ${url}: ${res.status}`);
    }
    target.innerHTML = await res.text();
  };

  const setActiveNav = () => {
    const currentPage = getCurrentPage();
    const currentPath = window.location.pathname.replace(/\/$/, '');
    const academyPaths = new Set(['/academy', '/academy.html', '/de/academy.html', '/en/academy.html']);
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '');
      const isAcademyAlias = academyPaths.has(currentPath) && academyPaths.has(linkPath);
      if (href === currentPage || linkPath === currentPath || `${linkPath}.html` === currentPath || isAcademyAlias) {
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
          clearTempLang();
        } else {
          setTempLang(lang);
          localStorage.removeItem('preferredLang');
          deleteCookie('lang');
        }
        redirectToLang(lang);
      });
    });
  };

  // Consent-Dialog: drei Stufen (alle / nur Statistik / keine). Die Texte
  // stehen sprachspezifisch im jeweiligen footer.html-Partial, hier nur Logik.
  const initCookieBanner = () => {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;

    const options = Array.from(banner.querySelectorAll('[data-choice]'));
    const confirmBtn = document.getElementById('cookie-confirm');
    const thumb = document.getElementById('cookie-track-thumb');
    const backdrop = banner.querySelector('[data-cookie-backdrop]');

    const CHOICES = {
      all: { functional: true, analytics: true },
      stats: { functional: false, analytics: true },
      none: { functional: false, analytics: false }
    };
    const POSITIONS = { all: '0%', stats: '50%', none: '100%' };
    const ORDER = ['all', 'stats', 'none'];

    let choice = 'stats';
    // Nur schließbar, wenn bereits eine Entscheidung vorliegt (Widerruf über Footer).
    let dismissible = false;

    const select = (next) => {
      if (!CHOICES[next]) return;
      choice = next;
      options.forEach((opt) => {
        opt.setAttribute('aria-checked', String(opt.dataset.choice === next));
      });
      if (thumb) thumb.style.left = POSITIONS[next];
    };

    const choiceFromConsent = (consent) => {
      if (!consent || !consent.analytics) return 'none';
      return consent.functional ? 'all' : 'stats';
    };

    const showBanner = () => {
      banner.classList.remove('hidden');
      document.body.style.overflowY = 'hidden';
      if (confirmBtn) confirmBtn.focus({ preventScroll: true });
    };

    const hideBanner = () => {
      banner.classList.add('hidden');
      document.body.style.overflowY = '';
    };

    const trackConsentGranted = () => {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', 'consent_granted', {
        source_page: window.location.pathname
      });
    };

    options.forEach((opt) => {
      opt.addEventListener('click', () => select(opt.dataset.choice));
      opt.addEventListener('keydown', (event) => {
        const index = ORDER.indexOf(choice);
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          const next = Math.min(index + 1, ORDER.length - 1);
          select(ORDER[next]);
          options[next]?.focus({ preventScroll: true });
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          const next = Math.max(index - 1, 0);
          select(ORDER[next]);
          options[next]?.focus({ preventScroll: true });
        }
      });
    });

    confirmBtn?.addEventListener('click', () => {
      const consent = CHOICES[choice];
      setConsent(consent);
      hideBanner();
      if (consent.analytics) trackConsentGranted();
    });

    backdrop?.addEventListener('click', () => {
      if (dismissible) hideBanner();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (dismissible && !banner.classList.contains('hidden')) hideBanner();
    });

    document.querySelectorAll('[data-cookie-settings]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        dismissible = true;
        select(choiceFromConsent(activeConsent || readConsent()));
        showBanner();
      });
    });

    if (!activeConsent) {
      dismissible = false;
      select('stats');
      showBanner();
    }
  };

  const refreshIcons = () => {
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
    }
  };

  if (window.location.pathname.includes('/blog/')) {
    // Fix overflow-x:hidden on body breaking position:sticky —
    // replace with clip which doesn't create a new scroll container.
    // Must run for all blog pages, including those with inline sidebar HTML.
    document.body.style.overflowX = 'clip';
    document.documentElement.style.overflowX = 'clip';

    const sidebarTarget = document.getElementById('blog-sidebar');
    if (sidebarTarget) {
      // Apply sticky directly to the aside grid item (synchronous, before fetch)
      sidebarTarget.style.position = 'sticky';
      sidebarTarget.style.top = '7rem';
      sidebarTarget.style.alignSelf = 'start';
      loadPartial(sidebarTarget, normalizePath(`${getBasePath()}/${currentLang}/partials/sidebar.html`))
        .catch((err) => console.error('[layout] sidebar load failed', err));
    }
  }

  // Chat iframes use data-src and load on visibility. The embedded chat app
  // focuses its input on load, which scrolls the page down to the iframe on
  // reload if the iframe loads while offscreen.
  const initChatIframeLazyLoad = () => {
    const frames = document.querySelectorAll('iframe[data-src^="https://chat.alphabees.de"]');
    if (!frames.length) return;
    const loadFrame = (frame) => {
      if (!frame.getAttribute('src')) {
        frame.setAttribute('src', frame.getAttribute('data-src'));
      }
    };
    if (!('IntersectionObserver' in window)) {
      frames.forEach(loadFrame);
      return;
    }
    // No ratio threshold: nested overflow-hidden wrappers make Chrome report
    // intersectionRatio 0 for these iframes even when they are fully visible.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadFrame(entry.target);
          observer.unobserve(entry.target);
        }
      });
    });
    frames.forEach((frame) => observer.observe(frame));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatIframeLazyLoad, { once: true });
  } else {
    initChatIframeLazyLoad();
  }

  Promise.all([
    loadPartial(headerTarget, normalizePath(`${getBasePath()}/${currentLang}/partials/header.html`)),
    loadPartial(footerTarget, normalizePath(`${getBasePath()}/${currentLang}/partials/footer.html`))
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
