#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// Legt die 4 IMS-User über die Supabase Admin-API an.
// Nutzt den Service-Role-Key — NIEMALS ins Frontend!
// Aufruf: node scripts/seed-users.js
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error('❌ SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in .env');
  process.exit(1);
}

const admin = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USERS = [
  { email: 'mathias.peinsold@ims-box.at',   kuerzel: 'MAP', name: 'Mathias Peinsold' },
  { email: 'michael.peinsold@ims-box.at',   kuerzel: 'MP',  name: 'Michael Peinsold' },
  { email: 'elke.ksoll@ims-box.at',         kuerzel: 'EK',  name: 'Elke Ksoll' },
  { email: 'dominik.tritscher@ims-box.at',  kuerzel: 'DT',  name: 'Dominik Tritscher' }
];

async function run() {
  console.log('→ Lege ' + USERS.length + ' IMS-User an...\n');
  for (const u of USERS) {
    // Existiert schon?
    const { data: existing } = await admin.auth.admin.listUsers();
    const hit = (existing && existing.users || []).find(x => x.email === u.email);
    if (hit) {
      console.log('✔ ' + u.email + ' existiert bereits (id: ' + hit.id + ')');
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      email_confirm: true,
      user_metadata: { kuerzel: u.kuerzel, name: u.name }
    });
    if (error) {
      console.error('✖ ' + u.email + ': ' + error.message);
    } else {
      console.log('✔ ' + u.email + ' angelegt (id: ' + data.user.id + ')');
    }
  }
  console.log('\nNächster Schritt: Supabase-Seed ausführen —');
  console.log('  Supabase Dashboard → SQL Editor → supabase/seeds/001_termine_seed.sql hochladen + ausführen');
}

run().catch(err => { console.error(err); process.exit(1); });
