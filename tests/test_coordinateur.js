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
assert(c.crMsgT === 'Très bon service dimanche, merci pour ton service !', 'message par défaut (privé) : ' + c.crMsgT);
c.crMercis[1].pick(); c = T3.v('équipe');
assert(c.crMsgT === 'Très bon service dimanche, merci à tous !', 'message par défaut (équipe)');
c.crMercis[0].pick(); c = T3.v('privé');
c.saisirMsgT({ target: { value: 'Merci pour cette belle louange, vous étiez au top !' } });
c = T3.v('message changé');
assert(c.crMsgT === 'Merci pour cette belle louange, vous étiez au top !', 'message personnalisé');
c.envoyerCR(); c = T3.v('envoyé');
assert(c.showDetail && !c.showCR && /Compte rendu envoyé à Hélène/.test(c.toast) && /Merci envoyé en privé à 5 serviteurs/.test(c.toast), 'toast : ' + c.toast);
assert(c.crCarteTag === 'Compte rendu envoyé' && /5 présents, 1 absent · merci envoyé/.test(c.crCarteTexte) && c.crCarteBouton === 'Revoir', 'carte : ' + c.crCarteTexte);
const S9 = globalThis.__kerygmaPartage;
assert(S9.comptesRendus['15/11|stm|louange'] && S9.comptesRendus['15/11|stm|louange'].absents.join() === 'Chloé', 'compte rendu partagé');
assert(S9.mercis.length === 1 && S9.mercis[0].mode === 'prive' && S9.mercis[0].noms.indexOf('Lucas') >= 0 && S9.mercis[0].noms.indexOf('Chloé') < 0, 'merci aux présents seulement');
assert(S9.mercis[0].texte === 'Merci pour cette belle louange, vous étiez au top !', 'texte personnalisé envoyé');
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
assert(e.showCR && e.crEnAttente && !e.crLecture && !e.crForm && /Marco n’a pas encore rempli le compte rendu/.test(e.crAttenteTexte), 'Boulogne pas encore rempli, mais Hélène peut agir');
assert(e.crPeutCommenter && e.crComTitre === 'Commentaire pour Marco' && e.msgPersonnes.length > 0, 'Hélène peut commenter et écrire à Boulogne');
e.retourCR(); e = H3.v('retour');
e.crListe[0].ouvrir(); e = H3.v('ouvre Saint-Maurice');
assert(!e.crEnAttente && e.crPeutCommenter, 'Hélène peut commenter un compte rendu reçu');
assert(e.showCR && e.crLecture && e.crRetourLabel === 'Les 3 lieux' && /Rempli par Thomas/.test(e.crPar), 'Hélène lit le compte rendu de Thomas');
assert(e.crPresentsTexte === 'Inès, Adrien, Lucas, Camille, Bérénice' && e.crAbsentsTexte === 'Chloé', 'présents et absents');
assert(e.crTextes.map(t => t.titre).join() === 'Ce qui s’est bien passé,Problèmes' && e.crAMerci && /en privé/.test(e.crMerciTexte), 'commentaires et merci');
// Commentaire général pour Thomas
e.envoyerCom(); e = H3.v('commentaire vide');
assert(e.aErreurCom, 'commentaire vide refusé');
e.saisirCom({ target: { value: 'Belle préparation, pensez au micro de la voix 2' } });
e = H3.v('commentaire saisi');
e.envoyerCom(); e = H3.v('commentaire envoyé');
assert(/Commentaire envoyé à Thomas/.test(e.toast) && e.crCom === '' && e.aCRComs && e.crComs[0].de === 'Toi (Hélène)', 'commentaire envoyé : ' + e.toast);
// Message personnalisé à certaines personnes
assert(e.msgModes[0].on && !e.msgChoix && e.crMsg === 'Très bon service dimanche, merci pour votre engagement !', 'message à toute l’équipe par défaut');
e.msgModes[1].pick(); e = H3.v('certaines personnes');
assert(e.msgChoix && e.msgPersonnes.map(p => p.label).join() === 'Inès,Adrien,Chloé,Lucas,Camille,Bérénice', 'destinataires possibles : toute la liste prévue');
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
assert(e.msgEnvoyes.length === 1 && /Envoyé à Chloé, Lucas/.test(e.msgEnvoyes[0].texte), 'Hélène voit ce qu’elle a envoyé');
e.msgModes[0].pick(); e = H3.v('équipe');
e.envoyerMsg(); e = H3.v('message équipe');
assert(globalThis.__kerygmaPartage.mercis.filter(m => m.de === 'Hélène' && m.mode === 'equipe' && m.noms.length === 6).length === 1 && /toute l’équipe de Saint-Maurice/.test(e.toast), 'message à toute l’équipe');
// Thomas voit le commentaire
let c2 = T3.v('Thomas après commentaire');
assert(c2.aCRComsCarte && /Hélène a commenté le service : « Belle préparation/.test(c2.crComsCarte), 'commentaire visible sur la carte de Thomas : ' + c2.crComsCarte);
c2.ouvrirCR(); c2 = T3.v('Thomas relit');
assert(c2.aCRComs && c2.crComs[0].de === 'Hélène, responsable louange' && !c2.crPeutCommenter, 'Thomas lit le commentaire, sans pouvoir écrire à sa place');
c2.retourCR(); c2 = T3.v('retour Thomas');
e.retourCR(); e = H3.v('retour 3 lieux');
assert(e.showLieux, 'retour aux 3 lieux');
e.crListe[1].ouvrir(); e = H3.v('Champigny');
assert(e.crLecture && e.crTextes.length === 3 && e.crAbsentsTexte === 'Pierre' && /toute l’équipe/.test(e.crMerciTexte), 'compte rendu de Sylvie (exemple)');
e.mins[1].pick(); e.retourCR(); e = H3.v('programme');
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
g.dates[2].pick(); g = T4.v('6 déc');
const bat = g.lignes.find(l => l.label === 'Batterie');
assert(bat.nom === 'Thaïs' && bat.sous === 'Échange : Bérénice → Thaïs (Bérénice pas dispo)' && bat.sousColor === '#146C3A', 'planning changé : ' + bat.nom + ' / ' + bat.sous);
const H4 = ouvrir(fichierHelene);
let h4 = H4.v('Hélène voit l’échange');
h4.dates[2].pick(); h4 = H4.v('Hélène 6 déc');
h4.cartes[0].ouvrir(); h4 = H4.v('Hélène stm 6 déc');
assert(h4.lignes.find(l => l.label === 'Batterie').nom === 'Thaïs' && /Bérénice → Thaïs/.test(h4.lignes.find(l => l.label === 'Batterie').sous), 'Hélène voit l’échange validé');
assert(h4.echangesAValider.length === 0, 'Hélène n’a pas d’échange à valider (c’est le coordinateur)');
globalThis.__kerygmaPartage.echanges['13/12|stm|piano'] = { date: '13/12', lieu: 'stm', poste: 'piano', de: 'Hugo', par: 'Camille', etat: 'accepte' };
g = T4.v('deuxième échange');
assert(g.echangesAValider.length === 1 && g.echangesAValider[0].titre === 'Piano · dimanche 13 décembre', 'nouvel échange à valider');
g.echangesAValider[0].non(); g = T4.v('échange refusé');
assert(globalThis.__kerygmaPartage.echanges['13/12|stm|piano'].etat === 'refusee' && /Hugo garde son service du 13 décembre/.test(g.toast), 'refus : ' + g.toast);
g.dates[3].pick(); g = T4.v('13 déc');
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
g.dates[5].pick(); g = T4.v('27 déc');
globalThis.__kerygmaPartage.dispos['Thaïs'] = { '27/12': 'sibesoin' };
g.lignes.find(l => l.label === 'Batterie').ouvrir(); g = T4.v('Choisir batterie 27 déc');
const tagsDe = n => ((g.candLibres.find(c => c.nom === n) || {}).tags || []).map(t => t.texte);
assert(tagsDe('Bérénice').indexOf('Indisponible ce jour-là') >= 0, 'Bérénice : pas dispo dans sa grille');
assert(tagsDe('Thaïs').indexOf('Si besoin seulement') >= 0, 'Thaïs : si besoin');

