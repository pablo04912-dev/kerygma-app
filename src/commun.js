// Code commun aux écrans connectés (planning de Hélène et Thomas, serviteur Lucas).
// outils/build.py le colle à la place de /*__COMMUN__*/ dans les deux écrans : on ne le modifie qu'ici.

// ----- Dates -----
// Les dates s'écrivent « jj/mm ». Un dimanche de 2026 tombe un lundi en 2027 : aucun « jj/mm » ne revient deux fois.
var MOIS = { '01': 'janvier', '02': 'février', '03': 'mars', '04': 'avril', '05': 'mai', '06': 'juin', '07': 'juillet', '08': 'août', '09': 'septembre', '10': 'octobre', '11': 'novembre', '12': 'décembre' };
var MOIS_C = { '01': 'janv', '02': 'févr', '03': 'mars', '04': 'avr', '05': 'mai', '06': 'juin', '07': 'juil', '08': 'août', '09': 'sept', '10': 'oct', '11': 'nov', '12': 'déc' };
var CE_DIMANCHE = '22/11';
var DIMANCHES = [], ANNEE = {}; // tous les dimanches de 2026 et 2027
function deux(n) { return (n < 10 ? '0' : '') + n; }
(function () {
  for (var t = Date.UTC(2026, 0, 4); t <= Date.UTC(2027, 11, 26); t += 7 * 864e5) {
    var x = new Date(t), d = deux(x.getUTCDate()) + '/' + deux(x.getUTCMonth() + 1);
    DIMANCHES.push(d); ANNEE[d] = x.getUTCFullYear();
  }
})();
function anneeDe(d) { return ANNEE[d] || (parseInt(d.split('/')[1], 10) >= 8 ? 2026 : 2027); }
function moisCle(d) { return anneeDe(d) + '-' + d.split('/')[1]; } // « 2026-11 »
function dateNum(d) { var p = d.split('/'); return Date.UTC(anneeDe(d), parseInt(p[1], 10) - 1, parseInt(p[0], 10)); }
function jourDe(d) { return parseInt(d.split('/')[0], 10); }
function court(d) { return jourDe(d) + ' ' + MOIS_C[d.split('/')[1]]; } // « 6 déc »
function long(d) { return jourDe(d) + ' ' + MOIS[d.split('/')[1]]; } // « 6 décembre »
function passe(d) { return dateNum(d) < dateNum(CE_DIMANCHE); }
// Bande des dates : 2 mois à la fois (janv.-févr., …, nov.-déc.)
function fenetreDe(d) { return anneeDe(d) + '-' + Math.floor((parseInt(d.split('/')[1], 10) - 1) / 2); }
// Le dimanche le plus proche d'aujourd'hui dans une liste (ce dimanche, sinon le premier à venir ou le dernier passé)
function plusProche(liste) {
  var t = dateNum(CE_DIMANCHE), best = liste[0];
  liste.forEach(function (d) { if (Math.abs(dateNum(d) - t) < Math.abs(dateNum(best) - t)) best = d; });
  return best;
}
function nomFenetre(liste) { // « janvier et février 2027 »
  var an = anneeDe(liste[0]);
  return MOIS[liste[0].split('/')[1]] + ' et ' + MOIS[liste[liste.length - 1].split('/')[1]] + (an !== 2026 ? ' ' + an : '');
}

// ----- Calendrier du mois (bouton « Mois ») -----
// dates : les jours qu'on peut toucher ; caseDe(d) : { bg, fg, border, dot, aria, pick, on } pour un de ces jours.
function calendrierMois(self, s, dates, dateRef, caseDe, legende) {
  var moisDispo = [];
  dates.forEach(function (d) { var m = moisCle(d); if (moisDispo.indexOf(m) < 0) moisDispo.push(m); });
  var moisAff = moisDispo.indexOf(s.moisAff) >= 0 ? s.moisAff : moisCle(dateRef || dates[0]);
  var i = moisDispo.indexOf(moisAff), an = parseInt(moisAff.split('-')[0], 10), mm = moisAff.split('-')[1];
  function vide(n) { return { actif: false, inactif: true, n: n, on: 'false', aria: '', pick: function () {}, border: 'transparent', bg: 'transparent', fg: '#B9B3A6', dot: 'transparent', aPoint: false }; }
  var cases = [];
  for (var k = (new Date(an, parseInt(mm, 10) - 1, 1).getDay() + 6) % 7; k > 0; k--) cases.push(vide(''));
  for (var j = 1, nb = new Date(an, parseInt(mm, 10), 0).getDate(); j <= nb; j++) {
    var d = deux(j) + '/' + mm;
    if (dates.indexOf(d) < 0 || anneeDe(d) !== an) { cases.push(vide(String(j))); continue; }
    var c = caseDe(d), dot = c.dot || 'transparent';
    cases.push({ actif: true, inactif: false, n: String(j), on: c.on ? 'true' : 'false', bg: c.bg, fg: c.fg, border: c.border, dot: dot, aPoint: dot !== 'transparent', aria: c.aria, pick: c.pick });
  }
  var avant = i > 0, apres = i < moisDispo.length - 1;
  return {
    moisOuvert: !!s.mois, moisFerme: !s.mois,
    toggleMois: function () { self.setState({ mois: !(self.state && self.state.mois), moisAff: moisAff }); },
    moisTitre: MOIS[mm].charAt(0).toUpperCase() + MOIS[mm].slice(1) + ' ' + an,
    moisPrecOff: avant ? 'false' : 'true', moisSuivOff: apres ? 'false' : 'true',
    moisPrecFg: avant ? '#16181D' : '#C9C4B8', moisSuivFg: apres ? '#16181D' : '#C9C4B8',
    moisPrec: function () { if (avant) self.setState({ moisAff: moisDispo[i - 1] }); },
    moisSuiv: function () { if (apres) self.setState({ moisAff: moisDispo[i + 1] }); },
    moisEntetes: ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(function (l) { return { l: l }; }),
    moisCases: cases, moisLegende: legende, aLegende: legende.length > 0
  };
}

// ----- État partagé pendant la visite -----
// Les 3 profils (Hélène, Thomas, Lucas) lisent et écrivent le même état, pour montrer la chaîne complète. Rien n'est enregistré.
function partage(DATA) {
  var G = typeof window !== 'undefined' ? window : globalThis;
  var S = G.__kerygmaPartage || (G.__kerygmaPartage = {});
  var D = DATA || {};
  function copies(liste, cle) { var o = {}; (liste || []).forEach(function (x) { o[cle(x)] = Object.assign({}, x); }); return o; }
  if (!S.comptesRendus) S.comptesRendus = copies(D.comptesRendus, function (c) { return c.date + '|' + c.lieu + '|louange'; });
  if (!S.echanges) S.echanges = copies(D.echanges, function (e) { return e.date + '|' + e.lieu + '|' + e.poste; });
  if (!S.dispos) { S.dispos = {}; Object.keys(D.dispos || {}).forEach(function (n) { S.dispos[n] = Object.assign({}, D.dispos[n]); }); }
  if (!S.taches) S.taches = (D.taches || []).map(function (t) { return Object.assign({}, t); });
  if (!S.mercis) S.mercis = [];
  if (!S.notifs) S.notifs = [];
  ['invitations', 'reponses', 'commentaires', 'collecte', 'affectations', 'ajouts', 'prefs', 'brouillons', 'validations'].forEach(function (k) { if (!S[k]) S[k] = {}; });
  return S;
}
