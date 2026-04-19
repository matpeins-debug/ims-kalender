#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// Safari-Safe-Check: scannt public/ nach ES6-Features, die im
// iPad-Safari knallen können (let/const/arrow in inline <script>).
// Exit 1 wenn was gefunden, 0 wenn clean.
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'public');
const EXTS = new Set(['.html', '.js']);

// Was wir nicht im Browser wollen
const PATTERNS = [
  { re: /\blet\s+\w/g,  name: 'let'   },
  { re: /\bconst\s+\w/g, name: 'const' },
  { re: /=>\s*[\{\(]/g,  name: 'arrow-fn'   }
];

// Dateien, die Safari-safe sein MÜSSEN (im Browser ausgeführt)
function listFiles(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...listFiles(full));
    else if (EXTS.has(path.extname(f))) out.push(full);
  }
  return out;
}

let total = 0;
for (const f of listFiles(ROOT)) {
  let src = fs.readFileSync(f, 'utf8');

  // Für HTML: nur <script>...</script>-Blöcke prüfen
  if (f.endsWith('.html')) {
    const blocks = [];
    const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
    let m;
    while ((m = re.exec(src)) !== null) blocks.push(m[1]);
    src = blocks.join('\n');
  }

  for (const p of PATTERNS) {
    const hits = src.match(p.re);
    if (hits && hits.length) {
      console.log('  ' + f.replace(ROOT, 'public') + '  →  ' + p.name + ': ' + hits.length + ' Treffer');
      total += hits.length;
    }
  }
}

if (total > 0) {
  console.log('\n✖ Safari-Check: ' + total + ' potentielle Probleme gefunden.');
  process.exit(1);
} else {
  console.log('✔ Safari-Check: clean.');
  process.exit(0);
}
