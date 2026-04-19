# Übergabe-Dokument · IMS Kalender

**Zielgruppe:** Claude Code auf neuem Rechner · MP · externer Entwickler · zukünftiges Ich
**Stand:** 19. April 2026 · nach Phase-1-Produktivgang
**Projekt läuft unter:** https://ims-kalender.vercel.app

---

## 🎯 Was ist das Projekt?

**IMS iFlow Kalender** — zentrales Kalender-Modul für die iFlow-ERP-Plattform der IMS Vertriebs GmbH & Co KG. Team-Kalender für 6 Personen (MAP, MP, EK, DT, DS, SP) mit Kundenterminverwaltung, PROFIT-NAVI-Integration (in Phase 2), Mobile-Außendienst-View, später ams.erp-Liefertermin-Sync und Auto-Briefings.

**Scope Phase 1 (aktuell live):**
Login · Wochenansicht · CRUD für Termine · Teilnehmer · Kategorien · Privat-Flag · Mobile-Detail-View.

---

## 🏢 Kontext (60 Sekunden)

- **IMS Vertriebs GmbH & Co KG** ("Die Grüne Box") — österreichischer Hersteller anschlussfertiger Sanitär-Installationsboxen, Sitz Graz, ca. 15 Mitarbeiter
- ams.erp bleibt das Haupt-ERP · iFlow ergänzt, ersetzt nicht
- Dieser Kalender ist das **erste Kommunikations-Modul** in iFlow Phase 2 (Plattform-Roadmap)
- Projekt-Owner: MAP (Mathias Peinsold, Co-Geschäftsführer)
- Zielgruppe: MP (Außendienst, iPad-intensiv), MAP (Management), EK (Terminkoordination für MP), Team

---

## 🔗 Wichtige URLs & Credentials

| Asset | URL/Wert |
|---|---|
| **Live-App** | https://ims-kalender.vercel.app |
| **GitHub-Repo** | https://github.com/matpeins-debug/ims-kalender (private) |
| **Vercel-Projekt** | `matpeins-debugs-projects/ims-kalender` |
| **Supabase-Projekt** | `elwlptapzwwqhjuxnnws` — https://supabase.com/dashboard/project/elwlptapzwwqhjuxnnws |
| **Ziel-Produktiv-Domain** | `kalender.ims-box.at` (noch nicht verknüpft) |

### Login-Accounts (alle Startpasswort `IMS-Kalender-2026!`)

| E-Mail | Rolle |
|---|---|
| `ma.peinsold@ims-box.at` | MAP · Projekt-Owner |
| `michael.peinsold@ims-box.at` | MP · Außendienst |
| `elke.ksoll@ims-box.at` | EK · Terminkoordination |
| `dominik.tritscher@ims-box.at` | DT · Auftragsabwicklung |

---

## 🛠 Tech-Stack

| Schicht | Technologie |
|---|---|
| Backend | Node.js 24 / Express 4 / serverless auf Vercel |
| DB | Supabase PostgreSQL · deutsche Feldnamen |
| Auth | Supabase Auth · Passwort-Login + Magic-Link-Fallback |
| Frontend | Vanilla HTML/CSS/JS · **kein Framework, kein Bundler** · Safari-safe |
| Deploy | Vercel (Hobby-Plan) + GitHub-Push |
| E-Mail (Phase 2) | Resend (via `office@ims-box.at`) |

### Safari-Regel — nicht verhandelbar

Alle JS-Files im `public/`-Ordner dürfen **kein ES6+** verwenden:

