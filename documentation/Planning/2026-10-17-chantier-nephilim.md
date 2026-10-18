# Chantier Nephilim — les Sciences occultes et les Vécus

Ouvert le 2026-10-17. David : *« note comme chantier Nephilim, prendre en compte la Magie, la
Cabale et l'Alchimie. Voir comment gérer les vécu (fichier MD ?) »*, puis *« fais moi
l'analyse »*.

> « Cabale » est lu comme la **Kabbale**, la troisième Science occulte de Nephilim — à ne pas
> confondre avec la Cabale de NOC, la fiche de groupe. À confirmer avec David.

**Rien n'est codé.** Cette page dit ce qui existe, ce que disent les règles (carnet NotebookLM
« Nephilim », interrogé le 17/10, pages citées), ce que GM-OS sait déjà faire, ce qui demande du
code, et les décisions à prendre. Elle rejoindra le registre (§ ⭐) quand Codex y aura commité ses
changements du 17/10.

---

## 1 · Ce qui existe déjà (commit `ce6263a9`)

- **Le jet** : (Vécu + Ka d'approche ± circonstances) × 10 sur un d100 ; réussite critique sur un
  double réussi, maladresse sur un double raté ou 00 ; marge sur les dizaines
  (`dice/systemes/nephilim.ts`). Le menu nomme les Vécus (`libelleSur`).
- **La fiche** (clés de la fiche HTML `nephilim-legende-fr`, points changés en « _ ») :
  - Magie : `occult_magic_path` (texte), `occult_magic_first`, `_second`, `_third` (+ nom) ;
  - Kabbale : `occult_kabbalah_world` (texte), sept Sephiroth nommées, trois du troisième cercle
    (+ noms) ;
  - Alchimie : `occult_alchemy_path` (texte), `occult_alchemy_black`, `_white`, `_red` (+ nom) ;
  - 24 effets magiques (`effects_N_name`, `_art`, `_summary`, `_page`), texte libre ;
  - Stase (`stasis_degree`), Sapience (`resources_sapience`), Chutes (`falls_*`).
- **Ce qui manque à la fiche** : le **Ka dominant**, les **Ka des constructs** alchimiques, les
  **jauges de Materiae Primae**. Ni la fiche HTML ni la fiche GM-OS ne les portent.
- **Ce qui ne se relie qu'aux scènes** : une note Obsidian (`Scene.noteObsidian`). Un personnage
  n'en a pas.

## 2 · Ce que disent les règles

| | Magie | Kabbale | Alchimie |
| :--- | :--- | :--- | :--- |
| **Cible** | (Art occulte du cercle + Ka de l'élément du sort − degré du sort) × 10 | (Art de la Sephirah + Ka de la créature) × 10 ; **pacte** : opposition, marge de l'invocateur contre le degré de la créature | (Art de l'Œuvre + Ka du **construct** − degré de la formule) × 10 ; Œuvre au blanc : le plus faible des deux Ka |
| **Dé** | d100 sous la cible | d100 sous la cible | d100 sous la cible |
| **Vécus** | ne s'ajoutent pas | — | — |
| **Préparation** | 1 round | 1 round par degré (2 sans pacte) ; −10 % par round gagné | transmutation au laboratoire, usage immédiat |
| **Coût** | aucun ; **Stase** facultative : +1 degré de Ka par point dépensé | aucun ; Stase facultative, idem | **Materiae Primae** = degré de la formule (d'un élément ; deux pour l'Œuvre au blanc) |
| **Échec** | — | pacte raté : dommages magiques = degré de la créature | — |
| **Maladresse** | **+1 Khaïba** ; au Grand Secret, effets plus lourds | invocation : pacte rompu ; pacte : bannissement du fief et **+1 Khaïba** | MP perdue, rien produit, **Ka du construct −1**, plus d'essai du scénario |
| **Pages** | Quintessence p. 176, 184 ; Grimoire 3ᵉ cercle p. 28–29 | Quintessence p. 124, 198 | Quintessence p. 214–220 ; Grimoire p. 107–115 |

**La Stase** (Quintessence p. 113, 160, 184) : plafond = **Ka dominant** ; ne se recharge que
dans un Plexus (+1 par jour) ou un Nexus (+5 par jour) ; vide, elle attire le Nephilim (test de
Ka quotidien). Lancer un sort ne vide **ni le Pentacle ni la Stase** : elle ne sert qu'au bonus.

**La Materiae Primae** (p. 218–219) : une jauge **par Ka-élément**, plafond = somme des Arts
d'Alchimie + Ka de l'élément ; pleine à chaque session ; se regagne par enquête, Sapience ou
récolte ; à défaut, 1 degré de Ka (Stase, Pentacle ou construct) remplace 1 degré de MP.

**Un Vécu passé** (p. 50, 114–123, 154–155) porte : un **nom** (« Condottiere italien »), un
**degré** (1 à 10), une **époque et un lieu**, un **Ka-élément** (+1 degré à la création s'il est
le dominant), et ses **Effets Mnémos permanents** — une phrase : un domaine de plus, ou « +2
degrés quand… ». Le joueur **raconte** pourquoi le Vécu s'applique, le meneur tranche ; plusieurs
Vécus complémentaires donnent **+1 degré chacun, +2 au plus**. Refusé, le joueur prend un autre
Vécu ou crée un Effet Mnémos (1 PS par degré). Progression : N → N+1 coûte N+1 PS jusqu'à 5, puis
la table de l'expérience ; un Vécu nouveau naît d'un Effet Mnémos permanent (5 PS + 1 par degré).

## 3 · Ce que GM-OS sait déjà faire — sans code

1. **Le jet d'un sort de Magie ou d'une invocation de Kabbale** : c'est la même cible × 10 que
   le Vécu. Il suffit que le menu « Vécu » propose aussi les **Arts occultes** — une section
   supplémentaire de la composante (`sectionsSupplementaires`), rangée en sous-groupe. Le Ka de
   l'élément du sort est l'« Approche » ; le **degré du sort se retire au curseur** des
   circonstances. Seule retouche : les champs texte des sciences (voie, monde) doivent sortir de
   cette section, pour ne pas apparaître dans le menu — un déplacement dans la fiche GM-OS, sans
   toucher aux clés ni à la correspondance.
2. **Le cumul de Vécus complémentaires** (+1 par Vécu, +2 au plus) : au curseur, comme les
   circonstances.
3. **La recharge de la Materiae Primae à chaque séance** : le geste « Début de séance » sait déjà
   remettre un champ à son plafond (`gestesDesHeros`, fait pour NOC) — **si** le plafond se lit
   sur la fiche, ce qui demande la question 4 ci-dessous.

## 4 · Ce qui demande du code

| # | Quoi | Pourquoi | Taille |
| :--- | :--- | :--- | :--- |
| A | **Les suites d'une maladresse** : +1 Khaïba (Magie, pacte de Kabbale), +1 Ombre (Vécu contemporain), −1 au Ka du construct (Alchimie) — selon la **section** du champ retenu au jet | GM-OS dit « maladresse » mais n'écrit rien ; le Blade Runner a déjà un modèle proche (`EtatBrise.noterDans`) | moyen |
| B | **Dépenser au jet** : la Stase (+1 degré de Ka par point) et la Sapience (Effet Mnémos : +2 degrés pour 1 PS, ou un Vécu temporaire à 1 PS par degré) | les réserves du personnage (`reservesDuPersonnage`) ajoutent des dés ou un bonus au **résultat**, jamais des **degrés à une cible** : il faut un effet `degres` | moyen |
| C | **Le plafond de la Stase au Ka dominant** | aucun champ ne dit quel Ka est dominant : un champ « Ka dominant », puis un plafond lu dessus | petit |
| D | **L'Alchimie complète** : Ka des cinq constructs, cinq jauges de MP, coût au jet, recharge par séance | la fiche HTML n'a aucun de ces champs : à ajouter par **Character Sheet HTML Studio** (même boucle que la fiche), puis à relier | grand |
| E | **Le pacte de Kabbale** en opposition | GM-OS ne compare pas deux marges ; à garder **à la main** au début | — |
| F | **Une bibliothèque d'effets magiques** (un sort décrit une fois : art, Ka, degré, résumé, page) | les 24 lignes de texte suffisent pour jouer ; à faire seulement si David s'en sert | grand |

## 5 · Les Vécus : où ranger ce que la fiche ne porte pas

Le **nom** et le **degré** restent sur la fiche : c'est ce que lit le jet, et la fiche fait foi.
Ce qui manque — l'époque, le Ka-élément, les Effets Mnémos permanents, l'histoire — tient en
quelques lignes par Vécu, seize Vécus par personnage. Trois rangements possibles :

| | Fichier Markdown dans `docs/campaigns/<campagne>/` | **Note Obsidian liée au personnage** | Zones de texte sur la fiche GM-OS |
| :--- | :--- | :--- | :--- |
| Écriture | éditeur de texte | **Obsidian, où David écrit déjà ses campagnes** | GM-OS |
| L'Oracle le lit | oui | **oui : le coffre Obsidian est déjà une racine de l'Oracle** | non |
| Secret des joueurs | ⚠ tout ce qui est dans `docs/` entre dans les réponses | idem, dans le coffre | sur la fiche, visible du joueur |
| Code | aucun | **un champ « note » sur le personnage**, comme `Scene.noteObsidian`, et un bouton pour l'ouvrir | seize zones de plus sur deux fiches |
| Risque | deux vérités si le degré y est recopié | idem | aucune |

**Recommandation : la note Obsidian liée au personnage**, une section par Vécu (nom, époque, Ka,
Effets Mnémos, souvenirs), **sans recopier les degrés** — la fiche les tient, une seconde copie
finirait par mentir. C'est le rangement qui coûte le moins de code, que David édite déjà, et que
l'Oracle lit déjà : il pourrait alors répondre « quel Vécu pour cette action ? ». Un **gabarit**
de note (une section par Vécu) se fournit une fois.

## 6 · Les décisions à prendre

1. « Cabale » = Kabbale ? (§ en-tête)
2. **Lot 1, sans code** : ajouter les Arts occultes au menu du jet (section supplémentaire) et
   ranger leurs champs texte à part — d'accord ?
3. **Les maladresses (A)** : Khaïba et Ombre écrits seuls, ou seulement annoncés ?
4. **Stase et Sapience au jet (B)** : les deux, ou la Stase seulement ?
5. **Le Ka dominant (C)** : un champ à ajouter aux deux fiches — par Character Sheet HTML Studio ?
6. **L'Alchimie (D)** : la faire en entier (fiche HTML à régénérer), ou attendre qu'un joueur soit
   alchimiste ?
7. **Les Vécus** : la note Obsidian liée au personnage, comme recommandé ?
8. **La bibliothèque d'effets (F)** : à garder pour plus tard ?

**Ordre proposé**, du plus petit au plus gros : lot 1 (sans code) → C → A → B → note Obsidian des
Vécus → D → F.

---

## 7 · Où on en est — le 17/10 au soir

> *Historique.* Les « non commité » ci-dessous sont **périmés** : tout le lot est commité et
> poussé (voir § 9).

- **Fiche HTML à 7 pages** (Magie, Kabbale ×2, Alchimie ×2) livrée par Character Sheet HTML Studio
  d'après la [consigne](2026-10-17-consigne-studio-nephilim.md) : **acceptée** (0 erreur), les 239
  anciennes clés intactes, 747 nouvelles ; intégrée au moteur (`BUILTIN_VERSION` 9) ;
  correspondance complétée (966 liens, 20 absents motivés, dont 15 copies calculées par la fiche).
  **Non commité.**
- **Pilote corrigé** (`Export Dirvers/corriges/Nephilim_driver_gmos_corrige.gmos-driver`) : fiche
  GM-OS de 234 à 966 champs, identité visuelle remise en deux champs, zéro constat de la Forge.
  **À réimporter par David**, puis vérifier qu'une valeur saisie en page 3 à 7 remonte.
- **L'éditeur d'identité visuelle** range seul un bloc « STYLE: … AVOID: … » collé ; une identité
  déjà enregistrée avec le bloc se lit rangée. Essais verts. **Non commité.**
- **La liste des Vécus — faite à 22 h 50** : **80 Vécus, 16 époques**, dans
  `docs/systems/nephilim/vecus/` (un Markdown par époque, lu en entier par l'Oracle, et
  `index.json`). **Quatre époques manquent**, absentes des sources du carnet : Salomon (p. 77),
  Syracuse (p. 79), Al-Andalus (p. 89), l'An Mil (p. 91) — à compléter depuis le livre
  ([marche à suivre](../../outils/nephilim-vecus/README.md)). Texte du carnet, **non relu contre le
  livre**.
- **Les Vécus sont reliés** (17/10, 23 h 30, éprouvé par David) : un champ de fiche désigne un
  **référentiel** du jeu (`SheetField.referentiel`, `logic/referentiels.ts`, `useReferentiel`) ;
  la fiche GM-OS propose les 80 noms, ⓘ ouvre détails et description, le panneau de jet rappelle le
  Vécu retenu. Pilote corrigé (16 champs reliés), réimporté. ⚠️ Une saisie dans la fiche GM-OS ne
  part vers la fiche HTML qu'**après « Sauvegarder »**. Le manuel attend que Codex ait commité ses
  pages.
- **Réimporté par David** : les valeurs se sauvent. L'Arbre de la page 4 et les Œuvres de la page 6
  ne se saisissent pas : ce sont des copies calculées de la page 2, en lecture seule. **Choix de
  David : on les laisse ainsi** (option A ; l'option B, inverser saisie et copies, est écartée).
  Dit au manuel, page 54-Jeu-Nephilim.
- **Rien n'est commité de ce lot.** Tout part ensemble après le réimport vérifié et la liste des
  Vécus relue.

## 8 · Ce qui reste — relevé le 17/10 à minuit

Fait depuis le § 7 : les **époques d'incarnation** (`vecus/epoques.json` et `epoques.md`, 20
époques), reliées aux huit champs « Incarnation » ; les **Vécus proposés selon les incarnations**
(`SheetField.referentielSelon`) ; la **sauvegarde proposée** en passant à la fiche du jeu.
Les échecs critiques sont **annoncés** depuis le § 1 (double réussi, double raté ou 00, marge).

**Le lien visible entre une époque et ses Vécus** (18/10) : sous chaque Vécu, une étiquette
« ↳ Incarnation 2 — La Chute de l'Atlantide · Ka-élément : Feu », ou, en alerte, l'époque absente
des incarnations ; sous chaque incarnation, « Vécus de cette incarnation : Héros (4) · Sage (2) »,
ou « Aucun Vécu de la fiche ne vient encore de cette époque ». La section « Incarnations » passe
avant « Les Vécus » (`outils/nephilim-vecus/ranger_incarnations.py`) — réimporté et éprouvé.

Reste, du plus petit au plus gros :

1. **Les Arts occultes au menu du jet** — sans code, une retouche du pilote (section
   supplémentaire de la composante ; le degré du sort au curseur).
2. **Les suites des échecs critiques** (lot A) : maladresse → +1 Khaïba (Magie, pacte de Kabbale),
   +1 Ombre (Vécu contemporain), −1 Ka du construct (Alchimie) ; critique magique → une Chute qui
   baisse contre de la Sapience.
3. **Stase et Sapience au jet** (lot B).
4. **Le Ka dominant** (lot C) : absent des deux fiches, même à 7 pages.
5. **L'Alchimie au jet** (lot D) : la fiche porte constructs et Materiae Primae ; rien ne débite ni
   ne recharge.
6. **À la main** : malus des Conséquences, seuils des Chutes, jeton de Traque des Sciences
   occultes, pacte de Kabbale.
7. Les **quatre époques** sans Vécus (pages 77, 79, 89, 91 à fournir) ; le **manuel** (quand Codex
   aura commité ses pages) ; la fiche GM-OS **sur tablette**, sans suggestions de Vécus.

## 9 · Reprise — le 18/10, 0 h 30

**Tout est commité et poussé** sur `feature/tablet-hub-pwa`, dernier commit `ed722368` (le lien
visible époque ↔ Vécus, éprouvé par David). Commits du chantier : `ac1feccf` (analyse),
`6be8ff1a` (fiche à 7 pages, liste des Vécus, bloc STYLE/AVOID), `80c3f825` (ateliers RPG, fiche
livrée), `15761d5e` (référentiels), `30dab1da` (époques, Vécus selon les incarnations, sauvegarde
proposée), `ed722368`.

**Le pilote installé chez David** est à jour : 17 sections, 966 champs, 16 Vécus et 8 époques
reliés, « Incarnations » avant « Les Vécus ». La boucle de correction d'un pilote : David exporte
(`Export Dirvers/NEPH_driver_gmos_….gmos-driver`) → script de `outils/nephilim-vecus/` → sortie
dans `Export Dirvers/corriges/` → contrôles de la Forge (0 constat attendu) → David réimporte
avec « Remplacer ». ⚠️ Toujours partir d'un **export frais** : le pilote vit dans les données de
David, pas dans le dépôt.

**Pas à moi, laissé hors des commits** : les pages du manuel 52, 53 et 54-* (Codex y écrit),
`docs/campaigns/la-nouvelle-ys/`, `docs/systems/nephilim/Nephilim Band.jpg`,
`outils/jdr-pdf-vers-md/`, `Export Dirvers/` (les pilotes de David, à ne pas commiter).

**Pour reprendre**, au choix de David — la liste du § 8, du plus petit au plus gros :

1. Les Arts occultes au menu du jet (sans code, retouche du pilote).
2. Les suites des échecs critiques (lot A).
3. Stase et Sapience au jet (lot B), le Ka dominant (lot C), l'Alchimie au jet (lot D).
4. Les quatre époques sans Vécus : David doit fournir les pages 77, 79, 89 et 91
   ([marche à suivre](../../outils/nephilim-vecus/README.md)).
5. **Le manuel** — `54-Jeu-Nephilim.md` et `53` : Vécus reliés, époques, lien visible, sauvegarde
   proposée, captures. **Attendre que Codex ait commité ses pages** (un seul écrivain par fichier).
   Le manuel de Torg attend pour la même raison.
6. La fiche GM-OS sur tablette, sans suggestions de Vécus.

Les mêmes propositions, numérotées N1 à N9, sont dans
[2026-10-17-reve-de-dragon-propositions.md](2026-10-17-reve-de-dragon-propositions.md).

## 10 · Le 18/10 au matin — les Arts au jet, les suites des critiques

David : *« on commence par 1 et 2 »*. Les deux sont faits, **non commités, pilote à réimporter**.

1. **Les Arts occultes au menu du jet** (pilote seul, `outils/nephilim-vecus/sections_des_arts.py`) :
   « Sciences occultes » devient quatre sections — les voies (texte, hors du menu) et
   `arts_magie`, `arts_kabbale`, `arts_alchimie`. La composante s'appelle « Vécu ou Art occulte »
   et les lit en `sectionsSupplementaires` ; les noms (3ᵉ cercle, Sephiroth du 3ᵉ cercle, Œuvre au
   rouge) nomment leur degré par `libelleSur` — un Art du 3ᵉ cercle **sans nom saisi** n'apparaît
   donc pas au menu, comme un Vécu vide. Le Ka de l'élément est l'« Approche », le degré du sort se
   retire au curseur (−10 à +7).
2. **Les suites des critiques** (lot A) : `jet.suitesDesCritiques` (`dice/suitesDesCritiques.ts`),
   un bouton au panneau de jet — **proposé, jamais écrit seul** (choix de David). Pilote :
   maladresse de Magie, de Kabbale, d'Alchimie → +1 Khaïba ; maladresse du Vécu contemporain →
   +1 Ombre ; critique en Science occulte → +1 Sapience. Contrôlé par la Forge, consigné dans sa
   consigne. ⚠️ Le corpus met +1 Khaïba sur **toute** maladresse d'Art occulte, Alchimie comprise ;
   le tableau du § 2 (Quintessence p. 214–220) ne le dit pas pour l'Alchimie : **à vérifier au
   livre**. Le Ka du construct −1 reste à la main (le jet ne sait pas quel construct).

Pilote : export frais du 18/10 9 h 08 → les deux scripts → `Export Dirvers/corriges/`, zéro
constat. Essais : `suitesDesCritiques.test.ts`, `PanneauDeJet.nephilim.test.tsx` ; `tsc -b` propre.

## 11 · Les « quatre époques manquantes » n'existent pas — le livre en a 31

18/10, 9 h 30. Le texte brut du Livre 0 se lit hors du carnet : `nlm source content
9d0f5460-56b1-47a8-bb1e-9c40ee5ef55b` (lecture seule, ~1 Mo). Ce qu'il montre :

- **31 blocs d'incarnation** (« Les quêtes ésotériques : … », puis « Feu Air Eau Lune Terre » et
  les cinq Vécus dans cet ordre de Ka). Les **titres d'époque sont des images** : absents du texte.
- Les **16 époques indexées** correspondent chacune exactement à un bloc, et leurs 80 Ka-éléments
  sont justes (0 écart).
- « Syracuse » et « Al-Andalus » n'apparaissent **nulle part** dans le livre ; « Salomon » et
  « An Mil » seulement en passant. Le catalogue des 20 époques (`catalogue-des-epoques.json`,
  `vecus/epoques.json`, pages 61 à 99 de deux en deux) vient du carnet et **en invente quatre**.
- **15 blocs ne sont pas indexés** (n° dans l'ordre du livre) : 3 Hyperborée (Chasseur…), 5
  Hénoch-Nod-Damas-Jéricho (Métallurgiste…), 8 Inde (Kashtriya…), 9 Cnossos (Gouverneur…), 11
  Mycènes-Troie (Guerrier achéen…), 14 Alexandre (Prêtresse orientale du soleil…), 19
  Byzance-Jérusalem (Chevalier arabe…), 20 Cathares (Inquisiteur…), 21 Chute du Temple (Routier…),
  23 Ottomans (Bourreau…), 27 Munich-Vienne (Artiste…), 28 Paris-Berlin-New York (Aventurier
  casse-cou…), 29 Seconde Guerre (Résistante…), 30 l'Éveil (Publicitaire…), 31 aujourd'hui
  (Policière…).

**Fait le 18/10 vers 10 h** depuis le PDF du livre (chez David, `Z:\Jeux de Rôle\…\Nephilim 5\`) :
les titres sont bien dans le texte du PDF, page par page. `extraire_du_livre.py` →
`ecrire_vecus.py` : **31 époques, 155 Vécus**, avec l'errata officiel V1.3 (Aristocrate rentière
p. 94 ; Feu et Air intervertis entre L'Éveil et Les Chroniques de l'Apocalypse, p. 97–98). Le
**Druide** (p. 70) reprend par erreur, dans le livre, la description du Chasseur (p. 68) : signalé,
pas inventé. Quatre époques renommées (voir le README des outils) : une incarnation saisie sous
l'ancien nom est à choisir de nouveau. L'errata corrige aussi la Kabbale (p. 198) : une maladresse
d'invocation donne **+1 Khaïba** — le rappel du pilote est corrigé (`Export Dirvers/corriges/`,
repartant de l'export de 9 h 38, zéro constat).

## 12 · L'errata V1.3 reporté dans les règles — 18/10, fin de matinée

David : *« corriges les règles dans les "rules" »*. Treize fiches de `docs/systems/nephilim/rules/`
corrigées, chaque correction citant « errata V1.3 » et sa page ; la source ajoutée à l'en-tête,
l'empreinte du corps laissée telle quelle (la fiche se reconnaît éditée : une reforge ne l'écrase
pas). Une fiche nouvelle, `errata-quintessence-v1-3.md`, reprend tout l'errata (création et PI,
Vécus, stase, Traque, Sciences occultes, monde). Ce qui change à la table :

- **Khaïba : un degré**, pas « un à trois » (invention du carnet) ; premier degré de Nanisme ou de
  Gigantisme en Magie (p. 183), de forme élémentaire en Kabbale, éthérale en Alchimie. Le doute du
  § 10 sur l'Alchimie est levé : **+1 Khaïba** (errata p. 220). Rappels du pilote mis à jour.
- **La Traque monte à l'aube**, pas dès que le palier est plein (p. 146) ; Khaïba et Narcose > 4
  et métamorphe visible comptent pour le Seuil RK.
- **Stase** : pleine en la quittant (Ka dominant), rechargée d'un degré **par jour** en Plexus ou en
  Nexus — le « Nexus +5 par jour » du § 2 est faux (p. 160). Le Nexus donne +3 aux Ka-éléments.
- **Pacte de Kabbale** en opposition contre le degré de l'invocation ; arbre de Kabbale corrigé.

Garde : le groupe d'invite « Dés et composition du jet » de la Forge dépassait son budget de 250
caractères — doublon retiré de `resolution-des-jets.md`.

**Manuel** (Codex a fini, feu vert de David) : la ligne `suitesDesCritiques` au manuel 53, et
`54-Jeu-Nephilim.md` réécrite — menu « Vécu ou Art occulte », suites des critiques, 31 époques et
155 Vécus reliés, sauvegarde proposée, errata. **Captures non refaites** (le menu des Arts et la
carte des suites n'en ont pas). Suite complète : **8 098 essais verts** ; `tsc -b` propre.

**Écart ouvert** : la Jauge de Traque du pilote déborde **aussitôt** (`debordement` vers
l'Intensité) ; l'errata (p. 146) fait monter l'Intensité **à l'aube**. Dit au manuel ; à trancher
par David.
