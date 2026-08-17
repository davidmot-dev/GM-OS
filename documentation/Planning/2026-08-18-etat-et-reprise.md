# État et reprise — la trame se joue, le journal produit enfin quelque chose

**Date :** 2026-08-17, du matin au soir
**Branche :** `feature/tablet-hub-pwa` — 19 commits, `bde5803..b76911d`, tout poussé
**Tests :** 1 590 au vert, `tsc` propre, aucune erreur ESLint ajoutée
**Documents liés :** `2026-08-17-etat-et-reprise.md` (l'état du matin, dont deux lignes ont été
corrigées) · `2026-08-08-trame-narrative-cycle-seance.md` (**le plan de référence du journal**, 393
lignes, § 4.1 et § 8 en particulier)

**À quoi sert ce document.** Reprendre sans relire dix-neuf commits. Il dit le geste exact pour
continuer, ce qui tourne, ce qui n'a jamais été vu tourner, et ce qu'on ne rouvre pas.

---

## 1. Le geste pour reprendre

**Relancer les groupes `lieux` et `relations` de la Forge de trame sur « Les Anges de Feu ».**

Ce sont les deux qui ont échoué hier, et les deux causes sont corrigées depuis. C'est donc **le seul
contrôle qui vaille** : il valide d'un coup le plafond de génération réglable et le nouveau diagnostic.

| Ce qui a échoué | Pourquoi | Corrigé par |
| --- | --- | --- |
| `lieux` | vraie troncature — 8 091 caractères, coupé par `num_predict: 2048` | `086def5`, la Forge de campagne demande 4096 |
| `relations` | **pas une troncature** : le modèle a bouclé sur le caractère `1` | `086def5`, la boucle se nomme désormais |

Rien ne s'écrase : **reforger conserve** tout objet dont le nom existe déjà. Les 28 PNJ écrits hier
resteront, et les nouveaux renvois pointeront vers eux.

**Et si `relations` reboucle** : relancer suffit souvent, l'invite n'étant pas identique d'une passe à
l'autre. Si ça se répète, la piste écartée hier redevient la bonne — desserrer très légèrement
l'échantillonnage (`top_k: 5`, `temperature: 0.1`), ce qu'on n'a pas fait faute de mesure.

---

## 2. Ce qui tourne, et qui n'existait pas hier matin

### 2.1 La trame se joue — le parcours réel

Le constat déclencheur, vérifié : **aucun écran de jeu ne montrait la trame**. On déclarait son acte et
ses scènes en préparation, on lançait la séance, et `PanneauDeTrameDeSeance` n'était monté que dans
l'écran de préparation. *Le plan existait, on le perdait de vue au moment de jouer.*

- **Deux champs, quatre états dérivés** — `Scene.passages[]` et `termineeLe` donnent *prévue*, *en
  cours*, *en pause*, *terminée*. Aucun champ ne stocke l'état.
- **`Scene.personnagesIds`** — sans lui, deux scènes ouvertes ne disent pas **qui est où**.
- **Trois surfaces** : le panneau vivant dans l'espace de séance, la trace hélicoptère dans le rail du
  cockpit, et les mêmes gestes dans l'onglet Trame.
- **La fiche se déplie sur place** — résumé, présents, lieu, PNJ, notes éditables, et l'ambiance à
  lancer. En pleine partie, on ne quitte pas l'écran pour noter trois mots.

### 2.2 Le combat appartient à une scène, et se gare

Sans rattachement, un combat n'entre dans aucun résumé. Au premier combattant posé sur un plateau vide —
*il n'existe aucun autre signal de début de combat dans ce store* : une scène en cours, on s'y rattache et
ses PJ entrent ; plusieurs, **le bandeau demande** ; aucune, la scène improvisée.

Et **les combats se garent** au lieu de se superposer : le plateau part sous sa scène avec son tour, son
round **et la carte avec la position de chaque token**.

### 2.3 Le journal produit enfin quelque chose

Module que David n'avait **jamais utilisé**, le trouvant incomplet. Il l'était, et pour cinq raisons —
toutes traitées sauf la dernière.

- Le résumé ne gérait **que Gemini** et rendait sa phrase d'excuse **comme un succès**. Il passe par
  `generateText` (cinq fournisseurs) et **lève** en cas de panne.
- Il était stocké **comme un événement**, donc régénérer lui réinjectait le résumé précédent. Il vit sur
  `Journal.resumeIA`.
- L'axe **`trace` / `chronique`** filtre ce qui part au modèle : il recevait les tirages d'initiative.
- **La séance ne clôturait pas son journal** — `stopJournal` n'était appelé qu'au changement de campagne,
  et personne ne lui passait d'instantané : toute sa capture d'état de fin n'avait **jamais tourné**.
