// Profil coordinateur (Thomas, louange Saint-Maurice) et validation par Hélène.
// Usage : node tests/test_coordinateur.js build/Coordinateur.dc.html build/Planning.dc.html
const { load, checkHoles, checkTags, assert, report, timers } = require('./dc_harness.js');
const jour = (v, l) => v.dates.find(d => d.label === l); // un dimanche de la bande, par son libellé
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
assert(!x.aDTitre && x.coordHeader && !x.aRetour, 'en-tête de Thomas : sa puce de rôle, pas de « Bonjour », pas de retour');
assert(x.dSous === 'Ce dimanche 22 novembre · Louange · 10h30', 'sous-titre : ' + x.dSous);
assert(x.nav.afaire.badge === '2' && x.nav.afaire.aBadge, 'pastille À faire : compte rendu à remplir et échange à valider');
assert(x.protoLabel === 'Prototype coordinateur', 'étiquette en haut : ' + x.protoLabel);
assert(/<title>Kerygma, prototype coordinateur<\/title>/.test(T.r.src), 'titre de la page');
assert(x.initiale === 'T' && x.moiNom === 'Thomas' && !x.eqMins, 'identité Thomas');
assert(x.dEdit && x.lignes.length === 5 && x.groupesPostes[0].aAuto && !x.aDCompte, 'Thomas modifie la louange de Saint-Maurice ; bouton Auto sur la ligne VOIX, plus de compteur');
assert(x.aValider === undefined && x.aPropAttente === undefined && x.moisAValider.length === 0, 'plus de propositions à faire valider une par une');
assert(x.aMois && x.moisBlocTitre === 'Planning de novembre · Saint-Maurice' && /Hélène validera le mois/.test(x.moisEtat) && !x.aValiderMois, 'bloc du mois : Thomas ne valide pas : ' + x.moisEtat);

// 2. 29 nov : le planning envoyé
jour(x, '29 nov').pick(); x = T.v('29/11');
const voix = x.lignes.find(l => l.label === 'Voix');
assert(voix.rempli && voix.nom === 'Pierre' && voix.etat === 'normal' && !voix.aSous, 'Pierre aux voix, en attente de réponse');

// 3. Thomas ajoute une basse avec « + », choisit quelqu'un : brouillon, puis il envoie lui-même
x.groupesPostes[1].ajouter(); x = T.v('ajouter');
x.ajoutChoix.find(c => c.label === 'Basse').pick(); x = T.v('basse ajoutée');
const basse = x.lignes.find(l => l.label === 'Basse');
assert(basse.vide && basse.peutChoisir, 'basse sur Aucun');
basse.ouvrir(); x = T.v('feuille basse');
assert(x.sheetOuvert && x.candLibres.length > 0, 'liste Choisir chez Thomas');
const nomBasse = x.candLibres[0].nom;
x.candLibres[0].choisir(); x = T.v('basse choisie');
assert(!x.sheetOuvert && x.lignes.find(l => l.label === 'Basse').etat === 'brouillon' && x.lignes.find(l => l.label === 'Basse').sous === 'Pas encore envoyé', 'basse en brouillon');
assert(x.aEnvoi && x.envoiSous === '1 changement pas encore envoyé', 'bouton d’envoi : ' + x.envoiSous);
assert(Object.keys(globalThis.__kerygmaPartage.invitations).length === 0 && globalThis.__kerygmaPartage.notifs.length === 0, 'rien n’est envoyé avant le bouton');
// Hélène ne voit pas le brouillon de Thomas
{
  const Hb = ouvrir(fichierHelene);
  let hb = Hb.v('Hélène pendant le brouillon');
  jour(hb, '29 nov').pick(); hb = Hb.v('29/11'); hb.cartes[0].ouvrir(); hb = Hb.v('stm');
  assert(!hb.lignes.find(l => l.label === 'Basse') || hb.lignes.find(l => l.label === 'Basse').vide, 'le brouillon de Thomas reste chez Thomas');
  assert(!hb.aEnvoi && /pas encore envoyés/.test(hb.moisEtat), 'Hélène voit seulement qu’il y a des choix pas encore envoyés : ' + hb.moisEtat);
}
x.envoyerPlanning(); x = T.v('envoyé par Thomas');
assert(/Planning envoyé : 1 volontaire reçoit la demande\. Hélène est prévenue\./.test(x.toast), 'toast : ' + x.toast);
assert(x.lignes.find(l => l.label === 'Basse').sous === 'Demande envoyée' && !x.aEnvoi, 'basse : demande envoyée');
assert(Object.values(globalThis.__kerygmaPartage.invitations).some(i => i.nom === nomBasse), 'la demande part tout de suite, sans validation');

// 4. Équipe, Moi
x.nav.equipe.pick(); x = T.v('équipe Thomas');
assert(x.groupes.length === 1 && /^Saint-Maurice/.test(x.groupes[0].titre), 'Thomas ne voit que Saint-Maurice dans Équipe');
x.ouvrirMoi(); x = T.v('moi Thomas');
assert(x.roles.length === 1 && /Coordinateur louange · Saint-Maurice/.test(x.roles[0].label), 'rôle de Thomas');
x.nav.planning.pick(); x = T.v('retour planning');
assert(x.showDetail && !x.showLieux, 'Planning ramène au planning de Saint-Maurice');

