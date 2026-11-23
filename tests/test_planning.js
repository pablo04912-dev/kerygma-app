const { load, checkHoles, checkTags, assert, report, timers } = require('./dc_harness.js');
const jour = (v, l) => v.dates.find(d => d.label === l); // un dimanche de la bande, par son libellé
const file = process.argv[2];
globalThis.__kerygmaPartage = undefined;
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
assert(x.moisAValider.length === 1 && x.moisAValider[0].titre === 'Planning de novembre · Boulogne' && /Tu peux valider si c’est bon pour toi/.test(x.moisAValider[0].texte), 'À faire : Boulogne novembre est rempli, à valider');
assert(x.aValider === undefined && x.aPropAttente === undefined, 'plus de propositions une par une');
assert(x.protoLabel === 'Prototype responsable', 'étiquette en haut : ' + x.protoLabel);
assert(x.aRetour && !x.coordHeader && x.initiale === 'H' && x.moiNom === 'Hélène Moreau' && x.eqMins, 'profil Hélène');
assert(x.showLieux && !x.showDetail, 'écran 3 lieux au départ');
assert(x.cartes.length === 3, '3 cartes');
assert(x.cartes.map(k => k.manque).join(' | ') === 'Inès, Adrien, Bérénice | Marco, Joëlle, Héloïse, Thaïs, Ismaël | Kenza, Noé, Damien' && !x.cartes.some(k => k.aCompte), 'cartes louange : qui sert, sans compteur : ' + x.cartes.map(k => k.manque).join(' | '));
assert(x.cartes.every(k => k.edit), 'Hélène modifie les 3 lieux en louange');
assert(jour(x, '22 nov').on && jour(x, '22 nov').label === '22 nov', 'date par défaut 22 nov');
assert(x.aSecTitre && x.secTitre === 'Ce dimanche 22 novembre' && !x.aTraiterVisible, 'titre « Ce dimanche 22 novembre », plus de postes vides : ' + x.secTitre);
assert(x.nav.planning.current === 'page' && x.nav.equipe.current === 'false', 'nav planning active');
assert(x.nav.afaire.aBadge && x.nav.afaire.badge === '1' && /1 chose à faire/.test(x.nav.afaire.aria), 'pastille À faire : 1 (le planning de Boulogne à valider)');
assert(x.crListeTitre === 'Compte rendu de dimanche dernier', 'comptes rendus : ' + x.crListeTitre);
assert(x.mins.map(m => m.label).join() === 'Programme culte,Louange' && x.mins[1].on, 'Programme culte en premier, Louange choisi');
assert(x.aSuivants === undefined && x.suivants === undefined && !/Dimanches suivants/.test(src), 'plus de « Dimanches suivants » sur l’accueil');
assert(x.nav.aIndic && x.nav.indicPos === '0', 'bulle grise sous Planning');
assert(x.types[0].ligne === x.accent && x.types[1].ligne === 'transparent', 'onglets Culte / Prière soulignés');

// 2. Changer de date sur l'accueil
jour(x, '29 nov').pick(); x = check('date 29/11');
assert(jour(x, '29 nov').on, '29 nov sélectionné');
assert(x.aCRs && x.crListeTitre === 'Compte rendu de dimanche dernier', 'quel que soit le dimanche choisi, le compte rendu de dimanche dernier reste en 2e');
assert(x.secTitre === 'Dimanche 29 novembre' && x.cartes[0].manque === 'Olivier, Pierre, Inès, Bérénice, Lucas' && !x.cartes[0].aAValider && x.cartes[0].aTaches && x.cartes[0].tachesTexte === '1 tâche', 'carte du 29/11 : équipe, tâche : ' + x.cartes[0].manque);

