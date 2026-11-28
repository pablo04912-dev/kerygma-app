# KERYGMA App : règles pour Claude

Prototype de l'appli KERYGMA (plannings des ministères de l'église Kerygma, Paris). Deux personnes y travaillent, chacune avec son Claude : **Pablo** et **Manuel**. Ce fichier est votre mémoire commune : lis-le en entier à chaque séance. Les décisions détaillées sont dans `docs/decisions.md` (section 6).

## 1. Début de séance (obligatoire, avant toute autre chose)

1. `git pull` (le seul de la séance, en dehors de celui juste avant chaque envoi).
2. `MESSAGES.md` : montre les messages adressés à ton interlocuteur, puis déplace-les dans "Déjà lus" (envoyé avec le commit de fin de séance).
3. Lis les dernières entrées de `JOURNAL.md` et `git log --since="<date de la dernière entrée de ton interlocuteur>" --stat`.
4. Résumé court, sans jargon, de ce que l'autre a fait sur l'appli depuis : écrans touchés, décisions, événements techniques, ce qui reste à faire.
5. Donne les liens de l'aperçu (section 4), sans republier, puis demande sur quoi on travaille. Pas de build ni de tests ici : ils se font avant chaque envoi et en fin de séance.

## 1 bis. Pendant la séance

