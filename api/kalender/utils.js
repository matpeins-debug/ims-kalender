// Gemeinsame Helfer für API-Routes

function ok(res, data) {
  return res.json({ success: true, data, error: null });
}

function fail(res, status, code, message, details) {
  return res.status(status).json({
    success: false,
    data: null,
    error: { code, message, details: details || null }
  });
}

function parseDateQuery(str) {
  if (!str) return null;
  // Akzeptiert YYYY-MM-DD oder volles ISO
  const d = new Date(str.length === 10 ? str + 'T00:00:00+02:00' : str);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Validiert Felder eines Termin-Insert/Update.
 * Gibt { valid: true, value } oder { valid: false, message } zurück.
 */
function validateTermin(body, isUpdate) {
  const out = {};
  const allowed = [
    'titel', 'beschreibung', 'start_zeit', 'end_zeit', 'ganztaegig', 'ort',
    'video_call_url', 'kategorie', 'ist_privat', 'besitzer', 'kunde_id',
    'ansprechpartner_id', 'angebot_id', 'auftrag_nr', 'wiederholung',
    'wiederholung_bis', 'erinnerung_min', 'status'
  ];
  for (const k of allowed) {
    if (body[k] !== undefined) out[k] = body[k];
  }

  if (!isUpdate) {
    if (!out.titel || typeof out.titel !== 'string' || out.titel.length === 0) {
      return { valid: false, message: 'titel ist Pflicht' };
    }
    if (!out.start_zeit) return { valid: false, message: 'start_zeit ist Pflicht' };
    if (!out.end_zeit)   return { valid: false, message: 'end_zeit ist Pflicht' };
    if (!out.kategorie)  return { valid: false, message: 'kategorie ist Pflicht' };
  }

  const katsOk = ['kunde','lieferant','intern','reise','deadline','geburtstag','privat'];
  if (out.kategorie && katsOk.indexOf(out.kategorie) === -1) {
    return { valid: false, message: 'kategorie ungültig' };
  }
  const statOk = ['entwurf','bestaetigt','abgesagt','erledigt'];
  if (out.status && statOk.indexOf(out.status) === -1) {
    return { valid: false, message: 'status ungültig' };
  }

  if (out.start_zeit && out.end_zeit) {
    const s = new Date(out.start_zeit).getTime();
    const e = new Date(out.end_zeit).getTime();
    if (!(e > s)) return { valid: false, message: 'end_zeit muss nach start_zeit liegen' };
  }

  return { valid: true, value: out };
}

module.exports = { ok, fail, parseDateQuery, validateTermin };