// 5. Hélène est prévenue dans « À faire », voit le planning et valide le mois quand elle veut
const H = ouvrir(fichierHelene);
let h = H.v('Hélène');
assert(h.notifs.length === 1 && h.notifs[0].titre === 'Planning · Dimanche 29 novembre · Saint-Maurice' && h.notifs[0].texte === 'Thomas a envoyé le planning aux volontaires. Basse : ' + nomBasse + '.' && h.nav.afaire.badge === '2', 'Hélène prévenue : ' + (h.notifs[0] || {}).texte);
h.cartes[0].ouvrir(); h = H.v('Hélène détail');
jour(h, '29 nov').pick(); h = H.v('Hélène 29/11');
assert(h.lignes.find(l => l.label === 'Basse').nom === nomBasse && h.lignes.find(l => l.label === 'Basse').sous === 'Demande envoyée', 'la basse chez Hélène');
assert(h.aValiderMois && /4 réponses en attente/.test(h.moisEtat), 'Hélène peut valider même si tout n’est pas rempli : ' + h.moisEtat);
h.validerMois(); h = H.v('validé');
assert(/Planning de novembre validé à Saint-Maurice/.test(h.toast) && /agendas/.test(h.toast) && !h.aValiderMois, 'validation : ' + h.toast);
timers[timers.length - 1].fn(); h = H.v('toast effacé');
assert(!h.aToast, 'toast effacé');

// 6. Thomas voit la validation, et peut toujours modifier
x = T.v('Thomas après validation');
assert(/^Validé par Hélène\. Il reste modifiable/.test(x.moisEtat), 'Thomas voit « Validé par Hélène » : ' + x.moisEtat);
const nv = x.notifs.find(n => /Planning de novembre/.test(n.titre));
assert(nv && nv.tag === 'Planning validé' && /a validé le planning de novembre/.test(nv.texte), 'notification de validation : ' + (nv && nv.tag));

// 7. Après validation, Thomas change encore : Hélène est prévenue
x.groupesPostes[1].ajouter(); x = T.v('ajouter gel');
x.ajoutChoix.find(c => c.label === 'Guitare électrique').pick(); x = T.v('gel ajoutée');
x.lignes.find(l => l.label === 'Guitare électrique').ouvrir(); x = T.v('feuille guitare électrique');
const nomGel = x.candLibres[0].nom;
x.candLibres[0].choisir(); x = T.v('gel choisie');
x.envoyerPlanning(); x = T.v('gel envoyée');
h = H.v('Hélène, nouveau changement');
assert(h.notifs.filter(n => n.nouveau).length === 2 && h.notifs.some(n => /Guitare électrique : / .test(n.texte) && n.texte.indexOf(nomGel) >= 0), 'Hélène prévenue du changement après validation');
assert(globalThis.__kerygmaPartage.validations['stm|2026-11'], 'le mois reste validé');

// 8. Si Hélène modifie à son tour, c'est son propre brouillon, puis Thomas est prévenu à l'envoi
h.lignes.find(l => l.label === 'Batterie').ouvrir(); h = H.v('batterie Hélène');
h.candLibres[0].choisir(); h = H.v('batterie choisie');
x = T.v('Thomas pendant le brouillon d’Hélène');
assert(x.lignes.find(l => l.label === 'Batterie').nom === 'Bérénice' && !x.aEnvoi, 'Thomas voit toujours ce qui a été envoyé');
h.envoyerPlanning(); h = H.v('Hélène envoie');
assert(/Thomas est prévenu/.test(h.toast), 'toast : ' + h.toast);
x = T.v('Thomas après envoi d’Hélène');
assert(x.lignes.find(l => l.label === 'Batterie').nom !== 'Bérénice' && x.notifs.some(n => n.nouveau && /^Hélène a envoyé le planning aux volontaires\. Batterie : /.test(n.texte)), 'Thomas prévenu du changement d’Hélène');

