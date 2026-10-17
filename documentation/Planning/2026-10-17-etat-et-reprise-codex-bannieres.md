# État et reprise — plugin de bannières, 17/10/2026

David : « fais moi la même chose (un plugin) pour créer les bannières ».
Présentation standard reprise de son choix pour le plugin d’identité visuelle.

## Livré

Plugin privé personnel **[RPG Banner Builder](https://chatgpt.com/plugins/plugins_6ad3aca67494819191711cbb7b5c2703)**,
version 0.1.0. Identifiant backend `plugins_6ad3aca67494819191711cbb7b5c2703`, version distante
`pluginrel_6ad3aca7c1b88191bf8610a999051ecd`. Reçu dans
`outils/rpg-banner-builder/plugin-compte.json` : conserver ces identifiants pour une mise à jour.

Source : consignes historiques du 04/10, revérifiées dans `SessionHeader.tsx`,
`ChoixDeLaBanniere.tsx` et `banniereDuPilote.ts`. Un skill de brief, génération avec l’outil
d’images disponible, retouche et livraison ; contrat et prompts historiques inclus.
Ne pas confondre la liste historique des jeux avec un inventaire actuel.

L’outil autonome `outils/rpg-banner-builder/preparer-banniere.html` recadre au centre en 4:1,
montre deux simulations d’en-tête de 54 px, exporte à 2400 × 600 JPG/WebP sous 500 000 octets.
Les sources insuffisantes bloquent l’export sauf agrandissement explicitement coché. Aucune
image envoyée au réseau. Aucun accès automatique aux données, pilotes ou campagnes GM-OS.

## Reproduction et contrôles

Depuis le dépôt :

```text
node outils/rpg-banner-builder/construire-plugin.mjs
node outils/rpg-banner-builder/verifier.mjs
```

Le premier construit `plugin/rpg-banner-builder/` et l’archive privée dans `dist/` ; le second
ouvre Edge en mode headless, profil jetable, avec des images synthétiques de contrôle.
Utilise les dépendances déjà installées, sans nouveau paquet ni serveur.

- Manifeste JSON, YAML, sous-titre, références, source historique, icône et huit fichiers
  de l’archive relus et comparés. Le backend ajoute son manifeste de compatibilité.
- **11 contrôles réussis** : fonctionnement hors ligne, cadrage vertical/horizontal,
  JPG/WebP et dimensions réelles, taille limite sur bruit, refus de l’agrandissement implicite,
  aperçu centré, annulation d’un export périmé, refus d’image corrompue, smartphone sans
  débordement, absence d’erreur JS et de requête réseau. Un débordement du sélecteur de fichier
  sur mobile a été reproduit et corrigé avant la création du plugin.
- Manifeste, skill et outil HTML du plugin distant relus après création.
- Rapports et capture de l’outil dans `dist/`, ignoré par Git ; aucun essai de génération
  artistique n’a été exécuté, aucune bannière de jeu produite dans cette tâche.

## Reprise

Ajouter le plugin et l’invoquer avec le jeu, son ambiance et éventuellement des références ou
un bloc STYLE / AVOID. Le fichier final se sélectionne dans **l’éditeur du pilote**,
« Bannière de l’en-tête ». Ne pas annoncer un réglage de bannière par campagne sans l’avoir vérifié.

Création via le skill
[create-plugin](C:/Users/david/.codex/plugins/cache/openai-curated-remote/plugin-creator/0.1.27/skills/create-plugin/SKILL.md).
Création sans commande Git d’écriture, puis commit et push demandés par David. Les fichiers des
autres chantiers sont restés intacts, sans modification de `src/` ou `electron/`.
