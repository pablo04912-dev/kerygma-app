const { load, checkHoles, checkTags, assert, report, timers } = require('./dc_harness.js');
const file = process.argv[2];
const { c, tpl, src } = load(file, {});
let v = () => c.renderVals();
let steps = 0;
function check(label) {
  steps++;
  const vals = v();
  const errs = checkHoles(tpl, vals);
  assert(errs.length === 0, label + ' : ' + errs.join(' | '));
  return vals;
}

assert(checkTags(src).length === 0, 'balises : ' + checkTags(src).join(' | '));

// 1. Accueil de Hélène : louange, dimanche 22 nov, 3 lieux
let x = check('état initial');
assert(x.showLieux && !x.showDetail, 'écran 3 lieux au départ');
assert(x.cartes.length === 3, '3 cartes');
assert(x.cartes.map(k => k.compte).join() === '4/7,4/7,3/7', 'comptes louange 22/11 : ' + x.cartes.map(k => k.compte));
assert(x.cartes.every(k => k.edit), 'Hélène modifie les 3 lieux en louange');
assert(x.dates[0].on && x.dates[0].label === '22 nov', 'date par défaut 22 nov');
assert(/postes vides sur les 3 lieux/.test(x.aTraiter), 'résumé à traiter : ' + x.aTraiter);
assert(x.nav.planning.current === 'page' && x.nav.equipe.current === 'false', 'nav planning active');

// 2. Changer de date sur l'accueil
x.dates[1].pick(); x = check('date 29/11');
assert(x.dates[1].on, '29 nov sélectionné');
assert(x.cartes.map(k => k.compte).join() === '3/7,3/7,3/7', 'comptes 29/11 : ' + x.cartes.map(k => k.compte));

// 3. Ouvrir Saint-Maurice : la date reste
x.cartes[0].ouvrir(); x = check('détail stm 29/11');
assert(x.showDetail && !x.showLieux, 'écran détail');
assert(x.dTitre === 'Saint-Maurice', 'titre détail');
assert(/29 novembre/.test(x.dSous), 'la date suit dans le détail : ' + x.dSous);
assert(x.dates[1].on, 'bandeau de dates conservé avec 29 nov');
assert(x.lignes.length === 7, '7 postes');
const voix = x.lignes.find(l => l.label === 'Voix');
assert(voix.vide && voix.peutChoisir, 'voix vide et choisissable le 29/11');

// 4. Changer de date dans le détail : on reste dans Saint-Maurice
x.dates[0].pick(); x = check('détail stm 22/11');
assert(x.showDetail && x.dTitre === 'Saint-Maurice' && /22 novembre/.test(x.dSous), 'date changée dans le détail');
const piano = x.lignes.find(l => l.label === 'Piano');
assert(piano.vide && piano.peutChoisir, 'piano vide le 22/11');

// 5. Choisir pour le piano : vérification des conflits
piano.ouvrir(); x = check('feuille piano');
assert(x.sheetOuvert && x.sheetTitre === 'Piano', 'feuille piano ouverte');
assert(x.candidats.length > 0, 'candidats piano');
const david = x.candidats.find(k => k.nom === 'Inès');
assert(david && david.libre && /direction ici/.test(david.info), 'Inès déjà à la direction ici, possible : ' + (david && david.info));
assert(x.candidats.every(k => typeof k.libre === 'boolean'), 'états définis');
x.fermer(); x = check('feuille fermée');
assert(!x.sheetOuvert, 'fermer la feuille');

