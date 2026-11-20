# KERYGMA App : règles pour Claude

Tu travailles sur le prototype de l'appli KERYGMA (plannings des ministères de l'église Kerygma, Paris). Deux personnes travaillent sur ce dépôt, chacune avec son propre Claude : **Pablo** et **Manuel**. Ce fichier est votre mémoire commune : lis-le en entier à chaque séance.

## 1. Début de séance (obligatoire, avant toute autre chose)

1. `git pull` pour récupérer le travail de l'autre.
2. Lis `MESSAGES.md` : montre d'abord les messages adressés à ton interlocuteur, puis déplace-les dans "Déjà lus" (envoyé avec le commit de fin de séance).
3. Lis les dernières entrées de `JOURNAL.md` et `git log --since="<date de la dernière entrée de la personne avec qui tu parles>" --stat`.
4. Fais un **résumé court de ce que l'autre a fait** depuis la dernière séance de ton interlocuteur : écrans touchés, décisions, ce qui reste à faire. Pas de jargon.
5. `npm install` (si besoin), `npm run build`, `npm test` : signale tout de suite si quelque chose est cassé.
6. Montre l'aperçu (voir section 4), puis demande sur quoi on travaille.

## 1 bis. Pendant la séance : rester à jour et envoyer au fil de l'eau

- Avant chaque réponse qui touche au projet, fais `git pull`. Si l'autre a envoyé quelque chose entre-temps, dis-le en une phrase.
- Si un écran a changé, `npm run build` puis republie l'aperçu (section 4).
- **Envoie au fil de l'eau** : dès qu'une modification est terminée et que `npm run build` et `npm test` sont verts, fais tout de suite un commit et un envoi (`git pull --rebase` puis `git push`). N'attends pas la fin de séance : l'autre doit voir ton travail dans les minutes qui suivent. Ne laisse jamais de travail fini non envoyé.
- Un travail pas fini ou des tests rouges ne s'envoient pas : termine ou annule d'abord.

## 1 ter. Boîte à messages et suivi automatique

- `MESSAGES.md` est le chat différé entre Pablo et Manuel. Si ton interlocuteur dit "dis à Manu…" ou "dis à Pablo…", écris le message en haut de la partie de l'autre (date + prénom), puis fais tout de suite un commit et un `git push`.
- Chacun peut avoir un **suivi automatique** : une tâche programmée dans son propre Claude, toutes les heures de 9h à 23h, qui ne prévient que si l'autre a changé quelque chose. Le texte à donner à son Claude est dans `docs/suivi-automatique.md`.

## 2. Fin de séance (obligatoire)

1. `npm run build` puis `npm test` : tout doit être vert. Sinon, corrige ou annule avant d'envoyer.
2. Ajoute une entrée **en haut** de `JOURNAL.md` : date, qui, ce qui a été fait, décisions, ce qui reste à faire.
3. Un commit clair en français, puis `git push` sur `main` (le gros du travail est déjà envoyé au fil de l'eau). Pas de validation croisée : chacun envoie directement.
4. Si `git push` est refusé parce que l'autre a envoyé entre-temps : `git pull --rebase`, relance les tests, puis renvoie.

## 3. Règles sur les données (non négociables)

- **Ce dépôt est public.** Aucune vraie donnée de l'église ici : pas de vrais noms ni prénoms, pas d'e-mails, pas de plannings réels. Seulement les données inventées de `data/exemple.json`.
- Les vraies données (plannings, comptes) restent dans le **Drive partagé "Kerygma App"** (privé), jamais dans GitHub.
- L'appli ne doit **jamais** demander ni enregistrer : adresse, numéro de téléphone, date de naissance, lieu de naissance, âge. Seulement prénom, nom, e-mail.
- Mots de passe : jamais en clair ; seulement une empreinte (dans la vraie appli).

## 4. Aperçu

- Après chaque modification : `npm run build`, puis publie `site/index.html` comme page dans la conversation (aperçu à droite), si ton outil le permet.
- Le lien public se met à jour tout seul quelques minutes après chaque `git push` : voir le README.
- L'aperçu à droite est une copie publiée depuis le compte de chacun : il ne change que quand ton Claude le republie (il ne peut pas suivre le lien public tout seul). Pour voir tout de suite le travail de l'autre, utilise le lien public.

## 5. Comment le projet est construit

- `src/accueil.dc.html` : écran d'accueil public et connexion.
- `src/planning.template.html` : espace connecté (profil test "Hélène", responsable louange). `__DATA__` est remplacé par `data/exemple.json` au build.
- `src/runtime.js` + `src/page.html` : moteur qui fait tourner ces écrans dans la page téléphone.
- `outils/build.py` : produit `build/*.dc.html` (format du canevas Claude Design) et `site/index.html` (page téléphone).
- `tests/` : tests de la logique (`test_accueil.js`, `test_planning.js`) et test de bout en bout de la page téléphone (`test_phone.js`). Ajoute un test pour chaque nouveau comportement.
- `.github/workflows/ci.yml` : à chaque envoi, build + tests + mise en ligne sur GitHub Pages.
- Format des écrans : HTML avec `{{trous}}`, `<sc-if>`, `<sc-for>`, `onClick="{{fonction}}"`, et une classe `Component extends DCLogic` avec `renderVals()`. Pas de logique dans les trous : calcule dans `renderVals()`.

## 6. Décisions déjà prises (résumé)

- Nom : **KERYGMA**. 100 % français pour l'instant. Gratuit.
- 3 lieux : Saint-Maurice (dim. 10h30), Champigny (dim. 10h30), Boulogne (dim. 15h30). Réunion de prière : jeudi 20h Saint-Maurice, mercredi 20h Champigny et Boulogne.
- On commence par la **louange** (testée sur les 3 lieux) et par l'espace des **responsables** ; les membres ensuite.
- Rôles : pasteurs principaux (tout), pasteurs de lieu (leur lieu, voient les autres), responsable de commission (sa commission, 3 lieux), coordinateur de lieu (sa commission, son lieu), serviteur (ses dispos).
- Une personne peut servir dans plusieurs lieux : conflit seulement si deux réunions se chevauchent.
- Sainte Cène une fois sur deux : bouton Oui/Non. Le rôle "Louange" du programme est repris de la direction du planning louange.
- Barre du bas (Planning, Équipe, Actus, Moi) sur tous les écrans connectés. Boutons d'au moins 44 px, lisibles par tous les âges.
- **Prototype** : "Se connecter" ouvre directement le profil test. À retirer avant la vraie appli.
- Le document de cadrage complet (avec les vrais noms) est dans le Drive "Kerygma App", dossier "01 Cadrage".

## 7. Style d'écriture

- Français, direct, sans remplissage. Jamais de tiret cadratin : utilise virgules, parenthèses ou point-virgule.
