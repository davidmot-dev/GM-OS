# État et reprise — GM-OS Studio, 17/10/2026

David demande de réunir RPG Theme Builder, Character Sheet HTML Studio, RPG Visual Identity
Builder, RPG Banner Builder, TOC Extractor et Extracteur de cartes avec un choix à l’accueil,
puis valide : « ok vas-y ». Présentation standard reprise de son choix précédent.

## Livré dans le compte

**[GM-OS Studio](https://chatgpt.com/plugins/plugins_6ad3afde7bb08191a3f1ac5155fc9748)**,
plugin privé personnel, version 0.1.0.

- Identifiant : `plugins_6ad3afde7bb08191a3f1ac5155fc9748`.
- Version distante : `pluginrel_6ad3afe06b448191bf51d518ccb1e0df`.
- Sources : `outils/gmos-studio/` ; reçu distant : `plugin-compte.json`.
- Paquet : `plugin/gmos-studio/`, **51 fichiers et sept skills** (accueil + six ateliers).
- Archive : `dist/gmos-studio-0.1.0.zip`, environ 5,6 Mo ; `dist/` ignoré par Git.

L’accueil affiche six choix si l’objectif est ouvert, accepte numéro/nom/demande libre,
passe directement à l’atelier quand l’objectif est clair et propose un parcours nouveau jeu.
Ce parcours fait choisir les livrables ; il n’autorise pas six productions par défaut.
Les préférences déjà fournies restent dans le contexte de la conversation.

Les six méthodes sont reprises intégralement hors métadonnées, avec un préambule de portée
et leurs références. Les contrats fiches/thèmes et le socle SDK viennent du dépôt actuel.
Les liens de navigation des pipelines sont adaptés aux ateliers internes. Le fichier
`sources.json` du paquet documente versions et empreintes. Les deux PDF de référence d’éditeur
du constructeur de fiches sont inclus dans ce paquet **privé** ; aucune pièce jointe ou donnée
de campagne de David n’est ajoutée.

Les quatre premiers ateliers utilisent les sources dans `outils/`. Les sources TOC 1.0.0 et
cartes 1.1.0 sont conservées dans `sources/` depuis les plugins installés. Aucun ancien plugin
n’est modifié, supprimé ni requis par GM-OS Studio. Aucun serveur et aucune installation.

## Vérification

```text
node outils/gmos-studio/construire-plugin.mjs
node outils/gmos-studio/verifier-plugin.mjs
```

**12 contrôles réussis** : manifeste/YAML, sept skills uniques, six choix, corps des méthodes,
liens locaux résolus et contenus dans le paquet, contrats actuels, index de connaissances,
PDF et outils inclus, provenance, archive relue par SHA-256, vérificateur STYLE/AVOID et
export WebP réel depuis l’outil fusionné (2400 × 600, sous 500 Ko, profil Edge jetable hors ligne).

Après création, les **sept skills** et le manifeste sont relus à distance et comparés aux
sources. Le backend remplace les métadonnées du créateur par celles du compte et normalise
sept fins de ligne CRLF résiduelles dans le thème ; le contenu des méthodes est conservé.
La vérification tient compte de ces deux normalisations, consignées dans le reçu.

Limites des essais : pas de conversation de bout en bout avec le modèle installé, ni de
production réelle de thème/fiche/sommaire/cartes pour cette fusion. Le script de cartes est
conservé octet pour octet ; il n’a pas été exécuté ici, Python n’étant pas accessible dans cet
environnement Windows. L’environnement d’usage doit fournir les outils PDF, vision, images
et, pour le script de cartes, Python/PyMuPDF/Pillow. Ne pas confondre la présence des skills
avec la validation de toutes leurs productions.

## Reprise

Ajouter le plugin et envoyer **« Affiche le menu GM-OS Studio »**. Pour une mise à jour,
réutiliser l’identifiant et lire la version distante ; ne pas créer de doublon.
Les plugins existants restent utilisables pendant les premiers essais de David.

Création via le skill
[create-plugin](C:/Users/david/.codex/plugins/cache/openai-curated-remote/plugin-creator/0.1.27/skills/create-plugin/SKILL.md).
Création sans écriture Git, puis commit et push demandés par David. Pas de modification de `src/`,
`electron/`, des données personnelles, des sources des autres plugins ou des autres chantiers.
