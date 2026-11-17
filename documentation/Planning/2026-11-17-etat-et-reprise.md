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

