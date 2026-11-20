# Idées prises dans d'autres applis

Tour d'horizon fait le 21/11/2026 (Pablo avec Claude), avant de construire les écrans coordinateur et serviteur. But : voir ce que font les applis d'église, de bénévoles et d'entreprise, et garder ce qui colle à KERYGMA. On reste sur notre appli à nous.

## Applis regardées

- **Planning Center** (États-Unis) : la référence pour le planning des cultes et des équipes de louange. En anglais seulement.
- **ChurchTools** (Allemagne) : logiciel d'église tout-en-un, interface en français disponible.
- **Elvanto / Tithely** (Australie) : planning des équipes très complet.
- **ChMeetings**, **Eliakim** (francophone), **Breeze**, **ChurchCRM** : logiciels de gestion d'église, surtout fiches membres et dons.
- **Microsoft Teams Shifts** : plannings d'équipes en entreprise (créneaux, échanges, congés).
- **Slack** : messagerie d'entreprise (canaux, automatisations).
- **WhatsApp Communautés** : groupe d'annonces + groupes par thème.
- **Bénévalibre** (logiciel libre français) : suivi du temps des bénévoles.

## Ce qui confirme nos choix

- **Tout en français** : les comparatifs francophones mettent Planning Center et Breeze en bas de classement parce qu'ils sont en anglais.
- **Gros boutons** : un pasteur reproche à ChurchTools un texte parfois très petit et des liens difficiles à toucher. Notre règle des 44 px est la bonne.
- **Contrôle des conflits** : Elvanto avertit quand une personne est placée sur deux postes qui se chevauchent. On le fait déjà entre les 3 lieux.
- **Programme du culte ligne par ligne**, Sainte Cène comprise : c'est aussi ce que fait Planning Center.
- **Pas de fiche membre complète** : la plupart de ces logiciels stockent beaucoup de données personnelles. Nous, on garde seulement prénom, nom, e-mail.

## À reprendre en priorité (écrans coordinateur et serviteur)

1. **Accepter / Refuser chaque service.** Le serviteur reçoit une demande et répond. Le coordinateur voit l'état de chaque poste : en attente, confirmé, refusé. Un motif est demandé en cas de refus (Elvanto).
2. **Indisponibilités saisies à l'avance**, ponctuelles ou répétées (exemple : "tous les 1ers dimanches"). Si le coordinateur place quelqu'un d'indisponible, l'appli l'avertit (Planning Center).
3. **Demande d'indispos avant de faire le planning.** Le coordinateur envoie "je prépare décembre, mettez vos indispos" ; chacun répond, ou clique "Je n'ai pas d'indispo" (Planning Center).
4. **Remplacement par le serviteur lui-même.** S'il ne peut pas venir, il choisit "Me faire remplacer" : l'appli prévient ceux qui peuvent tenir le même poste ; le premier qui accepte prend la place, les autres sont prévenus que c'est réglé (Elvanto ; échanges aussi dans ChurchTools et Teams Shifts).
5. **Fréquence souhaitée** : "au plus 2 fois par mois", "une fois par trimestre", "en pause". L'appli avertit le coordinateur si on dépasse. Évite d'épuiser toujours les mêmes (Planning Center).
6. **Servir ensemble ou séparément** (couples, familles) : manque souvent signalé par les utilisateurs d'Elvanto, géré par Planning Center.
7. **Rappels et agenda** : rappel la veille, et abonnement à un agenda (iPhone, Google) qui contient tous ses services (Planning Center, ChurchTools).
8. **Moins de notifications** : regrouper les messages en un seul (Planning Center l'a fait pour réduire les e-mails). Important pour les personnes âgées.

## Pour la louange (plus tard)

- **Bibliothèque de chants** : tonalités (par exemple "tonalité femme", "originale"), versions, étiquettes (rapide, Sainte Cène…).
- **Liste des chants du culte** avec liens audio ou vidéo pour répéter avant le culte.
- **Déroulé du culte avec horaires**, ligne par ligne.

## Plus tard (automatique)

- **Planning proposé automatiquement**, en respectant indispos et fréquences ; le coordinateur corrige ensuite. Elvanto prévient lui-même que l'automatique ne convient pas à tous les cas.
- **Remplacement automatique** quand quelqu'un refuse : la demande part vers le suivant disponible, ou une inscription libre est ouverte aux personnes du même poste (Planning Center, 2024).
- **Postes ouverts** : le coordinateur publie un poste vide, ceux qui peuvent le tenir s'inscrivent (Teams Shifts, Planning Center).
- **Vue sur plusieurs semaines** côte à côte (Planning Center).

## Communication : idées de Slack et WhatsApp

- **Ne pas refaire un WhatsApp.** Les discussions restent sur WhatsApp ; l'appli gère les plannings.
- **Un seul fil d'annonces officiel**, où seuls les responsables publient (comme le groupe d'annonces des Communautés WhatsApp). C'est notre onglet Actus.
- **Numéros de téléphone** : WhatsApp conseille de ne pas @mentionner dans le groupe d'annonces, sinon le numéro est visible de toute la communauté. Argument de plus pour notre règle "pas de téléphone dans l'appli".
- **Demandes rangées** (Slack Workflow Builder : formulaires, rappels, demandes à valider). Idée : un bouton "Faire une demande" (remplacement, matériel, info) qui arrive chez le bon coordinateur, avec "Je m'en occupe" pour que les autres sachent que c'est pris.

## Pour les membres (bien plus tard)

L'appli membres de Planning Center (Church Center) regroupe calendrier des événements, prédications, groupes avec discussion, dons et pointage des enfants par QR code. Pour KERYGMA : calendrier, groupes de maison, sujets de prière. Le pointage des enfants touche des données sensibles : à n'aborder qu'avec un cadre clair.

## Décisions à prendre

- On intègre les points 1 à 5 dans les écrans coordinateur et serviteur ?
- Remplacement : passe directement, ou le coordinateur valide (comme Teams Shifts, où le responsable approuve) ?

## Sources

- Planning Center : https://help.planningcenter.com/en/manage-blockout-dates.html, https://help.planningcenter.com/en/send-blockout-requests-for-predictable-scheduling.html, https://help.planningcenter.com/en/set-your-scheduling-preferences.html, https://www.planningcenter.com/changelog/services/new-additional-scheduling-preference-options-for-volunteers-once-a-quarter-and-unavailable-, https://www.planningcenter.com/blog/2024/09/auto-reschedule-declined-volunteer-requests-in-services, https://planningcenter.com/services, https://planningcenter.com/church-center
- Elvanto : https://help.elvanto.com/hc/en-us/articles/7659757415191-How-to-Swap-Replace-or-Decline-a-Volunteer-Request, https://help.elvanto.com/hc/en-us/articles/7604005299863, https://tithely.canny.io/chms-feature-requests/p/as-a-schedule-user-id-like-it-if-volunteers-could-be-set-to-serve-together-or-se
- ChurchTools : https://church.tools/?p=8072, https://www.capterra.com/p/158007/ChurchTools/reviews/
- Microsoft Teams Shifts : https://support.microsoft.com/en-au/teams/shifts/request-open-shifts-swap-or-offer-shifts-in-shifts
- WhatsApp Communautés : https://www.whatsapp.com/communities/learning/buildingasafecommunity?lang=fr
- Slack : https://slack.com/resources/using-slack/30-ways-to-automate-work-in-slack
- Comparatif francophone : https://hackceleration.com/fr/labs/meilleur/logiciel-gestion-eglise