// 13. Tâches : Thomas confie une tâche à quelqu'un du planning
globalThis.__kerygmaPartage = undefined;
const T5 = ouvrir(fichierCoord);
let k = T5.v('Thomas tâches');
k.dates[1].pick(); k = T5.v('29 nov');
const gac = k.lignes.find(l => l.label === 'Guitare acoustique');
assert(gac.aTache && gac.tacheTexte === 'Tâche : installer et brancher le matériel · à faire' && gac.tacheColor === '#4338CA', 'tâche de démonstration visible : ' + gac.tacheTexte);
assert(k.aTachesCulte && k.tachesCulte.length === 1 && k.tachesCulte[0].etat === 'À faire' && /Lucas · guitare acoustique · demandé par Thomas/.test(k.tachesCulte[0].detail), 'liste des tâches du culte');
assert(k.lignes.filter(l => l.peutTache).length === 5 && !k.lignes.find(l => l.label === 'Basse').peutTache, '« + Tâche » sur les postes remplis seulement');
const dir = k.lignes.find(l => l.label === 'Direction');
assert(dir.tacheAria === 'Ajouter une tâche à Olivier', 'libellé accessible : ' + dir.tacheAria);
dir.ajouterTache(); k = T5.v('feuille tâche');
assert(k.tacheOuverte && !k.sheetOuvert && k.tacheSous === 'Direction · Saint-Maurice · dim. 29 nov' && !k.tachePlusieurs, 'feuille « Ajouter une tâche »');
assert(k.tacheTypes.length === 6 && k.tacheTypes[0].on && k.tacheTypes[5].label === 'Autre tâche' && !k.tacheAutre, 'tâches prédéfinies de la louange + Autre');
assert(k.tacheMsg === 'Peux-tu t’occuper de ça dimanche ? Merci !' && k.tacheBouton === 'Envoyer la tâche à Olivier', 'message par défaut');
k.tacheTypes[4].pick(); k = T5.v('nettoyer');
assert(k.tacheTypes[4].on && !k.tacheTypes[0].on, 'tâche choisie');
k.saisirTacheMsg({ target: { value: 'Avec Pierre, après la prière de fin.' } });
k = T5.v('message');
k.envoyerTache(); k = T5.v('tâche envoyée');
assert(!k.tacheOuverte && /Tâche envoyée à Olivier : nettoyer la salle après le culte\./.test(k.toast), 'toast : ' + k.toast);
const tS = globalThis.__kerygmaPartage.taches;
assert(tS.length === 2 && tS[1].nom === 'Olivier' && tS[1].par === 'Thomas' && tS[1].message === 'Avec Pierre, après la prière de fin.' && tS[1].poste === 'direction' && !tS[1].fait, 'tâche enregistrée');
assert(k.lignes.find(l => l.label === 'Direction').aTache && k.tachesCulte.length === 2, 'tâche visible sur la ligne et dans la liste');
// Autre tâche, texte libre obligatoire
k.lignes.find(l => l.label === 'Piano').ajouterTache(); k = T5.v('piano');
k.tacheTypes[5].pick(); k = T5.v('autre');
assert(k.tacheAutre && k.tacheTitre === '', 'champ libre');
k.envoyerTache(); k = T5.v('autre vide');
assert(k.aErreurTache && k.tacheOuverte, 'intitulé obligatoire');
k.saisirTacheTitre({ target: { value: 'Accueillir le nouveau bassiste' } });
k = T5.v('intitulé');
k.envoyerTache(); k = T5.v('autre envoyée');
assert(tS.length === 3 && tS[2].titre === 'Accueillir le nouveau bassiste' && tS[2].nom === 'Inès', 'tâche libre');
// Poste tenu par deux personnes : choisir pour qui
T5.r.c.setState({ tache: { date: '29/11', lieu: 'stm', poste: 'voix', noms: ['Pierre', 'Emma'] }, tacheNom: 'Pierre', tacheChoix: 0, tacheMsg: null, erreurTache: '' });
k = T5.v('deux personnes');
assert(k.tachePlusieurs && k.tacheNoms.length === 2 && k.tacheNoms[0].on, 'choix de la personne');
k.tacheNoms[1].pick(); k = T5.v('Emma');
assert(k.tacheBouton === 'Envoyer la tâche à Emma', 'bouton : ' + k.tacheBouton);
k.fermerTache(); k = T5.v('fermée');
assert(!k.tacheOuverte && tS.length === 3, 'fermer sans envoyer');
// Hélène voit les tâches et peut en ajouter
const H5 = ouvrir(fichierHelene);
let h5 = H5.v('Hélène tâches');
h5.dates[1].pick(); h5 = H5.v('29');
h5.cartes[0].ouvrir(); h5 = H5.v('stm 29');
assert(h5.tachesCulte.length === 3, 'Hélène voit les tâches du culte');
h5.lignes.find(l => l.label === 'Guitare acoustique').ajouterTache(); h5 = H5.v('Hélène feuille');
h5.envoyerTache(); h5 = H5.v('Hélène envoie');
assert(tS.length === 4 && tS[3].par === 'Hélène' && tS[3].nom === 'Lucas', 'tâche d’Hélène');

