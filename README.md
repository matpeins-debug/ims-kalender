# IMS Kalender

**iFlow Kalender-Modul** · Phase 1 · Deploy-Ziel: `kalender.ims-box.at`
Vanilla HTML/CSS/JS Frontend · Node.js/Express API · Supabase Postgres · Vercel

---

## Features (Phase 1)

- 🔐 Supabase-Auth mit Magic-Link (kein Passwort)
- 🗓 Wochenansicht (Mo–Fr) mit 7 Termin-Kategorien
- ➕ Termin anlegen / bearbeiten / löschen
- 👥 Team-Sicht (alle sehen alles · RLS-geschützt)
- 🔒 Privat-Flag (nur für Besitzer sichtbar)
- 👋 EK-Marker (Elke legt für Michael an)
- 📱 Mobile Detail-View für Außendienst (PROFIT-NAVI, Route starten)
- 📲 Safari/iPad-kompatibel (nur `var`/`function`, kein ES6 im Browser)

**Nicht in Phase 1** (kommen später):
- ams.erp-Liefertermin-Sync (Cron-Skeleton ist schon da)
- Morning/Follow-up-Briefings (E-Mail-Template + Cron-Skeleton da)
- CalDAV-Endpoint für iOS-Kalender
- Outlook/M365-Sync
- Live-PROFIT-NAVI aus Qlik (Phase 1 nutzt Demo-Daten für 3 bekannte Kunden)

---

## Lokales Setup (5 Minuten)

### Voraussetzung
Node.js ≥ 20, npm, git.

### 1. Klonen + Install
```bash
git clone https://github.com/<dein-org>/ims-kalender.git
cd ims-kalender
npm install
```

### 2. `.env` anlegen
```bash
cp .env.example .env
# Danach .env öffnen und die 3 Supabase-Werte eintragen:
#   - SUPABASE_URL
#   - SUPABASE_ANON_KEY
#   - SUPABASE_SERVICE_ROLE_KEY
# Dashboard → Settings → API
```

### 3. Supabase vorbereiten
Im Supabase-SQL-Editor folgende Dateien **in dieser Reihenfolge** ausführen:

1. `supabase/migrations/001_kalender_schema.sql` — Tabellen, Enums, RLS, Policies
2. `supabase/migrations/002_grants.sql` — GRANTs für `authenticated`
3. 4 User anlegen: `npm run seed:users` (nutzt Service-Role-Key aus `.env`)
4. `supabase/seeds/001_termine_seed.sql` — 11 Demo-Termine für KW 17/2026

### 4. Frontend-Config
`public/js/config.js` öffnen und **SUPABASE_ANON_KEY** eintragen (der gleiche Wert wie in `.env`).

### 5. Dev-Server starten
```bash
npm run dev
# → http://localhost:3000
```

Browser: `http://localhost:3000` → Login mit einer der 4 angelegten E-Mails → Magic-Link kommt → Klick → drin.

---

## Production-Deploy (Vercel + GitHub)

### Erstmals
1. `gh auth login` (GitHub CLI, 1 Klick im Browser)
2. `gh repo create ims-kalender --private --source=. --push`
3. `vercel login` (Vercel CLI, 1 Klick im Browser)
4. `vercel link` im Repo-Root
5. ENV-Variablen im Vercel-Dashboard setzen:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY` (Phase 2)
   - `CRON_SECRET` (generieren mit `openssl rand -base64 32`)
6. `vercel --prod`

### Custom-Domain
In Vercel → Project → Settings → Domains → `kalender.ims-box.at` hinzufügen.
DNS-Record bei deinem Domain-Hoster:
- `CNAME kalender → cname.vercel-dns.com.`

### Updates danach
```bash
git commit -am "Update"
git push
# Vercel deployed automatisch
```

---

## Architektur

```
Browser (Vanilla JS)
    │
    │ fetch + Bearer-Token
    ▼
