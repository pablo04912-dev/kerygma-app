// Profil serviteur (Lucas) : demandes, conflit, remplaçant, dispos, équipe du culte, réglages.
// Usage : node tests/test_serviteur.js build/Serviteur.dc.html
const { load, checkHoles, checkTags, assert, report, timers } = require('./dc_harness.js');
const file = process.argv[2];
let steps = 0;
// On arrive sur l'Accueil ; sauf demande contraire, on passe tout de suite au Planning
function ouvrir(resterAccueil) {
  const r = load(file, {});
  if (!resterAccueil) r.c.renderVals().nav.planning.pick();
  return {
    r,
    v(label) {
      steps++;
      const vals = r.c.renderVals();
      const errs = checkHoles(r.tpl, vals);
      assert(errs.length === 0, label + ' : ' + errs.join(' | '));
      return vals;
    }
  };
}

globalThis.__kerygmaPartage = undefined;
let L = ouvrir(true);
assert(checkTags(L.r.src).length === 0, 'balises : ' + checkTags(L.r.src).join(' | '));

// 1. Arrivée
let x = L.v('arrivée Lucas');
assert(/data-prototype[^>]*>Prototype serviteur</.test(L.r.src) && /<title>Kerygma, prototype serviteur<\/title>/.test(L.r.src), 'étiquette Prototype serviteur en haut');
assert(x.showAFaire && x.nav.afaire.current === 'page' && x.aRepondre && x.repondreTitre === 'À répondre (3)', 'Lucas arrive sur l’Accueil, trois demandes : ' + x.repondreTitre);
assert(x.nav.afaire.badge === '4' && x.nav.afaire.aBadge, 'pastille À faire : 3 demandes + 1 demande d’échange : ' + x.nav.afaire.badge);
x.nav.afaire.pick(); x = L.v('À faire Lucas');
assert(x.showAFaire && !x.showAccueil && !x.aFaireVide && x.demandesEchange.length === 1, 'demandes et échange dans « À faire »');
x.nav.planning.pick(); x = L.v('retour planning');
// Onglets de services : Tout (louange + projection), puis un seul service
assert(x.servChips.map(c => c.label).join() === 'Tout,Projection,Louange' && x.servChips[0].on, 'onglets Tout / Projection / Louange : ' + x.servChips.map(c => c.label));
assert(x.services.length === 7 && x.services.filter(sv => /^Projection/.test(sv.sous)).length === 2, 'Tout : 7 services dont 2 en projection : ' + x.services.length);
x.servChips.find(c => c.label === 'Projection').pick(); x = L.v('projection');
assert(x.services.length === 2 && x.services.every(sv => / · Boulogne$/.test(sv.titre) && sv.statut === 'Confirmé'), 'Projection : ses 2 services à Boulogne');
assert(x.mesDims.filter(m => /tu sers/.test(m.aria)).map(m => m.label).join() === '22 nov,20 déc', 'Mes dimanches suit l’onglet choisi');
x.servChips.find(c => c.label === 'Louange').pick(); x = L.v('louange');
assert(x.services.length === 5, '5 services : ' + x.services.length);
assert(x.services.map(s => s.statut).join() === 'Confirmé,En attente,Confirmé,En attente,En attente', 'statuts : ' + x.services.map(s => s.statut));
const d6 = x.demandes.find(d => d.titre === 'Dimanche 6 décembre');
assert(d6 && d6.normal && !d6.conflit && d6.horaire === 'Présence 9h · fin vers 13h', 'demande du 6 déc : ' + (d6 && d6.horaire));
const d27 = x.demandes.filter(d => d.titre === 'Dimanche 27 décembre');
assert(d27.length === 2 && d27.every(d => d.conflit && !d.normal), 'conflit le 27 déc sur les deux lieux');
assert(/Tu es aussi prévu à Champigny à 10h30 \(guitare acoustique\)/.test(d27[0].conflitTexte), 'texte du conflit : ' + d27[0].conflitTexte);

