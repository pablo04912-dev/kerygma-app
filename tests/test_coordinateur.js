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
assert(x.protoLabel === 'Prototype coordinateur', 'étiquette en haut : ' + x.protoLabel);
assert(/<title>Kerygma, prototype coordinateur<\/title>/.test(T.r.src), 'titre de la page');
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

// 9. Compte rendu de service du dernier dimanche (15 nov)
globalThis.__kerygmaPartage = undefined;
const T3 = ouvrir(fichierCoord);
let c = T3.v('Thomas, compte rendu');
assert(c.aCRCarte && c.crCarteTag === 'Après le culte' && c.crCarteTitre === 'Compte rendu du dimanche 15 novembre' && c.crCarteBouton === 'Remplir le compte rendu', 'notification du compte rendu');
c.ouvrirCR(); c = T3.v('formulaire');
assert(c.showCR && !c.showDetail && c.crForm && !c.crLecture && c.crRetourLabel === 'Planning', 'formulaire du compte rendu');
assert(/Louange · Saint-Maurice · dimanche 15 novembre · 10h30/.test(c.crSous), 'sous-titre : ' + c.crSous);
assert(c.crPersonnes.map(p => p.nom).join() === 'Inès,Adrien,Chloé,Lucas,Camille,Bérénice', 'liste prévue : ' + c.crPersonnes.map(p => p.nom));
assert(c.crPersonnes.every(p => p.present === 'true' && p.etat === 'Présent') && c.crCompte === '6 présents sur 6 prévus', 'tout le monde coché au départ');
c.crPersonnes.find(p => p.nom === 'Chloé').toggle(); c = T3.v('Chloé absente');
assert(c.crPersonnes.find(p => p.nom === 'Chloé').etat === 'Absent' && c.crCompte === '5 présents sur 6 prévus' && c.crCompteColor === '#A12626', 'Chloé décochée');
c.crPersonnes.find(p => p.nom === 'Chloé').toggle(); c = T3.v('Chloé recochée');
assert(c.crCompte === '6 présents sur 6 prévus', 'on peut recocher');
c.crPersonnes.find(p => p.nom === 'Chloé').toggle(); c = T3.v('Chloé absente 2');
c.saisirBien({ target: { value: 'Très bonne louange, belle unité' } });
c = T3.v('saisie');
c.saisirProb({ target: { value: 'Micro voix 2 qui grésille' } });
c = T3.v('saisie 2');
assert(c.crBien === 'Très bonne louange, belle unité' && c.crProb === 'Micro voix 2 qui grésille' && c.crAmel === '', 'commentaires saisis');
assert(!c.crTresBon, 'Très bon service désactivé par défaut');
c.toggleTresBon(); c = T3.v('très bon service');
assert(c.crTresBon && c.crMercis.length === 2 && c.crMercis[0].on && /merci personnel/.test(c.crMerciNote), 'Très bon service : merci en privé par défaut');
c.crMercis[1].pick(); c = T3.v('merci équipe');
assert(c.crMercis[1].on && /toute l’équipe louange de Saint-Maurice/.test(c.crMerciNote), 'merci à toute l’équipe');
c.crMercis[0].pick(); c = T3.v('merci privé');
c.envoyerCR(); c = T3.v('envoyé');
assert(c.showDetail && !c.showCR && /Compte rendu envoyé à Hélène/.test(c.toast) && /Merci envoyé en privé à 5 serviteurs/.test(c.toast), 'toast : ' + c.toast);
assert(c.crCarteTag === 'Compte rendu envoyé' && /5 présents, 1 absent · merci envoyé/.test(c.crCarteTexte) && c.crCarteBouton === 'Revoir', 'carte : ' + c.crCarteTexte);
const S9 = globalThis.__kerygmaPartage;
assert(S9.comptesRendus['15/11|stm|louange'] && S9.comptesRendus['15/11|stm|louange'].absents.join() === 'Chloé', 'compte rendu partagé');
assert(S9.mercis.length === 1 && S9.mercis[0].mode === 'prive' && S9.mercis[0].noms.indexOf('Lucas') >= 0 && S9.mercis[0].noms.indexOf('Chloé') < 0, 'merci aux présents seulement');
c.ouvrirCR(); c = T3.v('revoir');
assert(c.crLecture && !c.crForm && c.crAbsentsTexte === 'Chloé' && c.crTextes.length === 2, 'Thomas relit son compte rendu');
c.retourCR(); c = T3.v('retour');
assert(c.showDetail, 'retour au planning');

// 10. Hélène reçoit les comptes rendus
const H3 = ouvrir(fichierHelene);
let e = H3.v('Hélène comptes rendus');
assert(e.aCRs && e.crListeTitre === 'Comptes rendus · dimanche 15 novembre', 'bloc comptes rendus');
assert(e.crListe.map(x => x.statut).join() === 'Reçu,Reçu,En attente', 'statuts : ' + e.crListe.map(x => x.statut));
assert(e.crListe[0].detail === 'Thomas · 1 absent' && e.crListe[2].detail === 'En attente de Marco', 'détails : ' + e.crListe.map(x => x.detail).join(' | '));
e.crListe[2].ouvrir(); e = H3.v('en attente');
assert(!e.showCR && /Marco n’a pas encore rempli/.test(e.toast), 'Boulogne pas encore rempli');
e.crListe[0].ouvrir(); e = H3.v('ouvre Saint-Maurice');
assert(e.showCR && e.crLecture && e.crRetourLabel === 'Les 3 lieux' && /Rempli par Thomas/.test(e.crPar), 'Hélène lit le compte rendu de Thomas');
assert(e.crPresentsTexte === 'Inès, Adrien, Lucas, Camille, Bérénice' && e.crAbsentsTexte === 'Chloé', 'présents et absents');
assert(e.crTextes.map(t => t.titre).join() === 'Ce qui s’est bien passé,Problèmes' && e.crAMerci && /en privé/.test(e.crMerciTexte), 'commentaires et merci');
e.retourCR(); e = H3.v('retour 3 lieux');
assert(e.showLieux, 'retour aux 3 lieux');
e.crListe[1].ouvrir(); e = H3.v('Champigny');
assert(e.crLecture && e.crTextes.length === 3 && e.crAbsentsTexte === 'Pierre' && /toute l’équipe/.test(e.crMerciTexte), 'compte rendu de Sylvie (exemple)');
e.mins[1].pick(); e.retourCR(); e = H3.v('programme');
assert(!e.aCRs, 'comptes rendus louange masqués sur le programme du culte');

console.log(steps + ' états vérifiés');
process.exit(report('Coordinateur') ? 1 : 0);
