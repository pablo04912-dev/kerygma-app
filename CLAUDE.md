# KERYGMA App : règles pour Claude

Tu travailles sur le prototype de l'appli KERYGMA (plannings des ministères de l'église Kerygma, Paris). Deux personnes travaillent sur ce dépôt, chacune avec son propre Claude : **Pablo** et **Manuel**. Ce fichier est votre mémoire commune : lis-le en entier à chaque séance.

## 1. Début de séance (obligatoire, avant toute autre chose)

1. `git pull` pour récupérer le travail de l'autre.
2. Lis `MESSAGES.md` : montre d'abord les messages adressés à ton interlocuteur, puis déplace-les dans "Déjà lus" (envoyé avec le commit de fin de séance).
3. Lis les dernières entrées de `JOURNAL.md` et `git log --since="<date de la dernière entrée de la personne avec qui tu parles>" --stat`.
4. Fais un **résumé court de ce que l'autre a fait sur l'appli** depuis la dernière séance de ton interlocuteur : écrans touchés, décisions, événements techniques, ce qui reste à faire. Pas de jargon.
5. `npm install` (si besoin), `npm run build`, `npm test` : signale tout de suite si quelque chose est cassé.
6. Montre l'aperçu (voir section 4) : la page complète « Kerygma prototype », plus 3 onglets, un par niveau (« Prototype responsable », « Prototype coordinateur », « Prototype serviteur »). Si ces onglets n'existent pas encore dans ton compte, crée-les ; sinon, republie-les. Puis demande sur quoi on travaille.

## 1 bis. Pendant la séance : rester à jour et envoyer au fil de l'eau

- Avant chaque réponse qui touche au projet, fais `git pull`. Si l'autre a envoyé quelque chose entre-temps, dis-le en une phrase.
- Si un écran a changé, `npm run build` puis republie l'aperçu (section 4).
- **Envoie au fil de l'eau** : dès qu'une modification est terminée et que `npm run build` et `npm test` sont verts, fais tout de suite un commit et un envoi (`git pull --rebase` puis `git push`). N'attends pas la fin de séance : l'autre doit voir ton travail dans les minutes qui suivent. Ne laisse jamais de travail fini non envoyé.
- Un travail pas fini ou des tests rouges ne s'envoient pas : termine ou annule d'abord.

## 1 ter. Ce qu'on partage, boîte à messages et suivi automatique

- **On ne partage que ce qui concerne l'appli** : changements d'écrans, de données ou de règles, décisions communes, événements techniques (base de données branchée, mise en ligne, compte créé, etc.). C'est ça qui va dans le dépôt, le journal, les messages et les notifications.
- **Les recherches, explorations et idées de chacun restent privées**, dans son propre projet Claude, pas dans le dépôt. Elles n'y entrent que si ton interlocuteur le demande, ou quand une idée devient une décision ou un changement de l'appli.

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

- Après chaque modification : `npm run build`, puis publie `site/index.html` comme page dans la conversation (aperçu à droite), si ton outil le permet. Les pages `site/responsable.html`, `site/coordinateur.html` et `site/serviteur.html` s'ouvrent directement sur un profil test : chacun peut les publier en plus, en onglets nommés « Prototype responsable », « Prototype coordinateur », « Prototype serviteur ».
- Le lien public se met à jour tout seul quelques minutes après chaque `git push` : voir le README.
- L'aperçu à droite est une copie publiée depuis le compte de chacun : il ne change que quand ton Claude le republie (il ne peut pas suivre le lien public tout seul). Pour voir tout de suite le travail de l'autre, utilise le lien public.

## 5. Comment le projet est construit

