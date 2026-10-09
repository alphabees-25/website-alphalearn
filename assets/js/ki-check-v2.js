/* KI-Check als Fragebogen (v2) – Fragen zum Ist-Stand statt Abhaken.
   Inhalte: ki-check-data.js (36 Punkte, why/how/law, juristisch abgestimmt, unverändert),
   Fragen: ki-check-questions.js, Konfiguration: ki-check-config.js (unverändert).
   Ablauf: Fragen beantworten -> Vorschau mit Ampel -> Formular (Vorname, E-Mail) -> vollständiges Ergebnis.
   Textfelder bleiben im Browser; übertragen werden nur Vorname, E-Mail, Organisation, Rolle und Ampel. */
(function () {
  'use strict';

  var DATA = window.KI_CHECK_DATA;
  var Q = window.KI_CHECK_QUESTIONS;
  var CFG = window.KI_CHECK_CONFIG || {};
  var root = document.getElementById('kc-app');
  if (!DATA || !Q || !root) return;

  var asideSlot = document.getElementById('kc-aside-slot');
  var mqAside = window.matchMedia ? window.matchMedia('(min-width: 1280px)') : null;
  // Seitenspalte nur, wenn sie per CSS sichtbar ist (derzeit ausgeblendet: mehr Platz für die Fragen)
  function asideOn() { return !!(asideSlot && mqAside && mqAside.matches && asideSlot.offsetParent !== null); }

  var ITEMS = DATA.items;
  var CH = DATA.chapters;
  var STORE = 'kc-fragebogen-' + Q.version;

  var state = {
    step: Q.steps[0].id,
    answers: {},        // Frage-ID -> Wert (single) bzw. Liste (multi)
    texts: {},          // Textfelder (bleiben im Browser)
    why: {},            // „Warum fragen wir das?“ aufgeklappt
    requested: false,   // Ergebnis in diesem Browser angefordert
    unlocked: false,    // Ergebnis sichtbar (angefordert oder über Link)
    firstName: '',
    justUnlocked: false,
    lastStep: null,     // eben abgeschlossener Schritt (Zwischenstand oben anzeigen)
    started: false,
    legacyDone: null    // alter Teilen-Link (#r=) der Checkliste
  };

  // ---------- Helfer ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function track(name, params) {
    params = params || {};
    params.page_role = 'leadmagnet';
    params.source_page = location.pathname;
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }
  function scrollTo(el) {
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 24, behavior: 'smooth' });
  }
  function itemById(id) { return ITEMS.filter(function (i) { return i.id === id; })[0]; }
  function chById(id) { return CH.filter(function (c) { return c.id === id; })[0]; }
  function txt(k) { var v = state.texts[k]; return v ? String(v).trim() : ''; }
  var DOC = '<svg class="kc-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>';

  // ---------- Speichern: Browser + Teilen-Link (nur Antwortcodes, keine Textfelder) ----------
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ a: state.answers, t: state.texts, s: state.step })); } catch (e) { /* egal */ }
  }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (d) { state.answers = d.a || {}; state.texts = d.t || {}; if (d.s) state.step = d.s; }
      state.requested = localStorage.getItem(STORE + '-u') === '1';
      state.firstName = localStorage.getItem(STORE + '-n') || '';
    } catch (e) { /* egal */ }
  }
  function encodeAnswers() {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(state.answers)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
    catch (e) { return ''; }
  }
  function decodeAnswers(str) {
    try {
      var b = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      var o = JSON.parse(decodeURIComponent(escape(atob(b))));
      return o && typeof o === 'object' ? o : null;
    } catch (e) { return null; }
  }
  function decodeLegacy(str) {
    var m = /^([01_])-([01]+)$/.exec(str || '');
    if (!m || m[2].length !== ITEMS.length) return null;
    var done = {};
    ITEMS.forEach(function (i, n) { if (m[2].charAt(n) === '1') done[i.id] = true; });
    if (m[1] === '0') state.answers.p_emp = 'nein';
    return done;
  }
  function reportLink() { return (CFG.reportUrl || location.origin + location.pathname) + '#a=' + encodeAnswers(); }
  function syncHash() { if (state.unlocked && state.step === 'E') history.replaceState(null, '', '#a=' + encodeAnswers()); }

  // ---------- Fragen, Schritte, Status ----------
  function stepActive(s) { return !s.employeesOnly || state.answers.p_emp !== 'nein'; }
  function qSteps() { return Q.steps.filter(stepActive); }
  function allSteps() { return qSteps().concat([{ id: 'E', title: 'Ihre Auswertung', result: true }]); }
  function stepById(id) { return allSteps().filter(function (s) { return s.id === id; })[0]; }
  function optOf(q, v) { return (q.opts || []).filter(function (o) { return o.v === v; })[0]; }
  function hasHr(q, list) { return (list || []).some(function (v) { var o = optOf(q, v); return o && o.hr; }); }
  function qById(id) {
    var r = null;
    Q.steps.forEach(function (s) { s.questions.forEach(function (q) { if (q.id === id) r = q; }); });
    return r;
  }
  function visible(q) {
    if (!q.showIf) return true;
    var a = state.answers[q.showIf.q];
    if (q.showIf.eq != null) return a === q.showIf.eq;
    if (q.showIf.noHr) return !!(a && a.length) && !hasHr(qById(q.showIf.q), a);
    return true;
  }
  function visibleQs(step) { return (step.questions || []).filter(visible); }
  function named(k) { return !!txt(k) && !state.texts[k + '_none']; }
  function answered(q) {
    if (q.type === 'single') return state.answers[q.id] != null;
    if (q.type === 'multi') return !!(state.answers[q.id] && state.answers[q.id].length);
    return (q.fields || []).some(function (f) { return !!txt(f.k) || !!state.texts[f.k + '_none']; });
  }
  function progress() {
    var total = 0, done = 0;
    qSteps().forEach(function (s) { visibleQs(s).forEach(function (q) { if (q.optional) return; total++; if (answered(q)) done++; }); });
    return { total: total, done: done, pct: total ? Math.round(done / total * 100) : 0 };
  }
  var SKIP = Q.skipItems || [];
  function activeItems() { return ITEMS.filter(function (i) { return SKIP.indexOf(i.id) === -1 && (!chById(i.ch).employeesOnly || state.answers.p_emp !== 'nein'); }); }

  function statuses() {
    var st = {};
    if (state.legacyDone && !Object.keys(state.answers).filter(function (k) { return k !== 'p_emp'; }).length) {
      ITEMS.forEach(function (i) { st[i.id] = state.legacyDone[i.id] ? 'done' : 'open'; });
      return st;
    }
    qSteps().forEach(function (s) {
      visibleQs(s).forEach(function (q) {
        var a = state.answers[q.id];
        if (q.type === 'single' && a != null) {
          var o = optOf(q, a);
          if (o && o.s) Object.keys(o.s).forEach(function (k) { st[k] = o.s[k]; });
        } else if (q.type === 'multi' && a && a.length) {
          if (a.indexOf('none') !== -1) (q.items || []).forEach(function (id) { st[id] = 'unclear'; });
          else q.opts.forEach(function (o) { if (o.item) st[o.item] = a.indexOf(o.v) !== -1 ? 'done' : 'open'; });
        }
      });
    });
    // Einsatzzweck mit Bewertung, Zulassung, Einstufung oder Prüfungsaufsicht: nicht selbst einstufen, fachlich prüfen lassen
    if (hasHr(qById('a1'), state.answers.a1)) st.A1 = 'check';
    // Personen: alle drei benannt + Vertretung = erledigt, teilweise benannt = teilweise
    var n = ['p_fach', 'p_tech', 'p_ds'].filter(named).length, vt = state.answers.r5_vertretung;
    if (n || vt) st.R5 = (n === 3 && vt === 'ja') ? 'done' : (n > 0 ? 'part' : 'open');
    return st;
  }
  function stat(st, i) { return st[i.id] || 'unanswered'; }
  function isClear(s) { return s === 'done' || s === 'na'; }
  var LABEL = { open: 'Offen', unclear: 'Klären', part: 'Teilweise', check: 'Fachlich prüfen', unanswered: 'Nicht beantwortet', done: 'Erledigt', na: 'Entfällt' };

  function summary() {
    var st = statuses(), its = activeItems();
    var must = its.filter(function (i) { return i.must; });
    return {
      st: st,
      mustTotal: must.length,
      mustDone: must.filter(function (i) { return isClear(stat(st, i)); }).length,
      todo: its.filter(function (i) { return !isClear(stat(st, i)); }).length,
      unclear: its.filter(function (i) { return stat(st, i) === 'unclear'; }).length
    };
  }
  function early() { return state.answers.p_phase === 'idee' || state.answers.p_phase === 'auswahl'; }
  function ampel(chId, st) {
    var its = activeItems().filter(function (i) { return i.ch === chId; });
    var red = its.some(function (i) { var s = stat(st, i); return i.must && (s === 'open' || s === 'unclear' || s === 'unanswered'); });
    var yellow = its.some(function (i) { var s = stat(st, i); return (i.must && (s === 'part' || s === 'check')) || (!i.must && !isClear(s)); });
    if (red) return early() ? 'early' : 'red';
    return yellow ? 'yellow' : 'green';
  }
  var AMPEL_LABEL = { red: 'Klärungsbedarf', early: 'Vor dem Start klären', yellow: 'Teilweise geklärt', green: 'Geklärt' };

  var OWNER_ROLE = { p_fach: 'fachlich', p_tech: 'technisch', p_ds: 'Datenschutz' };
  function ownerOf(i) {
    if (i.ch === 'M') return 'Projektleitung und Betriebsrat';
    var k = Q.owner[i.id] || Q.owner[i.ch];
    if (!k) return null;
    if (named(k)) return txt(k);
    return state.texts[k + '_none'] ? 'noch niemand benannt (' + OWNER_ROLE[k] + ')' : null;
  }
  function priority(st) {
    var order = early() ? ['R', 'D', 'F', 'A', 'M', 'S'] : ['A', 'S', 'D', 'R', 'F', 'M'];
    function rank(i) {
      var s = stat(st, i);
      if (i.must && (s === 'open' || s === 'unclear' || s === 'unanswered')) return 0;
      if (i.must) return 1;
      if (s === 'open' || s === 'unclear') return 2;
      return 3;
    }
    return activeItems().filter(function (i) { return !isClear(stat(st, i)); }).sort(function (a, b) {
      return (rank(a) - rank(b)) || (order.indexOf(a.ch) - order.indexOf(b.ch)) || (ITEMS.indexOf(a) - ITEMS.indexOf(b));
    });
  }

  // ---------- Auswertung: Dokumente, Freigaben, Fragen, Einschätzung ----------
  var SEV = { open: 0, unanswered: 1, unclear: 2, check: 3, part: 4, done: 5, na: 6 };
  function worst(list) {
    var l = list.filter(function (s) { return s !== 'na'; });
    if (!l.length) return 'na';
    return l.sort(function (a, b) { return SEV[a] - SEV[b]; })[0];
  }
  function itemsActive(ids) { return ids.filter(function (id) { var i = itemById(id); return i && SKIP.indexOf(id) === -1 && (!chById(i.ch).employeesOnly || state.answers.p_emp !== 'nein'); }); }
  var DOC_LABEL = { open: 'Fehlt', unanswered: 'Offen', unclear: 'Klären', check: 'Prüfen lassen', part: 'Teilweise', done: 'Liegt vor', na: 'Entfällt' };
  var DOC_FROM = { anbieter: 'Vom Anbieter anfordern', intern: 'Selbst erstellen', br: 'Mit dem Betriebsrat' };
  function docList(st) {
    return Q.docs.map(function (d) {
      var ids = itemsActive(d.items);
      return ids.length ? { t: d.t, from: d.from, tpl: d.tpl, s: worst(ids.map(function (id) { return stat(st, itemById(id)); })) } : null;
    }).filter(function (d) { return d && d.s !== 'na'; });
  }
  function apprList(st) {
    var out = Q.approvals.filter(function (a) { return !a.employeesOnly || state.answers.p_emp !== 'nein'; }).map(function (a) {
      var ids = itemsActive(a.items);
      return { who: a.who, what: a.what, person: a.owner && named(a.owner) ? txt(a.owner) : '', s: worst(ids.map(function (id) { return stat(st, itemById(id)); })) };
    });
    // Fachliche bzw. rechtliche Prüfung nur, wenn Antworten sie nahelegen
    var why = [];
    var a1 = state.answers.a1 || [];
    var onlyPractice = a1.indexOf('uebung') !== -1 && a1.every(function (v) { return v === 'uebung' || v === 'lernen'; });
    if (st.A1 === 'check') why.push(onlyPractice ? 'Bewertung von Übungsantworten – klären, ob das als Bewertung von Lernergebnissen zählt' : 'Einsatz mit Bewertung, Zulassung, Einstufung oder Prüfungsaufsicht');
    if (st.R3 === 'check') why.push('selbst entwickelter Tutor');
    if (st.D5 === 'check') why.push('geplante Einwilligungen');
    if (why.length) out.push({ who: 'Fachliche bzw. rechtliche Prüfung', what: why.join(', '), person: '', s: 'check' });
    return out.filter(function (a) { return a.s !== 'na'; });
  }
  function vendorQuestions(st) {
    var lines = TEMPLATES[0].body.split('\n').filter(function (l) { return /^\d+\. /.test(l); });
    var nums = {};
    activeItems().forEach(function (i) { if (!isClear(stat(st, i)) && Q.vendorMap[i.id]) Q.vendorMap[i.id].forEach(function (n) { nums[n] = true; }); });
    return Object.keys(nums).map(Number).sort(function (a, b) { return a - b; }).map(function (n) { return lines[n - 1].replace(/^\d+\. /, ''); });
  }
  function internalList(st) { return activeItems().filter(function (i) { return stat(st, i) === 'unclear'; }); }
  function blockers(st) { return activeItems().filter(function (i) { var s = stat(st, i); return i.must && (s === 'open' || s === 'unclear' || s === 'unanswered'); }); }
  function evaluation() {
    var sm = summary(), st = sm.st;
    var docs = docList(st), appr = apprList(st), vq = vendorQuestions(st), il = internalList(st), bl = blockers(st);
    return { sm: sm, st: st, docs: docs, docsMissing: docs.filter(function (d) { return !isClear(d.s); }).length,
      appr: appr, apprOpen: appr.filter(function (a) { return !isClear(a.s); }).length, vq: vq, il: il, bl: bl };
  }
  // Einschätzung in einem Absatz: Projektphase, Blocker, „Weiß ich nicht“
  function verdict(ev) {
    var ph = state.answers.p_phase, n = ev.bl.length, u = ev.il.length;
    var vendorBl = ev.bl.filter(function (i) { return Q.vendorMap[i.id]; }).length;
    var lead = { idee: 'Sie stehen am Anfang – der beste Zeitpunkt, die Weichen richtig zu stellen.',
      auswahl: 'Sie sind in der Anbieterauswahl. Jetzt haben Sie den größten Hebel: Vor der Unterschrift klärt der Anbieter offene Punkte am schnellsten.',
      pilot: 'Ihr Pilot läuft bereits.', betrieb: 'Ihr Tutor ist im Regelbetrieb.' }[ph] || '';
    var core;
    if (!n) core = 'Laut Ihren Angaben ist kein Pflichtpunkt mehr offen. Jetzt geht es um Feinschliff: ' + ev.sm.todo + (ev.sm.todo === 1 ? ' Empfehlung' : ' Empfehlungen') + ' für einen reibungslosen Betrieb.';
    else if (ph === 'pilot' || ph === 'betrieb') core = n + (n === 1 ? ' Pflichtpunkt ist' : ' Pflichtpunkte sind') + ' noch offen. Weil der Tutor schon läuft, sollten Sie diese zuerst schließen.';
    else core = n + (n === 1 ? ' Pflichtpunkt ist' : ' Pflichtpunkte sind') + ' vor dem Start noch offen' + (vendorBl ? ' – ' + vendorBl + ' davon klären Sie mit einer einzigen Mail an den Anbieter.' : '.');
    var tail = u ? ' Bei ' + u + (u === 1 ? ' Punkt' : ' Punkten') + ' wussten Sie die Antwort nicht – normal in dieser Phase. Die Klärungsliste zeigt, wen Sie fragen.' : '';
    return (lead ? lead + ' ' : '') + core + tail;
  }

  // ---------- Bausteine ----------
  function bookMock(cls) {
    return '<div class="kc-mock-stage ' + cls + '" aria-hidden="true"><div class="kc-mock-book">' +
      '<img class="kc-mock-cover" src="/assets/images/ki-check/handbuch-cover.webp" width="1024" height="1536" alt="" loading="lazy" decoding="async">' +
      '<span class="kc-mock-gloss"></span><span class="kc-mock-pages"></span><span class="kc-mock-back"></span></div></div>';
  }

  function render() {
    var steps = allSteps();
    if (!stepById(state.step)) state.step = steps[0].id;
    var ae = document.activeElement, fid = ae && root.contains(ae) && ae.id ? ae.id : null, sel = null;
    if (fid && ae.setSelectionRange && typeof ae.selectionStart === 'number') sel = [ae.selectionStart, ae.selectionEnd];
    root.innerHTML = '<div class="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">' + navHtml(steps) + contentHtml() + '</div>';
    if (fid) {
      var nf = document.getElementById(fid);
      if (nf) { nf.focus({ preventScroll: true }); if (sel) try { nf.setSelectionRange(sel[0], sel[1]); } catch (x) { /* egal */ } }
    }
    root.classList.add('kc-ready');
    renderAside();
  }

  function navHtml(steps) {
    var p = progress(), sm = summary();
    return '<aside class="kc-noprint p-5 sm:p-8 lg:p-6 border-b border-gray-100 lg:border-b-0 lg:border-r lg:border-gray-200/80 lg:bg-white/90"><div class="lg:sticky lg:top-6">' +
      '<div class="kc-side-card">' +
        '<div><p class="text-xs font-semibold uppercase tracking-wide text-gray-500 font-geist mb-1">Ihr KI-Check</p>' +
        '<p class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 font-geist" data-prog="t">' + p.done + ' von ' + p.total + ' Fragen beantwortet</p></div>' +
        '<div class="kc-bar-track my-3"><div class="kc-bar" data-prog="bar" style="width:' + p.pct + '%"></div></div>' +
        '<p class="text-sm font-medium text-gray-600" data-prog="must">' + sm.mustDone + ' von ' + sm.mustTotal + ' Pflichtpunkten geklärt</p>' +
      '</div>' +
      '<nav class="grid gap-1.5 sm:flex sm:flex-wrap sm:gap-2 lg:flex-col lg:flex-nowrap lg:gap-1 lg:border-t lg:border-gray-100 lg:pt-4 mt-5" aria-label="Kapitel">' +
        steps.map(function (s, n) {
          var active = s.id === state.step;
          if (s.result) {
            return '<button type="button" class="kc-tab kc-tab--plan' + (active ? ' is-active' : '') + '' + '" data-act="step" data-step="E"' + (active ? ' aria-current="true"' : '') + '>' +
              '<span class="kc-tab-n">' + DOC + '</span><span class="min-w-0">' + 'Ihre Auswertung' + '</span>' +
              '</button>';
          }
          var qs = visibleQs(s).filter(function (q) { return !q.optional; }), a = qs.filter(answered).length, full = qs.length && a === qs.length;
          return '<button type="button" class="kc-tab' + (active ? ' is-active' : '') + (full ? ' is-done' : '') + '" data-act="step" data-step="' + s.id + '"' + (active ? ' aria-current="true"' : '') + '>' +
            '<span class="kc-tab-n">' + (full ? '✓' : (n + 1)) + '</span><span class="min-w-0">' + esc(s.title) + '</span>' +
            '<span class="kc-tab-c" data-prog="tab-' + s.id + '">' + a + '/' + qs.length + '</span></button>';
        }).join('') +
      '</nav>' +
    '</div></aside>';
  }

  function contentHtml() {
    if (state.step === 'E') return state.unlocked ? resultHtml() : teaserHtml();
    return stepHtml(stepById(state.step));
  }

  function stepHtml(step) {
    var qs = qSteps(), idx = qs.indexOf(step), next = qs[idx + 1], prev = qs[idx - 1];
    var vq = visibleQs(step);
    return '<div class="p-5 sm:p-8 lg:p-10 kc-fade" id="kc-chapter">' +
      (state.justUnlocked ? unlockedNote() : doneNote()) +
      '<p class="text-sm font-medium tracking-tight text-blue-600 font-geist mb-2">Schritt ' + (idx + 1) + ' von ' + qs.length + ' · ' + esc(step.sub) + '</p>' +
      '<h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 font-geist mb-3">' + esc(step.title) + '</h2>' +
      '<p class="text-gray-600 mb-7 max-w-2xl leading-relaxed">' + esc(step.intro) + '</p>' +
      '<div class="space-y-6">' + vq.map(function (q, k) { return qCard(q, (idx + 1) + '.' + (k + 1)); }).join('') + '</div>' +
      '<div class="mt-9 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">' +
        (prev ? '<button type="button" class="kc-link text-sm" data-act="step" data-step="' + prev.id + '">← ' + esc(prev.title) + '</button>' : '<span></span>') +
        (next ? '<button type="button" class="kc-btn-primary" data-act="step" data-step="' + next.id + '">Weiter: ' + esc(next.title) + ' →</button>'
              : '<button type="button" class="kc-btn-primary" data-act="step" data-step="E">Zur Auswertung →</button>') +
      '</div>' +
    '</div>';
  }

  function doneNote() {
    var s = state.lastStep && stepById(state.lastStep);
    if (!s || s.result || s.id === 'P') return '';
    var st = statuses(), its = activeItems().filter(function (i) { return i.ch === s.id; });
    var ok = its.filter(function (i) { return isClear(stat(st, i)); }).length;
    var u = its.filter(function (i) { return stat(st, i) === 'unclear'; }).length;
    return '<div class="kq-step-note" role="status"><span class="kq-step-ico" aria-hidden="true">✓</span><span><strong>' + esc(s.title) + ':</strong> ' + ok + ' von ' + its.length + ' Punkten geklärt' +
      (u ? ' · ' + u + (u === 1 ? ' Klärungsaufgabe' : ' Klärungsaufgaben') + ' für Ihren Fahrplan' : '') + '</span></div>';
  }

  function qCard(q, num) {
    var ids = q.item ? [q.item] : (q.items || []);
    var must = ids.some(function (id) { var i = itemById(id); return i && i.must; });
    var html = '<div class="kq-card' + (answered(q) ? ' is-answered' : '') + '" data-q="' + q.id + '">' +
      '<div class="kq-head"><span class="kq-num">' + num + '</span><div class="min-w-0">' +
        '<p class="kq-q">' + esc(q.q) + (must ? ' <span class="kc-must">Pflicht</span>' : '') + '</p>' +
        (q.help ? '<p class="kq-help">' + esc(q.help) + '</p>' : '') +
      '</div></div>';
    if (q.opts) {
      var a = state.answers[q.id], multi = q.type === 'multi';
      var stack = q.opts.some(function (o) { return o.t.length > 34; });
      html += '<div class="kq-opts' + (stack ? ' kq-opts--stack' : '') + '" role="' + (multi ? 'group' : 'radiogroup') + '" aria-label="' + esc(q.q) + '">' + q.opts.map(function (o) {
        var on = multi ? !!(a && a.indexOf(o.v) !== -1) : a === o.v;
        return '<button type="button" id="kq-' + q.id + '-' + esc(o.v) + '" class="kq-opt' + (multi ? ' kq-opt--multi' : '') + (on ? ' is-on' : '') + '" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-act="ans" data-q="' + q.id + '" data-v="' + esc(o.v) + '">' +
          '<span class="kq-mark" aria-hidden="true"></span><span>' + esc(o.t) + '</span></button>';
      }).join('') + '</div>';
    }
    if (q.fields) {
      html += '<div class="kq-fields' + (q.fields.length > 1 ? ' kq-fields--grid' : '') + '">' + q.fields.map(function (f) {
        var id = 'kq-' + f.k, val = state.texts[f.k] || '';
        return '<div class="kq-field"><label for="' + id + '">' + esc(f.label) + '</label>' +
          (f.area ? '<textarea id="' + id + '" data-field="' + f.k + '" rows="3" placeholder="' + esc(f.ph || '') + '">' + esc(val) + '</textarea>'
                  : '<input id="' + id + '" type="text" data-field="' + f.k + '" value="' + esc(val) + '" placeholder="' + esc(f.ph || '') + '" autocomplete="off">') +
          (f.none ? '<label class="kq-none"><input type="checkbox" id="kq-' + f.k + '-none" data-none="' + f.k + '"' + (state.texts[f.k + '_none'] ? ' checked' : '') + '> noch niemand</label>' : '') +
        '</div>';
      }).join('') + '</div>';
    }
    if (ids.length) {
      var open = !!state.why[q.id];
      html += '<button type="button" class="kq-why-btn" data-act="why" data-q="' + q.id + '" aria-expanded="' + open + '">Warum fragen wir das?</button>' +
        (open ? '<div class="kq-why">' + ids.map(function (id) { var i = itemById(id); return '<p>' + (ids.length > 1 ? '<strong>' + esc(i.t) + ':</strong> ' : '') + esc(i.why) + '</p>'; }).join('') + '</div>' : '');
    }
    return html + '</div>';
  }

  function ampelHtml(st) {
    var chs = CH.filter(function (c) { return !c.employeesOnly || state.answers.p_emp !== 'nein'; });
    return '<div class="kq-ampel">' + chs.map(function (c) {
      var its = activeItems().filter(function (i) { return i.ch === c.id; });
      var must = its.filter(function (i) { return i.must; });
      var base = must.length ? must : its;
      var ok = base.filter(function (i) { return isClear(stat(st, i)); }).length;
      var col = ampel(c.id, st);
      return '<div class="kq-ampel-row"><span class="kq-dot kq-dot--' + col + '" aria-hidden="true"></span>' +
        '<span class="kq-ampel-t">' + esc(c.title) + '</span><span class="kq-ampel-l">' + AMPEL_LABEL[col] + '</span>' +
        '<span class="kq-ampel-c">' + ok + '/' + base.length + (must.length ? ' Pflicht' : '') + '</span></div>';
    }).join('') + '</div>';
  }

  // ---------- Vorschau + Formular ----------
  function teaserHtml() {
    var ev = evaluation(), sm = ev.sm, st = ev.st, pr = priority(st), p = progress(), org = txt('org');
    var missing = p.total - p.done;
    var firstOpen = null;
    if (missing) qSteps().some(function (s) { return visibleQs(s).some(function (q) { if (!q.optional && !answered(q)) { firstOpen = s; return true; } return false; }); });
    var anb = txt('anbieter');
    var cards = [
      { q: 'Wo fange ich an?', n: Math.min(3, pr.length), l: 'erste Schritte mit Zuständigkeit' },
      { q: 'Welche Dokumente brauche ich?', n: ev.docsMissing, l: 'von ' + ev.docs.length + ' Dokumenten fehlen oder sind unklar' },
      { q: 'Wer muss zustimmen?', n: ev.apprOpen, l: 'von ' + ev.appr.length + ' Freigaben sind offen' },
      { q: 'Was muss ich fragen?', n: ev.vq.length, l: (ev.vq.length === 1 ? 'Frage' : 'Fragen') + ' an ' + (anb || 'den Anbieter') + (ev.il.length ? ' · ' + ev.il.length + ' intern' : '') },
      { q: 'Was muss ich sonst beachten?', n: sm.todo, l: (sm.todo === 1 ? 'Aufgabe' : 'Aufgaben') + ' im Fahrplan' }
    ];
    if (state.requested) return mailSentHtml();
    return '<div class="p-5 sm:p-8 lg:p-10 kc-fade" id="kc-chapter">' +
      '<p class="text-sm font-medium tracking-tight text-blue-600 font-geist mb-2">Ihre Auswertung' + (org ? ' für ' + esc(org) : '') + '</p>' +
      '<h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 font-geist mb-3">Die Auswertung erhalten Sie per E-Mail</h2>' +
      '<p class="text-gray-600 mb-6 max-w-2xl leading-relaxed">Tragen Sie Vorname und E-Mail-Adresse ein und klicken Sie auf „Absenden“. Wir schicken Ihnen den Link zu Ihrer persönlichen Auswertung – dazu das Handbuch als PDF.</p>' +
      (missing ? '<p class="kq-hint">' + missing + (missing === 1 ? ' Frage ist' : ' Fragen sind') + ' noch offen. ' +
        (firstOpen ? '<button type="button" class="kc-link" data-act="step" data-step="' + firstOpen.id + '">Jetzt beantworten</button> – oder einfach absenden.' : '') + '</p>' : '') +
      gateCard() +
      '<p class="kq-first-l mt-10 mb-3">Das steht in Ihrer Auswertung</p>' +
      '<div class="kq-qcards">' + cards.map(function (c) {
        return '<div class="kq-qcard"><p class="kq-qcard-q">' + esc(c.q) + '</p><p class="kq-qcard-n"><span>' + c.n + '</span> ' + esc(c.l) + '</p><span class="kq-qcard-lock" aria-hidden="true">' + DOC + '</span></div>';
      }).join('') + '</div>' +
    '</div>';
  }

  function mailSentHtml() {
    return '<div class="p-5 sm:p-8 lg:p-10 kc-fade" id="kc-chapter">' +
      '<div class="kc-unlocked" role="status" style="padding-right:1rem">' +
        '<span class="kc-unlocked-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>' +
        '<div class="kc-unlocked-txt"><p class="kc-unlocked-h">' + (state.firstName ? esc(state.firstName) + ', schauen' : 'Schauen') + ' Sie in Ihr Postfach</p>' +
        '<p class="kc-unlocked-p">' + MAIL_SENT_TEXT + '</p></div>' +
      '</div>' +
      '<p class="text-sm text-gray-600 leading-relaxed max-w-2xl">Keine E-Mail da? Bitte prüfen Sie auch den Spam-Ordner. Absender ist marketing@alphabees.de.</p>' +
      '<div class="flex flex-wrap gap-3 mt-6"><button type="button" class="kc-btn-ghost" data-act="step" data-step="' + qSteps()[0].id + '">Antworten ansehen</button></div>' +
    '</div>';
  }
  var MAIL_SENT_TEXT = 'Wir haben Ihnen eine E-Mail mit dem Link zu Ihrer Auswertung geschickt. Bestätigen Sie darin außerdem Ihre E-Mail-Adresse – dann erhalten Sie das Handbuch als PDF.';

  function formHtml(wide) {
    return '<div class="kc-form-frame"><form class="kc-form kc-form-card text-gray-900" data-act="submit" novalidate>' +
      '<div class="grid gap-3' + (wide ? ' sm:grid-cols-2' : '') + '">' +
        '<label class="kc-field"><span>Vorname</span><input name="first_name" autocomplete="given-name" required></label>' +
        '<label class="kc-field"><span>Geschäftliche E-Mail</span><input name="email" type="email" autocomplete="email" required></label>' +
      '</div>' +
      '<label class="kc-consent"><input type="checkbox" name="newsletter" value="1"><span>Ja, schicken Sie mir gelegentlich Praxiswissen zu KI in der Bildung, Rechtslage und Moodle/ILIAS. Abmeldung jederzeit möglich.</span></label>' +
      '<p class="text-xs text-gray-500 mt-4 leading-relaxed">Wir erhalten Vorname, E-Mail-Adresse und den Link zu Ihrer Auswertung (mit Ihren angeklickten Antworten, ohne Textfelder) – nur, um Ihnen Auswertung und Handbuch zu schicken. Details in der <a class="text-blue-600 underline underline-offset-2 hover:text-blue-700" href="' + esc(CFG.privacyUrl || '/de/privacy.html') + '">Datenschutzerklärung</a>.</p>' +
      '<p class="kc-error text-sm font-medium text-red-600 mt-3" role="alert" hidden></p>' +
      '<button type="submit" class="kc-btn-primary mt-5 w-full">Auswertung anzeigen →</button>' +
    '</form></div>';
  }

  function gateCard() {
    return '<div class="kc-gate kc-gate--aside kq-gate rounded-3xl text-white mt-8 scroll-mt-6" id="kc-gate">' +
      '<div class="flex items-center gap-4 mb-4">' + bookMock('kc-mock-stage--sm') +
        '<div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-widest text-blue-300 font-geist mb-2">Kostenlos</p>' +
        '<h3 class="text-[1.3rem] leading-snug tracking-tight font-geist text-balance">Wohin dürfen wir Ihre Auswertung schicken?</h3></div></div>' +
      '<p class="text-[0.9rem] leading-relaxed text-gray-300 mb-3">Per E-Mail erhalten Sie den Link zu Ihrer Auswertung mit:</p>' +
      '<ul class="kq-gate-list text-gray-200 text-[0.86rem] leading-snug mb-5">' +
        ['Ihre ersten Schritte mit Zuständigkeiten', 'Dokumenten-Checkliste: was vorliegt, was fehlt', 'Freigaben: wer zustimmen muss', 'Fertige Mail mit Ihren offenen Fragen an den Anbieter', 'Interne Klärungsliste', 'Vorlagen, vorausgefüllt mit Ihren Angaben'].map(function (t) { return '<li class="kc-li">' + esc(t) + '</li>'; }).join('') +
        '<li class="kc-li">Dazu: Handbuch <span class="whitespace-nowrap">„KI-Tutor einführen“</span> als PDF (28 Seiten)</li></ul>' +
      formHtml(true).replace('Auswertung anzeigen →', 'Absenden') +
      '<button type="button" class="kq-back" data-act="step" data-step="' + qSteps()[0].id + '">← Antworten ändern</button>' +
    '</div>';
  }

  function handbookCard() {
    return '<div class="kc-gate kc-gate--aside kq-gate rounded-3xl text-white mt-8 scroll-mt-6 kc-noprint" id="kc-gate">' +
      '<div class="flex items-center gap-4 mb-4">' + bookMock('kc-mock-stage--sm') +
        '<div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-widest text-blue-300 font-geist mb-2">Kostenlos</p>' +
        '<h3 class="text-[1.3rem] leading-snug tracking-tight font-geist text-balance">Das Handbuch zum Check</h3></div></div>' +
      '<p class="text-[0.9rem] leading-relaxed text-gray-300 mb-5">„KI-Tutor einführen“: 28 Seiten zu Rollen, DSGVO, AI Act und Mitbestimmung – mit allen Vorlagen. Kommt per E-Mail, sobald Sie Ihre Adresse bestätigt haben.</p>' +
      formHtml(true).replace('Auswertung anzeigen →', 'Handbuch anfordern →') +
    '</div>';
  }

  // ---------- Ergebnis ----------
  function unlockedNote() {
    return '<div class="kc-unlocked" role="status">' +
      '<span class="kc-unlocked-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>' +
      '<div class="kc-unlocked-txt"><p class="kc-unlocked-h">Ihr Handbuch ist unterwegs</p>' +
      '<p class="kc-unlocked-p">Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in unserer E-Mail – danach erhalten Sie das Handbuch als PDF.</p></div>' +
      '<button type="button" class="kc-unlocked-x" data-act="note-close" aria-label="Hinweis schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
    '</div>';
  }

  function secH(id, n, q, sub) {
    return '<div class="kq-sec scroll-mt-6" id="kq-sec-' + id + '"><p class="kq-sec-n">' + n + '</p><h3 class="kq-h3">' + esc(q) + '</h3>' + (sub ? '<p class="kq-sec-sub">' + sub + '</p>' : '') + '</div>';
  }
  function badge(s, labels) { return '<span class="kq-badge kq-badge--' + s + '">' + (labels || LABEL)[s] + '</span>'; }
  function tplIndex(key) { var r = -1; (state._tpls || []).forEach(function (t, n) { if (t.key === key) r = n; }); return r; }

  // Vergleichsangebot bei Alphabees: Mail mit den offenen Anbieter-Fragen (nur wenn der Nutzer sie selbst abschickt)
  var OFFER_MAIL = 'info@alphabees.de';
  function offerHref(vq) {
    var org = txt('org');
    var body = 'Guten Tag,\n\nwir bereiten die Einführung eines KI-Tutors vor' + (org ? ' (' + org + ')' : '') + ' und möchten ein Vergleichsangebot von Alphabees einholen.' +
      (vq && vq.length ? '\n\nBitte beantworten Sie dabei diese Fragen aus unserem KI-Check:\n\n' + vq.map(function (x, k) { return (k + 1) + '. ' + x; }).join('\n') : '') +
      '\n\nVielen Dank und freundliche Grüße';
    return 'mailto:' + OFFER_MAIL + '?subject=' + encodeURIComponent('Vergleichsangebot KI-Tutor (KI-Compliance-Check)') + '&body=' + encodeURIComponent(body);
  }

  function resultHtml() {
    var tpls = templates(), ev = evaluation(), sm = ev.sm, st = ev.st, pr = priority(st), anb = txt('anbieter');
    var html = '<div class="p-5 sm:p-8 lg:p-10 kc-fade" id="kc-plan"><section class="kc-report scroll-mt-6" id="kc-report">' +
      (state.justUnlocked ? unlockedNote() : '') +
      '<p class="text-sm font-medium tracking-tight text-blue-600 font-geist mb-2">Ihre Auswertung · Stand Oktober 2026 · keine Rechtsberatung</p>' +
      '<div class="flex flex-wrap items-center justify-between gap-4 mb-4">' +
        '<h2 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 font-geist">' + (state.firstName ? esc(state.firstName) + ', Ihre Auswertung' : 'Ihre Auswertung') + '</h2>' +
        '<div class="flex flex-wrap gap-2 kc-noprint">' +
          '<button type="button" class="kc-btn-ghost" data-act="print">Als PDF speichern</button>' +
          '<button type="button" class="kc-btn-ghost" data-act="copy-link">Link kopieren</button>' +
          '<a class="kc-btn-ghost" data-act="share" href="mailto:?subject=' + encodeURIComponent('KI-Tutor-Einführung: unsere Auswertung') + '&body=' + encodeURIComponent('Hallo,\n\nich habe für unsere geplante KI-Tutor-Einführung einen KI-Check gemacht (DSGVO, EU AI Act, Mitbestimmung, Anbieterauswahl). Hier ist unser Stand mit Dokumenten, Freigaben und offenen Fragen:\n' + reportLink() + '\n\nKönnen wir die Punkte gemeinsam ansehen?') + '">An Kolleg:innen weiterleiten</a>' +
        '</div></div>' +
      '<p class="kq-verdict">' + esc(verdict(ev)) + '</p>' +
      '<nav class="kq-jump kc-noprint" aria-label="Abschnitte der Auswertung">' +
        [['start', 'Wo anfangen?'], ['wichtig', 'Was ist wichtig?'], ['docs', 'Dokumente'], ['ok', 'Freigaben'], ['fragen', 'Fragen'], ['plan', 'Fahrplan'], ['tpl', 'Vorlagen']].map(function (x) {
          return '<button type="button" data-act="jump" data-to="kq-sec-' + x[0] + '">' + x[1] + '</button>';
        }).join('') + '</nav>';

    // 1. Wo fange ich an?
    html += secH('start', '1', 'Wo fangen Sie an?', 'Ihre ersten drei Schritte – sortiert nach Pflicht und Projektphase.');
    if (pr.length) {
      html += '<ol class="kq-next">' + pr.slice(0, 3).map(function (i, n) {
        var ow = ownerOf(i);
        return '<li><span class="kq-next-n">' + (n + 1) + '</span><div><p class="kq-next-t">' + esc(i.t) + '</p><p class="kq-next-p">' + esc(i.how) + '</p>' +
          '<p class="kq-next-o">' + (ow ? 'Zuständig: ' + esc(ow) + ' · ' : '') + esc(i.law) + '</p></div></li>';
      }).join('') + '</ol>';
    } else {
      html += '<p class="rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-900 p-5 mb-12">Laut Ihren Angaben sind alle Punkte geklärt. Speichern Sie die Auswertung als Nachweis.</p>';
    }

    // 2. Was ist wichtig?
    html += secH('wichtig', '2', 'Was ist wichtig?', ev.bl.length ? 'Diese Pflichtpunkte sollten Sie vor dem Start schließen. Die Ampel zeigt Ihren Stand je Thema.' : 'Ihre Ampel je Thema.');
    if (ev.bl.length) {
      html += '<ul class="space-y-2 mb-6">' + ev.bl.map(function (i) {
        var s = stat(st, i);
        return '<li class="kc-task">' + badge(s) + '<span><strong class="font-semibold text-gray-900">' + esc(i.t) + '</strong> <span class="text-xs text-gray-500">(' + esc(i.law) + ')</span></span></li>';
      }).join('') + '</ul>';
    }
    html += ampelHtml(st) + '<div class="mb-12"></div>';

    // 3. Welche Dokumente?
    var dTpl = function (d) { var k = tplIndex(d.tpl); return k !== -1 && !isClear(d.s) ? ' <button type="button" class="kq-tpl-link kc-noprint" data-act="open-tpl" data-i="' + k + '">Vorlage</button>' : ''; };
    html += secH('docs', '3', 'Welche Dokumente brauchen Sie?', ev.docsMissing + ' von ' + ev.docs.length + ' fehlen noch oder sind zu klären. Für einige gibt es unten eine Vorlage.');
    html += '<div class="kq-docs mb-12">' + ['anbieter', 'intern', 'br'].map(function (f) {
      var ds = ev.docs.filter(function (d) { return d.from === f; });
      if (!ds.length) return '';
      return '<div class="kq-docs-g"><p class="kq-docs-h">' + DOC_FROM[f] + '</p><ul>' + ds.map(function (d) {
        return '<li class="kq-doc' + (isClear(d.s) ? ' is-ok' : '') + '">' + badge(d.s, DOC_LABEL) + '<span class="kq-doc-t">' + esc(d.t) + dTpl(d) + '</span></li>';
      }).join('') + '</ul></div>';
    }).join('') + '</div>';

    // 4. Wer muss zustimmen?
    html += secH('ok', '4', 'Wer muss zustimmen?', 'Diese Stellen sollten Sie einbinden, bevor der Tutor startet.');
    html += '<ul class="kq-appr mb-12">' + ev.appr.map(function (a) {
      return '<li class="kq-doc' + (isClear(a.s) ? ' is-ok' : '') + '">' + badge(a.s) + '<span class="kq-doc-t"><strong class="font-semibold text-gray-900">' + esc(a.who) + '</strong>' + (a.person ? ' <span class="text-gray-500">(' + esc(a.person) + ')</span>' : '') + '<br><span class="text-gray-600">' + esc(a.what) + '</span></span></li>';
    }).join('') + '</ul>';

    // 5. Was müssen Sie fragen?
    var mi = tplIndex('mail'), ki = tplIndex('klaer');
    html += secH('fragen', '5', 'Was müssen Sie fragen?', '');
    html += '<div class="kq-ask mb-12">' +
      '<div class="kq-ask-c"><p class="kq-docs-h">' + (anb ? 'An ' + esc(anb) : 'An den Anbieter') + ' · ' + ev.vq.length + (ev.vq.length === 1 ? ' Frage' : ' Fragen') + '</p>' +
        (ev.vq.length ? '<ol class="kq-ask-l">' + ev.vq.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
          '<button type="button" class="kc-btn-ghost mt-4 kc-noprint" data-act="copy-tpl" data-i="' + mi + '">Als fertige Mail kopieren</button>' +
          '<p class="kq-offer">Vergleichsangebot einholen? Schicken Sie dieselben Fragen an Alphabees: <a href="' + offerHref(ev.vq) + '" data-cta="kicheck_offer_fragen">' + OFFER_MAIL + '</a></p>'
          : '<p class="text-sm text-gray-600">Laut Ihren Angaben sind alle Anbieter-Fragen geklärt.</p>') + '</div>' +
      '<div class="kq-ask-c"><p class="kq-docs-h">Intern · ' + ev.il.length + (ev.il.length === 1 ? ' Punkt' : ' Punkte') + ' aus Ihren „Weiß ich nicht“-Antworten</p>' +
        (ev.il.length ? '<ul class="kq-ask-l kq-ask-l--ul">' + ev.il.map(function (i) { var ow = ownerOf(i); return '<li>' + esc(i.t) + (ow ? ' <span class="text-gray-500">– ' + esc(ow) + '</span>' : '') + '</li>'; }).join('') + '</ul>' +
          (ki !== -1 ? '<button type="button" class="kc-btn-ghost mt-4 kc-noprint" data-act="copy-tpl" data-i="' + ki + '">Klärungsliste kopieren</button>' : '')
          : '<p class="text-sm text-gray-600">Keine offenen Klärungen.</p>') + '</div>' +
    '</div>';

    // 6. Fahrplan
    var open = activeItems().filter(function (i) { return !isClear(stat(st, i)); });
    html += secH('plan', '6', 'Was müssen Sie sonst beachten?', open.length ? 'Ihr vollständiger Fahrplan: ' + open.length + (open.length === 1 ? ' Aufgabe' : ' Aufgaben') + ' mit Begründung und Zuständigkeit.' : '');
    if (open.length) {
      html += '<div class="space-y-8 mb-6">' + CH.map(function (c) {
        var its = open.filter(function (i) { return i.ch === c.id; });
        if (!its.length) return '';
        return '<div><p class="text-sm font-semibold text-blue-600 font-geist mb-3">' + esc(c.title) + ' <span class="normal-case font-normal text-gray-500">– ' + esc(c.sub) + '</span></p><ul class="space-y-2">' +
          its.map(function (i) {
            var s = stat(st, i), ow = ownerOf(i);
            return '<li class="kc-task">' + badge(s) + '<span><strong class="font-semibold text-gray-900">' + (i.must ? '<span class="text-red-600">Pflicht: </span>' : '') + esc(i.t) + '</strong><br>' +
              (s === 'check' ? '<em>Fachlich prüfen lassen.</em> ' : '') + esc(i.how) + ' <span class="text-xs text-gray-500">(' + esc(i.law) + ')</span>' +
              (ow ? '<br><span class="text-xs text-gray-500">Zuständig: ' + esc(ow) + '</span>' : '') + '</span></li>';
          }).join('') + '</ul></div>';
      }).join('') + '</div>';
    }
    var doneList = activeItems().filter(function (i) { return isClear(stat(st, i)); });
    if (doneList.length) {
      html += '<details class="kc-tpl mb-12"><summary>Bereits geklärt (' + doneList.length + ')</summary><ul class="space-y-1.5 mt-3">' +
        doneList.map(function (i) { return '<li class="kc-task"><span class="kc-box kc-box-done"></span><span class="text-gray-500">' + esc(i.t) + (stat(st, i) === 'na' ? ' (entfällt)' : '') + '</span></li>'; }).join('') +
        '</ul></details>';
    } else html += '<div class="mb-12"></div>';

    // 7. Vorlagen
    html += secH('tpl', '7', 'Ihre Vorlagen', 'Vorausgefüllt mit Ihren Angaben. Was fehlt, steht in [eckigen Klammern]. Keine Rechtsberatung.');
    html += '<div class="space-y-3 mb-12">' + tpls.map(function (t, n) {
        return '<details class="kc-tpl" data-tpl="' + n + '"' + (n === 0 ? ' open' : '') + '><summary>' + esc(t.title) + '<span class="text-xs text-gray-500 font-normal">' + esc(t.ref) + '</span></summary>' +
          '<pre class="kc-pre">' + esc(t.body) + '</pre>' +
          '<button type="button" class="kc-btn-ghost mt-3 kc-noprint" data-act="copy-tpl" data-i="' + n + '">Text kopieren</button></details>';
      }).join('') + '</div>';

    if (txt('frage')) {
      html += '<div class="kq-frage mb-12"><p class="kq-first-l">Ihre offene Frage</p><p class="kq-frage-t">„' + esc(txt('frage')) + '“</p>' +
        '<a href="' + esc(CFG.calendlyUrl) + '" data-cta="kicheck_call_frage" target="_blank" rel="noopener" class="kc-btn-primary mt-4">In 20 Minuten mit uns besprechen</a></div>';
    }

    if (!state.requested) html += handbookCard().replace('mt-8 scroll-mt-6', 'mb-12 scroll-mt-6');
    html += '<div class="kc-promo rounded-3xl text-white p-8 sm:p-10">' +
      '<p class="text-xs font-semibold uppercase tracking-widest text-gray-400 font-geist mb-2">In eigener Sache</p>' +
      '<h4 class="text-2xl font-semibold tracking-tight font-geist mb-3">So beantwortet Alphalearn die Anbieter-Fragen</h4>' +
      '<p class="text-gray-400 text-sm leading-relaxed mb-6 max-w-2xl">Wir haben diesen Check gebaut, weil wir genau diese Fragen in jedem Auswahlprozess beantworten. Falls Sie Alphalearn – den KI-Tutor für Moodle und ILIAS – in Ihre Auswahl aufnehmen:</p>' +
      '<ul class="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-gray-300 mb-8">' + BRIDGE.map(function (x) { return '<li class="kc-li">' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div class="flex flex-col sm:flex-row sm:flex-wrap gap-3 kc-noprint kq-promo-btns">' +
        '<a href="' + offerHref(ev.vq) + '" data-cta="kicheck_offer" class="kc-btn-light">Vergleichsangebot bei Alphabees einholen</a>' +
        '<a href="' + esc(CFG.demoUrl) + '?utm_source=ki-check&utm_medium=report" data-cta="kicheck_demo" class="kc-btn-outline">Tutor-Demo ansehen</a>' +
        '<a href="' + esc(CFG.calendlyUrl) + '" data-cta="kicheck_call" target="_blank" rel="noopener" class="kc-btn-outline">Auswertung in 20 Minuten besprechen</a>' +
        '<a href="' + esc(CFG.complianceUrl) + '" data-cta="kicheck_compliance" class="kc-btn-outline">Compliance-Details</a>' +
      '</div><p class="kq-offer-line">Vergleichsangebot bei Alphabees einholen: <a href="' + offerHref(ev.vq) + '" data-cta="kicheck_offer_line">' + OFFER_MAIL + '</a></p></div>' +
      '<p class="text-xs text-gray-500 mt-8 leading-relaxed">Dieser Check ersetzt keine Rechtsberatung. Die Auswertung ist aus Ihren Angaben erstellt. Stand der Rechtslage: Oktober 2026 (DSGVO, KI-Verordnung nach Digital Omnibus, BetrVG).</p>' +
      '</section></div>';
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
      body: 'KI-Tutor: [Name], Einsatz in: [Kurs/Bereich], Zweck: Lernbegleitung\n\nDSGVO\nVerantwortlicher: [Ihre Organisation]\nAuftragsverarbeiter: [Anbieter], AVV vom [Datum]\nUnterauftragsverarbeiter: [Hosting], [Sprachmodell-Anbieter, Region]\n\nKI-Verordnung\nAnbieter: [Anbieter]\nBetreiber (Nutzung in eigener Verantwortung): [Ihre Organisation]\nEinstufung: kein Hochrisiko (keine Bewertung, Zulassung, Einstufung oder Prüfungsaufsicht)\n\nAnsprechpersonen\nFachlich: [Name]   Technisch: [Name]   Datenschutz: [Name]   Vertretung: [Name]' },
    { title: 'Transparenzhinweis für das Chatfenster', ref: 'Art. 50 KI-Verordnung',
      body: 'Sie sprechen mit [Name des Tutors], einem KI-gestützten Lernbegleiter.\nDie Antworten werden automatisch auf Basis der Kursinhalte erzeugt und können Fehler enthalten.\nBei prüfungsrelevanten Fragen wenden Sie sich bitte zusätzlich an [Ansprechperson/Kontakt].\nBitte geben Sie keine sensiblen persönlichen Daten ein.\nHinweise zum Datenschutz: [Link zur Datenschutzerklärung]' },
    { title: 'Schulungsnachweis KI-Kompetenz', ref: 'Art. 4 KI-Verordnung',
      body: 'Organisation: [Name]\nKI-System: [Name des KI-Tutors], Einsatzzweck: Lernbegleitung in [Kurs/Bereich]\nDatum der Schulung: [TT.MM.JJJJ]   Dauer: [Minuten]   Durchgeführt von: [Name]\n\nInhalte:\n- Funktionsweise und Grenzen des KI-Tutors (inkl. möglicher Fehlantworten)\n- Datenschutz: welche Daten verarbeitet werden, was nicht eingegeben werden soll\n- Transparenzpflicht gegenüber Lernenden\n- Umgang mit gemeldeten Fehlern, Ansprechpersonen\n\nTeilnehmende (Name, Funktion, Unterschrift):\n1. ____________________\n2. ____________________\n\nNächste Auffrischung: [Datum]' },
    { title: 'Eckpunkte für eine Betriebsvereinbarung', ref: '§ 87 Abs. 1 Nr. 6 BetrVG',
      body: '1. Gegenstand und Zweck: KI-Tutor ausschließlich zur Lernunterstützung\n2. Ausschluss der Leistungs- und Verhaltenskontrolle; keine Auswertung einzelner Beschäftigter\n3. Zulässige Auswertungen: nur aggregiert (z. B. ab 5 Personen)\n4. Datenkategorien, Speicherdauer und Löschung\n5. Zugriffsrechte: wer welche Daten sehen darf\n6. Transparenz gegenüber den Beschäftigten, Schulung (Art. 4 KI-Verordnung)\n7. Änderungen am System nur nach Information des Betriebsrats\n8. Evaluation nach 6 Monaten' }
  ];

  // ---------- Vorlagen mit Ihren Angaben ----------
  function fillOr(v, ph) { return v ? v : ph; }
  function templates() {
    var st = statuses(), org = txt('org'), kurs = txt('kurs'), anb = txt('anbieter'), tutor = txt('tutorName');
    var out = [];
    var steck = TEMPLATES[1].body
      .replace('KI-Tutor: [Name]', 'KI-Tutor: ' + fillOr(tutor || anb, '[Name]'))
      .replace(/\[Kurs\/Bereich\]/g, fillOr(kurs, '[Kurs/Bereich]'))
      .replace(/\[Ihre Organisation\]/g, fillOr(org, '[Ihre Organisation]'))
      .replace(/\[Anbieter\]/g, fillOr(anb, '[Anbieter]'))
      .replace('[Sprachmodell-Anbieter, Region]', fillOr(txt('modell'), '[Sprachmodell-Anbieter, Region]'))
      .replace('Fachlich: [Name]', 'Fachlich: ' + fillOr(named('p_fach') && txt('p_fach'), '[Name]'))
      .replace('Technisch: [Name]', 'Technisch: ' + fillOr(named('p_tech') && txt('p_tech'), '[Name]'))
      .replace('Datenschutz: [Name]', 'Datenschutz: ' + fillOr(named('p_ds') && txt('p_ds'), '[Name]'));
    if (st.A1 === 'check') steck = steck.replace(/Einstufung: kein Hochrisiko[^\n]*/, 'Einstufung: fachlich prüfen lassen (geplanter Einsatz umfasst Bewertung, Zulassung, Einstufung oder Prüfungsaufsicht)');
    out.push({ key: 'steck', title: 'Rollen-Steckbrief' + (org ? ' ' + org : ''), ref: TEMPLATES[1].ref, body: steck });

    // Mail an den Anbieter: nur die Fragen aus dem Katalog, deren Punkte bei Ihnen offen sind (sonst alle)
    var qs = vendorQuestions(st);
    if (!qs.length) qs = TEMPLATES[0].body.split('\n').filter(function (l) { return /^\d+\. /.test(l); }).map(function (l) { return l.replace(/^\d+\. /, ''); });
    var who = anb || 'Ihrem KI-Tutor';
    out.push({ key: 'mail', title: 'Mail an ' + (anb || 'Ihren Anbieter') + ' (' + qs.length + ' Fragen)', ref: 'aus dem Anbieter-Fragenkatalog',
      body: 'Betreff: Fragen vor der Einführung von ' + who + (org ? ' bei ' + org : '') + '\n\nGuten Tag,\n\nwir prüfen den Einsatz von ' + who + (kurs ? ' in ' + kurs : '') +
        '. Bevor wir weitermachen, bitten wir um schriftliche Antworten auf folgende Fragen:\n\n' +
        qs.map(function (x, k) { return (k + 1) + '. ' + x; }).join('\n') +
        '\n\nVielen Dank und freundliche Grüße' + (org ? '\n' + org : '') });

    out.push({ key: 'transparenz', title: 'Transparenzhinweis für das Chatfenster', ref: TEMPLATES[2].ref, body: TEMPLATES[2].body
      .replace('[Name des Tutors]', fillOr(tutor, '[Name des Tutors]'))
      .replace('[Ansprechperson/Kontakt]', fillOr(txt('ansprech'), '[Ansprechperson/Kontakt]')) });
    out.push({ key: 'schulung', title: 'Schulungsnachweis KI-Kompetenz', ref: TEMPLATES[3].ref, body: TEMPLATES[3].body
      .replace('Organisation: [Name]', 'Organisation: ' + fillOr(org, '[Name]'))
      .replace('[Name des KI-Tutors]', fillOr(tutor || anb, '[Name des KI-Tutors]'))
      .replace('[Kurs/Bereich]', fillOr(kurs, '[Kurs/Bereich]')) });
    if (state.answers.p_emp !== 'nein') out.push({ key: 'bv', title: TEMPLATES[4].title, ref: TEMPLATES[4].ref, body: TEMPLATES[4].body });

    var unclear = activeItems().filter(function (i) { return stat(st, i) === 'unclear'; });
    if (unclear.length) out.push({ key: 'klaer', title: 'Interne Klärungsliste (' + unclear.length + ' Punkte)', ref: 'aus Ihren „Weiß ich nicht“-Antworten',
      body: 'Bitte klären' + (org ? ' (' + org + ')' : '') + ':\n\n' + unclear.map(function (i) { var ow = ownerOf(i); return '- ' + i.t + (ow ? ' – zuständig: ' + ow : ''); }).join('\n') });

    out.push({ key: 'katalog', title: TEMPLATES[0].title, ref: TEMPLATES[0].ref, body: TEMPLATES[0].body, full: true });
    state._tpls = out;
    return out;
  }

  // ---------- Seitenspalte ----------
  function renderAside() {
    if (!asideSlot) return;
    if (!asideOn()) { asideSlot.innerHTML = ''; return; }
    asideSlot.innerHTML = state.requested ? asideDone() : asideProgress();
  }
  function asideProgress() {
    var p = progress(), qs = qSteps(), cur = qs.filter(function (s) { return s.id === state.step; })[0], next;
    if (state.step === 'E') next = null; else next = cur ? (qs[qs.indexOf(cur) + 1] || { id: 'E', title: 'Ihre Auswertung' }) : qs[0];
    return '<div class="kc-gate kc-gate--aside rounded-3xl p-5 text-white" id="kq-aside">' +
      '<div class="flex items-center gap-4 mb-5">' + bookMock('kc-mock-stage--sm') +
        '<div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-widest text-blue-300 font-geist mb-2">Kostenlos</p>' +
        '<h3 class="text-[1.15rem] leading-snug tracking-tight font-geist text-balance">' + (state.unlocked ? 'Das Handbuch zum Check' : state.step === 'E' ? 'Ihre Auswertung ist fertig' : 'Ihre Auswertung entsteht') + '</h3></div></div>' +
      '<div class="kq-aside-bar"><span data-prog="bar" style="width:' + p.pct + '%"></span></div>' +
      '<p class="text-xs text-gray-300 mt-2 mb-5" data-prog="t">' + p.done + ' von ' + p.total + ' Fragen beantwortet</p>' +
      (state.unlocked ? '<p class="text-[0.86rem] leading-relaxed text-gray-300 mb-6">„KI-Tutor einführen“: 28 Seiten zu Rollen, DSGVO, AI Act und Mitbestimmung – kostenlos per E-Mail.</p>' :
      '<ul class="space-y-2 text-gray-300 text-[0.84rem] leading-snug mb-6">' +
        '<li class="kc-li">Welche Regeln müssen beachtet werden?</li>' +
        '<li class="kc-li">Welche Dokumente werden benötigt?</li>' +
        '<li class="kc-li">Wer ist wofür verantwortlich?</li>' +
      '</ul>') +
      (next ? '<button type="button" class="kc-btn-light w-full" data-act="step" data-step="' + next.id + '">' + (next.id === 'E' ? 'Zur Auswertung →' : 'Weiter: ' + esc(next.title) + ' →') + '</button>'
            : '<button type="button" class="kc-btn-light w-full" data-act="to-form">' + (state.unlocked ? 'Handbuch anfordern →' : 'Auswertung anzeigen →') + '</button>') +
    '</div>';
  }
  function asideDone() {
    return '<div class="kc-gate kc-gate--aside rounded-3xl p-5 text-white" id="kq-aside">' +
      '<div class="flex items-center gap-4 mb-5">' + bookMock('kc-mock-stage--sm') +
        '<div class="min-w-0"><p class="text-xs font-semibold uppercase tracking-widest text-blue-300 font-geist mb-2">Angefordert</p>' +
        '<h3 class="text-[1.15rem] leading-snug tracking-tight font-geist text-balance">' + (state.firstName ? esc(state.firstName) + ', Ihr Handbuch ist unterwegs' : 'Ihr Handbuch ist unterwegs') + '</h3></div></div>' +
      '<p class="text-[0.9rem] leading-relaxed text-gray-300">Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in unserer E-Mail. Danach erhalten Sie das Handbuch als PDF.</p>' +
      (state.step !== 'E' ? '<button type="button" class="kc-btn-light mt-5 w-full" data-act="step" data-step="E">Zur Auswertung →</button>' : '') +
    '</div>';
  }

  // ---------- Übermittlung ----------
  function ampelString(st) {
    var sm = summary();
    return sm.mustDone + '/' + sm.mustTotal + ' Pflicht geklärt · ' + CH.filter(function (c) { return !c.employeesOnly || state.answers.p_emp !== 'nein'; })
      .map(function (c) { return c.id + ':' + { red: 'rot', early: 'orange', yellow: 'gelb', green: 'grün' }[ampel(c.id, st)]; }).join(' ');
  }
  function submitLead(fd) {
    var providers = CFG.providers || [];
    // Nur was für den Versand nötig ist: Vorname, E-Mail, Newsletter-Wahl und Link zur Auswertung (Antwortcodes, keine Textfelder)
    var payload = {
      first_name: fd.get('first_name') || '',
      email: fd.get('email') || '',
      newsletter: fd.get('newsletter') ? 'ja' : 'nein',
      report_link: reportLink(),
      status: 'auswertung',
      version: Q.version,
      quelle: (new URLSearchParams(location.search)).get('utm_source') || document.referrer || 'direkt'
    };
    var jobs = [];
    if (providers.indexOf('kit') !== -1 && CFG.kit && CFG.kit.formId) {
      var body = new URLSearchParams();
      body.append('email_address', payload.email);
      body.append('fields[first_name]', payload.first_name);
      body.append('fields[ki_check_newsletter]', payload.newsletter);
      body.append('fields[ki_check_report_link]', payload.report_link);
      jobs.push(fetch(CFG.kit.endpoint.replace('{formId}', CFG.kit.formId), { method: 'POST', mode: 'no-cors', body: body }));
    }
    if (providers.indexOf('sheets') !== -1 && CFG.sheets && CFG.sheets.endpoint) {
      jobs.push(fetch(CFG.sheets.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }));
    }
    return Promise.all(jobs).catch(function () { /* Ergebnis trotzdem zeigen */ });
  }

  // ---------- Ereignisse ----------
  function go(id) {
    var cur = stepById(state.step);
    if (cur && !cur.result && id !== state.step) {
      var qs = allSteps();
      if (qs.indexOf(stepById(id)) > qs.indexOf(cur)) { state.lastStep = cur.id; track('check_step', { step: cur.id }); }
      else state.lastStep = null;
    }
    state.step = id;
    if (id === 'E') track(state.unlocked ? 'check_result_view' : 'check_teaser_view', {});
    save(); render(); syncHash(); scrollTo(root);
  }
  function setAnswer(qid, v) {
    var q = qById(qid); if (!q) return;
    if (q.type === 'multi') {
      var a = (state.answers[qid] || []).slice();
      if (v === 'none') a = a.indexOf('none') !== -1 ? [] : ['none'];
      else {
        a = a.filter(function (x) { return x !== 'none'; });
        var k = a.indexOf(v); if (k === -1) a.push(v); else a.splice(k, 1);
      }
      if (a.length) state.answers[qid] = a; else delete state.answers[qid];
    } else state.answers[qid] = v;
    if (!state.started) { state.started = true; track('check_start', { from: 'answer' }); }
    save(); if (state.unlocked) syncHash(); render();
  }
  function copy(text, el, msg) {
    var done = function () { var t = el.textContent; el.textContent = msg; setTimeout(function () { el.textContent = t; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
  }

  function onClick(e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'FORM') return;
    var act = el.getAttribute('data-act');
    if (act === 'ans') setAnswer(el.getAttribute('data-q'), el.getAttribute('data-v'));
    else if (act === 'why') { var w = el.getAttribute('data-q'); state.why[w] = !state.why[w]; render(); }
    else if (act === 'step') go(el.getAttribute('data-step'));
    else if (act === 'note-close') { state.justUnlocked = false; render(); }
    else if (act === 'again') { state.requested = false; try { localStorage.removeItem(STORE + '-u'); } catch (x) { /* egal */ } render(); scrollTo(root); }
    else if (act === 'jump') { scrollTo(document.getElementById(el.getAttribute('data-to'))); }
    else if (act === 'open-tpl') {
      var d = root.querySelector('details[data-tpl="' + el.getAttribute('data-i') + '"]');
      if (d) { d.open = true; scrollTo(d); }
    }
    else if (act === 'to-form') {
      var g = document.getElementById('kc-gate');
      if (g) { scrollTo(g); var f = g.querySelector('input[name=first_name]'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 450); }
    }
    else if (act === 'print') { track('check_report_print', {}); window.print(); }
    else if (act === 'copy-link') { copy(reportLink(), el, 'Link kopiert'); track('check_share', { method: 'copy' }); }
    else if (act === 'share') { track('check_share', { method: 'mail' }); }
    else if (act === 'copy-tpl') { var t = (state._tpls || [])[+el.getAttribute('data-i')]; if (t) copy(t.body, el, 'Kopiert'); }
  }

  function refreshProgress() {
    var p = progress(), sm = summary();
    function each(sel, fn) { [].forEach.call(document.querySelectorAll(sel), fn); }
    each('[data-prog="t"]', function (el) { el.textContent = p.done + ' von ' + p.total + ' Fragen beantwortet'; });
    each('[data-prog="bar"]', function (el) { el.style.width = p.pct + '%'; });
    each('[data-prog="must"]', function (el) { el.textContent = sm.mustDone + ' von ' + sm.mustTotal + ' Pflichtpunkten geklärt'; });
    qSteps().forEach(function (s) {
      var qs = visibleQs(s).filter(function (q) { return !q.optional; }), a = qs.filter(answered).length;
      each('[data-prog="tab-' + s.id + '"]', function (el) { el.textContent = a + '/' + qs.length; });
    });
    each('.kq-card[data-q]', function (el) { var q = qById(el.getAttribute('data-q')); if (q) el.classList.toggle('is-answered', answered(q)); });
  }

  var saveTimer = null;
  function onInput(e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-field');
    if (!f) return;
    state.texts[f] = e.target.value;
    if (!state.started) { state.started = true; track('check_start', { from: 'text' }); }
    refreshProgress();
    clearTimeout(saveTimer); saveTimer = setTimeout(save, 300);
  }
  function onChange(e) {
    var n = e.target.getAttribute && e.target.getAttribute('data-none');
    if (n) { state.texts[n + '_none'] = e.target.checked; save(); render(); return; }
    if (e.target.getAttribute && e.target.getAttribute('data-field')) save();
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
    var sm = summary();
    track('check_report_request', { done: sm.mustDone, total: sm.mustTotal, newsletter: fd.get('newsletter') ? 'ja' : 'nein' });
    submitLead(fd).then(function () {
      state.requested = true; state.justUnlocked = state.unlocked;
      state.firstName = String(fd.get('first_name')).trim();
      try { localStorage.setItem(STORE + '-u', '1'); localStorage.setItem(STORE + '-n', state.firstName); } catch (x) { /* egal */ }
      state.step = 'E';
      save(); syncHash(); render();
      var note = root.querySelector('.kc-unlocked'); scrollTo(note || root);
    });
  }

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange);
  root.addEventListener('submit', onSubmit);
  if (asideSlot) asideSlot.addEventListener('click', onClick);
  if (mqAside) {
    var onMq = function () { renderAside(); };
    if (mqAside.addEventListener) mqAside.addEventListener('change', onMq); else if (mqAside.addListener) mqAside.addListener(onMq);
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

  // ---------- Start ----------
  load();
  var fromLink = false;
  var m = /#a=([^&]+)/.exec(location.hash), r = /#r=([^&]+)/.exec(location.hash);
  if (m) {
    var a = decodeAnswers(m[1]);
    if (a) {
      if (!state.requested) { state.answers = a; state.texts = {}; }
      fromLink = true;
      state.unlocked = true; state.step = 'E';
      track('check_report_open', {});
    }
  } else if (r) {
    var done = decodeLegacy(decodeURIComponent(r[1]));
    if (done) { state.legacyDone = done; state.unlocked = true; state.step = 'E'; fromLink = true; track('check_report_open', { legacy: 1 }); }
  }
  render();
  if (fromLink) setTimeout(function () { scrollTo(root); }, 300);
  // Link zur Auswertung in einem schon offenen Tab: neu laden, damit er greift
  window.addEventListener('hashchange', function () { if (/#a=/.test(location.hash) && !state.unlocked) location.reload(); });
})();
