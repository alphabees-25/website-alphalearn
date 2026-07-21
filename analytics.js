/**
 * alphalearn.ai — Funnel-Event-Tracking für GA4
 * ------------------------------------------------
 * Einbinden auf jeder Seite NACH dem GA4/gtag-Snippet:
 *   <script src="/analytics.js" defer></script>
 * (oder zentral aus layout.js nachladen)
 *
 * Consent: Diese Datei sendet nur, wenn window.gtag existiert.
 * Lädt euer Cookie-Banner GA4 erst nach Zustimmung, greift das
 * automatisch auch für alle Events hier.
 *
 * CTAs auszeichnen (empfohlen, macht Reports lesbar):
 *   <a href="/de/demos.html" data-cta="hero_demo">Demo ansehen</a>
 * Unmarkierte Links werden per Heuristik klassifiziert (Portal,
 * Calendly, moodle.org, extern), interne Links ohne data-cta
 * werden NICHT als cta_click getrackt.
 */
(function () {
  'use strict';

  // ---------- Basis ----------
  function track(eventName, params) {
    if (typeof window.gtag !== 'function') return; // Consent nicht erteilt / GA nicht geladen
    window.gtag('event', eventName, params || {});
  }

  var path = location.pathname;

  // Seitenrolle für Funnel-Reports (an eure Seitenstruktur angepasst)
  function pageRole() {
    if (/\/(de|en)\/?(index\.html)?$/.test(path)) return 'tofu_home';
    if (path.indexOf('demos') !== -1) return 'mofu_demo';
    if (path.indexOf('features') !== -1) return 'mofu_features';
    if (path.indexOf('moodle') !== -1) return 'mofu_moodle';
    if (path.indexOf('preis') !== -1 || path.indexOf('pricing') !== -1) return 'bofu_pricing';
    if (path.indexOf('kontakt') !== -1 || path.indexOf('contact') !== -1) return 'bofu_contact';
    if (path.indexOf('academy') !== -1 || path.indexOf('guide') !== -1 || path.indexOf('blog') !== -1) return 'tofu_content';
    return 'other';
  }
  var ROLE = pageRole();

  // ---------- 1) Klick-Tracking (Delegation, ein Listener) ----------
  document.addEventListener('click', function (e) {
    // [data-cta] zusätzlich zu a/button: einige CTAs der Seite sind
    // <span onclick> / <article onclick> statt Links.
    var a = e.target.closest ? e.target.closest('a, button, [data-cta]') : null;
    if (!a) return;

    var href = (a.getAttribute('href') || '').trim();
    if (!href) {
      // Buttons/Karten ohne href: Ziel-URL aus dem onclick-Handler
      // (window.location.href='…' bzw. window.open('…')) ableiten,
      // damit Portal-/Calendly-/moodle.org-Heuristik auch dort greift.
      var oc = a.getAttribute('onclick') || '';
      var ocMatch = oc.match(/(?:window\.location\.href\s*=\s*|window\.open\(\s*)'([^']+)'/);
      if (ocMatch) href = ocMatch[1];
    }
    var ctaId = a.getAttribute('data-cta');
    var text = (a.textContent || '').trim().slice(0, 60);

    // -- Portal-Registrierung (Makro-Conversion-Proxy) --
    if (/portal\.alpha(bees|learn)\.(de|ai)/.test(href)) {
      var isRegister = href.indexOf('register') !== -1;
      track(isRegister ? 'portal_register_click' : 'portal_click', {
        source_page: path,
        page_role: ROLE,
        cta_id: ctaId || 'auto_' + text.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
        plan: a.getAttribute('data-plan') || undefined
      });
      return;
    }

    // -- Calendly / Demo-Termin (Makro-Conversion 2) --
    if (href.indexOf('calendly.com') !== -1) {
      track('demo_booking_click', { source_page: path, page_role: ROLE, cta_id: ctaId || 'auto_calendly' });
      return;
    }

    // -- Moodle-Plugin-Verzeichnis --
    if (href.indexOf('moodle.org/plugins') !== -1) {
      track('plugin_directory_click', { source_page: path, page_role: ROLE });
      return;
    }

    // -- Preisplan-Buttons (data-plan an die Plan-Buttons setzen) --
    if (a.hasAttribute('data-plan')) {
      track('pricing_plan_click', { plan: a.getAttribute('data-plan'), source_page: path });
      // kein return: kann zusätzlich portal_register_click oben sein — Reihenfolge deckt das ab
    }

    // -- Sprachwechsel --
    if (/\/en\//.test(href) && /\/de\//.test(path)) { track('language_switch', { to_lang: 'en' }); return; }
    if (/\/de\//.test(href) && /\/en\//.test(path)) { track('language_switch', { to_lang: 'de' }); return; }

    // -- Explizit markierte CTAs (intern) --
    if (ctaId) {
      track('cta_click', {
        cta_id: ctaId,
        cta_target: href,
        cta_text: text,
        page_role: ROLE,
        source_page: path
      });
      return;
    }

    // -- Sonstige externe Links --
    if (/^https?:\/\//.test(href) && href.indexOf(location.hostname) === -1) {
      try {
        track('outbound_click', { link_domain: new URL(href).hostname, source_page: path });
      } catch (err) { /* ignore */ }
    }
  }, true);

  // ---------- 2) Scroll-Tiefe (25/50/75/90) ----------
  var marks = [25, 50, 75, 90];
  var fired = {};
  function onScroll() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var pct = Math.round((window.scrollY / scrollable) * 100);
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      if (pct >= m && !fired[m]) {
        fired[m] = true;
        track('scroll_depth', { percent: m, page_role: ROLE, source_page: path });
      }
    }
    if (fired[90]) window.removeEventListener('scroll', onScrollThrottled);
  }
  var scrollTimer = null;
  function onScrollThrottled() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function () { scrollTimer = null; onScroll(); }, 400);
  }
  window.addEventListener('scroll', onScrollThrottled, { passive: true });

  // ---------- 3) FAQ-Aufklappen ----------
  // Variante A: native <details>/<summary>
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.tagName === 'DETAILS' && d.open) {
      var q = d.querySelector('summary');
      track('faq_opened', {
        question: q ? q.textContent.trim().slice(0, 80) : 'unknown',
        source_page: path
      });
    }
  }, true);
  // Variante B: eigene Akkordeons → data-faq="<frage-kurz>" auf den
  // Toggle-Button setzen; wird dann über den Klick-Listener erfasst:
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-faq]') : null;
    if (t) track('faq_opened', { question: t.getAttribute('data-faq'), source_page: path });
  }, true);

  // ---------- 4) Demo-Chat-Interaktion (demos.html) ----------
  // Der Live-Chat ist vermutlich ein iframe (chat.alphabees.de).
  // Erste Interaktion = Fokus/Klick ins iframe → bester messbarer Proxy.
  if (ROLE === 'mofu_demo') {
    var chatFired = false;
    function fireChat() {
      if (chatFired) return;
      chatFired = true;
      track('demo_chat_started', { source_page: path });
    }
    window.addEventListener('blur', function () {
      var ae = document.activeElement;
      if (ae && ae.tagName === 'IFRAME' && (ae.src || '').indexOf('chat.alphabees') !== -1) fireChat();
    });
    // Fallback: falls der Chat kein iframe ist, das Chat-Eingabefeld
    // mit data-cta="demo_chat_input" markieren:
    document.addEventListener('focusin', function (e) {
      if (e.target.closest && e.target.closest('[data-cta="demo_chat_input"]')) fireChat();
    });
  }

  // ---------- 5) YouTube-Video (Portal-Video auf demos.html) ----------
  // GA4 Enhanced Measurement trackt YouTube nur, wenn das iframe
  // "?enablejsapi=1" in der src hat — bitte dort ergänzen. Dann kommen
  // video_start / video_progress / video_complete automatisch.
})();
