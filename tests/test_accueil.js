const { load, checkHoles, checkTags, assert, report, timers } = require('./dc_harness.js');
const file = process.argv[2];
const { c, tpl, src } = load(file, {});
let n = 0;
const check = (label) => { n++; const v = c.renderVals(); const e = checkHoles(tpl, v); assert(e.length === 0, label + ' : ' + e.join(' | ')); return v; };
const typer = (fn, val) => fn({ target: { value: val } });
assert(checkTags(src).length === 0, 'balises : ' + checkTags(src).join(' | '));

// Pop-up automatique
let x = check('initial');
assert(!x.popup, 'pas de pop-up au tout début');
c.componentDidMount();
const t = timers[timers.length - 1];
assert(t && t.ms <= 1000, 'pop-up en moins d’une seconde (' + (t && t.ms) + ' ms)');
t.fn(); x = check('après délai');
assert(x.popup && x.modeConnexion && x.showTabs, 'pop-up ouverte sur Se connecter');
x.fermer(); x = check('fermée');
assert(!x.popup, 'la croix ferme');
t.fn(); x = check('délai rejoué');
assert(!x.popup, 'la pop-up ne revient pas toute seule');
x.ouvrir(); x = check('rouverte');
assert(x.popup && x.modeConnexion, 'Espace membre rouvre sur la connexion');

// Connexion : prototype, connexion directe
assert(x.loginOk && !x.loginKo, 'prototype : Se connecter ouvre directement le profil de Hélène, champs vides');
assert(/href="Planning\.dc\.html"/.test(src), 'lien vers Planning');
typer(x.setEmail, 'gilda@exemple.fr'); x = check('email saisi');

// Mot de passe oublié
x.oubli(); x = check('oubli');
assert(x.modeOubli && !x.showTabs && x.oemail === 'gilda@exemple.fr', 'oubli pré-rempli avec l’e-mail');
typer(x.setOemail, 'pas-un-mail'); x = check('oubli mauvais mail');
x.envoyerLien(); x = check('oubli erreur');
assert(x.aErreur && x.modeOubli, 'erreur si e-mail invalide');
typer(x.setOemail, 'gilda@exemple.fr'); x = check('oubli bon mail');
x.envoyerLien(); x = check('lien envoyé');
assert(x.modeOubliEnvoye && /gilda@exemple\.fr/.test(x.oubliTexte) && !x.continuerVisible, 'confirmation d’envoi');
x.retourConnexion(); x = check('retour connexion');
assert(x.modeConnexion, 'retour à la connexion');

// Création de compte : chaque erreur
x.tabs[1].pick(); x = check('création');
assert(x.modeCreation && x.tabs[1].on && x.continuerVisible, 'onglet Créer un compte');
x.creer(); x = check('création vide');
assert(/prénom et ton nom/.test(x.erreur), 'erreur prénom/nom');
typer(x.setPrenom, 'Antoine'); typer(c.renderVals().setNom, 'Moreau'); x = check('nom');
x.creer(); x = check('sans e-mail');
assert(/ne semble pas valide/.test(x.erreur), 'erreur e-mail');
typer(x.setCemail, 'pablo@exemple.fr'); x = check('email');
typer(x.setCmdp, 'court'); x = check('mdp court');
x.creer(); x = check('mdp court erreur');
assert(/8 caractères/.test(x.erreur), 'erreur mot de passe trop court');
typer(x.setCmdp, 'motdepasse1'); typer(c.renderVals().setCmdp2, 'motdepasse2'); x = check('mdp différents');
x.creer(); x = check('différents erreur');
assert(/pas identiques/.test(x.erreur), 'erreur confirmation');
typer(x.setCmdp2, 'motdepasse1'); x = check('mdp identiques');
assert(!x.aErreur, 'erreur effacée en tapant');
x.creer(); x = check('compte créé');
assert(x.modeCree && x.creeTitre === 'Compte créé, Antoine !' && x.email === 'pablo@exemple.fr', 'compte créé : ' + x.creeTitre);
assert(x.cmdp === '' && x.cmdp2 === '' && x.mdp === '', 'mots de passe effacés de l’écran après création');
assert(!x.showTabs && !x.continuerVisible, 'écran de confirmation sans onglets');
x.retourConnexion(); x = check('retour après création');
assert(x.modeConnexion && x.email === 'pablo@exemple.fr' && x.mdp === '', 'e-mail pré-rempli, mot de passe effacé');

// Onglet aller-retour garde les champs, la croix ferme partout
x.tabs[1].pick(); x = check('création 2');
assert(x.prenom === 'Antoine', 'les champs restent quand on change d’onglet');
x.fermer(); x = check('fermer');
assert(!x.popup, 'fermer depuis la création');

// Champs demandés : jamais d'adresse, téléphone, date ou lieu de naissance, âge
const dialogue = src.slice(src.indexOf('role="dialog"'), src.indexOf('</x-dc>'));
assert(!/t[ée]l[ée]phone|adresse postale|naissance|\bâge\b|type="tel"|type="date"/i.test(dialogue), 'aucun champ sensible dans le formulaire');
const ids = (dialogue.match(/<input id="([^"]+)"/g) || []).map(m => m.slice(11, -1));
assert(ids.join() === 'email,mdp,prenom,nom,cemail,cmdp,cmdp2,oemail', 'champs du formulaire : ' + ids.join());

console.log(n + ' états vérifiés');
process.exit(report('Accueil') ? 1 : 0);
