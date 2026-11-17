# État et reprise — 17/11/2026

## Vampire V5 — quatre ateliers GM-OS Studio livrés

[Bilan, fichiers et aperçus](2026-11-17-vampire-studio.md), registre **§ 258**, ligne **194**.
David a forgé le corpus et demande thème, bannière, fiche et référence visuelle depuis
`docs/Reference/Vampire/`. Le sommaire et l'index du 16/11 sont conservés (§ 257).

- Thème dans `docs/systems/vampire/theme/` : ivoire/bordeaux, cadre sombre, 3 ornements,
  1 matière, 15 icônes. Validateur **0 erreur, 0 avertissement**.
- `Vampire Band.jpg` : **2400 × 600**, **129 015 octets** ; génération native puis agrandissement
  de 10,5 % autorisé par David. Cadrage complet et en-têtes de 54 px contrôlés.
- `docs/fiches/Vampire/vampire-v5-fiche-personnage-interactive.html` : **2 pages, 455 zones,
  181 clés** ; 0 erreur et deux avertissements attendus (modèle neuf, correspondance absente).
  Sur demande de David, Santé/Volonté : cases vide → / → X → vide ; maxima manuels.
- `identite-visuelle.txt` : STYLE/AVOID, 35/13 mots ; quatre références photographiques copiées.

## Vérifié

Parcours autonome et import réel dans un moteur sur profil de navigateur jetable : vingt cycles
de cases, saisie, pistes, rechargement, JSON dans les deux sens, zoom 20–400 %, deux pages imprimées.
Zéro erreur JavaScript et zéro requête réseau. Captures relues dans
`documentation/Planning/vampire-studio-20261117/` ; aperçu du thème explicitement hors GM-OS.

## Reprendre

David peut essayer les fichiers livrés. **Le raccord de la fiche aux champs du pilote n'est pas
fait** : attendre un export Vampire pour établir les correspondances et contrôler la mécanique.
Le gabarit s'importe manuellement par + Modèle, sans modification de la bibliothèque intégrée.
Les 24 fiches de règles et la fiche de voix forgées par David restent intactes et non auditées ici.

## Ne pas repayer

- Le PDF de la fiche a une CropBox décalée : soustraire son origine aux coordonnées ; les
  dimensions natives sont 612,1452 × 791,5497, pas les extrémités absolues de la boîte.
- Le moteur de fiches utilise des **clés plates** dans `data` ; un export imbriqué s'importe mais
  ne remplit pas les champs. Le HTML livré exporte des clés plates et accepte aussi les JSON imbriqués.
- Le suivi des dégâts utilise des hotspots texte à trois états et le CSS du manifeste ; il reste
  utilisable dans le moteur, sans nouveau type de champ ni JavaScript injecté dans le modèle.
- Pour un aperçu hors connexion, retirer la ligne @import entière : son URL contient des
  points-virgules, donc une expression coupant au premier « ; » brise le bloc suivant.

Recettes : `outils/vampire/`. Contrôles intermédiaires : `tmp/vampire-studio-20261117/`.
Aucune installation, aucun service réseau, aucune modification applicative ou donnée privée.
Changements de l'atelier et du 16/11 non commités ; aucun commit ni push demandé.
Les changements préexistants d'Alien, Delta Green et du corpus Vampire restent intacts.

---

## Suite du 17/11 — Vampire V5 fini : pilote 2.0.0 (Claude Code)

Registre **§ 259**, ligne **195** ; synthèse des pilotes, section Vampire ;
[manuel du jeu](../User%20Guides/54-Jeu-Vampire.md). Demande de David : « /finir-un-pilote
Vampire », puis « l'ordre me convient et gm-os est fermé ».

- **Produit** : la mécanique `jet.vampire` (`src/modules/dice/systemes/vampire.ts`) et ses cartes
  au panneau (`VampireAuJet.tsx`) ; le contrôle de la Forge ; le pilote
  `Export Dirvers/corriges/Vampire-2.0.0.gmos-driver` (`outils/vampire/finir_vampire.mjs`) ; la
  fiche HTML intégrée au moteur 27 et reliée (`docs/systems/vampire/fiche/correspondance.json`) ;
  les 24 fiches du corpus relues (21 corrigées) ; le 53, le 54, l'index et sept captures.
  Aucun commit.
