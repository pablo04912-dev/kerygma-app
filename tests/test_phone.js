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
  assert($('[data-prototype]') && $('[data-prototype]').textContent === 'Prototype responsable', 'étiquette Prototype responsable en haut');
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
  propre('feuille de choix');
  const libres = $$('[role=dialog] [data-candidat="libre"]');
  const bloques = $$('[role=dialog] [data-candidat="bloque"]');
  assert(libres.length > 0 && bloques.length > 0, 'personnes libres puis déjà ailleurs');
  assert(/Déjà ailleurs à la même heure/.test($('[role=dialog]').textContent), 'titre de la partie grisée');
  assert(bloques.every(b => /Sert à /.test(b.textContent) && /Inviter quand même/.test(b.textContent)), 'raison du conflit et bouton Inviter quand même');
  assert(libres.every(b => /dimanches? de suite|semaines sans service|dimanche dernier|Pas de service récent/.test(b.textContent)), 'historique affiché pour chacun');
  const positionDernierLibre = libres[libres.length - 1].compareDocumentPosition(bloques[0]);
  assert(positionDernierLibre & window.Node.DOCUMENT_POSITION_FOLLOWING, 'les personnes en conflit sont en bas');
  const nomForce = bloques[0].querySelector('span span').textContent;
  await click(btn('Inviter quand même', bloques[0]), 'inviter quand même');
  assert(!$('[role=dialog]') && /conflit signalé/.test(txt()) && txt().indexOf(nomForce) >= 0, 'invitation forcée : conflit signalé dans le planning');
  propre('après invitation forcée');
  const choisir2 = $$('section[aria-label="Postes"] button').filter(b => b.textContent.trim() === 'Choisir');
  await click(choisir2[0], 'Choisir 2');
  const libre = $('[role=dialog] [data-candidat="libre"]');
  const nomInvite = libre.querySelector('span span').textContent;
  await click(btn('Inviter', libre), 'inviter');
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

  // Les 3 profils test : Thomas propose, Hélène valide, Lucas reçoit la demande
  const nav = (nom) => $$('nav[aria-label="Navigation principale"] button').find(x => x.textContent.trim() === nom);
  async function entrer(profil) {
    if (!$('[role=dialog]')) await click(btn('Espace membre'), 'Espace membre');
    const a = $('[role=dialog] a[data-profil="' + profil + '"]');
    assert(!!a, 'lien du profil test ' + profil);
    await click(a, 'profil ' + profil);
  }
  async function sortir() {
    await click(nav('Moi'), 'Moi');
    await click(btn('Se déconnecter'), 'déconnexion');
  }
  await entrer('coordinateur');
  assert(/Bonjour Thomas/.test(txt()) && /Coordinateur louange · Saint-Maurice/.test(txt()), 'espace de Thomas');
  assert($('[data-prototype]').textContent === 'Prototype coordinateur', 'étiquette Prototype coordinateur en haut');
  // Hélène a déjà rempli elle-même la voix et la batterie du 29 nov : les propositions de Thomas sur ces postes sont remplacées
  assert(!/Les 3 lieux/.test(txt()) && !/en attente de validation par Hélène/.test(txt()), 'Thomas : son lieu seulement, plus rien en attente');
  propre('espace Thomas');
  await click(dates()[4], 'Thomas 20 déc');
  const ligneBatterie = $$('section[aria-label="Postes"] > div').find(d => /Batterie/.test(d.textContent));
  await click(ligneBatterie && btn('Choisir', ligneBatterie), 'Choisir batterie');
  const lucasRow = $$('[role=dialog] [data-candidat="libre"]').find(r => /Lucas/.test(r.querySelector('span span').textContent));
  assert(!!lucasRow && !!btn('Proposer', lucasRow), 'Thomas voit « Proposer » (pas « Inviter »)');
  await click(btn('Proposer', lucasRow), 'proposer Lucas');
  assert(/Proposition enregistrée : Lucas/.test(txt()) && /1 proposition en attente de validation par Hélène \(20 déc\)/.test(txt()), 'proposition de Thomas enregistrée');
  propre('après proposition');
  // Compte rendu du dernier dimanche
  await click(btn('Remplir le compte rendu'), 'remplir le compte rendu');
  assert(/Qui était là/.test(txt()) && $$('[role=checkbox]').length === 6, 'formulaire du compte rendu, 6 personnes prévues');
  propre('compte rendu');
  const chloe = $$('[role=checkbox]').find(b => /Chloé/.test(b.textContent));
  await click(chloe, 'Chloé absente');
  assert($$('[role=checkbox]').find(b => /Chloé/.test(b.textContent)).getAttribute('aria-checked') === 'false' && /5 présents sur 6 prévus/.test(txt()), 'case décochée');
  const ta = $('#crBien'); ta.focus(); ta.value = 'Belle louange';
  ta.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  assert(doc.activeElement.id === 'crBien' && $('#crBien').value === 'Belle louange', 'focus et texte gardés dans le commentaire');
  await click($('[role=switch]'), 'très bon service');
  assert($('[role=switch]').getAttribute('aria-checked') === 'true' && !!btn('Merci en privé'), 'Très bon service activé');
  await click(btn('Envoyer le compte rendu à Hélène'), 'envoyer compte rendu');
  assert(/Compte rendu envoyé à Hélène/.test(txt()) && /Compte rendu envoyé/.test($('section[aria-label="Compte rendu à remplir"]').textContent), 'compte rendu envoyé');
  propre('après compte rendu');
  await sortir();

  await entrer('responsable');
  assert(/Bonjour Hélène/.test(txt()), 'retour chez Hélène');
  const groupe20 = $$('section[aria-label="À valider"]').find(d => /Thomas propose pour Saint-Maurice · 20 décembre/.test(d.textContent));
  assert(!!groupe20 && /Batterie/.test(groupe20.textContent) && /Lucas/.test(groupe20.textContent), 'Hélène voit la proposition de Thomas');
  propre('À valider');
  await click(groupe20 && btn('Valider', groupe20), 'valider');
  assert(/Planning validé/.test(txt()), 'Hélène valide');
  const blocCR = $('section[aria-label="Comptes rendus"]');
  assert(!!blocCR && /Saint-Maurice · 10h30\s*Thomas · 1 absent\s*Reçu/.test(blocCR.textContent.replace(/\s+/g, ' ')), 'Hélène reçoit le compte rendu de Thomas');
  await click($$('section[aria-label="Comptes rendus"] button')[0], 'ouvrir compte rendu');
  assert(/Rempli par Thomas/.test(txt()) && /Belle louange/.test(txt()) && /Chloé/.test(txt()), 'Hélène lit le compte rendu');
  propre('lecture compte rendu');
  await click($$('main button').find(b => /Les 3 lieux/.test(b.textContent)), 'retour 3 lieux');
  assert(/Bonjour Hélène/.test(txt()), 'retour aux 3 lieux après le compte rendu');
  await sortir();

  await entrer('serviteur');
  assert(/Bonjour Lucas/.test(txt()) && /Serviteur · Louange/.test(txt()), 'espace de Lucas');
  assert($('[data-prototype]').textContent === 'Prototype serviteur', 'étiquette Prototype serviteur en haut');
  const demande = $('[data-demande="20/12|stm|batterie"]');
  assert(!!demande && /Dimanche 20 décembre/.test(demande.textContent) && /Présence 9h · fin vers 13h/.test(demande.textContent), 'Lucas reçoit la demande validée');
  propre('espace Lucas');
  assert(!!$('section[aria-label="Merci"]') && /Merci, Lucas !/.test(txt()), 'Lucas reçoit le merci de Thomas');
  await click(btn('Dispo', demande), 'Lucas dispo');
  assert(!$('[data-demande="20/12|stm|batterie"]') && /C’est confirmé/.test(txt()), 'Lucas confirme');
  await click(btn('Garder les deux'), 'garder les deux');
  assert(!!$('[role=dialog]') && !!$('#justif'), 'feuille de justification');
  const j = $('#justif'); j.focus(); j.value = 'Je peux';
  j.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  assert(doc.activeElement.id === 'justif', 'focus gardé dans la justification');
  await click(btn('Envoyer à Hélène'), 'envoyer justif');
  assert(!$('[role=dialog]') && /Explication envoyée à Hélène/.test(txt()), 'justification envoyée');
  await click(btn('Remplir mes dispos'), 'grille');
  await click(btn("Je n'ai pas d'indispo"), 'aucune indispo');
  await click(btn('Envoyer'), 'envoyer dispos');
  assert(/Thomas voit tes dispos/.test(txt()), 'dispos envoyées');
  for (const nom of ['Équipe', 'Actus', 'Moi', 'Planning']) { await click(nav(nom), 'Lucas ' + nom); propre('Lucas ' + nom); }
  await sortir();
  assert(/Bienvenue chez Kerygma/.test(txt()), 'retour à l’accueil');

  // Page : zoom bloqué et plein écran
  const vp = $('meta[name=viewport]').getAttribute('content');
  assert(/user-scalable=no/.test(vp) && /maximum-scale=1/.test(vp), 'zoom désactivé dans le viewport');
  assert(/touch-action:pan-x pan-y/.test(html), 'pincement bloqué (touch-action)');

  assert(erreurs.length === 0, 'erreurs JavaScript : ' + erreurs.join(' | '));
  console.log(`Page téléphone : ${ok} vérifications OK, ${ko} échec(s)`);
  process.exit(ko ? 1 : 0);
})();
