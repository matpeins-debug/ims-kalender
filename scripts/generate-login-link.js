#!/usr/bin/env node
// Generiert einen Magic-Link via Admin-API — ohne E-Mail-Versand.
// Aufruf: node scripts/generate-login-link.js <email> [<redirectUrl>]
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const email = process.argv[2] || 'mathias.peinsold@ims-box.at';
const redirectTo = process.argv[3] || 'https://ims-kalender.vercel.app/kalender.html';

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo }
  });
  if (error) { console.error('Fehler:', error.message); process.exit(1); }

  const link = data?.properties?.action_link || data?.action_link;
  const token = data?.properties?.hashed_token;

  console.log('\n══════════════════════════════════════════════════');
  console.log('MAGIC-LINK FÜR:  ' + email);
  console.log('══════════════════════════════════════════════════');
  console.log('\n' + link);
  console.log('\n══════════════════════════════════════════════════');
  console.log('Gültig: 1 Stunde · 1× nutzbar');
  console.log('Einfach oben den Link kopieren & im Browser öffnen.');
})();
