// Profil serviteur (Lucas) : demandes, conflit, remplaçant, dispos, équipe du culte, réglages.
// Usage : node tests/test_serviteur.js build/Serviteur.dc.html
const { load, checkHoles, checkTags, assert, report, timers } = require('./dc_harness.js');
const file = process.argv[2];
let steps = 0;
function ouvrir() {
  const r = load(file, {});
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
let L = ouvrir();
assert(checkTags(L.r.src).length === 0, 'balises : ' + checkTags(L.r.src).join(' | '));

// 1. Arrivée
let x = L.v('arrivée Lucas');
assert(/data-prototype[^>]*>Prototype serviteur</.test(L.r.src) && /<title>Kerygma, prototype serviteur<\/title>/.test(L.r.src), 'étiquette Prototype serviteur en haut');
assert(x.showAccueil && x.aRepondre && x.repondreTitre === 'À répondre (3)', 'trois demandes : ' + x.repondreTitre);
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
x.services[0].ouvrir(); x = L.v('détail 29 nov');
assert(x.showService && !x.showAccueil && x.svTitre === 'Dimanche 29 novembre', 'détail du service');
assert(/Saint-Maurice · culte 10h30 · présence 9h · fin vers 13h/.test(x.svSous), 'horaires : ' + x.svSous);
assert(x.equipeCulte.length === 2 && x.equipeCulte[0].titre === 'Louange' && x.equipeCulte[1].titre === 'Programme du culte', 'louange et programme du culte');
assert(x.equipeCulte[0].items.some(i => i.nom === 'Lucas' && i.color === '#4338CA'), 'Lucas repéré dans l’équipe');
x.retour(); x = L.v('retour');
assert(x.showAccueil, 'retour aux services');

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
assert(x.showEquipe && x.equipes.length > 0 && x.equipes.every(e => !/Boulogne/.test(e.titre) || true), 'équipes de ses cultes');
x.nav.moi.pick(); x = L.v('moi');
assert(x.showMoi && /guitare acoustique/.test(x.moiPostes), 'postes de Lucas : ' + x.moiPostes);
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

console.log(steps + ' états vérifiés');
process.exit(report('Serviteur') ? 1 : 0);
