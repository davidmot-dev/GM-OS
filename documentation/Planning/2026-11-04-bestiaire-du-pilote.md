# Le bestiaire du pilote — plan, 04/11/2026

> **Garé le 04/11/2026** à la demande de David (« commit le plan et consigne le pour plus tard »),
> **repris le 05/11** : *« ok on commence par le A »*. Décision 1 tranchée (les créatures vivent
> **dans le pilote**) ; **étapes A à D livrées le 05/11** (§ « Étape A — livrée » à « Étape D — livrée »). Les décisions 2 et 3
> restent à prendre avant l'étape C.

Registre § 210. Demande de David, après le catalogue d'équipement (§ 203) et les suppléments
(§ 185) : *« maintenant on est capable de gérer les suppléments et les équipements d'un pilote. Je
pense qu'il faudrait aussi être capable d'intégrer automatiquement les bestiaires à partir des
bouquins de règles / suppléments. Penses-tu qu'on puisse modifier le module actuel dans ce sens ? »*,
puis *« écris le plan »*. Aucune ligne de code n'est écrite : ce document est le plan, et trois
décisions restent à prendre avec David (§ « À trancher »).

## Pourquoi

- **Le bestiaire actuel ne connaît pas les livres.** `useBestiaireStore`
  (`src/modules/combat/useBestiaireStore.ts`, demandé le 03/09/2026) range les **gabarits** que le
  meneur fabrique dans l'atelier des adversaires (`AtelierDesAdversaires.tsx`) : un archétype, un
  rang, des valeurs de fiche tirées. Il vit dans le stockage du meneur, rangé par jeu, **hors du
  pilote** : il ne voyage pas avec un export `.gmos-driver`, et rien n'y entre depuis un livre. Les
  rencontres (`PanneauDesRencontres.tsx`, `invocationDeRencontre.ts`) ne puisent que là.
- **Les créatures existent déjà, relues, dans les corpus de suppléments.** L'inventaire d'un
  supplément retient les créatures, que celui du livre de base exclut (§ 185). Exemple : la fiche
  `docs/systems/alien/supplements/colonial-marines/rules/nouvelles-variantes-de-xenomorphes-et-anathemes.md`
  (relue le 02/11) donne Biodrone XX121B, Goreburster XX121AB, quatre stades d'Anathème, et deux
  tables d'attaques D6.
- **Le chemin est tracé par le catalogue** (§ 203) : un bloc du pilote, des colonnes déclarées par
  le jeu, une section de l'éditeur, un remplissage **déterministe** depuis les fiches relues (on
  remplit ce qui est vide, on ne remplace rien, l'écart est dit), puis l'usage à la table.

## La difficulté

**Les profils de créatures sont écrits en phrases, pas en tableaux.** Le catalogue lit des tableaux
Markdown reconnus à leur première colonne (`src/modules/equipement/depuisLeCorpus.ts`). La fiche des
xénomorphes écrit : « Biodrone XX121B : Vitesse 2, Santé 6, Mobilité 8, Observation 10, Protection 8
(4 contre le feu), Éclaboussure d'acide 8. » Lire cette prose obligerait à deviner ; la faire lire par
un modèle, c'est ce que la Forge s'interdit : *un modèle invente un chiffre*.

D'où la proposition : **imposer un tableau de profil** aux fiches de créatures, le faire relire contre
le livre, puis le lire sans modèle — exactement comme les tableaux d'armes.

## Le modèle proposé (dans `src/types/drivers.ts`)

```ts
bestiaire?: {
  /** Les caractéristiques que CE jeu donne à une créature, chacune reliée à un champ de la fiche. */
  colonnes: ColonneDuBestiaire[];
  creatures: CreatureDuBestiaire[];
};
interface ColonneDuBestiaire {
  id: string; libelle: string; nature: 'nombre' | 'texte';
  /** Le champ de la fiche qu'elle remplit quand la créature entre en jeu — `protection`, `blessures_max`. */
  champ?: string;
}
interface CreatureDuBestiaire {
  id: string; nom: string; nomOriginal?: string;
  categorie?: string;            // « Xénomorphes aberrants », « Anathèmes » : le classement du livre
  etiquettes?: string[];         // « XX121 », « infecté »
  valeurs: Record<string, string | number>;   // clés = colonnes
  /** Des variantes au feu, à l'acide… gardées en texte : « 4 contre le feu ». */
  particularites?: string[];
  /** Les attaques : une table du pilote par son identifiant, ou des lignes. */
  attaques?: { table?: string; lignes?: { de: string; nom: string; effet: string }[] };
  description?: string;
  source?: { livre: string; page?: number; fiche?: string };
}
```

