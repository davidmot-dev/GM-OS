# État et reprise — le 2026-09-28, **le deuxième tour de Stitch : toute l'interface du meneur**

> **Base inchangée depuis le 27/09.** Aucun fichier de `src/` ni d'`electron/` n'a bougé : le
> travail est dans `e2e/vitrine.spec.ts` et `documentation/Planning/`. `tsc -b` et les essais
> Vitest n'ont pas été relancés — rien de ce qu'ils couvrent n'a changé ; la vitrine du deuxième
> tour passe (`1 passed`, 65 captures).
>
> Branche `feature/tablet-hub-pwa`, **poussée jusqu'à `a5b66855`**, pré-push local réussi ;
> **copie de travail propre**. *(Le guide `01-Prise-en-main.md` paraissait modifié : son contenu
> était identique au dépôt, seules ses fins de ligne différaient du réglage `core.autocrlf` —
> rien à commiter.)* La mise à jour de ce document et du § 76 est à commiter.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md) — pour la refonte, § 76.
>
> Il prend la suite de [`2026-09-27-etat-et-reprise.md`](./2026-09-27-etat-et-reprise.md).

---

## Ce que la journée a produit

**La décision de David, 2026-09-27** : *« ce n'est pas parce que je n'ai pas eu de vraie plainte
qu'il ne faut pas en profiter pour revoir un peu le design, surtout si on veut une cohérence dans
l'ensemble de l'application »*. Le premier tour n'avait montré à Stitch que neuf écrans du noyau —
et **Image-OS, pourtant dans le noyau, n'avait eu aucun prompt**.

| Livré | Où |
| --- | --- |
| **La vitrine, deuxième tour** — 65 captures en quatre minutes, dans une instance jetable semée par une sauvegarde désignée (`GMOS_VITRINE=2`, `GMOS_VITRINE_SEMENCE`) | `e2e/vitrine.spec.ts` |
| **Les prompts 10 à 17**, puis un prompt par écran, écrit depuis le code | [`2026-09-27-prompts-stitch-tour-2.md`](./2026-09-27-prompts-stitch-tour-2.md) |
| **Huit lots retenus, une soixantaine d'écrans** : Image-OS, le son, les PNJ, les outils de séance, le poste du meneur, les surcouches (et leur **cadre commun**), la préparation, l'outillage | [`stitch/`](./stitch/README.md) — un dossier par lot, ce qu'on garde et ce qui reste à régler, écran par écran ; bilan en fin |

Les réponses aux notes de David les plus nettes : la fiche de PNJ suit le système de jeu (plus de
bloc Vitalité / CA / Vitesse) ; le calcul des dégâts rend son calcul visible (« 12 → 2 PV —
résistant : moitié ») ; « MJ Focus » devient « Préparer la séance n°1 » ; la bibliothèque des
campagnes réserve toujours la place de l'image et du synopsis ; la médiathèque distingue les types
et montre les tags ; l'atelier du thème montre où chaque réglage se voit.

**Pas couverts** : quatre écrans jamais capturés (centre de notifications, loupe de lecture,
ressources de table, écran volant des effets de Light-OS) ; la section 7 (Player Hub, tablettes),
hors refonte.

---

## Par quoi reprendre

1. **P1.2** du [plan de la phase 1](./2026-09-27-refonte-phase-1.md), **à pixel constant**. Avant de
   coder : *« GM-OS tourne-t-il ? »*. Rien du deuxième tour ne change l'écran avant la **phase 4**.
2. ✅ **Idées de Stitch tranchées par David le 2026-09-29** : les douze sont dans le tableau
   « Les idées tranchées », à la fin de `stitch/README.md`. Onze sont retenues ; pour l'Oracle, on
   garde les deux modes. Rien ne change l'écran avant la phase 4.
3. **Deux défauts garés** dans le registre, trouvés par la vitrine : les vignettes d'Image-OS vides
   après une restauration ; le Markdown brut et l'emoji cassé (`âš”ï¸`) des chroniques.
4. **Repris du 27/09, rien n'a bougé** : les deux références de RPG Theme Builder remises dans
   ChatGPT ? ; les deux lectures souples du cahier ; §§ 87, 106 à 110, 114.

---

## Ce qu'il ne faut pas repayer

### ⭐⭐ Un écran par conversation, un prompt écrit depuis le code

Le prompt 13 groupait cinq fenêtres : Stitch en a fait des pages, a inventé un moteur de combat
(armure, localisation, critiques D66), et **au second passage, dans la même conversation, a
recopié mot pour mot ses inventions**. Repris un écran par nouvelle conversation, avec un prompt
court qui dit ce que l'écran contient vraiment et finit par « C'est TOUT. N'ajoute rien », les cinq
sont sortis justes du premier coup. Un correctif dans la même conversation ne marche que s'il porte
sur **la forme** (le cadre de la fin de séance).

### ⭐ La réponse à une note existait parfois déjà, ailleurs

« Il manque la possibilité de préciser des paramètres » : ils existaient, dans la Forge. « Il
manque une image de fond et un synopsis » : les deux champs existaient dans la campagne. *Lire le
code avant d'écrire le prompt* — sinon Stitch invente une seconde version de ce qui existe.

### ⭐ Toujours rendre soi-même l'export de Stitch

Deux défauts en une soirée, tous deux silencieux : une **accolade manquante** dans
`tailwind.config` (écran sans aucun style, **même son `screen.png`** — David l'a jugé raté pour
cette raison) ; des **graisses de police impossibles** (`Space Mono 100..900` : tout l'écran en
police à empattement). Les copies rangées dans `stitch/` sont réparées ; le script de rendu répare
les deux avant de juger.

### ⛔ Une capture qui existe n'est pas le bon écran

Cinq passages de la vitrine ont capturé le cockpit sous d'autres noms : **une séance `active` dans
n'importe quelle campagne** met le moment à « partie » (`momentDeJeu`), et `useLayoutManager`
renvoie toute vue de préparation au cockpit, régime forcé ou pas. Vérifier par planches contact,
jamais par la liste des fichiers produits.

### ⛔ La rotation des sauvegardes et une question avant tout diagnostic

Les sauvegardes récentes n'avaient plus de journal : j'ai d'abord demandé à David de mettre à l'abri
celle du 22/09 (la seule qui en portait un), puis *s'il les avait supprimés lui-même* — oui. Le
premier geste d'un doute sur des données est une copie ; la seconde, une question.

### ⚠️ Pour moi : `cd` dans une commande de fond

Un `npx playwright test` lancé en arrière-plan est parti de `documentation/Planning`, où le shell
était resté : « No tests found ». Toujours `Set-Location` vers la racine dans la commande elle-même.