// 2. Dispo pour le 6 déc
d6.dispo(); x = L.v('dispo 6 déc');
assert(x.repondreTitre === 'À répondre (2)' && x.services[1].statut === 'Confirmé', 'le 6 déc passe en Confirmé');
assert(/C’est confirmé/.test(x.toast), 'toast dispo : ' + x.toast);
assert(globalThis.__kerygmaPartage.reponses['06/12|cha|gac'] === 'dispo', 'réponse partagée');

// 3. Garder les deux : justification obligatoire
x.demandes[0].garder(); x = L.v('feuille justif');
assert(x.sheetOuvert && x.sheetJustif && !x.sheetRemplacant && x.sheetTitre === 'Garder les deux', 'feuille Garder les deux');
x.envoyerJustif(); x = L.v('justif vide');
assert(x.aErreur && x.sheetOuvert, 'erreur si pas d’explication');
x.saisir({ target: { value: 'Je peux faire les deux, Thomas est prévenu' } }); x = L.v('saisie');
assert(!x.aErreur && x.texte.length > 0, 'saisie');
x.envoyerJustif(); x = L.v('justif envoyée');
assert(!x.sheetOuvert && !x.aRepondre, 'plus rien à répondre');
assert(x.services.filter(s => s.statut === 'Les deux gardés').length === 2, 'les deux services du 27 déc sont gardés');
assert(/Explication envoyée à Hélène/.test(x.toast), 'toast justification : ' + x.toast);

// 4. Autre cas : se faire remplacer sur l’un des deux
globalThis.__kerygmaPartage = undefined;
L = ouvrir();
x = L.v('Lucas neuf');
const stm27 = x.demandes.find(d => d.cle === '27/12|stm|gac');
stm27.remplacer(); x = L.v('remplacer stm 27');
assert(x.sheetOuvert && x.sheetRemplacant && x.sheetTitre === 'Proposer un remplaçant', 'feuille remplaçant');
assert(x.remplacants.length > 0 && x.remplacants.every(r => r.nom !== 'Lucas'), 'remplaçants proposés, sans Lucas');
const cha27 = x.demandes.find(d => d.cle === '27/12|cha|gac');
assert(cha27 && cha27.normal && !cha27.conflit, 'plus de conflit à Champigny une fois Saint-Maurice lâché');
const nomR = x.remplacants[0].nom;
x.remplacants[0].choisir(); x = L.v('échange demandé');
assert(!x.sheetOuvert && new RegExp('Demande envoyée à ' + nomR).test(x.toast) && /Thomas valide l’échange/.test(x.toast), 'toast échange : ' + x.toast);
assert(x.services.find(s => s.titre === 'Dim. 27 déc · Saint-Maurice').statut === 'Échange demandé', 'statut échange demandé');

// 5. Pas dispo sans choisir de remplaçant : bouton pour plus tard
x.demandes.find(d => d.cle === '06/12|cha|gac').pasDispo(); x = L.v('pas dispo 6 déc');
assert(x.sheetOuvert && x.sheetRemplacant, 'Pas dispo ouvre directement la liste des remplaçants');
x.fermer(); x = L.v('fermer');
const s6 = x.services.find(s => s.titre === 'Dim. 6 déc · Champigny');
assert(s6.statut === 'Pas dispo' && s6.aRemplacer, 'Pas dispo, avec bouton Proposer un remplaçant');
s6.remplacer(); x = L.v('remplacer plus tard');
assert(x.sheetOuvert && x.sheetRemplacant, 'la liste se rouvre');
x.fermer(); x = L.v('fermer 2');

