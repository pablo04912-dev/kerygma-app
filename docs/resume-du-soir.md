# Résumé du soir

Chaque soir, une tâche programmée dans ton Claude regarde si l'autre a changé quelque chose dans le dépôt. S'il n'y a rien, tu ne reçois rien. S'il y a du nouveau, tu reçois une notification avec un résumé en 3 lignes.

## Mise en place (une seule fois)

Dans une conversation avec ton Claude, colle ce message en remplaçant les deux prénoms et l'heure :

> Crée une tâche programmée "Résumé du soir KERYGMA App", tous les jours à 21h (heure de Paris), avec le texte ci-dessous (section "Texte de la tâche"), en remplaçant <MOI> par mon prénom et <AUTRE> par le prénom de l'autre. Notification sur mon téléphone uniquement.

Si ton Claude n'a pas d'outil de tâches programmées, il te le dira : dans ce cas, le résumé de début de séance suffit.

## Texte de la tâche

Tu fais le résumé du soir du projet KERYGMA App pour <MOI>. Réponds en français, ton direct, sans jargon et sans tiret cadratin.

1. Récupère le dépôt public https://github.com/pablo04912-dev/kerygma-app : `git pull` s'il est déjà là, sinon `git clone` dans un dossier de travail.
2. Regarde ce qui a changé ces dernières 24 heures : `git log --since="24 hours ago" --stat`, les nouvelles entrées de `JOURNAL.md` et la partie "Pour <MOI>" de `MESSAGES.md`. Ne garde que ce qui vient de <AUTRE> (les commits dont l'auteur ne contient pas "<MOI>", les entrées du journal signées <AUTRE>, ses messages).
3. S'il n'y a rien de nouveau venant de <AUTRE> : n'envoie aucun message, termine par une seule ligne "Rien de nouveau".
4. Sinon, envoie à <MOI> un message (SendUserMessage) de 3 lignes maximum : ce que <AUTRE> a fait, les décisions, ce qui reste ; puis ses messages pour <MOI> s'il y en a. Si un écran a changé, ajoute le lien https://pablo04912-dev.github.io/kerygma-app/
5. Lecture seule : ne modifie aucun fichier du dépôt, aucun commit, aucun envoi.
