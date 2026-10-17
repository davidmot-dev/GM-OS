# État et reprise — plugin d’identité visuelle, 17/10/2026

Note limitée au travail de Codex. Les développements GM-OS en cours dans `src/`, `electron/`
et le manuel ne font pas partie de cette livraison et restent intacts.

David : « a partir des instruction dans C:\Projet_David\GM-OS-v5\outils\rpg-visual-identity-builder
est-ce que tu peux me créer un plugin pour faire cela ? ». Présentation choisie :
« Présentation standard ».

## Livré

Plugin privé personnel **RPG Visual Identity Builder**, version **0.1.0**, créé dans le compte :
[ouvrir le plugin](https://chatgpt.com/plugins/plugins_6ad3a4e128048191bf0c982432cebe9b).

- Identifiant backend : `plugins_6ad3a4e128048191bf0c982432cebe9b`.
- Version distante : `pluginrel_6ad3a4e274108191a25d11f325dc0e4c`.
- Sources : `outils/rpg-visual-identity-builder/plugin/rpg-visual-identity-builder/`.
- Construction reproductible : `node outils/rpg-visual-identity-builder/construire-plugin.mjs`.
- Archive : `outils/rpg-visual-identity-builder/dist/rpg-visual-identity-builder-0.1.0.zip`.
- Reçu distant versionné : `plugin-compte.json` ; contrôles locaux générés :
  `dist/verification.json` et `dist/verification-validateur.json`, sous le même outil.
  Le dossier `dist/` est ignoré par Git ; l’archive se reconstruit avec la commande ci-dessus.

Les instructions d’origine sont reprises intégralement, sans modifier `instructions.md` ni
le `README.md` existants. Un skill, exemples, icône SVG et vérificateur Node du bloc anglais
complètent le paquet. Aucun serveur, dépendance à une app, générateur d’images intégré ni accès
automatique aux pilotes/campagnes. Le résultat se copie dans les champs Style et À éviter de GM-OS.

## Vérifié et limites

- Manifeste JSON, métadonnées YAML, sous-titre de 30 caractères maximum, liens internes,
  contenu et structure de l’archive relus : sept fichiers dans une seule racine de plugin.
- 14 contrôles du vérificateur : format, limites 60/15, CRLF, refus des valeurs vides,
  des préfixes/ordres erronés et des lignes supplémentaires, exemples et codes retour CLI.
- Plugin enregistré puis relu dans le compte : manifeste, skill et métadonnées présents.
  Le backend ajoute son manifeste de compatibilité `.codex-plugin/plugin.json`.
- Aucun appel de génération et aucune conversation d’essai du plugin installé n’ont été
  exécutés : la qualité stylistique reste à juger sur les références de David.
- Le vérificateur contrôle structure et nombre de mots, pas langue ou sens ; le skill exige
  leur contrôle par l’assistant.

## Reprise

Ouvrir le plugin, l’ajouter puis le sélectionner avec une à quatre références et le nom du jeu
ou de la campagne. Pour une mise à jour, réutiliser l’identifiant ci-dessus et relire la version
distante avant toute modification ; ne pas recréer un doublon.

Création réalisée avec le skill
[create-plugin](C:/Users/david/.codex/plugins/cache/openai-curated-remote/plugin-creator/0.1.27/skills/create-plugin/SKILL.md).
Aucun paquet installé, service démarré ou fichier de données personnelles lu ; aucune écriture
Git pendant la création. David demande ensuite « commit et pousse » : livraison Git du seul
lot plugin, avec les travaux des autres chantiers laissés dans leur état.