**Le socle est commun, les colonnes sont celles du jeu**, comme le catalogue. Chaque colonne dit le
champ de la fiche qu'elle remplit : une créature posée sur le plateau reçoit une **vraie fiche de
plateau**, et ce qui est déjà construit s'applique sans rien ajouter — la Protection et l'acide
d'Alien, les deux pistes de Degenesis (DEG-A6 : « préparé » d'office si les colonnes portent PHY,
Résistance et PSY), les coups localisés de RuneQuest.

**Alien a déjà un profil de xénomorphe au combat** (`XenomorpheAlien`,
`src/modules/dice/systemes/xenomorphesAlien.ts` : vitesse, maximum, protection, compétences, table
d'attaques `attaques_xenomorphe_rodeur`, acide). Le bestiaire ne le double pas : il le **nourrit**
(étape E).

## Les étapes

| Étape | Ce qu'elle livre | Écran |
| --- | --- | --- |
| **A. Modèle et contrôle** | Les types ; `src/modules/bestiaire/bestiaire.ts` (contrôle : colonnes, champs existants, tables d'attaques connues, identifiants) branché dans `controlerLePilote` | — |
| **B. Section « Bestiaire » de l'éditeur du pilote** | Liste par catégorie, grille selon les colonnes, attaques, source ; gestes purs dans `bestiaire.ts` | Stitch, sur la capture de la section « Équipement » |
| **C. Remplissage depuis le corpus** | Un **tableau de profil** imposé aux fiches de créatures (gabarit du supplément et fiches existantes mises au format à la relecture) ; `depuisLeCorpus` du bestiaire : lecture déterministe, on remplit le vide, l'écart est dit, les lignes illisibles montrées ; aperçu avant de verser | Stitch, sur l'aperçu du catalogue |
| **D. À la table** | « Prendre dans le bestiaire » dans Combat-OS et dans le panneau des rencontres (n exemplaires, noms numérotés, fiche de plateau remplie par les `champ`) ; l'atelier des adversaires lit les deux sources : le livre (fixe) et les gabarits fabriqués (inchangés) | Stitch |
| **E. Le propre de chaque jeu** | Alien : la créature nourrit `XenomorpheAlien` et sa table d'attaques D6 ; Degenesis : pistes et Égo ; RuneQuest : PV par zone. Un jeu à la fois, à la demande | selon le jeu |

Chaque étape : essais, `tsc -b`, lint, manuel (guide 50 pour l'éditeur, page 54 du jeu), synthèse
des pilotes et registre. Les écrans neufs passent par Stitch (consigne du 02/11).

**Cas témoin** : Colonial Marines. Biodrone XX121B — Vitesse 2, Santé 6, Mobilité 8, Observation 10,
Protection 8 (4 contre le feu), acide 8 — doit entrer au bestiaire tel quel, sa page résolue par
l'index du livre, et se poser sur le plateau avec 6 de santé et une Protection de 8.

## Les deux bestiaires

Question de David, le 04/11 : *« comment le bestiaire du pilote et l'ancien bestiaire vont
coexister ? »* Réponse proposée — **à confirmer à la reprise** :

| | Bestiaire du pilote (nouveau) | Bestiaire du meneur (`useBestiaireStore`) |
| --- | --- | --- |
| Contenu | Les créatures **du livre** | Les **gabarits fabriqués** dans l'atelier (archétype + rang) et les répartitions retenues |
| Origine | Fiches relues, ou saisie dans l'éditeur du pilote | L'atelier des adversaires |
| Lieu | Le pilote : il part avec l'export | Le stockage du meneur, par jeu |
| Correction | Dans l'éditeur du pilote, une fois pour tous | Gabarit par gabarit |

- **Ils se rejoignent à l'usage.** Combat-OS, les rencontres et l'atelier listent les deux, avec leur
  origine (« Livre — Colonial Marines, p. 178 » / « Mes gabarits ») ; les deux donnent un combattant
  avec sa fiche de plateau. Une ligne de rencontre dit sa source : une même rencontre peut mêler
  « 3 Biodrones du livre » et « 2 pillards à moi ».
- **Un seul passage : « Décliner »** (étape D). Depuis une créature du livre, il range une
  **variante** dans le bestiaire du meneur (« Biodrone blessé »), qui garde la trace de son modèle
  mais **copie** ses valeurs : une correction du livre ne la change pas en douce, on signale
  seulement que le modèle a changé. Pas de sens inverse : le pilote, c'est le livre.
- **Cas de bord.** Même nom des deux côtés : pas de collision, l'origine s'affiche. Réimporter le
  pilote avec « Remplacer » remplace le bestiaire du livre, jamais les gabarits ni les variantes.
  Purger un jeu : le bestiaire du livre part avec le pilote ; celui du meneur est déjà déclaré au
  registre des purges du pilote et suit la même décision.

## Étape A — livrée le 05/11/2026

GM-OS fermé, dit David. Décision 1 : *« Dans le pilote »*.

- **Types** (`src/types/drivers.ts`) : `ColonneDuBestiaire` (id, libellé, nature, **`champ`** de la
  fiche), `LigneDAttaque`, `CreatureDuBestiaire` (nom, nom original, catégorie, étiquettes, valeurs,
  particularités, attaques — table `{ univers, table }` et/ou lignes —, description, source),
  `BestiaireDuJeu`, et `bestiaire?` dans `GameDriver`.
- **`src/modules/bestiaire/bestiaire.ts`** : `controlerLeBestiaire` (erreurs : identifiants, colonnes,
  `champ` absent de la fiche, valeur hors des colonnes, table d'attaques sans nom, attaque sans dé ni
  nom, page ; avertissements : texte dans une colonne de nombres, deux colonnes sur le même champ),
  branché dans `controlerLePilote` avec les champs de la fiche ; `ficheDePlateau` (le contrat : chaque
  colonne qui a un `champ` l'écrit, les nombres lus comme nombres) ; `identifiantDeCreature`,
  `rangerParCategorie`, `bestiaireVide`.
- **Limite dite** : les tables d'attaques vivent sur le disque, par jeu (`pontDesTables`) ; la Forge
  vérifie leur forme, pas leur existence.
- **Vérifié** : `bestiaire.test.ts` (5, dont le cas témoin : le Biodrone XX121B donne santé 6 et
  Protection 8, la Vitesse reste au bestiaire) ; 31 fichiers de la Forge ; manuel des jeux (ligne
  `bestiaire` au 53) ; `tsc -b` et eslint.

## Étape B — livrée le 05/11/2026

David : *« on va faire le B »*. Maquette Stitch (projet 8352739217093926431, écran « GM-OS - Section
« Bestiaire » (790px) », `stitch/bestiaire/`) validée par David.

- **`EditeurDuBestiaire.tsx`** (`session/components/rules/`), section **07. Bestiaire** de l'éditeur
  du pilote (`RuleEngineEditor`, `RuleEngineSection` étendu) : colonnes avec Nombre/Texte et le
  **champ rempli** choisi parmi les champs de la fiche (« — reste au bestiaire — ») ; recherche ;
  « Remplir depuis le corpus » grisé (« bientôt », étape C) ; « Ajouter une créature » ; créatures par
  catégorie ; fiche dépliée (nom, nom original, catégorie, étiquettes, caractéristiques,
  particularités, attaques par table du jeu et lignes D6, **« Sur le plateau »**, description, livre
  et page, suppression) ; constats sous ce qu'ils visent.
- **Gestes purs** ajoutés à `bestiaire.ts` : ajouter, modifier, retirer une colonne (et ses valeurs),
  une créature ; chercher ; rang du constat. Les petites pièces de l'éditeur du catalogue
  (`FormulaireDeNom`, `ListeDePastilles`, `ListeDesConstats`) sont exportées et partagées.
- **Écarts à la maquette**, voulus : la coquille « Xénormorphes » et l'acide en Texte (Nombre) ;
  la grille **tient dans la largeur** — la première capture débordait (en-têtes « OBSERVA… », fiche
  coupée à droite), puis coupait les mots (« OBSERVAT ION ») : en-têtes plus petits, passage à la ligne
  entre deux mots seulement.
- **Vérifié** : `EditeurDuBestiaire.test.tsx` (5) et l'éditeur du catalogue (8) ; `bestiaire.test.ts` (5) ;
  `tsc -b`, eslint ; construction ; e2e des captures d'Alien (scène `sceneDuBestiaireAlien`,
  bestiaire posé à la main) : `jeu-alien-bestiaire-section`, relue. Guide 50 à jour.
- **Ensuite** : l'étape C — décisions 2 (extraction) et 3 (premier jeu) à prendre avec David.

## Étape C — livrée le 05/11/2026

David : *« ok commit et commence C »* ; décisions 2 et 3 (GM-OS fermé) : **« Tableau relu »** et
**« Alien »**. Aperçu dessiné dans Stitch (`stitch/bestiaire/remplir.png`) et validé.

- **Le gabarit** (`forge/rules/gabarits.ts`, consignes du supplément) : un sujet de créatures
  commence « ## Valeurs » par un **tableau de profil** (première colonne « Créature », une colonne
  par caractéristique et compétence chiffrées, précision entre parenthèses, « Particularités »
  séparées par des points-virgules) et recopie à part ses tables d'attaques (« Tableau des
  attaques de <créature> », « D6 | Attaque », « **Nom** : effet »). Le gabarit du livre de base est
  inchangé (essai) : il recevra la même consigne quand on forgera ses créatures.
- **La fiche relue des xénomorphes de *Colonial Marines*** mise au format : tableau de profil
  (Biodrone p. 176, Goreburster p. 177, Anathème monstrueux p. 180), **relu de nouveau contre le
  livre** (PDF = imprimée + 3), chiffres inchangés ; tables d'attaques titrées avec leur page (178,
  181) ; la table du Biodrone, celle du Drone du livre de base (p. 309), est dite en particularité —
  elle n'est pas reliée d'office à `attaques_xenomorphe_rodeur`, l'équivalence n'étant pas vérifiée.
  La fiche devient « corrigée » (empreinte), donc protégée d'une reforge.
