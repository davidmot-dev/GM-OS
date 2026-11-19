# Loot-OS et le catalogue d'équipement du pilote — spécification, 19/11/2026

> Demande de David (19/11) : « je voudrais faire le lien entre les équipements qui sont définis
> dans un drivers et loot-os afin de pouvoir constituer des tables de loot plus facilement ».
> État : **spécifié, pas commencé** — périmètre tranché par David le 19/11 ; un détail (Q5) à
> confirmer avant T1. Premier geste : T1. Registre § 264.
> Suite annoncée du chantier du catalogue (§ 203, [plan du 02/11](2026-11-02-catalogue-d-equipement.md)) :
> « Ensuite, hors de ce chantier : Loot-OS qui distribue un objet du catalogue ».

## Ce qui existe — lu dans le code et les pilotes le 19/11

- **Les tables de butin du pilote** (Forge › Règles › Tables de butin,
  `EditeurDesTablesDeButin.tsx`) : chaque entrée est un objet **tapé à la main** — nom, poids
  ou % de chance, quantité, rareté, valeur, masse, description. Types d'entrée : objet,
  monnaie, table imbriquée, oracle de Table-OS.
- **Le tirage** (`LootGenerator.generateFromTable`) fabrique un objet d'inventaire depuis
  l'entrée (`properties` = ses métadonnées) ; il va au **pool** de Loot-OS, puis au Sac à dos du
  personnage choisi (`assignLootToCharacter` → `addInventoryItem`), au journal et sur sa tablette.
- **Le catalogue du pilote** (§ 203) : quatre familles (armes, protections, véhicules, matériel),
  chaque objet avec catégorie du livre, colonnes du jeu, propriétés, poids et coût **en texte**
  (« ½ », « 200 $ »), description, effets, objets contenus (`contient`), source et page.
- **Le pont qui manque n'est qu'à moitié à faire** : `objetPourLeSac` (`equiperLaFiche.ts`)
  transforme déjà un objet du catalogue en objet de Sac à dos **relié** (`properties.catalogueId`),
  et `objetsPortes` reconnaît un tel objet comme **porté** : ses effets sont rappelés au jet. Un
  objet du butin relié de la même façon en profiterait sans rien de plus.
- **La fenêtre « Prendre dans le catalogue »** (`PrendreDansLeCatalogue.tsx`, choisie dans Stitch
  le 02/11) : familles en onglets, catégories, recherche, « Livre, p. N ». Elle équipe une fiche ;
  elle ne sert pas encore au butin.
- **Recensement des exports** : sept pilotes ont un catalogue — Alien 1.11.0 (214 objets),
  Delta Green 2.1.0 (195), Blade Runner 2.1.0 (58), Cthulhu Hack 1.1.0 (57), COC 2.2.0 (45),
  Barbarians of Lemuria 2.0.0 (37), Vampire 2.2.0 (30). **Un seul pilote a une table de butin,
  vide** (Alien, « Nouvelle Table »). Aucun ne déclare de vocabulaire du butin (monnaie, raretés).

## Le quoi

### Parcours

1. **Préparer, dans la Forge** — David ouvre Règles › Tables de butin d'Alien, crée « Casier
   d'armurerie », clique **« Ajouter depuis le catalogue »** : la fenêtre du catalogue s'ouvre sur
   les armes, il coche le M41A, le M4A3 et deux grenades, valide. Quatre lignes entrent dans la
   table, poids 1, chacune avec le nom, la rareté et la valeur que le catalogue donne ; il règle
   les poids. Il peut aussi créer d'un geste une table entière, **« Nouvelle table depuis le
   catalogue »** : toute une catégorie (« Pistolets ») ou sa sélection, poids égaux (décision Q2).
2. **En séance** — il tire la table dans Loot-OS : le M4A3 arrive au pool avec son nom, sa
   description et son poids ; il le donne à Vasquez. Dans son Sac à dos, le pistolet est
   **reconnu comme objet du catalogue** : ses effets éventuels sont rappelés au jet.
3. **Corriger une fois** — David corrige les dégâts du M41A dans le catalogue : le prochain tirage
   de la table donne le M41A corrigé, sans retoucher la table (décision Q1 : lien vivant).
4. **Un objet retiré du catalogue** — la table le signale dans l'éditeur, et le tirage le dit
   en avertissement au lieu de donner un objet vide.
