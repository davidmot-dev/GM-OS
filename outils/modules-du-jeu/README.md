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
**G2 est livré :** hôte natif, droits par personnage, reprise d’appareil, transport
ciblé, sauvegarde privée, fichiers de session et exports de campagne. Le moteur
MU/TH/UR s’enregistre dans `electron/modulesDuJeu/registre.ts` et ses composants
dans `src/modules/modulesDuJeu/vuesDuRegistre.tsx`. Aucun secret ne voyage dans
la synchronisation commune. La troisième tranche enregistre aussi le détecteur Alien,
avec accès indépendants, scan partagé, bips locaux et commande MJ **Tout couper**.
Le prototype `outils/alien` garde son manifeste et son fonctionnement autonomes.

Le banc des composants réels se construit sans GM-OS ni serveur :

```powershell
node outils/modules-du-jeu/apercu-integration.mjs --capturer
```

Il écrit `scratch/modules-du-jeu-integration/apercu.html` et 33 images aux largeurs
360, 768 et 1180 px : MU/TH/UR, vidéo, détecteur, scan partagé, faux écho et coupure.
`--manuel` copie les vues de sélection et des deux instruments dans le manuel des jeux.
Six captures du radar autonome vérifient aussi la non-régression du dessin partagé.
Le moteur/hôte et les vues sont réels, le stockage et la connexion sont en mémoire ;
ces captures ne valident pas encore une partie en réseau.

## Étape 4 : vrai transport et préparation de l’essai matériel

`e2e/modulesDuJeuAlien.spec.ts` lance Electron sur profil jetable et deux contextes Edge,
sans pont natif dans les navigateurs. Il éprouve HTTP/WebSocket, droits et confidentialité,
scan/reconnexion aux trois tailles, vidéo/Range, transfert sonore, disque et reprise/import.
Les captures et traces restent dans `scratch/modules-du-jeu-e2e/`. Les sorties audio sont
muettes vers les enceintes ; le graphe Web Audio et le décodage vidéo sont réels.

```powershell
npm.cmd run build
npx.cmd playwright test e2e/modulesDuJeuAlien.spec.ts --reporter=list --output=scratch/modules-du-jeu-e2e/resultats
node outils/modules-du-jeu/recette-alien.mjs
```

La dernière commande génère une semence fictive pour une répétition matérielle sans
campagnes personnelles. Elle ne lance aucun service. Suivre la
[recette détaillée](../../documentation/Planning/2026-10-15-recette-modules-alien.md),
en passant toujours le fichier généré à `npm.cmd run repetition -- …`.

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
essais. Il est raccordé au registre, aux autorisations, au stockage et aux vues du Hub.
Son manifeste peut être passé au validateur statique.
