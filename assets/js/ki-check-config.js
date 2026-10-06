/* KI-Compliance-Check – Konfiguration für den E-Mail-Catcher.
   Hier wird später verdrahtet. Solange provider leer ist, wird nichts versendet;
   der Report erscheint trotzdem auf der Seite (gut zum Testen).

   providers: beliebige Kombination aus 'kit' und 'sheets'
   - kit:    Kit-Formular-ID (Kit > Grow > Landing Pages & Forms > Formular > Embed: Zahl in der URL)
   - sheets: URL der Google-Apps-Script-Web-App (siehe docs/SETUP-email-catcher.md)
*/
window.KI_CHECK_CONFIG = {
  providers: ['kit', 'sheets'],  // Kit (Report-Mail, Double-Opt-in) + Google Sheets (Backup, Tab LeadMagnet_2026)
  kit: {
    formId: '10008528',          // Kit-Formular „KI-Compliance-Check“
    endpoint: 'https://app.kit.com/forms/{formId}/subscriptions'
  },
  sheets: {
    endpoint: 'https://script.google.com/macros/s/AKfycbxP2pUGzb9cNOdyk1iuH-nXRbLYe1QEJAzBflKnIShrn86Su9X7fR1ll9hBe3tday-XnA/exec' // Apps Script „KI-Compliance-Check Leads“, Konto marcel@bionic.toys
  },
  // PDF-Handbuch (liegt im Repo; Kit verschickt es zusätzlich nach Bestätigung)
  handbookUrl: '/assets/downloads/KI-Tutor-einfuehren-Handbuch-Alphabees.pdf',
  // KI-Assistent zum Handbuch: AlphaLearn-Bot mit dem Handbuch als Wissensbasis.
  // Leer = Abschnitt #assistent bleibt ausgeblendet. Format wie auf der Startseite:
  // 'https://chat.alphabees.de/production/index.html?botId=...&apiKey=...&isFullscreen=true'
  assistantUrl: '',
  reportUrl: 'https://alphalearn.ai/de/ki-compliance-check.html',
  demoUrl: '/de/demos.html',
  complianceUrl: '/de/compliance.html',
  calendlyUrl: 'https://calendly.com/demo-alphabees/austausch-anfragen-alphabees',
  privacyUrl: '/de/privacy.html'
};