// 6. Voix le 29/11 à Saint-Maurice : conflits avec Champigny, compatibles avec Boulogne
x.dates[1].pick(); x = check('stm 29/11');
x.lignes.find(l => l.label === 'Voix').ouvrir(); x = check('feuille voix 29/11');
const byName = n => x.candidats.find(k => k.nom === n);
assert(byName('Emma') && byName('Emma').bloque && /Champigny/.test(byName('Emma').info), 'Emma en conflit (voix à Champigny 10h30)');
assert(byName('Marco') && byName('Marco').bloque, 'Marco en conflit (direction à Champigny)');
assert(byName('Noé') && byName('Noé').libre && /Aussi à Boulogne à 15h30/.test(byName('Noé').info), 'Noé compatible (Boulogne 15h30) : ' + (byName('Noé') && byName('Noé').info));
assert(byName('Noé').tags.some(t => /Aussi à Boulogne/.test(t.texte) && t.bg === '#FDF0DC'), 'étiquette orange pour Noé');
const order = x.candidats.map(k => k.bloque);
assert(order.indexOf(true) === -1 || order.slice(order.indexOf(true)).every(b => b), 'conflits en bas de liste');
assert(x.candidats.filter(k => k.bloque).every(k => typeof k.choisir === 'function' && /^Sert à /.test(k.raison)), 'conflits : raison affichée et invitation possible');
assert(x.candLibres.length + x.candBloques.length === x.candidats.length && x.aBloques, 'deux listes : libres puis déjà ailleurs');
// Historique : dimanches de suite ou semaines sans service
assert(byName('Adrien').histo === '4 dimanches de suite', 'Adrien : 4 dimanches de suite : ' + byName('Adrien').histo);
assert(byName('Héloïse').histo === 'A servi dimanche dernier', 'Héloïse : dimanche dernier : ' + byName('Héloïse').histo);
assert(byName('Pierre').histo === '2 semaines sans service', 'Pierre : 2 semaines sans service : ' + byName('Pierre').histo);
assert(byName('Malik').histo === 'Pas de service récent', 'Malik : pas de service récent');
assert(x.candLibres.every(k => k.aHisto && k.histo.length > 0), 'chaque personne libre a son historique');
// Tri : ceux qui ont le moins servi en premier
const pos = n => x.candLibres.findIndex(k => k.nom === n);
assert(pos('Malik') < pos('Pierre') && pos('Pierre') < pos('Kenza') && pos('Kenza') < pos('Adrien'), 'tri : le moins servi en haut');
// Étiquettes indispo et fréquence max
assert(byName('Chloé').tags.some(t => t.texte === 'Indisponible ce jour-là' && t.bg === '#FBE7E7'), 'Chloé indisponible (rouge clair)');
assert(byName('Inès').tags.some(t => /fois ce mois-ci \(max 2\)/.test(t.texte)), 'Inès : fréquence max atteinte');
assert(byName('Olivier').tags.some(t => t.texte === 'Déjà à la direction ici' && t.bg === '#F1EFEA'), 'Olivier : déjà à la direction ici (gris)');

// 7. Inviter Noé aux voix à Saint-Maurice
byName('Noé').choisir(); x = check('après invitation');
assert(!x.sheetOuvert, 'feuille fermée après choix');
assert(x.aToast && /Noé/.test(x.toast), 'toast invitation');
const voix2 = x.lignes.find(l => l.label === 'Voix');
assert(voix2.rempli && voix2.nom === 'Noé' && voix2.aSous && voix2.sous === 'Invitation envoyée', 'Noé affiché invité');
assert(/4 sur 7/.test(x.dCompte), 'compteur détail 4/7 : ' + x.dCompte);
timers[timers.length - 1].fn(); x = check('toast effacé');
assert(!x.aToast, 'toast disparaît');

// 8. Le choix se répercute sur Boulogne : Noé est maintenant aussi le matin à Saint-Maurice
x.retour(); x = check('retour 3 lieux');
assert(x.showLieux && x.dates[1].on, 'retour aux 3 lieux, date 29/11 conservée');
assert(x.cartes[0].compte === '4/7', 'carte Saint-Maurice passe à 4/7');
x.cartes[2].ouvrir(); x = check('détail Boulogne 29/11');
x.lignes.find(l => l.label === 'Voix').ouvrir(); x = check('feuille voix Boulogne');
const rubB = x.candidats.find(k => k.nom === 'Noé');
assert(rubB && rubB.libre && /Saint-Maurice/.test(rubB.info), 'Noé vu comme aussi à Saint-Maurice le matin (compatible) : ' + (rubB && rubB.info));
x.fermer(); x.retour(); x = check('retour');

