/* ═══════════════════════════════════════════════════════════════
   IMS Kalender · Supabase-Direct-Client (ohne API-Layer)
   Rest-Interface kompatibel zur frueheren Fetch-Version.
   Safari-safe: var / function / String-Concat, keine Arrows.
   ═══════════════════════════════════════════════════════════════ */

(function() {

  function ok(data)            { return { success: true,  data: data, error: null }; }
  function fail(code, message) { return { success: false, data: null, error: { code: code, message: message } }; }

  function db() { return window.imsSupabase; }

  function getSession() {
    return db().auth.getSession().then(function(r) {
      if (!r || !r.data || !r.data.session) {
        window.location.href = '/index.html?reason=unauthorized';
        return null;
      }
      return r.data.session;
    });
  }

  // YYYY-MM-DD  ->  ISO-Untergrenze / -Obergrenze
  function bisGanzerTag(bis) {
    if (!bis) return null;
    return bis + 'T23:59:59';
  }

  var API = {

    termine: {

      liste: function(von, bis, extra) {
        var q = db().from('termine').select('*, termin_teilnehmer(*)').order('start_zeit', { ascending: true });
        if (von) q = q.gte('start_zeit', von);
        if (bis) q = q.lte('start_zeit', bisGanzerTag(bis));
        if (extra && extra.kategorie) q = q.eq('kategorie', extra.kategorie);
        return q.then(function(r) {
          if (r.error) return fail('DB_ERROR', r.error.message);
          var termine = r.data || [];
          if (extra && extra.person) {
            var k = String(extra.person).toLowerCase();
            termine = termine.filter(function(t) {
              return (t.termin_teilnehmer || []).some(function(p) {
                return (p.person_kuerzel || '').toLowerCase() === k;
              });
            });
          }
          return ok(termine);
        });
      },

      get: function(id) {
        return db().from('termine').select('*, termin_teilnehmer(*)').eq('id', id).maybeSingle().then(function(r) {
          if (r.error) return fail('DB_ERROR', r.error.message);
          if (!r.data) return fail('NOT_FOUND', 'Termin nicht gefunden');
          return ok(r.data);
        });
      },

      create: function(payload) {
        return getSession().then(function(sess) {
          if (!sess) return fail('UNAUTHORIZED', 'Nicht eingeloggt');
          var data = {};
          for (var k in payload) if (Object.prototype.hasOwnProperty.call(payload, k)) data[k] = payload[k];
          if (!data.angelegt_von) data.angelegt_von = sess.user.id;
          if (!data.besitzer)     data.besitzer     = sess.user.id;
          var teilnehmer = data.teilnehmer || null;
          delete data.teilnehmer;

          return db().from('termine').insert(data).select('*').single().then(function(r) {
            if (r.error) return fail('DB_ERROR', r.error.message);
            var inserted = r.data;

            if (teilnehmer && teilnehmer.length > 0) {
              var rows = teilnehmer.map(function(t) {
                return {
                  termin_id: inserted.id,
                  person_kuerzel: t.person_kuerzel || null,
                  ansprechpartner_id: t.ansprechpartner_id || null,
                  zugesagt: t.zugesagt || 'pending'
                };
              });
              return db().from('termin_teilnehmer').insert(rows).then(function() {
                return db().from('termine').select('*, termin_teilnehmer(*)').eq('id', inserted.id).single().then(function(full) {
                  return ok(full.data || inserted);
                });
              });
            }
            return ok(inserted);
          });
        });
      },

      update: function(id, payload) {
        return db().from('termine').update(payload).eq('id', id).select('*, termin_teilnehmer(*)').maybeSingle().then(function(r) {
          if (r.error) return fail('DB_ERROR', r.error.message);
          if (!r.data) return fail('NOT_FOUND', 'Termin nicht gefunden');
          return ok(r.data);
        });
      },

      del: function(id) {
        return db().from('termine').delete({ count: 'exact' }).eq('id', id).then(function(r) {
          if (r.error) return fail('DB_ERROR', r.error.message);
          return ok({ deleted: r.count });
        });
      }
    },

    teilnehmer: {
      add: function(terminId, payload) {
        return db().from('termin_teilnehmer').insert({
          termin_id: terminId,
          person_kuerzel:     payload.person_kuerzel || null,
          ansprechpartner_id: payload.ansprechpartner_id || null,
          zugesagt:           payload.zugesagt || 'pending'
        }).select('*').single().then(function(r) {
          if (r.error) return fail('DB_ERROR', r.error.message);
          return ok(r.data);
        });
      },
      update: function(terminId, tnId, payload) {
        var updates = {};
        if (payload.zugesagt) {
          updates.zugesagt     = payload.zugesagt;
          updates.antwort_zeit = new Date().toISOString();
        }
        return db().from('termin_teilnehmer').update(updates).eq('id', tnId).eq('termin_id', terminId).select('*').maybeSingle().then(function(r) {
          if (r.error) return fail('DB_ERROR', r.error.message);
          if (!r.data) return fail('NOT_FOUND', 'Teilnehmer nicht gefunden');
          return ok(r.data);
        });
      },
      del: function(terminId, tnId) {
        return db().from('termin_teilnehmer').delete({ count: 'exact' }).eq('id', tnId).eq('termin_id', terminId).then(function(r) {
          if (r.error) return fail('DB_ERROR', r.error.message);
          return ok({ deleted: r.count });
        });
      }
    },

    person: function(kuerzel, von, bis) {
      var k = String(kuerzel).toLowerCase();
      var q = db().from('termine').select('*, termin_teilnehmer!inner(*)').ilike('termin_teilnehmer.person_kuerzel', k);
      if (von) q = q.gte('start_zeit', von);
      if (bis) q = q.lte('start_zeit', bisGanzerTag(bis));
      return q.order('start_zeit', { ascending: true }).then(function(r) {
        if (r.error) return fail('DB_ERROR', r.error.message);
        return ok(r.data || []);
      });
    },

    kunde: function(nr, von, bis) {
      var kn = parseInt(nr, 10);
      var q = db().from('termine').select('*, termin_teilnehmer(*)').eq('kunde_id', kn);
      if (von) q = q.gte('start_zeit', von);
      if (bis) q = q.lte('start_zeit', bisGanzerTag(bis));
      return q.order('start_zeit', { ascending: true }).then(function(r) {
        if (r.error) return fail('DB_ERROR', r.error.message);
        return ok(r.data || []);
      });
    },

    ams: function(von, bis) {
      var q = db().from('termine_ams').select('*');
      if (von) q = q.gte('liefertermin', von);
      if (bis) q = q.lte('liefertermin', bis);
      return q.order('liefertermin', { ascending: true }).then(function(r) {
        if (r.error) return fail('DB_ERROR', r.error.message);
        return ok(r.data || []);
      });
    },

    me: function() {
      return getSession().then(function(sess) {
        if (!sess) return fail('UNAUTHORIZED', 'Nicht eingeloggt');
        return ok({
          id: sess.user.id,
          email: sess.user.email,
          user_metadata: sess.user.user_metadata || {}
        });
      });
    }
  };

  window.imsAPI = API;
})();