// 9. Compte rendu de service du dernier dimanche (15 nov)
globalThis.__kerygmaPartage = undefined;
const T3 = ouvrir(fichierCoord);
let c = T3.v('Thomas, compte rendu');
assert(c.aCRCarte && c.crCarteTag === 'Après le culte' && c.crCarteTitre === 'Compte rendu du dimanche 15 novembre' && c.crCarteBouton === 'Remplir le compte rendu', 'notification du compte rendu');
c.nav.afaire.pick(); c = T3.v('À faire Thomas');
assert(c.showAFaire && c.aCRCarte && !c.aFaireVide, 'la carte du compte rendu est dans « À faire »');
c.ouvrirCR(); c = T3.v('formulaire');
assert(c.showCR && !c.showDetail && c.crForm && !c.crLecture && c.crRetourLabel === 'Retour à À faire', 'formulaire du compte rendu');
assert(c.crTitre === 'Saint-Maurice' && c.crSous === 'Dimanche 15 novembre · Louange · 10h30', 'titre : ' + c.crTitre + ' / ' + c.crSous);
assert(c.crPersonnes.map(p => p.nom).join() === 'Inès,Adrien,Chloé,Camille,Bérénice,Lucas', 'liste prévue : ' + c.crPersonnes.map(p => p.nom));
assert(c.crPersonnes.every(p => p.present === 'true' && p.sous === p.postes) && c.crCompte === '6 présents sur 6 prévus', 'tout le monde coché au départ');
assert(c.crPersonnes.every(p => p.msgAria === 'Écrire un message à ' + p.nom && !p.ouvert && !p.aEnvoye), 'bouton « Message » sur chaque personne');
c.crPersonnes.find(p => p.nom === 'Chloé').toggle(); c = T3.v('Chloé absente');
assert(c.crPersonnes.find(p => p.nom === 'Chloé').sous === 'Voix · absent' && c.crPersonnes.find(p => p.nom === 'Chloé').sousColor === '#A12626' && c.crCompte === '5 présents sur 6 prévus' && c.crCompteColor === '#A12626', 'Chloé décochée');
c.crPersonnes.find(p => p.nom === 'Chloé').toggle(); c = T3.v('Chloé recochée');
assert(c.crCompte === '6 présents sur 6 prévus', 'on peut recocher');
c.crPersonnes.find(p => p.nom === 'Chloé').toggle(); c = T3.v('Chloé absente 2');
c.saisirBien({ target: { value: 'Très bonne louange, belle unité' } });
c = T3.v('saisie');
c.saisirProb({ target: { value: 'Micro voix 2 qui grésille' } });
c = T3.v('saisie 2');
assert(c.crBien === 'Très bonne louange, belle unité' && c.crProb === 'Micro voix 2 qui grésille' && c.crAmel === '', 'commentaires saisis');
assert(!c.crTresBon, 'Très bon service désactivé par défaut');
// Message à une seule personne, depuis la liste
c.crPersonnes.find(p => p.nom === 'Lucas').ouvrirMsg(); c = T3.v('message à Lucas');
const pL = c.crPersonnes.find(p => p.nom === 'Lucas');
assert(pL.ouvert && pL.msgOuvert === 'true' && pL.envoyerLabel === 'Envoyer à Lucas' && c.crMsgP === 'Merci Lucas pour ton service dimanche !', 'message à Lucas ouvert : ' + c.crMsgP);
c.saisirMsgP({ target: { value: 'Super guitare dimanche, merci Lucas !' } });
c = T3.v('message à Lucas saisi');
c.crPersonnes.find(p => p.nom === 'Lucas').envoyerMsg(); c = T3.v('message à Lucas envoyé');
assert(/Message envoyé à Lucas/.test(c.toast) && !c.crPersonnes.find(p => p.nom === 'Lucas').ouvert, 'toast : ' + c.toast);
assert(c.crPersonnes.find(p => p.nom === 'Lucas').aEnvoye && /Message envoyé ✓ « Super guitare dimanche, merci Lucas ! »/.test(c.crPersonnes.find(p => p.nom === 'Lucas').envoyeTexte), 'message envoyé visible sur la ligne');
c.crPersonnes.find(p => p.nom === 'Chloé').ouvrirMsg(); c = T3.v('message à Chloé absente');
assert(c.crMsgP === 'Tu nous as manqué dimanche, Chloé. On pense à toi !', 'message par défaut pour une absente');
c.fermerMsgP(); c = T3.v('annuler');
assert(!c.crPersonnes.some(p => p.ouvert), 'annuler ferme le message');
assert(globalThis.__kerygmaPartage.mercis.length === 1 && globalThis.__kerygmaPartage.mercis[0].noms.join() === 'Lucas' && globalThis.__kerygmaPartage.mercis[0].mode === 'prive', 'un seul message, à Lucas');
// Très bon service : message à toute l'équipe, phrases toutes prêtes
c.toggleTresBon(); c = T3.v('très bon service');
assert(c.crTresBon && /toute l’équipe louange de Saint-Maurice/.test(c.crMerciNote) && c.crMsgT === '' && c.pretsVisibles, 'Très bon service : champ vide, les débuts proposés dedans');
assert(c.prets.length === 3 && c.prets.map(p => p.texte).join(' | ') === 'Merci à toute l’équipe pour dimanche ! | Quel beau service dimanche ! | Bravo à chacun pour votre engagement !', 'trois débuts de message');
c.prets[1].pick(); c = T3.v('début choisi');
assert(c.crMsgT === 'Quel beau service dimanche ! ' && !c.pretsVisibles, 'le début remplit le champ, les suggestions se cachent');
c.saisirMsgT({ target: { value: '' } }); c = T3.v('champ vidé');
assert(c.pretsVisibles, 'champ vidé : les débuts reviennent');
c.saisirMsgT({ target: { value: 'Quel beau service dimanche ! Belle unité.' } });
c = T3.v('message final');
c.envoyerCR(); c = T3.v('envoyé');
assert(c.nav.afaire.badge === '1', 'compte rendu fait : il reste l’échange');
assert(c.showAFaire && !c.showCR && /Compte rendu envoyé à Hélène/.test(c.toast) && /Merci envoyé à toute l’équipe/.test(c.toast), 'toast : ' + c.toast);
assert(c.crCarteTag === 'Compte rendu envoyé' && /5 présents, 1 absent · merci envoyé/.test(c.crCarteTexte) && c.crCarteBouton === 'Revoir', 'carte : ' + c.crCarteTexte);
const S9 = globalThis.__kerygmaPartage;
assert(S9.comptesRendus['15/11|stm|louange'] && S9.comptesRendus['15/11|stm|louange'].absents.join() === 'Chloé', 'compte rendu partagé');
assert(S9.mercis.length === 2 && S9.mercis[1].mode === 'equipe' && S9.mercis[1].noms.indexOf('Lucas') >= 0 && S9.mercis[1].noms.indexOf('Chloé') < 0, 'merci à l’équipe présente');
assert(S9.mercis[1].texte === 'Quel beau service dimanche ! Belle unité.', 'texte envoyé');
c.ouvrirCR(); c = T3.v('revoir');
assert(c.crLecture && !c.crForm && c.crAbsentsTexte === 'Chloé' && c.crTextes.length === 3 && c.crTextes.filter(t => t.aTexte).length === 2, 'Thomas relit son compte rendu');
c.retourCR(); c = T3.v('retour');
assert(c.showAFaire, 'retour à « À faire »');

