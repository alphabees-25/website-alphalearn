/* KI-Tutor-Einführung – interaktive Checkliste (vanilla JS, keine Abhängigkeiten).
   Häkchen bleiben im Browser. Übermittelt wird nur, was im Fahrplan-Formular
   aktiv abgeschickt wird (siehe ki-check-config.js). */
(function () {
  'use strict';

  var DATA = window.KI_CHECK_DATA;
  var CFG = window.KI_CHECK_CONFIG || {};
  var root = document.getElementById('kc-app');
  if (!DATA || !root) return;
  // Handbuch-Spalte rechts (ab 1280px, scrollt mit). Darunter steht der Kasten wie bisher unter der Checkliste.
  var asideSlot = document.getElementById('kc-aside-slot');
  var mqAside = window.matchMedia ? window.matchMedia('(min-width: 1280px)') : null;
  function asideOn() { return !!(asideSlot && mqAside && mqAside.matches); }

  var CH = DATA.chapters;
  var ITEMS = DATA.items;
  var STORE = 'kc-checklist-' + DATA.version;

  var state = {
    ch: CH[0].id,
    employees: null,     // null = unbekannt (Kapitel sichtbar), true, false
    done: {},            // id -> true
    open: {},            // id -> Details aufgeklappt
    unlocked: false,
    started: false,
    firstName: '',
    requested: false     // Handbuch in diesem Browser angefordert
  };

  // ---------- Helpers ----------
  function track(name, params) {
    params = params || {};
    params.page_role = 'leadmagnet';
    params.source_page = location.pathname;
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function chapters() { return CH.filter(function (c) { return !c.employeesOnly || state.employees !== false; }); }
  function chById(id) { return CH.filter(function (c) { return c.id === id; })[0]; }
  function itemsOf(chId) { return ITEMS.filter(function (i) { return i.ch === chId; }); }
  function activeItems() {
    var ids = chapters().map(function (c) { return c.id; });
    return ITEMS.filter(function (i) { return ids.indexOf(i.ch) !== -1; });
  }
  function stats(list) {
    list = list || activeItems();
    var d = list.filter(function (i) { return state.done[i.id]; }).length;
    var mustOpen = list.filter(function (i) { return i.must && !state.done[i.id]; }).length;
    return { done: d, total: list.length, mustOpen: mustOpen, pct: list.length ? Math.round(d / list.length * 100) : 0 };
  }
  function openItems() {
    return activeItems().filter(function (i) { return !state.done[i.id]; })
      .sort(function (a, b) { return (b.must ? 1 : 0) - (a.must ? 1 : 0); });
  }
  function scrollTo(el) {
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 24, behavior: 'smooth' });
  }

  // ---------- Speichern: Browser + Report-Link ----------
  function encodeState() {
    var e = state.employees === null ? '_' : (state.employees ? '1' : '0');
    return e + '-' + ITEMS.map(function (i) { return state.done[i.id] ? '1' : '0'; }).join('');
  }
  function decodeState(str) {
    var m = /^([01_])-([01]+)$/.exec(str || '');
    if (!m || m[2].length !== ITEMS.length) return false;
    state.employees = m[1] === '_' ? null : m[1] === '1';
    state.done = {};
    ITEMS.forEach(function (i, n) { if (m[2].charAt(n) === '1') state.done[i.id] = true; });
    return true;
  }
  function reportLink() { return (CFG.reportUrl || location.origin + location.pathname) + '#r=' + encodeState(); }
  function save() { try { localStorage.setItem(STORE, encodeState()); } catch (e) { /* egal */ } }
  function load() { try { return decodeState(localStorage.getItem(STORE)); } catch (e) { return false; } }

  // ---------- Rendering ----------
  function render() {
    var s = stats();
    var chs = chapters();
    if (chs.map(function (c) { return c.id; }).indexOf(state.ch) === -1) state.ch = chs[0].id;
    var c = chById(state.ch);
    var idx = chs.indexOf(c);
    var next = chs[idx + 1];

    var html =
      '<div class="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">' +
      '<aside class="kc-noprint p-5 sm:p-8 lg:p-6 border-b border-gray-100 lg:border-b-0 lg:border-r lg:border-gray-200/80 lg:bg-white/90"><div class="lg:sticky lg:top-6">' +
        '<div class="kc-side-card">' +
          '<div><p class="text-xs font-semibold uppercase tracking-wide text-gray-500 font-geist mb-1">Ihre Checkliste</p>' +
          '<p class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 font-geist">' + s.done + ' von ' + s.total + ' Punkten erledigt</p></div>' +
          '<div class="kc-bar-track my-3"><div class="kc-bar" style="width:' + s.pct + '%"></div></div>' +
          '<p class="text-sm ' + (s.mustOpen ? 'text-red-600' : 'text-emerald-700') + ' font-medium">' +
            (s.mustOpen ? s.mustOpen + (s.mustOpen === 1 ? ' Pflichtpunkt offen' : ' Pflichtpunkte offen') : 'Alle Pflichtpunkte erledigt') + '</p>' +
        '</div>' +
        '<div class="flex flex-wrap items-center gap-2 text-sm mt-5 mb-5 lg:block">' +
          '<span class="text-gray-600 mr-1 lg:block lg:mr-0 lg:mb-2">Lernen auch eigene Beschäftigte mit dem Tutor?</span>' +
          '<span class="kc-seg">' + chip('emp', '1', 'Ja', state.employees === true) + chip('emp', '0', 'Nein', state.employees === false) + '</span>' +
        '</div>' +
        '<nav class="grid gap-1.5 sm:flex sm:flex-wrap sm:gap-2 lg:flex-col lg:flex-nowrap lg:gap-1 lg:border-t lg:border-gray-100 lg:pt-4" aria-label="Kapitel">' +
          chs.map(function (x, n) {
            var st = stats(itemsOf(x.id));
            var active = x.id === state.ch;
            return '<button type="button" class="kc-tab' + (active ? ' is-active' : '') + (st.done === st.total ? ' is-done' : '') + '" data-act="tab" data-ch="' + x.id + '" aria-current="' + active + '">' +
              '<span class="kc-tab-n">' + (st.done === st.total ? '✓' : (n + 1)) + '</span><span class="min-w-0">' + esc(x.title) + '</span>' +
              '<span class="kc-tab-c">' + st.done + '/' + st.total + '</span></button>';
          }).join('') +
        '</nav>' +
      '</div></aside>' +

      '<div class="p-5 sm:p-8 lg:p-10 kc-fade" id="kc-chapter">' +
        '<p class="text-sm font-medium tracking-tight text-blue-600 font-geist mb-2">Kapitel ' + (idx + 1) + ' von ' + chs.length + ' · ' + esc(c.sub) + '</p>' +
        '<h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 font-geist mb-3">' + esc(c.title) + '</h2>' +
        '<p class="text-gray-600 mb-7 max-w-2xl leading-relaxed">' + esc(c.intro) + '</p>' +
        '<ul class="space-y-2.5">' + itemsOf(c.id).map(item).join('') + '</ul>' +
        '<div class="mt-9 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">' +
          (idx > 0 ? '<button type="button" class="kc-link text-sm" data-act="tab" data-ch="' + chs[idx - 1].id + '">← ' + esc(chs[idx - 1].title) + '</button>' : '<span></span>') +
          (next ? '<button type="button" class="kc-btn-primary" data-act="tab" data-ch="' + next.id + '">Weiter: ' + esc(next.title) + ' →</button>'
                : '<button type="button" class="kc-btn-primary" data-act="to-gate">Fahrplan erstellen →</button>') +
        '</div>' +
      '</div>' +
      '</div>' +

      (state.unlocked || !asideOn() ? '<div class="p-3 sm:p-5 lg:p-6 pt-0 sm:pt-0 lg:pt-0">' + (state.unlocked ? fullReport() : gate(false)) + '</div>' : '');

    root.innerHTML = html;
  }

  function chip(name, val, label, active) {
    return '<button type="button" class="kc-chip' + (active ? ' is-active' : '') + '" data-act="' + name + '" data-val="' + val + '" aria-pressed="' + active + '">' + esc(label) + '</button>';
  }

  function item(i) {
    var d = !!state.done[i.id], o = !!state.open[i.id];
    return '<li class="kc-item' + (d ? ' is-done' : '') + '">' +
      '<div class="flex items-start gap-2.5">' +
        '<button type="button" class="kc-cb" role="checkbox" aria-checked="' + d + '" data-act="toggle" data-id="' + i.id + '" aria-label="Erledigt: ' + esc(i.t) + '"></button>' +
        '<div class="flex-1 min-w-0">' +
          '<button type="button" class="kc-item-t" data-act="details" data-id="' + i.id + '" aria-expanded="' + o + '">' +
            '<span>' + esc(i.t) + (i.must ? ' <span class="kc-must">Pflicht</span>' : '') + '</span>' +
            '<span class="kc-more">' + (o ? 'weniger' : 'Warum & wie') + '</span>' +
          '</button>' +
          (o ? '<div class="kc-detail">' +
                '<p>' + esc(i.why) + '</p>' +
                '<p class="kc-how"><strong>So geht’s:</strong> ' + esc(i.how) + '</p>' +
                '<p class="kc-law">' + esc(i.law) + '</p>' +
              '</div>' : '') +
        '</div>' +
      '</div></li>';
  }

  // Cover des Handbuchs als kleines 3D-Buch (Styles .kc-mock-* in der Seite)
  function bookMock(cls) {
    return '<div class="kc-mock-stage ' + cls + '" aria-hidden="true"><div class="kc-mock-book">' +
      '<img class="kc-mock-cover" src="/assets/images/ki-check/handbuch-cover.webp" width="1024" height="1536" alt="" loading="lazy" decoding="async">' +
      '<span class="kc-mock-gloss"></span><span class="kc-mock-pages"></span><span class="kc-mock-back"></span></div></div>';
  }

  function gate(aside) {
    var s = stats();
    var list = '<ul class="' + (aside ? 'space-y-1.5 text-gray-300 text-[0.8rem] leading-[1.35] mb-5' : 'space-y-3 text-gray-300 text-[0.95rem] leading-relaxed') + '">' +
            '<li class="kc-li">28 Seiten: die komplette Checkliste zum Abhaken, die 10 Irrtümer und Fristen</li>' +
            '<li class="kc-li">15 Fragen an jeden KI-Anbieter – als Vergleichstabelle zum Ausfüllen</li>' +
            '<li class="kc-li">4 Vorlagen: Rollen-Steckbrief, Transparenzhinweis, Schulungsnachweis, Eckpunkte Betriebsvereinbarung</li>' +
            '<li class="kc-li">Pro Kapitel vermerkt, wer sich kümmert – zum Weiterleiten an Datenschutz, Betriebsrat, Einkauf</li>' +
            '<li class="kc-li">Dazu: Zugang zum KI-Assistenten, der Ihre Fragen zum Handbuch jederzeit beantwortet</li>' +
          '</ul>';
    var form =
        '<div class="kc-form-frame"><form class="kc-form kc-form-card text-gray-900" data-act="submit" novalidate>' +
          '<div class="grid gap-3' + (aside ? '' : ' sm:grid-cols-2') + '">' +
            '<label class="kc-field"><span>Vorname</span><input name="first_name" autocomplete="given-name" required></label>' +
            '<label class="kc-field"><span>Geschäftliche E-Mail</span><input name="email" type="email" autocomplete="email" required></label>' +
          '</div>' +
          '<label class="kc-consent"><input type="checkbox" name="newsletter" value="1"><span>Ja, schicken Sie mir gelegentlich Praxiswissen zu KI in der Bildung, Rechtslage und Moodle/ILIAS. Abmeldung jederzeit möglich.</span></label>' +
          '<p class="text-xs text-gray-500 mt-4 leading-relaxed">Sie erhalten gleich eine E-Mail mit einem Bestätigungslink. Sobald Sie Ihre Adresse bestätigt haben, erhalten Sie das Handbuch als PDF. Details in der <a class="text-blue-600 underline underline-offset-2 hover:text-blue-700" href="' + esc(CFG.privacyUrl || '/de/privacy.html') + '">Datenschutzerklärung</a>.</p>' +
          '<p class="kc-error text-sm font-medium text-red-600 mt-3" role="alert" hidden></p>' +
          '<button type="submit" class="kc-btn-primary mt-5 w-full">Handbuch anfordern</button>' +
        '</form></div>';
    if (aside) {
      return '<div class="kc-gate kc-gate--aside rounded-3xl p-5 text-white" id="kc-gate">' +
        '<div class="flex items-center gap-4 mb-5">' + bookMock('kc-mock-stage--sm') +
          '<div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-widest text-blue-300 font-geist mb-2">Kostenlos</p>' +
          '<h3 class="text-[1.15rem] leading-snug tracking-tight font-geist text-balance">Das Handbuch <span class="whitespace-nowrap">„KI-Tutor einführen“</span> als&nbsp;PDF</h3></div></div>' +
        list + form + '</div>';
    }
    return '<div class="kc-gate rounded-3xl p-5 sm:p-10 text-white scroll-mt-6" id="kc-gate">' +
      '<div class="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8 lg:gap-12 items-center">' +
        '<div><div class="flex items-center gap-6 mb-7">' + bookMock('kc-mock-stage--md hidden sm:block') +
          '<div><p class="text-xs font-semibold uppercase tracking-widest text-blue-300 font-geist mb-2">Kostenlos</p>' +
          '<h3 class="text-2xl sm:text-3xl lg:text-[1.75rem] font-semibold tracking-tight font-geist text-balance">Das Handbuch <span class="whitespace-nowrap">„KI-Tutor einführen“</span> als&nbsp;PDF</h3></div></div>' +
          list + '</div>' +
        form +
      '</div></div>';
  }

  // Seitenspalte nach dem Absenden: Bestätigung statt Formular
  function asideDone() {
    return '<div class="kc-gate kc-gate--aside rounded-3xl p-5 text-white" id="kc-gate">' +
      '<div class="flex items-center gap-4 mb-5">' + bookMock('kc-mock-stage--sm') +
        '<div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-widest text-blue-300 font-geist mb-2">Angefordert</p>' +
        '<h3 class="text-[1.3rem] leading-snug tracking-tight font-geist text-balance">' + (state.firstName ? esc(state.firstName) + ', Ihr Handbuch ist unterwegs' : 'Ihr Handbuch ist unterwegs') + '</h3></div></div>' +
      '<p class="text-[0.9rem] leading-relaxed text-gray-300">Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in unserer E-Mail. Danach erhalten Sie das Handbuch als PDF.</p>' +
      (state.unlocked ? '<button type="button" class="kc-btn-light mt-5 w-full" data-act="to-gate">Zum Fahrplan ↓</button>' : '') +
      '</div>';
  }

  function renderAside() {
    if (!asideSlot) return;
    if (!asideOn()) { asideSlot.innerHTML = ''; return; }
    asideSlot.innerHTML = state.requested ? asideDone() : gate(true);
  }

  function fullReport() {
    var s = stats();
    var open = openItems();
    var html = '<section class="kc-report rounded-3xl border border-gray-200 bg-gray-50/40 p-4 sm:p-8 lg:p-10 scroll-mt-6" id="kc-report">' +
      '<div class="flex flex-wrap items-center justify-between gap-4 mb-2">' +
        '<h3 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 font-geist">' + (state.firstName ? esc(state.firstName) + ', Ihr Handbuch ist unterwegs' : 'Ihr Handbuch und Fahrplan') + '</h3>' +
        '<div class="flex flex-wrap gap-2 kc-noprint">' +
          '<button type="button" class="kc-btn-ghost" data-act="print">Als PDF speichern</button>' +
          '<button type="button" class="kc-btn-ghost" data-act="copy-link">Link kopieren</button>' +
          '<a class="kc-btn-ghost" data-act="share" href="mailto:?subject=' + encodeURIComponent('KI-Tutor-Einführung: unser Fahrplan') + '&body=' + encodeURIComponent('Hallo,\n\nich habe für unsere geplante KI-Tutor-Einführung eine Checkliste durchgearbeitet (DSGVO, EU AI Act, Mitbestimmung, Anbieterauswahl). Hier ist der aktuelle Stand mit allen offenen Punkten:\n' + reportLink() + '\n\nKönnen wir die Punkte gemeinsam ansehen, bevor wir einen Anbieter auswählen?') + '">An Datenschutz weiterleiten</a>' +
        '</div></div>' +
      '<div class="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] my-6 kc-noprint">' +
        '<div class="kc-dl-card"><span class="kc-dl-ico" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span><span><span class="block font-semibold text-gray-900 font-geist">Handbuch als PDF per E-Mail</span><span class="block text-sm text-gray-600 mt-1">28 Seiten zum Abhaken, Ausfüllen und Weiterleiten. Kommt, sobald die E-Mail-Adresse bestätigt ist.</span></span></div>' +
        (CFG.assistantUrl ? '<a href="#assistent" data-act="to-assistant" class="kc-dl-card"><span class="kc-dl-ico is-chat" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg></span><span><span class="block font-semibold text-gray-900 font-geist">KI-Assistent fragen →</span><span class="block text-sm text-gray-600 mt-1">Fragen zum Handbuch, jederzeit, mit Verweis auf die Fundstelle.</span></span></a>' : '') +
      '</div>' +
      '<p class="text-sm text-gray-600 mb-8">Ihr Fahrplan unten – Stand: ' + s.done + ' von ' + s.total + ' erledigt. Haken Sie oben weiter ab – der Fahrplan aktualisiert sich mit.</p>';

    if (open.length) {
      html += '<div class="space-y-8 mb-12">' + chapters().map(function (c) {
        var its = open.filter(function (i) { return i.ch === c.id; });
        if (!its.length) return '';
        return '<div><p class="text-sm font-semibold text-blue-600 font-geist mb-3">' + esc(c.title) + ' <span class="normal-case font-normal text-gray-500">– ' + esc(c.sub) + '</span></p><ul class="space-y-2">' +
          its.map(function (i) {
            return '<li class="kc-task"><span class="kc-box"></span><span><strong class="font-semibold text-gray-900">' + (i.must ? '<span class="text-red-600">Pflicht: </span>' : '') + esc(i.t) + '</strong><br>' + esc(i.how) + ' <span class="text-xs text-gray-500 font-geist">(' + esc(i.law) + ')</span></span></li>';
          }).join('') + '</ul></div>';
      }).join('') + '</div>';
    } else {
      html += '<p class="rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-900 p-5 mb-12">Alle Punkte erledigt – Sie sind startklar. Speichern Sie den Fahrplan als Nachweis.</p>';
    }

    var doneList = activeItems().filter(function (i) { return state.done[i.id]; });
    if (doneList.length) {
      html += '<details class="kc-tpl mb-12"><summary>Bereits erledigt (' + doneList.length + ')</summary><ul class="space-y-1.5 mt-3">' +
        doneList.map(function (i) { return '<li class="kc-task"><span class="kc-box kc-box-done"></span><span class="text-gray-500">' + esc(i.t) + '</span></li>'; }).join('') +
        '</ul></details>';
    }

    html += '<h4 class="text-xl font-semibold tracking-tight text-gray-900 font-geist mb-4">Vorlagen</h4><div class="space-y-3 mb-12">' +
      TEMPLATES.map(function (t, n) {
        return '<details class="kc-tpl"' + (n === 0 ? ' open' : '') + '><summary>' + esc(t.title) + '<span class="text-xs text-gray-500 font-normal">' + esc(t.ref) + '</span></summary>' +
          '<pre class="kc-pre">' + esc(t.body) + '</pre>' +
          '<button type="button" class="kc-btn-ghost mt-3 kc-noprint" data-act="copy-tpl" data-i="' + n + '">Text kopieren</button></details>';
      }).join('') + '</div>';

    html += '<div class="kc-promo rounded-3xl text-white p-8 sm:p-10">' +
      '<p class="text-xs font-semibold uppercase tracking-widest text-gray-400 font-geist mb-2">In eigener Sache</p>' +
      '<h4 class="text-2xl font-semibold tracking-tight font-geist mb-3">So beantwortet AlphaLearn die Anbieter-Fragen</h4>' +
      '<p class="text-gray-400 text-sm leading-relaxed mb-6 max-w-2xl">Wir haben diese Checkliste gebaut, weil wir genau diese Fragen in jedem Auswahlprozess beantworten. Falls Sie AlphaLearn – den KI-Tutor für Moodle und ILIAS – in Ihre Auswahl aufnehmen, hier unsere Antworten in Kurzform:</p>' +
      '<ul class="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-gray-300 mb-8">' +
        BRIDGE.map(function (x) { return '<li class="kc-li">' + esc(x) + '</li>'; }).join('') +
      '</ul>' +
      '<div class="flex flex-col sm:flex-row gap-3 kc-noprint">' +
        '<a href="' + esc(CFG.demoUrl) + '?utm_source=ki-check&utm_medium=report" data-cta="kicheck_demo" class="kc-btn-light">Tutor-Demo ansehen</a>' +
        '<a href="' + esc(CFG.calendlyUrl) + '" data-cta="kicheck_call" target="_blank" rel="noopener" class="kc-btn-outline">Fahrplan in 20 Minuten besprechen</a>' +
        '<a href="' + esc(CFG.complianceUrl) + '" data-cta="kicheck_compliance" class="kc-btn-outline">Compliance-Details</a>' +
      '</div></div>' +
      '<p class="text-xs text-gray-500 mt-8 leading-relaxed">Diese Checkliste ersetzt keine Rechtsberatung. Stand der Rechtslage: Oktober 2026 (DSGVO, KI-Verordnung nach Digital Omnibus, BetrVG).</p>' +
      '</section>';
    return html;
  }

  // Fakten aus /de/compliance.html bzw. Produkt. VOR LIVEGANG PRÜFEN.
  var BRIDGE = [
    'Hosting in Deutschland (München, Frankfurt)',
    'Standard-AVV nach Art. 28 DSGVO',
    'Kein Training mit Ihren Inhalten oder Lernenden-Daten',
    'KI-Antworten klar als KI gekennzeichnet',
    'Antworten aus Ihren Kursinhalten, mit Quellenbezug',
    'Natives Plugin für Moodle und ILIAS',
    'Auswertung der Antwortqualität im Portal',
    'Rechte an Ihren Inhalten bleiben bei Ihnen'
  ];

  var TEMPLATES = [
    { title: 'Anbieter-Fragenkatalog: 15 Fragen an jeden KI-Anbieter', ref: 'DSGVO, KI-Verordnung, BetrVG',
      body: 'Rollen & Datenschutz\n1. Wo laufen Hosting und Sprachmodell (Anbieter, Land, Region)?\n2. Welche Unterauftragsverarbeiter setzen Sie ein – inklusive Sprachmodell-Anbieter?\n3. Liegen AVV und TOMs fertig vor? Nutzen Sie unsere Daten für eigene Zwecke?\n4. Werden Eingaben unserer Lernenden zum Training oder Fine-Tuning genutzt?\n5. Falls Drittland: DPF-Zertifizierung oder Standardvertragsklauseln?\n6. Welche Löschfristen gelten, und löschen Sie automatisch?\n7. Liefern Sie Bausteine für eine Datenschutz-Folgenabschätzung?\n\nKI-Verordnung\n8. Wie wird Lernenden angezeigt, dass sie mit einer KI sprechen?\n9. Enthält das System Emotions- oder Stimmungserkennung?\n10. Wie stufen Sie Ihr System ein, und welche Funktionen würden es zu Hochrisiko machen?\n\nQualität, Sicherheit, Mitbestimmung\n11. Antwortet der Tutor nur aus unseren Inhalten, mit Quellenangabe?\n12. Lässt sich die Didaktik einstellen (z. B. keine Lösungen vorsagen)?\n13. Wie lassen sich Antworten bewerten und Fehler melden – ohne Einzelauswertung von Personen?\n14. Wie lange liefern Sie Sicherheitsupdates, und wie informieren Sie über Sicherheitslücken?\n15. Was passiert mit Inhalten und Daten bei Vertragsende?' },
    { title: 'Rollen-Steckbrief', ref: 'Art. 4, 28 DSGVO; Art. 3 KI-Verordnung',
      body: 'KI-Tutor: [Name], Einsatz in: [Kurs/Bereich], Zweck: Lernbegleitung\n\nDSGVO\nVerantwortlicher: [Ihre Organisation]\nAuftragsverarbeiter: [Anbieter], AVV vom [Datum]\nUnterauftragsverarbeiter: [Hosting], [Sprachmodell-Anbieter, Region]\n\nKI-Verordnung\nAnbieter (Hersteller): [Anbieter]\nBetreiber: [Ihre Organisation]\nEinstufung: kein Hochrisiko (keine Bewertung, Zulassung, Einstufung oder Prüfungsaufsicht)\n\nAnsprechpersonen\nFachlich: [Name]   Technisch: [Name]   Datenschutz: [Name]   Vertretung: [Name]' },
    { title: 'Transparenzhinweis für das Chatfenster', ref: 'Art. 50 KI-Verordnung',
      body: 'Sie sprechen mit [Name des Tutors], einem KI-gestützten Lernbegleiter.\nDie Antworten werden automatisch auf Basis der Kursinhalte erzeugt und können Fehler enthalten.\nBei prüfungsrelevanten Fragen wenden Sie sich bitte zusätzlich an [Ansprechperson/Kontakt].\nBitte geben Sie keine sensiblen persönlichen Daten ein.\nHinweise zum Datenschutz: [Link zur Datenschutzerklärung]' },
    { title: 'Schulungsnachweis KI-Kompetenz', ref: 'Art. 4 KI-Verordnung',
      body: 'Organisation: [Name]\nKI-System: [Name des KI-Tutors], Einsatzzweck: Lernbegleitung in [Kurs/Bereich]\nDatum der Schulung: [TT.MM.JJJJ]   Dauer: [Minuten]   Durchgeführt von: [Name]\n\nInhalte:\n- Funktionsweise und Grenzen des KI-Tutors (inkl. möglicher Fehlantworten)\n- Datenschutz: welche Daten verarbeitet werden, was nicht eingegeben werden soll\n- Transparenzpflicht gegenüber Lernenden\n- Umgang mit gemeldeten Fehlern, Ansprechpersonen\n\nTeilnehmende (Name, Funktion, Unterschrift):\n1. ____________________\n2. ____________________\n\nNächste Auffrischung: [Datum]' },
    { title: 'Eckpunkte für eine Betriebsvereinbarung', ref: '§ 87 Abs. 1 Nr. 6 BetrVG',
      body: '1. Gegenstand und Zweck: KI-Tutor ausschließlich zur Lernunterstützung\n2. Ausschluss der Leistungs- und Verhaltenskontrolle; keine Auswertung einzelner Beschäftigter\n3. Zulässige Auswertungen: nur aggregiert (z. B. ab 5 Personen)\n4. Datenkategorien, Speicherdauer und Löschung\n5. Zugriffsrechte: wer welche Daten sehen darf\n6. Transparenz gegenüber den Beschäftigten, Schulung (Art. 4 KI-Verordnung)\n7. Änderungen am System nur nach Information des Betriebsrats\n8. Evaluation nach 6 Monaten' }
  ];

  // ---------- Versand (Kit / Google Sheets) ----------
  function submitLead(fd) {
    var providers = CFG.providers || [];
    var s = stats();
    var payload = {
      first_name: fd.get('first_name') || '',
      email: fd.get('email') || '',
      newsletter: fd.get('newsletter') ? 'ja' : 'nein',
      ampel: s.done + '/' + s.total + ' erledigt, ' + s.mustOpen + ' Pflicht offen',
      ampel_bloecke: chapters().map(function (c) { var x = stats(itemsOf(c.id)); return c.id + ':' + x.done + '/' + x.total; }).join(' '),
      luecken: openItems().map(function (i) { return i.id; }).join(' '),
      status: state.employees === true ? 'checkliste+bv' : 'checkliste',
      report_link: reportLink(),
      version: DATA.version,
      quelle: (new URLSearchParams(location.search)).get('utm_source') || document.referrer || 'direkt'
    };
    var jobs = [];
    if (providers.indexOf('kit') !== -1 && CFG.kit && CFG.kit.formId) {
      var body = new URLSearchParams();
      body.append('email_address', payload.email);
      body.append('fields[first_name]', payload.first_name);
      ['newsletter', 'ampel', 'report_link'].forEach(function (k) { body.append('fields[ki_check_' + k + ']', payload[k]); });
      jobs.push(fetch(CFG.kit.endpoint.replace('{formId}', CFG.kit.formId), { method: 'POST', mode: 'no-cors', body: body }));
    }
    if (providers.indexOf('sheets') !== -1 && CFG.sheets && CFG.sheets.endpoint) {
      jobs.push(fetch(CFG.sheets.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }));
    }
    return Promise.all(jobs).catch(function () { /* Fahrplan trotzdem zeigen */ });
  }

  // ---------- Events ----------
  function syncHash() { if (state.unlocked) history.replaceState(null, '', '#r=' + encodeState()); }

  function onClick(e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'FORM') return;
    var act = el.getAttribute('data-act');
    if (act === 'toggle') {
      var id = el.getAttribute('data-id');
      if (state.done[id]) delete state.done[id]; else state.done[id] = true;
      if (!state.started) { state.started = true; track('check_start', { from: 'tick' }); }
      var it = ITEMS.filter(function (x) { return x.id === id; })[0];
      var cs = stats(itemsOf(it.ch));
      if (state.done[id] && cs.done === cs.total) track('check_block_complete', { block: it.ch });
      save(); syncHash(); render();
    }
    else if (act === 'details') { var d = el.getAttribute('data-id'); state.open[d] = !state.open[d]; render(); }
    else if (act === 'tab') { state.ch = el.getAttribute('data-ch'); render(); scrollTo(root); }
    else if (act === 'emp') { state.employees = el.getAttribute('data-val') === '1'; save(); syncHash(); render(); }
    else if (act === 'to-gate') {
      track('check_result_view', { done: stats().done, total: stats().total });
      var g = document.getElementById('kc-gate');
      if (!state.unlocked && asideOn() && g) {
        // Kasten steht schon sichtbar in der Seitenspalte: hervorheben und ins erste Feld springen
        g.classList.remove('kc-flash'); void g.offsetWidth; g.classList.add('kc-flash');
        var f = g.querySelector('input[name=first_name]'); if (f) f.focus({ preventScroll: true });
      } else scrollTo(document.getElementById(state.unlocked ? 'kc-report' : 'kc-gate'));
    }
    else if (act === 'print') { track('check_report_print', {}); window.print(); }
    else if (act === 'copy-link') { copy(reportLink(), el, 'Link kopiert'); track('check_share', { method: 'copy' }); }
    else if (act === 'share') { track('check_share', { method: 'mail' }); }
    else if (act === 'dl') { track('check_handbook_download', { from: 'report' }); }
    else if (act === 'copy-tpl') { copy(TEMPLATES[el.getAttribute('data-i')].body, el, 'Kopiert'); }
  }

  function onSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var fd = new FormData(form);
    var err = form.querySelector('.kc-error');
    var email = String(fd.get('email') || '').trim();
    if (!String(fd.get('first_name') || '').trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      err.textContent = 'Bitte Vorname und eine gültige E-Mail-Adresse angeben.';
      err.hidden = false; return;
    }
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Einen Moment …';
    track('check_report_request', { done: stats().done, newsletter: fd.get('newsletter') ? 'ja' : 'nein' });
    submitLead(fd).then(function () {
      state.unlocked = true;
      state.requested = true;
      state.firstName = String(fd.get('first_name')).trim();
      try { localStorage.setItem(STORE + '-u', '1'); } catch (x) { /* egal */ }
      syncHash(); render(); renderAside();
      scrollTo(document.getElementById('kc-report'));
    });
  }

  root.addEventListener('click', onClick);
  root.addEventListener('submit', onSubmit);
  if (asideSlot) { asideSlot.addEventListener('click', onClick); asideSlot.addEventListener('submit', onSubmit); }
  if (mqAside) {
    var onMq = function () { render(); renderAside(); };
    if (mqAside.addEventListener) mqAside.addEventListener('change', onMq); else if (mqAside.addListener) mqAside.addListener(onMq);
  }

  function copy(text, el, msg) {
    var done = function () { var t = el.textContent; el.textContent = msg; setTimeout(function () { el.textContent = t; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
  }

  // KI-Assistent (#assistent) nur zeigen, wenn konfiguriert
  var asst = document.getElementById('assistent');
  if (asst && CFG.assistantUrl) {
    asst.hidden = false;
    var fr = asst.querySelector('iframe');
    if (fr) fr.setAttribute('data-src', CFG.assistantUrl);
    if (fr && location.hash === '#assistent') fr.setAttribute('src', CFG.assistantUrl);
  }

  // Start-Buttons außerhalb der App (Hero)
  document.querySelectorAll('[data-kc-start]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); track('check_start', { from: 'hero' }); state.started = true; scrollTo(root); });
  });

  // Fahrplan-Link aus E-Mail (#r=...) hat Vorrang, sonst gespeicherter Stand
  var m = /#r=([^&]+)/.exec(location.hash);
  if (m && decodeState(decodeURIComponent(m[1]))) { state.unlocked = true; save(); track('check_report_open', {}); }
  else {
    load();
    try { state.unlocked = localStorage.getItem(STORE + '-u') === '1'; } catch (x) { /* egal */ }
  }
  try { state.requested = localStorage.getItem(STORE + '-u') === '1'; } catch (x) { /* egal */ }
  render();
  renderAside();
})();