// 3. Ouvrir Saint-Maurice : la date reste
x.cartes[0].ouvrir(); x = check('détail stm 29/11');
assert(x.showDetail && !x.showLieux, 'écran détail');
assert(x.dTitre === 'Saint-Maurice', 'titre détail');
assert(/29 novembre/.test(x.dSous), 'la date suit dans le détail : ' + x.dSous);
assert(jour(x, '29 nov').on, 'bandeau de dates conservé avec 29 nov');
assert(x.lignes.length === 5 && x.groupesPostes.map(g => g.titre + ':' + g.lignes.map(l => l.label).join('/')).join(' | ') === 'Voix:Direction/Voix | Instruments:Piano/Batterie/Guitare acoustique', 'postes de base : ' + x.groupesPostes.map(g => g.titre + ':' + g.lignes.map(l => l.label).join('/')).join(' | '));
assert(!x.aDCompte && !x.aBarreDetail && x.groupesPostes.every(g => g.aAjout), 'plus de compteur ni de « Modifiable » ; « + » dans chaque partie');
assert(x.groupesPostes[0].aAuto && !x.groupesPostes[1].aAuto, 'Auto sur la ligne VOIX, à droite');
assert(/data-groupe style="display: flex; flex-direction: column; gap: 10px"/.test(src) && /aria-label="Postes" style="display: flex; flex-direction: column; gap: 28px/.test(src), 'mêmes espacements pour VOIX et INSTRUMENTS');
const voix = x.lignes.find(l => l.label === 'Voix');
assert(voix.rempli && voix.nom === 'Pierre' && voix.etat === 'normal' && !voix.aSous, 'Pierre aux voix le 29/11, en attente de réponse');
assert(x.aMois && x.moisBlocTitre === 'Planning de novembre · Saint-Maurice' && /3 réponses en attente/.test(x.moisEtat) && x.aValiderMois && x.validerMoisLabel === 'Valider le planning de novembre' && !x.aEnvoi, 'bloc du mois : réponses en attente, on peut valider quand on veut : ' + x.moisEtat);

// 4. Changer de date dans le détail : on reste dans Saint-Maurice
jour(x, '22 nov').pick(); x = check('détail stm 22/11');
assert(x.showDetail && x.dTitre === 'Saint-Maurice' && /^Ce dimanche 22 novembre · Louange/.test(x.dSous), 'date changée dans le détail : ' + x.dSous);
const piano = x.lignes.find(l => l.label === 'Piano');
assert(piano.vide && piano.peutChoisir && piano.etat === 'aucun' && piano.nomTexte === 'Aucun', 'piano vide le 22/11 : « Aucun » par défaut');

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
jour(x, '29 nov').pick(); x = check('stm 29/11');
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
assert(byName('Lucas').histo === '2 semaines sans service', 'Lucas : 2 semaines sans service : ' + byName('Lucas').histo);
assert(!byName('Pierre'), 'Pierre, déjà à ce poste, n’est pas dans la liste');
assert(byName('Malik').histo === 'Pas de service récent', 'Malik : pas de service récent');
assert(x.candLibres.every(k => k.aHisto && k.histo.length > 0), 'chaque personne libre a son historique');
// Tri : ceux qui ont le moins servi en premier
const pos = n => x.candLibres.findIndex(k => k.nom === n);
assert(pos('Malik') < pos('Lucas') && pos('Lucas') < pos('Kenza') && pos('Kenza') < pos('Adrien'), 'tri : le moins servi en haut');
// Étiquettes indispo et fréquence max
assert(byName('Chloé').tags.some(t => t.texte === 'Indisponible ce jour-là' && t.bg === '#FBE7E7'), 'Chloé indisponible (rouge clair)');
assert(byName('Inès').tags.some(t => /fois ce mois-ci \(max 2\)/.test(t.texte)), 'Inès : fréquence max atteinte');
assert(byName('Olivier').tags.some(t => t.texte === 'Déjà à la direction ici' && t.bg === '#F1EFEA'), 'Olivier : déjà à la direction ici (gris)');

// 7. Choisir Noé aux voix à la place de Pierre : brouillon, puis « Envoyer le planning aux volontaires »
byName('Noé').choisir(); x = check('après choix');
assert(!x.sheetOuvert, 'feuille fermée après choix');
let voix2 = x.lignes.find(l => l.label === 'Voix');
assert(voix2.rempli && voix2.nom === 'Noé' && voix2.etat === 'brouillon' && voix2.sous === 'Pas encore envoyé', 'Noé en brouillon, pas encore envoyé');
assert(!globalThis.__kerygmaPartage.invitations[Object.keys(globalThis.__kerygmaPartage.brouillons)[0]], 'aucune demande envoyée tant qu’on n’a pas envoyé');
assert(!globalThis.__kerygmaPartage.notifs.length, 'personne n’est prévenu');
assert(x.aEnvoi && x.envoiSous === '2 changements pas encore envoyés' && /des choix pas encore envoyés/.test(x.moisEtat), 'barre « Envoyer le planning aux volontaires » : ' + x.envoiSous);
assert(/Envoyer le planning aux volontaires/.test(src) && /position: sticky; bottom: 88px/.test(src), 'bouton d’envoi collé au-dessus de la barre du bas');
// Quitter la page sans envoyer : on demande
x.retour(); x = check('quitter ?');
assert(x.showDetail && x.quitterOuvert && /2 changements ne sont pas encore envoyés/.test(x.quitterTexte) && /aucun volontaire ne reçoit de demande/.test(x.quitterTexte), 'question avant de quitter : ' + x.quitterTexte);
x.resterPage(); x = check('rester');
assert(x.showDetail && !x.quitterOuvert, 'on reste sur la page');
x.envoyerPlanning(); x = check('envoyé');
voix2 = x.lignes.find(l => l.label === 'Voix');
assert(voix2.nom === 'Noé' && voix2.etat === 'normal' && voix2.sous === 'Demande envoyée' && !x.aEnvoi, 'Noé : demande envoyée');
assert(/Planning envoyé/.test(x.toast) && /Thomas est prévenu/.test(x.toast), 'toast envoi : ' + x.toast);
{
  const S = globalThis.__kerygmaPartage;
  assert(Object.keys(S.brouillons).length === 0 && Object.values(S.invitations).some(i => i.nom === 'Noé'), 'brouillon vidé, demande envoyée à Noé');
  assert(S.notifs.length === 1 && S.notifs[0].pour === 'Thomas' && S.notifs[0].date === '29/11', 'Thomas prévenu du changement');
}
timers[timers.length - 1].fn(); x = check('toast effacé');
assert(!x.aToast, 'toast disparaît');

// 8. Le choix se répercute sur Boulogne : Noé est maintenant aussi le matin à Saint-Maurice
x.retour(); x = check('retour 3 lieux');
assert(x.showLieux && jour(x, '29 nov').on, 'retour aux 3 lieux, date 29/11 conservée');
assert(/Noé/.test(x.cartes[0].manque), 'Noé apparaît sur la carte de Saint-Maurice : ' + x.cartes[0].manque);
x.cartes[2].ouvrir(); x = check('détail Boulogne 29/11');
x.lignes.find(l => l.label === 'Voix').ouvrir(); x = check('feuille voix Boulogne');
const rubB = x.candidats.find(k => k.nom === 'Noé');
assert(rubB && rubB.libre && /Saint-Maurice/.test(rubB.info), 'Noé vu comme aussi à Saint-Maurice le matin (compatible) : ' + (rubB && rubB.info));
x.fermer(); x.retour(); x = check('retour');

// 9. Programme du culte
x.mins[0].pick(); x = check('programme 29/11');
assert(x.cartes[0].edit && x.cartes[1].lecture && x.cartes[2].lecture, 'programme : Saint-Maurice modifiable, autres en lecture');
assert(x.cartes[0].compte === '5/5', 'programme stm 29/11 complet : ' + x.cartes[0].compte);
assert(!x.cartes[1].aCompte && /pas encore rempli/.test(x.cartes[1].manque), 'Champigny sans programme');
jour(x, '6 déc').pick(); x = check('programme 06/12');
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
assert(cene.aToggle && cene.nonOn && cene.nomTexte === 'Pas ce dimanche' && cene.nomFixe && !cene.peutChoisir, 'Sainte Cène : Non par défaut, bouton Oui/Non');
const avant = x.dCompte;
cene.pickOui(); x = check('cène oui');
cene = x.lignes.find(l => l.label === 'Sainte Cène');
assert(cene.ouiOn && cene.vide && cene.nomTexte === 'Personne' && cene.peutChoisir, 'Oui : « Personne », bouton pour choisir');
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
assert(cene.nonOn && !cene.rempli && cene.nomTexte === 'Pas ce dimanche' && !/sur 6/.test(x.dCompte), 'Non : retirée du compte');
cene.pickOui(); x = check('cène oui à nouveau');
assert(x.lignes.find(l => l.label === 'Sainte Cène').nom === 'Samir Girard', 'le nom revient si on remet Oui');
x.lignes.find(l => l.label === 'Sainte Cène').pickNon(); x = check('cène non 2');
jour(x, '13 déc').pick(); x = check('autre dimanche');
assert(x.lignes.find(l => l.label === 'Sainte Cène').nonOn, 'le choix Oui/Non est propre à chaque dimanche');
jour(x, '6 déc').pick(); x = check('retour 6 déc');
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
assert(jour(x, '6 déc').on && jour(x, '6 déc').label === '6 déc', 'date du dimanche conservée (6 déc)');

// 11. Onglets du bas
x.nav.equipe.pick(); x = check('équipe');
assert(x.showEquipe && x.nav.equipe.current === 'page', 'onglet équipe');
assert(x.groupes.length === 3, 'équipe : 3 lieux');
x.mins[1].pick(); x = check('équipe louange');
assert(x.groupes[0].items.length > 0, 'équipe louange du dimanche');
x.vues[1].pick(); x = check('toute l’équipe');
assert(x.eqTous && x.personnes.length > 20, 'toute l’équipe louange : ' + x.personnes.length);
x.nav.actus.pick(); x = check('actus');
assert(x.showActus && x.actus.length === 5, 'actus');
x.ouvrirMoi(); x = check('moi');
assert(x.showMoi && x.roles.length === 2 && x.profilCurrent === 'page', 'la bulle H ouvre « Moi »');
x.nav.planning.pick(); x = check('retour planning');
assert(x.showLieux, 'retour au planning sur l’écran 3 lieux');

// 12. Une feuille ouverte se ferme quand on change d'onglet
x.cartes[0].ouvrir(); x = check('stm');
const vide = x.lignes.find(l => l.peutChoisir);
if (vide) { vide.ouvrir(); x = check('feuille'); assert(x.sheetOuvert, 'feuille ouverte'); x.nav.equipe.pick(); x = check('onglet'); assert(!x.sheetOuvert, 'feuille fermée en changeant d’onglet'); }

// 13 bis. Inviter quand même une personne déjà ailleurs à la même heure
{
  globalThis.__kerygmaPartage = undefined;
  const r = load(file, {});
  let y = r.c.renderVals();
  jour(y, '29 nov').pick(); y = r.c.renderVals();
  y.cartes[0].ouvrir(); y = r.c.renderVals();
  y.lignes.find(l => l.label === 'Voix').ouvrir(); y = r.c.renderVals();
  const emma = y.candidats.find(k => k.nom === 'Emma');
  assert(emma && emma.bloque && emma.raison === 'Sert à Champigny à 10h30 (voix)', 'raison du conflit : ' + (emma && emma.raison));
  emma.choisir(); y = r.c.renderVals();
  let v = y.lignes.find(l => l.label === 'Voix');
  assert(!y.sheetOuvert && v.rempli && v.nom === 'Emma' && v.etat === 'brouillon' && v.sous === 'Pas encore envoyé · conflit signalé' && v.sousColor === '#A12626', 'ligne voix : brouillon, conflit signalé');
  assert(checkHoles(tpl, y).length === 0, 'trous après choix forcé');
  y.lignes.find(l => l.label === 'Batterie').ouvrir(); y = r.c.renderVals();
  y.candLibres[0].choisir(); y = r.c.renderVals();
  assert(y.lignes.find(l => l.label === 'Batterie').sous === 'Pas encore envoyé', 'choix normal sans conflit');
  y.envoyerPlanning(); y = r.c.renderVals();
  v = y.lignes.find(l => l.label === 'Voix');
  assert(v.sous === 'Conflit signalé' && v.sousColor === '#A12626' && y.lignes.find(l => l.label === 'Batterie').sous === 'Demande envoyée', 'après envoi : conflit signalé et demande envoyée');
  assert(globalThis.__kerygmaPartage.invitations[Object.keys(globalThis.__kerygmaPartage.invitations).find(k => /voix/.test(k))].raison === 'Sert à Champigny à 10h30 (voix)', 'la demande à Emma porte la raison du conflit');
  steps += 4;
}

// 13. Couleur principale (tweak)
const alt = load(file, { accent: '#0F766E' }).c.renderVals();
assert(alt.accent === '#0F766E' && alt.mins[1].bg === '#0F766E', 'tweak couleur');

// 14. Lignes du planning : nom ou « Personne », « Aucun », remplacement, tâche unique
{
  globalThis.__kerygmaPartage = undefined;
  const r = load(file, {});
  const V = l => { const y = r.c.renderVals(); const e = checkHoles(tpl, y); assert(e.length === 0, l + ' : ' + e.join(' | ')); steps++; return y; };
  let y = V('départ 14');
  y.cartes[0].ouvrir(); y = V('Saint-Maurice 22/11');
  const dir = y.lignes.find(l => l.label === 'Direction');
  assert(dir.etat === 'ok' && dir.iconeOk && dir.nomTexte === 'Inès' && dir.nomFond === '#E7F5EC', 'Inès a confirmé : bulle verte avec coche');
  const bat = y.lignes.find(l => l.label === 'Batterie');
  assert(bat.etat === 'normal' && !bat.iconeOk && bat.peutTache && bat.tacheOff === 'false', 'Bérénice pas encore confirmée : neutre, tâche possible');
  let pia = y.lignes.find(l => l.label === 'Piano');
  assert(pia.vide && pia.nomTexte === 'Aucun' && pia.etat === 'aucun' && pia.peutChoisir && !pia.peutTache && pia.tacheOff === 'true', 'piano : « Aucun », tâche grisée');
  pia.ouvrir(); y = V('feuille piano');
  assert(!y.aOptionAucun && !y.aSheetNote && !y.aRetirerPoste, 'poste vide : pas d’option Aucun ni de petit message');
  y.candLibres.find(k => k.nom === 'Hugo').choisir(); y = V('Hugo au piano');
  assert(y.lignes.find(l => l.label === 'Piano').nom === 'Hugo' && y.lignes.find(l => l.label === 'Piano').etat === 'brouillon' && !globalThis.__kerygmaPartage.notifs.length, 'Hugo au piano en brouillon, personne n’est encore prévenu');
  // « Aucun » : retirer quelqu'un
  y.lignes.find(l => l.label === 'Piano').ouvrir(); y = V('feuille piano 2');
  assert(y.aOptionAucun && y.aucunTexte === 'Retirer Hugo : personne à ce poste', 'option Aucun pour retirer Hugo');
  y.choisirAucun(); y = V('aucun piano');
  pia = y.lignes.find(l => l.label === 'Piano');
  assert(pia.vide && pia.nomTexte === 'Aucun' && !pia.peutTache && !y.aEnvoi, 'piano : de nouveau Aucun, plus rien à envoyer');
  // Changer une personne : Hélène remplace Bérénice, Thomas est prévenu
  y.lignes.find(l => l.label === 'Batterie').ouvrir(); y = V('feuille batterie');
  y.candLibres.find(k => k.nom === 'Thaïs' || k.nom === 'Lucas').choisir(); y = V('batterie changée');
  const nb = y.lignes.find(l => l.label === 'Batterie');
  assert(nb.nom !== 'Bérénice' && nb.rempli && nb.etat === 'brouillon' && y.envoiSous === '2 changements pas encore envoyés', 'Bérénice remplacée dans le brouillon : ' + nb.nom);
  const S = globalThis.__kerygmaPartage;
  assert(S.notifs.length === 0, 'Thomas pas encore prévenu');
  // « + » : ajouter une basse, une 2e voix et un instrument personnalisé, puis retirer
  y.groupesPostes[1].ajouter(); y = V('ajouter instrument');
  assert(y.ajoutOuvert && y.ajoutTitre === 'Ajouter un instrument' && y.ajoutChoix.map(c => c.label).join() === 'Basse,Guitare électrique', 'feuille « Ajouter un instrument »');
  y.ajoutChoix[0].pick(); y = V('basse ajoutée');
  let basse = y.lignes.find(l => l.label === 'Basse');
  assert(!y.ajoutOuvert && basse && basse.nomTexte === 'Aucun' && basse.groupe === 'instr' && /Basse ajouté/.test(y.toast), 'basse ajoutée, sur Aucun');
  y.groupesPostes[0].ajouter(); y = V('ajouter voix');
  assert(y.ajoutTitre === 'Ajouter une voix' && y.ajoutChoix.map(c => c.label).join() === 'Voix', 'feuille « Ajouter une voix »');
  y.ajoutChoix[0].pick(); y = V('2e voix');
  assert(y.groupesPostes[0].lignes.map(l => l.label + ':' + (l.nom || 'Aucun')).join() === 'Direction:Inès,Voix:Adrien,Voix:Aucun', '2e voix : ' + y.groupesPostes[0].lignes.map(l => l.label + ':' + (l.nom || 'Aucun')).join());
  y.groupesPostes[1].ajouter(); y = V('instrument perso');
  y.ajouterPerso(); y = V('perso vide');
  assert(y.aErreurAjout && y.ajoutOuvert, 'nom obligatoire');
  y.saisirAjout({ target: { value: 'violon' } }); y.ajouterPerso(); y = V('violon');
  const violon = y.lignes.find(l => l.label === 'Violon');
  assert(violon && violon.groupe === 'instr' && violon.peutChoisir, 'instrument personnalisé « Violon »');
  violon.ouvrir(); y = V('feuille violon');
  assert(y.sheetTitre === 'Violon' && y.candLibres.length > 10 && y.aRetirerPoste, 'violon : toute l’équipe louange proposée, on peut retirer le poste');
  y.retirerPoste(); y = V('violon retiré');
  assert(!y.lignes.find(l => l.label === 'Violon') && y.toast === 'Poste retiré.', 'violon retiré');
  y.groupesPostes[0].lignes[2].ouvrir(); y = V('feuille 2e voix');
  assert(y.aRetirerPoste, 'la 2e voix peut être retirée');
  y.retirerPoste(); y = V('2e voix retirée');
  assert(y.groupesPostes[0].lignes.length === 2, 'retour à une voix');
  // Bouton Auto : remplit le brouillon pour les places vides (basse et piano)
  y.lancerAuto(); y = V('auto');
  const basseA = y.lignes.find(l => l.label === 'Basse'), pianoA = y.lignes.find(l => l.label === 'Piano');
  assert(basseA.nom === 'Yasmine' && basseA.etat === 'brouillon' && pianoA.etat === 'brouillon' && /Auto a ajouté 2 noms au brouillon/.test(y.toast), 'Auto : 2 noms dans le brouillon : ' + y.toast);
  assert(['Inès', 'Lucas', 'Thaïs', 'Adrien'].indexOf(pianoA.nom) < 0, 'Auto ne met pas quelqu’un qui sert déjà ce culte : ' + pianoA.nom);
  assert(S.notifs.length === 0 && y.aEnvoi && y.envoiSous === '4 changements pas encore envoyés', 'rien d’envoyé : ' + y.envoiSous);
  y.lancerAuto(); y = V('auto plein');
  assert(/Tous les postes ont déjà quelqu’un/.test(y.toast), 'plus rien à remplir');
  y.envoyerPlanning(); y = V('envoyé');
  assert(!y.aEnvoi && /Planning envoyé : 3 volontaires reçoivent la demande\. Thomas est prévenu/.test(y.toast), 'envoi : ' + y.toast);
  assert(S.notifs.length === 1 && S.notifs[0].pour === 'Thomas' && /Basse : Yasmine/.test(S.notifs[0].resume) && /retrait de Bérénice/.test(S.notifs[0].resume), 'Thomas prévenu en une fois : ' + S.notifs[0].resume);
  assert(y.lignes.find(l => l.label === 'Basse').sous === 'Demande envoyée', 'basse : demande envoyée');
  // Tâche : une seule par personne, « Aucune tâche » par défaut, modifiable
  y.lignes.find(l => l.label === 'Voix').ajouterTache(); y = V('feuille tâche');
  assert(y.tacheOuverte && y.tacheTitreFeuille === 'Tâche pour Adrien' && y.tacheAucune === 'true' && y.tacheTexte === '', 'feuille tâche : Aucune tâche par défaut');
  y.saisirTache({ target: { value: 'Préparer la liste des chants' } }); y = V('tâche écrite');
  assert(y.tacheAucune === 'false', 'texte écrit : « Aucune tâche » n’est plus choisi');
  y.enregistrerTache(); y = V('tâche enregistrée');
  let vx = y.lignes.find(l => l.label === 'Voix');
  assert(!y.tacheOuverte && vx.aTache && vx.tacheTexte === 'Tâche : préparer la liste des chants' && vx.tacheColor === '#5B5F6B' && vx.tacheFond === '#EEF0FF', 'tâche en petit et gris sous la ligne');
  assert(/Tâche envoyée à Adrien/.test(y.toast) && y.aTachesCulte === undefined, 'plus de résumé des tâches');
  vx.ajouterTache(); y = V('rouvrir tâche');
  assert(y.tacheTexte === 'Préparer la liste des chants', 'la tâche se retrouve dans la feuille');
  y.saisirTache({ target: { value: 'Préparer la liste des chants et les envoyer samedi' } }); y.enregistrerTache(); y = V('tâche modifiée');
  assert(S.taches.filter(t => t.nom === 'Adrien').length === 1 && /samedi/.test(y.lignes.find(l => l.label === 'Voix').tacheTexte) && /modifiée/.test(y.toast), 'modifiée, pas de doublon');
  y.lignes.find(l => l.label === 'Voix').ajouterTache(); y = V('rouvrir');
  y.choisirAucuneTache(); y = V('aucune tâche');
  assert(y.tacheAucune === 'true' && y.tacheTexte === '', 'Aucune tâche choisie');
  y.enregistrerTache(); y = V('tâche retirée');
  assert(!y.lignes.find(l => l.label === 'Voix').aTache && /retirée/.test(y.toast), 'tâche retirée');
  // Calendrier : plus de vert ni de rouge (« Aucun » n'est pas « à pourvoir »)
  y.toggleMois(); y = V('mois');
  const c22 = y.moisCases.find(k => k.actif && k.n === '22');
  assert(c22.bg === '#FFFFFF' && !c22.aPoint && c22.border === '#16181D', 'case du 22 : blanche, bord noir car affichée');
  assert(y.moisLegende.length === 0 && !y.aLegende, 'pas de légende quand Hélène ne sert pas');
  y.toggleMois(); y = V('mois fermé');
  // Valider le mois à tout moment, depuis le planning
  assert(y.aMois && y.aValiderMois && /en attente/.test(y.moisEtat), 'Saint-Maurice novembre : réponses en attente, validable quand même');
  y.validerMois(); y = V('novembre validé');
  assert(!y.aValiderMois && /^Validé par Hélène\. Il reste modifiable/.test(y.moisEtat) && /Planning de novembre validé à Saint-Maurice/.test(y.toast) && /agendas/.test(y.toast), 'novembre validé : ' + y.moisEtat);
  assert(S.validations['stm|2026-11'] && S.notifs.some(n => n.pour === 'Thomas' && n.mois === '2026-11'), 'Thomas prévenu de la validation');
  // Après validation, on peut toujours modifier
  y.lignes.find(l => l.label === 'Batterie').ouvrir(); y = V('feuille batterie après validation');
  assert(y.sheetOuvert, 'toujours modifiable après validation');
  y.fermer(); y = V('fermer');
  // « Non, plus tard » : on part, le brouillon reste
  y.lignes.find(l => l.label === 'Basse').ouvrir(); y = V('feuille basse');
  y.choisirAucun(); y = V('basse aucun');
  assert(y.aEnvoi, 'retrait de Yasmine en brouillon');
  y.nav.equipe.pick(); y = V('quitter vers équipe');
  assert(y.quitterOuvert && y.showDetail, 'question avant de quitter');
  y.quitterSans(); y = V('non, plus tard');
  assert(y.showEquipe && !y.quitterOuvert && Object.keys(S.brouillons).length === 1, 'parti sans envoyer, brouillon gardé');
  y.nav.planning.pick(); y = V('retour planning');
  y.cartes[0].ouvrir(); y = V('Saint-Maurice à nouveau');
  assert(y.aEnvoi && /Pas encore envoyé : retrait de Yasmine/.test(y.lignes.find(l => l.label === 'Basse').sous), 'le brouillon est toujours là : ' + y.lignes.find(l => l.label === 'Basse').sous);
  // « Oui, envoyer » depuis la question
  y.retour(); y = V('quitter 2');
  y.quitterEnvoyer(); y = V('oui, envoyer');
  assert(y.showLieux && !y.quitterOuvert && Object.keys(S.brouillons).length === 0 && /Planning envoyé/.test(y.toast), 'envoyé en partant');
  // « À faire » : le planning de Boulogne est rempli
  y.nav.afaire.pick(); y = V('à faire');
  assert(y.showAFaire && y.moisAValider.length === 1 && /Planning de novembre · Boulogne/.test(y.moisAValider[0].titre), 'onglet À faire : Boulogne à valider');
  y.moisAValider[0].valider(); y = V('Boulogne validé');
  assert(!y.nav.afaire.aBadge && y.aFaireVide && S.validations['bou|2026-11'] && S.notifs.some(n => n.pour === 'Marco' && n.mois === '2026-11'), 'plus rien à faire, Marco prévenu');
}

// 15. Bande des dates : 2 mois à la fois, flèches avant / après, « Mois » fixe, dimanches passés en lecture
{
  globalThis.__kerygmaPartage = undefined;
  const r = load(file, {});
  const V = l => { const y = r.c.renderVals(); const e = checkHoles(tpl, y); assert(e.length === 0, l + ' : ' + e.join(' | ')); steps++; return y; };
  let y = V('départ 15');
  const libs = v => v.bande.map(b => b.marqueur ? '[' + (b.haut ? b.haut + ' ' : '') + b.bas + ']' : b.label).join(' ');
  assert(libs(y) === '[Novembre] 1 nov 8 nov 15 nov 22 nov 29 nov [Décembre] 6 déc 13 déc 20 déc 27 déc', 'novembre et décembre : ' + libs(y));
  assert(y.aFenPrec && y.aFenSuiv && y.fenSuivAria === 'Deux mois après : janvier et février 2027' && y.fenPrecAria === 'Deux mois avant : septembre et octobre', 'flèches : ' + y.fenPrecAria + ' / ' + y.fenSuivAria);
  assert(/<div data-bande[^>]*>\s*<button[^>]*aria-label="Voir le mois"[\s\S]*?<\/button>\s*<nav aria-label="Dates"/.test(src), '« Mois » reste fixe, hors de la bande qui défile');
  assert(/data-fenetre="\{\{fenetreCle\}\}"/.test(src) && /data-visible="\{\{d\.visible\}\}"/.test(src), 'la bande se replace quand on change de 2 mois');
  // Flèche « après » : janvier et février 2027, on revient au début
  y.fenSuiv(); y = V('janvier-février 2027');
  assert(libs(y) === '[janvier 2027] 3 janv 10 janv 17 janv 24 janv 31 janv [Février] 7 févr 14 févr 21 févr 28 févr', 'janvier et février 2027 : ' + libs(y));
  assert(y.secTitre === 'Dimanche 3 janvier' && y.dates[0].on, 'le premier dimanche de janvier est choisi');
  y.fenSuiv(); y = V('mars-avril 2027');
  assert(y.bande[0].haut === 'mars' && y.bande[0].bas === '2027' && y.secTitre === 'Dimanche 7 mars', 'mars 2027 : ' + y.secTitre);
  y.bande.find(b => b.marqueur && b.bas === 'Avril').pick(); y = V('avril');
  assert(y.secTitre === 'Dimanche 4 avril', 'la pastille Avril va au premier dimanche d’avril : ' + y.secTitre);
  y.toggleMois(); y = V('calendrier avril');
  assert(y.moisTitre === 'Avril 2027' && y.moisCases.filter(c => c.actif).map(c => c.n).join() === '4,11,18,25', 'calendrier avril 2027 : ' + y.moisTitre);
  y.toggleMois(); y = V('calendrier fermé');
  // Flèche « avant » : on revient au dimanche le plus proche (ce dimanche 22 novembre)
  y.fenPrec(); y = V('retour janvier'); y.fenPrec(); y = V('retour novembre');
  assert(y.secTitre === 'Ce dimanche 22 novembre' && jour(y, '22 nov').on, 'retour au dimanche le plus proche : ' + y.secTitre);
  // Le passé : septembre et octobre, en lecture
  y.fenPrec(); y = V('septembre-octobre');
  assert(libs(y) === '[Septembre] 6 sept 13 sept 20 sept 27 sept [Octobre] 4 oct 11 oct 18 oct 25 oct' && y.secTitre === 'Dimanche 25 octobre', 'le dernier dimanche passé est choisi : ' + y.secTitre);
  assert(y.cartes[0].manque === 'Tania, Pierre, Chloé, Bérénice, Inès' && !y.cartes[0].lecture, 'qui a servi le 25 octobre : ' + y.cartes[0].manque);
  assert(y.aCRs && y.crListeTitre === 'Compte rendu de dimanche dernier', 'le compte rendu de dimanche dernier reste là');
  y.cartes[0].ouvrir(); y = V('détail 25 oct');
  assert(y.dLecture && y.dLectureTexte === 'Dimanche passé' && !y.aEnvoi && !y.aMois && y.lignes.every(l => !l.peutChoisir) && !y.groupesPostes[0].aAuto, 'dimanche passé : on consulte, on ne modifie plus');
  assert(y.lignes.find(l => l.label === 'Direction').nom === 'Tania', 'Tania à la direction le 25 octobre');
  // Tout au début (janvier 2026), pas de flèche « avant » ; tout à la fin (décembre 2027), pas de flèche « après »
  for (let i = 0; i < 6 && y.aFenPrec; i++) { y.fenPrec(); y = V('avant ' + i); }
  assert(!y.aFenPrec && y.dates[0].label === '4 janv', 'premier dimanche : 4 janvier 2026');
  for (let i = 0; i < 12 && y.aFenSuiv; i++) { y.fenSuiv(); y = V('après ' + i); }
  assert(!y.aFenSuiv && y.dates[y.dates.length - 1].label === '26 déc' && y.bande[0].bas === '2027', 'dernier dimanche : 26 décembre 2027');
  y.cartes[0].ouvrir(); y = V('détail 2027');
  assert(y.lignes.length === 5 && y.lignes.every(l => l.vide && l.peutChoisir), 'un dimanche de 2027 : postes de base, tous sur Aucun');
  // La prière garde sa bande (jeudis), sans flèches
  y.retour(); y = V('retour'); y.types[1].pick(); y = V('prière');
  assert(!y.aFenPrec && !y.aFenSuiv && !y.bande.some(b => b.marqueur) && y.dates[0].label === '26 nov', 'prière : les jeudis, sans flèches');
}

{
  globalThis.__kerygmaPartage = undefined;
  const r = load(file, {}); let y = r.c.renderVals(); y.ouvrirMoi(); y = r.c.renderVals();
  assert(y.roles.some(ro => /valide le planning de chaque mois/.test(ro.detail)) && !y.roles.some(ro => /propositions/.test(ro.detail)), 'Moi : plus de « propositions » dans le rôle d’Hélène');
}
console.log(steps + ' états vérifiés');
process.exit(report('Planning') ? 1 : 0);
