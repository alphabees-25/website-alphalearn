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

  // Header/Footer stehen seit 10/2026 statisch im HTML (scripts/seo_build.py),
  // damit Suchmaschinen Navigation und Footer-Links ohne JavaScript sehen.
  // Nachgeladen wird nur noch, wenn ein Container leer ist (Fallback).
  const loadPartial = async (target, url) => {
    if (!target) return;
    if (target.firstElementChild) return;
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

  // Cookie-Hinweis: schmale Leiste unten, drei Stufen (alle / nur Statistik /
  // keine) mit je einem Klick. Die Texte stehen sprachspezifisch im jeweiligen
  // footer.html-Partial, hier nur Logik und der generative Reveal.
  const GENFX_BASE = '/assets/genfx/';

  // Laufzeit und CSS des Reveals erst laden, wenn die Leiste wirklich gebraucht
  // wird: wer schon entschieden hat, lädt die 37 KB nie.
  const loadGenerate = () => {
    if (window.__abGenfx) return window.__abGenfx;
    if (!document.getElementById('ab-genfx-css')) {
      const link = document.createElement('link');
      link.id = 'ab-genfx-css';
      link.rel = 'stylesheet';
      link.href = `${GENFX_BASE}ui-generation.css`;
      document.head.appendChild(link);
    }
    window.__abGenfx = import(`${GENFX_BASE}ui-generation.js`).then((mod) => mod.generate);
    return window.__abGenfx;
  };

  const initCookieBanner = () => {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;

    const card = document.getElementById('cookie-card');
    const options = Array.from(banner.querySelectorAll('[data-choice]'));

    const CHOICES = {
      all: { functional: true, analytics: true },
      stats: { functional: false, analytics: true },
      none: { functional: false, analytics: false }
    };
    const REVEAL_MS = 1500;
    let genRun = null;

    const stopReveal = () => {
      if (!genRun) return;
      const run = genRun;
      genRun = null;
      try {
        run.cancel();
      } catch (err) {
        // Lauf war schon durch – cancel() ist dann ein No-op.
      }
    };

    const choiceFromConsent = (consent) => {
      if (!consent) return null;
      if (!consent.analytics) return 'none';
      return consent.functional ? 'all' : 'stats';
    };

    const markActive = (consent) => {
      const current = choiceFromConsent(consent);
      options.forEach((opt) => {
        if (opt.dataset.choice === current) opt.setAttribute('data-active', 'true');
        else opt.removeAttribute('data-active');
      });
    };

    const hideBanner = () => {
      stopReveal();
      banner.classList.add('hidden');
      banner.removeAttribute('data-building');
    };

    // Zeichnet die Leiste als gepunkteten Bauplan und deckt sie dann auf.
    // parent: banner, weil die Zeichenebene sonst am body hängt und beim
    // Scrollen von der fixierten Leiste wegwandert. data-building hält die
    // echte Leiste bis zum Start unsichtbar – ohne das blitzt sie einmal auf.
    const reveal = async () => {
      banner.setAttribute('data-building', '');
      banner.classList.remove('hidden');

      let generate;
      try {
        generate = await loadGenerate();
        await document.fonts.ready;
      } catch (err) {
        console.warn('[consent] Reveal übersprungen', err);
        banner.removeAttribute('data-building');
        return;
      }

      banner.removeAttribute('data-building');
      if (banner.classList.contains('hidden') || !card) return;

      const run = generate(card, { mode: 'skeleton', parent: banner, duration: REVEAL_MS });
      genRun = run;
      // Ein Hinweis, den man wegklicken muss, darf nie an seiner Animation hängen.
      const guard = setTimeout(stopReveal, REVEAL_MS + 2000);
      try {
        await run.finished;
      } catch (err) {
        console.warn('[consent] Reveal abgebrochen', err);
      }
      clearTimeout(guard);
      if (genRun === run) genRun = null;
    };

    const trackConsentGranted = () => {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', 'consent_granted', {
        source_page: window.location.pathname
      });
    };

    options.forEach((opt) => {
      opt.addEventListener('click', () => {
        const consent = CHOICES[opt.dataset.choice];
        if (!consent) return;
        setConsent(consent);
        markActive(activeConsent);
        hideBanner();
        if (consent.analytics) trackConsentGranted();
      });
    });

    // Escape schließt nur, wenn schon eine Entscheidung vorliegt.
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (banner.classList.contains('hidden')) return;
      if (activeConsent || readConsent()) hideBanner();
    });

    // Widerruf über den Footer: sofort da, ohne Reveal. Wer hier klickt, will
    // umstellen und nicht zusehen.
    document.querySelectorAll('[data-cookie-settings]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        markActive(activeConsent || readConsent());
        banner.removeAttribute('data-building');
        banner.classList.remove('hidden');
        options[0]?.focus({ preventScroll: true });
      });
    });

    if (!activeConsent) {
      markActive(null);
      void reveal();
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