- **Le compte rendu en trois sections** existe, avec son écran et son bouton Copier. Seule la première
  appelle Ollama ; l'état des lieux et ce qui attend se calculent.

### 2.4 Le reste

- **Avantage / Désavantage** au panneau de jet, sens-conscient — sur une Sauvegarde, le meilleur dé est
  le plus bas. Et le mode manuel de la tablette recevait `over` sur **cinq modes** : un joueur y gardait
  le pire dé.
- **La santé suit la fiche** quand le pilote dit où la lire, et la case « max » cesse d'être saisissable.
- **La langue de forge se déclare** par corpus (`corpus.json`) et par campagne (sélecteur). La consigne
  protège explicitement identifiants, énumérations et **noms propres**.
- **La galerie de PNJ** : une sélection fantôme la rendait inatteignable, et l'éditeur bridait ses
  sections de données à 896 px.

---

## 3. Ce qui n'a JAMAIS été vu tourner

**C'est le point le plus important de ce document.** Les tests couvrent les modèles et la logique pure ;
ils ne disent rien du rendu ni du comportement réel.

- la trame en séance — ouvrir, terminer, deux scènes en parallèle, la scène improvisée ;
- la bascule de combat entre deux scènes, **et le retour des tokens à leur place** ;
- l'aller-retour d'image d'une ambiance ;
- le sélecteur de tirage, et le sens du dé retenu ;
- le compte rendu de séance — il faut une séance close pour qu'il ait sa matière ;
- **la consigne de langue** : on sait qu'elle part et où elle se place, pas que le modèle l'applique.

*Neuf jours ont suffi au défaut du résumé pour survivre, faute de témoin.*

---

## 4. Décisions prises, à ne pas rouvrir

- **Une liste de passages, pas deux dates** — sinon le journal perd ce qui s'est dit au premier passage.
- **Une séance qui s'arrête SUSPEND ses scènes**, elle ne les termine pas.
- **Achever un acte termine toutes ses scènes**, jouées ou non — et la cascade s'annonce avant.
- **Cloner n'est pas rouvrir**, et le clone est numéroté : la Forge résout par nom, un ex æquo ne résout
  rien.
- **L'ambiance se lance à la main.** Le moment est une parenthèse : son image revient à l'arrêt.
- **Un meneur ne joue pas deux combats à la fois, il alterne** — on gare, on ne multiplie pas.
- **Le résumé de combat reste mécanique**, jamais généré par l'IA (§ 5.2 du plan du 8 août).
- **Deux des trois sections du compte rendu ne demandent aucun modèle.**

---

## 5. La leçon de la journée

**Quatre pièces posées à l'avance, aucune branchée.** Le badge `improvisee` (déclaré le 2026-08-08, aucun
appelant ne passait la valeur), le parcours réel, `momentDeStoryboardId` (compté dans le taux de
préparation, déclenché par personne), et la capture de fin de séance. Plus deux fonctions de réparation
que rien n'appelle — `autoSelectFirstEntity`, en double.

*Une pièce posée à l'avance sans son appelant est une pièce qu'on croit branchée.* Et le facteur commun
de tout ce qu'on a trouvé dans le journal tient en une phrase de David : **« je n'ai jamais utilisé ce
module ».**

**Et deux défauts de ma main, qui valent comme méthode.** Un `as unknown as` sur un objet mal formé a
produit un écran blanc au démarrage — *un cast qui force n'est pas un raccourci, c'est une vérification
qu'on éteint, et elle s'éteint exactement là où on se trompe.* Puis le correctif n'a protégé que les
combattants suivants : *une garantie posée en écriture ne dit rien des données écrites avant elle.*

---

## 6. Restes connus, non traités

- **L'événement de décès** — deuxième correction de l'ordre de travail du 8 août : il n'est émis que si le
  meneur exporte le rapport de combat, et **jamais pour un PJ**.
- **Le rattachement des événements aux scènes** (§ 8, étape 3) — et la dette introduite hier : le
  `sceneId` du résumé de combat est dans `metadata`, alors que le § 9 exige un champ de premier ordre.
- **La revue de fin de séance scène par scène** — l'étape 1 de la curation, § 4.1.
- **Le réglage de langue d'un corpus n'a pas d'écran** : il s'édite à la main dans `corpus.json`.
- **`SessionService.saveFullSession` omet `entities` et `clues`** — signalé le 2026-08-16, toujours vrai.
- **Deux campagnes « secret de Milo »**, et le corpus de Cthulhu Hack porte un doublon exact.