5. **En séance, sans table** (décision Q3) — dans Loot-OS, **« Depuis le catalogue »** : la même
   fenêtre, David coche une combinaison spatiale et deux rations, valide ; elles arrivent au pool,
   reliées au catalogue, et se donnent comme le reste.

### Critères d'acceptation

- C1 · Depuis l'éditeur d'une table de butin, on ajoute un ou plusieurs objets du catalogue en
  les cochant ; chacun devient une ligne de la table, sans rien retaper — essai.
- C2 · Un objet tiré depuis une ligne du catalogue arrive au pool **et** au Sac à dos avec son
  nom, sa description, son poids et `properties.catalogueId` — essai.
- C3 · Un objet du catalogue reçu par le butin compte comme **porté** (`objetsPortes`) — essai.
- C4 · Corriger un objet du catalogue change ce que la table donne au tirage suivant, sans
  retoucher la table — essai.
- C5 · Une ligne qui désigne un objet absent du catalogue se signale dans l'éditeur et produit
  un avertissement au tirage, jamais un objet vide — essai.
- C6 · Les lignes déjà tapées à la main, les tables imbriquées et les oracles continuent de
  fonctionner comme avant ; un pilote sans catalogue ne montre pas le bouton — essai.
- C7 · L'export `.gmos-driver` et la réimportation gardent les liens des tables vers le
  catalogue (le pilote les transporte tels quels) — essai.
- C8 · Le parcours entier, Forge puis séance, sur Alien — **à l'écran par David**.
- C9 · En séance, « Depuis le catalogue » verse au pool les objets cochés, reliés au catalogue,
  sans table ; le bouton n'existe pas pour un pilote sans catalogue — essai.
- C10 · « Nouvelle table depuis le catalogue » crée une table nommée d'après la catégorie (ou
  « Sélection du catalogue »), une ligne par objet, poids égaux, tirage « un seul parmi la
  liste » — essai.

### Hors champ

- Générer des tables par l'IA ou depuis le corpus.
- Les tables de Table-OS (`databases/tables/`) : elles consultent, Loot-OS compose (§ 10).
- Fabriquer une table « au hasard pondéré par la rareté » : le catalogue n'a pas de rareté.
- Le bestiaire (armes des créatures).
- Retoucher le Sac à dos ou la fiche du personnage : l'objet y arrive par la porte qui existe.

### Ce que David garde

- Les tables vivent dans le **pilote** (`lootTables`) : elles suivent l'export `.gmos-driver`, la
  sauvegarde automatique et le réimport « Remplacer ». Rien de nouveau dans les magasins de
  campagne ; le pool et l'historique du butin restent où ils sont.
- Les lignes existantes ne sont jamais réécrites d'office.

## Décisions

- 19/11 — Q1, David : « Lien vivant » → une ligne de type **« Objet du catalogue »** désigne
  l'objet par son identifiant (`metadata.catalogueId`) et se résout **au tirage**, comme une table
  imbriquée. Le nom de l'objet est gardé sur la ligne pour l'affichage (livre des règles, liste).
- 19/11 — Q2, David : « Les deux » → « Ajouter depuis le catalogue » dans une table, **et**
  « Nouvelle table depuis le catalogue ».
- 19/11 — Q3, David : « Oui, aussi en séance » → « Depuis le catalogue » dans Loot-OS, objets
  versés au pool.
- 19/11 — Q4, David : « Reprendre la fenêtre » → pas de nouveau dessin Stitch : la liste de
  « Prendre dans le catalogue » (familles, recherche, catégories, grille, « Livre, p. N ») est
  partagée, avec des cases à cocher pour le butin.
- [À CONFIRMER Q5 — détail, avant T1] Proposition : **valeur** lue dans le coût quand il commence
  par un nombre (« 1 200 $ » → 1200 ; Alien 159 coûts sur 209, Blade Runner 33 sur 34 ; Delta
  Green « Courant » → 0) ; **rareté** réglée sur la ligne de la table, premier palier du jeu par
  défaut ; **objets contenus** versés au pool avec l'objet (le véhicule et ses armes), chacun
  relié au catalogue.

## Le comment

### Fichiers et réutilisation

- `src/types/drivers.ts` — `LootEntry.type` gagne `'catalogue'` ; `metadata.catalogueId`. Le
  champ est facultatif : les tables existantes restent valides.