// 10. Hélène reçoit les comptes rendus
const H3 = ouvrir(fichierHelene);
let e = H3.v('Hélène comptes rendus');
assert(e.aCRs && e.crListeTitre === 'Compte rendu de dimanche dernier', 'bloc comptes rendus');
assert(e.crListe.every(x => x.comTexte === 'Ajouter un commentaire' && x.statut === undefined), 'bulle « Ajouter un commentaire » sur chaque lieu, plus de Reçu / En attente : ' + e.crListe.map(x => x.comTexte));
assert(e.crListe[2].detailColor === '#8A5300' && e.crListe[0].detailColor === '#A12626', 'en attente en orange, absents en rouge');
assert(e.crListe[0].detail === 'Thomas · 1 absent' && e.crListe[2].detail === 'En attente de Marco', 'détails : ' + e.crListe.map(x => x.detail).join(' | '));
e.crListe[2].commenter(); e = H3.v('en attente');
assert(e.crFocusAttr === 'true', '« Ajouter un commentaire » ouvre le champ du commentaire');
assert(e.showCR && e.crEnAttente && !e.crLecture && !e.crForm && /Marco n’a pas encore rempli le compte rendu/.test(e.crAttenteTexte), 'Boulogne pas encore rempli, mais Hélène peut agir');
assert(e.crPeutCommenter && e.crComTitre === 'Commentaire pour Marco' && e.msgPersonnes.length > 0, 'Hélène peut commenter et écrire à Boulogne');
e.retourCR(); e = H3.v('retour');
e.crListe[0].ouvrir(); e = H3.v('ouvre Saint-Maurice');
assert(e.crFocusAttr === 'false', 'toucher le lieu ouvre le compte rendu sans le clavier');
assert(!e.crEnAttente && e.crPeutCommenter, 'Hélène peut commenter un compte rendu reçu');
assert(e.showCR && e.crLecture && e.crRetourLabel === 'Retour aux 3 lieux' && e.crHaut === 'Compte rendu · Thomas' && e.crPar === undefined, 'Hélène lit le compte rendu de Thomas : ' + e.crHaut);
assert(e.crPresentsTexte === 'Inès, Adrien, Camille, Bérénice, Lucas' && e.crAbsentsTexte === 'Chloé', 'présents et absents');
assert(e.crTextes.map(t => t.titre + (t.vide ? ' : Aucun' : '')).join() === 'Ce qui s’est bien passé,Problèmes,À améliorer : Aucun', 'les 3 rubriques, « Aucun » quand c’est vide : ' + e.crTextes.map(t => t.titre + (t.vide ? ' : Aucun' : '')).join());
assert(!e.crAMerci, 'les messages de Thomas à l’équipe ou à Lucas restent entre eux : Hélène ne les voit pas');
// Commentaire général pour Thomas
e.envoyerCom(); e = H3.v('commentaire vide');
assert(e.aErreurCom, 'commentaire vide refusé');
e.saisirCom({ target: { value: 'Belle préparation, pensez au micro de la voix 2' } });
e = H3.v('commentaire saisi');
e.envoyerCom(); e = H3.v('commentaire envoyé');
assert(/Commentaire envoyé à Thomas/.test(e.toast) && e.crCom === '' && e.aCRComs && e.crComs[0].de === 'Toi (Hélène)', 'commentaire envoyé : ' + e.toast);
{ let e2 = H3.r.c.renderVals(); e2.retourCR(); e2 = H3.v('liste après commentaire');
  assert(e2.crListe[0].comTexte === 'Commenté ✓' && e2.crListe[1].comTexte === 'Ajouter un commentaire', 'Saint-Maurice : « Commenté ✓ »');
  e2.crListe[0].ouvrir(); e = H3.v('retour au compte rendu'); }