- **`bestiaire/depuisLeCorpus.ts`** (`remplirLeBestiaire`, `estUneFicheDeBestiaire`) : lecture
  déterministe, on remplit le vide, l'écart est dit ; « 8 (4 contre le feu) » → 8 et la particularité
  « Protection 4 contre le feu » ; catégorie, particularités et page au socle ; tables d'attaques
  rattachées par le titre, après toutes les créatures ; lignes boiteuses et tables orphelines
  montrées. `equipement/livresDuJeu.ts` reçoit un filtre des fiches (`retenir`).
- **`RemplirLeBestiaire.tsx`** : l'aperçu (livres à cocher, bilan, créatures par catégorie, colonnes,
  attaques rattachées, « À regarder », tableaux écartés), branché sur « Remplir depuis le corpus » de
  la section. Corrigé après la première capture : en-têtes qui se chevauchaient, ligne d'attaques
  trop longue ; dans la section, les exemples des champs de table (« Alien ») se lisaient comme des
  valeurs.
- **Vérifié** : `depuisLeCorpus.test.ts` (7, sur la fiche réelle), `RemplirLeBestiaire.test.tsx` (3),
  `EditeurDuBestiaire.test.tsx` (5), `bestiaire.test.ts` (5), `supplements.test.ts` (15) ; `tsc -b`,
  eslint ; construction ; e2e d'Alien (le bestiaire part vide, se remplit, trois colonnes reliées) :
  `jeu-alien-bestiaire-remplir` et `jeu-alien-bestiaire-section`, relues. Guide 50 et manuel 53.
