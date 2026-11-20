// Test de bout en bout de la page téléphone dans un navigateur sans écran (jsdom).
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf8');
const erreurs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => erreurs.push(e.message));
vc.on('error', e => erreurs.push(String(e)));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://exemple.test/' });
const { window } = dom;
const doc = window.document;
// jsdom ne connaît pas scrollIntoView
window.Element.prototype.scrollIntoView = function () { this.__vu = true; };

let ok = 0, ko = 0;
const assert = (c, m) => { if (c) ok++; else { ko++; console.log('  ÉCHEC : ' + m); } };
const tick = (ms) => new Promise(r => setTimeout(r, ms || 0));
const $ = (s) => doc.querySelector(s);
const $$ = (s) => Array.from(doc.querySelectorAll(s));
const txt = () => $('#app').textContent.replace(/\s+/g, ' ');
const btn = (label, root) => Array.from((root || doc).querySelectorAll('button, a')).find(b => b.textContent.replace(/\s+/g, ' ').trim() === label);
async function click(el, label) {
  assert(!!el, 'élément introuvable : ' + label);
  if (!el) return;
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await tick();
}
function propre(label) {
  const app = $('#app');
  const bad = [];
  app.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(a => {
      if (/^on/.test(a.name)) bad.push('attribut ' + a.name);
      if (a.value.indexOf('{{') >= 0) bad.push('trou non rempli dans ' + a.name);
    });
    if (/^sc-/.test(el.localName)) bad.push('balise ' + el.localName);
  });
  if (app.textContent.indexOf('{{') >= 0) bad.push('trou non rempli dans le texte');
  if (/undefined|NaN|\[object/.test(app.textContent)) bad.push('valeur cassée dans le texte');
  assert(bad.length === 0, label + ' : ' + [...new Set(bad)].join(', '));
}

