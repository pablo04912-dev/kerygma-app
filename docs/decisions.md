# Décisions déjà prises

Rangées par écran. Avant de toucher un écran, lis seulement la partie qui le concerne (`grep -n "^## " docs/decisions.md` pour voir les titres). Quand une décision change, modifie-la ici, à sa place, et note-la dans `JOURNAL.md`.

## Général

- Nom : **KERYGMA**. 100 % français pour l'instant. Gratuit.
- 3 lieux : Saint-Maurice (dim. 10h30), Champigny (dim. 10h30), Boulogne (dim. 15h30). Réunion de prière : jeudi 20h Saint-Maurice, mercredi 20h Champigny et Boulogne.
- On commence par la **louange** (testée sur les 3 lieux) et par l'espace des **responsables** ; les membres ensuite.
- Rôles : pasteurs principaux (tout), pasteurs de lieu (leur lieu, voient les autres), responsable de commission (sa commission, 3 lieux), coordinateur de lieu (sa commission, son lieu), serviteur (ses dispos).
- Vocabulaire : le **coordinateur** remplit le planning (d'un lieu) ; le **responsable du ministère** le valide.
- Périmètre de chaque responsable ou coordinateur : une liste de couples (ministère, lieu), par exemple sono à Champigny et à Boulogne, mais pas à Saint-Maurice. Il voit et gère exactement ce périmètre. Une personne peut coordonner plusieurs ministères.
- Une personne peut servir dans plusieurs lieux : conflit seulement si deux réunions se chevauchent.
- Les discussions restent sur WhatsApp ; l'appli gère plannings et annonces.
- WhatsApp (envoyer depuis l'appli vers une communauté KERYGMA et ses groupes) : en suspens, question posée à Manuel.
- Le document de cadrage complet (avec les vrais noms) est dans le Drive "Kerygma App", dossier "01 Cadrage".
- **Prototype** : "Se connecter" ouvre directement le profil de Hélène ; la fenêtre de connexion propose aussi les 3 profils test (Hélène responsable, Thomas coordinateur, Lucas serviteur). À retirer avant la vraie appli.

## Ergonomie (tous les écrans)

- Tout doit pouvoir se faire sur téléphone **et** sur ordinateur, y compris remplir un planning.
- Boutons d'au moins 44 px, sans les surdimensionner ; lisibles par tous les âges.
- L'appli respecte la taille de texte réglée dans le téléphone sans casser l'affichage.
- Effet au toucher : tout bouton se grise légèrement quand on appuie. Retour = une flèche seule. Pas de barres de défilement visibles.
- **Feuilles du bas** : pas de bouton « Fermer » ; toucher la zone grise (ou la poignée en haut) fait descendre la feuille. Sur téléphone, les feuilles et champs de message restent au-dessus du clavier.
- Dates : « Ce dimanche 22 novembre » pour le dimanche de la semaine en cours, sinon « Dimanche 29 novembre » (D majuscule).
- Pas de classements, de points ni de séries.

## En-tête et barre du bas

- En-tête : KERYGMA au centre, en grand ; la bulle avec l'initiale (en haut à droite) ouvre « Moi » (profil). Pas de « Bonjour … » : on garde les puces de rôle (« Ancienne · Saint-Maurice », « Responsable louange »).
- Barre du bas, dans cet ordre : Planning, **À faire**, Actus, Équipe, sur tous les écrans connectés ; barre flottante façon Instagram (capsule blanche translucide, fond flouté visible derrière, bulle grise qui glisse sous l'onglet touché ; on garde les noms sous les icônes et le violet), avec une pastille rouge qui compte ce qu'il reste à faire.
- À faire : responsable = plannings du mois à valider (« Tout est rempli ») et envois du coordinateur (« Vu ») ; coordinateur = compte rendu à remplir, échanges à valider, envois et validations du responsable (« Vu ») ; serviteur = demandes de service et d'échange.
- Notifications sur iPhone : priorité (il faut ajouter l'appli à l'écran d'accueil ; prévoir un pas-à-pas).

## Accueil du responsable (onglet Planning)

- Onglets soulignés « Culte du dimanche / Réunion de prière », puces « Programme culte » (en premier) et « Louange », bande des dates.
- Puis **le dimanche choisi** dans la bande (« Ce dimanche 22 novembre » par défaut ; les 3 cultes : qui sert, tâches, choix pas encore envoyés).
- Puis, quel que soit le dimanche choisi, **Compte rendu de dimanche dernier** (les 3 cultes, avec tout à droite une bulle « Ajouter un commentaire » qui ouvre le compte rendu, curseur dans le commentaire ; « Commenté ✓ » une fois fait). Plus de « Dimanches suivants » (22/11).
- Sainte Cène une fois sur deux : bouton Oui/Non. Le rôle "Louange" du programme est repris de la direction du planning louange.
- "À traiter" (postes vides, absences, conflits) : visible par le coordinateur du ministère concerné et par les responsables au-dessus de lui.

## Bande des dates et calendrier du mois

- **Bande des dates** (22/11) : le bouton « Mois » reste fixe à gauche ; la bande montre **2 mois à la fois** (janvier-février, mars-avril, …, novembre-décembre), avec une pastille au début de chaque mois (« Novembre », « Décembre » ; « janvier 2027 » avec l'année quand ce n'est pas 2026). Flèche « › » à la fin : les 2 mois suivants (la bande revient au début) ; flèche « ‹ » au début : les 2 mois d'avant. En changeant de 2 mois, on tombe sur le dimanche le plus proche d'aujourd'hui (ce dimanche, sinon le premier à venir ou le dernier passé). La date d'avant reste visible en entier. Dimanches de janvier 2026 à décembre 2027.
- Les **dimanches passés** se consultent (qui a servi) mais ne se modifient plus (« Dimanche passé »).
- « Mes dimanches » du serviteur : mêmes 2 mois et flèches, à partir d'aujourd'hui (la pastille ouvre le calendrier du mois).
- **Calendrier du mois** : le bouton « Mois » ouvre le calendrier du mois ; un bouton flèche à gauche le réduit, le mois est centré. Les jours où je sers sont en violet (violet clair si pas encore confirmé), avec un point s'il y a une tâche à faire. Pour la louange, pas de vert ni de rouge (« Aucun » n'est pas « à pourvoir »). Pas de « Date affichée » dans la légende.

## Planning louange (lignes, Choisir, Auto)

- **Lignes** : deux parties, **VOIX** (de base : Direction, Voix) et **INSTRUMENTS** (de base : Piano, Batterie, Guitare acoustique), chacune avec un bouton « + » pour ajouter une voix (une voix en plus, ou une voix personnalisée) ou un instrument (basse, guitare électrique, ou instrument personnalisé) ; un poste ajouté peut être retiré (« Retirer ce poste »). En-tête de chaque partie : titre en grand, Auto sur la même ligne à droite de VOIX ; mêmes espacements pour les deux parties.
- Une bulle par poste (une par personne) : rôle à gauche, puis [nom ou « Aucun »] et [Tâche]. Par défaut « Aucun » : personne à ce poste, ce n'est **pas** « à pourvoir » (22/11) ; donc pas de « Manque », de compteur « X sur 7 », de vert/rouge dans le calendrier louange, ni de bouton « Modifiable ». Toucher le nom ouvre la liste pour choisir ou changer ; « Aucun » en haut de la liste retire la personne. Vert avec une coche = la personne a confirmé ; rouge = pas dispo.
- Liste "Choisir" : ceux qui ont **le moins servi en premier**. En petit : "2 dimanches de suite"… pour ceux qui enchaînent ; "2 semaines sans service"… pour les autres (compté en semaines).
- Conflits entre lieux : rouge = déjà ailleurs à la même heure (ou prière le même soir ailleurs) ; orange = même jour à un horaire compatible, ou fréquence max atteinte ; rouge clair = indispo déclarée ; gris = déjà sur un autre poste du même culte.
- Personnes déjà ailleurs à la même heure : grisées en bas **avec la raison** ("Sert à Champigny à 10h30"), mais on peut quand même les choisir (« Choisir quand même », utile en cas d'erreur de planning). Le serviteur choisit alors : se faire remplacer sur l'un des deux, ou garder les deux exceptionnellement en justifiant au responsable.
- **Bouton Auto** (responsable et coordinateur, sur le planning d'un culte) : propose des noms pour les postes affichés sans personne, d'après qui a le moins servi, les indispos, les dispos du mois (« si besoin » en dernier), la fréquence max et « servir ensemble » choisis par chaque serviteur, les conflits avec les autres lieux ; jamais quelqu'un qui sert déjà ce culte. Les noms proposés vont dans le brouillon ; on peut en changer, puis on envoie le planning. Il ne remplit que les postes affichés : la basse, par exemple, seulement si on l'a ajoutée avec « + ».

## Brouillon, envoi et validation du mois

- **Brouillon puis envoi** (22/11) : choisir quelqu'un (ou « Aucun », ou Auto) ne prévient personne ; le nom est en brouillon (violet pointillé, « Pas encore envoyé »). Un bouton « Envoyer le planning aux volontaires », collé au-dessus de la barre du bas, envoie tous les changements du lieu : demandes aux volontaires (« Demande envoyée »), et l'autre (responsable ou coordinateur) est prévenu dans « À faire ». Si on quitte la page avec un brouillon : « Envoyer les invitations ? » Oui, envoyer / Non, plus tard (le brouillon reste). Le coordinateur envoie lui-même, sans validation poste par poste.
- **Validation du mois dans l'appli** : le responsable valide le planning d'un mois et d'un lieu (bouton « Valider le planning de novembre » sous les postes), à tout moment, même si tout n'est pas rempli ; quand chaque volontaire du mois a répondu dispo, il reçoit dans « À faire » la carte « Tout est rempli … Tu peux valider si c'est bon pour toi ». Le coordinateur est prévenu (« Planning validé »). Après validation, responsable et coordinateur peuvent toujours modifier ; chaque changement est envoyé aux volontaires concernés. Pas d'e-mail de validation.
- Hypothèse en attente de confirmation : c'est la validation du mois qui ajoute les services confirmés aux agendas.

## Agendas et heures

- **Agendas** : chacun connecte son agenda une seule fois, dans l'appli, à la création du compte. Ensuite, à chaque validation, ses services (serviteurs, coordinateurs, responsables : tout ce qui le concerne) s'ajoutent tout seuls dans son agenda, sans invitation à accepter, et se mettent à jour à chaque changement (échange, remplacement, nouvelle heure). Pistes techniques :
  - Google Agenda : connexion Google dans l'appli, l'appli écrit directement dans l'agenda (mise à jour immédiate). L'accès à l'agenda est une autorisation "sensible" chez Google : vérification de l'appli à prévoir avant le lancement (page de confidentialité, jusqu'à 10 jours) ; sans vérification, écran d'avertissement et 100 utilisateurs maximum (suffisant pour les tests).
  - Agenda de l'iPhone : bouton "Ajouter à l'agenda de l'iPhone" (abonnement), l'iPhone se met à jour tout seul (toutes les 15 min par défaut).
  - Outlook et autres : abonnement aussi (mise à jour plus lente), connexion directe plus tard si besoin.
- **Heure de présence** : fixée par le responsable de chaque ministère, par lieu (exemple : louange à Saint-Maurice à 9h), modifiable pour une date. L'événement d'agenda va de l'heure de présence à la fin du culte, comptée **2h30 après le début** (un culte dure au moins 2h) : Saint-Maurice et Champigny 10h30 → 13h, Boulogne 15h30 → 18h. Réunions de prière : durée à préciser.

## Serviteur

- Réponse à une demande de service : 3 états, **en attente**, **dispo**, **pas dispo**.
- **Serviteur avec plusieurs services** (exemple : Lucas, louange et projection) : en haut de son planning, des onglets « Tout », « Projection », « Louange » ; « Mes dimanches » et « Mes prochains services » suivent l'onglet choisi ; « À faire » garde toutes les demandes.
- Un serviteur, dans le culte où il sert, voit la liste de **tous ceux qui servent ce culte-là** (tous ministères) ; il ne voit pas les autres lieux.
- Indispos saisies à l'avance par chaque serviteur ; le coordinateur peut lancer une collecte des indispos pour un mois. S'il place quand même quelqu'un d'indisponible, la demande le signale au serviteur.
- Collecte des dispos du mois : grille façon Doodle, chaque toucher change l'état de la date : **dispo** (vert), **si besoin** (orange), **pas dispo** (rouge) ; bouton "Je n'ai pas d'indispo".
- Échange : le serviteur demande à un autre de le remplacer ; si l'autre accepte, le coordinateur valide (Oui/Non) ; le planning change et le coordinateur voit "X remplacé par Y (X pas dispo)".
- Fréquence maximale par serviteur (par mois, par trimestre, en pause), avec avertissement si elle est dépassée.
- Servir ensemble ou séparément : réglage pour couples, familles, frères et sœurs qui vivent ensemble (même culte ou même jour, ou au contraire jamais le même jour).
- Bilan de l'année pour chaque serviteur, sans classement.

## Création de compte (vraie appli)

- Pour tous les rôles, quelques questions au début : fréquence souhaitée (1, 2, 3 fois par mois…), services dont on fait partie, rôle dans chaque service (par exemple louange : voix, guitare… plusieurs choix possibles), famille et servir ensemble ou non. Les rôles déclarés sont confirmés au-dessus : serviteurs par leur coordinateur ou responsable, coordinateurs par les responsables. Limite de fréquence (par exemple 3 fois par mois au plus) à voir avec les pasteurs.

## Compte rendu, messages et tâches

- **Compte rendu de service** : après le culte, le **coordinateur du lieu** reçoit une notification et remplit le compte rendu : présents / absents (cases à cocher sur la liste prévue), commentaire (ce qui s'est bien passé, problèmes, à améliorer), bouton "Message" sur chaque personne de la liste pour lui écrire seule, et option "Très bon service" qui envoie un merci à toute l'équipe présente : un seul champ de message, avec les 3 débuts proposés dedans tant qu'il est vide ; on en touche un (ou on écrit directement), puis on écrit la suite. Même chose pour le message des responsables. Après l'envoi, la confirmation verte rappelle à qui, puis le message à la ligne. Le compte rendu remonte aux responsables au-dessus. Les serviteurs ne voient que les messages, jamais les commentaires.
- Lecture par le responsable : en haut « Compte rendu · Sylvie », le lieu en grand, puis présents et absents ; les 3 rubriques (Ce qui s'est bien passé, Problèmes, À améliorer) sont toujours là, avec « Aucun » à droite quand c'est vide.
- **Au-dessus du coordinateur** (responsables, parfois eux-mêmes pasteurs, et pasteurs principaux) : chacun peut laisser un **commentaire général** sur le service, que le coordinateur voit, et **envoyer un message personnalisé** (par exemple "très bon service") à n'importe quel serviteur : une ou plusieurs personnes, ou toute l'équipe. Possible même avant que le coordinateur ait rempli son compte rendu.
- **Messages privés** (règle pour tous) : un message envoyé en direct (à une personne, à quelques-unes ou à l'équipe) n'est vu que par celui qui l'envoie et ceux qui le reçoivent. Le responsable ne voit donc pas les mercis ni les messages du coordinateur à son équipe ; chacun ne voit que ses propres commentaires ou ceux qui lui sont adressés.
- **Tâches** : le coordinateur et les responsables confient une tâche à une personne du planning (bouton "Tâche" sur sa ligne, grisé tant qu'il n'y a personne) : une tâche par personne et par culte, écrite librement ; « Aucune tâche » par défaut ; toujours modifiable. Pas de liste prédéfinie, pas de résumé des tâches : la tâche s'écrit en petit et en gris sous la ligne. Pas de validation par le responsable. Le serviteur la voit sur son planning (point sur le dimanche, "1 tâche à faire") et dans le détail du service, et la coche quand c'est fait ; le planning affiche alors "faite".

## Plus tard

- Espace louange : bibliothèque de chants avec tonalités et liens audio pour répéter.
- Planning proposé automatiquement : c'est le bouton Auto ; le coordinateur ou le responsable le modifie s'il veut, puis l'envoie.
