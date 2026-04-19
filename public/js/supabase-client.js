/* ═══════════════════════════════════════════════════════════════
   IMS Kalender · Supabase-Client im Browser
   Safari-safe · nur var / function / String-Concat · kein import
   Erwartet window.IMS_CONFIG aus /js/config.js (ENV-Spiegel)
   ═══════════════════════════════════════════════════════════════ */

(function() {
  var cfg = window.IMS_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    console.error('[IMS] SUPABASE_URL oder SUPABASE_ANON_KEY fehlt in /js/config.js');
    return;
  }
  // window.supabase kommt vom CDN-Script in index.html / kalender.html
  if (!window.supabase || !window.supabase.createClient) {
    console.error('[IMS] Supabase-CDN nicht geladen');
    return;
  }
  window.imsSupabase = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'ims-kalender-auth'
      }
    }
  );
})();