- **Ensuite** : l'étape D (poser une créature sur le plateau, rencontres, « Décliner »), après la
  confirmation de la coexistence des deux bestiaires.

## Étape D — livrée le 05/11/2026

David : *« ok c'est bon. On peut faire le D ? »* ; choix (GM-OS fermé) : **coexistence confirmée**
(« Décliner » compris) ; **atelier et rencontres**. Onglet « Livre » dessiné dans Stitch
(`stitch/bestiaire/atelier-livre.png`) et validé.

- **Logique** (`combat/logic/invocationDeRencontre.ts`) : `exemplairesDeLaCreature` (N exemplaires
  numérotés, fiche de plateau par `ficheDePlateau`, rien de tiré, `origineDuLivre`, notes : colonnes
  sans champ, particularités, attaques, source) ; `varianteDeLaCreature` (copie des valeurs,
  archétype « quelconque », `depuis`) ; `adversairesDeLaRencontre` lit les lignes « créature » dans
  `ctx.bestiaire` et dit celle qui a disparu. `LigneDeRencontre` gagne `genre: 'creature'`
  (`lignesDeRencontre.ts` : `ligneDeLaCreature`, libellé) ; `rencontreDuPlateau` regroupe les
  exemplaires d'une créature en une ligne. `Combatant.origineDuLivre`, `GabaritDAdversaire.depuis`.
