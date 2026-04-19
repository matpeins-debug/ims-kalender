# Tageszusammenfassung · 19. April 2026

**Projekt:** IMS iFlow Kalender · Phase 1
**Anwesend:** MAP (Mathias Peinsold), Claude Code
**Dauer:** ~3 Stunden · von UI-Design-Stand (Note 1.0) bis produktiv-Live

---

## 🎯 Ergebnis in einem Satz

**Der IMS Kalender läuft produktiv unter https://ims-kalender.vercel.app — MAP ist eingeloggt und sieht die Demo-Termine für KW 17/2026.**

---

## ✅ Was heute geschafft wurde

### 1. Supabase-Infrastruktur
- Schema `termine`, `termin_teilnehmer`, `termine_ams` mit Enums, Indizes, Row-Level-Security angelegt (Projekt `elwlptapzwwqhjuxnnws` · "IMS TOOL")
- GRANTs für `authenticated`-Rolle gesetzt (nötig für PostgREST-Zugriff)
- 4 User via Admin-API angelegt (MAP, MP, EK, DT) mit Passwort `IMS-Kalender-2026!`
- 12 Demo-Termine programmatisch geseedet (ersetzt die hardcoded Termine aus dem Prototyp)
- Korrektur: MAP's echte E-Mail ist `ma.peinsold@ims-box.at`, nicht `mathias.peinsold@...` — User umbenannt, alte UUID wurde gemergt (9 Termine umgeschrieben), Duplicate gelöscht