- `src/modules/equipement/equiperLaFiche.ts` — exporter `poidsEnNombre` (aujourd'hui privé) ;
  `objetPourLeSac` reste la règle de l'objet de sac.
- `src/modules/equipement/butinDuCatalogue.ts` (neuf) — **une seule fabrique** :
  `objetDuButin(objet, catalogue, { rarete, quantite })` → objet d'inventaire (sur la base
  d'`objetPourLeSac` : nom, famille, poids, description, `properties.catalogueId`), plus la valeur
  lue dans le coût, la rareté, et ses contenus (Q5) ; `valeurDuCout(cout)`. Servie au générateur
  (T1) et au geste de séance (T6) : *un écran qui réimplémente la lecture d'un moteur finit par en
  diverger* (§ 10).
- `src/modules/session/logic/LootGenerator.ts` — option `catalogue` ; une entrée `catalogue` se
  résout par la fabrique ; objet introuvable → avertissement « Objet du catalogue introuvable :
  « … » (depuis « … ») », comme une table imbriquée introuvable.
- `src/modules/session/components/LootGeneratorPanel.tsx` — passe `driver.catalogue` au
  générateur ; bouton « Depuis le catalogue » (T6).
- `src/modules/session/components/ListeDuCatalogue.tsx` (neuf, extrait) — familles, recherche,
  catégories, grille de `PrendreDansLeCatalogue`, en choix **un** ou **plusieurs** (cases à
  cocher, « Toute la catégorie »). `PrendreDansLeCatalogue` l'emploie en choix unique, **sans
  changement à l'écran**.
- `src/modules/session/components/ChoisirDansLeCatalogue.tsx` (neuf) — la fenêtre du butin :
  `CadreDeSurcouche` comme sa voisine, les quatre familles, la sélection, et le geste du pied
  (« Ajouter à la table », « Créer la table », « Verser au butin »).
- `src/modules/session/components/rules/EditeurDesTablesDeButin.tsx` — les deux boutons
  (« Ajouter depuis le catalogue » par table, « Nouvelle table depuis le catalogue » en tête) ;
  une ligne `catalogue` affiche le nom résolu, sa famille et sa catégorie, un badge
  « Catalogue », et « introuvable » si l'objet a disparu ; garde rareté et quantité, pas valeur,
  masse ni description (elles viennent du catalogue). Sans catalogue, ni boutons ni type.
- Clés i18n `modules:session.rule_engine_editor.loot.*` et `modules:loot.*` (fr, en).
- Guides `42-Butin-ecrire-les-tables.md` et `41-Butin-distribuer-en-seance.md`.

### Données : qui lit, qui écrit

- **`driver.lootTables`** — écrivain unique : l'éditeur des tables (`onUpdate` de
  `RuleEngineEditor`). Lecteurs recensés le 19/11 : `LootGenerator`, `LootGeneratorPanel`,
  `EditeurDesTablesDeButin`, `RulebookViewer` (affiche `entry.name` et le poids : le nom gardé sur
  la ligne suffit, **voulu**), `RuleEngineEditor` (compte des tables). Aucun contrôle de la Forge
  ne lit les tables aujourd'hui.
- **`driver.catalogue`** — lu seulement ; écrit par la section Équipement, inchangée.
- **`lootPool`** — écrivain `addLootToPool` (inchangé), appelé par le tirage et par T6. Puis
  `assignLootToCharacter` → `addInventoryItem` : l'objet garde ses `properties`, donc son
  `catalogueId` ; `objetsPortes` le reconnaît (C3).

### Risques GM-OS (cochés)

- [x] Fenêtres multiples : Loot-OS et la Forge sont chez le meneur ; aucun magasin nouveau.
- [x] Chemin de données : rien dans `electron/`.
- [x] Tablettes : l'objet y arrive par la porte existante (`addInventoryItem` et l'annonce).
- [x] Les deux ports : sans objet.
- [x] Textes : clés fr et en ; la fenêtre suit la taille de « Prendre dans le catalogue ».
- [x] Échap : `useFermetureParEchap`, comme la fenêtre voisine.
- [x] Export du pilote : `lootTables` voyage dans le pilote ; à prouver (C7).

### Écran

Pas de nouveau dessin (Q4) : la liste partagée garde le dessin choisi dans Stitch le 02/11
(`documentation/Planning/stitch/equipement/equipement-fiche.png`). Captures Playwright de la
Forge et de Loot-OS à la livraison.

### Essais

`npx vitest run --maxWorkers=4` sur les essais nommés par tâche ; `npx tsc -b` ; eslint ; build ;
e2e de capture (Forge › Tables de butin, Loot-OS) pour les images du guide.

## Tâches

