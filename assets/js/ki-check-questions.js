/* KI-Check als Fragebogen – Fragen zum Ist-Stand.
   Jede Frage verweist auf Punkte aus ki-check-data.js (why/how/law bleiben dort unverändert, juristisch abgestimmt).
   Fragen formulieren den Punkt nur als Frage um, ohne neue Rechtsaussagen.
   Status je Punkt: done = erledigt, part = teilweise, open = offen, unclear = unklar (klären), check = fachlich prüfen lassen, na = entfällt.
   Typen: single (eine Antwort), multi (mehrere; abgewählte Punkte = offen, „none“ = alle unklar), fields (Textfelder, bleiben im Browser). */
window.KI_CHECK_QUESTIONS = {
  version: '2026-10-fragebogen-1',
  steps: [
    { id: 'P', title: 'Ihr Projekt', sub: 'Ausgangslage',
      intro: 'Ein paar Angaben vorab. Daraus entstehen später Ihre vorausgefüllten Vorlagen. Textfelder sind freiwillig und bleiben in Ihrem Browser.',
      questions: [
        { id: 'p_basis', type: 'fields', q: 'Worum geht es bei Ihnen?', fields: [
          { k: 'org', label: 'Ihre Organisation', ph: 'z. B. XY-Akademie' },
          { k: 'kurs', label: 'Kurs oder Bereich für den Start', ph: 'z. B. Pflegekurs, Modul 3' },
          { k: 'anbieter', label: 'KI-Tutor bzw. Anbieter im Gespräch', ph: 'z. B. Produktname' }
        ] },
        { id: 'p_rolle', type: 'single', q: 'Ihre Rolle im Projekt', opts: [
          { v: 'leitung', t: 'Geschäftsführung / Projektleitung' }, { v: 'datenschutz', t: 'Datenschutz' },
          { v: 'it', t: 'IT / LMS-Administration' }, { v: 'lehre', t: 'Lehre / Didaktik' },
          { v: 'einkauf', t: 'Einkauf' }, { v: 'br', t: 'Betriebsrat' }, { v: 'andere', t: 'Andere' }
        ] },
        { id: 'p_phase', type: 'single', q: 'Wo steht Ihr Projekt?', opts: [
          { v: 'idee', t: 'Erste Idee' }, { v: 'auswahl', t: 'Anbieterauswahl' }, { v: 'pilot', t: 'Pilot läuft' }, { v: 'betrieb', t: 'Regelbetrieb' }
        ] },
        { id: 'p_lms', type: 'single', q: 'Welche Lernplattform nutzen Sie?', opts: [
          { v: 'moodle', t: 'Moodle' }, { v: 'ilias', t: 'ILIAS' }, { v: 'andere', t: 'Andere' }, { v: 'keine', t: 'Noch keine' }
        ] },
        { id: 'p_emp', type: 'single', q: 'Lernen auch eigene Beschäftigte mit dem Tutor?', help: 'Dann gehört die Mitbestimmung des Betriebsrats mit in den Check.', opts: [
          { v: 'ja', t: 'Ja' }, { v: 'nein', t: 'Nein, nur externe Lernende' }, { v: 'unklar', t: 'Weiß ich nicht' }
        ] }
      ] },

    { id: 'R', title: 'Rollen klären', sub: 'Wer ist wer?',
      intro: 'Bevor es um Paragrafen geht: Wer ist wofür verantwortlich? Die meisten Missverständnisse in KI-Projekten entstehen hier. Auch „Weiß ich nicht“ ist ein Ergebnis – daraus wird in Ihrem Fahrplan eine Klärungsaufgabe.',
      questions: [
        { id: 'r1', type: 'single', item: 'R1', q: 'Ist schriftlich festgehalten, dass Ihre Organisation für den KI-Tutor datenschutzrechtlich verantwortlich ist und der Anbieter als Auftragsverarbeiter handelt?', opts: [
          { v: 'ja', t: 'Ja, im Verarbeitungsverzeichnis', s: { R1: 'done' } },
          { v: 'teil', t: 'Besprochen, aber nicht notiert', s: { R1: 'part' } },
          { v: 'nein', t: 'Nein', s: { R1: 'open' } },
          { v: 'wn', t: 'Weiß ich nicht', s: { R1: 'unclear' } }
        ] },
        { id: 'r2', type: 'single', item: 'R2', q: 'Ist im Vertrag oder AVV ausgeschlossen, dass der Anbieter Chatverläufe für eigene Zwecke nutzt – etwa für Produktverbesserung, Training oder Marketing?', opts: [
          { v: 'ja', t: 'Ja, steht im AVV', s: { R2: 'done' } },
          { v: 'muendlich', t: 'Nur mündlich zugesagt', s: { R2: 'part' } },
          { v: 'nein', t: 'Nein, unklar formuliert oder noch kein AVV', s: { R2: 'open' } },
          { v: 'wn', t: 'Weiß ich nicht', s: { R2: 'unclear' } }
        ] },
        { id: 'r3', type: 'single', item: 'R3', q: 'Wie setzen Sie den KI-Tutor ein – und ist Ihre Rolle nach der KI-Verordnung notiert?', opts: [
          { v: 'fertig_notiert', t: 'Fertiges Produkt eines Herstellers, Rolle als Betreiber ist notiert', s: { R3: 'done' } },
          { v: 'fertig', t: 'Fertiges Produkt eines Herstellers, Rolle noch nicht notiert', s: { R3: 'part' } },
          { v: 'eigen', t: 'Selbst entwickelt oder entwickeln lassen', s: { R3: 'check' } },
          { v: 'offen', t: 'Noch offen', s: { R3: 'open' } }
        ] },
        { id: 'r_brand', type: 'single', item: 'R4', q: 'Läuft der Tutor bei Ihnen unter eigenem Namen, z. B. „Lernbuddy der XY-Akademie“?', opts: [
          { v: 'ja', t: 'Ja' }, { v: 'nein', t: 'Nein', s: { R4: 'na' } }, { v: 'offen', t: 'Noch offen', s: { R4: 'open' } }
        ] },
        { id: 'r4', type: 'single', item: 'R4', showIf: { q: 'r_brand', eq: 'ja' }, q: 'Ist schriftlich geregelt, dass der Hersteller Kennzeichnung, Dokumentation und Updates liefert und Sie den Tutor konfigurieren und betreiben?', opts: [
          { v: 'ja', t: 'Ja', s: { R4: 'done' } }, { v: 'teil', t: 'Teilweise', s: { R4: 'part' } },
          { v: 'nein', t: 'Nein', s: { R4: 'open' } }, { v: 'wn', t: 'Weiß ich nicht', s: { R4: 'unclear' } }
        ], fields: [ { k: 'tutorName', label: 'Name des Tutors bei Ihnen', ph: 'z. B. Lernbuddy' } ] },
        { id: 'r5', type: 'fields', item: 'R5', q: 'Wer entscheidet bei Ihnen, wenn …', help: 'Eine Funktion genügt. Bleibt in Ihrem Browser.', compute: 'r5', fields: [
          { k: 'p_fach', label: '… der Tutor falsch antwortet? (fachlich)', ph: 'z. B. Studiengangsleitung', none: true },
          { k: 'p_tech', label: '… das Plugin ein Update braucht? (technisch)', ph: 'z. B. LMS-Administration', none: true },
          { k: 'p_ds', label: '… eine Auskunftsanfrage eingeht? (Datenschutz)', ph: 'z. B. Datenschutzbeauftragte', none: true }
        ] },
        { id: 'r5_vertretung', type: 'single', item: 'R5', q: 'Ist für diese Personen eine Vertretung benannt?', opts: [
          { v: 'ja', t: 'Ja' }, { v: 'teil', t: 'Teilweise' }, { v: 'nein', t: 'Nein' }
        ] }
      ] },

    { id: 'D', title: 'Datenschutz', sub: 'DSGVO',
      intro: 'Was Sie mit dem Anbieter und intern regeln, bevor die ersten Lernenden chatten.',
      questions: [
        { id: 'd_vertrag', type: 'multi', items: ['D1', 'D2', 'D4'], q: 'Was liegt Ihnen vom Anbieter schriftlich vor?', help: 'Mehrfachauswahl', opts: [
          { v: 'avv', t: 'Unterschriebener Auftragsverarbeitungsvertrag (AVV)', item: 'D1' },
          { v: 'sub', t: 'Liste der Unterauftragsverarbeiter – inklusive Sprachmodell und Standort', item: 'D2' },
          { v: 'training', t: 'Schriftlicher Ausschluss: kein Training von Modellen mit Ihren Daten', item: 'D4' },
          { v: 'none', t: 'Nichts davon / weiß ich nicht', none: true }
        ] },
        { id: 'd3', type: 'single', item: 'D3', q: 'Wo läuft das Sprachmodell, das der Tutor nutzt?', opts: [
          { v: 'eu', t: 'In der EU bzw. im EWR', s: { D3: 'na' } },
          { v: 'us_ok', t: 'USA oder anderes Drittland – abgesichert (z. B. DPF oder Standardvertragsklauseln)', s: { D3: 'done' } },
          { v: 'us', t: 'USA oder anderes Drittland – noch nicht abgesichert', s: { D3: 'open' } },
          { v: 'wn', t: 'Weiß ich nicht', s: { D3: 'unclear' } }
        ], fields: [ { k: 'modell', label: 'Sprachmodell-Anbieter und Region', ph: 'z. B. Anbieter, Rechenzentrum Frankfurt' } ] },
        { id: 'd5', type: 'single', item: 'D5', q: 'Ist festgelegt, auf welcher Rechtsgrundlage Lernende den Tutor nutzen?', opts: [
          { v: 'ja', t: 'Ja, festgelegt und dokumentiert (z. B. Vertragserfüllung)', s: { D5: 'done' } },
          { v: 'einwilligung', t: 'Wir planen, Einwilligungen einzuholen', s: { D5: 'check' } },
          { v: 'nein', t: 'Noch nicht festgelegt', s: { D5: 'open' } },
          { v: 'wn', t: 'Weiß ich nicht', s: { D5: 'unclear' } }
        ] },
        { id: 'd_intern', type: 'multi', items: ['D6', 'D7', 'D8', 'D9', 'D10'], q: 'Was ist bei Ihnen intern schon geregelt?', help: 'Mehrfachauswahl', opts: [
          { v: 'hinweise', t: 'Datenschutzhinweise für Lernende ergänzt', item: 'D6' },
          { v: 'dsfa', t: 'Datenschutz-Folgenabschätzung geprüft und dokumentiert', item: 'D7' },
          { v: 'loeschen', t: 'Löschfristen für Chatverläufe festgelegt', item: 'D8' },
          { v: 'sparsam', t: 'Datensparsam konfiguriert: keine Klarnamen an das Sprachmodell', item: 'D9' },
          { v: 'vvt', t: 'Verarbeitungsverzeichnis um den KI-Tutor ergänzt', item: 'D10' },
          { v: 'none', t: 'Nichts davon / weiß ich nicht', none: true }
        ], fields: [ { k: 'loeschfrist', label: 'Löschfrist für Chatverläufe (falls festgelegt)', ph: 'z. B. 90 Tage' } ] }
      ] },

    { id: 'A', title: 'EU AI Act', sub: 'KI-Verordnung',
      intro: 'Für einen Lern-Tutor überschaubar – wenn Sie wissen, wo die Grenzen liegen.',
      questions: [
        { id: 'a1', type: 'multi', item: 'A1', q: 'Wofür soll der Tutor eingesetzt werden?', help: 'Mehrfachauswahl', compute: 'a1', opts: [
          { v: 'lernen', t: 'Lernbegleitung: Fragen beantworten, erklären, üben' },
          { v: 'bewerten', t: 'Lernergebnisse bewerten oder benoten', hr: true },
          { v: 'zulassung', t: 'Über Zulassungen entscheiden', hr: true },
          { v: 'einstufen', t: 'Bildungsniveau einstufen', hr: true },
          { v: 'pruefung', t: 'Prüfungen beaufsichtigen', hr: true }
        ] },
        { id: 'a1b', type: 'single', item: 'A1', showIf: { q: 'a1', noHr: true }, q: 'Ist die Einstufung „kein Hochrisiko“ schriftlich festgehalten?', opts: [
          { v: 'ja', t: 'Ja', s: { A1: 'done' } }, { v: 'nein', t: 'Nein', s: { A1: 'open' } }, { v: 'wn', t: 'Weiß ich nicht', s: { A1: 'unclear' } }
        ] },
        { id: 'a2', type: 'single', item: 'A2', q: 'Ist ausgeschlossen, dass der Tutor Emotionen von Lernenden erkennt oder auswertet?', opts: [
          { v: 'ja', t: 'Ja, vom Anbieter bestätigt', s: { A2: 'done' } }, { v: 'nein', t: 'Nein', s: { A2: 'open' } }, { v: 'wn', t: 'Weiß ich nicht', s: { A2: 'unclear' } }
        ] },
        { id: 'a3', type: 'single', item: 'A3', q: 'Ist im Chat für Lernende sichtbar, dass sie mit einer KI sprechen?', opts: [
          { v: 'ja', t: 'Ja', s: { A3: 'done' } }, { v: 'geplant', t: 'Geplant', s: { A3: 'part' } }, { v: 'nein', t: 'Nein', s: { A3: 'open' } }, { v: 'wn', t: 'Weiß ich nicht', s: { A3: 'unclear' } }
        ] },
        { id: 'a4', type: 'single', item: 'A4', q: 'Sind die Beteiligten – Lehrende, Betreuende, Admins – zum KI-Tutor geschult, und ist das dokumentiert?', opts: [
          { v: 'ja', t: 'Ja, geschult und dokumentiert', s: { A4: 'done' } }, { v: 'teil', t: 'Geschult, aber nicht dokumentiert', s: { A4: 'part' } },
          { v: 'nein', t: 'Noch nicht', s: { A4: 'open' } }
        ] }
      ] },

    { id: 'M', title: 'Mitbestimmung', sub: 'BetrVG', employeesOnly: true,
      intro: 'Lernen eigene Beschäftigte mit dem Tutor, hat der Betriebsrat ein Wort mitzureden – je früher, desto reibungsloser.',
      questions: [
        { id: 'm1', type: 'single', item: 'M1', q: 'Wann ist der Betriebsrat eingebunden?', opts: [
          { v: 'informiert', t: 'Er ist bereits informiert', s: { M1: 'done' } },
          { v: 'geplant', t: 'Vor der Anbieterauswahl geplant', s: { M1: 'part' } },
          { v: 'spaet', t: 'Erst kurz vor dem Livegang', s: { M1: 'open' } },
          { v: 'nein', t: 'Noch nicht geplant', s: { M1: 'open' } }
        ] },
        { id: 'm_rest', type: 'multi', items: ['M2', 'M3', 'M4'], q: 'Was ist mit dem Betriebsrat schon vorbereitet?', help: 'Mehrfachauswahl', opts: [
          { v: 'bv', t: 'Betriebsvereinbarung oder Regelungsabrede vorbereitet', item: 'M2' },
          { v: 'aggregiert', t: 'Auswertungen sind nur aggregiert möglich', item: 'M3' },
          { v: 'sv', t: 'Sachverständiger für den Betriebsrat eingeplant', item: 'M4' },
          { v: 'none', t: 'Nichts davon / weiß ich nicht', none: true }
        ] }
      ] },

    { id: 'F', title: 'Anbieter & Features', sub: 'Worauf achten?',
      intro: 'Was Sie beim Anbieter oder in der Demo prüfen sollten – bevor Sie unterschreiben.',
      questions: [
        { id: 'f_demo', type: 'multi', items: ['F1', 'F2', 'F3', 'F4', 'F5'], q: 'Was haben Sie beim Anbieter oder in der Demo schon geprüft?', help: 'Mehrfachauswahl', opts: [
          { v: 'quellen', t: 'Antworten nur aus Ihren Kursinhalten – mit Quellenangabe', item: 'F1' },
          { v: 'didaktik', t: 'Didaktik einstellbar: erklärt statt vorsagt', item: 'F2' },
          { v: 'grenzen', t: 'Themen außerhalb des Kurses werden abgelehnt', item: 'F3' },
          { v: 'lms', t: 'Nahtlos im LMS: Plugin, Single Sign-on, Kurskontext', item: 'F4' },
          { v: 'qualitaet', t: 'Qualität messbar: Feedback auf Antworten, Auswertung ohne Personenbezug', item: 'F5' },
          { v: 'none', t: 'Nichts davon / noch keine Demo', none: true }
        ] },
        { id: 'f_vertrag', type: 'multi', items: ['F6', 'F7', 'F8'], q: 'Was ist vertraglich geregelt oder geprüft?', help: 'Mehrfachauswahl', opts: [
          { v: 'exit', t: 'Exit-Strategie: Export und Löschung bei Vertragsende', item: 'F6' },
          { v: 'updates', t: 'Sicherheitsupdates und Wartung vertraglich geklärt', item: 'F7' },
          { v: 'barriere', t: 'Barrierefreiheit und Mehrsprachigkeit geprüft', item: 'F8' },
          { v: 'none', t: 'Nichts davon / weiß ich nicht', none: true }
        ] }
      ] },

    { id: 'S', title: 'Start & Betrieb', sub: 'Tipps aus der Praxis',
      intro: 'Wie Sie den Start so aufsetzen, dass der Tutor dauerhaft trägt.',
      questions: [
        { id: 's1', type: 'single', item: 'S1', q: 'Wie starten Sie?', opts: [
          { v: 'pilot_ziel', t: 'Mit einem Pilotkurs – Ziel und Kennzahl stehen fest', s: { S1: 'done' } },
          { v: 'pilot', t: 'Mit einem Pilotkurs – ohne festgelegte Kennzahl', s: { S1: 'part' } },
          { v: 'breit', t: 'Direkt in vielen Kursen', s: { S1: 'open' } },
          { v: 'offen', t: 'Noch offen', s: { S1: 'open' } }
        ], fields: [ { k: 'pilotziel', label: 'Ziel oder Kennzahl des Pilots', ph: 'z. B. 30 % weniger Rückfragen an Lehrende' } ] },
        { id: 's_rest', type: 'multi', items: ['S2', 'S3', 'S4', 'S5'], q: 'Was ist für den Start schon vorbereitet?', help: 'Mehrfachauswahl', opts: [
          { v: 'rechte', t: 'Rechte an den eingespielten Inhalten geprüft', item: 'S2' },
          { v: 'tests', t: 'Testfragen-Set vor dem Start durchgespielt', item: 'S3' },
          { v: 'info', t: 'Lernende informiert und menschliche Ansprechperson genannt', item: 'S4' },
          { v: 'meldeweg', t: 'Meldeweg für Fehlantworten und monatliche Durchsicht', item: 'S5' },
          { v: 'none', t: 'Nichts davon / weiß ich nicht', none: true }
        ], fields: [ { k: 'ansprech', label: 'Menschliche Ansprechperson für Lernende', ph: 'z. B. Kursbetreuung, support@…' } ] },
        { id: 's_frage', type: 'fields', optional: true, q: 'Ihre größte offene Frage zur Einführung', help: 'Freiwillig. Bleibt in Ihrem Browser und steht in Ihrem Ergebnis.', fields: [
          { k: 'frage', label: 'Ihre Frage', ph: 'z. B. Wie überzeugen wir unseren Datenschutzbeauftragten?', area: true }
        ] }
      ] }
  ],

  // Anbieter-Fragenkatalog (Vorlage in ki-check.js): welche der 15 Fragen gehören zu welchem Punkt
  vendorMap: { R2: [3], D1: [3], D2: [1, 2], D3: [5], D4: [4], D7: [7], D8: [6], A1: [10], A2: [9], A3: [8], F1: [11], F2: [12], F5: [13], F6: [15], F7: [14] },
  // Zuständigkeit im Fahrplan (Vorschlag): Personen aus der Frage „Wer entscheidet …“
  owner: { R: 'p_ds', D: 'p_ds', D2: 'p_tech', A: 'p_fach', F: 'p_fach', F4: 'p_tech', F7: 'p_tech', S: 'p_fach' },

  // Auswertung „Welche Dokumente brauchen Sie?“: Status ergibt sich aus den Punkten (schlechtester Stand zählt).
  // from: anbieter = vom Anbieter anfordern, intern = selbst erstellen, br = mit dem Betriebsrat. tpl = passende Vorlage im Ergebnis.
  docs: [
    { t: 'Auftragsverarbeitungsvertrag (AVV) mit technischen und organisatorischen Maßnahmen', from: 'anbieter', items: ['D1', 'R2'] },
    { t: 'Liste der Unterauftragsverarbeiter – mit Sprachmodell und Standort', from: 'anbieter', items: ['D2'] },
    { t: 'Nachweis zur Drittlandübermittlung (DPF-Zertifizierung oder Standardvertragsklauseln)', from: 'anbieter', items: ['D3'] },
    { t: 'Schriftlicher Ausschluss: kein Training mit Ihren Daten', from: 'anbieter', items: ['D4'] },
    { t: 'Bestätigung: keine Emotionserkennung', from: 'anbieter', items: ['A2'] },
    { t: 'Zusage zu Sicherheitsupdates und Wartung', from: 'anbieter', items: ['F7'] },
    { t: 'Regelung zu Export und Löschung bei Vertragsende', from: 'anbieter', items: ['F6'] },
    { t: 'Rollen-Steckbrief: Verantwortlicher, Betreiber, Ansprechpersonen', from: 'intern', items: ['R1', 'R3', 'R5'], tpl: 'steck' },
    { t: 'Vermerk zur Einstufung nach KI-Verordnung', from: 'intern', items: ['A1'], tpl: 'steck' },
    { t: 'Eintrag im Verarbeitungsverzeichnis mit Rechtsgrundlage', from: 'intern', items: ['D10', 'D5'] },
    { t: 'Datenschutzhinweise für Lernende', from: 'intern', items: ['D6'] },
    { t: 'Dokumentierte Prüfung zur Datenschutz-Folgenabschätzung', from: 'intern', items: ['D7'] },
    { t: 'Festgelegte Löschfristen für Chatverläufe', from: 'intern', items: ['D8'] },
    { t: 'Transparenzhinweis im Chatfenster mit menschlicher Ansprechperson', from: 'intern', items: ['A3', 'S4'], tpl: 'transparenz' },
    { t: 'Schulungsnachweis KI-Kompetenz', from: 'intern', items: ['A4'], tpl: 'schulung' },
    { t: 'Klärung der Rechte an den eingespielten Inhalten', from: 'intern', items: ['S2'] },
    { t: 'Testfragen-Set mit Ergebnis', from: 'intern', items: ['S3'] },
    { t: 'Pilotziel mit Kennzahl', from: 'intern', items: ['S1'] },
    { t: 'Betriebsvereinbarung oder Regelungsabrede', from: 'br', items: ['M2'], tpl: 'bv' }
  ],

  // Auswertung „Wer muss zustimmen?“ – who: Stelle, what: wofür, owner: Person aus „Wer entscheidet …“
  approvals: [
    { who: 'Geschäftsführung bzw. Einkauf', what: 'Unterschrift unter Vertrag und AVV', items: ['D1', 'R2', 'D4'] },
    { who: 'Datenschutz', what: 'Verarbeitungsverzeichnis, Datenschutzhinweise und Prüfung zur Folgenabschätzung', items: ['D5', 'D6', 'D7', 'D10'], owner: 'p_ds' },
    { who: 'Betriebsrat', what: 'Mitbestimmung vor der Einführung', items: ['M1', 'M2'], employeesOnly: true },
    { who: 'IT bzw. LMS-Administration', what: 'Plugin, Single Sign-on und Updates', items: ['F4', 'F7'], owner: 'p_tech' },
    { who: 'Rechteinhaber der Kursinhalte', what: 'Nutzung der Inhalte im Tutor', items: ['S2'] },
    { who: 'Fachliche Leitung', what: 'Freigabe nach dem Testfragen-Set', items: ['S3'], owner: 'p_fach' }
  ]
};