// 9. Programme du culte
x.mins[1].pick(); x = check('programme 29/11');
assert(x.cartes[0].edit && x.cartes[1].lecture && x.cartes[2].lecture, 'programme : Saint-Maurice modifiable, autres en lecture');
assert(x.cartes[0].compte === '5/5', 'programme stm 29/11 complet : ' + x.cartes[0].compte);
assert(!x.cartes[1].aCompte && /pas encore rempli/.test(x.cartes[1].manque), 'Champigny sans programme');
x.dates[2].pick(); x = check('programme 06/12');
assert(x.cartes[0].compte === '1/5', 'programme 06/12 : seule la louange est reprise : ' + x.cartes[0].compte);
x.cartes[0].ouvrir(); x = check('détail programme stm 06/12');
const lou = x.lignes.find(l => l.label === 'Louange (direction)');
assert(lou.rempli && lou.nom === 'Marco' && lou.sous === 'Repris du planning louange', 'louange reprise automatiquement');
assert(!lou.peutChoisir, 'pas de choix manuel sur la ligne louange');
const pred = x.lignes.find(l => l.label === 'Prédication');
assert(pred.vide && pred.peutChoisir, 'prédication à pourvoir');
pred.ouvrir(); x = check('feuille prédication');
assert(x.sheetOuvert && x.candidats.length > 3 && x.candidats.every(k => k.libre), 'candidats prédication');
x.candidats[0].choisir(); x = check('prédication choisie');
assert(x.lignes.find(l => l.label === 'Prédication').rempli, 'prédication remplie');
let cene = x.lignes.find(l => l.label === 'Sainte Cène');
assert(cene.aToggle && cene.nonOn && cene.videTexte === 'Pas ce dimanche' && !cene.peutChoisirSous, 'Sainte Cène : Non par défaut, bouton Oui/Non');
const avant = x.dCompte;
cene.pickOui(); x = check('cène oui');
cene = x.lignes.find(l => l.label === 'Sainte Cène');
assert(cene.ouiOn && cene.vide && cene.videTexte === 'À pourvoir' && cene.peutChoisirSous, 'Oui : à pourvoir + Choisir un nom');
assert(/sur 6/.test(x.dCompte), 'avec Sainte Cène le compte passe sur 6 : ' + avant + ' -> ' + x.dCompte);
cene.ouvrir(); x = check('feuille cène');
assert(x.sheetOuvert && x.sheetSaisie && x.sheetTitre === 'Sainte Cène', 'feuille cène avec saisie libre');
assert(x.candidats[0].nom === 'Victor Garnier' && x.candidats[0].info === 'Pasteur', 'pasteurs en tête : ' + x.candidats[0].nom);
assert(x.candidats.some(k => /En service ce dimanche/.test(k.info)), 'personnes en service proposées');
assert(new Set(x.candidats.map(k => k.nom.toLowerCase())).size === x.candidats.length, 'pas de doublons');
x.valider(); x = check('valider vide');
assert(x.aErreur && x.sheetOuvert, 'erreur si nom vide, la feuille reste ouverte');
x.saisir({ target: { value: 'Samir Girard' } }); x = check('saisie');
assert(!x.aErreur && x.texte === 'Samir Girard', 'saisie efface l’erreur');
x.valider(); x = check('nom libre validé');
cene = x.lignes.find(l => l.label === 'Sainte Cène');
assert(!x.sheetOuvert && cene.rempli && cene.nom === 'Samir Girard' && cene.aSous, 'nom libre enregistré');
cene.pickNon(); x = check('cène non');
cene = x.lignes.find(l => l.label === 'Sainte Cène');
assert(cene.nonOn && !cene.rempli && cene.videTexte === 'Pas ce dimanche' && !/sur 6/.test(x.dCompte), 'Non : retirée du compte');
cene.pickOui(); x = check('cène oui à nouveau');
assert(x.lignes.find(l => l.label === 'Sainte Cène').nom === 'Samir Girard', 'le nom revient si on remet Oui');
x.lignes.find(l => l.label === 'Sainte Cène').pickNon(); x = check('cène non 2');
x.dates[3].pick(); x = check('autre dimanche');
assert(x.lignes.find(l => l.label === 'Sainte Cène').nonOn, 'le choix Oui/Non est propre à chaque dimanche');
x.dates[2].pick(); x = check('retour 6 déc');
x.retour(); x = check('retour programme');
x.cartes[1].ouvrir(); x = check('détail programme Champigny');
assert(x.dLecture && x.lignes.every(l => !l.peutChoisir) && x.dANote, 'Champigny en lecture seule, sans bouton Choisir');
x.retour(); x = check('retour');