// Message personnalisé à certaines personnes
assert(e.msgModes[0].on && !e.msgChoix && e.crMsg === '' && e.pretsHVisibles && e.pretsH.length === 3, 'message à toute l’équipe par défaut, champ vide avec trois débuts');
e.envoyerMsg(); e = H3.v('message vide');
assert(e.aErreurMsg && /choisis un début/.test(e.erreurMsg), 'message vide refusé : ' + e.erreurMsg);
e.pretsH[1].pick(); e = H3.v('début Hélène');
assert(e.crMsg === 'Quel beau service dimanche ! ' && !e.pretsHVisibles && !e.aErreurMsg, 'Hélène choisit un début');
e.msgModes[1].pick(); e = H3.v('certaines personnes');
assert(e.msgChoix && e.msgPersonnes.map(p => p.label).join() === 'Inès,Adrien,Chloé,Camille,Bérénice,Lucas', 'destinataires possibles : toute la liste prévue');
e.envoyerMsg(); e = H3.v('personne choisie ?');
assert(e.aErreurMsg && /au moins une personne/.test(e.erreurMsg), 'il faut choisir quelqu’un');
e.msgPersonnes.find(p => p.label === 'Lucas').pick(); e = H3.v('Lucas');
e.msgPersonnes.find(p => p.label === 'Chloé').pick(); e = H3.v('Chloé');
assert(e.msgPersonnes.filter(p => p.on).length === 2 && !e.aErreurMsg, 'deux personnes choisies');
e.saisirMsg({ target: { value: 'Merci à vous deux, très beau duo !' } });
e = H3.v('message');
e.envoyerMsg(); e = H3.v('message envoyé');
assert(/Message envoyé à Chloé, Lucas|Message envoyé à Lucas, Chloé/.test(e.toast) || /Message envoyé à Chloé, Lucas/.test(e.toast) || /Message envoyé à .*Lucas/.test(e.toast), 'toast : ' + e.toast);
const mH = globalThis.__kerygmaPartage.mercis.filter(m => m.de === 'Hélène');
assert(mH.length === 1 && mH[0].mode === 'prive' && mH[0].noms.join() === 'Chloé,Lucas' && mH[0].texte === 'Merci à vous deux, très beau duo !', 'message enregistré : ' + JSON.stringify(mH[0]));
assert(e.msgEnvoyes.length === 1 && e.msgEnvoyes[0].qui === 'Envoyé à Chloé, Lucas :' && e.msgEnvoyes[0].texte === '« Merci à vous deux, très beau duo ! »' && e.crMsg === '', 'Hélène voit ce qu’elle a envoyé, sur deux lignes');
e.msgModes[0].pick(); e = H3.v('équipe');
e.pretsH[0].pick(); e = H3.v('début équipe');
e.envoyerMsg(); e = H3.v('message équipe');
assert(globalThis.__kerygmaPartage.mercis.filter(m => m.de === 'Hélène' && m.mode === 'equipe' && m.noms.length === 6).length === 1 && /toute l’équipe de Saint-Maurice/.test(e.toast), 'message à toute l’équipe');
// Thomas voit le commentaire
let c2 = T3.v('Thomas après commentaire');
assert(c2.aCRComsCarte && /Hélène a commenté le service : « Belle préparation/.test(c2.crComsCarte), 'commentaire visible sur la carte de Thomas : ' + c2.crComsCarte);
c2.nav.afaire.pick(); c2.ouvrirCR(); c2 = T3.v('Thomas relit');
assert(c2.aCRComs && c2.crComs[0].de === 'Hélène, responsable louange' && !c2.crPeutCommenter, 'Thomas lit le commentaire, sans pouvoir écrire à sa place');
c2.retourCR(); c2 = T3.v('retour Thomas');
e.retourCR(); e = H3.v('retour 3 lieux');
assert(e.showLieux, 'retour aux 3 lieux');
e.crListe[1].ouvrir(); e = H3.v('Champigny');
assert(e.crLecture && e.crTextes.length === 3 && e.crAbsentsTexte === 'Pierre' && !e.crAMerci && e.crHaut === 'Compte rendu · Sylvie', 'compte rendu de Sylvie (exemple)');
e.mins[0].pick(); e.retourCR(); e = H3.v('programme');
assert(!e.aCRs, 'comptes rendus louange masqués sur le programme du culte');

// 11. Échanges entre serviteurs : Thomas valide
globalThis.__kerygmaPartage = undefined;
const T4 = ouvrir(fichierCoord);
let g = T4.v('Thomas échanges');
assert(g.echangesAValider.length === 1 && g.echangesAValider[0].titre === 'Batterie · dimanche 6 décembre', 'un échange à valider : ' + (g.echangesAValider[0] || {}).titre);
assert(/Bérénice n’est pas dispo et a demandé à Thaïs de prendre sa place\. Thaïs a accepté\./.test(g.echangesAValider[0].texte), 'texte de l’échange');
assert(g.echangesAttente.length === 1 && /Adrien a demandé à Lucas/.test(g.echangesAttente[0].texte) && /Pas encore de réponse de Lucas/.test(g.echangesAttente[0].texte), 'échange en attente de réponse');
g.echangesAValider[0].oui(); g = T4.v('échange validé');
assert(g.echangesAValider.length === 0 && /Échange validé : Thaïs remplace Bérénice le 6 décembre/.test(g.toast), 'toast : ' + g.toast);
jour(g, '6 déc').pick(); g = T4.v('6 déc');
const bat = g.lignes.find(l => l.label === 'Batterie');
assert(bat.nom === 'Thaïs' && bat.sous === 'Échange : Bérénice → Thaïs (Bérénice pas dispo)' && bat.sousColor === '#146C3A', 'planning changé : ' + bat.nom + ' / ' + bat.sous);
const H4 = ouvrir(fichierHelene);
let h4 = H4.v('Hélène voit l’échange');
jour(h4, '6 déc').pick(); h4 = H4.v('Hélène 6 déc');
h4.cartes[0].ouvrir(); h4 = H4.v('Hélène stm 6 déc');
assert(h4.lignes.find(l => l.label === 'Batterie').nom === 'Thaïs' && /Bérénice → Thaïs/.test(h4.lignes.find(l => l.label === 'Batterie').sous), 'Hélène voit l’échange validé');
assert(h4.echangesAValider.length === 0, 'Hélène n’a pas d’échange à valider (c’est le coordinateur)');
globalThis.__kerygmaPartage.echanges['13/12|stm|piano'] = { date: '13/12', lieu: 'stm', poste: 'piano', de: 'Hugo', par: 'Camille', etat: 'accepte' };
g = T4.v('deuxième échange');
assert(g.echangesAValider.length === 1 && g.echangesAValider[0].titre === 'Piano · dimanche 13 décembre', 'nouvel échange à valider');
g.echangesAValider[0].non(); g = T4.v('échange refusé');
assert(globalThis.__kerygmaPartage.echanges['13/12|stm|piano'].etat === 'refusee' && /Hugo garde son service du 13 décembre/.test(g.toast), 'refus : ' + g.toast);
jour(g, '13 déc').pick(); g = T4.v('13 déc');
assert(g.lignes.find(l => l.label === 'Piano').nom === 'Hugo', 'refusé : le planning ne change pas');
globalThis.__kerygmaPartage.echanges['06/12|cha|voix'] = { date: '06/12', lieu: 'cha', poste: 'voix', de: 'Joëlle', par: 'Mona', etat: 'accepte' };
g = T4.v('échange à Champigny');
assert(g.echangesAValider.length === 0, 'Thomas ne voit pas les échanges de Champigny');