// 6. Qui sert ce culte
x.servChips.find(c => c.label === 'Louange').pick(); x = L.v('louange 6');
x.services[0].ouvrir(); x = L.v('détail 29 nov');
assert(x.showService && !x.showAccueil && x.svTitre === 'Dimanche 29 novembre', 'détail du service');
assert(/Saint-Maurice · culte 10h30 · présence 9h · fin vers 13h/.test(x.svSous), 'horaires : ' + x.svSous);
assert(x.equipeCulte.map(g => g.titre).join() === 'Louange,Sono,Accueil,Programme du culte', 'louange, les autres équipes du culte, puis le programme : ' + x.equipeCulte.map(g => g.titre));
assert(x.equipeCulte[0].items.some(i => i.nom === 'Lucas' && i.color === '#4338CA'), 'Lucas repéré dans l’équipe');
x.retour(); x = L.v('retour');
assert(x.showAccueil, 'retour aux services');
x.servChips.find(c => c.label === 'Tout').pick(); x = L.v('tout');
x.services.find(sv => sv.titre === 'Dim. 22 nov · Boulogne').ouvrir(); x = L.v('détail projection');
assert(x.showService && x.equipeCulte.some(g => g.titre === 'Projection' && g.items[0].nom === 'Lucas' && g.items[0].color === '#4338CA'), 'service de projection : Lucas dans la projection du culte');
x.retour(); x = L.v('retour projection');

// 7. Grille des dispos
x.ouvrirDispos(); x = L.v('grille');
assert(x.showDispos && x.grille.length === 4 && x.grille.every(g => g.etat === 'Pas répondu'), 'grille de décembre : 4 dimanches');
x.envoyerDispos(); x = L.v('envoi incomplet');
assert(x.aErreurDispos && x.showDispos, 'erreur si une date sans réponse');
x.grille[0].toucher(); x = L.v('1 toucher');
assert(x.grille[0].etat === 'Dispo' && !x.aErreurDispos, '1 toucher : Dispo');
x.grille[0].toucher(); x = L.v('2 touchers');
assert(x.grille[0].etat === 'Si besoin', '2 touchers : Si besoin');
x.grille[0].toucher(); x = L.v('3 touchers');
assert(x.grille[0].etat === 'Pas dispo' && x.grille[0].bg === '#FBE7E7', '3 touchers : Pas dispo (rouge)');
x.grille[0].toucher(); x = L.v('4 touchers');
assert(x.grille[0].etat === 'Dispo', 'on reboucle sur Dispo');
x.aucuneIndispo(); x = L.v('aucune indispo');
assert(x.grille.every(g => g.etat === 'Dispo'), 'Je n’ai pas d’indispo : tout en Dispo');
x.envoyerDispos(); x = L.v('dispos envoyées');
assert(x.showAccueil && /Thomas voit tes dispos/.test(x.toast) && x.dispoBouton === 'Modifier mes dispos', 'dispos envoyées');

// 8. Équipe, Moi
x.nav.equipe.pick(); x = L.v('équipe');
assert(x.showEquipe && x.equipes.length > 0, 'équipes de ses cultes');
{ const b22 = x.equipes.find(e => e.titre === 'Dim. 22 nov · Boulogne');
  assert(b22 && b22.items.some(i => i.label === 'Projection' && i.nom === 'Lucas' && i.color === '#4338CA'), 'Boulogne 22 nov : Lucas apparaît à la projection, à côté de l’équipe louange'); }
x.ouvrirMoi(); x = L.v('moi');
assert(x.showMoi && x.profilCurrent === 'page' && /guitare acoustique/.test(x.moiPostes), 'la bulle L ouvre « Moi » : ' + x.moiPostes);
assert(x.freqs.find(f => f.on).label === '2 fois par mois', 'fréquence par défaut');
x.freqs.find(f => f.label === 'En pause').pick(); x = L.v('en pause');
assert(x.freqs.find(f => f.on).label === 'En pause' && /Fréquence enregistrée/.test(x.toast), 'fréquence changée');
x.ensembles.find(e => e.label === 'Même jour').pick(); x = L.v('même jour');
assert(x.ensembles.find(e => e.on).label === 'Même jour' && /Inès/.test(x.lieTexte), 'servir ensemble avec Inès');
assert(x.agendaEtat === 'Pas encore connecté.', 'agenda pas connecté');
x.connecterGoogle(); x = L.v('google');
assert(/Google Agenda/.test(x.agendaEtat) && /Prototype/.test(x.toast), 'agenda Google');
x.connecterIphone(); x = L.v('iphone');
assert(/iPhone/.test(x.agendaEtat), 'agenda iPhone');
timers[timers.length - 1].fn(); x = L.v('toast effacé');
assert(!x.aToast, 'toast effacé');