// 10. Réunion de prière
x.types[1].pick(); x = check('prière');
assert(!x.showMinChips, 'pas de choix de ministère en prière');
assert(x.dates[0].jour === 'jeu.' && x.dates[0].label === '26 nov', 'jeudis');
assert(x.cartes[0].sous === 'Jeudi 26 novembre · resp. Paula' && x.cartes[1].sous === 'Mercredi 25 novembre · resp. à définir' && /^Mercredi 25/.test(x.cartes[2].sous), 'jours et responsables de prière : ' + x.cartes.map(k => k.sous).join(' / '));
assert(x.cartes[0].compte === '0/3' && x.cartes[0].edit && x.cartes[1].lecture, 'prière : 0/3, Saint-Maurice modifiable');
x.dates[1].pick(); x = check('prière 03/12');
assert(/^Mercredi 2 décembre/.test(x.cartes[1].sous), 'veille correcte : ' + x.cartes[1].sous);
x.cartes[0].ouvrir(); x = check('détail prière');
assert(x.lignes.map(l => l.label).join() === 'Louange,Projection,Orateur', 'postes de prière : louange, projection, orateur');
assert(x.lignes.every(l => l.peutChoisir), 'Hélène peut choisir à Saint-Maurice');
assert(/jeudi 3 décembre · 20h · resp\. Paula/.test(x.dSous), 'sous-titre prière : ' + x.dSous);
x.lignes[1].ouvrir(); x = check('feuille projection');
assert(x.sheetOuvert && x.sheetTitre === 'Projection' && x.candidats.some(k => k.nom === 'Orane'), 'candidats projection');
assert(/Jeudi 3 décembre/.test(x.sheetSous), 'date de la feuille prière : ' + x.sheetSous);
x.candidats.find(k => k.nom === 'Lucas').choisir(); x = check('Lucas projection');
assert(x.lignes[1].rempli && x.lignes[1].nom === 'Lucas' && /1 sur 3/.test(x.dCompte), 'projection remplie, 1/3');
x.lignes[0].ouvrir(); x = check('feuille louange prière');
const kev = x.candidats.find(k => k.nom === 'Lucas');
assert(kev && kev.libre && /projection ici/.test(kev.info), 'Lucas déjà à la projection : possible');
x.fermer(); x = check('fermer');
x.lignes[2].ouvrir(); x = check('feuille orateur');
assert(x.candidats.length > 3, 'orateurs proposés');
x.fermer();
x.dates[0].pick(); x = check('prière 26/11');
assert(x.lignes[1].vide, 'le choix du 3 déc ne touche pas le 26 nov');
x.dates[1].pick(); x = check('prière 03/12');
x.retour(); x = check('retour prière lieux');
assert(x.cartes[0].compte === '1/3' && /1 postes à pourvoir|2 postes à pourvoir/.test(x.aTraiter), 'carte prière 1/3 : ' + x.aTraiter);
x.cartes[1].ouvrir(); x = check('prière Champigny');
assert(x.dLecture && x.lignes.every(l => !l.peutChoisir) && x.dANote, 'Champigny en lecture, responsable à définir');
x.types = undefined;
x = check('re-render');
x.retour(); x = check('retour prière');
x.types[0].pick(); x = check('retour dimanche');
assert(x.dates[2].on && x.dates[2].label === '6 déc', 'date du dimanche conservée (6 déc)');

