// Profil coordinateur (Thomas, louange Saint-Maurice) et validation par Hélène.
// Usage : node tests/test_coordinateur.js build/Coordinateur.dc.html build/Planning.dc.html
const { load, checkHoles, checkTags, assert, report, timers } = require('./dc_harness.js');
const fichierCoord = process.argv[2];
const fichierHelene = process.argv[3];
let steps = 0;
function ouvrir(file) {
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
const T = ouvrir(fichierCoord);
assert(checkTags(T.r.src).length === 0, 'balises : ' + checkTags(T.r.src).join(' | '));

// 1. Thomas arrive directement sur Saint-Maurice, louange
let x = T.v('arrivée Thomas');
assert(!x.showLieux && x.showDetail, 'pas d’écran 3 lieux, directement le planning');
assert(x.dTitre === 'Bonjour Thomas' && x.coordHeader && !x.aRetour, 'en-tête de Thomas, sans retour vers les 3 lieux');
assert(/Louange · Saint-Maurice · dimanche 22 novembre/.test(x.dSous), 'sous-titre : ' + x.dSous);
assert(x.initiale === 'T' && x.moiNom === 'Thomas' && !x.eqMins, 'identité Thomas');
assert(x.dEdit && x.lignes.length === 7, 'Thomas modifie la louange de Saint-Maurice');
assert(/^\d+%$/.test(x.dPct) && x.dPct === '57%', 'jauge : ' + x.dPct);
assert(x.aPropAttente && /2 propositions en attente de validation par Hélène \(29 nov\)/.test(x.propAttente), 'bandeau des propositions : ' + x.propAttente);
assert(x.aValider.length === 0, 'pas de bloc À valider chez Thomas');

// 2. 29 nov : ses propositions sont visibles et comptées
x.dates[1].pick(); x = T.v('29/11');
const voix = x.lignes.find(l => l.label === 'Voix');
assert(voix.rempli && voix.nom === 'Pierre' && voix.sous === 'Proposé · en attente de validation par Hélène', 'voix proposée : ' + voix.sous);
assert(/5 sur 7/.test(x.dCompte), 'compte avec propositions : ' + x.dCompte);

// 3. Thomas propose quelqu’un pour la basse
const basse = x.lignes.find(l => l.label === 'Basse');
assert(basse.vide && basse.peutChoisir, 'basse à pourvoir');
basse.ouvrir(); x = T.v('feuille basse');
assert(x.sheetOuvert && x.candLibres.length > 0, 'liste Choisir chez Thomas');
const nomBasse = x.candLibres[0].nom;
x.candLibres[0].choisir(); x = T.v('proposition basse');
assert(!x.sheetOuvert && /Proposition enregistrée/.test(x.toast) && /Hélène doit la valider/.test(x.toast), 'toast proposition : ' + x.toast);
assert(x.lignes.find(l => l.label === 'Basse').sous === 'Proposé · en attente de validation par Hélène', 'basse proposée');
assert(/3 propositions/.test(x.propAttente), 'bandeau à 3 : ' + x.propAttente);
assert(globalThis.__kerygmaPartage.invitations && Object.keys(globalThis.__kerygmaPartage.invitations).length === 0, 'rien n’est envoyé aux serviteurs avant validation');

// 4. Équipe, Moi
x.nav.equipe.pick(); x = T.v('équipe Thomas');
assert(x.groupes.length === 1 && /^Saint-Maurice/.test(x.groupes[0].titre), 'Thomas ne voit que Saint-Maurice dans Équipe');
x.nav.moi.pick(); x = T.v('moi Thomas');
assert(x.roles.length === 1 && /Coordinateur louange · Saint-Maurice/.test(x.roles[0].label), 'rôle de Thomas');
x.nav.planning.pick(); x = T.v('retour planning');
assert(x.showDetail && !x.showLieux, 'Planning ramène au planning de Saint-Maurice');

// 5. Hélène voit les 3 propositions et valide
const H = ouvrir(fichierHelene);
let h = H.v('Hélène');
assert(h.aValider.length === 1, 'un bloc À valider');
const items = h.aValider[0].items.map(i => i.poste + ':' + i.nom).join(',');
assert(items === 'Voix:Pierre,Batterie:Bérénice,Basse:' + nomBasse, 'propositions reçues : ' + items);
h.aValider[0].valider(); h = H.v('validé');
assert(h.aValider.length === 0 && /Planning validé/.test(h.toast) && /agendas/.test(h.toast), 'validation : ' + h.toast);
const inv = globalThis.__kerygmaPartage.invitations;
assert(Object.keys(inv).length === 3 && Object.values(inv).some(i => i.nom === 'Pierre'), 'invitations créées à la validation');
h.cartes[0].ouvrir(); h = H.v('Hélène détail');
h.dates[1].pick(); h = H.v('Hélène 29/11');
assert(h.lignes.find(l => l.label === 'Voix').nom === 'Pierre' && h.lignes.find(l => l.label === 'Voix').sous === 'Invitation envoyée', 'Pierre invité côté Hélène');
timers[timers.length - 1].fn(); h = H.v('toast effacé');
assert(!h.aToast, 'toast effacé');

// 6. Thomas voit la validation
x = T.v('Thomas après validation');
const voix2 = x.lignes.find(l => l.label === 'Voix');
assert(voix2.sous === 'Validé par Hélène · invitation envoyée' && voix2.sousColor === '#146C3A', 'Thomas voit « Validé par Hélène » : ' + voix2.sous);
assert(!x.aPropAttente, 'plus rien en attente');

// 7. Refus
const piano = x.lignes.find(l => l.label === 'Guitare électrique');
piano.ouvrir(); x = T.v('feuille guitare électrique');
x.candLibres[0].choisir(); x = T.v('proposition gel');
h = H.v('Hélène, nouvelle proposition');
h.retour(); h = H.v('Hélène 3 lieux');
assert(h.aValider.length === 1 && h.aValider[0].items.length === 1, 'nouvelle proposition à valider');
h.aValider[0].refuser(); h = H.v('refusé');
assert(h.aValider.length === 0 && /refusées/.test(h.toast), 'refus : ' + h.toast);
x = T.v('Thomas après refus');
const gel = x.lignes.find(l => l.label === 'Guitare électrique');
assert(gel.vide && gel.peutChoisir && /Refusé par Hélène/.test(gel.sous), 'Thomas voit le refus et peut reproposer : ' + gel.sous);

// 8. Si Hélène remplit elle-même un poste proposé, la proposition disparaît
globalThis.__kerygmaPartage = undefined;
const H2 = ouvrir(fichierHelene);
let h2 = H2.v('Hélène neuve');
h2.dates[1].pick(); h2 = H2.v('29/11');
h2.cartes[0].ouvrir(); h2 = H2.v('stm 29/11');
h2.lignes.find(l => l.label === 'Voix').ouvrir(); h2 = H2.v('feuille voix');
h2.candLibres[0].choisir(); h2 = H2.v('choix direct');
h2.retour(); h2 = H2.v('retour');
assert(h2.aValider.length === 1 && h2.aValider[0].items.length === 1 && h2.aValider[0].items[0].poste === 'Batterie', 'la voix n’est plus à valider');

console.log(steps + ' états vérifiés');
process.exit(report('Coordinateur') ? 1 : 0);
