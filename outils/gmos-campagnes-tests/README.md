# GM-OS Campagnes de test — sources du plugin privé

[Ouvrir le plugin](https://chatgpt.com/plugins/plugins_6ae484c30bd4819186676a390b1b74bf), version 0.1.0, créé le 30/10/2026 à la demande de David pour généraliser les campagnes de recette aux autres jeux.

Le paquet sous `plugin/gmos-campagnes-tests/` contient un skill, cinq références, un utilitaire Python sans dépendances, un README et une icône. Il fonctionne avec des fichiers joints dans ChatGPT ou les sources d'un dépôt dans Codex. Aucun accès automatique à l'application ou aux données du meneur, aucun serveur.

## Utilisation

Sélectionner le plugin et demander par exemple :

> Crée les campagnes de test de RuneQuest avec le pilote de ce dépôt et les règles de `docs/systems/runequest/`, pour les joueurs existants du relevé de recette autorisé.

Ou joindre un pilote `.gmos-driver`, des règles et le relevé noms/identifiants des joueurs. Le plugin cherche d'abord les fichiers accessibles, demande ce qui manque et prépare une aventure originale et deux laboratoires adaptés au jeu. Les archives, médias, guide, matrice, cahier, résultats vierges et rapport forment le lot. Le nombre de personnages/cas découle du besoin.

Les résultats humains restent NON TESTÉS. Les preuves automatiques sont séparées des essais en application. La méthode ne transforme pas les règles absentes d'un pilote en fonctions imaginaires.

## Construire et vérifier

- `node outils/gmos-campagnes-tests/construire-plugin.mjs` : manifeste portable, YAML, fichiers, références, archive réouverte et empreintes comparées ; produit `dist/gmos-campagnes-tests-0.1.0.zip` et `dist/verification-paquet.json`.
- `python -B outils/gmos-campagnes-tests/verifier-outil.py` : onze tests, uniquement données fictives en dossier temporaire.
- Utilitaire du paquet : `inspect`, `build`, `verify`, `cases`. Voir le skill et `references/format-nexus-v1.md`.

Sous Windows, utiliser le Python du runtime disponible plutôt que l'alias WindowsApps si ce dernier ne fonctionne pas ; aucune installation nécessaire. Pour capturer son JSON depuis un processus, définir l'encodage du processus à UTF-8 (`PYTHONIOENCODING=utf-8`) ou utiliser son encodage réel.

Le 30/10, **18 archives existantes**, six lots de trois (Cthulhu Hack, NOC, Alien, Rêve de Dragon, Dune, Nephilim), ont passé le contrôle structurel partiel. Rapport `dist/verification-lots-existants.json`. L'inspection du pilote RuneQuest courant a retrouvé le pilote et les 313 champs de son gabarit. Ces vérifications ne rejouent pas leurs recettes Electron et ne prouvent pas une partie future.

`plugin-compte.json` conserve l'ID exact du plugin et de sa livraison ; pour une mise à jour, relire l'état distant et utiliser cet ID, ne pas recréer un second plugin. L'archive locale est une source privée, pas un paquet de soumission publique. Aucun export de jeu, donnée de joueur, scénario publié ou document de règles n'y est embarqué.
