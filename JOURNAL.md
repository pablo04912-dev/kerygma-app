# Journal du projet

Une entrée par séance, la plus récente en haut. Format : date · qui · ce qui a été fait · décisions · reste à faire.

## 2026-11-21 · Pablo (avec Claude) · boîte à messages et suivi automatique

**Fait**
- Manuel a accepté l'invitation : il est collaborateur du dépôt.
- `MESSAGES.md` : boîte à messages entre Pablo et Manuel (le Claude de chacun montre les messages en début de séance).
- `docs/suivi-automatique.md` : texte d'une tâche programmée qui vérifie toutes les heures (9h-23h) et prévient seulement si l'autre a changé quelque chose.
- Décisions de Pablo pour les espaces serviteur et coordinateur (3 états de réponse, indispos, échange validé par le coordinateur, fréquence max, planning proposé, espace louange) : ajoutées dans `CLAUDE.md`, section 6.
- Autres décisions de Pablo (liste "Choisir" triée par ceux qui ont le moins servi, "À traiter" visible par le coordinateur et les responsables au-dessus, servir ensemble ou séparément, tout faisable sur téléphone et ordinateur, taille de texte du téléphone, notifications iPhone, jauge, bilan annuel) : `CLAUDE.md`, section 6. Question WhatsApp posée à Manuel dans `MESSAGES.md`.
- Décisions validées par Pablo (cette nuit) : règles des conflits, liste "Choisir" en dimanches de suite / semaines sans service, "Inviter quand même" avec justification du serviteur, grille des dispos à 3 états, périmètre par (ministère, lieu), validation des modifications par le responsable au-dessus, compte rendu de service après le culte : `CLAUDE.md`, section 6.
- Liste "Choisir" refaite selon les règles validées : le moins servi en haut, "X dimanches de suite" ou "X semaines sans service", étiquettes (orange : aussi ailleurs plus tard dans la journée ou fréquence max ; rouge clair : indispo ; gris : déjà sur un autre poste ici), personnes déjà ailleurs à la même heure grisées en bas avec la raison et un bouton "Inviter quand même" (le planning affiche alors "conflit signalé"). Données d'exemple : 4 dimanches passés, indispos et fréquences max. 295 vérifications, toutes vertes.
- Décision : la validation du responsable du ministère déclenche les demandes aux serviteurs et l'ajout automatique dans leurs agendas (invitation d'agenda par e-mail, compatible Google, Apple, Outlook), de l'heure de présence fixée par le responsable jusqu'à la fin du culte : `CLAUDE.md`, section 6.
- Nouvelle règle : envoi au fil de l'eau, dès qu'une modification est finie et testée (plus seulement en fin de séance).
- `CLAUDE.md` : lecture de la boîte à messages en début de séance, `git pull` avant chaque réponse pendant la séance, explication de l'aperçu à droite.

**Décisions**
- Le dépôt, le journal, les messages et le suivi ne parlent que de l'appli (changements, décisions communes, événements techniques). Les recherches et idées de chacun restent dans son propre projet Claude.
- Le moins de délai possible entre nous deux : envoi au fil de l'eau + suivi toutes les heures, notification seulement s'il y a du nouveau.
- L'aperçu à droite ne se met à jour que quand son propre Claude le republie ; le lien public, lui, suit chaque envoi.

**Reste à faire**
- Manuel : répondre à la question WhatsApp (`MESSAGES.md`).
- Manuel : première séance, test visuel (actu "Test d'envoi réussi"), mise en place de son suivi automatique (voir `MESSAGES.md`).
- Écran coordinateur, dans l'ordre : profil test d'un coordinateur avec son périmètre et les modifications à valider côté responsable ; compte rendu de service ; côté serviteur (grille des dispos, réponse dispo / pas dispo, échange, choix en cas de conflit signalé).

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
