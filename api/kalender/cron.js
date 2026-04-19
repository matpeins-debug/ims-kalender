// Cron-Endpoints (Phase 2 · Skeleton)
// Werden von Vercel Cron aufgerufen — siehe vercel.json

const express = require('express');
const { ok, fail } = require('./utils');
const { createAdminClient } = require('./auth');

const router = express.Router();

// ── GET /api/cron/ams-sync ──────────────────────────────────────
// Vercel Cron: */15 * * * *
// Liest KAVD850 aus ams.erp, upsertet in termine_ams
router.get('/ams-sync', async (req, res) => {
  // TODO Phase 2: SQL-Connection zu ams.erp aufbauen, Rows lesen, upsert
  // Derzeit: No-op mit Hinweis
  return ok(res, {
    status: 'not_implemented',
    message: 'ams-sync in Phase 2 — siehe README',
    timestamp: new Date().toISOString()
  });
});

// ── GET /api/cron/briefing-morning ──────────────────────────────
// Vercel Cron: 0 5 * * 1-5 (UTC) = 07:00 CEST
router.get('/briefing-morning', async (req, res) => {
  // TODO Phase 2: heute stattfindende Kundentermine holen, E-Mail via Resend
  return ok(res, {
    status: 'not_implemented',
    message: 'briefing-morning in Phase 2 — siehe README',
    timestamp: new Date().toISOString()
  });
});

// ── GET /api/cron/briefing-followup ─────────────────────────────
// Vercel Cron: 0 16 * * 1-5 (UTC) = 18:00 CEST
router.get('/briefing-followup', async (req, res) => {
  return ok(res, {
    status: 'not_implemented',
    message: 'briefing-followup in Phase 2 — siehe README',
    timestamp: new Date().toISOString()
  });
});

// ── Manual-Trigger (Admin, Service-Role) ────────────────────────
// POST /api/cron/manual/:job — z.B. zum Testen
router.post('/manual/:job', async (req, res) => {
  const job = req.params.job;
  const map = {
    'ams-sync': '/ams-sync',
    'briefing-morning': '/briefing-morning',
    'briefing-followup': '/briefing-followup'
  };
  if (!map[job]) return fail(res, 404, 'UNKNOWN_JOB', 'Unbekannter Cron-Job: ' + job);
  return ok(res, {
    status: 'queued',
    job,
    message: 'Phase-2-Implementierung folgt. Siehe README.'
  });
});

module.exports = router;