// 12. Collecte des dispos de décembre (15 personnes : l'équipe de Saint-Maurice, Thaïs comprise depuis l'échange validé)
g.nav.equipe.pick(); g = T4.v('équipe Thomas collecte');
assert(g.aCollecte && g.colPasLancee && !g.colLancee && g.colTitre === 'Dispos de décembre', 'carte de collecte');
assert(/\(15 personnes\)/.test(g.colTexte) && /4 l’ont déjà fait à l’avance/.test(g.colTexte), 'texte avant lancement : ' + g.colTexte);
g.lancerCollecte(); g = T4.v('collecte lancée');
assert(g.colLancee && !g.colPasLancee && /Collecte lancée : 15 personnes/.test(g.toast), 'collecte lancée : ' + g.toast);
assert(/4 réponses sur 15/.test(g.colTexte) && g.colPct === '27%', 'progression : ' + g.colTexte + ' ' + g.colPct);
const resume = n => (g.colPersonnes.find(c => c.nom === n) || {}).resume;
assert(resume('Adrien') === 'Si besoin : 20 déc' && resume('Bérénice') === 'Pas dispo : 6 déc, 27 déc' && resume('Chloé') === 'Pas dispo : 13 déc · Si besoin : 27 déc' && resume('Lucas') === 'Pas encore répondu', 'résumés des dispos');
assert(g.colPersonnes.slice(0, 4).every(c => c.resume !== 'Pas encore répondu'), 'ceux qui ont répondu en premier');
assert(g.colPeutRelancer && g.colRelanceBouton === 'Relancer les 11 sans réponse', 'bouton relancer');
g.relancer(); g = T4.v('relance');
assert(/Rappel envoyé aux 11 personnes/.test(g.toast) && /rappel envoyé/.test(g.colTexte), 'relance');
globalThis.__kerygmaPartage.dispos.Lucas = { '06/12': 'dispo', '13/12': 'dispo', '20/12': 'dispo', '27/12': 'dispo' };
g = T4.v('Lucas répond');
assert(/5 réponses sur 15/.test(g.colTexte) && resume('Lucas') === 'Dispo tous les dimanches', 'réponse de Lucas reçue');
assert(!H4.v('Hélène équipe').aCollecte, 'collecte réservée au coordinateur');
// Les dispos reçues apparaissent dans la liste Choisir
g.nav.planning.pick(); g = T4.v('planning');
jour(g, '27 déc').pick(); g = T4.v('27 déc');
globalThis.__kerygmaPartage.dispos['Thaïs'] = { '27/12': 'sibesoin' };
g.lignes.find(l => l.label === 'Batterie').ouvrir(); g = T4.v('Choisir batterie 27 déc');
const tagsDe = n => ((g.candLibres.find(c => c.nom === n) || {}).tags || []).map(t => t.texte);
assert(tagsDe('Bérénice').indexOf('Indisponible ce jour-là') >= 0, 'Bérénice : pas dispo dans sa grille');
assert(tagsDe('Thaïs').indexOf('Si besoin seulement') >= 0, 'Thaïs : si besoin');

