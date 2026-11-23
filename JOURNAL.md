# Journal du projet

Une entrée par séance, la plus récente en haut. Format : date · qui · ce qui a été fait · décisions · reste à faire.

## 2026-11-23 (nuit) · Pablo (avec Claude, pendant que Pablo dort) · relecture complète, code et règles allégés

**Fait**
- Relecture de tous les écrans des 3 profils (téléphone et ordinateur). Corrigé : bout de pastille coupé dans la bande des dates (la date d'avant reste visible en entier) ; rôle d'Hélène dans Moi (« valide le planning de chaque mois ») ; « Thomas, qui coordonne Saint-Maurice » (plus d'accord de genre faux) ; la projection de Lucas apparaît dans Équipe.
- Code allégé, sans changement visible (30 écrans comparés au pixel près) : `src/commun.js` (dates, bande des 2 mois, calendrier du mois, état partagé) et `src/morceaux/` (barre du bas, bande des dates), collés au build. Un bug latent du calendrier de Lucas corrigé au passage.
- Comptes rendus : avec un gros texte ou un petit écran, la bulle « Ajouter un commentaire » passe sous le lieu au lieu de déborder.
- `CLAUDE.md` raccourci (24 Ko → 7 Ko) pour coûter moins cher à chaque séance ; les décisions détaillées sont dans `docs/decisions.md`, rangées par écran.

**À faire**
- Manuel : rien ne change dans les règles, seulement leur place. Avant de toucher un écran, lire sa partie dans `docs/decisions.md`.

## 2026-11-22 (après-midi) · Pablo (avec Claude) · brouillon puis envoi, validation du mois, 2027

**Décisions**
- (15h) Bande des dates : « Mois » fixe, 2 mois à la fois, flèches ‹ et › pour les 2 mois d'avant ou d'après ; on tombe sur le dimanche le plus proche. Dimanches passés consultables, plus modifiables.
- (15h) Compte rendu lu par le responsable : « Compte rendu · Sylvie » en haut, plus de « Rempli par… » ; les 3 rubriques toujours là, « Aucun » à droite si vide.
- (15h) Messages privés : seuls l'expéditeur et les destinataires les voient (le responsable ne voit plus le merci du coordinateur à son équipe).
- Choisir quelqu'un ne l'invite plus tout de suite : brouillon (« Pas encore envoyé »), puis bouton « Envoyer le planning aux volontaires ». En quittant la page avec un brouillon : « Envoyer les invitations ? » Oui / Non, plus tard. Sans envoi, aucun volontaire n'est prévenu.
- Thomas envoie lui-même ; plus de propositions validées une par une. Hélène valide le mois quand elle veut ; quand tout le monde a répondu dispo, elle reçoit « Tout est rempli … Tu peux valider si c'est bon pour toi ». Après validation, les deux peuvent encore modifier.
- Hypothèse (à confirmer par Pablo) : les services confirmés entrent dans les agendas à la validation du mois.
- Feuilles du bas : plus de bouton « Fermer », la zone grise les ferme (la feuille descend).
- Planning louange : VOIX plus grand, Auto à droite sur la même ligne, mêmes espacements pour INSTRUMENTS.
- Bande des dates jusqu'à fin 2027, avec une pastille par mois (« 2027 » pour janvier, puis « Février », « Mars »…).
- Accueil du responsable : plus de « Dimanches suivants ». Le dimanche choisi, puis toujours le compte rendu de dimanche dernier, avec une bulle « Ajouter un commentaire » à droite de chaque lieu.

**Fait**
- Tout ce qui précède, avec les tests (brouillon, envoi, question en partant, validation du mois, bulles de commentaire, 2027). Données : la voix (Pierre) et la batterie (Bérénice) du 29/11 à Saint-Maurice sont maintenant envoyées ; les « propositions » d'exemple sont retirées.

**À faire / à vérifier**
- Confirmer le déclencheur des agendas (validation du mois, ou chaque réponse « dispo »).
- Un volontaire retiré du planning devrait être prévenu (pas encore montré dans le prototype).
- Tester sur iPhone : la feuille qui descend, le bouton d'envoi au-dessus de la barre du bas.

## 2026-11-22 (nuit, suite) · Pablo (avec Claude) · Voix / Instruments, Auto, barre flottante

**Décisions**
- Planning louange : parties VOIX (Direction, Voix) et INSTRUMENTS (Piano, Batterie, Guitare acoustique), « + » pour ajouter une voix ou un instrument (basse, guitare électrique, personnalisé). Par défaut « Aucun », qui n'est pas « à pourvoir » : plus de « Manque », de compteur, de vert/rouge dans le calendrier louange, ni de « Modifiable ».
- Bouton Auto (responsable et coordinateur) : propose des noms d'après l'historique, les indispos, la fréquence max et « servir ensemble » ; on envoie (ou on propose à Hélène) ou on annule.
- Accueil du responsable : Ce dimanche 22 novembre, puis Compte rendu de dimanche dernier, puis Dimanches suivants. Puce « Programme culte ».
- Barre du bas : Planning, À faire, Actus, Équipe ; capsule flottante translucide avec bulle grise qui glisse (façon Instagram), noms gardés, violet gardé.
- Lucas : onglets Tout / Projection / Louange à la place de « Serviteur · Louange ».
- Création de compte (vraie appli) : questionnaire de départ (fréquence, services, rôles, famille), rôles confirmés par les responsables.

**Fait**
- Tout ce qui précède. Les préférences de Lucas (fréquence, servir ensemble) sont partagées et prises en compte par Auto. Exemple de services de projection pour Lucas.

**À faire / à vérifier**
- Tester sur iPhone : barre flottante (flou), clavier dans « Tâche » et « Ajouter ».
- Le directeur peut aussi faire voix ou guitare : pour l'instant Auto ne met jamais deux fois la même personne dans un culte ; on le choisit à la main.

## 2026-11-22 (nuit) · Pablo (avec Claude) · écran du responsable plus lisible

**Décisions**
- En-tête : KERYGMA centré ; la bulle H ouvre « Moi ». Barre du bas : Planning, Équipe, Actus, **À faire** (pastille rouge). Plus de « Bonjour … ».
- Les validations (propositions de Thomas) passent dans « À faire ». Thomas y trouve aussi son compte rendu, les échanges, et les changements faits par Hélène. Lucas y trouve ses demandes.
- Planning : une bulle par poste, [nom ou « Personne »] + [Tâche]. Option « Aucun » (personne à ce poste, compte comme rempli). Le responsable peut changer quelqu'un ; le coordinateur est prévenu. Vert + coche = confirmé.
- Tâches : une par personne, texte libre, « Aucune tâche » par défaut, modifiable. Plus de tâches prédéfinies ni de résumé.
- Calendrier : cases entières vertes / rouges, bouton réduire à gauche, mois centré, plus de « Date affichée ».
- « Ce dimanche » pour le dimanche de la semaine, sinon « Dimanche 15 novembre ».
- Message : les 3 débuts sont dans le champ (visibles tant qu'il est vide). Texte gris retiré.

**Fait**
- Tout ce qui précède, sur les 3 profils ; compte rendu : titre « Saint-Maurice » en grand ; flèche de retour ; effet au toucher ; barres de défilement masquées ; clavier iPhone (écran réduit à la partie visible).

**À faire / à vérifier**
- Tester sur iPhone : clavier ouvert dans « Tâche » et « Envoyer un message ».
- À trancher : pour Hélène, une seule puce « Programme du culte » (la louange modifiable dedans) au lieu de deux.

## 2026-11-22 · Pablo (avec Claude) · débuts de message

**Décision**
- Les messages tout prêts servent de **début** au message personnalisé : 3 débuts au choix (« Merci à toute l'équipe pour dimanche ! », « Quel beau service dimanche ! », « Bravo à chacun pour votre engagement ! »), puis on écrit la suite.

**Fait**
- Thomas (« Très bon service ») et Hélène (« Envoyer un message ») : « Choisir un début de message ». Changer de début garde la suite déjà écrite ; choisir un début devant un texte libre le place en tête.

## 2026-11-21 (après-midi) · Pablo (avec Claude) · compte rendu : messages

**Décisions**
- Dans « Qui était là ? », un bouton « Message » sur chaque personne pour lui écrire seule (texte par défaut modifiable ; pour un absent : « Tu nous as manqué… »).
- « Très bon service » envoie un merci à toute l'équipe présente ; l'option « Merci en privé » est retirée.
- Le texte du merci se choisit dans une liste de messages tout prêts qui se déplie, puis reste modifiable.

**Fait**
- Thomas : bouton « Message » par personne, avec « Message envoyé ✓ » sur la ligne ; « Très bon service » avec « Choisir un message tout prêt » (6 phrases).
- Hélène : la même liste de messages tout prêts dans « Envoyer un message » ; dans le compte rendu, elle lit « Thomas a aussi écrit à Lucas ».
- Tests à jour (chaîne complète : message à Lucas, merci à l'équipe, Lucas reçoit les deux).

## 2026-11-21 (midi) · Pablo (avec Claude) · tâches et calendrier du mois

**Décisions**
- Tâches : le coordinateur ou le responsable confie une tâche à quelqu'un du planning (liste prédéfinie par ministère ou tâche libre, message modifiable) ; le serviteur la voit sur son planning et dans son service, et la coche quand c'est fait.
- Calendrier du mois : bouton "Mois" sur la bande des dates ; jours où je sers en violet.

**Fait**
- Thomas et Hélène :
  - bouton "+ Tâche" sur chaque poste rempli et feuille "Ajouter une tâche" ;
  - le poste affiche « Tâche : … · à faire / faite ✓ » ;
  - bloc « Tâches de ce culte ».
- Calendrier du mois sur la bande des dates (3 lieux et planning d'un lieu) : point vert si le dimanche est complet, orange s'il manque des postes, violet les jours où l'on sert.
- Lucas :
  - nouvelle bande « Mes dimanches » en haut de son planning (violet si confirmé, violet clair si à confirmer, point s'il y a une tâche) et calendrier du mois ;
  - « 1 tâche à faire » sur le service, la tâche dans le détail du service, case « Marquer comme faite ».
- Tests : 850 vérifications ; chaîne Thomas → Lucas (tâche envoyée, cochée, vue « faite » par Thomas) dans `test_phone.js`. Contrôle visuel étendu au calendrier et aux tâches.

**Reste à faire**
- Sur un très petit téléphone (320 px de large, iPhone SE de première génération), les cases du calendrier font 37 px de large au lieu de 44 ; ça va dès 375 px.

## 2026-11-21 (matin) · Pablo (avec Claude) · commentaires et messages des responsables

**Décision**
- Le coordinateur du lieu remplit le compte rendu (confirmé).
- Tous ceux qui sont au-dessus de lui (responsables, parfois pasteurs, et pasteurs principaux) peuvent laisser un commentaire général sur le service, que le coordinateur voit.
- Ils peuvent aussi envoyer un message personnalisé (« très bon service » ou autre) à n'importe quel serviteur : une ou plusieurs personnes, ou toute l'équipe.

**Fait**
- Hélène, sur chaque compte rendu (même pas encore rempli) : « Commentaire pour Thomas » et « Envoyer un message » (toute l'équipe ou certaines personnes, texte modifiable). Elle voit ce qu'elle a envoyé.
- Thomas voit le commentaire sur sa carte de compte rendu et dans le compte rendu ; il peut aussi modifier le texte de son merci.
- Lucas voit chaque message (« Message de Thomas », « Message d'Hélène à toute l'équipe ») avec le texte et le culte concerné.
- Tests mis à jour, chaîne complète dans `test_phone.js`.

**Reste à faire**
- Profil test « pasteur principal » (mêmes droits qu'Hélène, sur tous les ministères) si on veut le montrer.

## 2026-11-21 (nuit) · Pablo (Claude en autonomie, à sa demande) · compte rendu, outils du coordinateur, contrôle qualité

**Fait**
- **Compte rendu de service** (dernier dimanche, 15 nov) :
  - Thomas reçoit une notification après le culte. Il coche les présents et les absents sur la liste prévue, remplit le commentaire (bien passé, problèmes, à améliorer) et peut activer « Très bon service », avec un merci en privé ou à toute l'équipe.
  - Hélène voit les comptes rendus des 3 lieux (reçu / en attente) et les lit.
  - Lucas reçoit le merci s'il était présent.
- **Échanges** :
  - Lucas reçoit une demande (Adrien lui demande de prendre sa place) et accepte ou refuse.
  - Ses propres demandes sont suivies : pas encore de réponse, accepté, validé, refusé.
  - Thomas valide par Oui / Non. Le planning affiche alors « Échange : X → Y (X pas dispo) », chez Thomas comme chez Hélène.
- **Collecte des dispos de décembre** (onglet Équipe de Thomas) :
  - Thomas lance la collecte et voit les réponses (pas dispo, si besoin, dispo tous les dimanches), puis relance ceux qui n'ont pas répondu.
  - La grille de Lucas arrive chez Thomas, et les dispos reçues apparaissent dans la liste « Choisir » (« Si besoin seulement », « Indisponible ce jour-là »).
- **Contrôle qualité** : tous les écrans des 3 profils ont été parcourus à 320 px, 390 px et sur ordinateur, avec un texte normal, x1,5 et x2.
  - L'appli suit maintenant la taille de texte réglée dans le téléphone.
  - Corrigé : en-tête et pastilles qui débordaient, feuilles du bas qui ne défilaient pas (le bouton Fermer devenait inaccessible), liste « Choisir » qui s'écrasait, lignes nom / poste.
  - Outil `outils/controle_qualite.py` (à lancer à la main) et test `test_tailles.js`.
- Tests : 689 vérifications, toutes vertes ; CI verte sur GitHub.

**Choix faits en l'absence de Pablo (à confirmer)**
- C'est le coordinateur du lieu (Thomas) qui remplit le compte rendu ; le responsable (Hélène) le reçoit. (Confirmé le matin même.)
- Les serviteurs ne voient que le merci, pas le commentaire.
- La collecte des dispos est lancée par le coordinateur, pour son lieu ; l'équipe, ce sont ceux qui ont servi à ce lieu ces dernières semaines.

**Reste à faire**
- Chez Thomas, les notifications (compte rendu, échanges, propositions) s'empilent au-dessus du planning. Il faudra peut-être les regrouper dans un seul bloc « À traiter ».
- Tester la taille de texte sur un vrai iPhone : Réglages, Luminosité et affichage, Taille du texte.
- Durée des réunions de prière dans les agendas (2h par défaut en attendant).
- WhatsApp : réponse de Manuel attendue.

## 2026-11-21 · Pablo (avec Claude) · boîte à messages et suivi automatique

**Fait**
- Manuel a accepté l'invitation : il est collaborateur du dépôt.
- `MESSAGES.md` : boîte à messages entre Pablo et Manuel (le Claude de chacun montre les messages en début de séance).
- `docs/suivi-automatique.md` : texte d'une tâche programmée qui vérifie toutes les heures (9h-23h) et prévient seulement si l'autre a changé quelque chose.
- Décisions de Pablo pour les espaces serviteur et coordinateur (3 états de réponse, indispos, échange validé par le coordinateur, fréquence max, planning proposé, espace louange) : ajoutées dans `CLAUDE.md`, section 6.
- Autres décisions de Pablo (liste "Choisir" triée par ceux qui ont le moins servi, "À traiter" visible par le coordinateur et les responsables au-dessus, servir ensemble ou séparément, tout faisable sur téléphone et ordinateur, taille de texte du téléphone, notifications iPhone, jauge, bilan annuel) : `CLAUDE.md`, section 6. Question WhatsApp posée à Manuel dans `MESSAGES.md`.
- Décisions validées par Pablo (cette nuit) : règles des conflits, liste "Choisir" en dimanches de suite / semaines sans service, "Inviter quand même" avec justification du serviteur, grille des dispos à 3 états, périmètre par (ministère, lieu), validation des modifications par le responsable au-dessus, compte rendu de service après le culte : `CLAUDE.md`, section 6.
- Liste "Choisir" refaite selon les règles validées : le moins servi en haut, "X dimanches de suite" ou "X semaines sans service", étiquettes (orange : aussi ailleurs plus tard dans la journée ou fréquence max ; rouge clair : indispo ; gris : déjà sur un autre poste ici), personnes déjà ailleurs à la même heure grisées en bas avec la raison et un bouton "Inviter quand même" (le planning affiche alors "conflit signalé"). Données d'exemple : 4 dimanches passés, indispos et fréquences max. 295 vérifications, toutes vertes.
- Décision : le responsable du ministère valide le planning avec un bouton dans l'appli ; la validation envoie les demandes aux serviteurs et ajoute les services dans les agendas, connectés une fois à la création du compte (Google : écriture directe ; iPhone et autres : abonnement), de l'heure de présence fixée par le responsable jusqu'à la fin du culte, avec mise à jour à chaque changement : `CLAUDE.md`, section 6.
- Nouvelle règle : envoi au fil de l'eau, dès qu'une modification est finie et testée (plus seulement en fin de séance).
- `CLAUDE.md` : lecture de la boîte à messages en début de séance, `git pull` avant chaque réponse pendant la séance, explication de l'aperçu à droite.
- **3 profils test** dans le prototype, choisis dans la fenêtre de connexion ("Prototype : entrer avec un profil test") ; pour changer : Moi, puis Se déconnecter.
  - **Hélène**, responsable louange : les 3 lieux, plus un bloc "À valider" (propositions de Thomas, boutons Valider / Refuser). Valider envoie les demandes aux serviteurs.
  - **Thomas**, coordinateur louange à Saint-Maurice : arrive directement sur son lieu, jauge de remplissage, bouton "Proposer" au lieu d'"Inviter" ; ses propositions affichent "en attente de validation par Hélène", puis "Validé par Hélène" ou "Refusé par Hélène".
  - **Lucas**, serviteur louange : demandes à répondre (Dispo / Pas dispo, heure de présence et fin du culte), conflit signalé avec "Me faire remplacer ici" ou "Garder les deux" (explication envoyée à Hélène), proposer un remplaçant, ses prochains services avec statut, "Qui sert ce culte" (son culte seulement), grille des dispos de décembre (dispo / si besoin / pas dispo, "Je n'ai pas d'indispo"), fréquence max, servir ensemble (Inès, sa sœur), connexion de l'agenda (simulée).
  - Les 3 profils partagent les mêmes données pendant la visite : ce que Thomas propose arrive chez Hélène, ce qu'Hélène valide arrive chez Lucas. Rien n'est enregistré (tout revient à zéro en rechargeant la page).
- Étiquette en haut de chaque espace connecté : « Prototype responsable », « Prototype coordinateur », « Prototype serviteur » (et titres des pages assortis).
- Une page par profil, qui s'ouvre directement dessus : `responsable.html`, `coordinateur.html`, `serviteur.html` (liens dans le README). Chez Pablo, 3 onglets d'aperçu du même nom.
- Correction : la bande des dates ne s'écrase plus quand la page est longue.
- Tests : `test_coordinateur.js`, `test_serviteur.js`, et la chaîne Thomas → Hélène → Lucas dans `test_phone.js`. 486 vérifications, toutes vertes.

**Décisions**
- Le dépôt, le journal, les messages et le suivi ne parlent que de l'appli (changements, décisions communes, événements techniques). Les recherches et idées de chacun restent dans son propre projet Claude.
- Le moins de délai possible entre nous deux : envoi au fil de l'eau + suivi toutes les heures, notification seulement s'il y a du nouveau.
- L'aperçu à droite ne se met à jour que quand son propre Claude le republie ; le lien public, lui, suit chaque envoi.

**Reste à faire**
- Manuel : répondre à la question WhatsApp (`MESSAGES.md`).
- Manuel : première séance, test visuel (actu "Test d'envoi réussi"), mise en place de son suivi automatique (voir `MESSAGES.md`).
- Compte rendu de service après le culte (côté responsable).
- Collecte des dispos lancée par le coordinateur, et lecture des dispos reçues dans sa liste "Choisir".
- Côté coordinateur : valider un échange entre deux serviteurs (Oui / Non).
- Durée des réunions de prière dans les agendas : à préciser (2h par défaut en attendant).

## 2026-11-20 · Pablo (avec Claude) · création du dépôt

**Fait**
- Dépôt créé à partir de la maquette Claude Design (v2) et du prototype téléphone.
- Écrans : accueil public + fenêtre "Espace membre" (connexion, création de compte, mot de passe oublié) ; espace responsable (Planning, Équipe, Actus, Moi).
- Planning : culte du dimanche ou réunion de prière, louange ou programme du culte, dates, 3 lieux, détail poste par poste, "Choisir" avec contrôle des conflits entre lieux, Sainte Cène Oui/Non.
- Données d'exemple avec des prénoms inventés (le dépôt est public).
- Tests : 270 vérifications (logique des deux écrans + parcours complet sur la page téléphone), tous verts.
- Mise en ligne automatique sur GitHub Pages à chaque envoi : https://pablo04912-dev.github.io/kerygma-app/ (vérifié dans Chrome, connexion directe au profil test OK).
- Appli GitHub "Claude" installée sur le compte de Pablo, avec accès au seul dépôt kerygma-app.
- Drive "Kerygma App" rangé : 01 Cadrage (document de cadrage complet, avec les vrais noms), 02 Données, 03 Retours des commissions, 04 Visuels, 05 Sauvegardes.
- Manuel (compte GitHub Mrmanuesq) invité comme collaborateur sur le dépôt.

**Décisions**
- Travail à deux sur ce dépôt, chacun avec son Claude ; pas de validation croisée ; résumé du travail de l'autre en début de séance.
- Vraies données uniquement dans le Drive "Kerygma App".

**Reste à faire**
- Manuel : accepter l'invitation GitHub (mail de GitHub ou github.com/pablo04912-dev/kerygma-app/invitations), puis suivre le kit de démarrage (fichier privé envoyé par Pablo).
- Prochains écrans : espace coordinateur, puis serviteur.
- Questions ouvertes : responsables de la réunion de prière à Champigny et Boulogne ; qui valide les nouveaux comptes.
