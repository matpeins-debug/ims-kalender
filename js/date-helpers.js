/* ═══════════════════════════════════════════════════════════════
   IMS Kalender · Datum-Helfer (ISO 8601 KW, Mo–Fr)
   Safari-safe · nur var / function
   ═══════════════════════════════════════════════════════════════ */

(function() {

  // Gibt Montag 00:00 der KW zurück, in der das Datum liegt.
  function montagDerWoche(d) {
    var x = new Date(d.getTime());
    x.setHours(0,0,0,0);
    var tag = x.getDay();            // 0=So, 1=Mo, ..., 6=Sa
    var diff = (tag === 0 ? -6 : 1 - tag);
    x.setDate(x.getDate() + diff);
    return x;
  }

  function freitagDerWoche(d) {
    var mo = montagDerWoche(d);
    var fr = new Date(mo.getTime());
    fr.setDate(mo.getDate() + 4);
    fr.setHours(23, 59, 59, 999);
    return fr;
  }

  // ISO 8601 Woche
  function kwIso(d) {
    var x = new Date(d.getTime());
    x.setHours(0,0,0,0);
    x.setDate(x.getDate() + 4 - (x.getDay() || 7)); // Donnerstag der Woche
    var jahrStart = new Date(x.getFullYear(), 0, 1);
    var kw = Math.ceil((((x - jahrStart) / 86400000) + 1) / 7);
    return kw;
  }

  function fmtYMD(d) {
    var y = d.getFullYear();
    var m = (d.getMonth() + 1);
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function fmtDMY(d) {
    var y = d.getFullYear();
    var m = (d.getMonth() + 1);
    var day = d.getDate();
    return (day < 10 ? '0' : '') + day + '.' + (m < 10 ? '0' : '') + m + '.' + y;
  }

  var MONATE_LANG = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  var MONATE_KURZ = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  var WOCHENTAGE  = ['So','Mo','Di','Mi','Do','Fr','Sa'];

  // Liefert Tage Mo–Fr der Woche inkl. Flag today
  function wochenTage(refDate) {
    var mo = montagDerWoche(refDate);
    var heute = new Date(); heute.setHours(0,0,0,0);
    var out = [];
    for (var i = 0; i < 5; i++) {
      var d = new Date(mo.getTime());
      d.setDate(mo.getDate() + i);
      out.push({
        wd: WOCHENTAGE[d.getDay()],
        dt: d.getDate(),
        monat: MONATE_KURZ[d.getMonth()],
        datum: new Date(d.getTime()),
        today: d.getTime() === heute.getTime(),
        ymd: fmtYMD(d)
      });
    }
    return out;
  }

  // Mappt ein Termin-Objekt vom API-Format in das Render-Format
  //   { start_zeit, end_zeit, kategorie, titel, ort, termin_teilnehmer[...] , kunde_id, ... }
  //   → { tag, startH, endH, titel, kat, ort, teilnehmer[{u,s}], ekMarker, ... }
  // refDate = aktuelles Datum der angezeigten Woche (beliebiger Tag)
  function mapApiToTermine(apiRows, refDate, meId) {
    var mo = montagDerWoche(refDate);
    var fr = freitagDerWoche(refDate);
    var out = [];
    for (var i = 0; i < apiRows.length; i++) {
      var r = apiRows[i];
      var s = new Date(r.start_zeit);
      var e = new Date(r.end_zeit);
      // nur Termine in dieser Woche
      if (s.getTime() < mo.getTime() || s.getTime() > fr.getTime()) continue;

      var tag = Math.floor((s.getTime() - mo.getTime()) / 86400000);
      if (tag < 0 || tag > 4) continue;

      var startH = s.getHours() + s.getMinutes() / 60;
      var endH   = e.getHours() + e.getMinutes() / 60;
      // Ende am Folgetag (ganztägig stackbar): begrenze auf 24
      if (e.getDate() !== s.getDate()) endH = 24;

      var teiln = [];
      var ekMarker = false;
      if (Array.isArray(r.termin_teilnehmer)) {
        for (var j = 0; j < r.termin_teilnehmer.length; j++) {
          var p = r.termin_teilnehmer[j];
          var u = p.person_kuerzel ? p.person_kuerzel.toLowerCase() : 'ex';
          teiln.push({ u: u, s: p.zugesagt || 'pending' });
        }
      }
      // EK-Marker: angelegt_von = EK, besitzer ≠ EK (d.h. Elke hat für jemanden angelegt)
      // Wir kennen hier nur UUIDs — setzen Marker wenn angelegt_von ≠ besitzer
      if (r.angelegt_von && r.besitzer && r.angelegt_von !== r.besitzer) {
        ekMarker = true;
      }

      var videoCall = !!(r.video_call_url);
      var sub = null;
      if (r.beschreibung) sub = r.beschreibung;

      var mapped = {
        id: r.id,
        tag: tag,
        allday: r.ganztaegig === true,
        startH: startH,
        endH: endH,
        titel: r.titel,
        kat: r.kategorie,
        sub: sub,
        ort: r.ort || null,
        videoCall: videoCall,
        recurring: r.wiederholung ? formatRrule(r.wiederholung) : null,
        ekMarker: ekMarker,
        ist_privat: r.ist_privat,
        besitzer: r.besitzer,
        angelegt_von: r.angelegt_von,
        teilnehmer: teiln,
        kunde_id: r.kunde_id,
        _raw: r
      };

      // Privat-Termine anderer User werden im Listing gar nicht erst geschickt (RLS)
      // Aber falls ein eigener privater Termin — als 'privat' kennzeichnen, nicht 'kunde' etc.
      if (r.ist_privat && r.besitzer !== meId) {
        mapped.titel = '🔒 Privat';
        mapped.kat = 'privat';
        mapped.ort = null;
        mapped.sub = null;
      }

      out.push(mapped);
    }
    return out;
  }

  function formatRrule(rr) {
    if (!rr) return null;
    if (rr.indexOf('FREQ=WEEKLY') !== -1) {
      if (rr.indexOf('BYDAY=MO') !== -1) return 'Wöchentlich · Mo';
      if (rr.indexOf('BYDAY=TU,WE,TH,FR') !== -1) return 'Di–Fr';
      return 'Wöchentlich';
    }
    if (rr.indexOf('FREQ=YEARLY') !== -1) return 'Jährlich';
    if (rr.indexOf('FREQ=MONTHLY') !== -1) return 'Monatlich';
    if (rr.indexOf('FREQ=DAILY') !== -1) return 'Täglich';
    return rr;
  }

  window.imsDate = {
    montagDerWoche: montagDerWoche,
    freitagDerWoche: freitagDerWoche,
    kwIso: kwIso,
    fmtYMD: fmtYMD,
    fmtDMY: fmtDMY,
    wochenTage: wochenTage,
    mapApiToTermine: mapApiToTermine,
    MONATE_LANG: MONATE_LANG,
    MONATE_KURZ: MONATE_KURZ
  };
})();