// 14. Calendrier du mois (bouton « Mois »)
k = T5.v('avant mois');
assert(k.moisFerme && !k.moisOuvert, 'bande des dates par défaut');
k.toggleMois(); k = T5.v('mois ouvert');
assert(k.moisOuvert && !k.moisFerme && k.moisTitre === 'Novembre 2026', 'mois du dimanche affiché : ' + k.moisTitre);
assert(k.moisEntetes.map(e => e.l).join('') === 'LMMJVSD' && k.moisCases.length === 36 && k.moisCases.slice(0, 6).every(c => c.inactif), 'grille : lundi en premier, 1er novembre un dimanche');
const actifs = k.moisCases.filter(c => c.actif);
assert(actifs.map(c => c.n).join() === '22,29' && actifs[1].on === 'true' && actifs[0].on === 'false', 'dimanches cliquables, 29 sélectionné');
assert(actifs.every(c => c.dot === '#C2410C') && /postes à pourvoir/.test(actifs[1].aria), 'point orange : postes à pourvoir');
assert(k.moisLegende.map(l => l.texte).join() === 'Je sers,Complet,Postes à pourvoir,Date affichée', 'légende');
assert(k.moisPrecOff === 'true' && k.moisSuivOff === 'false', 'flèches');
k.moisPrec(); k = T5.v('pas avant novembre');
assert(k.moisTitre === 'Novembre 2026', 'reste en novembre');
k.moisSuiv(); k = T5.v('décembre');
assert(k.moisTitre === 'Décembre 2026' && k.moisCases.filter(c => c.actif).map(c => c.n).join() === '6,13,20,27' && k.moisSuivOff === 'true', 'décembre');
k.moisCases.find(c => c.n === '13' && c.actif).pick(); k = T5.v('13 déc');
assert(/dimanche 13 décembre/.test(k.dSous) && k.moisOuvert && k.moisCases.find(c => c.n === '13' && c.actif).on === 'true', 'choisir un dimanche dans le mois');
k.toggleMois(); k = T5.v('réduit');
assert(k.moisFerme && k.dates.find(d => d.on).label === '13 déc', 'retour à la bande, date gardée');
// Jours où l'on sert : violet
globalThis.__kerygmaPartage.invitations['dimanche|20/12|cha|louange|gac'] = { nom: 'Thomas', raison: '' };
k.toggleMois(); k = T5.v('Thomas sert le 20');
const c20 = k.moisCases.find(c => c.n === '20' && c.actif);
assert(c20.bg === '#4338CA' && c20.fg === '#FFFFFF' && /tu sers/.test(c20.aria), 'jour où Thomas sert en violet');

console.log(steps + ' états vérifiés');
process.exit(report('Coordinateur') ? 1 : 0);