Express-App (api/index.js) · Vercel Serverless
    │
    ├── /api/kalender/termine/*       → CRUD (RLS-geschützt via User-JWT)
    ├── /api/kalender/termine/:id/teilnehmer/*
    ├── /api/kalender/person/:kuerzel
    ├── /api/kalender/kunde/:nr
    ├── /api/kalender/ams/liefertermine
    └── /api/cron/*                    → Vercel Cron (siehe vercel.json)
    │
    ▼
Supabase Postgres
    │
    ├── termine              (RLS: alle sehen alle außer ist_privat)
    ├── termin_teilnehmer    (RLS: via termine)
    └── termine_ams          (RLS: authenticated read-only · Phase 2)
```

**Datei-Struktur:**
```
api/
  index.js              Express-App (Vercel-Function)
  kalender/
    auth.js             Supabase-JWT-Middleware
    termine.js          CRUD Termine
    teilnehmer.js       CRUD Teilnehmer
    queries.js          Queries person/kunde/ams/me
    cron.js             Skeleton für Phase 2
    utils.js            ok()/fail()/validate
public/
  index.html            Magic-Link-Login
  kalender.html         Wochenansicht (Safari-safe inline JS)
  kalender-mobile.html  Mobile Detail-View
  js/
    config.js           ENV-Spiegel fürs Frontend
    supabase-client.js  Browser-Supabase-Init
    api-client.js       Fetch-Wrapper
    date-helpers.js     KW-Logik, API→UI-Mapping
    termin-modal.js     Create/Edit-Modal
supabase/
  migrations/
    001_kalender_schema.sql
    002_grants.sql
  seeds/
    001_termine_seed.sql
scripts/
  dev-server.js
  seed-users.js
  test-api.sh
  check-safari-safe.js
```

---

## Entwickler-Konventionen

| Bereich | Regel |
|---|---|
| **DB-Feldnamen** | Deutsch (`titel`, `start_zeit`, `kategorie`, `besitzer`) |
| **API-Response** | `{ success, data, error }` — Keys deutsch |
| **Frontend-JS** | Safari-safe: **nur** `var` + `function`, **kein** `let`/`const`/`=>` im Browser |
| **Backend-JS** | Modern ES2022 erlaubt (läuft nur auf Node) |
| **Datum-Format** | API: ISO 8601 / UI: `DD.MM.YYYY` + `HH:MM` (24h) |
| **Glass/Design** | Siehe `iflow-design-system`-Skill — Light Mode, weiche Shadows, 3px-Akzentstreifen |

Safari-Check läuft automatisch:
```bash
npm run check:safari
```

---

## API-Test

Session-Token aus Browser-localStorage holen (Key: `ims-kalender-auth`) und:

```bash
TOKEN="eyJhbG..." BASE_URL="http://localhost:3000" bash scripts/test-api.sh
```

Alternativ: Chrome DevTools → Application → Local Storage → `ims-kalender-auth` → `access_token` kopieren.

---

## Offene Decisions (Phase 1-Umsetzung)

1. **CalDAV** — noch nicht implementiert. Ab Phase 3 via `node-ical` oder eigener iCal-Feed unter `/caldav/:kuerzel/calendar.ics`.
2. **Live-PROFIT-NAVI** — aktuell Demo-Daten für 3 Kunden (Schadner / Schmid / Huber). Phase 2: Qlik-Cache-Job in Supabase.
3. **Kunden-Metadaten** (Name, Umsatz) — aktuell nicht in Supabase-DB, kommt mit ams.erp-Sync in Phase 2.
4. **Ansprechpartner** — FK-Feld existiert, aber keine UI zum Zuordnen. Kommt mit Kunden-Stammdaten-Modul.

---

## Lizenz

Internal · IMS Vertriebs GmbH & Co KG

---

## Kontakt

- **MAP** (Mathias Peinsold) — Projekt-Owner
- **MP** (Michael Peinsold) — Außendienst-Nutzer
- **EK** (Elke Ksoll) — Terminkoordination