(async () => {
  await tick();
  propre('accueil');
  assert(/Bienvenue chez Kerygma/.test(txt()) && /Fil d'actualité/.test(txt()), 'accueil affiché');
  assert(!$('[role=dialog]'), 'pas de fenêtre au tout début');
  await tick(900);
  assert(!!$('[role=dialog]'), 'fenêtre Espace membre ouverte après 0,8 s');
  propre('fenêtre');
  await click($('button[aria-label="Fermer"]'), 'croix');
  assert(!$('[role=dialog]'), 'la croix ferme');
  await click($('a[href="#eglises"]'), 'ancre');
  assert($('#eglises').__vu === true, 'le bouton Horaires descend jusqu’aux églises');
  await click(btn('Espace membre'), 'Espace membre');
  assert(!!$('[role=dialog]'), 'rouverte');

  // Création de compte : saisie au clavier, le focus reste dans le champ
  await click(btn('Créer un compte'), 'onglet création');
  const prenom = $('#prenom');
  prenom.focus();
  prenom.value = 'Pa';
  prenom.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  assert(doc.activeElement && doc.activeElement.id === 'prenom' && $('#prenom').value === 'Pa', 'le focus et la saisie restent après chaque lettre');
  await click(btn('Créer mon compte'), 'créer');
  assert(/prénom et ton nom/.test(txt()), 'erreur affichée');
  await click(btn('Se connecter'), 'onglet connexion');

  // Prototype : Se connecter ouvre directement le profil de Hélène
  const lien = Array.from($$('[role=dialog] a')).find(a => /Se connecter/.test(a.textContent));
  assert(!!lien && $('#email').value === '' , 'bouton Se connecter direct, champs vides');
  await click(lien, 'Se connecter');
  assert(/Bonjour Hélène/.test(txt()), 'connecté sur le profil de Hélène');
  propre('espace Hélène');
  assert($$('nav[aria-label="Navigation principale"] button').length === 4, '4 boutons dans la barre du bas');

  // Dates, lieux, détail
  const dates = () => $$('nav[aria-label="Dates"] button');
  await click(dates()[1], 'date 29 nov');
  assert(dates()[1].getAttribute('aria-pressed') === 'true', '29 nov sélectionné');
  const cartes = () => $$('main > button');
  assert(cartes().length === 3, '3 cartes de lieux');
  await click(cartes()[0], 'carte Saint-Maurice');
  assert($('h1').textContent === 'Saint-Maurice' && dates()[1].getAttribute('aria-pressed') === 'true', 'détail Saint-Maurice, la date reste');
  propre('détail');
  const choisir = $$('section[aria-label="Postes"] button').filter(b => b.textContent.trim() === 'Choisir');
  assert(choisir.length > 0, 'boutons Choisir');
  await click(choisir[0], 'Choisir');
  const dialog = $('[role=dialog]');
  assert(!!dialog, 'feuille de choix ouverte');
  const desactives = $$('[role=dialog] button[disabled]');
  assert(desactives.length > 0 && desactives.every(b => /Conflit/.test(b.textContent)), 'conflits grisés et désactivés');
  const libre = $$('[role=dialog] button').find(b => /Inviter/.test(b.textContent));
  const nomInvite = libre.querySelector('span span').textContent;
  await click(libre, 'inviter');
  assert(!$('[role=dialog]') && /Invitation envoyée à/.test(txt()), 'invitation envoyée, feuille fermée');
  assert(txt().indexOf(nomInvite) >= 0, 'la personne invitée apparaît dans le planning');
  await click(btn('←Les 3 lieux') || $$('main button')[0], 'retour');
  assert(/Bonjour Hélène/.test(txt()), 'retour aux 3 lieux');

  // Programme du culte et Sainte Cène
  await click(btn('Programme du culte'), 'programme');
  await click(cartes()[0], 'programme Saint-Maurice');
  const oui = $$('button').find(b => b.textContent.trim() === 'Oui');
  await click(oui, 'Sainte Cène oui');
  await click(btn('Choisir un nom'), 'choisir un nom');
  const champ = $('#nomLibre');
  assert(!!champ, 'champ nom libre');
  champ.focus();
  champ.value = 'Samir Girard';
  champ.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  assert(doc.activeElement.id === 'nomLibre', 'focus gardé dans le champ nom libre');
  await click(btn('Valider'), 'valider');
  assert(/Samir Girard/.test(txt()) && !$('[role=dialog]'), 'nom libre enregistré');
  await click($$('button').find(b => b.textContent.trim() === 'Non'), 'Sainte Cène non');
  assert(/Pas ce dimanche/.test(txt()), 'Sainte Cène retirée');
  propre('programme');

  // Réunion de prière
  await click($$('main button').find(b => /Les 3 lieux/.test(b.textContent)), 'retour');
  await click(btn('Réunion de prière'), 'prière');
  assert(/resp\. Paula/.test(txt()) && dates()[0].textContent.indexOf('jeu.') >= 0, 'prière : jeudis, responsable Paula');
  await click(cartes()[0], 'prière Saint-Maurice');
  assert(/Projection/.test(txt()) && /Orateur/.test(txt()), 'postes de prière');
  propre('prière');

  // Barre du bas, partout
  for (const nom of ['Équipe', 'Actus', 'Moi', 'Planning']) {
    const b = $$('nav[aria-label="Navigation principale"] button').find(x => x.textContent.trim() === nom);
    await click(b, 'onglet ' + nom);
    assert(b && $$('nav[aria-label="Navigation principale"] button').find(x => x.textContent.trim() === nom).getAttribute('aria-current') === 'page', 'onglet actif : ' + nom);
    propre('onglet ' + nom);
  }
  await click($$('nav[aria-label="Navigation principale"] button').find(x => x.textContent.trim() === 'Équipe'), 'équipe');
  await click(btn("Toute l'équipe"), 'toute l’équipe');
  assert(/personnes ont déjà servi/.test(txt()), 'toute l’équipe');
  await click($$('nav[aria-label="Navigation principale"] button').find(x => x.textContent.trim() === 'Moi'), 'moi');
  assert(/Mes données/.test(txt()), 'Mes données');
  await click(btn('Se déconnecter'), 'déconnexion');
  assert(/Bienvenue chez Kerygma/.test(txt()), 'retour à l’accueil après déconnexion');

  // Page : zoom bloqué et plein écran
  const vp = $('meta[name=viewport]').getAttribute('content');
  assert(/user-scalable=no/.test(vp) && /maximum-scale=1/.test(vp), 'zoom désactivé dans le viewport');
  assert(/touch-action:pan-x pan-y/.test(html), 'pincement bloqué (touch-action)');

  assert(erreurs.length === 0, 'erreurs JavaScript : ' + erreurs.join(' | '));
  console.log(`Page téléphone : ${ok} vérifications OK, ${ko} échec(s)`);
  process.exit(ko ? 1 : 0);
})();
