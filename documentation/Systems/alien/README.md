# Pack RAG — ALIEN Le Jeu de Rôle

Ce zip contient plusieurs niveaux d'exploitation du livre pour intégration dans un moteur RAG, un assistant MJ, ou GM-OS.

## Structure

- `raw/`
  - `full_book_by_pdf_page.md` : extraction brute par page PDF.
- `rules/`
  - `core_mechanics.md` : jets, échec, test forcé, modificateurs, tests opposés.
  - `skills.md` : compétences et usages.
  - `talents.md` : talents de carrière et talents généraux.
  - `combat_and_panic.md` : combat, dégâts, blessures critiques, stress, panique, véhicules.
- `equipment/`
  - `weapons_armor_gear_vehicles.md` : armes, protections, équipement, véhicules.
- `aliens/`
  - `overview.md` : cadre général des espèces d’aliens.
  - `neomorphs.md` : cycle de vie, infection, protocoles.
  - `xenomorph_xx121.md` : stades, capacités, règles générales, ruche.
  - `other_species.md` : autres espèces extrasolaires.
- `scenario_hope/`
  - `overview.md` : synopsis, objectif commun, état initial.
  - `pregens_and_npcs.md` : PJ prétirés et PNJ critiques.
  - `locations.md` : lieux clés d’Hadley’s Hope.
  - `events_and_triggers.md` : événements, déclencheurs, conséquences.
  - `gm_os_index.md` : index opérationnel pour MJ IA / GM-OS.

## Recommandation de chunking

- chunk primaire : section `##`
- overlap : 150–300 tokens
- métadonnées conseillées :
  - `source_book = "ALIEN_le_jeu_de_rôle"`
  - `chapter`
  - `page_book_start`
  - `page_book_end`
  - `entity_type` (rule, skill, talent, location, npc, event, alien, equipment)
  - `scenario = "Le Dernier Jour de Hope"` si pertinent

## Remarque

Le contenu est fondé sur l’extraction du PDF. La mise en page d’origine peut produire des irrégularités mineures dans certaines colonnes ou tableaux, mais l’ensemble est prêt pour une indexation RAG opérationnelle.
