# Le catalogue d'équipement du pilote — plan, 02/11/2026

Registre § 203. Demande de David, après la relecture de *Colonial Marines* (§ 185) : *« Est-ce qu'on ne
devrait pas faire une section équipement dans le pilote ? »*, puis, sur la proposition : *« Oui c'est
bien »*. Aucune ligne de code n'est écrite ; ce document est le plan.

## Pourquoi

- **Une arme n'existe aujourd'hui que sur la fiche d'un personnage.** Pour Alien, ce sont des lignes de
  texte parallèles (nom, bonus, dégâts, portée, propriétés) que le panneau de jet relit
  (`equipementsAlien`, `src/modules/dice/systemes/jetsAlien.ts`). Équiper un Marine, c'est recopier « +1 »,
  « 3 », « Longue » à la main ; une faute de frappe change le jet.
- **Le pilote ne connaît que des tables de butin** (`lootTables`). L'objet d'inventaire a un
  `properties` libre que ni le jet ni le combat ne lisent.
- **Les chiffres existent, relus** : les 18 fiches de Colonial Marines (§ 185, relues le 02/11).

## Décisions de David (02/11)

1. **Quatre familles**, chacune avec ses caractéristiques. David proposait trois familles (armes,
   véhicules, équipement descriptif) et les objets spéciaux ; la discussion a ajouté les protections, et
   les objets spéciaux sont devenus du matériel à effets.

   | Famille | Ce qu'elle porte |
   | --- | --- |
   | **Armes** | les colonnes d'attaque du jeu, des propriétés (perce-armure, mode automatique…) |
   | **Protections** | la Protection et les colonnes du jeu (réserve d'air, malus) |
   | **Véhicules** | un profil propre (passagers, maniabilité, vitesse, coque, Protection) et leur armement |
   | **Matériel** | poids, coût, description et une **liste d'effets**, éventuellement vide |

2. **Les objets spéciaux** (implant cyber, anneau magique, palmes M11, nécessaire NRBC) sont du
   matériel à effets ; « implant », « magique » sont des **étiquettes**, pas une famille.
3. **Un objet peut en contenir d'autres** par référence : la CCC5 et son AK-104S, l'EXOM et ses six
   armes, le M577 et ses tourelles. On corrige le M41A une fois.
4. **Les effets du matériel sont rappelés, pas appliqués** : leurs conditions sont narratives (« sous
   l'eau »). Le panneau de jet les propose avec une case à cocher.

## Le modèle (dans `src/types/drivers.ts`)

```ts
catalogue?: {
  /** Les colonnes que CE jeu donne à chaque famille — Alien : bonus, dégâts, portée. */
  colonnes: Partial<Record<FamilleDObjet, ColonneDuCatalogue[]>>;
  objets: ObjetDuCatalogue[];
};
type FamilleDObjet = 'arme' | 'protection' | 'vehicule' | 'materiel';
interface ColonneDuCatalogue { id: string; libelle: string; nature: 'nombre' | 'texte' }
interface ObjetDuCatalogue {
  id: string; famille: FamilleDObjet; nom: string; nomOriginal?: string;
  categorie?: string;            // « Pistolets », « Armes lourdes » : le classement du livre
  etiquettes?: string[];         // « implant », « magique »
  valeurs: Record<string, string | number>;   // clés = colonnes de la famille
  proprietes?: string[];         // « Perce-armure », « Mode automatique »
  poids?: string; cout?: string; description?: string;
  effets?: { cible: string; valeur?: number; condition?: string; texte: string }[];
  contient?: string[];           // ids d'autres objets du catalogue
  source?: { livre: string; page?: number; fiche?: string };
}
```

**Le socle est commun, les colonnes sont celles du jeu.** On ne type pas d'avance les armes de
RuneQuest ou de Shadowrun : chaque pilote déclare ses colonnes. Le champ est facultatif, donc les pilotes
existants restent valides, et l'archive `.gmos-driver` le transporte telle quelle.

## Les étapes

| # | Étape | Ce qu'elle livre | Vérification |
| --- | --- | --- | --- |
| A | **Le modèle et son contrôle** | le type ; `controlerLePilote` refuse un `contient` qui pointe dans le vide, une valeur hors des colonnes déclarées, deux objets du même id | essais du contrôle |
| B | **La section « Équipement » de l'éditeur du pilote** | huitième section de `RuleEngineEditor` : quatre onglets, une liste filtrable, un formulaire par objet, l'éditeur des colonnes | essais du composant ; essai de David |
| C | **Le remplissage depuis le corpus** | lecture **déterministe** des tableaux Markdown des fiches relues (Colonial Marines d'abord) : les en-têtes rapprochés des colonnes du jeu, chaque ligne devient un objet avec sa source et sa page. Aperçu avant d'enregistrer ; règle d'`enrichirLePilote` (on remplit, on n'écrase jamais) ; les lignes non rapprochées sont montrées, pas jetées. **Aucun appel au carnet** : les fiches sont relues, on ne refait pas lire le livre | essais sur les 18 fiches réelles (nombre d'objets, quelques valeurs témoins : M108 dégâts 3, Type 4 à 200 $) |
| D | **« Prendre dans le catalogue » sur la fiche Alien** | pour une arme : une ligne ajoutée à chaque champ (noms, bonus, dégâts, portées, propriétés) ; pour une protection : le champ `protection`. La fiche HTML suit par « Sauvegarder » | essais de `equipementsAlien` avec un objet pris ; essai de David |
| E | **Le rappel des effets au panneau de jet** | les effets du matériel porté qui visent la compétence lancée, avec leur condition et une case | essais du panneau |

Ensuite, hors de ce chantier : Loot-OS qui distribue un objet du catalogue, les véhicules à la table
(piloté, endommagé), les autres jeux.

## Questions ouvertes

1. **Le livre de base d'Alien n'a pas de fiche d'équipement relue.** Son gabarit d'inventaire exclut
   l'équipement, et `weapons_armor_gear_vehicles.md` est une extraction brute aux colonnes mêlées.
   Deux voies : forger et relire des fiches d'équipement du livre de base, comme pour le supplément ; ou
   transcrire les tableaux depuis le PDF lu en image, puis relecture de David. À décider à l'étape C.
2. **Où vit le bouton de l'étape D** : sur la fiche GM-OS du personnage (à localiser dans le gabarit
   d'Alien), probablement à côté des champs d'armes.

## Avancement

- **Étape A livrée le 02/11** (GM-OS fermé) : les types dans `src/types/drivers.ts` (`catalogue?` du
  pilote) ; `src/modules/equipement/catalogue.ts` — `controlerLeCatalogue` (objet contenu introuvable
  ou lui-même, cercles signalés une fois, valeur hors des colonnes de la famille, identifiants en double,
  familles et colonnes mal déclarées, effet muet, page invalide ; un texte dans une colonne de nombres
  n'est qu'un avertissement : « Puissance 9 »), `objetsContenus`, `objetsDeLaFamille`,
  `identifiantDObjet` ; branché dans `controlerLePilote`. Essais `catalogue.test.ts` (12, dont la
  survie du catalogue au schéma de l'état sauvegardé) ; 30 fichiers de la Forge et de l'équipement,
  580 essais ; `npx tsc -b`, eslint.
- **Le design d'écran passe par Stitch** — consigne de David du 02/11, pour les étapes B, D et E. La
  méthode est celle de la refonte (`2026-09-27-prompts-stitch-tour-2.md`, `stitch/README.md`) : une
  conversation par écran, un prompt court écrit depuis le code, l'export rendu par Claude avant d'être
  jugé, l'intégration dans la grammaire commune (`GabaritDeModule`, jetons des thèmes).
- **Étape B livrée le 02/11** (GM-OS fermé), d'après l'écran Stitch retenu au second tour :
  `src/modules/session/components/rules/EditeurDuCatalogue.tsx`, qui devient la section
  « Équipement » de `RuleEngineEditor`, placée entre les Trésors et la Connaissance, avec son résumé
  « n objet(s) au catalogue ». Les gestes d'édition sont des fonctions pures de `catalogue.ts` :
  - colonnes ajoutées, modifiées, retirées avec leurs valeurs (après confirmation si elles en portent) ;
  - objets ajoutés, modifiés, supprimés, ce qui retire aussi les renvois vers eux ;
  - rangement par catégorie et recherche sans accents.

  Ce qui change par rapport à l'écran de Stitch :
  - la grille suit les colonnes que la famille déclare ;
  - « Emporte » se choisit dans une liste du catalogue ;
  - les cibles des effets sont proposées depuis les champs de la fiche du jeu ;
  - une case vidée disparaît, au lieu de laisser une chaîne vide.

  Vérifié :
  - `catalogue.test.ts` (18 essais) et `EditeurDuCatalogue.test.tsx` (7) ;
  - session, Forge et équipement : 224 fichiers, 2 440 essais ;
  - **la suite complète** : 793 fichiers, 9 555 essais. Son seul échec venait du manuel des jeux,
    qui n'avait pas de ligne pour `catalogue` ; la ligne est ajoutée au 53 ;
  - `npx tsc -b` et eslint passent.

  Le guide 50 décrit la section. **Reste l'essai de David à l'écran** (voir « Garde-fous »).

## Étape B — le prompt Stitch (02/11)

**Joindre** : la capture de la section « Tables de butin » fournie par David le 02/11. Elle tient lieu
de grammaire, car l'éditeur du pilote a son propre habillage, en thème clair, avec un titre en
italique et des cartes arrondies. **Une seule conversation Stitch**, comme pour les écrans de la refonte.
Les données d'exemple viennent des fiches relues de *Colonial Marines* : pistolets p. 66, charge de
brèche Type 4 dans les explosifs. La section affichera les constats réels de `controlerLeCatalogue`.

```text
Même logiciel que la capture jointe : c'est la section « Tables de butin » de l'éditeur du pilote
d'un jeu. Dessine la section voisine, « Équipement », dans la MÊME colonne et le MÊME style : titre
en capitales italiques avec un sous-titre souligné, cartes très arrondies, libellés en petites
capitales espacées, accent doré, thème clair. Ne dessine que la zone de contenu, comme la capture :
la liste des sections de l'éditeur existe déjà à gauche.

Ce que fait la section : tenir le catalogue d'équipement du jeu, en quatre familles d'objets. Chaque
jeu déclare les colonnes chiffrées de chaque famille.

De haut en bas :
1. En-tête : une icône, « ÉQUIPEMENT » et le sous-titre « Catalogue du jeu ». Une phrase : « Les
   armes, protections, véhicules et le matériel du jeu, avec leurs caractéristiques. Une fiche de
   personnage s'équipe ici au lieu de recopier les chiffres. »
2. Quatre onglets avec leur compte : Armes (4) · Protections (2) · Véhicules (1) · Matériel (1).
   L'onglet Armes est ouvert.
3. Une carte « Les colonnes des armes », comme la carte « Le vocabulaire de ce jeu » de la
   capture. Une ligne par colonne : son libellé, un choix Nombre / Texte en deux boutons, une
   corbeille. Puis « + Ajouter une colonne ». Les colonnes sont Bonus (Nombre), Dégâts (Nombre) et
   Portée (Texte).
4. Un champ « Chercher un objet » et, à droite, le bouton plein « + Ajouter un objet ».
5. La liste des armes, rangée sous deux intertitres de catégorie. Une ligne par objet : le nom, le
   nom original en petit dessous, une cellule par colonne, les propriétés en pastilles, la page de
   la source.
   Pistolets :
   - Pistolet semi-automatique VP-70MA6 — VP-70MA6 Semi-Automatic Pistol — +2 · 1 · Moyenne — p. 66
   - Pistolet semi-automatique Norcomm QSZ-203 — +1 · 1 · Moyenne — Perce-armure — p. 66
   - Pistolet électrostatique semi-automatique Weyland ES-4 — +1 · 1 · Moyenne — Sonne la cible,
     Perce-armure — p. 66
   Explosifs :
   - Charge de brèche Armat Type 4 — Bonus vide · Dégâts « Puissance 9 » · Portée vide — pas de page.
     Cette ligne porte un avertissement discret, ocre : « “Puissance 9” n'est pas un nombre : une
     mécanique qui lit les dégâts ne le comptera pas. »
6. La première ligne, VP-70MA6, est dépliée en fiche de l'objet, juste sous elle :
   Nom ; Nom original ; Catégorie ; Étiquettes (pastilles, « + ») ; une case par colonne (Bonus +2,
   Dégâts 1, Portée Moyenne) ; Propriétés (pastilles, « + ») ; Poids « ½ » ; Coût « 250 $ » ;
   Description (vide) ;
   « Effets » : vide, avec « + Ajouter un effet » (un effet = un texte, la compétence visée, une
   valeur, une condition) ;
   « Emporte » : vide, avec « + Choisir dans le catalogue » ;
   Source : livre « Marines Coloniaux », page 66 ;
   en bas à droite, « Supprimer l'objet » en rouge discret.

C'est TOUT. N'ajoute rien : pas d'image d'objet, pas de total, pas d'import, pas d'export, pas de
bouton d'IA, pas de statistiques, pas de rareté, aucun chiffre qui ne soit pas ci-dessus. Libellés
en français. Rien en dessous de 12 px ; texte courant contraste ≥ 4,5.
```

**Premier tour (02/11), relu dans son code** : Stitch n'a inventé aucune fonction. Pas d'IA, pas
d'import, pas de chiffre étranger. Le compte par catégorie (« 3 objets ») est gardé, puisqu'il se
déduit de la liste. Six écarts sont à corriger :

- les valeurs des lignes repliées ne s'alignent pas d'une ligne à l'autre, et n'ont pas d'en-tête.
  C'est illisible pour un véhicule à six colonnes ;
- seule la ligne dépliée a un chevron ;
- « Perce-armure » a une couleur à part, qui ne veut rien dire ;
- certains boutons ont deux signes « + » ;
- les colonnes sont numérotées 01, 02, 03, et la carte porte un sous-titre inventé ;
- le texte gris (`#8892a0` sur blanc) tombe sous un contraste de 4,5.

L'en-tête de la section, lui, reprendra le code de « Tables de butin » à l'intégration. Image du
premier tour : `Stitch/equipement/tour-1-screen.png`. Le prompt correctif, dans la même
conversation :

```text
Garde tout, avec ces corrections seulement :
1. Les valeurs des lignes repliées s'alignent en colonnes d'une ligne à l'autre. Sous chaque
   intertitre de catégorie, une ligne d'en-tête discrète : « Bonus · Dégâts · Portée · Propriétés ·
   Source ». Chaque objet remplit ces mêmes colonnes, à la même place ; une valeur vide est un
   tiret. Un véhicule aura six colonnes : la grille doit le permettre.
2. Chaque ligne repliée porte le chevron « déplier », comme la ligne dépliée porte « replier ».
3. Toutes les pastilles de propriétés ont le même style neutre ; « Perce-armure » n'a pas de
   couleur à part.
4. Un seul « + » par bouton : retire le signe tapé là où l'icône est déjà là.
5. Retire les numéros 01, 02, 03 des colonnes et la mention « Déclarées pour ce jeu ».
6. Dans la fiche dépliée, « Colonnes caractéristiques » devient « Caractéristiques » ;
   « + Ajouter un effet » et « + Choisir dans le catalogue » ont le même style de bouton.
7. La source se saisit en deux champs : Livre « Marines Coloniaux » et Page « 66 ».
8. Le texte gris secondaire (« pas de page », « Aucune description renseignée », les intitulés)
   atteint un contraste de 4,5 sur son fond.
N'ajoute rien d'autre.
```

**Second tour (02/11) — retenu.** Les huit corrections sont faites. L'image de Stitch était encore
celle du premier tour ; le rendu de Claude à 1440 px fait foi et ne trouve aucun texte sous 12 px.
Ce rendu est rangé dans `stitch/equipement/equipement-armes.png` et `.html`.

**Pour l'intégration** (on ne colle pas le code de Stitch) :

- l'en-tête reprend celui de « Tables de butin », et les couleurs sont les jetons du thème, pas les
  valeurs de Stitch. L'icône est `Swords` de lucide ;
- la grille des lignes se construit **depuis les colonnes déclarées** de la famille : le nom, une
  cellule par colonne, les propriétés, la source. Les 12 colonnes fixes de Stitch ne tiennent pas pour
  un véhicule. Une cellule ne coupe pas sa valeur : « Puissance 9 » et « pas de page » passaient à la
  ligne dans le rendu ;
- la fiche dépliée est faite de vrais champs. « Emporte » propose une liste des objets du catalogue,
  jamais une saisie libre. Les constats viennent de `controlerLeCatalogue` et s'affichent sous la ligne
  qu'ils visent.

**Ensuite** (historique du premier tour) : David rapporte l'image et l'export HTML. Claude rend le HTML à 1440 px pour le juger
(l'image de Stitch peut retarder sur son code), retire les inventions par un prompt correctif, et
range le retenu dans `stitch/equipement/`.

## Garde-fous

- ⛔ « GM-OS tourne-t-il ? » avant chaque étape qui touche `src/`.
- Un essai par étape ; `npx tsc -b` ; eslint ; la suite complète à la fin de B et de D.
- Documenter dans la même livraison : guide `50-Forge-des-systemes.md` (section de l'éditeur), manuel
  du jeu Alien (`54-Jeu-Alien.md`) pour l'étape D, synthèse des pilotes, registre.
