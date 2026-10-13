/**
 * Plug-and-Play Aktion – Anmeldungen → Google Sheet „Alphabees Lead Pipeline 2025“, Tab „PnP-Aktion“.
 * Frontend: /de/plug-and-play.html (Konstante PNP_ENDPOINT).
 *
 * EINRICHTUNG (einmalig, ca. 5 Minuten)
 * 1. https://script.google.com → „Neues Projekt“ (eigenständiges Projekt, NICHT in das bestehende
 *    Skript „KI-Compliance-Check Leads“ kopieren – dort gibt es schon ein doPost).
 *    Name: „PnP-Aktion Anmeldungen“. Diesen Code komplett einfügen, speichern.
 * 2. Funktion „setup“ einmal ausführen (Dropdown oben → setup → Ausführen) und die Berechtigungen
 *    bestätigen. Das legt die Kopfzeile im Tab an und schickt eine Testmail.
 * 3. „Bereitstellen“ → „Neue Bereitstellung“ → Typ „Web-App“
 *      Ausführen als: Ich
 *      Zugriff: Jeder
 *    → URL kopieren (endet auf /exec) und in de/plug-and-play.html bei PNP_ENDPOINT eintragen.
 * 4. Bei späteren Code-Änderungen: „Bereitstellungen verwalten“ → Stift → Version „Neu“ (URL bleibt gleich).
 *
 * Kein echtes Limit: Jede Anmeldung wird angenommen (Status „Angemeldet“, Spalte „platz“ = laufende Nummer).
 * Die „10 Plätze“ auf der Seite sind reine Kommunikation.
 *
 * GET  …/exec            → {"count":3}   (Anzahl Anmeldungen, nur zur Kontrolle)
 * POST …/exec            → Body JSON (text/plain), schreibt eine Zeile. Gleiche E-Mail = keine neue Zeile;
 *                          mit nachtrag:true werden Organisation, LMS usw. in der bestehenden Zeile ergänzt.
 */

var CONFIG = {
  SPREADSHEET_ID: '1k0I6f4IFUrIbwfKu5kdNEm24jT30InULljsCKADvV_E',
  SHEET_GID: 1055734764,                       // Tab „PnP-Aktion“ (bleibt gültig, auch wenn der Tab umbenannt wird)
  NOTIFY: 'marcel.pasternak@alphabees.de'      // Benachrichtigung bei jeder Anmeldung ('' = aus)
};

var HEADERS = ['zeit', 'status', 'platz', 'vorname', 'nachname', 'email', 'organisation', 'rolle',
  'lms', 'lernende', 'kursthema', 'nachricht', 'quelle', 'kampagne', 'naechster_schritt'];

function sheet_() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sh = ss.getSheets().filter(function (s) { return s.getSheetId() === CONFIG.SHEET_GID; })[0];
  if (!sh) throw new Error('Tab mit gid ' + CONFIG.SHEET_GID + ' nicht gefunden');
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_(sh) {
  var n = sh.getLastRow() - 1;
  return n > 0 ? sh.getRange(2, 1, n, HEADERS.length).getValues() : [];
}


function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  // Text kürzen und Formel-Injection verhindern (Zellen, die mit = + - @ beginnen)
  v = String(v == null ? '' : v).trim().slice(0, max || 200);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function doGet() {
  return json_({ count: rows_(sheet_()).length });
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }

  if (d.website) return json_({ ok: true, status: 'Angemeldet' });           // Honeypot: Bots bekommen „ok“, nichts wird gespeichert
  var email = clean_(d.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: 'missing_fields' });
  // Ein-Klick-Anmeldung aus dem Newsletter: nur E-Mail (+ Vorname). Organisation notfalls aus der Domain.
  if (!clean_(d.organisation)) d.organisation = '(' + email.split('@')[1] + ')';

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_();
    var rows = rows_(sh);
    var existing = rows.filter(function (r) { return String(r[5]).toLowerCase() === email; })[0];
    if (existing) {
      // Nachtrag von der Danke-Seite (Organisation, LMS …): vorhandene Zeile ergänzen statt neue anzulegen
      if (d.nachtrag) {
        var r = rows.indexOf(existing) + 2;
        var set = function (col, v, max) { v = clean_(v, max); if (v) sh.getRange(r, col).setValue(v); };
        set(5, d.nachname, 80); set(7, d.organisation, 160); set(8, d.rolle, 120);
        set(9, d.lms, 40); set(10, d.lernende, 40); set(11, d.kursthema, 300);
      }
      return json_({ ok: true, status: existing[1], platz: existing[2], duplicate: true });
    }

    var status = 'Angemeldet';
    var platz = rows.length + 1;
    sh.appendRow([
      new Date(), status, platz,
      clean_(d.vorname, 80), clean_(d.nachname, 80), email, clean_(d.organisation, 160), clean_(d.rolle, 120),
      clean_(d.lms, 40), clean_(d.lernende, 40), clean_(d.kursthema, 300), clean_(d.nachricht, 1500),
      clean_(d.quelle, 200), clean_(d.kampagne, 120), 'Demo-Kurs anfordern'
    ]);

    if (CONFIG.NOTIFY) {
      MailApp.sendEmail({
        to: CONFIG.NOTIFY,
        replyTo: email,
        subject: 'PnP-Aktion: Anmeldung #' + platz + ' – ' + clean_(d.organisation, 160),
        body: [
          'Neue Anmeldung zur Plug-and-Play Aktion', '',
          'Anmeldung:    #' + platz,
          'Name:         ' + clean_(d.vorname, 80) + ' ' + clean_(d.nachname, 80),
          'E-Mail:       ' + email,
          'Organisation: ' + clean_(d.organisation, 160),
          'Rolle:        ' + clean_(d.rolle, 120),
          'LMS:          ' + clean_(d.lms, 40),
          'Lernende:     ' + clean_(d.lernende, 40),
          'Kursthema:    ' + clean_(d.kursthema, 300),
          'Nachricht:    ' + clean_(d.nachricht, 1500),
          'Quelle:       ' + clean_(d.quelle, 200) + ' / ' + clean_(d.kampagne, 120), '',
          'Antworten geht direkt an die Person (Reply-To).',
          'Sheet: https://docs.google.com/spreadsheets/d/' + CONFIG.SPREADSHEET_ID + '/edit#gid=' + CONFIG.SHEET_GID
        ].join('\n')
      });
    }
    return json_({ ok: true, status: status, platz: platz });
  } finally {
    lock.releaseLock();
  }
}

/** Einmal manuell ausführen: Berechtigungen erteilen, Kopfzeile anlegen, Testmail senden. */
function setup() {
  var sh = sheet_();
  Logger.log('Tab: ' + sh.getName() + ', Zeilen: ' + sh.getLastRow());
  if (CONFIG.NOTIFY) MailApp.sendEmail(CONFIG.NOTIFY, 'PnP-Aktion: Setup ok', 'Das Anmelde-Skript ist eingerichtet. Tab: ' + sh.getName());
}
