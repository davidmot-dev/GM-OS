# GM-OS Campagnes de test — sources du plugin privé

[Ouvrir le plugin](https://chatgpt.com/plugins/plugins_6ae484c30bd4819186676a390b1b74bf), version 0.2.0, créé le 30/10/2026 et adapté le 01/11/2026 à la demande de David : **toutes les futures campagnes d'essais sont des campagnes complètes dans un seul .gmos**.

Le paquet contient un skill, six références, un utilitaire Python sans dépendances, un README, une icône et les manifestes portable/de compatibilité. Il fonctionne avec des fichiers joints dans ChatGPT ou les sources d'un dépôt dans Codex. Aucun accès automatique à l'application ou aux données du meneur, aucun serveur.

## Utilisation

Sélectionner le plugin et demander par exemple :

> Crée une campagne complète de RuneQuest avec le pilote de ce dépôt, les règles de `docs/systems/runequest/` et les joueurs du relevé autorisé ; livre un seul .gmos avec les ateliers de recette intégrés.

Ou joindre un pilote `.gmos-driver`, des règles et le relevé noms/identifiants des joueurs. Le plugin prépare une intrigue suivie, généralement 10 à 15 séances jouables, arcs, PNJ, lieux, réactions, conséquences et fins alternatives. Les ateliers d'essai sont dans un acte hors fiction de la même Trame. Le nombre de personnages/cas découle du besoin ; les personnages `[RECETTE]` sont clairement distincts des PJ principaux.

Le lot contient l'unique campagne .gmos, les médias embarqués, guide, matrice, cahier, CSV vierge, ETATS-DE-REFERENCE.md et rapport ; pilote séparé .gmos-driver et tables si nécessaires. Les états de référence sont une aide à la restauration locale, pas un import d'états inventé. Remplacer toute la campagne via Nexus n'est pas une remise à zéro d'un atelier. Les anciens lots ne sont pas fusionnés et plusieurs campagnes ne sont créées que sur demande explicite.

Les trois suggestions de lancement du plugin sont conservées pour compatibilité. Les anciennes formulations au pluriel ou « aventure et deux laboratoires » suivent le nouveau défaut : un seul fichier, ateliers intégrés. Le prompt propre au skill reflète le nouveau format.

Les résultats humains restent NON TESTÉS. Les preuves automatiques sont séparées des essais en application. La méthode ne transforme pas les règles absentes d'un pilote en fonctions imaginaires.

## Construire et vérifier

- `node outils/gmos-campagnes-tests/construire-plugin.mjs` : manifestes synchronisés, YAML, fichiers, références, archive réouverte et empreintes comparées ; produit `dist/gmos-campagnes-tests-0.2.0.zip` et `dist/verification-paquet.json`.
- `python -B outils/gmos-campagnes-tests/verifier-outil.py` : douze tests, uniquement données fictives en dossier temporaire, dont une archive unique contenant douze séances et des ateliers. Ce contrôle ne juge pas la qualité narrative et n'est pas une recette Electron.
- Utilitaire du paquet : `inspect`, `build`, `verify`, `cases`. Voir le skill et `references/format-nexus-v1.md`.

Sous Windows, utiliser le Python du runtime disponible plutôt que l'alias WindowsApps si ce dernier ne fonctionne pas ; aucune installation nécessaire. Pour capturer son JSON depuis un processus, définir l'encodage du processus à UTF-8 (`PYTHONIOENCODING=utf-8`) ou utiliser son encodage réel.

Le 30/10, **18 archives existantes**, six lots de trois (Cthulhu Hack, NOC, Alien, Rêve de Dragon, Dune, Nephilim), ont passé le contrôle structurel partiel. Rapport `dist/verification-lots-existants.json`. L'inspection du pilote RuneQuest courant a retrouvé le pilote et les 313 champs de son gabarit. Ces vérifications ne rejouent pas leurs recettes Electron et ne prouvent pas une partie future.

`plugin-compte.json` conserve l'ID exact du plugin et de sa livraison ; pour une mise à jour, relire l'état distant et utiliser cet ID, ne pas recréer un second plugin. L'archive locale est une source privée, pas un paquet de soumission publique. Aucun export de jeu, donnée de joueur, scénario publié ou document de règles n'y est embarqué.
