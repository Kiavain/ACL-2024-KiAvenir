# Revue du Sprint 1

## Objectifs du sprint

Le sprint 1 visait à améliorer notre application initiale - KiAvenir.  
Les nouvelles fonctionnalités à implémenter étaient les suivantes :
- Voir simultanément plusieurs agendas.
- Filtrer les rendez-vous par nom avec une barre de recherche.
- Exporter et importer des agendas au format souhaité (JSON ou iCal).
- Partager un agenda entre utilisateurs avec une gestion de permission.
- Créer des rendez-vous récurrents et gérer la récurrence.

## Fonctionnalités réalisées et validées

### Voir simultanément plusieurs agendas.
Les utilisateurs peuvent désormais sélectionner plusieurs agendas et afficher tous les événements associés sur une seule vue.
Cette fonctionnalité a été implémentée avec succès.
Néanmoins, des améliorations sont envisagées sur la gestion de la route pour mieux gérer la sélection.

### Filtrer les rendez-vous par nom avec une barre de recherche.
Les utilisateurs peuvent désormais rechercher des événements par nom à l'aide d'une barre de recherche.
Cette fonctionnalité a été implémentée et validée.
De la même façon, nous avons des idées d'amélioration, mais cette fois-ci, ça se porterait sur des tags que nous pourrions ajouter aux événements et filtrer aussi également par rapport à ceux-là ou la description.

### Exporter et importer des agendas au format souhaité (JSON ou iCal).
Les utilisateurs peuvent exporter et importer des agendas au format JSON ou iCal.
Cette fonctionnalité a été testée et fonctionne correctement.
Précision : l'importation d'un fichier iCal ne permet pas de charger une couleur.

### Partager un agenda entre utilisateurs avec une gestion de permission.
Le propriétaire d'un agenda peut désormais partager celui-ci avec d'autres utilisateurs et leur attribuer des permissions spécifiques.
L'utilisateur éditeur d'un agenda pour modifier les événements, tandis que l'utilisateur lecteur ne peut que consulter les événements.
Cette fonctionnalité a été implémentée et validée.

### Créer des rendez-vous récurrents et gérer la récurrence.
Cette fonctionnalité n'a pas été implémentée dans ce sprint.

## Difficultés rencontrées

### Aucune difficulté majeure n'a été rencontrée lors de ce sprint.
Nous avons rencontré aucun problème majeur lors du développement des fonctionnalités prévues pour ce sprint.
Le travail a été bien réparti et chaque membre a pu avancer efficacement sur ses tâches.
Les seuls problèmes mineurs de développement étaient liées aux gestions de fichier sur Windows qui diffère de Linux.
