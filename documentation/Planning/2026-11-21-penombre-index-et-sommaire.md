# Pénombre — index de repérage et table des matières

Demande de David du 21 novembre 2026, via GM-OS Studio : « fais-moi l’index et la table of content de pénombre », sources dans `docs/Reference/Pénombre/`.

## Livrables

- [Table des matières](../../docs/systems/penombre/index/Penombre_table_des_matieres_flat.md) : 82 lignes, dont 71 entrées paginées et 11 bandeaux de sections sans numéro imprimé.
- [Index alphabétique du sommaire](../../docs/systems/penombre/index/Penombre_index_flat.md) : les 71 entrées paginées classées alphabétiquement, intitulés et pagination inchangés. Sa portée est explicitée dans le fichier : index construit à partir du sommaire, pas un index éditorial ou exhaustif du livre.

## Sources et portée

Extraction de `penombre___livre_02___TOC.pdf`, quatre pages. Malgré son nom, ces pages ont exactement le même texte que les quatre premières pages des deux extraits nommés `penombre___livre_01…pdf`. Un seul sommaire livré, sans doublonner les extraits.

Les autres pages sont des extraits de règles et des fiches. Les quatre captures PNG sont des illustrations. Aucun index alphabétique éditorial n’est présent dans le dossier fourni ; la première annonce intermédiaire de deux pages d’index a été corrigée après inspection. Aucun numéro ou renvoi d’index absent n’a été inventé. Le livre complet référencé sur le NAS n’a pas été consulté.

## Vérifications

- Quatre pages rendues avec pypdfium2 et relues en image ; onze colonnes lues de gauche à droite, puis de haut en bas.
- pdfplumber pour l’extraction ; conservation de tous les caractères des onze colonnes hors espaces de mise en page, retours de ligne réunis.
- Comptes des entrées paginées par page : 12, 22, 18 et 19. Première : « À propos de Pénombre — 8 » ; dernière : « Ressources — 373 ».
- Bandeaux retranscrits depuis les images : le texte caché du PDF contient des anciens titres superposés, notamment « Les Éminences grises », qui ne correspondent pas aux bandeaux visibles. Aucune page déduite pour les titres de sections.
- Sorties UTF-8 et listes à un seul niveau ; mêmes 71 couples titre/page dans les deux fichiers, sans perte ni ajout. Aucun filigrane nominatif conservé.
- Comparaison indépendante avec pypdf : les quatre pages de sommaire sont identiques dans les trois PDF concernés.

Extraction reproductible : `outils/penombre/extraire_index_et_sommaire.py`, avec le Python du runtime Codex et les dépendances déjà présentes. Rendus, colonnes et rapport d’empreintes dans `tmp/penombre-index/verification.json`. Aucune installation nécessaire.

Ni pilote, ni corpus de règles, ni fiche, ni données utilisateur modifiés ; aucune écriture Git. Les fichiers préexistants du dossier Pénombre sont laissés intacts. Pour un index exhaustif du livre, il faudra traiter le livre complet ou disposer de ses pages d’index.