- Pas de `git pull` avant chaque réponse : seulement en début de séance et juste avant chaque envoi (`git pull --rebase`). Si ce pull ramène quelque chose de l'autre, dis-le en une phrase.
- Écran changé : `npm run build` (il produit la page d'aperçu), puis republie seulement la page qui a changé (section 4). Les tests attendent l'envoi.
- **Envoie au fil de l'eau** : dès qu'une modification est finie et que `npm run build` et `npm test` sont verts, commit puis `git pull --rebase` et `git push`. Un travail pas fini ou des tests rouges ne s'envoient pas.
- **On ne partage que ce qui concerne l'appli** (écrans, données, règles, décisions communes, événements techniques). Les recherches et idées de chacun restent privées, dans son propre projet Claude, jusqu'à ce qu'elles deviennent une décision ou que l'interlocuteur demande de les partager.
- `MESSAGES.md` est le chat différé : "dis à Manu…" ou "dis à Pablo…" → message en haut de la partie de l'autre (date + prénom), commit et `git push` tout de suite.
- Suivi automatique (tâche programmée qui prévient quand l'autre a changé quelque chose) : texte dans `docs/suivi-automatique.md`.

## 2. Fin de séance (obligatoire)

1. `npm run build` puis `npm test` : tout vert, sinon corrige ou annule.
2. Entrée **en haut** de `JOURNAL.md` : date, qui, ce qui a été fait, décisions, ce qui reste à faire. Une décision nouvelle ou changée va aussi dans `docs/decisions.md`, à sa place.
3. Commit clair en français, `git push` sur `main`. Si refusé : `git pull --rebase`, tests, renvoi.

## 3. Règles sur les données (non négociables)

- **Ce dépôt est public.** Aucune vraie donnée de l'église : pas de vrais noms ni prénoms, pas d'e-mails, pas de plannings réels. Seulement les données inventées de `data/exemple.json`.
- Les vraies données (plannings, comptes) restent dans le **Drive partagé "Kerygma App"** (privé), jamais dans GitHub.
- L'appli ne doit **jamais** demander ni enregistrer : adresse, numéro de téléphone, date de naissance, lieu de naissance, âge. Seulement prénom, nom, e-mail.
- Mots de passe : jamais en clair ; seulement une empreinte (dans la vraie appli).

## 4. Aperçu

- 4 pages d'aperçu : `site/index.html` (« Kerygma prototype ») et `site/responsable.html`, `site/coordinateur.html`, `site/serviteur.html` (« Prototype responsable », « Prototype coordinateur », « Prototype serviteur »). Crée celles qui n'existent pas dans ton compte.
- Après une modification : `npm run build`, puis republie **seulement les pages touchées**. Écran du serviteur → `serviteur.html` ; responsable ou coordinateur (`planning.template.html`) → la page du profil concerné ; accueil → `index.html`. `index.html` contient tous les profils : republie-la aussi quand on veut voir la chaîne complète. Un changement de `src/commun.js` ou `src/morceaux/` touche tout : republie les 4.
- Le lien public (README) se met à jour quelques minutes après chaque `git push`. L'aperçu publié ne change que quand ton Claude le republie : pour voir le travail de l'autre tout de suite, utilise le lien public.

## 5. Comment le projet est construit

- `src/accueil.dc.html` : accueil public et connexion.
- `src/planning.template.html` : espace des responsables et coordinateurs (profil test Hélène, responsable louange ; avec `profil: 'coordinateur'`, Thomas, coordinateur louange à Saint-Maurice).
- `src/serviteur.template.html` : espace d'un serviteur (profil test Lucas).
- `src/commun.js` : code commun aux deux écrans connectés (dates, bande des 2 mois, calendrier du mois, état partagé `partage()`). Le build le colle à la place de `/*__COMMUN__*/`. On ne le modifie qu'ici.
- `src/morceaux/*.html` : morceaux de gabarit communs (barre du bas, bande des dates), collés au build à la place de `<!--@nom-->`.
- État partagé pendant la visite (`partage()`, rien n'est enregistré) : invitations, brouillons (par auteur), validations (mois validés, clé `lieu|2026-11`), réponses, comptes rendus, commentaires, mercis, échanges, dispos, collecte, tâches, affectations, notifs, ajouts (postes « + »), prefs (fréquence, servir ensemble). C'est lui qui montre la chaîne Thomas → Hélène → Lucas.
- `data/exemple.json` : tout est inventé. Plannings louange et programme (22/11 au 27/12), historique (4 dimanches passés), indispos, freqMax, comptesRendus, echanges, dispos, taches, confirmations, projection.
- `src/runtime.js` + `src/page.html` : moteur de la page téléphone. `outils/build.py` produit `build/*.dc.html` (format du canevas Claude Design) et `site/*.html`.
- Format des écrans : HTML avec `{{trous}}`, `<sc-if>`, `<sc-for>`, `onClick="{{fonction}}"`, et une classe `Component extends DCLogic` avec `renderVals()`. Pas de logique dans les trous : calcule dans `renderVals()`.
- Tailles du texte en rem au build (1rem = 17 px) pour suivre le réglage du téléphone ; l'en-tête et la barre du bas gardent leurs pixels (`data-taille-fixe`).
- `tests/` : un test par nouveau comportement. Logique : `test_accueil.js`, `test_planning.js`, `test_coordinateur.js`, `test_serviteur.js` ; pages par profil, tailles (boutons de 44 px), bout en bout (`test_phone.js`, chaîne Thomas → Hélène → Lucas).
- `outils/controle_qualite.py` : contrôle visuel, à lancer à la main après un gros changement d'écran (320 px, 390 px, ordinateur ; texte normal, x1,5, x2).
- `.github/workflows/ci.yml` : à chaque envoi, build + tests + mise en ligne sur GitHub Pages.
- **Économiser les tokens** : les gabarits sont longs ; cherche (`grep -n`) avant de lire, lis seulement les lignes utiles, et ne relis pas un fichier entier pour une petite modification.

## 6. Décisions

Le détail est dans **`docs/decisions.md`**, rangé par écran : avant de toucher un écran, lis la partie qui le concerne. L'essentiel :

- KERYGMA, 100 % français, gratuit. 3 lieux : Saint-Maurice et Champigny (dim. 10h30), Boulogne (dim. 15h30). On commence par la louange et l'espace des responsables.
- Rôles : pasteurs principaux, pasteurs de lieu, responsable de ministère (3 lieux, valide), coordinateur de lieu (remplit le planning de son lieu), serviteur. Chacun voit exactement son périmètre (couples ministère, lieu).
- Barre du bas : Planning, À faire, Actus, Équipe ; « Moi » dans la bulle en haut à droite.
- Planning louange : « Aucun » n'est pas « à pourvoir ». Choisir met en brouillon ; « Envoyer le planning aux volontaires » envoie ; le responsable valide le mois quand il veut.
- Tout doit marcher sur téléphone et sur ordinateur, avec des boutons de 44 px et la taille de texte du téléphone.
- Messages privés : vus seulement par l'expéditeur et les destinataires. Pas de classements, de points ni de séries.

## 7. Style d'écriture

- Français, direct, sans remplissage. Jamais de tiret cadratin : virgules, parenthèses ou point-virgule.
