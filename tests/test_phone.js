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
  const surAccueil = () => /Ancienne · Saint-Maurice/.test(txt()) && /sur les 3 lieux/.test(txt()) && !txt().includes('Bonjour');
  assert(surAccueil(), 'connecté sur le profil de Hélène, sans « Bonjour »');
  assert($('[data-prototype]') && $('[data-prototype]').textContent === 'Prototype responsable', 'étiquette Prototype responsable en haut');
  propre('espace Hélène');
  const nav = (nom) => $$('nav[aria-label="Navigation principale"] button').find(x => x.textContent.replace(/\s+/g, ' ').trim().replace(/ ?\d+$/, '') === nom);
  assert($$('nav[aria-label="Navigation principale"] button').length === 4 && !nav('Moi') && !!nav('À faire'), '4 boutons en bas : Planning, Équipe, Actus, À faire');
  assert(/^À faire\s*1$/.test(nav('À faire').textContent.replace(/\s+/g, ' ').trim()) && nav('À faire').getAttribute('aria-label') === 'À faire, 1 chose à faire', 'pastille rouge : 1 chose à faire');
  assert(!$('section[aria-label="À valider"]') && !!$('section[aria-label="Comptes rendus"]'), 'la validation n’est plus sur la page d’accueil');

  // Dates, lieux, détail
  const dates = () => $$('nav[aria-label="Dates"] button:not([aria-label="Voir le mois"])');
  await click(dates()[1], 'date 29 nov');
  assert(dates()[1].getAttribute('aria-pressed') === 'true', '29 nov sélectionné');
  const cartes = () => $$('main > button');
  assert(cartes().length === 3, '3 cartes de lieux');
  await click(cartes()[0], 'carte Saint-Maurice');
  assert($('h1').textContent === 'Saint-Maurice' && dates()[1].getAttribute('aria-pressed') === 'true', 'détail Saint-Maurice, la date reste');
  propre('détail');
  const personne = () => $$('section[aria-label="Postes"] button').filter(b => b.textContent.trim() === 'Personne');
  const choisir = personne();
  assert(choisir.length > 0 && $$('section[aria-label="Postes"] button[aria-disabled="true"]').every(b => b.textContent.trim() === 'Tâche'), 'boutons « Personne », Tâche grisé sur les postes vides');
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
  const choisir2 = personne();
  await click(choisir2[0], 'Choisir 2');
  assert(!!$('[role=dialog] [data-candidat="aucun"]') && !/moins servi/.test($('[role=dialog]').textContent), 'option « Aucun » en haut, plus de petit message');
  const libre = $('[role=dialog] [data-candidat="libre"]');
  const nomInvite = libre.querySelector('span span').textContent;
  await click(btn('Inviter', libre), 'inviter');
  assert(!$('[role=dialog]') && /Invitation envoyée à/.test(txt()), 'invitation envoyée, feuille fermée');
  assert(txt().indexOf(nomInvite) >= 0, 'la personne invitée apparaît dans le planning');
  await click($('button[aria-label="Retour aux 3 lieux"]'), 'retour');
  assert(surAccueil(), 'retour aux 3 lieux');

  // Programme du culte et Sainte Cène
  await click(btn('Programme du culte'), 'programme');
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
  // Hélène a déjà rempli elle-même la voix et la batterie du 29 nov : les propositions de Thomas sur ces postes sont remplacées
  assert(!/Les 3 lieux/.test(txt()) && !/en attente de validation par Hélène/.test(txt()), 'Thomas : son lieu seulement, plus rien en attente');
  propre('espace Thomas');
  await click(dates()[4], 'Thomas 20 déc');
  await click($('section[aria-label="Postes"] button[aria-label="Choisir batterie"]'), 'Choisir batterie');
  const lucasRow = $$('[role=dialog] [data-candidat="libre"]').find(r => /Lucas/.test(r.querySelector('span span').textContent));
  assert(!!lucasRow && !!btn('Proposer', lucasRow), 'Thomas voit « Proposer » (pas « Inviter »)');
  await click(btn('Proposer', lucasRow), 'proposer Lucas');
  assert(/Proposition enregistrée : Lucas/.test(txt()) && /1 proposition en attente de validation par Hélène \(20 déc\)/.test(txt()), 'proposition de Thomas enregistrée');
  propre('après proposition');
  // Tâche pour Lucas le 13 déc, et calendrier du mois
  await click(dates()[3], 'Thomas 13 déc');
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
  assert(!$('section[aria-label="Calendrier du mois"]') && dates().length === 6, 'retour à la bande des dates');
  // Compte rendu du dernier dimanche
  await click(nav('À faire'), 'À faire Thomas');
  const changements = $$('section[aria-label="Changement du planning"]');
  assert(/^À faire\s*4$/.test(nav('À faire').textContent.replace(/\s+/g, ' ').trim()) && changements.length === 2 && changements.every(c => /Changement par Hélène/.test(c.textContent) && /Dimanche 29 novembre · Saint-Maurice/.test(c.textContent)), 'pastille 4 : compte rendu, échange, et les 2 changements faits par Hélène');
  propre('À faire Thomas');
  await click(btn('Vu', changements[0]), 'vu');
  assert(/^À faire\s*3$/.test(nav('À faire').textContent.replace(/\s+/g, ' ').trim()) && /Changement vu/.test(txt()), '« Vu » fait baisser la pastille');
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
  assert(/Compte rendu envoyé à Hélène/.test(txt()) && /Compte rendu envoyé/.test($('section[aria-label="Compte rendu à remplir"]').textContent) && /^À faire\s*2$/.test(nav('À faire').textContent.replace(/\s+/g, ' ').trim()), 'compte rendu envoyé, retour à « À faire »');
  propre('après compte rendu');
  await sortir();

  await entrer('responsable');
  assert(surAccueil(), 'retour chez Hélène');
  await click(nav('À faire'), 'À faire Hélène');
  const groupe20 = $$('section[aria-label="À valider"]').find(d => /Thomas propose pour Saint-Maurice · 20 décembre/.test(d.textContent));
  assert(!!groupe20 && /Batterie/.test(groupe20.textContent) && /Lucas/.test(groupe20.textContent), 'Hélène voit la proposition de Thomas');
  propre('À valider');
  await click(groupe20 && btn('Valider', groupe20), 'valider');
  assert(/Planning validé/.test(txt()), 'Hélène valide');
  await click(nav('Planning'), 'planning Hélène');
  const blocCR = $('section[aria-label="Comptes rendus"]');
  assert(!!blocCR && /Saint-Maurice · 10h30\s*Thomas · 1 absent\s*Reçu/.test(blocCR.textContent.replace(/\s+/g, ' ')), 'Hélène reçoit le compte rendu de Thomas');
  await click($$('section[aria-label="Comptes rendus"] button')[0], 'ouvrir compte rendu');
  assert(/Rempli par Thomas/.test(txt()) && /Belle louange/.test(txt()) && /Chloé/.test(txt()), 'Hélène lit le compte rendu');
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
  await sortir();

  await entrer('serviteur');
  assert(!/Bonjour/.test(txt()) && /Serviteur · Louange/.test(txt()), 'espace de Lucas');
  assert($('[data-prototype]').textContent === 'Prototype serviteur', 'étiquette Prototype serviteur en haut');
  propre('espace Lucas');
  await click(nav('À faire'), 'À faire Lucas');
  const demande0 = $('[data-demande="20/12|stm|batterie"]');
  assert(!!demande0 && /Dimanche 20 décembre/.test(demande0.textContent) && /Présence 9h · fin vers 13h/.test(demande0.textContent), 'Lucas reçoit la demande validée dans « À faire »');
  propre('À faire Lucas');
  await click(nav('Planning'), 'planning Lucas');
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
  await click(dates()[0], 'Thomas 22 nov');
  const voix22 = $$('section[aria-label="Postes"] > div').find(d => /Voix/.test(d.textContent));
  assert(voix22 && /Lucas/.test(voix22.textContent) && /Échange : Adrien → Lucas \(Adrien pas dispo\)/.test(voix22.textContent), 'planning du 22 nov changé');
  propre('après échange');
  await click(dates()[3], 'Thomas 13 déc');
  assert(/Tâche faite : faire la balance son à 9h avec Hugo ✓/.test(txt()), 'Thomas voit la tâche faite');
  // Collecte des dispos
  await click(nav('Équipe'), 'Thomas équipe');
  await click(btn('Lancer la collecte'), 'lancer la collecte');
  const col = $('section[aria-label="Dispos du mois"]');
  assert(!!col && /Collecte lancée/.test(txt()) && /5 réponses sur 14/.test(col.textContent), 'collecte lancée, Lucas a déjà répondu');
  assert(/Lucas\s*Dispo tous les dimanches/.test(col.textContent), 'les dispos de Lucas arrivent chez Thomas');
  await click(btn('Relancer les 9 sans réponse'), 'relancer');
  assert(/Rappel envoyé aux 9 personnes/.test(txt()), 'relance envoyée');
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