- `src/accueil.dc.html` : écran d'accueil public et connexion.
- `src/planning.template.html` : espace connecté des responsables et coordinateurs. Profil test "Hélène" (responsable louange) et, avec `profil: 'coordinateur'`, "Thomas" (coordinateur louange à Saint-Maurice). `__DATA__` est remplacé par `data/exemple.json` et `__PROFIL__` par le profil au build.
- `src/serviteur.template.html` : espace d'un serviteur (profil test "Lucas").
- Les 3 profils partagent pendant la visite un même état (`partage()` : invitations, propositions, décisions, réponses), pour montrer la chaîne coordinateur → responsable → serviteur. Rien n'est enregistré.
- `data/exemple.json` : plannings louange et programme (22/11 au 27/12), `historique` (4 dimanches passés, pour "X dimanches de suite" et "X semaines sans service"), `indispos` et `freqMax` (exemples pour les étiquettes de la liste "Choisir"). Tout est inventé.
- `src/runtime.js` + `src/page.html` : moteur qui fait tourner ces écrans dans la page téléphone.
- `outils/build.py` : produit `build/*.dc.html` (Accueil, Planning pour Hélène, Coordinateur pour Thomas, Serviteur pour Lucas ; format du canevas Claude Design) et `site/index.html` (page téléphone).
- `tests/` : tests de la logique (`test_accueil.js`, `test_planning.js`, `test_coordinateur.js`, `test_serviteur.js`) et test de bout en bout de la page téléphone (`test_phone.js`, avec la chaîne Thomas → Hélène → Lucas). Ajoute un test pour chaque nouveau comportement.
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
- **Prototype** : "Se connecter" ouvre directement le profil de Hélène ; la fenêtre de connexion propose aussi les 3 profils test (Hélène responsable, Thomas coordinateur, Lucas serviteur). À retirer avant la vraie appli.
- Contrôle des conflits entre lieux, règles validées : rouge = déjà ailleurs à la même heure (ou prière le même soir ailleurs) ; orange = même jour à un horaire compatible, ou fréquence max atteinte ; rouge clair = indispo déclarée ; gris = déjà sur un autre poste du même culte.
- Liste "Choisir" (quand on remplit un poste) : ceux qui ont **le moins servi en premier**. En petit : "2 dimanches de suite", "3 dimanches de suite"… pour ceux qui enchaînent ; "2 semaines sans service"… pour les autres (compté en semaines, pas en jours).
- Personnes déjà ailleurs à la même heure : grisées en bas **avec la raison** ("Sert à Champigny à 10h30"), mais on peut quand même les inviter ("Inviter quand même", utile en cas d'erreur de planning). Le serviteur choisit alors : se faire remplacer sur l'un des deux, ou garder les deux exceptionnellement en justifiant au responsable.
- Collecte des dispos du mois : grille façon Doodle, chaque toucher change l'état de la date : **dispo** (vert), **si besoin** (orange), **pas dispo** (rouge) ; bouton "Je n'ai pas d'indispo".
- Périmètre de chaque responsable ou coordinateur : une liste de couples (ministère, lieu), par exemple sono à Champigny et à Boulogne, mais pas à Saint-Maurice. Il voit et gère exactement ce périmètre. Une personne peut coordonner plusieurs ministères.
- Vocabulaire : le **coordinateur** remplit le planning (d'un lieu) ; le **responsable du ministère** le valide.
- Les modifications d'un coordinateur sont **validées par le responsable au-dessus** avant d'être envoyées aux serviteurs. C'est cette validation qui déclenche tout : demandes aux serviteurs et ajout dans leurs agendas.
- **Validation dans l'appli** : le responsable valide le planning avec un bouton dans l'appli (pas d'e-mail de validation).
- **Agendas** : chacun connecte son agenda une seule fois, dans l'appli, à la création du compte. Ensuite, à chaque validation, ses services (serviteurs, coordinateurs, responsables : tout ce qui le concerne) s'ajoutent tout seuls dans son agenda, sans invitation à accepter, et se mettent à jour à chaque changement (échange, remplacement, nouvelle heure). Pistes techniques :
  - Google Agenda : connexion Google dans l'appli, l'appli écrit directement dans l'agenda (mise à jour immédiate). L'accès à l'agenda est une autorisation "sensible" chez Google : vérification de l'appli à prévoir avant le lancement (page de confidentialité, jusqu'à 10 jours) ; sans vérification, écran d'avertissement et 100 utilisateurs maximum (suffisant pour les tests).
  - Agenda de l'iPhone : bouton "Ajouter à l'agenda de l'iPhone" (abonnement), l'iPhone se met à jour tout seul (toutes les 15 min par défaut).
  - Outlook et autres : abonnement aussi (mise à jour plus lente), connexion directe plus tard si besoin.
- **Heure de présence** : fixée par le responsable de chaque ministère, par lieu (exemple : louange à Saint-Maurice à 9h), modifiable pour une date. L'événement d'agenda va de l'heure de présence à la fin du culte, comptée **2h30 après le début** (un culte dure au moins 2h) : Saint-Maurice et Champigny 10h30 → 13h, Boulogne 15h30 → 18h. Réunions de prière : durée à préciser.
- Un serviteur, dans le culte où il sert, voit la liste de **tous ceux qui servent ce culte-là** (tous ministères) ; il ne voit pas les autres lieux.
- **Compte rendu de service** : après le culte, notification au responsable de chaque service pour remplir un compte rendu : présents / absents (cases à cocher sur la liste prévue), commentaire (ce qui s'est bien passé, problèmes, à améliorer), et option "Très bon service" qui envoie un merci aux serviteurs, en privé ou à toute l'équipe. Le compte rendu remonte aux responsables au-dessus.
- "À traiter" (postes vides, absences, conflits) : visible par le coordinateur du ministère concerné et par les responsables au-dessus de lui.
- Servir ensemble ou séparément : réglage pour couples, familles, frères et sœurs qui vivent ensemble (même culte ou même jour, ou au contraire jamais le même jour).
- Tout doit pouvoir se faire sur téléphone **et** sur ordinateur, y compris remplir un planning.
- L'appli respecte la taille de texte réglée dans le téléphone sans casser l'affichage.
- Notifications sur iPhone : priorité (il faut ajouter l'appli à l'écran d'accueil ; prévoir un pas-à-pas).
- Jauge de remplissage pour le coordinateur, bilan de l'année pour chaque serviteur. Pas de classements, de points ni de séries.
- WhatsApp (envoyer depuis l'appli vers une communauté KERYGMA et ses groupes) : en suspens, question posée à Manuel.
- Boutons ergonomiques : 44 px minimum, sans les surdimensionner.
- Réponse à une demande de service : 3 états, **en attente**, **dispo**, **pas dispo**.
- Indispos saisies à l'avance par chaque serviteur ; le coordinateur peut lancer une collecte des indispos pour un mois. S'il place quand même quelqu'un d'indisponible, la demande le signale au serviteur.
- Échange : le serviteur demande à un autre de le remplacer ; si l'autre accepte, le coordinateur valide (Oui/Non) ; le planning change et le coordinateur voit "X remplacé par Y (X pas dispo)".
- Fréquence maximale par serviteur (par mois, par trimestre, en pause), avec avertissement si elle est dépassée.
- Planning proposé automatiquement (plus tard) : le coordinateur le valide ou le modifie avant envoi.
- Espace louange (plus tard) : bibliothèque de chants avec tonalités et liens audio pour répéter.
- Les discussions restent sur WhatsApp ; l'appli gère plannings et annonces.
- Le document de cadrage complet (avec les vrais noms) est dans le Drive "Kerygma App", dossier "01 Cadrage".

## 7. Style d'écriture

- Français, direct, sans remplissage. Jamais de tiret cadratin : utilise virgules, parenthèses ou point-virgule.
