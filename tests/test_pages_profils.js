// Les pages par profil (site/responsable.html, coordinateur.html, serviteur.html) s'ouvrent directement sur le bon profil.
// Usage : node tests/test_pages_profils.js site
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const dossier = process.argv[2];
let ok = 0, ko = 0;
const assert = (c, m) => { if (c) ok++; else { ko++; console.log('  ÉCHEC : ' + m); } };
const tick = (ms) => new Promise(r => setTimeout(r, ms || 0));

const PAGES = [
  { fichier: 'responsable.html', titre: 'Prototype responsable', bonjour: 'Emma ne peut pas', initiale: 'H' },
  { fichier: 'coordinateur.html', titre: 'Prototype coordinateur', bonjour: 'Compte rendu du dimanche 15 novembre', initiale: 'T' },
  { fichier: 'serviteur.html', titre: 'Prototype serviteur', bonjour: "Demande d'échange", initiale: 'L' },
];

(async () => {
  for (const p of PAGES) {
    const html = fs.readFileSync(path.join(dossier, p.fichier), 'utf8');
    const erreurs = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => erreurs.push(e.message));
    const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://exemple.test/' });
    const doc = dom.window.document;
    await tick(50);
    const txt = doc.querySelector('#app').textContent.replace(/\s+/g, ' ');
    assert(doc.title === p.titre, p.fichier + ' : titre de l’onglet « ' + doc.title + ' »');
    assert(/Installe KERYGMA sur ton téléphone/.test(txt) && txt.indexOf(p.bonjour) >= 0 && txt.indexOf('Bonjour') < 0, p.fichier + ' : s’ouvre sur l’Accueil du bon profil (' + p.bonjour + '), sans « Bonjour »');
    const bulle = doc.querySelector('button[aria-label="Mon profil"]');
    assert(bulle && bulle.textContent.trim() === p.initiale && !doc.querySelector('nav[aria-label="Navigation principale"]').textContent.includes('Moi'), p.fichier + ' : bulle de profil, plus de « Moi » en bas');
    assert(doc.querySelector('[data-prototype]') && doc.querySelector('[data-prototype]').textContent === p.titre, p.fichier + ' : étiquette en haut');
    assert(!/Bienvenue chez Kerygma/.test(txt), p.fichier + ' : pas de passage par l’accueil');
    assert(erreurs.length === 0, p.fichier + ' : erreurs JavaScript : ' + erreurs.join(' | '));
    dom.window.close();
  }
  const index = fs.readFileSync(path.join(dossier, 'index.html'), 'utf8');
  assert(/<title>Kerygma prototype<\/title>/.test(index) && /const DEPART = 'Accueil\.dc\.html'/.test(index), 'index.html commence toujours par l’accueil');
  console.log(`Pages par profil : ${ok} vérifications OK, ${ko} échec(s)`);
  process.exit(ko ? 1 : 0);
})();
