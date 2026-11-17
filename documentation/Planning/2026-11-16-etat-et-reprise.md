# État et reprise — 16/11/2026

## Vampire V5 : préparation documentaire de la Forge

David a commencé la Forge du pilote et demande à GM-OS Studio l'index et la table des matières
depuis `docs/Reference/Vampire/`. Registre **§ 257**, ligne **193** ; section Vampire ajoutée
à la synthèse des pilotes, explicitement en préparation.

- [Table des matières plate](../../docs/systems/vampire/index/Vampire_La_Mascarade_V5_table_des_matieres_flat.md) : **174 entrées**, PDF dédié de deux pages (imprimées 4–5).
- [Index plat](../../docs/systems/vampire/index/Vampire_La_Mascarade_V5_index_flat.md) : **552 entrées**, PDF dédié de quatre pages (imprimées 424–427).

Les six pages ont été rendues et vérifiées visuellement : dix-huit colonnes complètes,
ordre de lecture, intitulés coupés et numéros contrôlés. Format plat et absence de répétition
exacte vérifiés. Les différences imprimées restent présentes : Puissance 268 au sommaire et
269 à l'index ; Travail d’équipe 222, « Excunt » 296. Aucun numéro n'a été corrigé par supposition.

## Reprendre

David poursuit la Forge ; aucun contrôle mécanique du pilote ni relecture des règles
n'a été réalisé dans cet atelier. Le fichier préexistant
`docs/systems/vampire/rules/inventaire-des-mecaniques.md` reste intact (`relu: false`).
La fiche PDF et les images de référence n'ont pas été traitées.

## Environnement et copie de travail

Extraction et rendus locaux : `tmp/vampire-index/` (`examiner.mjs`, `extraire.py`, JSON et PNG).
Python accessible par `C:/Users/david/AppData/Local/Python/bin/python.exe` ; l'alias WindowsApps
ne s'exécute pas ici. `pypdf` disponible, PyMuPDF absent : rendu avec `pdfjs-dist` et le canvas
déjà installés, sans installation ni service.

Deux Markdown créés, deux registres documentaires complétés et cette note ajoutée ;
aucun commit ni push demandé. Les changements préexistants (exports Alien/Delta Green,
déplacement des références Vampire, corpus Vampire, sorties de tests et vidéos) restent intacts.
Aucune modification de `src/`, `electron/` ou des données personnelles.
