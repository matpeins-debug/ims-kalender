// ═══════════════════════════════════════════════════════════════
// IMS Kalender · API · Express App
// Läuft als Vercel-Serverless-Function (alle /api/* Routes)
// oder standalone (node api/index.js → Port 3000)
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const path = require('path');
const fs = require('fs');

const { requireAuth, requireCronAuth } = require('./kalender/auth');
const termineRoutes    = require('./kalender/termine');
const queriesRoutes    = require('./kalender/queries');
const cronRoutes       = require('./kalender/cron');
const { ok } = require('./kalender/utils');

const app = express();
app.use(express.json({ limit: '1mb' }));

// ── Healthcheck ────────────────────────────────────────────────
app.get('/api', (req, res) => {
  ok(res, {
    service: 'ims-kalender',
    version: '0.1.0',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  ok(res, { status: 'ok', ts: new Date().toISOString() });
});

// ── Auth-geschützt: Kalender-Routes ─────────────────────────────
// /:id/teilnehmer wird intern vom termine-Router gemounted
app.use('/api/kalender/termine', requireAuth, termineRoutes);
app.use('/api/kalender',         requireAuth, queriesRoutes);

// ── Cron (eigene Auth) ──────────────────────────────────────────
app.use('/api/cron', requireCronAuth, cronRoutes);

// ── 404 ─────────────────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { code: 'NOT_FOUND', message: 'Route nicht gefunden: ' + req.path }
  });
});

// ── Lokale Entwicklung: statische Files aus public/ ─────────────
// Auf Vercel macht das die Platform selbst, lokal brauchen wir das.
if (require.main === module) {
  const publicDir = path.resolve(__dirname, '../public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('/mobile/termin/:id', (req, res) => {
      res.sendFile(path.join(publicDir, 'kalender-mobile.html'));
    });
    app.get('/', (req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  IMS Kalender Dev Server                    │');
    console.log('│  http://localhost:' + port + '                       │');
    console.log('│  API: http://localhost:' + port + '/api              │');
    console.log('└─────────────────────────────────────────────┘');
  });
}

module.exports = app;
