# GM-OS Studio — construction du plugin privé

Demande de David du 17/10/2026 : réunir six plugins dans un seul, avec un menu conversationnel.
Présentation standard conservée. Aucun ancien plugin n’est supprimé ou modifié.

- `accueil.md` : menu, orientation, portée des contrats, parcours nouveau jeu et exécution.
- `ateliers.json` : six sources, versions et descriptions spécialisées.
- `sources/` : copies des méthodes et outils TOC Extractor 1.0.0 et Extracteur de cartes 1.1.0,
  conservées depuis les plugins installés. Les quatre autres ateliers viennent des outils du dépôt.
- `plugin/gmos-studio/` : paquet complet, sept skills avec références et outils autonomes.
- `plugin-compte.json` : identifiant et version distante après création, à réutiliser pour les mises à jour.
- `dist/` : archive et rapports de vérification locaux, ignorés par Git.

Depuis le dépôt, avec les dépendances déjà installées :

```text
node outils/gmos-studio/construire-plugin.mjs
node outils/gmos-studio/verifier-plugin.mjs
```

Le constructeur reprend les méthodes sans changer leur corps et adapte seulement leur accueil
et leurs métadonnées à GM-OS Studio. Les contrats des fiches et thèmes sont actualisés depuis
`documentation/Architecture/`, et le socle SDK depuis `docs/ui/rpg-theme-sdk/`.
`sources.json` consigne les empreintes et les versions d’origine.

L’archive contient une seule racine de plugin et se vérifie après compression. Les références
PDF d’éditeur du constructeur de fiches restent dans le paquet privé ; aucune pièce jointe ou
donnée de campagne de David n’y est copiée. Pas de serveur, de nouveau paquet ni de configuration
de fournisseur d’images.
