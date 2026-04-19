#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// Seed: 11 Demo-Termine für KW 17/2026
// Benutzt Service-Role-Key → umgeht RLS
// Aufruf: node scripts/seed-termine.js
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('❌ env fehlt'); process.exit(1); }

const admin = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function userId(email) {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  const u = (data.users || []).find(x => x.email === email);
  if (!u) throw new Error('User nicht gefunden: ' + email);
  return u.id;
}

async function run() {
  console.log('→ User-IDs holen...');
  const MAP = await userId('mathias.peinsold@ims-box.at');
  const MP  = await userId('michael.peinsold@ims-box.at');
  const EK  = await userId('elke.ksoll@ims-box.at');
  const DT  = await userId('dominik.tritscher@ims-box.at');
  console.log('  MAP: ' + MAP);
  console.log('  MP : ' + MP);
  console.log('  EK : ' + EK);
  console.log('  DT : ' + DT);

  const seed = [
    // id-less termine — DB generiert UUID
    { t: 'Wochenausblick · Team-Kickoff', s: '2026-04-20T09:00:00+02:00', e: '2026-04-20T09:30:00+02:00',
      kat: 'intern', ort: 'Besprechungsraum', bz: MAP, av: MAP, rr: 'FREQ=WEEKLY;BYDAY=MO',
      tn: [['map','yes'],['mp','yes'],['ek','pending']] },

    { t: 'Kunde Schadner', s: '2026-04-20T10:30:00+02:00', e: '2026-04-20T12:00:00+02:00',
      kat: 'kunde', ort: 'Hauptstraße 45, 7423 Pinkafeld', bz: MP, av: EK, kid: 100423,
      be: 'Baustelle Pinkafeld · Aufmaß + Rücksprache',
      tn: [['mp','yes'],['ex','yes']] },

    { t: 'Privat', s: '2026-04-20T14:00:00+02:00', e: '2026-04-20T15:00:00+02:00',
      kat: 'privat', bz: MAP, av: MAP, priv: true,
      tn: [['map','yes']] },

    { t: 'Lieferant Tisma · Jahresgespräch', s: '2026-04-20T16:00:00+02:00', e: '2026-04-20T17:00:00+02:00',
      kat: 'lieferant', ort: 'IMS Besprechungsraum', bz: MAP, av: MAP,
      tn: [['map','yes'],['ex','yes']] },

    { t: 'Kunde Schmid · Angebotsklärung', s: '2026-04-21T09:00:00+02:00', e: '2026-04-21T10:30:00+02:00',
      kat: 'kunde', ort: 'Video-Call', video: 'https://teams.microsoft.com/placeholder', bz: MAP, av: MAP, kid: 100612,
      tn: [['map','yes'],['ex','pending']] },

    { t: 'LSI Gala', s: '2026-04-21T17:00:00+02:00', e: '2026-04-21T22:00:00+02:00',
      kat: 'reise', ort: 'Coburgbastei 4, 1010 Wien', bz: MP, av: EK,
      be: 'Palais Coburg Wien',
      tn: [['mp','yes']] },

    { t: 'Tagescheck', s: '2026-04-21T18:00:00+02:00', e: '2026-04-21T18:15:00+02:00',
      kat: 'intern', bz: MAP, av: MAP, rr: 'FREQ=WEEKLY;BYDAY=TU,WE,TH,FR',
      tn: [['map','yes']] },

    { t: 'Michael · Geburtstag', s: '2026-04-22T00:00:00+02:00', e: '2026-04-23T00:00:00+02:00',
      kat: 'geburtstag', bz: MAP, av: MAP, gt: true, rr: 'FREQ=YEARLY',
      tn: [['map','yes'],['mp','yes'],['ek','yes']] },

    { t: 'Elke · Urlaub', s: '2026-04-22T00:00:00+02:00', e: '2026-04-23T00:00:00+02:00',
      kat: 'reise', bz: EK, av: EK, gt: true,
      tn: [['ek','yes']] },

    { t: 'Produktionsmeeting · Engpass ZB', s: '2026-04-23T09:00:00+02:00', e: '2026-04-23T11:00:00+02:00',
      kat: 'intern', ort: 'Produktionshalle', bz: MAP, av: MAP,
      tn: [['map','yes'],['mp','yes']] },

    { t: 'Kunde Huber · Anfrage Wohnbau', s: '2026-04-23T14:00:00+02:00', e: '2026-04-23T15:30:00+02:00',
      kat: 'kunde', ort: 'Video-Call', video: 'https://teams.microsoft.com/placeholder', bz: MAP, av: MAP, kid: 100892,
      tn: [['map','yes'],['ex','no']] },

    { t: 'Deadline Ortner · Angebot abgeben', s: '2026-04-24T17:00:00+02:00', e: '2026-04-24T17:30:00+02:00',
      kat: 'deadline', bz: MAP, av: MAP,
      tn: [['map','yes']] }
  ];

  console.log('\n→ Alte Seed-Termine löschen (idempotent)...');
  const titels = seed.map(x => x.t);
  await admin.from('termine').delete().in('titel', titels);

  console.log('→ ' + seed.length + ' Termine anlegen...');
  for (const x of seed) {
    const row = {
      titel: x.t, start_zeit: x.s, end_zeit: x.e,
      kategorie: x.kat, besitzer: x.bz, angelegt_von: x.av
    };
    if (x.ort)   row.ort = x.ort;
    if (x.be)    row.beschreibung = x.be;
    if (x.kid)   row.kunde_id = x.kid;
    if (x.video) row.video_call_url = x.video;
    if (x.rr)    row.wiederholung = x.rr;
    if (x.priv)  row.ist_privat = true;
    if (x.gt)    row.ganztaegig = true;

    const { data, error } = await admin.from('termine').insert(row).select('id').single();
    if (error) {
      console.error('  ✖ ' + x.t + ': ' + error.message);
      continue;
    }
    const tid = data.id;
    console.log('  ✔ ' + x.t + ' (' + tid + ')');

    if (x.tn && x.tn.length) {
      const tnRows = x.tn.map(([k, z]) => ({
        termin_id: tid,
        person_kuerzel: k,
        zugesagt: z
      }));
      const ins = await admin.from('termin_teilnehmer').insert(tnRows);
      if (ins.error) console.error('    ! Teilnehmer-Fehler: ' + ins.error.message);
    }
  }

  // Zähler
  const { count } = await admin.from('termine').select('*', { count: 'exact', head: true });
  console.log('\n✔ Fertig. Termine in DB: ' + count);
}

run().catch(e => { console.error(e); process.exit(1); });
