-- ═══════════════════════════════════════════════════════════════════
-- IMS Kalender · Seed-Daten · KW 17/2026 (Mo 20.04 – Fr 24.04.2026)
-- Übernimmt die 11 Beispiel-Termine aus kalender_final.html
-- ═══════════════════════════════════════════════════════════════════
--
-- VORAUSSETZUNG: diese 4 User existieren in auth.users
--   • mathias.peinsold@ims-box.at      (MAP)
--   • michael.peinsold@ims-box.at      (MP)
--   • elke.ksoll@ims-box.at            (EK)
--   • dominik.tritscher@ims-box.at     (DT)
--
-- Falls eine Adresse anders ist: hier unten in der CTE anpassen.
-- Läuft als postgres-Superuser im SQL Editor → RLS wird übergangen.
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  u_map UUID;
  u_mp  UUID;
  u_ek  UUID;
  u_dt  UUID;
  t_id  UUID;
BEGIN
  -- ── User-UUIDs holen ────────────────────────────────────────────
  SELECT id INTO u_map FROM auth.users WHERE email = 'mathias.peinsold@ims-box.at';
  SELECT id INTO u_mp  FROM auth.users WHERE email = 'michael.peinsold@ims-box.at';
  SELECT id INTO u_ek  FROM auth.users WHERE email = 'elke.ksoll@ims-box.at';
  SELECT id INTO u_dt  FROM auth.users WHERE email = 'dominik.tritscher@ims-box.at';

  IF u_map IS NULL OR u_mp IS NULL OR u_ek IS NULL OR u_dt IS NULL THEN
    RAISE EXCEPTION 'Mindestens ein User fehlt in auth.users. Angelegte User: MAP=%, MP=%, EK=%, DT=%',
      u_map IS NOT NULL, u_mp IS NOT NULL, u_ek IS NOT NULL, u_dt IS NOT NULL;
  END IF;

  -- ── Alte Seed-Daten weg (idempotent) ────────────────────────────
  DELETE FROM termine WHERE titel IN (
    'Wochenausblick · Team-Kickoff',
    'Kunde Schadner',
    'Privat',
    'Lieferant Tisma · Jahresgespräch',
    'Kunde Schmid · Angebotsklärung',
    'LSI Gala',
    'Tagescheck',
    'Michael · Geburtstag',
    'Elke · Urlaub',
    'Produktionsmeeting · Engpass ZB',
    'Kunde Huber · Anfrage Wohnbau',
    'Deadline Ortner · Angebot abgeben'
  );

  -- ── Mo 20.04.2026 ───────────────────────────────────────────────

  -- 1. Wochenausblick · Team-Kickoff (09:00–09:30, intern, wiederholend)
  INSERT INTO termine (titel, start_zeit, end_zeit, kategorie, ort,
                       besitzer, angelegt_von, wiederholung)
  VALUES ('Wochenausblick · Team-Kickoff',
          '2026-04-20 09:00:00+02', '2026-04-20 09:30:00+02',
          'intern', 'Besprechungsraum',
          u_map, u_map, 'FREQ=WEEKLY;BYDAY=MO')
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'map', 'yes'), (t_id, 'mp', 'yes'), (t_id, 'ek', 'pending');

  -- 2. Kunde Schadner (10:30–12:00, EK für MP angelegt)
  INSERT INTO termine (titel, beschreibung, start_zeit, end_zeit, kategorie, ort,
                       besitzer, angelegt_von, kunde_id)
  VALUES ('Kunde Schadner', 'Baustelle Pinkafeld · Aufmaß + Rücksprache',
          '2026-04-20 10:30:00+02', '2026-04-20 12:00:00+02',
          'kunde', 'Hauptstraße 45, 7423 Pinkafeld',
          u_mp, u_ek, 100423)
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'mp', 'yes'), (t_id, 'ex', 'yes');

  -- 3. Privat (MAP, 14:00–15:00)
  INSERT INTO termine (titel, start_zeit, end_zeit, kategorie,
                       besitzer, angelegt_von, ist_privat)
  VALUES ('Privat',
          '2026-04-20 14:00:00+02', '2026-04-20 15:00:00+02',
          'privat', u_map, u_map, TRUE)
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'map', 'yes');

  -- 4. Lieferant Tisma · Jahresgespräch (16:00–17:00)
  INSERT INTO termine (titel, start_zeit, end_zeit, kategorie, ort,
                       besitzer, angelegt_von)
  VALUES ('Lieferant Tisma · Jahresgespräch',
          '2026-04-20 16:00:00+02', '2026-04-20 17:00:00+02',
          'lieferant', 'IMS Besprechungsraum',
          u_map, u_map)
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'map', 'yes'), (t_id, 'ex', 'yes');

  -- ── Di 21.04.2026 ───────────────────────────────────────────────

  -- 5. Kunde Schmid · Angebotsklärung (09:00–10:30, Video-Call)
  INSERT INTO termine (titel, start_zeit, end_zeit, kategorie, ort,
                       video_call_url, besitzer, angelegt_von, kunde_id)
  VALUES ('Kunde Schmid · Angebotsklärung',
          '2026-04-21 09:00:00+02', '2026-04-21 10:30:00+02',
          'kunde', 'Video-Call',
          'https://teams.microsoft.com/placeholder',
          u_map, u_map, 100612)
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'map', 'yes'), (t_id, 'ex', 'pending');

  -- 6. LSI Gala (17:00–22:00, EK-Marker, Reise)
  INSERT INTO termine (titel, beschreibung, start_zeit, end_zeit, kategorie, ort,
                       besitzer, angelegt_von)
  VALUES ('LSI Gala', 'Palais Coburg Wien',
          '2026-04-21 17:00:00+02', '2026-04-21 22:00:00+02',
          'reise', 'Coburgbastei 4, 1010 Wien',
          u_mp, u_ek)
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'mp', 'yes');

  -- 7. Tagescheck (18:00–18:15, wiederholend Di–Fr)
  INSERT INTO termine (titel, start_zeit, end_zeit, kategorie,
                       besitzer, angelegt_von, wiederholung)
  VALUES ('Tagescheck',
          '2026-04-21 18:00:00+02', '2026-04-21 18:15:00+02',
          'intern', u_map, u_map, 'FREQ=WEEKLY;BYDAY=TU,WE,TH,FR')
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'map', 'yes');

  -- ── Mi 22.04.2026 ───────────────────────────────────────────────

  -- 8. Michael · Geburtstag (ganztägig)
  INSERT INTO termine (titel, start_zeit, end_zeit, ganztaegig, kategorie,
                       besitzer, angelegt_von, wiederholung)
  VALUES ('Michael · Geburtstag',
          '2026-04-22 00:00:00+02', '2026-04-23 00:00:00+02', TRUE,
          'geburtstag', u_map, u_map, 'FREQ=YEARLY')
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'map', 'yes'), (t_id, 'mp', 'yes'), (t_id, 'ek', 'yes');

  -- 9. Elke · Urlaub (ganztägig)
  INSERT INTO termine (titel, start_zeit, end_zeit, ganztaegig, kategorie,
                       besitzer, angelegt_von)
  VALUES ('Elke · Urlaub',
          '2026-04-22 00:00:00+02', '2026-04-23 00:00:00+02', TRUE,
          'reise', u_ek, u_ek)
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'ek', 'yes');

  -- ── Do 23.04.2026 ───────────────────────────────────────────────

  -- 10. Produktionsmeeting · Engpass ZB (09:00–11:00)
  INSERT INTO termine (titel, start_zeit, end_zeit, kategorie, ort,
                       besitzer, angelegt_von)
  VALUES ('Produktionsmeeting · Engpass ZB',
          '2026-04-23 09:00:00+02', '2026-04-23 11:00:00+02',
          'intern', 'Produktionshalle',
          u_map, u_map)
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'map', 'yes'), (t_id, 'mp', 'yes');

  -- 11. Kunde Huber · Anfrage Wohnbau (14:00–15:30, Video-Call)
  INSERT INTO termine (titel, start_zeit, end_zeit, kategorie, ort,
                       video_call_url, besitzer, angelegt_von, kunde_id)
  VALUES ('Kunde Huber · Anfrage Wohnbau',
          '2026-04-23 14:00:00+02', '2026-04-23 15:30:00+02',
          'kunde', 'Video-Call',
          'https://teams.microsoft.com/placeholder',
          u_map, u_map, 100892)
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'map', 'yes'), (t_id, 'ex', 'no');

  -- ── Fr 24.04.2026 ───────────────────────────────────────────────

  -- 12. Deadline Ortner · Angebot abgeben (17:00–17:30)
  INSERT INTO termine (titel, start_zeit, end_zeit, kategorie,
                       besitzer, angelegt_von)
  VALUES ('Deadline Ortner · Angebot abgeben',
          '2026-04-24 17:00:00+02', '2026-04-24 17:30:00+02',
          'deadline', u_map, u_map)
  RETURNING id INTO t_id;
  INSERT INTO termin_teilnehmer (termin_id, person_kuerzel, zugesagt) VALUES
    (t_id, 'map', 'yes');

  RAISE NOTICE 'Seed abgeschlossen: 11 Termine für KW 17/2026 angelegt';
END $$;

-- Verifikation
SELECT titel, start_zeit::date AS tag, start_zeit::time AS start, kategorie
FROM termine
ORDER BY start_zeit;
