# Revue du Sprint 0

## Objectifs du sprint

Le sprint 0 visait à poser les bases de notre application de gestion d’agendas - KiAvenir.  
Les premières fonctionnalités prévues étaient les suivantes :
- Inscrire un utilisateur.
- Permettre la connexion et déconnexion d’un utilisateur.
- Créer un agenda depuis l’interface web.
- Ajouter, supprimer et gérer un rendez-vous.
- Visualiser un agenda et ses rendez-vous.

## Fonctionnalités réalisées et validées

### Visualisation d’un agenda et des rendez-vous
L’utilisateur peut consulter son agenda, voir la liste de ses événements et les détails associés. Cette fonctionnalité est entièrement fonctionnelle et validée.

### Ajout, suppression et gestion des rendez-vous
Les utilisateurs peuvent ajouter de nouveaux événements, les supprimer ou les modifier. Cette fonctionnalité a été testée et fonctionne correctement.

### Création d’un agenda via l’interface web
La possibilité pour un utilisateur de créer un nouvel agenda depuis l’interface a été implémentée avec succès.

### Connexion et déconnexion des utilisateurs
Le système d'authentification est fonctionnel, permettant à un utilisateur de se connecter à son compte et de se déconnecter en toute sécurité.
Nous avons utilisé JWT pour gérer les sessions utilisateur, ainsi que le hachage des mots de passe via l'algorithme SHA-256 pour renforcer la sécurité. 
La gestion des cookies pour les tokens d'accès a également été validée.

### Inscription d’un utilisateur
Un nouvel utilisateur peut s’inscrire en fournissant ses informations de base. 
La vérification des champs (nom d’utilisateur, email) est bien en place et les tests de cette fonctionnalité ont été concluants.

## Difficultés rencontrées

### Utilisation d’EJS pour le rendu côté serveur
La découverte d’EJS (Embedded JavaScript) a pris un peu plus de temps que prévu. 
Il a fallu s’adapter à son usage, notamment pour la gestion des données dynamiques via les routes Express. 
Toutefois, nous avons su relever ce défi et les fonctionnalités sont maintenant correctement intégrées.
