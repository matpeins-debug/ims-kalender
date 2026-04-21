// Alle Kalender-Routen (termine + queries) DIREKT in einem Router
// Keine Sub-Router-Mounts (crashten in Vercels Express-Wrapper)

const express = require('express');
const { ok, fail, parseDateQuery, validateTermin } = require('./utils');

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════
// TERMINE (frueher api/kalender/termine.js)
// ═══════════════════════════════════════════════════════════════════

// GET /api/kalender/termine?von=&bis=&person=&kategorie=
router.get('/termine', async function (req, res) {
  try {
    const von = parseDateQuery(req.query.von);
    const bis = parseDateQuery(req.query.bis);

    let q = req.supabase
      .from('termine')
      .select('*, termin_teilnehmer(*)')
      .order('start_zeit', { ascending: true });

    if (von) q = q.gte('start_zeit', von);
    if (bis) q = q.lte('start_zeit', bis);
    if (req.query.kategorie) q = q.eq('kategorie', req.query.kategorie);

    const result = await q;
    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message, result.error);

    let termine = result.data || [];
    if (req.query.person) {
      const k = String(req.query.person).toLowerCase();
      termine = termine.filter(function (t) {
        return (t.termin_teilnehmer || []).some(function (p) {
          return (p.person_kuerzel || '').toLowerCase() === k;
        });
      });
    }

    return ok(res, termine);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// GET /api/kalender/termine/:id
router.get('/termine/:id', async function (req, res) {
  try {
    const result = await req.supabase
      .from('termine')
      .select('*, termin_teilnehmer(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message);
    if (!result.data) return fail(res, 404, 'NOT_FOUND', 'Termin nicht gefunden');
    return ok(res, result.data);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// POST /api/kalender/termine
router.post('/termine', async function (req, res) {
  try {
    const v = validateTermin(req.body || {}, false);
    if (!v.valid) return fail(res, 400, 'VALIDATION', v.message);

    const payload = v.value;
    payload.angelegt_von = req.user.id;
    if (!payload.besitzer) payload.besitzer = req.user.id;

    const teilnehmer = req.body.teilnehmer || null;

    const insRes = await req.supabase.from('termine').insert(payload).select('*').single();
    if (insRes.error) return fail(res, 400, 'DB_ERROR', insRes.error.message, insRes.error);
    const inserted = insRes.data;

    if (Array.isArray(teilnehmer) && teilnehmer.length > 0) {
      const rows = teilnehmer.map(function (t) {
        return {
          termin_id: inserted.id,
          person_kuerzel: t.person_kuerzel || null,
          ansprechpartner_id: t.ansprechpartner_id || null,
          zugesagt: t.zugesagt || 'pending'
        };
      });
      const ins = await req.supabase.from('termin_teilnehmer').insert(rows);
      if (ins.error) {
        return ok(res, Object.assign({}, inserted, {
          _warning: 'Teilnehmer konnten nicht gespeichert werden: ' + ins.error.message
        }));
      }
    }

    const full = await req.supabase
      .from('termine').select('*, termin_teilnehmer(*)').eq('id', inserted.id).single();
    return ok(res, full.data || inserted);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// PATCH /api/kalender/termine/:id
router.patch('/termine/:id', async function (req, res) {
  try {
    const v = validateTermin(req.body || {}, true);
    if (!v.valid) return fail(res, 400, 'VALIDATION', v.message);

    const result = await req.supabase
      .from('termine')
      .update(v.value)
      .eq('id', req.params.id)
      .select('*, termin_teilnehmer(*)')
      .maybeSingle();

    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message, result.error);
    if (!result.data) return fail(res, 404, 'NOT_FOUND', 'Termin nicht gefunden oder keine Berechtigung');
    return ok(res, result.data);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// DELETE /api/kalender/termine/:id
router.delete('/termine/:id', async function (req, res) {
  try {
    const result = await req.supabase
      .from('termine')
      .delete({ count: 'exact' })
      .eq('id', req.params.id);

    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message);
    if (!result.count) return fail(res, 404, 'NOT_FOUND', 'Termin nicht gefunden oder keine Berechtigung');
    return ok(res, { deleted: result.count });
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════
// TEILNEHMER (frueher api/kalender/teilnehmer.js)
// ═══════════════════════════════════════════════════════════════════

// POST /api/kalender/termine/:id/teilnehmer
router.post('/termine/:id/teilnehmer', async function (req, res) {
  try {
    const termin_id = req.params.id;
    const body = req.body || {};
    if (!body.person_kuerzel && !body.ansprechpartner_id) {
      return fail(res, 400, 'VALIDATION', 'person_kuerzel oder ansprechpartner_id noetig');
    }
    const result = await req.supabase
      .from('termin_teilnehmer')
      .insert({
        termin_id: termin_id,
        person_kuerzel: body.person_kuerzel || null,
        ansprechpartner_id: body.ansprechpartner_id || null,
        zugesagt: body.zugesagt || 'pending'
      })
      .select('*')
      .single();
    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message);
    return ok(res, result.data);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// PATCH /api/kalender/termine/:id/teilnehmer/:teilnehmerId
router.patch('/termine/:id/teilnehmer/:teilnehmerId', async function (req, res) {
  try {
    const updates = {};
    if (req.body.zugesagt) {
      updates.zugesagt = req.body.zugesagt;
      updates.antwort_zeit = new Date().toISOString();
    }
    const result = await req.supabase
      .from('termin_teilnehmer')
      .update(updates)
      .eq('id', req.params.teilnehmerId)
      .eq('termin_id', req.params.id)
      .select('*')
      .maybeSingle();
    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message);
    if (!result.data) return fail(res, 404, 'NOT_FOUND', 'Teilnehmer nicht gefunden');
    return ok(res, result.data);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// DELETE /api/kalender/termine/:id/teilnehmer/:teilnehmerId
router.delete('/termine/:id/teilnehmer/:teilnehmerId', async function (req, res) {
  try {
    const result = await req.supabase
      .from('termin_teilnehmer')
      .delete({ count: 'exact' })
      .eq('id', req.params.teilnehmerId)
      .eq('termin_id', req.params.id);
    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message);
    if (!result.count) return fail(res, 404, 'NOT_FOUND', 'Teilnehmer nicht gefunden');
    return ok(res, { deleted: result.count });
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════
// QUERIES (Person, Kunde, AMS, Me)
// ═══════════════════════════════════════════════════════════════════

// GET /api/kalender/person/:kuerzel?von=&bis=
router.get('/person/:kuerzel', async function (req, res) {
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

    const result = await q.order('start_zeit', { ascending: true });
    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message);
    return ok(res, result.data || []);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// GET /api/kalender/kunde/:kundenNr?von=&bis=
router.get('/kunde/:kundenNr', async function (req, res) {
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

    const result = await q.order('start_zeit', { ascending: true });
    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message);
    return ok(res, result.data || []);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// GET /api/kalender/ams/liefertermine?von=&bis=
router.get('/ams/liefertermine', async function (req, res) {
  try {
    let q = req.supabase.from('termine_ams').select('*');
    if (req.query.von) q = q.gte('liefertermin', req.query.von);
    if (req.query.bis) q = q.lte('liefertermin', req.query.bis);
    const result = await q.order('liefertermin', { ascending: true });
    if (result.error) return fail(res, 400, 'DB_ERROR', result.error.message);
    return ok(res, result.data || []);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// GET /api/kalender/me
router.get('/me', function (req, res) {
  return ok(res, {
    id: req.user.id,
    email: req.user.email,
    user_metadata: req.user.user_metadata || {}
  });
});

module.exports = router;
