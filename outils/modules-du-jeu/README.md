# Modules du jeu — contrat et outils de référence

Le [contrat v1](../../documentation/Architecture/Contrat-des-modules-du-jeu.md)
fixe le standard des modules destinés à l'espace générique du Tablet Hub.
Créé le 15/10/2026 après accord de David pour formaliser ce standard.

## Livré ici

- `valider.mjs` : contrôle statique des manifestes v1 ; exporte aussi
  `validerLesReferences` pour la forme du champ de pilote. Les fonctions pures
  vivent dans `contrat.mjs`, partagé avec GM-OS sans import Node dans le navigateur.
- `exemple/manifeste.json` et `exemple/moteur.mjs` : moteur pur de référence.
  Le MJ publie un texte, chaque PJ accuse sa propre lecture. Un PJ ne reçoit
  pas les accusés des autres. Le corpus `exemple` est réservé aux essais.
- `verification.mjs` : essais du format, du CLI et des comportements du moteur.

**G0 et l’emplacement G1 sont intégrés au code de GM-OS :** `GameDriver.modulesDuJeu`,
catalogue de métadonnées, sélection dans le pilote, contrôle Forge/restauration/import,
export/import conservant les références, entrée au cockpit et onglet vide dans le Hub.
L’hôte exécutable, les droits et la connexion privée restent à construire.
Le prototype `outils/alien` garde son manifeste et son fonctionnement autonomes.

Le banc des composants réels se construit sans GM-OS ni serveur :

```powershell
node outils/modules-du-jeu/apercu-integration.mjs --capturer
```

Il écrit `scratch/modules-du-jeu-integration/apercu.html` et neuf images aux largeurs
360, 768 et 1180 px. `--manuel` copie la vue de sélection dans le manuel des jeux.
Les stores sont fictifs ; ces captures ne valident pas encore une partie en réseau.

## Vérifier un manifeste

Depuis la racine du dépôt, sans installation ni serveur :

```powershell
node outils/modules-du-jeu/valider.mjs outils/modules-du-jeu/exemple/manifeste.json
node --test outils/modules-du-jeu/verification.mjs
```

Le validateur accepte plusieurs chemins et refuse les identifiants de module
en doublon dans le lot. Codes de sortie : `0` conforme, `1` refus ou lecture
impossible, `2` absence de fichier à contrôler. `--help` affiche l'usage.
Les fonctions exportées renvoient une liste de diagnostics, vide si conforme.

Un résultat **MANIFESTE CONFORME** porte seulement sur les métadonnées.
La disponibilité réelle du module, sa compatibilité avec le pilote courant,
le filtrage, la persistance et les vues demandent les essais du contrat.
Le CLI lit du JSON et n'importe aucun code indiqué par le module.

## Adapter un module

1. Écrire son manifeste selon le contrat, puis le contrôler.
2. Fournir le moteur : `creerEtat`, `validerEtat`, `migrerEtat`,
   `appliquerCommande`, `vuePour`, `arreterEffets`.
3. Éprouver ses commandes et ses vues filtrées avec plusieurs lecteurs.
4. Au développement de l'hôte, enregistrer explicitement le moteur et les
   composants joueur/MJ, puis référencer le module dans le pilote compatible.
5. Vérifier le transport, les accès MJ, la sauvegarde et les vues sur appareils.

Le moteur reçoit un contexte établi par l'hôte. Lui passer directement un
contexte inventé par un client ne constitue pas une authentification.
Le standard d'interface permet des mécaniques propres à chaque jeu.

## Premier adaptateur réel

Le [module MU/TH/UR](../alien/modules/muthur/README.md) fournit un manifeste
v1, le moteur réutilisant le prototype Alien, des composants React et leurs
essais. Il attend l'hôte du Hub pour son intégration ; son manifeste peut
déjà être passé au validateur statique.
