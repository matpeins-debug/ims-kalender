-- ═══════════════════════════════════════════════════════════════════
-- IMS Kalender · GRANTs für authenticated Role
-- Muss NACH 001_kalender_schema.sql laufen
-- ═══════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON termine              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON termin_teilnehmer    TO authenticated;
GRANT SELECT                          ON termine_ams          TO authenticated;

-- Sequences — nicht benötigt (alles UUID), aber zukunftssicher:
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verifikation
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('authenticated','anon')
  AND table_name IN ('termine','termin_teilnehmer','termine_ams')
ORDER BY table_name, grantee, privilege_type;