// 13. Tâches : Thomas confie une tâche à quelqu'un du planning (une par personne, modifiable)
globalThis.__kerygmaPartage = undefined;
const T5 = ouvrir(fichierCoord);
let k = T5.v('Thomas tâches');
jour(k, '29 nov').pick(); k = T5.v('29 nov');
const gac = k.lignes.find(l => l.label === 'Guitare acoustique');
assert(gac.aTache && gac.tacheTexte === 'Tâche : installer et brancher le matériel' && gac.tacheColor === '#5B5F6B' && gac.etat === 'ok', 'tâche de démonstration, en petit et gris ; Lucas a confirmé : ' + gac.tacheTexte);
assert(k.aTachesCulte === undefined && k.tachesCulte === undefined, 'plus de résumé des tâches du culte');
assert(k.lignes.filter(l => l.peutTache).length === 5 && k.lignes.every(l => l.tacheOff === 'false'), '« Tâche » sur chaque personne');
const dir = k.lignes.find(l => l.label === 'Direction');
assert(dir.tacheAria === 'Donner une tâche à Olivier' && gac.tacheAria === 'Modifier la tâche de Lucas', 'libellés accessibles : ' + dir.tacheAria + ' / ' + gac.tacheAria);
dir.ajouterTache(); k = T5.v('feuille tâche');
assert(k.tacheOuverte && !k.sheetOuvert && k.tacheSous === 'Direction · Saint-Maurice · Dimanche 29 novembre' && k.tacheAucune === 'true' && k.tacheBouton === 'Enregistrer', 'feuille « Tâche » : ' + k.tacheSous);
k.saisirTache({ target: { value: 'Nettoyer la salle après le culte, avec Pierre' } });
k = T5.v('tâche écrite');
k.enregistrerTache(); k = T5.v('tâche envoyée');
assert(!k.tacheOuverte && k.toast === 'Tâche envoyée à Olivier.', 'toast : ' + k.toast);
const tS = () => globalThis.__kerygmaPartage.taches;
assert(tS().length === 2 && tS()[1].nom === 'Olivier' && tS()[1].par === 'Thomas' && tS()[1].titre === 'Nettoyer la salle après le culte, avec Pierre' && tS()[1].poste === 'direction' && !tS()[1].fait, 'tâche enregistrée');
// Modifier la tâche de Lucas (déjà là) : pas de doublon, la case « faite » repart à zéro
k.lignes.find(l => l.label === 'Guitare acoustique').ajouterTache(); k = T5.v('tâche Lucas');
assert(k.tacheTexte === 'Installer et brancher le matériel' && k.tacheAucune === 'false', 'tâche existante dans la feuille');
k.saisirTache({ target: { value: 'Installer le matériel à 8h45' } }); k.enregistrerTache(); k = T5.v('modifiée');
assert(tS().filter(t => t.nom === 'Lucas').length === 1 && tS()[0].titre === 'Installer le matériel à 8h45' && tS()[0].message === '' && /modifiée/.test(k.toast), 'tâche de Lucas modifiée');
// Aucune tâche : retire la tâche d'Olivier
k.lignes.find(l => l.label === 'Direction').ajouterTache(); k = T5.v('Olivier');
k.choisirAucuneTache(); k.enregistrerTache(); k = T5.v('Olivier sans tâche');
assert(!k.lignes.find(l => l.label === 'Direction').aTache && tS().length === 1, 'Aucune tâche : retirée');
k.lignes.find(l => l.label === 'Piano').ajouterTache(); k = T5.v('piano');
k.fermerTache(); k = T5.v('fermée');
assert(!k.tacheOuverte && tS().length === 1, 'fermer sans enregistrer');
// Hélène voit la tâche sur la ligne et peut en donner une
const H5 = ouvrir(fichierHelene);
let h5 = H5.v('Hélène tâches');
jour(h5, '29 nov').pick(); h5 = H5.v('29');
h5.cartes[0].ouvrir(); h5 = H5.v('stm 29');
assert(/installer le matériel à 8h45/.test(h5.lignes.find(l => l.label === 'Guitare acoustique').tacheTexte), 'Hélène voit la tâche');
h5.lignes.find(l => l.label === 'Piano').ajouterTache(); h5 = H5.v('Hélène feuille');
h5.saisirTache({ target: { value: 'Préparer les accords' } }); h5.enregistrerTache(); h5 = H5.v('Hélène envoie');
assert(tS().length === 2 && tS()[1].par === 'Hélène' && tS()[1].nom === 'Inès', 'tâche d’Hélène');

// 13 bis. Thomas change une personne ou met « Aucun », envoie ; Hélène est prévenue ; Thomas est prévenu des changements d'Hélène
k.lignes.find(l => l.label === 'Direction').ouvrir(); k = T5.v('changer Olivier');
assert(k.sheetOuvert && k.aOptionAucun && !k.aSheetNote, 'liste avec Aucun, sans petit message');
k.candLibres.find(c => c.nom === 'Malik').choisir(); k = T5.v('Malik choisi');
let dk = k.lignes.find(l => l.label === 'Direction');
assert(dk.nom === 'Malik' && dk.etat === 'brouillon' && dk.sous === 'Pas encore envoyé', 'remplacement en brouillon : ' + dk.nom);
k.lignes.find(l => l.label === 'Piano').ouvrir(); k = T5.v('piano');
assert(k.aOptionAucun && k.aucunTexte === 'Retirer Inès : personne à ce poste', 'Aucun pour retirer Inès');
k.choisirAucun(); k = T5.v('piano aucun');
const bk = k.lignes.find(l => l.label === 'Piano');
assert(bk.etat === 'aucun' && bk.nomTexte === 'Aucun' && bk.sous === 'Pas encore envoyé : retrait de Inès', 'Aucun en brouillon : ' + bk.sous);
k.envoyerPlanning(); k = T5.v('envoyé');
h5 = H5.v('Hélène voit');
h5.nav.afaire.pick(); h5 = H5.v('Hélène À faire');
const n29 = h5.notifs.find(n => /29 novembre/.test(n.titre));
assert(n29 && /Direction : Malik ; retrait de Olivier/.test(n29.texte) && /Piano : retrait de Inès/.test(n29.texte), 'Hélène voit le remplacement et Aucun : ' + (n29 && n29.texte));
n29.vu(); h5 = H5.v('vu');
h5.nav.planning.pick(); h5 = H5.v('planning');
assert(h5.lignes.find(l => l.label === 'Direction').nom === 'Malik' && h5.lignes.find(l => l.label === 'Piano').etat === 'aucun', 'Malik à la direction, Aucun au piano');
assert(!h5.lignes.some(l => l.nom === 'Olivier'), 'Olivier n’est plus sur le planning');
// Hélène change la batterie du 29 : Thomas est prévenu dans « À faire » à l'envoi
h5.lignes.find(l => l.label === 'Batterie').ouvrir(); h5 = H5.v('batterie Hélène');
h5.candLibres[0].choisir(); h5 = H5.v('batterie choisie');
h5.envoyerPlanning(); h5 = H5.v('batterie envoyée');
k = T5.v('Thomas après Hélène');
assert(k.nav.afaire.aBadge && k.notifs.length === 1 && k.notifs[0].nouveau && /^Hélène a envoyé le planning aux volontaires\. Batterie : /.test(k.notifs[0].texte) && k.notifs[0].titre === 'Planning · Dimanche 29 novembre · Saint-Maurice', 'Thomas prévenu : ' + (k.notifs[0] || {}).texte);
const avantVu = k.nav.afaire.badge;
k.notifs[0].vu(); k = T5.v('vu');
assert(!k.notifs[0].nouveau && k.notifs[0].tag === 'Changement vu' && Number(k.nav.afaire.badge || 0) === Number(avantVu) - 1, 'Vu : la pastille baisse');

