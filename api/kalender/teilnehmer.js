// Teilnehmer-Endpoints (hängen an Termin)

const express = require('express');
const { ok, fail } = require('./utils');

const router = express.Router({ mergeParams: true });

// POST /api/kalender/termine/:id/teilnehmer
router.post('/', async (req, res) => {
  try {
    const termin_id = req.params.id;
    const { person_kuerzel, ansprechpartner_id, zugesagt } = req.body || {};
    if (!person_kuerzel && !ansprechpartner_id) {
      return fail(res, 400, 'VALIDATION', 'person_kuerzel oder ansprechpartner_id nötig');
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
router.patch('/:teilnehmerId', async (req, res) => {
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
router.delete('/:teilnehmerId', async (req, res) => {
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