// 9. Chaîne : une invitation validée par Hélène arrive chez Lucas
globalThis.__kerygmaPartage = undefined;
L = ouvrir();
x = L.v('Lucas avant');
const avant = x.demandes.length;
globalThis.__kerygmaPartage.invitations['dimanche|20/12|bou|louange|gac'] = { nom: 'Lucas', raison: '' };
x = L.v('Lucas après invitation');
assert(x.demandes.length === avant + 1 && x.demandes.some(d => d.cle === '20/12|bou|gac' && d.horaire === 'Présence 14h · fin vers 18h'), 'nouvelle demande reçue (Boulogne 20 déc)');
// Hélène remplace Lucas (liste choisie par le responsable) : le service disparaît chez lui
globalThis.__kerygmaPartage.affectations['dimanche|27/12|stm|louange|gac'] = { noms: ['Damien'], aucun: false };
x = L.v('Lucas remplacé');
assert(!x.demandes.some(d => d.cle === '27/12|stm|gac') && !x.services.some(sv => /27 déc · Saint-Maurice/.test(sv.titre)), 'Lucas n’est plus prévu le 27 à Saint-Maurice');

// 10. Messages après le culte (merci de Thomas, message personnalisé d'Hélène)
globalThis.__kerygmaPartage = undefined;
L = ouvrir();
x = L.v('sans merci');
assert(x.mercis.length === 0, 'pas de message au départ');
globalThis.__kerygmaPartage.mercis.push({ date: '15/11', lieu: 'stm', de: 'Thomas', noms: ['Inès', 'Lucas'], mode: 'prive', texte: 'Merci Lucas, super guitare !' });
globalThis.__kerygmaPartage.mercis.push({ date: '15/11', lieu: 'cha', de: 'Sylvie', noms: ['Marco'], mode: 'equipe', texte: 'Merci à tous' });
x = L.v('merci reçu');
assert(x.mercis.length === 1 && x.mercis[0].tag === 'Message de Thomas' && x.mercis[0].texte === '« Merci Lucas, super guitare ! »', 'message privé de Thomas, pas celui de Champigny : ' + JSON.stringify(x.mercis[0]));
assert(x.mercis[0].contexte === 'Après le culte du dimanche 15 novembre à Saint-Maurice', 'contexte : ' + x.mercis[0].contexte);
globalThis.__kerygmaPartage.mercis.push({ date: '15/11', lieu: 'stm', de: 'Hélène', noms: ['Inès', 'Lucas', 'Chloé'], mode: 'equipe', texte: 'Très belle louange, merci à toute l’équipe' });
x = L.v('message d’Hélène');
assert(x.mercis.length === 2 && x.mercis[1].tag === 'Message d’Hélène à toute l’équipe' && /Très belle louange/.test(x.mercis[1].texte), 'message d’Hélène à l’équipe');

