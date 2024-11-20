# Revue du Sprint 2

## Objectifs du sprint

Le sprint 2 visait à ajouter de nouvelles fonctionnalités à KiAvenir :

Les nouvelles fonctionnalités à implémenter étaient les suivantes :
- Implémentation de rendez-vous récurrents.
- Créer un événement directement en cliquant sur le calendrier.
- Modifier un agenda.
- Créer des événements "All day".
- Importer les jours fériés français.

## Fonctionnalités réalisées et validées

### Implémentation de rendez-vous récurrents.
Les utilisateurs peuvent désormais créer et modifier des événements en ajoutant/modifiant la récurrence de ceux-ci.
Cette récurrence est pour le moment assez basique, mais elle permet de créer des événements récurrents de manière journalière, hebdomadaire, mensuelle ou annuelle.
Cette fonctionnalité a été implémentée et validée.

### Créer un événement directement en cliquant sur le calendrier.
Les utilisateurs peuvent désormais créer un événement directement en cliquant sur le calendrier.
En fonction de l'endroit où l'utilisateur, la fenêtre de création d'événement s'ouvre avec les informations pré-remplies.
Cette fonctionnalité a été implémentée et validée.

### Modifier un agenda.
Les utilisateurs peuvent désormais modifier un agenda en changeant sa couleur et sa description.
La description est désormais visible en survolant l'agenda dans la liste des agendas.
Cette fonctionnalité a été implémentée et validée.

### Créer des événements "All day".
Les utilisateurs peuvent désormais créer des événements qui dure toute la journée.
Ils sont distingués des autres événements, plus haut.
Cette fonctionnalité a été implémentée et validée.

### Importer les jours fériés français.
À la création du compte utilisateur, un agenda contenant les jours fériés français est automatiquement ajouté.
Les utilisateurs peuvent désormais voir les jours fériés français dans leur calendrier et d'autres calendriers de vacances également.
Ils ont aussi la possibilité de supprimer cet agenda s'ils le souhaitent ou de modifier ses événements.
Cette fonctionnalité a été implémentée et validée.

## Difficultés rencontrées

### Différences de développement entre Windows et Linux
Comme pour les précédents sprints, notre plus grande difficulté est de réussir à exécuter le serveur dans l'état souhaité sur Linux et Windows.
Ici le problème résidait dans la fonction toLocalString() concernant les dates, ces fonctions n'ont pas le même format sur les deux systèmes d'exploitation.
Nous avons dû adapter notre code pour que cela fonctionne sur les deux systèmes.


