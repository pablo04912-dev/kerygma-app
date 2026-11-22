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
  const surAccueil = () => /Ancienne · Saint-Maurice/.test(txt()) && /Compte rendu de dimanche dernier/.test(txt()) && !txt().includes('Bonjour');
  assert(surAccueil(), 'connecté sur le profil de Hélène, sans « Bonjour »');
  assert($('[data-prototype]') && $('[data-prototype]').textContent === 'Prototype responsable', 'étiquette Prototype responsable en haut');
  propre('espace Hélène');
  const nav = (nom) => $$('nav[aria-label="Navigation principale"] button').find(x => x.textContent.replace(/\s+/g, ' ').trim().replace(/ ?\d+$/, '') === nom);
  assert($$('nav[aria-label="Navigation principale"] button').map(b => b.textContent.replace(/\s+/g, ' ').trim().replace(/ ?\d+$/, '')).join() === 'Planning,À faire,Actus,Équipe' && !nav('Moi'), '4 boutons en bas, dans l’ordre Planning, À faire, Actus, Équipe');
  assert(!!$('nav[aria-label="Navigation principale"] [data-glisse="onglet"]'), 'bulle grise sous l’onglet actif');
  assert(/Ce dimanche 22 novembre/.test(txt()) && !/Dimanches suivants/.test(txt()) && txt().indexOf('Ce dimanche 22 novembre') < txt().indexOf('Compte rendu de dimanche dernier'), 'accueil : ce dimanche, puis le compte rendu ; plus de dimanches suivants');
  assert($$('section[aria-label="Comptes rendus"] button[aria-label^="Ajouter un commentaire pour"]').length === 3, 'bulle « Ajouter un commentaire » sur les 3 lieux');
  assert(!/Modifiable/.test(txt()) && !/postes vides/.test(txt()), 'plus de « Modifiable » ni de postes vides');
  assert(/^À faire\s*1$/.test(nav('À faire').textContent.replace(/\s+/g, ' ').trim()) && nav('À faire').getAttribute('aria-label') === 'À faire, 1 chose à faire', 'pastille rouge : 1 chose à faire');
  assert(!$('section[aria-label="À valider"]') && !!$('section[aria-label="Comptes rendus"]'), 'la validation n’est plus sur la page d’accueil');

  // Dates, lieux, détail
  const dates = () => $$('nav[aria-label="Dates"] button:not([aria-label="Voir le mois"]):not([data-marqueur]):not([data-fleche])');
  const cartes = () => $$('main > button');
  const personne = () => $$('section[aria-label="Postes"] button').filter(b => b.textContent.trim() === 'Aucun');
  const marqueurs = () => $$('nav[aria-label="Dates"] button[data-marqueur]');
  const jourB = (l) => dates().find(b => b.textContent.replace(/\s+/g, ' ').trim().endsWith(l));
  const nomsMarq = () => marqueurs().map(b => b.textContent.replace(/\s+/g, ' ').trim()).join();
  const fleche = (sens) => $('nav[aria-label="Dates"] button[aria-label^="Deux mois ' + sens + '"]');
  assert(dates().length === 9 && nomsMarq() === 'Novembre,Décembre' && !!fleche('avant') && !!fleche('après'), 'bande : novembre et décembre, flèches avant et après : ' + nomsMarq());
  assert($('[data-bande] > button[aria-label="Voir le mois"]') && !$('nav[aria-label="Dates"] button[aria-label="Voir le mois"]'), '« Mois » reste fixe, à gauche de la bande');
  await click(fleche('après'), 'deux mois après');
  assert(nomsMarq() === 'janvier 2027,Février' && /Dimanche 3 janvier/.test(txt()) && dates()[0].getAttribute('aria-pressed') === 'true' && $('nav[aria-label="Dates"]').scrollLeft === 0, 'janvier et février 2027, on revient au début');
  await click(fleche('avant'), 'deux mois avant');
  assert(nomsMarq() === 'Novembre,Décembre' && /Ce dimanche 22 novembre/.test(txt()), 'retour au dimanche le plus proche');
  await click(fleche('avant'), 'le passé');
  assert(nomsMarq() === 'Septembre,Octobre' && /Dimanche 25 octobre/.test(txt()), 'septembre et octobre : le dernier dimanche passé');
  await click(cartes()[0], 'Saint-Maurice le 25 octobre');
  assert(/Dimanche passé/.test(txt()) && !personne().length && /Tania/.test(txt()), 'dimanche passé : on voit qui a servi, sans rien modifier');
  await click($('button[aria-label="Retour aux 3 lieux"]'), 'retour');
  await click(fleche('après'), 'retour à novembre');
  await click(jourB('29 nov'), 'date 29 nov');
  assert(jourB('29 nov').getAttribute('aria-pressed') === 'true', '29 nov sélectionné');
  assert(cartes().length === 3, '3 cartes de lieux');
  await click(cartes()[0], 'carte Saint-Maurice');
  assert($('h1').textContent === 'Saint-Maurice' && jourB('29 nov').getAttribute('aria-pressed') === 'true', 'détail Saint-Maurice, la date reste');
  propre('détail');
  assert($$('section[aria-label="Postes"] h2').map(h => h.textContent).join() === 'Voix,Instruments' && !!btn('+Ajouter une voix') && !!btn('+Ajouter un instrument') && !/sur 7 postes/.test(txt()), 'parties Voix et Instruments, boutons « + », plus de compteur');
  const enteteVoix = $('section[aria-label="Postes"] h2').parentElement;
  assert(!!$('button[aria-label^="Auto"]', enteteVoix) && enteteVoix.children.length === 2, 'Auto sur la même ligne que VOIX, à droite');
  assert(/Planning de novembre · Saint-Maurice/.test($('section[aria-label="Planning du mois"]').textContent) && !!btn('Valider le planning de novembre'), 'bloc du mois avec « Valider le planning de novembre »');
  // Changer la voix (Pierre) : la feuille s'ouvre ; toucher la zone grise la ferme
  await click($('button[aria-label="Changer voix : Pierre"]'), 'Changer Pierre');
  const dialog = $('[role=dialog]');
  assert(!!dialog && !btn('Fermer', dialog) && !!$('[data-poignee]', dialog.parentElement), 'feuille de choix ouverte, sans bouton « Fermer », avec la poignée');
  await click(dialog.parentElement, 'zone grise');
  assert(!$('[role=dialog]'), 'toucher la zone grise ferme la feuille');
  await click($('button[aria-label="Changer voix : Pierre"]'), 'Changer Pierre 2');
  propre('feuille de choix');
  const libres = $$('[role=dialog] [data-candidat="libre"]');
  const bloques = $$('[role=dialog] [data-candidat="bloque"]');
  assert(libres.length > 0 && bloques.length > 0, 'personnes libres puis déjà ailleurs');
  assert(/Déjà ailleurs à la même heure/.test($('[role=dialog]').textContent), 'titre de la partie grisée');
  assert(bloques.every(b => /Sert à /.test(b.textContent) && /Choisir quand même/.test(b.textContent)), 'raison du conflit et bouton Choisir quand même');
  assert(libres.every(b => /dimanches? de suite|semaines sans service|dimanche dernier|Pas de service récent/.test(b.textContent)), 'historique affiché pour chacun');
  const positionDernierLibre = libres[libres.length - 1].compareDocumentPosition(bloques[0]);
  assert(positionDernierLibre & window.Node.DOCUMENT_POSITION_FOLLOWING, 'les personnes en conflit sont en bas');
  const nomForce = bloques[0].querySelector('span span').textContent;
  await click(btn('Choisir quand même', bloques[0]), 'choisir quand même');
  assert(!$('[role=dialog]') && /Pas encore envoyé · conflit signalé/.test(txt()) && txt().indexOf(nomForce) >= 0, 'choix forcé : brouillon, conflit signalé');
  propre('après choix forcé');
  // Une 2e voix avec « + », puis quelqu'un dessus
  await click(btn('+Ajouter une voix'), 'ajouter une voix');
  await click(btn('+ Voix', $('[role=dialog]')), 'voix en plus');
  await click(personne()[0], 'Choisir 2');
  assert(!$('[role=dialog] [data-candidat="aucun"]') && !/moins servi/.test($('[role=dialog]').textContent), 'poste vide : pas d’option « Aucun », plus de petit message');
  const libre = $('[role=dialog] [data-candidat="libre"]');
  const nomInvite = libre.querySelector('span span').textContent;
  await click(btn('Choisir', libre), 'choisir');
  assert(!$('[role=dialog]') && txt().indexOf(nomInvite) >= 0 && !/Invitation envoyée/.test(txt()), 'choisi, rien d’envoyé');
  const envoyer = () => $$('button').find(b => /^Envoyer le planning aux volontaires/.test(b.textContent.trim()));
  assert(!!envoyer() && /3 changements pas encore envoyés/.test(envoyer().textContent), 'bouton « Envoyer le planning aux volontaires » : ' + (envoyer() && envoyer().textContent.replace(/\s+/g, ' ')));
  // Quitter sans envoyer : la question
  await click($('button[aria-label="Retour aux 3 lieux"]'), 'retour');
  const q = $('[role=dialog][aria-label="Envoyer les invitations ?"]');
  assert(!!q && !!btn('Oui, envoyer', q) && !!btn('Non, plus tard', q) && /aucun volontaire ne reçoit de demande/.test(q.textContent), 'question « Envoyer les invitations ? »');
  propre('question avant de quitter');
  await click(btn('Oui, envoyer', q), 'oui, envoyer');
  assert(surAccueil() && /Planning envoyé : 2 volontaires reçoivent la demande\. Thomas est prévenu\./.test(txt()), 'envoyé en partant, retour aux 3 lieux');

  // Programme du culte et Sainte Cène
  await click(btn('Programme culte'), 'programme');
  await click(cartes()[0], 'programme Saint-Maurice');
  const oui = $$('button').find(b => b.textContent.trim() === 'Oui');
  await click(oui, 'Sainte Cène oui');
  await click($('button[aria-label="Choisir la personne pour la Sainte Cène"]'), 'choisir un nom');
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
  await click($('button[aria-label="Retour aux 3 lieux"]'), 'retour');
  await click(btn('Réunion de prière'), 'prière');
  assert(/resp\. Paula/.test(txt()) && dates()[0].textContent.indexOf('jeu.') >= 0, 'prière : jeudis, responsable Paula');
  await click(cartes()[0], 'prière Saint-Maurice');
  assert(/Projection/.test(txt()) && /Orateur/.test(txt()), 'postes de prière');
  propre('prière');

  // Barre du bas, partout
  for (const nom of ['Équipe', 'Actus', 'À faire', 'Planning']) {
    await click(nav(nom), 'onglet ' + nom);
    assert(nav(nom) && nav(nom).getAttribute('aria-current') === 'page', 'onglet actif : ' + nom);
    propre('onglet ' + nom);
  }
  await click(nav('Équipe'), 'équipe');
  await click(btn("Toute l'équipe"), 'toute l’équipe');
  assert(/personnes ont déjà servi/.test(txt()), 'toute l’équipe');
  await click($('button[aria-label="Mon profil"]'), 'bulle H');
  assert(/Mes données/.test(txt()) && $('button[aria-label="Mon profil"]').getAttribute('aria-current') === 'page', 'la bulle H ouvre « Moi »');
  await click(btn('Se déconnecter'), 'déconnexion');
  assert(/Bienvenue chez Kerygma/.test(txt()), 'retour à l’accueil après déconnexion');

  // Les 3 profils test : Thomas propose, Hélène valide, Lucas reçoit la demande
  async function entrer(profil) {
    if (!$('[role=dialog]')) await click(btn('Espace membre'), 'Espace membre');
    const a = $('[role=dialog] a[data-profil="' + profil + '"]');
    assert(!!a, 'lien du profil test ' + profil);
    await click(a, 'profil ' + profil);
  }
  async function sortir() {
    await click($('button[aria-label="Mon profil"]'), 'Moi');
    await click(btn('Se déconnecter'), 'déconnexion');
  }
  await entrer('coordinateur');
  assert(!/Bonjour/.test(txt()) && /Coordinateur louange · Saint-Maurice/.test(txt()), 'espace de Thomas');
  assert($('[data-prototype]').textContent === 'Prototype coordinateur', 'étiquette Prototype coordinateur en haut');
  assert(!/Les 3 lieux/.test(txt()) && !/en attente de validation/.test(txt()) && /Hélène validera le mois/.test(txt()), 'Thomas : son lieu seulement, c’est Hélène qui valide le mois');
  propre('espace Thomas');
  await click(jourB('20 déc'), 'Thomas 20 déc');
  await click($('section[aria-label="Postes"] button[aria-label="Choisir batterie"]'), 'Choisir batterie');
  const lucasRow = $$('[role=dialog] [data-candidat="libre"]').find(r => /Lucas/.test(r.querySelector('span span').textContent));
  assert(!!lucasRow && !!btn('Choisir', lucasRow), 'Thomas voit « Choisir »');
  await click(btn('Choisir', lucasRow), 'choisir Lucas');
  assert(/Pas encore envoyé/.test(txt()) && /1 changement pas encore envoyé/.test(txt()), 'Lucas dans le brouillon de Thomas');
  await click($$('button').find(b => /^Envoyer le planning aux volontaires/.test(b.textContent.trim())), 'Thomas envoie');
  assert(/Planning envoyé : 1 volontaire reçoit la demande\. Hélène est prévenue\./.test(txt()) && /Demande envoyée/.test(txt()), 'Thomas envoie lui-même, sans validation');
  propre('après envoi de Thomas');
  // Tâche pour Lucas le 13 déc, et calendrier du mois
  await click(jourB('13 déc'), 'Thomas 13 déc');
  await click($('button[aria-label="Donner une tâche à Lucas"]'), 'Tâche Lucas');
  const fT = $('[role=dialog][aria-label="Tâche"]');
  assert(!!fT && /Tâche pour Lucas/.test(fT.textContent) && /Guitare acoustique · Saint-Maurice · Dimanche 13 décembre/.test(fT.textContent) && btn('Aucune tâche', fT).getAttribute('aria-pressed') === 'true', 'feuille « Tâche », Aucune tâche par défaut');
  propre('feuille tâche');
  const tmsg = $('#tacheTexte'); tmsg.focus(); tmsg.value = 'Faire la balance son à 9h avec Hugo';
  tmsg.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  assert(doc.activeElement.id === 'tacheTexte' && btn('Aucune tâche').getAttribute('aria-pressed') === 'false', 'focus gardé dans la tâche');
  await click(btn('Enregistrer'), 'enregistrer la tâche');
  assert(/Tâche envoyée à Lucas\./.test(txt()) && /Tâche : faire la balance son à 9h avec Hugo/.test(txt()) && !/Tâches de ce culte/.test(txt()), 'tâche envoyée et visible sous la ligne');
  await click($('button[aria-label="Voir le mois"]'), 'voir le mois');
  const cal = $('section[aria-label="Calendrier du mois"]');
  assert(!!cal && /Décembre 2026/.test(cal.textContent) && $$('section[aria-label="Calendrier du mois"] button[aria-pressed]').length === 4, 'calendrier de décembre, 4 dimanches');
  propre('calendrier Thomas');
  assert(!/Date affichée/.test(cal.textContent) && !btn('Réduire', cal), 'plus de « Date affichée » ni de bouton « Réduire » en texte');
  await click($('button[aria-label="Réduire le calendrier"]'), 'réduire');
  assert(!$('section[aria-label="Calendrier du mois"]') && dates().length === 9, 'retour à la bande des dates');
  // Compte rendu du dernier dimanche
  await click(nav('À faire'), 'À faire Thomas');
  const changements = $$('section[aria-label="Changement du planning"]');
  assert(/^À faire\s*3$/.test(nav('À faire').textContent.replace(/\s+/g, ' ').trim()) && changements.length === 1 && /Changement par Hélène/.test(changements[0].textContent) && /Dimanche 29 novembre · Saint-Maurice/.test(changements[0].textContent) && /Hélène a envoyé le planning aux volontaires/.test(changements[0].textContent), 'pastille 3 : compte rendu, échange, et l’envoi d’Hélène');
  propre('À faire Thomas');
  await click(btn('Vu', changements[0]), 'vu');
  assert(/^À faire\s*2$/.test(nav('À faire').textContent.replace(/\s+/g, ' ').trim()) && /Changement vu/.test(txt()), '« Vu » fait baisser la pastille');
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
  // Message à Lucas seul, depuis la liste « Qui était là ? »
  await click($('button[aria-label="Écrire un message à Lucas"]'), 'message à Lucas');
  assert(!!$('#crMsgP') && $('#crMsgP').value === 'Merci Lucas pour ton service dimanche !', 'message à une personne ouvert');
  const tp = $('#crMsgP'); tp.focus(); tp.value = 'Super guitare dimanche, merci Lucas !';
  tp.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  assert(doc.activeElement.id === 'crMsgP', 'focus gardé dans le message à Lucas');
  await click(btn('Envoyer à Lucas'), 'envoyer à Lucas');
  assert(/Message envoyé à Lucas/.test(txt()) && /Message envoyé ✓ « Super guitare dimanche, merci Lucas ! »/.test(txt()) && !$('#crMsgP'), 'message à Lucas envoyé');
  await click($('[role=switch]'), 'très bon service');
  const pretsG = $('[data-composer] [role=group][aria-label="Débuts de message"]');
  assert($('[role=switch]').getAttribute('aria-checked') === 'true' && $('#crMsgT').value === '' && !!pretsG && pretsG.querySelectorAll('button').length === 3 && !$$('button[aria-expanded]').some(b => /début de message/.test(b.textContent)), 'Très bon service : un seul champ, les 3 débuts dedans');
  propre('débuts de message');
  await click(btn('Quel beau service dimanche !', pretsG), 'choisir un début'); // btn() remplace les espaces fines par des espaces
  assert($('#crMsgT').value === 'Quel beau service dimanche ! ' && !$('[role=group][aria-label="Débuts de message"]'), 'le début remplit le champ, les suggestions se cachent');
  const tt = $('#crMsgT'); tt.focus(); tt.value = 'Quel beau service dimanche ! Vous avez porté l’assemblée.';
  tt.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  assert(doc.activeElement.id === 'crMsgT', 'on écrit la suite, le focus reste');
  await click(btn('Envoyer le compte rendu à Hélène'), 'envoyer compte rendu');
  assert(/Compte rendu envoyé à Hélène/.test(txt()) && /Compte rendu envoyé/.test($('section[aria-label="Compte rendu à remplir"]').textContent) && /^À faire\s*1$/.test(nav('À faire').textContent.replace(/\s+/g, ' ').trim()), 'compte rendu envoyé, retour à « À faire »');
  propre('après compte rendu');
  await sortir();

  await entrer('responsable');
  assert(surAccueil(), 'retour chez Hélène');
  await click(nav('À faire'), 'À faire Hélène');
  const envoi20 = $$('section[aria-label="Changement du planning"]').find(d => /Dimanche 20 décembre · Saint-Maurice/.test(d.textContent));
  assert(!!envoi20 && /Thomas a envoyé le planning aux volontaires\. Batterie : Lucas\./.test(envoi20.textContent), 'Hélène est prévenue de l’envoi de Thomas');
  const moisB = $('section[aria-label="Planning à valider"]');
  assert(!!moisB && /Tout est rempli/.test(moisB.textContent) && /Planning de novembre · Boulogne/.test(moisB.textContent), 'carte « Tout est rempli » pour Boulogne');
  propre('À faire Hélène');
  await click(btn('Valider', moisB), 'valider le mois');
  assert(/Planning de novembre validé à Boulogne/.test(txt()) && !$('section[aria-label="Planning à valider"]'), 'Hélène valide le mois de Boulogne');
  await click(nav('Planning'), 'planning Hélène');
  const blocCR = $('section[aria-label="Comptes rendus"]');
  assert(!!blocCR && /Saint-Maurice · 10h30\s*Thomas · 1 absent\s*Ajouter un commentaire/.test(blocCR.textContent.replace(/\s+/g, ' ')), 'Hélène reçoit le compte rendu de Thomas');
  await click($('button[aria-label="Ajouter un commentaire pour Saint-Maurice"]'), 'ajouter un commentaire');
  assert(doc.activeElement && doc.activeElement.id === 'crCom', 'la bulle ouvre le compte rendu, curseur dans le commentaire');
  assert(/Compte rendu · Thomas/.test(txt()) && !/Rempli par/.test(txt()) && /Belle louange/.test(txt()) && /Chloé/.test(txt()), 'Hélène lit le compte rendu : « Compte rendu · Thomas »');
  const rubAm = $('section[aria-label="À améliorer"]');
  assert(!!rubAm && /À améliorer\s*Aucun/.test(rubAm.textContent) && !/Très bon service : merci/.test(txt()), 'rubrique vide : « Aucun » à droite ; le merci de Thomas à l’équipe reste entre eux');
  propre('lecture compte rendu');
  // Hélène commente le service pour Thomas et écrit à Lucas
  const tc = $('#crCom'); tc.focus(); tc.value = 'Belle louange, bravo pour la préparation';
  tc.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  assert(doc.activeElement.id === 'crCom', 'focus gardé dans le commentaire d’Hélène');
  await click(btn('Envoyer à Thomas'), 'envoyer le commentaire');
  assert(/Commentaire envoyé à Thomas/.test(txt()) && /Commentaires sur le service/.test(txt()), 'commentaire envoyé');
  await click(btn('Certaines personnes'), 'certaines personnes');
  await click(btn('Lucas', $('[role=group][aria-label="Destinataires"]')), 'Lucas');
  const tm = $('#crMsg'); tm.value = 'Merci Lucas, très belle guitare dimanche !';
  tm.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
  await click(btn('Envoyer le message'), 'envoyer le message');
  assert(/Message envoyé à Lucas/.test(txt()) && /Envoyé à Lucas : « Merci Lucas, très belle guitare dimanche ! »/.test(txt()), 'message personnalisé envoyé à Lucas');
  propre('message d’Hélène');
  assert(/Envoyé à Lucas :\s*« Merci Lucas/.test(txt()) && !/Un merci pour un très bon service/.test(txt()), 'confirmation sur deux lignes, plus de texte gris');
  await click($('button[aria-label="Retour aux 3 lieux"]'), 'retour 3 lieux');
  assert(surAccueil(), 'retour aux 3 lieux après le compte rendu');
  assert(!!$('button[aria-label^="Commentaire envoyé pour Saint-Maurice"]') && /Commenté ✓/.test($('section[aria-label="Comptes rendus"]').textContent), 'Saint-Maurice : « Commenté ✓ »');
  await sortir();

  await entrer('serviteur');
  assert(!/Bonjour/.test(txt()) && $$('[role=group][aria-label="Choisir le service"] button').map(b => b.textContent.trim()).join() === 'Tout,Projection,Louange', 'espace de Lucas, onglets Tout / Projection / Louange');
  await click(btn('Projection'), 'onglet projection');
  assert($$('section[aria-label="Mes services"] button').every(b => !/Saint-Maurice|Champigny/.test(b.textContent)) && /Projection/.test($('section[aria-label="Mes services"]').textContent), 'onglet Projection : seulement la projection');
  await click(btn('Tout'), 'onglet tout');
  assert($('[data-prototype]').textContent === 'Prototype serviteur', 'étiquette Prototype serviteur en haut');
  propre('espace Lucas');
  await click(nav('À faire'), 'À faire Lucas');
  const demande0 = $('[data-demande="20/12|stm|batterie"]');
  assert(!!demande0 && /Dimanche 20 décembre/.test(demande0.textContent) && /Présence 9h · fin vers 13h/.test(demande0.textContent), 'Lucas reçoit la demande envoyée par Thomas dans « À faire »');
  propre('À faire Lucas');
  await click(nav('Planning'), 'planning Lucas');
  assert($$('nav[aria-label="Dimanches"] button[data-marqueur]').length === 2 && !!$('nav[aria-label="Dimanches"] button[aria-label^="Deux mois après"]'), 'Lucas : 2 mois à la fois dans « Mes dimanches », flèche « après »');
  const d13 = $('button[aria-label^="Dimanche 13 décembre"]');
  assert(!!d13 && /tu sers, une tâche à faire/.test(d13.getAttribute('aria-label')), 'le 13 déc signale la tâche dans « Mes dimanches »');
  await click(d13, 'ouvrir le 13 déc');
  const carteT = $$('section[aria-label="Tâche"]').find(x => /Faire la balance son/.test(x.textContent));
  assert(!!carteT && /Faire la balance son à 9h avec Hugo/.test(carteT.textContent) && /Demandée par Thomas/.test(carteT.textContent), 'Lucas voit la tâche dans son service');
  propre('tâche Lucas');
  await click($('[role=checkbox]', carteT), 'cocher la tâche');
  assert($('[role=checkbox]', $$('section[aria-label="Tâche"]').find(x => /Faire la balance son/.test(x.textContent))).getAttribute('aria-checked') === 'true' && /Thomas voit que c’est fait/.test(txt()), 'tâche cochée');
  await click($$('main button').find(b => /Mes services/.test(b.textContent)), 'retour accueil Lucas');
  await click($('button[aria-label="Voir le mois"]'), 'mois Lucas');
  assert(!!$('section[aria-label="Calendrier du mois"]') && $$('section[aria-label="Calendrier du mois"] button[aria-label*="tu sers"]').length >= 1, 'calendrier de Lucas, jours en violet');
  propre('calendrier Lucas');
  await click($('button[aria-label="Réduire le calendrier"]'), 'réduire Lucas');
  const mercisL = $$('section[aria-label="Merci"]').map(x => x.textContent.replace(/\s+/g, ' '));
  assert(mercisL.length === 3 && /Message de Thomas « Super guitare dimanche, merci Lucas ! »/.test(mercisL[0]) && /Message de Thomas à toute l’équipe « Quel beau service dimanche ! Vous avez porté l’assemblée. »/.test(mercisL[1]) && /Message d’Hélène.*Merci Lucas, très belle guitare dimanche !/.test(mercisL[2]), 'Lucas reçoit les messages de Thomas et d’Hélène : ' + mercisL.join(' | '));
  await click(nav('À faire'), 'À faire Lucas 2');
  const demande = $('[data-demande="20/12|stm|batterie"]');
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
  await click(nav('Planning'), 'planning Lucas 2');
  await click(btn('Remplir mes dispos'), 'grille');
  await click(btn("Je n'ai pas d'indispo"), 'aucune indispo');
  await click(btn('Envoyer'), 'envoyer dispos');
  assert(/Thomas voit tes dispos/.test(txt()), 'dispos envoyées');
  for (const nom of ['Équipe', 'Actus', 'Planning', 'À faire']) { await click(nav(nom), 'Lucas ' + nom); propre('Lucas ' + nom); }
  // Échange : Adrien demande à Lucas de prendre sa place, Lucas accepte, Thomas valide
  const demEch = $('article[aria-label="Demande d\'échange"]');
  assert(!!demEch && /Adrien n’est pas dispo/.test(demEch.textContent), 'Lucas reçoit la demande d’échange d’Adrien');
  await click(btn("J'accepte", demEch), 'accepter l’échange');
  assert(/Thomas doit valider/.test(txt()) && !btn("J'accepte"), 'échange accepté, en attente de Thomas');
  propre('échange accepté');
  await sortir();
  await entrer('coordinateur');
  await click(nav('À faire'), 'À faire Thomas 2');
  assert(/Hélène a commenté le service : « Belle louange, bravo pour la préparation »/.test($('section[aria-label="Compte rendu à remplir"]').textContent), 'Thomas voit le commentaire d’Hélène');
  const exAdrien = $$('section[aria-label="Échange à valider"]').find(x => /Adrien/.test(x.textContent));
  assert(!!exAdrien && /Lucas a accepté/.test(exAdrien.textContent), 'Thomas voit l’échange à valider');
  await click(btn('Oui, valider', exAdrien), 'valider l’échange');
  assert(/Échange validé : Lucas remplace Adrien le 22 novembre/.test(txt()), 'échange validé');
  await click(nav('Planning'), 'planning Thomas');
  await click(jourB('22 nov'), 'Thomas 22 nov');
  const voix22 = $$('section[aria-label="Postes"] [data-ligne]').find(d => /Lucas/.test(d.textContent) && /Voix/.test(d.textContent));
  assert(voix22 && /Lucas/.test(voix22.textContent) && /Échange : Adrien → Lucas \(Adrien pas dispo\)/.test(voix22.textContent), 'planning du 22 nov changé');
  propre('après échange');
  await click(jourB('13 déc'), 'Thomas 13 déc');
  assert(/Tâche faite : faire la balance son à 9h avec Hugo ✓/.test(txt()), 'Thomas voit la tâche faite');
  // Collecte des dispos
  await click(nav('Équipe'), 'Thomas équipe');
  await click(btn('Lancer la collecte'), 'lancer la collecte');
  const col = $('section[aria-label="Dispos du mois"]');
  assert(!!col && /Collecte lancée/.test(txt()) && /5 réponses sur 15/.test(col.textContent), 'collecte lancée, Lucas a déjà répondu : ' + (col && col.textContent.replace(/\s+/g, ' ').slice(0, 200)));
  assert(/Lucas\s*Dispo tous les dimanches/.test(col.textContent), 'les dispos de Lucas arrivent chez Thomas');
  await click(btn('Relancer les 10 sans réponse'), 'relancer');
  assert(/Rappel envoyé aux 10 personnes/.test(txt()), 'relance envoyée');
  propre('collecte');
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