// 11. Demande d'échange reçue (Adrien demande à Lucas de prendre sa place)
globalThis.__kerygmaPartage = undefined;
L = ouvrir();
x = L.v('demande d’échange');
assert(x.demandesEchange.length === 1 && x.demandesEchange[0].titre === 'Dimanche 22 novembre · Saint-Maurice', 'demande d’échange reçue');
assert(/Adrien n’est pas dispo et te demande de prendre sa place \(voix\)/.test(x.demandesEchange[0].texte) && x.demandesEchange[0].horaire === 'Présence 9h · fin vers 13h' && x.demandesEchange[0].enAttente, 'texte et horaire');
x.demandesEchange[0].accepter(); x = L.v('accepté');
assert(x.demandesEchange.length === 1 && x.demandesEchange[0].accepte && !x.demandesEchange[0].enAttente && /Thomas doit valider/.test(x.demandesEchange[0].etat), 'en attente de Thomas');
assert(/Thomas doit valider l’échange/.test(x.toast) && globalThis.__kerygmaPartage.echanges['22/11|stm|voix'].etat === 'accepte', 'échange accepté');
assert(!x.services.some(sv => /22 nov · Saint-Maurice/.test(sv.titre)), 'pas encore dans ses services');
globalThis.__kerygmaPartage.echanges['22/11|stm|voix'].etat = 'validee';
x = L.v('validé par Thomas');
assert(x.demandesEchange.length === 0, 'plus de demande');
const s22 = x.services.find(sv => sv.titre === 'Dim. 22 nov · Saint-Maurice');
assert(s22 && /^Voix/.test(s22.sous) && s22.statut === 'Confirmé', 'nouveau service confirmé le 22 nov');
globalThis.__kerygmaPartage = undefined;
L = ouvrir();
x = L.v('refus');
x.demandesEchange[0].refuser(); x = L.v('refusé');
assert(x.demandesEchange.length === 0 && /Réponse envoyée à Adrien/.test(x.toast) && globalThis.__kerygmaPartage.echanges['22/11|stm|voix'].etat === 'refusepar', 'Lucas ne peut pas');

// 12. Échange demandé par Lucas : suivi jusqu'à la validation
x.demandes.find(d => d.cle === '06/12|cha|gac').pasDispo(); x = L.v('pas dispo 6 déc');
const nomR2 = x.remplacants[0].nom;
x.remplacants[0].choisir(); x = L.v('demande envoyée');
assert(new RegExp('Si ' + nomR2 + ' accepte, Sylvie valide l’échange').test(x.toast), 'toast : coordinatrice de Champigny');
const sv6 = () => x.services.find(sv => sv.titre === 'Dim. 6 déc · Champigny');
assert(sv6().statut === 'Échange demandé' && sv6().note === 'Pas encore de réponse de ' + nomR2 && !sv6().aRemplacer, 'échange demandé');
const ech = globalThis.__kerygmaPartage.echanges['06/12|cha|gac'];
ech.etat = 'accepte'; x = L.v('accepté par le remplaçant');
assert(sv6().note === nomR2 + ' a accepté · Sylvie doit valider', 'accepté : ' + sv6().note);
ech.etat = 'refusepar'; x = L.v('le remplaçant ne peut pas');
assert(sv6().statut === 'Pas dispo' && sv6().aRemplacer && /ne peut pas/.test(sv6().note), 'proposer quelqu’un d’autre');
ech.etat = 'validee'; x = L.v('échange validé');
assert(sv6().statut === 'Remplacé' && sv6().note === nomR2 + ' prend ta place (échange validé)' && !sv6().aRemplacer, 'remplacé');
x.services.find(sv => sv.titre === 'Dim. 27 déc · Champigny').ouvrir(); x = L.v('équipe 27');
x.retour(); x = L.v('retour');

// 13. Collecte des dispos lancée par Thomas
globalThis.__kerygmaPartage = undefined;
L = ouvrir();
x = L.v('avant collecte');
assert(/Pas encore envoyées/.test(x.dispoTexte), 'avant collecte : ' + x.dispoTexte);
globalThis.__kerygmaPartage.collecte['12'] = { par: 'Thomas', lieu: 'stm', relances: 0 };
x = L.v('collecte lancée');
assert(x.dispoTexte === 'Thomas demande tes dispos de décembre pour préparer le planning.' && x.dispoColor === '#A12626', 'demande de Thomas');
x.ouvrirDispos(); x = L.v('grille');
x.grille[1].toucher(); x = L.v('13 dispo');
x.grille[1].toucher(); x = L.v('13 si besoin');
x.grille[0].toucher(); x.grille[2].toucher(); x.grille[3].toucher(); x = L.v('toutes');
x.grille[3].toucher(); x.grille[3].toucher(); x = L.v('27 pas dispo');
x.envoyerDispos(); x = L.v('envoyées');
assert(JSON.stringify(globalThis.__kerygmaPartage.dispos.Lucas) === JSON.stringify({ '06/12': 'dispo', '13/12': 'sibesoin', '20/12': 'dispo', '27/12': 'pasdispo' }), 'dispos partagées : ' + JSON.stringify(globalThis.__kerygmaPartage.dispos.Lucas));
assert(/Envoyées à Thomas/.test(x.dispoTexte) && x.dispoBouton === 'Modifier mes dispos', 'envoyées');
const L2 = ouvrir();
let y = L2.v('nouvelle visite');
y.ouvrirDispos(); y = L2.v('grille pré-remplie');
assert(y.grille.map(g => g.etat).join() === 'Dispo,Si besoin,Dispo,Pas dispo', 'grille pré-remplie : ' + y.grille.map(g => g.etat));

