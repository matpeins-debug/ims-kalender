// Supabase-Auth Middleware
// Erwartet `Authorization: Bearer <access_token>` im Request-Header.
// Setzt req.user und req.supabase (mit User-Context, RLS aktiv).

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[auth] SUPABASE_URL oder SUPABASE_ANON_KEY fehlt in .env');
}

/**
 * Admin-Client (Service-Role) — umgeht RLS. Nur für Cron/Sync verwenden!
 */
function createAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * User-Client (Anon-Key + JWT) — respektiert RLS.
 */
function createUserClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
}

/**
 * Express-Middleware: prüft Bearer-Token, setzt req.user + req.supabase.
 */
async function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Kein Token' }
    });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Token ungültig' }
      });
    }
    req.user = data.user;
    req.supabase = createUserClient(token);
    next();
  } catch (err) {
    console.error('[auth] Fehler:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'AUTH_ERROR', message: err.message }
    });
  }
}

/**
 * Cron-Auth: prüft Header `x-cron-secret` gegen process.env.CRON_SECRET.
 * Vercel Cron sendet standardmäßig keinen Header — wir setzen ihn selbst nicht
 * automatisch, daher: wenn CRON_SECRET gesetzt ist, muss er matchen.
 * Außerdem akzeptieren wir Vercel's internen `x-vercel-cron`-Header.
 */
function requireCronAuth(req, res, next) {
  const vercelCron = req.headers['x-vercel-cron'];
  const secret = req.headers['x-cron-secret'];
  const expected = process.env.CRON_SECRET;

  if (vercelCron) return next();
  if (expected && secret === expected) return next();

  return res.status(401).json({
    success: false,
    data: null,
    error: { code: 'UNAUTHORIZED', message: 'Kein Cron-Zugriff' }
  });
}

module.exports = {
  requireAuth,
  requireCronAuth,
  createAdminClient,
  createUserClient
};
