// Spezial-Queries: Termine nach Person, Termine nach Kunde, ams-Liefertermine

const express = require('express');
const { ok, fail, parseDateQuery } = require('./utils');
const termineRoutes = require('./termine');

const router = express.Router();

// termine-Routes als Sub-Router unter /termine (ohne :param im Mount-Path)
router.use('/termine', termineRoutes);

// GET /api/kalender/person/:kuerzel?von=&bis=
router.get('/person/:kuerzel', async (req, res) => {
  try {
    const von = parseDateQuery(req.query.von);
    const bis = parseDateQuery(req.query.bis);
    const kuerzel = String(req.params.kuerzel).toLowerCase();

    let q = req.supabase
      .from('termine')
      .select('*, termin_teilnehmer!inner(*)')
      .ilike('termin_teilnehmer.person_kuerzel', kuerzel);

    if (von) q = q.gte('start_zeit', von);
    if (bis) q = q.lte('start_zeit', bis);

    const { data, error } = await q.order('start_zeit', { ascending: true });
    if (error) return fail(res, 400, 'DB_ERROR', error.message);
    return ok(res, data || []);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// GET /api/kalender/kunde/:kundenNr?von=&bis=
router.get('/kunde/:kundenNr', async (req, res) => {
  try {
    const von = parseDateQuery(req.query.von);
    const bis = parseDateQuery(req.query.bis);
    const kundenNr = parseInt(req.params.kundenNr, 10);
    if (isNaN(kundenNr)) return fail(res, 400, 'VALIDATION', 'kundenNr muss Zahl sein');

    let q = req.supabase
      .from('termine')
      .select('*, termin_teilnehmer(*)')
      .eq('kunde_id', kundenNr);

    if (von) q = q.gte('start_zeit', von);
    if (bis) q = q.lte('start_zeit', bis);

    const { data, error } = await q.order('start_zeit', { ascending: true });
    if (error) return fail(res, 400, 'DB_ERROR', error.message);
    return ok(res, data || []);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// GET /api/kalender/ams/liefertermine?von=&bis=
router.get('/ams/liefertermine', async (req, res) => {
  try {
    let q = req.supabase.from('termine_ams').select('*');
    if (req.query.von) q = q.gte('liefertermin', req.query.von);
    if (req.query.bis) q = q.lte('liefertermin', req.query.bis);
    const { data, error } = await q.order('liefertermin', { ascending: true });
    if (error) return fail(res, 400, 'DB_ERROR', error.message);
    return ok(res, data || []);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// GET /api/kalender/me — wer bin ich?
router.get('/me', (req, res) => {
  return ok(res, {
    id: req.user.id,
    email: req.user.email,
    user_metadata: req.user.user_metadata || {}
  });
});

module.exports = router;