// 11. Onglets du bas
x.nav.equipe.pick(); x = check('équipe');
assert(x.showEquipe && x.nav.equipe.current === 'page', 'onglet équipe');
assert(x.groupes.length === 3, 'équipe : 3 lieux');
x.mins[0].pick(); x = check('équipe louange');
assert(x.groupes[0].items.length > 0, 'équipe louange du dimanche');
x.vues[1].pick(); x = check('toute l’équipe');
assert(x.eqTous && x.personnes.length > 20, 'toute l’équipe louange : ' + x.personnes.length);
x.nav.actus.pick(); x = check('actus');
assert(x.showActus && x.actus.length === 5, 'actus');
x.nav.moi.pick(); x = check('moi');
assert(x.showMoi && x.roles.length === 2, 'moi');
x.nav.planning.pick(); x = check('retour planning');
assert(x.showLieux, 'retour au planning sur l’écran 3 lieux');

// 12. Une feuille ouverte se ferme quand on change d'onglet
x.cartes[0].ouvrir(); x = check('stm');
const vide = x.lignes.find(l => l.peutChoisir);
if (vide) { vide.ouvrir(); x = check('feuille'); assert(x.sheetOuvert, 'feuille ouverte'); x.nav.equipe.pick(); x = check('onglet'); assert(!x.sheetOuvert, 'feuille fermée en changeant d’onglet'); }

// 13 bis. Inviter quand même une personne déjà ailleurs à la même heure
{
  const r = load(file, {});
  let y = r.c.renderVals();
  y.dates[1].pick(); y = r.c.renderVals();
  y.cartes[0].ouvrir(); y = r.c.renderVals();
  y.lignes.find(l => l.label === 'Voix').ouvrir(); y = r.c.renderVals();
  const emma = y.candidats.find(k => k.nom === 'Emma');
  assert(emma && emma.bloque && emma.raison === 'Sert à Champigny à 10h30 (voix)', 'raison du conflit : ' + (emma && emma.raison));
  emma.choisir(); y = r.c.renderVals();
  assert(!y.sheetOuvert && /conflit signalé : sert à Champigny à 10h30 \(voix\)\./.test(y.toast) && /garder les deux en justifiant/.test(y.toast), 'toast conflit signalé : ' + y.toast);
  const v = y.lignes.find(l => l.label === 'Voix');
  assert(v.rempli && v.nom === 'Emma' && v.sous === 'Invitation envoyée · conflit signalé' && v.sousColor === '#A12626', 'ligne voix : conflit signalé');
  assert(checkHoles(tpl, y).length === 0, 'trous après invitation forcée');
  y.lignes.find(l => l.label === 'Batterie').ouvrir(); y = r.c.renderVals();
  y.candLibres[0].choisir(); y = r.c.renderVals();
  assert(y.lignes.find(l => l.label === 'Batterie').sous === 'Invitation envoyée', 'invitation normale sans conflit');
  steps += 3;
}

// 13. Couleur principale (tweak)
const alt = load(file, { accent: '#0F766E' }).c.renderVals();
assert(alt.accent === '#0F766E' && alt.mins[0].bg === '#0F766E', 'tweak couleur');

console.log(steps + ' états vérifiés');
process.exit(report('Planning') ? 1 : 0);
