/* ═══════════════════════════════════════════════════════════════
   IMS Kalender · Fetch-Wrapper mit Auth
   Safari-safe · var / function / String-Concat · keine Arrows
   ═══════════════════════════════════════════════════════════════ */

(function() {

  function getToken() {
    // Supabase legt Session in localStorage ab — StorageKey laut supabase-client.js
    try {
      var raw = window.localStorage.getItem('ims-kalender-auth');
      if (!raw) return null;
      var sess = JSON.parse(raw);
      if (sess && sess.access_token) return sess.access_token;
      // Fallback neueres Format
      if (sess && sess.currentSession && sess.currentSession.access_token) {
        return sess.currentSession.access_token;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  function apiFetch(method, path, body) {
    var token = getToken();
    var opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);

    return fetch(path, opts).then(function(r) {
      if (r.status === 401) {
        window.location.href = '/index.html?reason=unauthorized';
        return { success: false, error: { code: 'UNAUTHORIZED' } };
      }
      return r.json();
    });
  }

  // Convenience-Helfer
  var API = {
    getToken: getToken,

    termine: {
      liste: function(von, bis, extra) {
        var qs = '?von=' + encodeURIComponent(von) + '&bis=' + encodeURIComponent(bis);
        if (extra && extra.person)    qs += '&person=' + encodeURIComponent(extra.person);
        if (extra && extra.kategorie) qs += '&kategorie=' + encodeURIComponent(extra.kategorie);
        return apiFetch('GET', '/api/kalender/termine' + qs);
      },
      get: function(id) {
        return apiFetch('GET', '/api/kalender/termine/' + id);
      },
      create: function(payload) {
        return apiFetch('POST', '/api/kalender/termine', payload);
      },
      update: function(id, payload) {
        return apiFetch('PATCH', '/api/kalender/termine/' + id, payload);
      },
      del: function(id) {
        return apiFetch('DELETE', '/api/kalender/termine/' + id);
      }
    },

    teilnehmer: {
      add: function(terminId, payload) {
        return apiFetch('POST', '/api/kalender/termine/' + terminId + '/teilnehmer', payload);
      },
      update: function(terminId, tnId, payload) {
        return apiFetch('PATCH', '/api/kalender/termine/' + terminId + '/teilnehmer/' + tnId, payload);
      },
      del: function(terminId, tnId) {
        return apiFetch('DELETE', '/api/kalender/termine/' + terminId + '/teilnehmer/' + tnId);
      }
    },

    person: function(kuerzel, von, bis) {
      var qs = '?von=' + encodeURIComponent(von) + '&bis=' + encodeURIComponent(bis);
      return apiFetch('GET', '/api/kalender/person/' + kuerzel + qs);
    },
    kunde: function(nr, von, bis) {
      var qs = '?von=' + encodeURIComponent(von) + '&bis=' + encodeURIComponent(bis);
      return apiFetch('GET', '/api/kalender/kunde/' + nr + qs);
    },
    ams: function(von, bis) {
      var qs = '?von=' + encodeURIComponent(von) + '&bis=' + encodeURIComponent(bis);
      return apiFetch('GET', '/api/kalender/ams/liefertermine' + qs);
    },
    me: function() {
      return apiFetch('GET', '/api/kalender/me');
    }
  };

  window.imsAPI = API;
})();
