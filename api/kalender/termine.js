// CRUD für termine (+ eingebettete teilnehmer in GET)

const express = require('express');
const { ok, fail, parseDateQuery, validateTermin } = require('./utils');

const router = express.Router();

// Teilnehmer-Operationen werden unten direkt als einzelne Routes registriert
// (Sub-Router mit :id-Param war path-to-regexp-anfaellig).

// ── GET /api/kalender/termine?von=&bis=&person=&kategorie= ──────────
router.get('/', async (req, res) => {
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

    const { data, error } = await q;
    if (error) return fail(res, 400, 'DB_ERROR', error.message, error);

    let termine = data || [];
    if (req.query.person) {
      const k = String(req.query.person).toLowerCase();
      termine = termine.filter(t =>
        (t.termin_teilnehmer || []).some(p => (p.person_kuerzel || '').toLowerCase() === k)
      );
    }

    return ok(res, termine);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// ── GET /api/kalender/termine/:id ──────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('termine')
      .select('*, termin_teilnehmer(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) return fail(res, 400, 'DB_ERROR', error.message);
    if (!data)  return fail(res, 404, 'NOT_FOUND', 'Termin nicht gefunden');
    return ok(res, data);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// ── POST /api/kalender/termine ─────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const v = validateTermin(req.body || {}, false);
    if (!v.valid) return fail(res, 400, 'VALIDATION', v.message);

    const payload = v.value;
    payload.angelegt_von = req.user.id;
    if (!payload.besitzer) payload.besitzer = req.user.id;

    const teilnehmer = req.body.teilnehmer || null;

    const { data: inserted, error } = await req.supabase
      .from('termine')
      .insert(payload)
      .select('*')
      .single();

    if (error) return fail(res, 400, 'DB_ERROR', error.message, error);

    if (Array.isArray(teilnehmer) && teilnehmer.length > 0) {
      const rows = teilnehmer.map(t => ({
        termin_id: inserted.id,
        person_kuerzel: t.person_kuerzel || null,
        ansprechpartner_id: t.ansprechpartner_id || null,
        zugesagt: t.zugesagt || 'pending'
      }));
      const ins = await req.supabase.from('termin_teilnehmer').insert(rows);
      if (ins.error) {
        // Soft-Fail: Termin ist da, Teilnehmer nicht — in der Response markieren
        return ok(res, {
          ...inserted,
          _warning: 'Teilnehmer konnten nicht gespeichert werden: ' + ins.error.message
        });
      }
    }

    const { data: full } = await req.supabase
      .from('termine').select('*, termin_teilnehmer(*)').eq('id', inserted.id).single();

    return ok(res, full || inserted);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// ── PATCH /api/kalender/termine/:id ────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const v = validateTermin(req.body || {}, true);
    if (!v.valid) return fail(res, 400, 'VALIDATION', v.message);

    const { data, error } = await req.supabase
      .from('termine')
      .update(v.value)
      .eq('id', req.params.id)
      .select('*, termin_teilnehmer(*)')
      .maybeSingle();

    if (error) return fail(res, 400, 'DB_ERROR', error.message, error);
    if (!data)  return fail(res, 404, 'NOT_FOUND', 'Termin nicht gefunden oder keine Berechtigung');
    return ok(res, data);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// ── DELETE /api/kalender/termine/:id ───────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { error, count } = await req.supabase
      .from('termine')
      .delete({ count: 'exact' })
      .eq('id', req.params.id);

    if (error) return fail(res, 400, 'DB_ERROR', error.message);
    if (!count) return fail(res, 404, 'NOT_FOUND', 'Termin nicht gefunden oder keine Berechtigung');
    return ok(res, { deleted: count });
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// ── Teilnehmer-Operationen (frueher Sub-Router, jetzt inline) ──

// POST /api/kalender/termine/:id/teilnehmer
router.post('/:id/teilnehmer', async (req, res) => {
  try {
    const termin_id = req.params.id;
    const { person_kuerzel, ansprechpartner_id, zugesagt } = req.body || {};
    if (!person_kuerzel && !ansprechpartner_id) {
      return fail(res, 400, 'VALIDATION', 'person_kuerzel oder ansprechpartner_id noetig');
    }
    const { data, error } = await req.supabase
      .from('termin_teilnehmer')
      .insert({
        termin_id,
        person_kuerzel: person_kuerzel || null,
        ansprechpartner_id: ansprechpartner_id || null,
        zugesagt: zugesagt || 'pending'
      })
      .select('*')
      .single();
    if (error) return fail(res, 400, 'DB_ERROR', error.message);
    return ok(res, data);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// PATCH /api/kalender/termine/:id/teilnehmer/:teilnehmerId
router.patch('/:id/teilnehmer/:teilnehmerId', async (req, res) => {
  try {
    const updates = {};
    if (req.body.zugesagt) updates.zugesagt = req.body.zugesagt;
    if (req.body.zugesagt) updates.antwort_zeit = new Date().toISOString();

    const { data, error } = await req.supabase
      .from('termin_teilnehmer')
      .update(updates)
      .eq('id', req.params.teilnehmerId)
      .eq('termin_id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) return fail(res, 400, 'DB_ERROR', error.message);
    if (!data)  return fail(res, 404, 'NOT_FOUND', 'Teilnehmer nicht gefunden');
    return ok(res, data);
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

// DELETE /api/kalender/termine/:id/teilnehmer/:teilnehmerId
router.delete('/:id/teilnehmer/:teilnehmerId', async (req, res) => {
  try {
    const { error, count } = await req.supabase
      .from('termin_teilnehmer')
      .delete({ count: 'exact' })
      .eq('id', req.params.teilnehmerId)
      .eq('termin_id', req.params.id);
    if (error) return fail(res, 400, 'DB_ERROR', error.message);
    if (!count) return fail(res, 404, 'NOT_FOUND', 'Teilnehmer nicht gefunden');
    return ok(res, { deleted: count });
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
});

module.exports = router;