- [ ] T1 · Le type de ligne « Objet du catalogue » et sa fabrique — `drivers.ts`,
      `butinDuCatalogue.ts` (neuf), `LootGenerator.ts`, `equiperLaFiche.ts` (export de
      `poidsEnNombre`) — couvre C2, C4, C5 · essais : `butinDuCatalogue.test.ts` (neuf : valeur du
      coût, rareté, contenus, objet absent), `LootGenerator.test.ts` (**neuf** — le générateur
      n'est essayé aujourd'hui que par `pontVersLesOracles.test.ts` : ligne catalogue, objet
      corrigé, objet retiré, lignes ordinaires inchangées) · touche src/ ⛔
- [ ] T2 · Le tirage de Loot-OS lit le catalogue du pilote, et l'objet donné compte comme porté —
      `LootGeneratorPanel.tsx` — couvre C2, C3 · essais : `LootGeneratorPanel.test.tsx` (+1),
      `equiperLaFiche.test.ts` (`objetsPortes` d'un objet du butin) · touche src/ ⛔
- [ ] T3 · Extraire la liste du catalogue, choix un ou plusieurs — `ListeDuCatalogue.tsx` (neuf),
      `PrendreDansLeCatalogue.tsx` — prépare C1 · essais : `PrendreDansLeCatalogue.test.tsx`
      **inchangé** et vert, `ListeDuCatalogue.test.tsx` (neuf : cases, « Toute la catégorie »,
      recherche) · touche src/ ⛔
- [ ] T4 · La fenêtre du butin — `ChoisirDansLeCatalogue.tsx` (neuf) — couvre C1, C9, C10 en
      partie · essai : `ChoisirDansLeCatalogue.test.tsx` (quatre familles, sélection rendue,
      Échap) · touche src/ ⛔
- [ ] T5 · L'éditeur des tables : « Ajouter depuis le catalogue », « Nouvelle table depuis le
      catalogue », ligne catalogue affichée, objet introuvable signalé, rien sans catalogue —
      `EditeurDesTablesDeButin.tsx`, locales — couvre C1, C5, C6, C10 · essai :
      `EditeurDesTablesDeButin.test.tsx` (neuf) · touche src/ ⛔
- [ ] T6 · En séance : « Depuis le catalogue » dans Loot-OS — `LootGeneratorPanel.tsx`, locales —
      couvre C9 · essai : `LootGeneratorPanel.test.tsx` (+2 : versé au pool et relié ; absent sans
      catalogue) · touche src/ ⛔
- [ ] T7 · Les liens survivent à l'export et à l'import du pilote —
      `system/archive/butinDuBundle.test.ts` (neuf, sur le modèle de `bestiaireDuBundle.test.ts`)
      — couvre C7 · touche src/ ⛔ (essai seul)
- [ ] T8 · Livraison : guides 41 et 42 avec captures, registre, synthèse des pilotes (ligne des
      améliorations communes) — couvre C6, C8 · captures relues · ne touche pas src/ · **à
      essayer par David** (C8 : une table « Casier d'armurerie » d'Alien, tirée, donnée à
      Vasquez ; un objet versé en séance).

## Analyse

- 19/11 — relecture croisée :
  1. Chaque critère a sa tâche et son essai : C1 → T3, T4, T5 ; C2 → T1, T2 ; C3 → T2 ; C4, C5 →
     T1 (C5 aussi T5) ; C6 → T5, T8 ; C7 → T7 ; C8 → T8 (à l'écran par David) ; C9 → T4, T6 ;
     C10 → T4, T5.
  2. Aucune tâche sans critère (T3 prépare C1 et évite une seconde liste du catalogue).
  3. Pas de contradiction avec le § 10 (Loot-OS compose, Table-OS consulte ; le point de rencontre
     est le pool) ni avec le § 203 (le catalogue n'est pas modifié). AGENTS.md : « GM-OS
     tourne-t-il ? » avant T1 ; aucune commande git qui écrit sans demande.
  4. Plus de question de périmètre ouverte ; Q5 est un détail à confirmer avant T1.
  5. `git status` du 19/11 : aucun fichier du plan n'est modifié par un autre agent (l'agent des
     vidéos travaille dans `output/` et `outils/gmos-videos/`).
  **Écarts trouvés : aucun.** Hors chantier, trouvé en recensant : le pilote Cthulhu Hack 1.2.0 du
  § 263 avait perdu le catalogue (corrigé, à réimporter — § 263).
