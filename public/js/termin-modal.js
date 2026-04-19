/* ═══════════════════════════════════════════════════════════════
   IMS Kalender · Termin-Modal (Neu / Bearbeiten)
   Safari-safe · var / function
   ═══════════════════════════════════════════════════════════════ */

(function() {

  var CSS = ''
    + '.ims-modal-overlay{position:fixed;inset:0;background:rgba(26,25,21,0.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:200;display:flex;align-items:flex-start;justify-content:center;padding:60px 20px;overflow-y:auto;}'
    + '.ims-modal{background:#fff;border-radius:20px;max-width:520px;width:100%;box-shadow:0 24px 56px rgba(26,25,21,0.25);padding:26px;animation:imsModalIn 0.2s ease-out;}'
    + '@keyframes imsModalIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}'
    + '.ims-modal h3{font-size:18px;font-weight:700;color:#1a1915;margin-bottom:18px;letter-spacing:-0.2px;}'
    + '.ims-form-row{margin-bottom:14px;}'
    + '.ims-form-row label{display:block;font-size:11px;font-weight:600;color:#52493e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;}'
    + '.ims-form-row input,.ims-form-row select,.ims-form-row textarea{width:100%;padding:10px 12px;border-radius:10px;border:1px solid rgba(26,25,21,0.12);background:#faf7f0;font-family:"Inter",sans-serif;font-size:13px;color:#1a1915;outline:none;transition:all 0.12s;}'
    + '.ims-form-row input:focus,.ims-form-row select:focus,.ims-form-row textarea:focus{border-color:#00906a;background:#fff;box-shadow:0 0 0 3px rgba(0,144,106,0.12);}'
    + '.ims-form-row textarea{resize:vertical;min-height:64px;font-family:"Inter",sans-serif;}'
    + '.ims-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}'
    + '.ims-modal-actions{display:flex;gap:10px;margin-top:20px;}'
    + '.ims-btn{padding:10px 18px;border-radius:10px;border:1px solid rgba(26,25,21,0.08);background:rgba(255,255,255,0.8);color:#1a1915;font-weight:600;font-size:13px;font-family:inherit;cursor:pointer;transition:all 0.12s;}'
    + '.ims-btn:hover{background:#fff;box-shadow:0 1px 2px rgba(26,25,21,0.06);}'
    + '.ims-btn.primary{background:linear-gradient(135deg,#00a87a,#00906a);color:#fff;border-color:transparent;box-shadow:0 2px 8px rgba(0,144,106,0.25);}'
    + '.ims-btn.primary:hover{background:linear-gradient(135deg,#00906a,#006548);box-shadow:0 4px 12px rgba(0,144,106,0.35);}'
    + '.ims-btn.danger{color:#dc2626;}'
    + '.ims-btn.danger:hover{background:#fee2e2;}'
    + '.ims-err{color:#dc2626;font-size:12px;margin-top:6px;}'
    + '.ims-checkbox{display:flex;align-items:center;gap:8px;font-size:13px;color:#52493e;cursor:pointer;}'
    + '.ims-checkbox input{width:auto;}';

  function injectCss() {
    if (document.getElementById('ims-modal-css')) return;
    var s = document.createElement('style');
    s.id = 'ims-modal-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function isoToLocalInput(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate())
         + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function localInputToIso(s) {
    if (!s) return null;
    var d = new Date(s);
    return d.toISOString();
  }

  // termin = { id?, titel?, start_zeit?, end_zeit?, ... }  → leer = Neu-Anlegen
  function open(termin, opts) {
    opts = opts || {};
    injectCss();
    close();

    var isEdit = !!(termin && termin.id);
    var t = termin || {};

    // Defaults für Neuen Termin: aktuelle Zeit + 30 Min
    if (!t.start_zeit) {
      var now = new Date();
      now.setMinutes(now.getMinutes() + 30 - (now.getMinutes() % 30), 0, 0);
      t.start_zeit = now.toISOString();
      var end = new Date(now.getTime() + 30*60000);
      t.end_zeit = end.toISOString();
    }

    var html = ''
      + '<div class="ims-modal-overlay" id="imsModalOverlay">'
      + '  <div class="ims-modal" onclick="event.stopPropagation();">'
      + '    <h3>' + (isEdit ? 'Termin bearbeiten' : 'Neuer Termin') + '</h3>'
      + '    <div class="ims-form-row">'
      + '      <label>Titel *</label>'
      + '      <input id="imsTitel" type="text" value="' + escapeAttr(t.titel || '') + '" placeholder="z.B. Kunde Schadner">'
      + '    </div>'
      + '    <div class="ims-form-grid">'
      + '      <div class="ims-form-row">'
      + '        <label>Start *</label>'
      + '        <input id="imsStart" type="datetime-local" value="' + isoToLocalInput(t.start_zeit) + '">'
      + '      </div>'
      + '      <div class="ims-form-row">'
      + '        <label>Ende *</label>'
      + '        <input id="imsEnd" type="datetime-local" value="' + isoToLocalInput(t.end_zeit) + '">'
      + '      </div>'
      + '    </div>'
      + '    <div class="ims-form-grid">'
      + '      <div class="ims-form-row">'
      + '        <label>Kategorie *</label>'
      + '        <select id="imsKat">'
      + renderKatOptions(t.kategorie || 'intern')
      + '        </select>'
      + '      </div>'
      + '      <div class="ims-form-row">'
      + '        <label>Kunden-Nr.</label>'
      + '        <input id="imsKunde" type="number" value="' + (t.kunde_id || '') + '" placeholder="100423">'
      + '      </div>'
      + '    </div>'
      + '    <div class="ims-form-row">'
      + '      <label>Ort</label>'
      + '      <input id="imsOrt" type="text" value="' + escapeAttr(t.ort || '') + '" placeholder="z.B. IMS Besprechungsraum">'
      + '    </div>'
      + '    <div class="ims-form-row">'
      + '      <label>Beschreibung</label>'
      + '      <textarea id="imsDesc" placeholder="Optional">' + escapeAttr(t.beschreibung || '') + '</textarea>'
      + '    </div>'
      + '    <div class="ims-form-row">'
      + '      <label class="ims-checkbox">'
      + '        <input id="imsPrivat" type="checkbox" ' + (t.ist_privat ? 'checked' : '') + '>'
      + '        Privat (nur für mich sichtbar)'
      + '      </label>'
      + '    </div>'
      + '    <div class="ims-form-row">'
      + '      <label class="ims-checkbox">'
      + '        <input id="imsGanz" type="checkbox" ' + (t.ganztaegig ? 'checked' : '') + '>'
      + '        Ganztägig'
      + '      </label>'
      + '    </div>'
      + '    <div id="imsErr" class="ims-err" style="display:none;"></div>'
      + '    <div class="ims-modal-actions">'
      + '      <button class="ims-btn" onclick="imsModal.close()">Abbrechen</button>'
      + (isEdit ? '<button class="ims-btn danger" onclick="imsModal.del(\'' + t.id + '\')">Löschen</button>' : '')
      + '      <span style="flex:1;"></span>'
      + '      <button class="ims-btn primary" onclick="imsModal.save(\'' + (t.id || '') + '\')">'
      +         (isEdit ? 'Speichern' : 'Anlegen')
      + '      </button>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    var overlay = document.getElementById('imsModalOverlay');
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });

    window._imsOnSave = opts.onSave || function() {};
    window._imsOnDelete = opts.onDelete || function() {};
  }

  function close() {
    var el = document.getElementById('imsModalOverlay');
    if (el) el.parentNode.removeChild(el);
  }

  function save(id) {
    var titel = (document.getElementById('imsTitel').value || '').trim();
    var startIso = localInputToIso(document.getElementById('imsStart').value);
    var endIso = localInputToIso(document.getElementById('imsEnd').value);
    var kategorie = document.getElementById('imsKat').value;
    var ort = (document.getElementById('imsOrt').value || '').trim();
    var desc = (document.getElementById('imsDesc').value || '').trim();
    var privat = document.getElementById('imsPrivat').checked;
    var ganz = document.getElementById('imsGanz').checked;
    var kundeRaw = document.getElementById('imsKunde').value;
    var kunde_id = kundeRaw ? parseInt(kundeRaw, 10) : null;

    if (!titel)   return showErr('Titel fehlt');
    if (!startIso || !endIso) return showErr('Start und Ende müssen gesetzt sein');
    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      return showErr('Ende muss nach Start liegen');
    }

    var payload = {
      titel: titel,
      start_zeit: startIso,
      end_zeit: endIso,
      kategorie: kategorie,
      ort: ort || null,
      beschreibung: desc || null,
      ist_privat: privat,
      ganztaegig: ganz
    };
    if (kunde_id && !isNaN(kunde_id)) payload.kunde_id = kunde_id;

    var req = id
      ? window.imsAPI.termine.update(id, payload)
      : window.imsAPI.termine.create(payload);

    req.then(function(result) {
      if (!result.success) {
        return showErr((result.error && result.error.message) || 'Fehler beim Speichern');
      }
      close();
      if (typeof window._imsOnSave === 'function') window._imsOnSave(result.data);
    });
  }

  function del(id) {
    if (!id) return;
    if (!window.confirm('Termin wirklich löschen?')) return;
    window.imsAPI.termine.del(id).then(function(result) {
      if (!result.success) {
        return showErr((result.error && result.error.message) || 'Fehler beim Löschen');
      }
      close();
      if (typeof window._imsOnDelete === 'function') window._imsOnDelete(id);
    });
  }

  function showErr(msg) {
    var e = document.getElementById('imsErr');
    if (e) { e.textContent = msg; e.style.display = 'block'; }
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderKatOptions(sel) {
    var kats = [
      ['kunde', 'Kundentermin'],
      ['lieferant', 'Lieferant'],
      ['intern', 'Intern'],
      ['reise', 'Reise'],
      ['deadline', 'Deadline'],
      ['geburtstag', 'Geburtstag'],
      ['privat', 'Privat']
    ];
    var html = '';
    for (var i = 0; i < kats.length; i++) {
      var k = kats[i];
      html += '<option value="' + k[0] + '"' + (k[0] === sel ? ' selected' : '') + '>' + k[1] + '</option>';
    }
    return html;
  }

  window.imsModal = { open: open, close: close, save: save, del: del };
})();
