-- ═══════════════════════════════════════════════════════════════════
-- IMS Kalender · Schema v1.0
-- Für Supabase PostgreSQL · Stand 19.04.2026
-- Feldnamen: deutsch (IMS-Konvention)
-- ═══════════════════════════════════════════════════════════════════

-- ── EXTENSIONS ────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── ENUMS ─────────────────────────────────────────────────────────

CREATE TYPE termin_kategorie AS ENUM (
  'kunde', 'lieferant', 'intern', 'reise',
  'deadline', 'geburtstag', 'privat'
);

CREATE TYPE termin_status AS ENUM (
  'entwurf', 'bestaetigt', 'abgesagt', 'erledigt'
);

CREATE TYPE teilnehmer_status AS ENUM (
  'pending', 'yes', 'no', 'tentative'
);


-- ── TABELLE: termine ──────────────────────────────────────────────

CREATE TABLE termine (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titel                 VARCHAR(255)        NOT NULL,
  beschreibung          TEXT,
  start_zeit            TIMESTAMPTZ         NOT NULL,
  end_zeit              TIMESTAMPTZ         NOT NULL,
  ganztaegig            BOOLEAN             NOT NULL DEFAULT FALSE,
  ort                   TEXT,
  video_call_url        TEXT,
  kategorie             termin_kategorie    NOT NULL,
  ist_privat            BOOLEAN             NOT NULL DEFAULT FALSE,
  besitzer              UUID                NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  angelegt_von          UUID                NOT NULL REFERENCES auth.users(id),
  kunde_id              INTEGER,
  ansprechpartner_id    UUID,
  angebot_id            UUID,
  auftrag_nr            VARCHAR(20),
  wiederholung          TEXT,
  wiederholung_bis      DATE,
  erinnerung_min        INTEGER             DEFAULT 15,
  status                termin_status       NOT NULL DEFAULT 'bestaetigt',
  external_calendar_id  VARCHAR(255),
  erstellt_am           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  aktualisiert_am       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  CONSTRAINT end_nach_start CHECK (end_zeit > start_zeit)
);

CREATE INDEX idx_termine_start       ON termine(start_zeit);
CREATE INDEX idx_termine_besitzer    ON termine(besitzer);
CREATE INDEX idx_termine_kunde       ON termine(kunde_id)   WHERE kunde_id IS NOT NULL;
CREATE INDEX idx_termine_angebot     ON termine(angebot_id) WHERE angebot_id IS NOT NULL;
CREATE INDEX idx_termine_kategorie   ON termine(kategorie);
CREATE INDEX idx_termine_range       ON termine USING GIST (tstzrange(start_zeit, end_zeit));


-- ── TABELLE: termin_teilnehmer ────────────────────────────────────

CREATE TABLE termin_teilnehmer (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  termin_id           UUID NOT NULL REFERENCES termine(id) ON DELETE CASCADE,
  person_kuerzel      VARCHAR(10),
  ansprechpartner_id  UUID,
  zugesagt            teilnehmer_status NOT NULL DEFAULT 'pending',
  antwort_zeit        TIMESTAMPTZ,
  UNIQUE (termin_id, person_kuerzel, ansprechpartner_id)
);

CREATE INDEX idx_teilnehmer_termin ON termin_teilnehmer(termin_id);
CREATE INDEX idx_teilnehmer_person ON termin_teilnehmer(person_kuerzel);


-- ── TABELLE: termine_ams (Read-Only Spiegel von ams.erp KAVD850) ──

CREATE TABLE termine_ams (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auftragsnummer      VARCHAR(20)  NOT NULL,
  position            INTEGER,
  kunde_id            INTEGER      NOT NULL,
  kunde_name          VARCHAR(255),
  liefertermin        DATE         NOT NULL,
  artikelbezeichnung  VARCHAR(500),
  menge               NUMERIC,
  synced_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (auftragsnummer, position)
);

CREATE INDEX idx_termine_ams_datum ON termine_ams(liefertermin);
CREATE INDEX idx_termine_ams_kunde ON termine_ams(kunde_id);


-- ── TRIGGER: aktualisiert_am automatisch setzen ──────────────────

CREATE OR REPLACE FUNCTION update_aktualisiert_am()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aktualisiert_am = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER termine_aktualisiert_am
  BEFORE UPDATE ON termine
  FOR EACH ROW
  EXECUTE FUNCTION update_aktualisiert_am();


-- ── ROW-LEVEL SECURITY ───────────────────────────────────────────

ALTER TABLE termine              ENABLE ROW LEVEL SECURITY;
ALTER TABLE termin_teilnehmer    ENABLE ROW LEVEL SECURITY;
ALTER TABLE termine_ams          ENABLE ROW LEVEL SECURITY;


-- Policies: termine
CREATE POLICY termine_select ON termine FOR SELECT
  USING (
    ist_privat = FALSE
    OR besitzer = auth.uid()
    OR angelegt_von = auth.uid()
  );

CREATE POLICY termine_insert ON termine FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY termine_update ON termine FOR UPDATE
  USING (besitzer = auth.uid() OR angelegt_von = auth.uid())
  WITH CHECK (besitzer = auth.uid() OR angelegt_von = auth.uid());

CREATE POLICY termine_delete ON termine FOR DELETE
  USING (besitzer = auth.uid() OR angelegt_von = auth.uid());


-- Policies: termin_teilnehmer
CREATE POLICY teilnehmer_select ON termin_teilnehmer FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM termine t
      WHERE t.id = termin_teilnehmer.termin_id
        AND (t.ist_privat = FALSE
             OR t.besitzer = auth.uid()
             OR t.angelegt_von = auth.uid())
    )
  );

CREATE POLICY teilnehmer_insert ON termin_teilnehmer FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM termine t
      WHERE t.id = termin_teilnehmer.termin_id
        AND (t.besitzer = auth.uid() OR t.angelegt_von = auth.uid())
    )
  );

CREATE POLICY teilnehmer_update ON termin_teilnehmer FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM termine t
      WHERE t.id = termin_teilnehmer.termin_id
        AND (t.besitzer = auth.uid() OR t.angelegt_von = auth.uid())
    )
  );

CREATE POLICY teilnehmer_delete ON termin_teilnehmer FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM termine t
      WHERE t.id = termin_teilnehmer.termin_id
        AND (t.besitzer = auth.uid() OR t.angelegt_von = auth.uid())
    )
  );


-- Policies: termine_ams
CREATE POLICY ams_select ON termine_ams FOR SELECT
  USING (auth.role() = 'authenticated');
