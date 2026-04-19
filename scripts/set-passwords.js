#!/usr/bin/env node
// Setzt Start-Passwörter für alle 4 IMS-User.
// Aufruf: node scripts/set-passwords.js
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const USERS = [
  { email: 'mathias.peinsold@ims-box.at',  pw: 'IMS-Kalender-2026!' },
  { email: 'michael.peinsold@ims-box.at',  pw: 'IMS-Kalender-2026!' },
  { email: 'elke.ksoll@ims-box.at',        pw: 'IMS-Kalender-2026!' },
  { email: 'dominik.tritscher@ims-box.at', pw: 'IMS-Kalender-2026!' }
];

(async () => {
  const { data } = await admin.auth.admin.listUsers();
  console.log('\n══════════════════════════════════════════════════');
  console.log('Passwörter setzen...');
  console.log('══════════════════════════════════════════════════\n');
  for (const u of USERS) {
    const hit = (data.users || []).find(x => x.email === u.email);
    if (!hit) { console.log('✖ ' + u.email + ' → nicht gefunden'); continue; }
    const r = await admin.auth.admin.updateUserById(hit.id, { password: u.pw });
    if (r.error) console.log('✖ ' + u.email + ' → ' + r.error.message);
    else console.log('✔ ' + u.email + '  →  PW: ' + u.pw);
  }
  console.log('\nLogin auf https://ims-kalender.vercel.app');
})();