- **Écrans** : `CreaturesDuLivre.tsx`, onglet « Livre » de `AtelierDesAdversaires` (« Au combat (n) »,
  « Décliner », nom numéroté pour ne pas écraser une variante, pied de la fabrique masqué sous
  « Livre » — vu sur la première capture) ; la variante se dit « Variante de « … » (livre) » dans
  l'onglet Bestiaire ; la Trame (`RencontresDeLaScene`) a un groupe « Créatures du livre » ;
  `PanneauDesRencontres` passe le bestiaire du pilote à l'invocation.
- **Vérifié** : `creaturesDuLivre.test.ts` (4), `AtelierDesAdversaires.test.tsx` (13, dont 3 neufs),
  315 essais de la logique du combat ; `tsc -b`, eslint ; construction ; e2e d'Alien (deux Biodrones
  posés, santé 6) et capture `jeu-alien-bestiaire-atelier`, relue. Guides 30, 11, 50 et manuel 53.
- **Ensuite** : l'étape E, ce qui est propre à chaque jeu (Alien : nourrir `XenomorpheAlien` et sa
  table d'attaques), à la demande.

## Ce qui ne change pas

- **Le bestiaire du meneur** (`useBestiaireStore`) garde ses gabarits fabriqués et ses répartitions
  retenues ; la purge du pilote le connaît déjà (`detenteursDuPilote.ts`).
- **La Galerie** garde les PNJ nommés : une créature du livre est un **gabarit**, pas une entité
  (« un pillard, pas Luv », `useBestiaireStore`).
- **Les fiches relues font foi** : on ne relit pas le livre par un modèle pour remplir le bestiaire.

## À trancher avec David

1. **Où vivent les créatures du livre.** *Recommandé* : dans le pilote, comme le catalogue — elles
   voyagent avec l'export et se corrigent une fois ; le magasin local reste pour ce que le meneur
   fabrique. *Autre voie* : les verser dans le magasin local (plus simple, mais rien ne voyage).
2. **Comment on extrait les profils.** *Recommandé* : un tableau de profil imposé dans les fiches,
   relu contre le livre, puis lu sans modèle. *Autre voie* : une extraction par l'IA (schéma imposé)
   validée ligne à ligne par le meneur — plus rapide à brancher, moins sûre.
3. **Le premier jeu.** *Recommandé* : Alien avec Colonial Marines — une fiche de créatures relue, le
   catalogue en place, des profils courts, des tables d'attaques. *Autres* : Degenesis (les pistes
   sont prêtes, DEG-A6), RuneQuest (PV par zone).

## Questions ouvertes

- Le livre de base d'Alien a-t-il une fiche de créatures relue ? Son inventaire exclut le bestiaire,
  comme celui de l'équipement (§ 203 : on avait transcrit depuis le PDF lu en image).
- Les tables d'attaques d'un supplément (Goreburster, Anathème monstrueux) deviennent-elles des tables
  du pilote, ou restent-elles des lignes de la créature ?
- La tablette (Hub) n'en a pas besoin : les créatures sont au meneur.
