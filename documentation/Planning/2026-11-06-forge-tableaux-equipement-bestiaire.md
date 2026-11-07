# La Forge écrit des tableaux lisibles — équipement et bestiaire — plan du 06/11/2026

**Statut** : plan tranché par David le 06/11 (§ « Décisions de David »). **F1, F5 et F2 livrés le
06/11 et essayés par David** (les adversaires de COC, reforgés en tableau) ; **F4 et F3 livrés le
06/11**, essai de David attendu. Le plan est entièrement réalisé.

David, le 06/11 : *« j'ai essayé de remplir les équipements de COC à partir de l'atelier et malgré
le fait que j'ai une fiche, rien ne se remplit »*, puis *« je voudrais à terme que le moteur de
l'atelier puisse faire le travail correctement pour les équipements et le bestiaire »*.

## Le constat

- « Remplir depuis le corpus » (catalogue et bestiaire) ne lit que des **tableaux Markdown** :
  - la première colonne nomme une **famille** (`Arme`, `Protection`, `Véhicule`, `Objet`…), ou
    `Créature` pour le bestiaire ;
  - le titre du tableau donne la catégorie et la page : `### Tableau des Armes de contact (p. 93)`.
- La fiche de COC forgée le 06/11 (`equipements-et-objets.md`, gabarit v3, `relu: false`) n'a **aucun
  tableau** : de la prose et des listes (« Gilet rigide : RD 8, malus -4 »). Elle donne les règles de
  prix, pas la liste des armes, renvoyée « aux sujets du combat ».
- **La cause dans le moteur** : la consigne « un tableau du livre se recopie en TABLEAU MARKDOWN » et
  le tableau de profil des créatures ne sont écrits que dans `consignesDuSupplement`
  (`src/modules/forge/rules/gabarits.ts`), **vide pour un livre de base**. Le gabarit du livre de
  base demande 1 500 à 2 500 caractères : trop peu pour 36 armes.
- **Rien ne le signale** : l'atelier publie la fiche, et l'écran du catalogue compte zéro fiche
  d'équipement sans dire pourquoi.

Pour COC, le 06/11 : la fiche `equipement-armes-et-protections-du-livre-de-base.md` a été transcrite
du PDF à la main (36 armes, 8 protections, une colonne de prix par époque) ; l'écran « Remplir
depuis le corpus » dit désormais quelle fiche parle d'équipement ou de créatures sans tableau.
Ce plan vise à ce que la Forge le fasse seule.

## Les étapes proposées

### F1 — Le contrôle à la relecture (d'abord : il ne coûte presque rien)

Dans l'atelier de règles, quand une fiche est relue avant publication, la passer aux deux lecteurs
réels, à blanc (`remplirDepuisLesFiches`, `remplirLeBestiaire`) et afficher le bilan :
« 36 armes et 7 protections lisibles par le catalogue », « 2 lignes illisibles (4 cases pour
5 colonnes) », « aucun tableau d'équipement ». Une fiche dont le sujet est l'équipement ou des
créatures et qui ne donne **rien** au lecteur est signalée en alerte. *Un contrôle qui se tait est
pire qu'absent* : c'est le défaut de COC.

### F2 — Des consignes de tableau pour tout livre, selon la nature du sujet

- Reconnaître un **sujet d'équipement** (armes, armures, protections, véhicules, matériel, objets,
  biens) ou **de créatures** (bestiaire, adversaires, créatures, PNJ chiffrés), qu'il vienne du
  livre de base ou d'un supplément.
- Pour ces sujets, la consigne de tableau s'applique toujours, avec le format exact du lecteur :
  - une section `### Tableau des <catégorie> (p. N)` par tableau du livre ;
  - la première colonne s'appelle `Arme`, `Protection`, `Véhicule` ou `Objet` (jamais
    « Armes à distance légères » : c'est le titre qui porte la catégorie) ;
  - les colonnes telles que le livre les nomme ; `Coût`, `Poids` et `Spécial` sont reconnues ;
  - les notes de bas de tableau vont dans `Spécial` ; « N/A » s'écrit « – » ;
  - toutes les lignes, le nom en gras.