- **Reprendre par** : l'essai de David — réimporter `Vampire-2.0.0` avec **Remplacer**, puis un
  jet de Dextérité + Mêlée, une relance par la Volonté, l'onglet « Fiche du jeu ». Ensuite, le
  suivi des dégâts superficiels et aggravés case par case (p. 126-127).
- **Ne pas repayer** :
  - Une frénésie de Soif suit un test d'Exaltation **raté** à 5 de Soif (p. 220), pas tout test à 5.
  - Le corpus forgé inventait les « approches Puissance, Finesse, Résistance » : c'est de là que
    venaient les attributs du pilote forgé. Lire la fiche « composition » avant de croire un pilote.
  - Deux fiches citaient un « errata » : il n'y en a aucun au registre des livres.
  - En capture, imposer les dés par `Math.random` : la face v d'un d10 vaut `(v − 1) / 10`.
  - `npx vitest` lancé depuis un sous-dossier ne trouve aucun essai : revenir à la racine.
  - Python a refusé une fois d'écrire `DescripteurDeJet.ts` (`OSError 22`) ; l'outil d'édition
    passe.

Fichiers des autres travaux (Alien, Delta Green, atelier Studio du matin) non touchés, sauf la
ligne 194 du registre (raccord fait) et la section Vampire de la synthèse, actualisées.

## Enregistrement et envoi demandés — 17/11/2026

David demande ensuite : **« commit et pousse »**. Les quatre commits Vampire de Claude Code
(`2184e516`, `b7708277`, `e1a04216`, `e9febe18`) sont déjà présents sur `production`, en attente d'envoi.
Codex complète les fichiers encore non suivis de l'atelier : quatre références visuelles,
identité et prompt texte (ignorés par le motif global `*.txt`), archive ZIP, et déplacement
`docs/Reference/_Vampire/` → `docs/Reference/Vampire/` (les dix fichiers vérifiés identiques par
empreinte Git). Les exports de pilotes, fichiers temporaires et travaux Alien/Delta Green
restent hors du commit. L'envoi conserve le hook complet types, lint, tests et construction.

## Suite du 17/11 — campagne de recette Vampire préparée

David invoque **GM-OS Campagnes de test pour Vampire**. Registre **§ 260**, ligne **196** ;
[livraison et preuves](2026-11-17-campagne-recette-vampire.md), synthèse du pilote actualisée.

- [ZIP complet](../../output/campagnes-tests/vampire/Vampire-Le-registre-des-absents-Recette.zip) : **Le registre des absents**, une seule campagne, douze séances prévues, quatre actes de fiction et six ateliers hors fiction, 53 cas tous **NON TESTÉ**. Trois nouveaux PJ et trois profils d'essai associés aux trois joueurs autorisés ; dix PNJ de fiction et un opposant de recette, 33 médias embarqués.
- **Vérifié hors ligne** : 105 contrôles ciblés, **104 réussites et un échec de conformité VAM-A01 conservé**. Le moteur crée cinq cases de Santé génériques, au lieu des six attendues sur CORPS (Vigueur 3). Aucun correctif applicatif ; cas COR-02, assertion dédiée, anomalies et registre § 1 bis documentés. Le rapport Vitest demeure en échec.
- Manifeste, empreintes, liens, champs et fonctions natives contrôlés ; caviardage et injection/restauration en mémoire ; structure portable acceptée ; 31 images et deux WAV décodés hors ligne, rendus relus. **Import Electron, sauvegarde/rechargement réel, Hub réseau, matériel, IA/TTS et recette humaine non exécutés.** Aucun service lancé ni donnée privée lue.
- **Reprendre par** : pilote 2.0.0 vérifié dans la Forge, campagne importée en **Tel quel**, puis Trame → **ATELIERS DE RECETTE — hors fiction**. Restaurer les seuls champs des profils de recette selon le cahier ; Nexus Remplacer remplace toute la campagne. Choix précis de pouvoirs/prédation à finaliser au livre pour la fiction ; profils avancés, création novice non certifiée.
- Reproduction : `outils/campagnes-de-recette/vampire.mjs`, puis `vampire-executer-tests.mjs`, puis `vampire-verifier.mjs`. Aucun changement dans `src/` ou `electron/` ; aucun commit/push demandé pour ce nouveau lot. Travaux Alien/Delta Green et exports préexistants intacts.


