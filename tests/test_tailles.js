// Contrôles fixes sur la page téléphone : taille de texte du téléphone respectée, boutons d'au moins 44 px.
// Usage : node tests/test_tailles.js site/index.html
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
let ok = 0, ko = 0;
const assert = (c, m) => { if (c) ok++; else { ko++; console.log('  ÉCHEC : ' + m); } };

// 1. Les tailles de texte des écrans sont en rem (elles suivent le réglage du téléphone),
//    sauf l'en-tête et la barre du bas, marqués data-taille-fixe.
const gabarits = html.split('<script>')[0];
const balises = gabarits.match(/<[a-zA-Z][^>]*>/g) || [];
const enPx = balises.filter(b => /font-size:\s*\d+(\.\d+)?px/.test(b) && b.indexOf('data-taille-fixe') < 0);
assert(enPx.length === 0, 'tailles de texte encore en px : ' + enPx.slice(0, 3).join(' | '));
const enRem = balises.filter(b => /font-size:\s*[\d.]+rem/.test(b));
assert(enRem.length > 200, 'tailles de texte en rem : ' + enRem.length);
const fixes = balises.filter(b => b.indexOf('data-taille-fixe') >= 0);
assert(fixes.length >= 12 && fixes.length <= 20, 'éléments à taille fixe (en-têtes et barres du bas) : ' + fixes.length);

// 2. Sur iPhone, la page suit la taille de texte réglée dans Réglages (Dynamic Type), sans toucher au Mac.
assert(/@supports \(font:-apple-system-body\) and \(-webkit-touch-callout:none\)\{html\{font:-apple-system-body\}\}/.test(html), 'règle iPhone (-apple-system-body)');
assert(/html\{font-size:106\.25%\}/.test(html), 'base 17 px qui suit le réglage du navigateur');

// 3. Boutons et liens-boutons : au moins 44 px de haut.
const cibles = balises.filter(b => /^<(button|a)\b/.test(b) && /style="/.test(b));
const petites = cibles.filter(b => {
  const st = b.match(/style="([^"]*)"/)[1];
  const h = st.match(/(?:^|;\s*)(?:min-height|height):\s*(\d+)px/g) || [];
  const max = Math.max(0, ...h.map(x => parseInt(x.match(/(\d+)px/)[1], 10)));
  const pad = st.match(/(?:^|;\s*)padding:\s*(\d+)px/);
  const carte = pad && parseInt(pad[1], 10) >= 12; // grande carte cliquable : la hauteur vient de son contenu
  return max < 44 && !carte && !/display: inline/.test(st);
});
assert(petites.length === 0, 'boutons sans hauteur de 44 px : ' + petites.length + ' ' + petites.slice(0, 2).join(' | '));

// 4. Les feuilles du bas défilent si elles sont plus hautes que l'écran (gros texte, petit téléphone).
const feuilles = balises.filter(b => /role="dialog"/.test(b));
assert(feuilles.length === 3 && feuilles.every(b => /max-height: calc\(100% - \d+px\); overflow-y: auto/.test(b)), 'feuilles qui défilent : ' + feuilles.length);

console.log(`Tailles et cibles : ${ok} vérifications OK, ${ko} échec(s)`);
process.exit(ko ? 1 : 0);