- **Ja:** `var`, `function(){}`, String-Concat mit `+`, klassische `for`-Loops
- **Nein:** `let`, `const`, Arrow-Functions `=>`, Template-Literals `` ` ``, Spread `...`

Safari auf iPad knallt sonst weg. Check automatisch: `npm run check:safari`.

**Backend-JS darf ES2022+** — läuft auf Node, nicht im Browser.

---

## 📁 Projekt-Struktur

```
iflowTerminkalender/
├── README.md                          Haupt-Setup-Anleitung
├── docs/
│   ├── TAGESZUSAMMENFASSUNG_*.md      Was am jeweiligen Tag gemacht wurde
│   └── UEBERGABE.md                   Dieses Dokument
├── package.json
├── vercel.json                        Headers + Rewrites (Crons entfernt · Hobby-Limit)
├── .env.example                       Dokumentierte ENV-Variablen
├── .env                               (gitignored) Lokale Keys
├── api/
│   ├── index.js                       Express-App · Entry-Point für Vercel
│   └── kalender/
│       ├── auth.js                    Supabase-JWT-Middleware
│       ├── termine.js                 CRUD /api/kalender/termine/*
│       ├── teilnehmer.js              CRUD /api/kalender/termine/:id/teilnehmer/*
│       ├── queries.js                 person/kunde/ams/me
│       ├── cron.js                    Skeleton Phase 2
│       └── utils.js                   ok()/fail()/validateTermin()
├── public/
│   ├── index.html                     Login (Passwort + Magic-Link)
│   ├── kalender.html                  Wochenansicht (aus kalender_final.html)
│   ├── kalender-mobile.html           Mobile-Detail-View
│   └── js/
│       ├── config.js                  SUPABASE_URL + ANON_KEY (öffentlich OK)
│       ├── supabase-client.js         Browser-Init
│       ├── api-client.js              Fetch-Wrapper (window.imsAPI)
│       ├── date-helpers.js            KW-Logik · mapApiToTermine()
│       └── termin-modal.js            Neu-/Bearbeiten-Modal
├── supabase/
│   ├── migrations/
│   │   ├── 001_kalender_schema.sql    Schema + Enums + RLS
│   │   └── 002_grants.sql             GRANTs für authenticated
│   └── seeds/
│       └── 001_termine_seed.sql       Dokumentiert · Seed läuft via Node-Script
└── scripts/
    ├── seed-users.js                  Legt 4 User an (idempotent)
    ├── seed-termine.js                Legt 12 Demo-Termine an
    ├── set-passwords.js               Setzt alle User-Passwörter auf Default
    ├── add-ma-user.js                 ma.peinsold Sonderfall (siehe Historie)
    ├── merge-map-users.js             Mergt alte/neue MAP-UUIDs
    ├── fix-map-email.js               Versuch, Mail zu ändern (500er)
    ├── generate-login-link.js         Magic-Link ohne Mail (über Admin-API)
    ├── test-api.sh                    cURL-Test-Suite
    ├── check-safari-safe.js           ES6-Scanner für public/
    └── dev-server.js                  Lokaler Dev-Start mit .env
```

---

## 🗄 Datenbank-Schema (Quick-Reference)

```sql
-- 7 Kategorien
CREATE TYPE termin_kategorie AS ENUM (
  'kunde', 'lieferant', 'intern', 'reise', 'deadline', 'geburtstag', 'privat'
);

-- Haupttabelle
CREATE TABLE termine (
  id UUID PK,
  titel VARCHAR(255),
  start_zeit TIMESTAMPTZ, end_zeit TIMESTAMPTZ,
  kategorie termin_kategorie,
  ist_privat BOOLEAN,
  besitzer UUID FK auth.users,
  angelegt_von UUID FK auth.users,
  kunde_id INTEGER,         -- referenz ams.erp KAVV200 (keine FK da externe Tabelle)
  ansprechpartner_id UUID,
  angebot_id UUID,
  auftrag_nr VARCHAR,
  wiederholung TEXT,        -- RRULE
  ganztaegig BOOLEAN,
  ort TEXT, video_call_url TEXT, beschreibung TEXT,
  ...
);

-- Teilnehmer
CREATE TABLE termin_teilnehmer (
  termin_id UUID FK termine,
  person_kuerzel VARCHAR(10),     -- 'map', 'mp', 'ek', 'dt', 'ds', 'sp', 'ex'
  ansprechpartner_id UUID,
  zugesagt ENUM('pending','yes','no','tentative')
);

-- Read-only Spiegel ams.erp (Phase 2)
CREATE TABLE termine_ams (
  auftragsnummer VARCHAR,
  liefertermin DATE,
  kunde_id INTEGER, kunde_name VARCHAR,
  artikelbezeichnung VARCHAR, menge NUMERIC
);
```

### RLS-Policies (wichtig!)

- **termine:** alle auth-User sehen alle Termine wo `ist_privat=false`. Eigene private Termine sehen nur `besitzer` oder `angelegt_von`.
- **termin_teilnehmer:** sichtbar wenn zugehöriger Termin sichtbar.
- **termine_ams:** alle auth-User können lesen (read-only).

Insert/Update/Delete auf termine: nur `besitzer` oder `angelegt_von`.

**Achtung:** SQL Editor im Supabase-Dashboard läuft als `postgres`-Superuser → umgeht RLS komplett. Zum Testen der Policies musst du in der App eingeloggt sein oder mit `SET ROLE authenticated; SET request.jwt.claims = ...` arbeiten.

---

## 🔌 API-Endpoints

Alle Endpoints erwarten `Authorization: Bearer <supabase-access-token>`.

```
GET    /api/health                                 (public · Healthcheck)
GET    /api/kalender/me                            ← wer bin ich?
GET    /api/kalender/termine?von=&bis=&person=&kategorie=
POST   /api/kalender/termine                       (erwartet {titel, start_zeit, end_zeit, kategorie, ...})
GET    /api/kalender/termine/:id
PATCH  /api/kalender/termine/:id                   (Partial-Update)
DELETE /api/kalender/termine/:id

POST   /api/kalender/termine/:id/teilnehmer        {person_kuerzel, zugesagt}
PATCH  /api/kalender/termine/:id/teilnehmer/:tnId
DELETE /api/kalender/termine/:id/teilnehmer/:tnId

GET    /api/kalender/person/:kuerzel?von=&bis=
GET    /api/kalender/kunde/:kundenNr?von=&bis=
GET    /api/kalender/ams/liefertermine?von=&bis=   (Phase 2)

GET    /api/cron/ams-sync                          (Skeleton · Phase 2)
GET    /api/cron/briefing-morning                  (Skeleton · Phase 2)
GET    /api/cron/briefing-followup                 (Skeleton · Phase 2)
POST   /api/cron/manual/:job                       (Admin-Trigger)
```

Response-Format überall: `{ success: true, data: ..., error: null }` oder `{ success: false, data: null, error: { code, message } }`.

---

## 🧭 Lokales Setup (neuer Rechner · ~10 min)

```bash
# 1. Voraussetzungen
#    Node.js ≥ 20 · git · optional: gh CLI, vercel CLI

# 2. Repo klonen
git clone https://github.com/matpeins-debug/ims-kalender.git
cd ims-kalender
npm install

# 3. .env erstellen
cp .env.example .env
# Dann editieren: SUPABASE_URL + beide Keys aus
# Supabase Dashboard → Project Settings → API Keys → Legacy anon + service_role

# 4. Lokal starten
npm run dev
# → http://localhost:3000

# 5. Deploy (wenn nötig)
#    Wenn GitHub → Vercel Auto-Deploy aktiv: einfach `git push`
#    Sonst: vercel --prod --yes --token <TOKEN>
```

### Wichtige Stolperfallen

1. **Git-Autor-E-Mail**: muss `matpeins@gmail.com` sein, sonst lehnt Vercel den Deploy ab:
   ```bash
   git config user.email "matpeins@gmail.com"
   git config user.name "Mathias Peinsold"
   ```
2. **Vercel CLI Auth-Bug auf Windows**: Token persistiert nicht. Lösung: bei jedem Deploy `--token <TOKEN>` mitgeben, oder PAT an https://vercel.com/account/tokens erstellen.
3. **`npm run check:safari`** vor jedem Frontend-Commit laufen lassen — sonst iPad-Breakage.
4. **Cron-Jobs nicht aktivierbar** auf Hobby-Plan (>1× pro Tag gesperrt). Für Phase 2 entweder Pro-Upgrade oder externer Scheduler.

---

## 🚨 Bekannte Offene Punkte

### Infrastruktur
1. **GitHub → Vercel Auto-Deploy nicht verknüpft.** Aktuell Deploys nur via CLI. Fix: **Vercel Dashboard → Project `ims-kalender` → Settings → Git → Connect Git Repository → GitHub → `matpeins-debug/ims-kalender`**. Nach Setup deployt jeder Push automatisch.
2. **Custom-Domain `kalender.ims-box.at`** nicht verknüpft. Braucht CNAME-Eintrag beim Domain-Hoster (Hoster-Info von MAP besorgen). Vercel-Seite: Dashboard → Domains → Add → `kalender.ims-box.at`.
3. **Vercel-Token** `vcp_4Naetruor1PITesYm8qlUVgLRO6tCknt8Yk5besnJqSKVGLvuL3D9mRE` ist noch aktiv (1 Tag Laufzeit). Nach Auto-Deploy-Setup revoken.
4. **Supabase SMTP** läuft noch auf Default-Pool → Magic-Links kommen von `noreply@mail.app.supabase.io`. Umstellen auf Resend mit `office@ims-box.at` im Supabase-Dashboard → Authentication → SMTP Settings.
5. **Doppelter User** `mathias.peinsold@ims-box.at` wurde entfernt (Merge-Script). **MAP nutzt `ma.peinsold@ims-box.at`.**

### Features (Phase 2+)
- ams.erp-Liefertermin-Sync (alle 15 min)
- Morgen-Briefing 07:00 / Abend-Follow-up 18:00 per Resend-Mail
- Live-PROFIT-NAVI aus Qlik-MCP (aktuell Demo-Daten für Schadner/Schmid/Huber)
- Mobile-Wochenansicht (fehlt noch · nur Mobile-Detail ist fertig)
- CalDAV-Endpoint für Apple-Kalender (iOS/Mac-Sync)
- M365/Outlook-Integration
- Ressourcen-Buchung (Fahrzeuge/Räume)
- Drag-&-Drop zum Verschieben von Terminen

### Design / UX
- Sidebar-Personen-Filter funktional machen (aktuell nur visuell)
- Kategorie-Filter funktional machen
- Minikalender-Grid echte Monatsdaten zeigen (aktuell hartcodiert)
- Segmented-Control (Monat/Woche/Tag/Liste) funktional machen (aktuell nur Woche)
- Command-Palette (⌘K) implementieren

---

## 🧠 Kontext für Claude Code bei Wiederaufnahme

Wenn du als Claude Code dieses Projekt wieder öffnest, dann:

1. Lies `README.md` für Grundsetup
2. Lies dieses `docs/UEBERGABE.md` für Kontext
3. Lies die aktuellste `docs/TAGESZUSAMMENFASSUNG_*.md` für den letzten Stand
4. Wenn im `~/.claude/` eine MEMORY für iFlow/IMS liegt, zieh die auch
5. Verwendete Skills: `iflow-design-system`, `iflow-arbeitsdatei`, `iflow-kalender`, `ims-platform`, `ims-brand` — wenn vorhanden, aktivieren

### Wichtige Konventionen
- **Deutsche Feldnamen** in DB, API, UI
- **Österreichisches Deutsch** in UI-Texten (`Bearbeiten` nicht `Edit`)
- **Code-Kommentare** deutsch oder englisch, aber konsistent pro Datei
- **Datumsformat UI**: `DD.MM.YYYY` + `HH:MM` (24h)
- **Auftragsnummer**: Thin-Space nach 4. Stelle (`2000 123`)
- **PROFIT-NAVI**: 142 €/h grün, 98 €/h orange, 58 €/h rot (Grenzen im Handover)

---

## 📞 Kontakt

- **MAP** (Mathias Peinsold) · `ma.peinsold@ims-box.at` · Projekt-Owner · Graz
- **MP** (Michael Peinsold) · `michael.peinsold@ims-box.at` · Außendienst · iPad-User
- **EK** (Elke Ksoll) · Terminkoordination

Bei Fragen zu Infrastruktur (Supabase/Vercel/GitHub): Mat hat alle Dashboard-Zugänge.

---

## 📝 Letzte Commits auf master

```
838c275  Trigger deploy with Vercel-matching author email
8cb6c43  Login: Passwort-Login als Primär-Option + Magic-Link als Fallback
ef5a404  vercel.json: Crons entfernen für Phase 1 (Hobby-Plan limit)
b58612f  Config: Anon-Key eingesetzt · scripts/seed-termine.js ergänzt
583cbd1  Initial scaffold · IMS Kalender Phase 1
```

---

## ✅ Definition of Done für Phase 1 (Stand heute)

- [x] MAP kann sich einloggen
- [x] MAP sieht die 12 Demo-Termine in KW 17
- [x] MAP kann Termin bearbeiten + löschen + neu anlegen
- [x] Safari-Check clean
- [x] Staging-URL erreichbar
- [ ] MP hat getestet (iPad-Safari)
- [ ] EK hat Termin für MP angelegt (Test: EK-Marker erscheint?)
- [ ] Custom-Domain verknüpft
- [ ] Auto-Deploy-Pipeline steht
- [ ] SMTP auf Resend umgestellt

**Viel Erfolg.** — _Claude · 19.04.2026_