// 14. Mes dimanches, calendrier du mois et tâches
globalThis.__kerygmaPartage = undefined;
L = ouvrir();
x = L.v('mes dimanches');
x.servChips.find(c => c.label === 'Louange').pick(); x = L.v('louange seule');
assert(x.mesDims.length === 58 && x.mesDims[57].label === '26 déc' && x.moisFerme, 'bande des dimanches jusqu’à fin 2027 : ' + x.mesDims.length);
{
  const libsL = v => v.bandeDims.map(b => b.marqueur ? '[' + (b.haut ? b.haut + ' ' : '') + b.bas + ']' : b.label).join(' ');
  assert(libsL(x) === '[Novembre] 22 nov 29 nov [Décembre] 6 déc 13 déc 20 déc 27 déc' && !x.aFenPrec && x.aFenSuiv, 'Mes dimanches : novembre et décembre, flèche « après » : ' + libsL(x));
  x.fenSuiv(); x = L.v('janvier-février');
  assert(libsL(x) === '[janvier 2027] 3 janv 10 janv 17 janv 24 janv 31 janv [Février] 7 févr 14 févr 21 févr 28 févr' && x.aFenPrec, 'janvier et février 2027 : ' + libsL(x));
  x.bandeDims[0].pick(); let y = L.v('janvier 2027');
  assert(y.moisOuvert && y.moisTitre === 'Janvier 2027' && y.moisCases.filter(c => c.actif).length === 5, 'la pastille ouvre le calendrier de janvier 2027 : ' + y.moisTitre);
  y.fenPrec(); y = L.v('retour novembre-décembre');
  assert(/^\[Novembre\]/.test(libsL(y)), 'flèche « avant » : retour à novembre et décembre');
  y.moisPrec(); y = L.v('déc'); y.moisPrec(); y = L.v('nov');
  assert(y.moisTitre === 'Novembre 2026' && y.moisPrecOff === 'true', 'retour à novembre 2026');
  y.toggleMois(); x = L.v('calendrier refermé');
}
const md = n => x.mesDims.find(m => m.label === n);
assert(md('29 nov').bg === '#4338CA' && md('29 nov').dot === '#FFFFFF' && /tu sers, une tâche à faire/.test(md('29 nov').aria), '29 nov : confirmé (violet) avec une tâche');
assert(md('6 déc').bg === '#E4E6FB' && /à confirmer/.test(md('6 déc').aria), '6 déc : à confirmer (violet clair)');
assert(md('22 nov').bg === '#FFFFFF' && /pas de service/.test(md('22 nov').aria), '22 nov : pas de service');
md('22 nov').pick(); x = L.v('22 nov');
assert(/Pas de service prévu le dimanche 22 novembre/.test(x.toast) && x.showAccueil, 'pas de service ce jour-là');
const s29 = x.services.find(sv => sv.titre === 'Dim. 29 nov · Saint-Maurice');
assert(s29.aTache && s29.tacheTexte === '1 tâche à faire' && s29.tacheFg === '#4338CA', 'indication de tâche sur le service');
md('29 nov').pick(); x = L.v('service 29');
assert(x.showService && x.aMesTaches && x.mesTachesTitre === 'Ta tâche' && x.mesTaches.length === 1, 'tâche dans le détail du service');
const t0 = x.mesTaches[0];
assert(t0.titre === 'Installer et brancher le matériel' && t0.message === 'Arrive à 8h45 pour installer les amplis avec Inès.' && t0.de === 'Demandée par Thomas' && t0.fait === 'false' && t0.libelle === 'Marquer comme faite', 'détail de la tâche');
t0.cocher(); x = L.v('faite');
assert(x.mesTaches[0].fait === 'true' && x.mesTaches[0].libelle === 'Faite' && /Thomas voit que c’est fait/.test(x.toast), 'tâche cochée');
assert(globalThis.__kerygmaPartage.taches[0].fait === true, 'état partagé avec Thomas');
x.retour(); x = L.v('retour');
assert(x.services.find(sv => sv.titre === 'Dim. 29 nov · Saint-Maurice').tacheTexte === 'Tâche faite ✓', 'service : tâche faite');
x = L.v('après');
assert(x.mesDims.find(m => m.label === '29 nov').dot === 'transparent', 'plus de point quand la tâche est faite');
x.services.find(sv => sv.titre === 'Dim. 29 nov · Saint-Maurice').ouvrir(); x = L.v('rouvrir');
x.mesTaches[0].cocher(); x = L.v('décochée');
assert(x.mesTaches[0].fait === 'false' && /remise à faire/.test(x.toast), 'on peut décocher');
x.retour(); x = L.v('retour 2');
// Calendrier
x.toggleMois(); x = L.v('mois');
assert(x.moisOuvert && x.moisTitre === 'Novembre 2026', 'calendrier de novembre');
const n29 = x.moisCases.find(c => c.actif && c.n === '29');
assert(n29.bg === '#4338CA' && n29.dot === '#FFFFFF' && x.moisCases.find(c => c.actif && c.n === '22').bg === '#FFFFFF', 'violet le 29, point de tâche');
assert(x.moisLegende.map(l => l.texte).join() === 'Je sers,À confirmer,Tâche à faire', 'légende serviteur');
x.moisSuiv(); x = L.v('décembre');
assert(x.moisCases.find(c => c.actif && c.n === '6').bg === '#E4E6FB' && x.moisCases.find(c => c.actif && c.n === '13').bg === '#4338CA', 'décembre : à confirmer et confirmé');
x.moisCases.find(c => c.actif && c.n === '13').pick(); x = L.v('13 déc');
assert(x.showService && x.svTitre === 'Dimanche 13 décembre' && !x.aMesTaches, 'ouvrir un service depuis le calendrier');
// Une tâche envoyée par Thomas arrive chez Lucas
globalThis.__kerygmaPartage.taches.push({ id: 'tx', date: '13/12', lieu: 'stm', poste: 'gac', nom: 'Lucas', titre: 'Faire la balance son', message: '', par: 'Hélène', fait: false });
x = L.v('nouvelle tâche');
assert(x.aMesTaches && x.mesTaches[0].titre === 'Faire la balance son' && !x.mesTaches[0].aMessage && x.mesTaches[0].de === 'Demandée par Hélène', 'nouvelle tâche reçue');

// Moi de Lucas : « Ton année 2026 », sans classement
{
  globalThis.__kerygmaPartage = undefined;
  const A = ouvrir(true);
  let y = A.v('accueil Lucas');
  y.ouvrirMoi(); y = A.v('Moi de Lucas');
  assert(y.showMoi && y.bilanTitre === 'Ton année 2026' && y.bilanChiffres.map(b => b.n + ' ' + b.l).join(', ') === '9 services, 3 lieux, 8 dimanches', 'Ton année 2026 : ' + y.bilanChiffres.map(b => b.n + ' ' + b.l).join(', '));
  assert(/Pas de classement/.test(y.bilanTexte), 'pas de classement, seulement un merci');
}

console.log(steps + ' états vérifiés');
process.exit(report('Serviteur') ? 1 : 0);