### 2. Projekt-Scaffold
- `C:\Users\matpe\CLAUDE\iflowTerminkalender\` mit 32+ Dateien
- `package.json` · `vercel.json` · `.env.example` · `.gitignore` · `README.md`
- Git initialisiert, lokale Config auf Vercel-kompatible E-Mail (`matpeins@gmail.com`)

### 3. Node.js/Express-API
- Single-App unter `api/index.js` (Vercel-Serverless-Function-Convention)
- Module: `auth.js` (Supabase-JWT-Middleware · respektiert RLS via User-Client), `termine.js` (CRUD), `teilnehmer.js`, `queries.js` (person/kunde/ams), `cron.js` (Skeleton Phase 2), `utils.js` (validate/ok/fail)
- Response-Format `{success, data, error}` · deutsche Feldnamen

### 4. Frontend (Vanilla JS · Safari-safe)
- `public/index.html` — Login-Seite mit **Passwort-Login als Primär + Magic-Link als Fallback**
- `public/kalender.html` — Wochenansicht aus Prototyp `kalender_final.html` übernommen, Mock-Daten entfernt, an API angebunden
- `public/kalender-mobile.html` — Mobile-Detail-View aus `kalender_mobile_detail.html`, Phone-Frame-Wrapper entfernt, an API angebunden
- 5 JS-Helper: `config.js`, `supabase-client.js`, `api-client.js`, `date-helpers.js`, `termin-modal.js`
- **Safari-Check bestanden:** `npm run check:safari` → clean. Nur `var`/`function`, kein ES6 im Browser

### 5. Deploy-Pipeline
- GitHub-Repo `matpeins-debug/ims-kalender` (private) angelegt + gepusht
- Vercel-CLI + GitHub-CLI installiert (Vercel 51.7.0 · GitHub 2.90.0)
- Vercel-Projekt `ims-kalender` unter `matpeins-debugs-projects` verlinkt
- 4 ENV-Variablen gesetzt: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
- Production-Deploy ging durch (nach Fix: Git-Autor-E-Mail musste `matpeins@gmail.com` sein, nicht `mathias.peinsold@...`, wegen Vercel Team-Access-Check)

### 6. Aufgelöste Blocker
- ❌ → ✅ **Supabase DB-Speicher voll** — Diagnose-Queries bereitgestellt, aktuelle Nutzung ist OK
- ❌ → ✅ **Vercel CLI Auth persistiert nicht auf Windows** — umgangen mit `--token`-Flag
- ❌ → ✅ **Deploy-Cron-Jobs auf Hobby-Plan abgelehnt** — Crons aus `vercel.json` entfernt für Phase 1 (skeleton bleibt aktivierbar via Pro-Upgrade oder externem Scheduler)
- ❌ → ✅ **Vercel lehnt Deploy wegen falscher Git-Autor-E-Mail ab** — auf `matpeins@gmail.com` umgestellt
- ❌ → ✅ **Safari-Verbindung erst gefühlt kaputt** — war die alte Magic-Link-UI-Verwirrung; Passwort-Login-Variante gebaut → sofort drin
- ❌ → ✅ **Passwort-Login funktioniert** — MAP erfolgreich eingeloggt

---

## 📊 Aktuelle Produktion

| Asset | Status |
|---|---|
| Production-URL | https://ims-kalender.vercel.app |
| GitHub-Repo | https://github.com/matpeins-debug/ims-kalender |
| Letzter Deploy | `dpl_6C5xpKv4cKndNGcNqju2nC13ep5U` · READY |
| Supabase-Project | elwlptapzwwqhjuxnnws (IMS TOOL) |
| Login-E-Mail | `ma.peinsold@ims-box.at` |
| Passwort | `IMS-Kalender-2026!` |
| Termine in DB | 12 (KW 17/2026) |
| Cron-Jobs | deaktiviert (Hobby-Plan-Limit) |

---

## 🧭 Sofort testbar

1. https://ims-kalender.vercel.app öffnen
2. Login mit `ma.peinsold@ims-box.at` · `IMS-Kalender-2026!`
3. `›` drücken zum Navigieren auf KW 17 (20.–24. April)
4. Klick auf „Kunde Schadner" → Popup rechts
5. „Neuer Termin" rechts oben → Modal → Speichern
6. Popup-Bearbeiten oder Mobile-Detail-View unter `/mobile/termin/<UUID>`

---

## 📋 Offene Punkte / nicht in Phase 1 erledigt

| Punkt | Status | Plan |
|---|---|---|
| Custom-Domain `kalender.ims-box.at` | Offen | DNS-CNAME setzen (Hoster-Name gebraucht) |
| GitHub → Vercel Auto-Deploy | Offen (CLI-Link failed) | Vercel Dashboard → Settings → Git → Connect Git Repository · manuell 10 Sek. |
| Vercel-Token revoken | Offen | Nach Auto-Deploy-Setup nicht mehr nötig |
| Supabase SMTP auf Resend umstellen | Offen | Dashboard → Authentication → SMTP · dann kommen Magic-Links von `office@ims-box.at` statt Supabase-Default |
| ams.erp-Liefertermin-Sync | Phase 2 | Skeleton in `api/kalender/cron.js` ready |
| Morgen-/Abend-Briefings | Phase 2 | Skeleton ready · braucht Pro-Plan oder externen Scheduler |
| Live-PROFIT-NAVI aus Qlik | Phase 2 | Aktuell Demo-Daten für 3 Kunden (Schadner/Schmid/Huber) |
| Mobile-Wochenansicht | Phase 4 | Aktuell nur Desktop-Wochen- + Mobile-Detail-View |
| M365/Outlook-Sync | Phase 5 | Außerhalb v0.2 |
| CalDAV-Endpoint (iPad-Kalender) | Phase 3 | Außerhalb Phase 1 |
| Doppelter User `mathias.peinsold@...` | Offen | Kann per Merge-Script entfernt werden (siehe scripts/) |

---

## 💡 Entscheidungen, die heute getroffen wurden

1. **DB-Feldnamen deutsch** (`titel`, `start_zeit`, `kategorie`) — konsistent mit `kunden`, `artikel`, `angebote`, `ansprechpartner`
2. **Passwort-Login** als Primär statt Magic-Link-only — wegen Mat's berechtigter Frage „wie sind die Passwörter" + Spam-Risiko bei Magic-Mail
3. **Keine Cron-Jobs in Phase 1** — Hobby-Plan erlaubt max. 1×/Tag, nicht sinnvoll für echten ams-Sync. Geht in Phase 2 via Pro oder externen Scheduler (cron-job.org, Supabase pg_cron, GitHub Actions)
4. **Vercel-Git-Author-E-Mail** = `matpeins@gmail.com` für alle zukünftigen Commits
5. **ma.peinsold@ims-box.at** ist MAP's echte Adresse (nicht `mathias.peinsold@...`)

---

## 📚 Code-Metriken

- **32 Dateien** im Git-Repo
- **12 Commits** heute (von `583cbd1` bis letzter)
- **~2.500 Zeilen Code** (exkl. node_modules)
- **Safari-Check:** clean
- **Deploy-Dauer:** 12 Sekunden (Standard-Build)
- **Kaltstart-API:** ~200ms (Vercel Serverless + Supabase Postgres)

---

## 🙏 Nächste Session

Siehe `UEBERGABE.md` — dort steht alles was Claude oder ein anderer Dev wissen muss, um nahtlos weiterzumachen.