- Le bestiaire garde son format (tableau de profil `Créature`, tables « D6 | Attaque », colonne
  « Table d'attaques ») ; il sort de `consignesDuSupplement` pour valoir aussi au livre de base.
- La borne de longueur suit le nombre de lignes, comme pour un supplément.

### F3 — Un tableau par requête quand le livre est long

NotebookLM coupe vers 6 minutes (mesuré : 356 s sur le gabarit entier). Un chapitre d'armes de
quarante lignes, sept colonnes, dépasse ce qu'une requête rend sûrement. Proposer : l'inventaire
liste les tableaux du chapitre (titre, page, nombre de lignes attendu) ; la Forge demande **un
tableau par requête** ; la fiche s'assemble. Le nombre de lignes attendu devient un contrôle :
« 15 armes attendues, 12 recopiées ».

### F4 — Le livre vérifie la fiche

Le registre des livres donne maintenant le PDF et son décalage. Pour chaque tableau `(p. N)`, le
processus principal lit la page N + décalage et cherche, ligne par ligne, le nom et les valeurs de la
fiche dans le texte de la page (l'ordre des colonnes n'est pas fiable dans le texte extrait ; la
présence des jetons l'est). Bilan : « 34 lignes sur 36 retrouvées sur leur page ; à vérifier :
Fusil de précision (30 introuvable p. 94) ». Le carnet a déjà inventé des règles : on ne publie pas
un tableau chiffré sans ce contrôle.

### F5 — Le lecteur accepte les familles du livre

Le lecteur refuse aujourd'hui une première colonne « Explosif », « Armes à distance légères » ou
« Munitions ». Élargir `familleDuTableau` (et l'équivalent du bestiaire : « Adversaire »,
« PNJ », « Monstre ») pour qu'un tableau recopié tel que le livre l'imprime soit lu, sans attendre
que la Forge renomme sa colonne.

## Livré le 06/11 — F1, F5, F2

David : *« commit et commence le moteur (gm-os est fermé) »*.

- **F1 — le bilan à la relecture** : `forge/rules/bilanDesLecteurs.ts` passe la fiche relue à
  `remplirDepuisLesFiches` et `remplirLeBestiaire`, à blanc. L'atelier affiche « Ce que le catalogue
  et le bestiaire liront » : objets par famille, créatures et tables d'attaques, lignes illisibles.
  Une fiche qui parle d'équipement ou de créatures sans rien donner reçoit l'**alerte**, et reste
  publiable (décision 2). Une fiche de règles ordinaire n'affiche rien.
- **F5 — les familles du livre** : pour les armes, protections et véhicules, le **début** de la
  première colonne suffit (« Armes à distance légères », « Armures », et « Explosif », « Munitions »,
  « Grenade » pour les armes) ; le matériel reste au mot exact. Le bestiaire reconnaît aussi « PNJ »,
  « Monstre », « Antagoniste », « Ennemi », « Sbire », « Figurant ». Vérifié sur tout le corpus :
  aucun tableau existant n'est lu en plus.
- **F2 — le gabarit des tableaux** : `natureDuSujet` (par mots entiers : « Charmes » n'est pas une
  arme) reconnaît un sujet d'équipement ou de créatures ; la Forge lui donne
  `gabaritFicheTableaux` à la place de la première moitié ordinaire, livre de base compris : un
  `### Tableau des <titre exact de sa section>` par tableau (l'index du livre en donne la page ; le
  carnet n'en cite aucune), première colonne `Arme`/`Protection`/`Véhicule`/`Objet` ou `Créature`,
  `Coût`, `Poids`, `Spécial`, « – » pour N/A, une colonne `Prix <année>` par époque (décision 1),
  jusqu'à 6 000 caractères. La seconde moitié ne change pas.
- **La longueur des invites** : le gabarit des tableaux fait 2 359 à 3 038 caractères, sous les
  3 594 acceptés par NotebookLM (essai ajouté à `questionAuCarnet.test.ts`). ⚠️ Constat en passant :
  la première moitié ordinaire **en mode supplément** fait 4 613 caractères, au-delà de cette
  limite mesurée le 03/10 ; les fiches de *Colonial Marines* ont pourtant été forgées. La limite est
  peut-être moins stricte qu'on ne l'a mesurée : à vérifier avant d'allonger une invite.
- **Vérifié** : `bilanDesLecteurs.test.ts` (5, sur les vraies fiches), `BrainstormOverlay.test.tsx`
  (+2), `ForgeService.test.ts` (+2 : le gabarit choisi, la fiche assemblée lue par le catalogue),
  lecteurs (+3), longueurs (+4) ; 964 essais (Forge, invites, équipement, écrans des règles),
  `tsc -b`, eslint.
- **À essayer par David** : forger le bestiaire de COC (« La gestion simplifiée des adversaires par
  rôles et bandes de sbires ») dans l'atelier ; à la relecture, le bilan dit combien de créatures le
  bestiaire lira (décision 3).
- **Reste** : F4 (le livre vérifie les lignes) et F3 (un tableau par requête), à lancer après cet
  essai.

## Corrigé le 06/11, à l'essai de David — le sujet libre et la note de relecture

David, en essayant : *« lorsque je rentre ce sujet : La gestion simplifiée des adversaires par
rôles et bandes de sbires, il n'y a rien qui se passe dans la forge »*, puis *« la forge s'ouvre
directement, sans résultat »*.

- **Le sujet libre retrouvé** : le sujet était déjà le quatrième hors catégorie de l'inventaire de
  COC, et sa fiche déjà publiée. L'atelier écartait le doublon sans un mot et rouvrait la liste
  relue sur le disque. Désormais il le **passe en tête**, la carte désignée, avec un bandeau :
  « déjà dans l'inventaire (et publiée) : cliquez dessus pour la (re)forger » (`sujetLibre.ts`,
  `BrainstormOverlay.tsx`, `DiscoveryUI.tsx`). Une reforge au même nom remplace la fiche sur place ;
  elle n'est archivée dans `rules-v1/` que si elle a été corrigée à la main.
- **La note de relecture lue comme un sujet** : `*Relu le 2026-10-31 contre le livre…*`, en
  italique au bas des inventaires relus, était prise pour une puce (l'astérisque) avec le tiret de
  la date pour séparateur. **Huit jeux** recevaient un sujet « Relu le 2026 » (Barbarians, Blade
  Runner, COC, Degenesis, Dune, RuneQuest, Shadowrun Anarchy, Symbaroum) ; COC en avait forgé une
  fiche vide, publiée : `docs/systems/coc/rules/relu-le-2026.md` (non suivie par git, copie dans
  `drafts/`). Une puce de symbole demande maintenant une espace (`inventaire.ts`) ; sur les
  inventaires de tous les jeux, seules ces huit lignes disparaissent.
- **Vérifié** : `inventaire.test.ts` (+3, dont l'inventaire réel de COC), `BrainstormOverlay.test.tsx`
  (+2), `DiscoveryUI.test.tsx` (4, neuf) ; 959 essais (Forge, invites, équipement, bestiaire),
  `tsc -b`, eslint.
- **La fiche vide supprimée** (`rules/` et `drafts/`), à la demande de David (« oui supprime »).
- **Reste** : l'essai prévu — cliquer la carte des adversaires pour la reforger avec le gabarit des
  tableaux.
- ~~Non traité : en mode supplément, le sujet libre n'entre pas dans la liste.~~ **Fait le 07/11**
  (David : *« je voudrais que l'on active le "sujet de forge libre" pour les Suppléments »*, « le
  temps de le forger ») : le sujet libre se pose sur la liste des sujets retenus, en tête, marqué,
  comme pour le livre de base ; il n'est **jamais enregistré** dans `sujets.json` (« Ajouter » reste
  le geste qui l'y met). Une seule règle pour les deux livres : `avecLeSujetLibre` et
  `sansLeSujetLibre` (`forge/rules/sujetLibre.ts`). Essais : `sujetLibre.test.ts` (3),
  `BrainstormOverlay.test.tsx` (+2, mode supplément) ; 901 essais de la Forge, `tsc -b`, eslint.

## La reforge des adversaires de COC — l'essai de David, le 06/11

David a reforgé « La gestion simplifiée des adversaires… » avec le gabarit des tableaux (*« ok c'est
bon »*). **Le tableau a marché** : un tableau de profils `Créature` (Figurant, Second rôle, Premier
rôle, Bande de sbires) que le bestiaire lit (4 profils, aucune ligne illisible), aux valeurs justes.
**La prose, non** : elle réintroduisait les deux règles que la relecture du 31/10 avait retirées
(les sbires éliminés par tranche de dommages, la garde du premier rôle) et ajoutait un figurant
éliminé sans jet de dommages (il a 20 échelons). La fiche publiée est donc reconstituée : le tableau
de la reforge, le texte relu du 31/10, `relu: true`. L'ancienne version, corrigée à la main, avait
été archivée par l'atelier dans `rules-v1/` (son empreinte ne concordait plus : c'est la protection
des corrections qui a joué, comme prévu).

*Leçon : le gabarit des tableaux fait bien son travail sur les chiffres ; une reforge écrase
quand même une relecture. F4 contrôle les chiffres, pas la prose.*

## Livré le 06/11 — F4, le livre vérifie la fiche

David : *« ok c'est bon commit et continue »*.

- **Où** : dans l'encart « Ce que le catalogue et le bestiaire liront » de la relecture, **sans
  bouton** — la lecture part seule dès qu'une fiche porte un tableau lu par le catalogue ou le
  bestiaire et que le livre a un PDF dans le registre.
- **Comment** : `forge/rules/verificationAuLivre.ts` (pur) prend les lignes des tableaux que les
  lecteurs liront (mêmes règles de première colonne, exportées par eux), leurs valeurs chiffrées
  (dés, nombres, milliers recollés) hors des colonnes en prose et des prix par époque ; les pages
  sont celle du titre `(p. N)` et ses voisines, sinon la plage des sections résolues par l'index.
  Le processus principal lit ces pages (`livres:lire-pages`, chemin relu dans le registre, décalage
  appliqué). Une ligne est **retrouvée** quand son nom et toutes ses valeurs sont sur la même ligne
  de texte du livre ; **à confirmer** quand une valeur n'est lue qu'ailleurs dans les pages lues ;
  **introuvable** quand une valeur n'est sur aucune page, ou le nom absent (alerte).
- **Mesuré sur les vrais livres** :
  - COC, armes et protections : **43 sur 44 retrouvées**, 1 à confirmer (les grenades, que le livre
    imprime en liste sur plusieurs lignes). Une copie faussée (couteau à 1d8, marteau à 1d6+3) :
    les deux armes passent « à confirmer ». *Chercher dans toute la page les laissait passer : 1d8
    et 3 y figurent ailleurs — d'où la recherche sur la ligne du nom.*
  - COC, adversaires : 3 sur 4, le premier rôle à confirmer (sa ligne réunit DEF 15, p. 108, et la
    santé Pulp, p. 92).
  - Alien, quatre fiches d'équipement : surtout « à confirmer » (6 sur 28 armes retrouvées, 0 sur 6
    protections) — le livre a deux couches de texte et ses tableaux ne gardent pas leurs lignes ;
    jamais de « retrouvée » à tort.
- **Limite** : le contrôle est sûr pour un livre dont le texte garde les lignes de ses tableaux
  (COC) ; sur un livre à couches mêlées (Alien), il dit « à confirmer » et renvoie à la page par
  « Livre, p. N ». Il ne contrôle pas la prose.
- **Vérifié** : `verificationAuLivre.test.ts` (11, sur la vraie fiche de COC et le texte de sa page
  93), `VerificationAuLivre.test.tsx` (6), `cheminsDesLivres.test.ts` (+3) ; 1 012 essais (Forge,
  équipement, bestiaire, invites, livres, manuel), `tsc -b`, eslint.
- **À essayer par David** : reforger un sujet à tableaux de COC (les adversaires) et, à la
  relecture, lire la ligne « Le livre (p. …) : … », qui paraît après quelques secondes de lecture du
  NAS. **Ne pas publier** cette reforge : la fiche en place est la version reconstituée (tableau +
  texte relu) ; « Retour » suffit. Si elle était publiée, la version reconstituée partirait dans
  `rules-v1/` (elle est marquée corrigée), sans se perdre.
- **Reste** : l'essai de David.

## Livré le 06/11 — F3, un tableau par requête

David : *« termine F3 »* (le seuil n'a pas été tranché : réglage par défaut ci-dessous, à revoir sur
demande).

- **Le déroulé**, pour tout sujet d'équipement ou de créatures (`natureDuSujet`) :
  1. **l'en-tête** (`gabaritEnteteDesTableaux`) : métadonnées, règle, et la liste « ## Tableaux du
     livre » — un tableau Markdown « Tableau | Lignes » (le titre de la section, le nombre d'objets),
     ou « Créature | Section » ;
  2. **un lot par requête** (`gabaritDesTableaux`) : au plus **15 lignes annoncées** par lot (un
     petit sujet tient en une requête, un tableau plus grand ou sans compte part seul), **six
     créatures** par lot ; chaque lot au format exact des lecteurs, nombre de lignes rappelé ;
  3. la seconde moitié, inchangée.
- **Le brouillon porte l'avancement** : il part sur le disque après l'en-tête et après chaque lot,
  la liste comprise ; une forge relancée reprend au premier lot manquant (un tableau déclaré
  « Absent des sources » ne se redemande pas). La liste est retirée de la fiche assemblée.
- **Le contrôle des lignes** : l'écart entre annoncé et recopié va aux avertissements de la
  relecture (« Armes de contact : 10 ligne(s) annoncée(s), 8 recopiée(s). » ; créatures annoncées
  sans profil).
- **Le compteur** de forge dit « Recopie des tableaux du livre, un lot par requête : 2 reçu(s) sur
  5 ».
- **Repli** : un en-tête sans liste lisible retombe sur la requête unique de F2.
- **Le prix** : une requête de plus qu'avec F2 pour un petit sujet (en-tête + un lot + seconde
  moitié) ; le chapitre des armes de COC (5 tableaux, 44 lignes) ferait environ 1 + 4 + 1
  requêtes, selon les nombres que le carnet annonce.
- **Les invites** : 1 446 à 2 380 caractères, sous les 3 594 acceptés (essais ajoutés).
- **Vérifié** : `tableauxParRequete.test.ts` (12), `ForgeService.test.ts` (F3 nominal, écart,
  reprise, repli), longueurs (+4) ; 1 030 essais (Forge, équipement, bestiaire, invites, livres,
  manuel), `tsc -b`, eslint.
- **À essayer par David** : reforger les adversaires de COC (ou un sujet d'armes) et regarder le
  compteur, puis à la relecture les avertissements, le bilan et « Le livre (p. …) » ; ne pas
  publier les adversaires (la fiche en place est la version reconstituée).

## Refaites depuis le livre le 06/11 — la fiche des adversaires et le bestiaire de COC

David : *« refait la fiche des adversaires »*, puis, à la question de la méthode, « depuis le livre »
(les profils humains et les créatures compris).

- **`la-gestion-simplifiee-des-adversaires-par-roles-et-bandes-de-sbires.md`**, réécrite contre
  les p. 92 et 108-111 (tableaux lus en image) : le tableau des rôles tel qu'imprimé (première
  colonne `PNJ`, trois lignes — la « Bande de sbires » du carnet n'est pas une ligne du livre), les
  dix-huit capacités Pro / Expert, la santé variable, les groupes de PNJ. `empreinte` gardée : la
  fiche reste marquée corrigée, donc protégée d'une reforge.
- **`bestiaire-du-livre-de-base.md`**, neuve (p. 112-119) : six profils humains et neuf créatures
  en tableaux de profil `Créature` (TAI, caractéristiques, DEF, Init., échelle de santé avec la
  précision Pulp, armes, capacités, page), le tableau de référence des tailles et les vingt-six
  capacités spéciales. Deux bizarreries du livre recopiées et dites : le leader politique imprimé
  « second rôle » avec des valeurs de premier rôle ; le gamin des rues imprimé TAI 4.
- **« Remplir depuis le corpus » du bestiaire de COC** : 18 profils (3 rôles, 6 humains, 9
  créatures), aucune ligne illisible, aucun constat (`bestiaireDeCoc.test.ts`).
- **F4 amélioré au passage** : la colonne « Page » donne la page de la ligne (et n'est plus une
  valeur), un titre « (p. 117-119) » fait lire toutes ses pages, et un profil imprimé en bloc est
  lu jusqu'au nom suivant du même tableau (au plus 16 lignes de texte), seulement quand la ligne
  du nom ne porte pas ses valeurs. Sur le vrai livre : bestiaire 14 sur 15 retrouvés (l'officier
  de police est coupé entre deux pages), rôles 3 sur 3, armes 43 sur 44 ; une copie faussée (rat
  à DEF 17, crocodile à 1d12) est repérée (introuvable, à confirmer).
- **Vérifié** : 1 037 essais (Forge, équipement, bestiaire, invites, livres, manuel), `tsc -b`,
  eslint.
- **À essayer par David** : « Remplir depuis le corpus » dans la section Bestiaire du pilote de
  COC (18 profils).

## Audit du parcours de l'atelier — 06/11, le soir

Idées reprises d'ECC à la demande de David (*« ok pour ton ordre »*), sans l'installer : le skill
`.claude/skills/auditer-un-parcours/` (d'après `click-path-audit`), appliqué à l'atelier de règles ;
un crochet `rappel-apres-compaction.mjs` ; l'étape « qui d'autre lit ça ? » dans `finir-un-pilote`.

- **A — l'abandon relançait l'inventaire** : sur un jeu sans inventaire enregistré, « Abandonner »
  le premier inventaire le relançait aussitôt (liste vide, sans erreur : l'effet de découverte
  croyait l'atelier tout juste ouvert). Corrigé : après un abandon, l'inventaire attend le geste
  « Redemander ». Prouvé par un essai qui échouait avant (2 appels au carnet au lieu d'un).
- **B — « Actualiser » ne redemandait rien** (livre de base) : il relisait l'inventaire du disque.
  David : *« redemander l'inventaire »*. Le bouton redemande désormais au carnet, avec une
  confirmation quand une liste est déjà là ; le nouvel inventaire ne s'enregistre que par
  « Enregistrer l'inventaire ».
- **C — « Analyser » grisé sans dire pourquoi** quand aucun carnet n'est choisi : le message
  « Choisissez d'abord un carnet NotebookLM, dans le panneau de droite » s'affiche.
- **D — le carnet occupé se taisait** : les trois gestes qui le réservent (inventaire, fiche,
  personas) disent maintenant qu'il répond encore à la requête précédente.
- Vérifiés sans défaut : le « X » et « Recommencer » rendent le verrou ; une réponse tardive après
  un abandon est jetée.
- **Clés de traduction** : l'essai existait déjà (`src/locales/clesEmployees.test.ts`, deux langues,
  namespaces, replis tolérés) — je l'avais d'abord cru absent. Seul ajout : `clock.timerLabel`
  (« Minuteur » / « Timer »), employée avec un repli français.
- **Vérifié** : 1 253 essais (locales, Forge, Clock-OS), `tsc -b`, eslint ; gardes : `node --test
  .claude/hooks/gardes.test.mjs` (11).

## Cthulhu Hack — le 07/11 : la ligne de séparation, la colonne « Type »

David : *« j'ai essayé de forger les équipements de Cthulhu Hack et cela n'a pas fonctionné »* —
« Remplir depuis le corpus » disait « aucun tableau d'équipement lisible ». Puis *« fais les 4 »*.

- **La cause** : la forge (F3) avait rendu une bonne fiche, quatre tableaux et une cinquantaine
  d'objets, mais le carnet séparait l'en-tête par `|:- |` — un seul tiret, du Markdown valide.
  Les quatre lecteurs (catalogue, bestiaire, F4, liste de F3) exigeaient deux tirets.
  **Corrigé** : une règle unique, `forge/rules/tableauMarkdown.ts`, stricte sur la forme (une
  ligne qui commence par « -2 » n'est pas une séparation). Sur tout le corpus, seule cette fiche
  gagne des tableaux ; aucun n'est perdu.
- **La colonne « Type »** : dans un tableau d'« Objet » générique, elle donne la famille et la
  catégorie de chaque ligne (« Arme à distance » → arme, « Protection » → protection ; un type qui
  ne nomme aucune famille garde celle du tableau). Le revolver n'est plus du matériel.
- **Les gabarits F2 et F3** : un tableau qui ne liste pas des objets (une échelle, un couvert, une
  règle) garde la première colonne que le livre lui donne — il n'est plus versé au catalogue.
  Invites de 1 577 à 3 169 caractères.
- **La fiche relue contre le livre** (v1v3, + 1, `relu: true`, empreinte gardée) : tableaux
  conformes ; le revolver est imprimé « d3 » (hors de l'échelle d4-d12, la v1v2 du carnet
  donnait d6 : recopié tel quel et signalé), « strictement », les premières colonnes « Niveau de
  dé » et « Couvert », les pages des tableaux. Catalogue : **57 objets** (19 armes, 33 matériels,
  5 protections), aucune ligne illisible ; F4 sur le vrai livre : 55 lignes sur 58 retrouvées,
  3 à confirmer (noms imprimés sur trois lignes), aucune introuvable.
- **Vérifié** : `tableauMarkdown.test.ts` (2), `depuisLeCorpus.test.ts` (+3, Cthulhu Hack) ; 1 062
  essais (Forge, équipement, bestiaire, invites, locales, livres, manuel), `tsc -b`, eslint.
- **À essayer par David** : « Remplir depuis le corpus » dans la section Équipement du pilote de
  Cthulhu Hack (57 objets).
- **Essayé par David, le même jour** : *« ce n'est pas très lisible »* — la famille Protection
  cumulait sept colonnes (celles de la liste du matériel et du tableau des armures), et les lignes
  ne s'alignaient pas. Corrigé :
  - la fiche : le tableau des armures (p. 52) reprend les noms de la liste (p. 38) et nomme sa
    colonne « Dé de Matériel » (appariement au sens, dit dans la fiche) — 3 protections au lieu de
    5, 55 objets en tout ;
  - le lecteur : « Particularités » va à la description, comme « Spécial » ; dans un tableau qui
    mêle les familles, chacune ne reçoit que les colonnes qu'elle remplit (plus de « Portée » chez
    les armures) ;
  - l'écran (`EditeurDuCatalogue.tsx`) : des largeurs bornées, communes à l'en-tête et aux lignes
    (`max-content` faisait calculer à chaque ligne ses propres colonnes), le texte long coupé avec
    « … » et lisible au survol, les titres de colonne qui passent à la ligne.
  - Les objets déjà versés gardent leurs colonnes : vider la famille, ou retirer les colonnes en
    trop, avant de remplir à nouveau.

## L'ordre recommandé

F1, puis F5, puis F2, puis F4, puis F3. F1 et F5 se font sans toucher aux invites et servent tout de
suite ; F2 change les fiches forgées ; F4 s'appuie sur le registre des livres ; F3 est la plus
lourde et ne vaut que si F2 bute sur la longueur.

## Décisions de David — 06/11/2026

*« 1. tu rajoutes une colonne par époque 2. On l'accepte avec alerte 3. tu attends le moteur pour
le tester »* :

1. **Les prix selon l'époque vont au catalogue**, une colonne par époque (`Prix 2025` … `Prix 1865`),
   remplie quand le nom de l'arme concorde ; un appariement fait au sens est dit dans la fiche. Fait
   pour COC le 06/11. F2 demandera la même chose à la Forge : un tableau de prix rapporté aux objets
   du chapitre des caractéristiques, pas un tableau à part.
2. **Une fiche d'équipement forgée sans tableau est publiée, avec l'alerte** (F1) : elle n'est pas
   refusée. L'alerte dit ce que le lecteur attend.
3. **Le bestiaire de COC attend le moteur** : il n'est pas transcrit à la main ; c'est sur lui que F2
   (et F1) seront essayés.