// 14. Calendrier du mois (bouton « Mois »)
k = T5.v('avant mois');
assert(k.moisFerme && !k.moisOuvert, 'bande des dates par défaut');
k.toggleMois(); k = T5.v('mois ouvert');
assert(k.moisOuvert && !k.moisFerme && k.moisTitre === 'Novembre 2026', 'mois du dimanche affiché : ' + k.moisTitre);
assert(k.moisEntetes.map(e => e.l).join('') === 'LMMJVSD' && k.moisCases.length === 36 && k.moisCases.slice(0, 6).every(c => c.inactif), 'grille : lundi en premier, 1er novembre un dimanche');
const actifs = k.moisCases.filter(c => c.actif);
assert(actifs.map(c => c.n).join() === '1,8,15,22,29' && actifs[4].on === 'true' && actifs[3].on === 'false', 'dimanches cliquables (passés compris), 29 sélectionné');
assert(actifs.filter(c => c.n !== '8').every(c => c.bg === '#FFFFFF' && !c.aPoint) && !/pourvoir/.test(actifs[4].aria), 'plus de vert ni de rouge');
assert(actifs[1].bg === '#4338CA' && /tu sers/.test(actifs[1].aria) && k.moisLegende[0].texte === 'Je sers', 'Thomas a servi le 8 novembre : en violet');
assert(k.moisPrecOff === 'false' && k.moisSuivOff === 'false', 'flèches');
k.moisPrec(); k = T5.v('octobre');
assert(k.moisTitre === 'Octobre 2026', 'on peut remonter dans le passé');
k.moisSuiv(); k = T5.v('novembre'); k.moisSuiv(); k = T5.v('décembre');
assert(k.moisTitre === 'Décembre 2026' && k.moisCases.filter(c => c.actif).map(c => c.n).join() === '6,13,20,27' && k.moisSuivOff === 'false', 'décembre, puis 2027');
k.moisCases.find(c => c.n === '13' && c.actif).pick(); k = T5.v('13 déc');
assert(/Dimanche 13 décembre/.test(k.dSous) && k.moisOuvert && k.moisCases.find(c => c.n === '13' && c.actif).on === 'true', 'choisir un dimanche dans le mois');
k.toggleMois(); k = T5.v('réduit');
assert(k.moisFerme && k.dates.find(d => d.on).label === '13 déc', 'retour à la bande, date gardée');
// Jours où l'on sert : violet
globalThis.__kerygmaPartage.invitations['dimanche|20/12|cha|louange|gac'] = { nom: 'Thomas', raison: '' };
k.toggleMois(); k = T5.v('Thomas sert le 20');
const c20 = k.moisCases.find(c => c.n === '20' && c.actif);
assert(c20.bg === '#4338CA' && c20.fg === '#FFFFFF' && /tu sers/.test(c20.aria), 'jour où Thomas sert en violet');
assert(k.moisLegende[0].texte === 'Je sers', 'légende « Je sers » quand on sert');

// 15. Bouton Auto chez Thomas : remplit son brouillon, il envoie
globalThis.__kerygmaPartage = undefined;
const T6 = ouvrir(fichierCoord);
let a = T6.v('Thomas auto');
a.lancerAuto(); a = T6.v('auto Thomas');
const pianoT = a.lignes.find(l => l.label === 'Piano');
assert(pianoT.etat === 'brouillon' && pianoT.nom && /Auto a ajouté 1 nom au brouillon/.test(a.toast) && a.aEnvoi, 'Auto met un pianiste dans le brouillon le 22/11 : ' + a.toast);
const pianiste = pianoT.nom;
a.envoyerPlanning(); a = T6.v('auto envoyé');
assert(/Planning envoyé : 1 volontaire reçoit la demande/.test(a.toast) && a.lignes.find(l => l.label === 'Piano').sous === 'Demande envoyée', 'pianiste demandé');
const H6 = ouvrir(fichierHelene);
let h6 = H6.v('Hélène auto');
assert(h6.notifs.some(n => /22 novembre/.test(n.titre) && n.texte.indexOf('Piano : ' + pianiste) >= 0), 'Hélène prévenue du pianiste');
h6.cartes[0].ouvrir(); h6 = H6.v('stm');
assert(h6.lignes.find(l => l.label === 'Piano').nom === pianiste, 'le pianiste est sur le planning');
// Lucas en pause : Auto ne le propose plus
globalThis.__kerygmaPartage.prefs.Lucas = { freq: 0 };
a = T6.v('pause Lucas');
jour(a, '20 déc').pick(); a = T6.v('20 déc');
a.lancerAuto(); a = T6.v('auto 20 déc');
assert(a.lignes.filter(l => l.etat === 'brouillon').every(l => l.nomTexte !== 'Lucas'), 'Lucas en pause n’est pas proposé');

console.log(steps + ' états vérifiés');
process.exit(report('Coordinateur') ? 1 : 0);