## Suite du 17/11 — Vampire 2.1.0 : dégâts case par case (Claude Code)

David : « commence les améliorations pour Vampire » ; GM-OS fermé. Registre **§ 261**, ligne **197** ;
synthèse des pilotes (🟠 14 · 🔴 0) et [page du jeu](../User%20Guides/54-Jeu-Vampire.md#les-dégâts) actualisées.

- **Livré** : dégâts « / » et « X » sur la Santé et la Volonté, superficiels divisés par deux, **Affaibli** −2 dés au jet, conversion en « X », torpeur ; « Régénérer » et « Début de partie : Volonté » au panneau ; la relance par la Volonté coche un « / » ; les vingt cases de la fiche HTML reliées. Pupitre de Combat-OS compris.
- **Pilote** : `Export Dirvers/corriges/Vampire-2.1.0.gmos-driver`, à réimporter avec **Remplacer**. Santé en points : **corrige VAM-A01** de la campagne de recette (§ 260) — Vigueur 3 naît à 6/6. L'essai `[VAM-A01]` de `outils/campagnes-de-recette/vampire.test.ts` compte encore des cases : à réécrire par son auteur, non touché ici.
- **Vérifié** : suite complète verte (909 fichiers), types, lint, `verifier_pilote.mjs` zéro constat, `fiche:valider` 0/0, build + e2e des captures Vampire vert, huit captures relues.
- **Piège** : un aperçu tenait les images de `documentation/User Guides/captures/` — l'e2e échouait sur « UNKNOWN: open ». Captures écrites par `GMOS_SORTIE_CAPTURES_JEUX=<dossier temporaire>`, puis copiées.
- **Reprendre par** : l'essai de David (réimport, un coup superficiel puis aggravé au panneau de santé, la relance, « Régénérer »). Rien n'est commité.

## Suite du 17/11 — Vampire 2.2.0 : bestiaire et équipement relus contre le livre (Claude Code)

David : « tu peux vérifier le drivers Vampire avec le livre, vérifier l'équipement et le bestiaire ? »,
puis « gm-os est fermé ». Registre **§ 262**, ligne **198** ; synthèse (🟠 17 · 🔴 0) et
[page du jeu](../User%20Guides/54-Jeu-Vampire.md#le-bestiaire-et-léquipement) actualisées.

- **Constat** : chiffres conformes au livre (p. 304, 370-377, lues en image), mais bestiaire injouable — une créature entrait à 10/10, fiche vide ; chapitre « Matériel » absent ; l'encadré « Antagonistes simplifiés » (p. 370) avait été retiré à tort du corpus le matin.
- **Livré** : pilote `Export Dirvers/corriges/Vampire-2.2.0.gmos-driver` (bestiaire restructuré, 30 objets), Santé d'entrée et capacité lues sur la fiche (`src/`), contrôle de la Forge pour tous les jeux, corpus rectifié.
- **Vérifié** : suite complète (910 fichiers), types, lint, `verifier_pilote.mjs` zéro constat, build + e2e Vampire vert (deux lieutenants 6/6, « XXX »).
- **Suite** : « je ne sais pas lancer de jet à partir de la fiche d'un lieutenant » — exact, la fiche d'un combattant était en lecture seule. Ajouté : « Lancer un test pour … » dans la fiche du combattant (adversaires Vampire), écrit sur sa fiche ; e2e vert (« Armes à feu » seul, cinq dés).
- **Incident** : la synthèse des pilotes a été écrasée à 23 h 30 par une copie ancienne (programme qui tenait le fichier ouvert) ; reconstruite à 23 h 50, rien de perdu. Vérifier qu'aucun éditeur ne garde une vieille copie ouverte.
- **Reprendre par** : réimport du **2.2.0** avec « Remplacer » — ⚠️ pas le 2.1.0, antérieur à la Forge de David. Rien n'est commité.
