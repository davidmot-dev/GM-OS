# État et reprise — le 2026-10-04, **le manuel illustré, cinq défauts, et le plan des tablettes**

> Branche `feature/tablet-hub-pwa`, **poussée jusqu'au commit qui range ce document**, pré-push
> local réussi (types, lint, 6 755 tests, build). Copie de travail propre.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md) — pour les tablettes, § 123 ;
> pour la refonte du poste du meneur, § 76.
>
> Il prend la suite de [`2026-09-28-etat-et-reprise.md`](./2026-09-28-etat-et-reprise.md). Entre
> les deux, les phases 1 à 6 de la refonte : leur état est au § 76, pas ici.

---

## Ce que la soirée du 03/10 et la nuit du 04/10 ont produit

| Livré | Où |
| --- | --- |
| **Le manuel relu et illustré** — 61 captures réelles, toutes tirées de la campagne fictive « Le Silence de Varn » ; régénérables en 2 min 30 | `257c5408` — `e2e/capturesDuManuel.spec.ts`, `documentation/User Guides/captures/`, l'index (00) dit comment |
| **Deux confusions de nom tranchées dans les guides** : deux « Oracle » (Cortex IA = le corpus ; le bouton Oracle de Session-OS = un carnet NotebookLM) et deux « Cortex » (Cortex IA ≠ le Cortex tactique) | guides 02, 10, 80 à 85 |
| **Cinq défauts trouvés en écrivant le manuel, corrigés** : le bandeau du Cortex devant les fenêtres (et Échap), les thèmes livrés non traduits sur la télécommande, l'export du tableau blanc, le livre de règles qui ouvrait Dune pour une campagne sans jeu, « Bonjour David » écrit en dur | `93db0321` — 6 essais nouveaux |
| **Le plan de la refonte des tablettes**, les cinq décisions de David prises | [`2026-10-04-refonte-tablettes.md`](./2026-10-04-refonte-tablettes.md), registre § 123 |

*Une fois de plus, écrire ce qu'un module fait a été le meilleur détecteur de défauts* (la revue des
guides de septembre l'avait déjà montré : les trois quarts des trouvailles étaient dans le code).

---

## Par quoi reprendre

1. **La refonte des tablettes, phase T0** — l'inventaire des écrans de la tablette des joueurs
   (accueil, six onglets, fiche, jets, notifications, messagerie), les captures de référence aux
   trois tailles (390 × 844, 820 × 1 180, 1 180 × 820), **un e2e par onglet avant de toucher quoi que
   ce soit**. T0 ne modifie pas `src/`. Le plan : § 5 de `2026-10-04-refonte-tablettes.md`.
2. **À éprouver en séance** (rien de cela n'a été vu sur le vrai matériel) : Échap sur le bandeau du
   Cortex quand une scène de Light-OS joue (le premier appui arrête la lumière, le second ferme le
   bandeau) ; le livre de règles d'une campagne sans jeu ; l'export du tableau blanc pendant une
   séance lancée depuis le cockpit.
3. **Le graphe de la Trame en cartes** (registre § 124, garé) — rapprocher le graphe de la
   maquette Stitch, avec React Flow pour la Trame seule. **Attend deux décisions de David** :
   l'accord pour installer le paquet, et la place du chantier, avant ou après les tablettes.
4. **Les bannières de Dune, d'Alien et de Rêve de Dragon** — les prompts sont prêts dans
   [`2026-10-04-prompts-bannieres.md`](./2026-10-04-prompts-bannieres.md) (avec le prompt générique
   et les valeurs de Cthulhu Hack et Blade Runner). David génère les images, les dépose dans le
   dossier du jeu (`docs/systems/<jeu>/`) et les choisit dans l'éditeur du pilote. Rien à coder.
5. **Repris du 28/09, rien n'a bougé** : §§ 87, 106 à 110, 114 du registre.

---

## Ce qu'il ne faut pas repayer

### ⭐⭐ Un push qui « ne répond plus » valide

Le hook `scripts/hooks/pre-push` lance **toute** la validation (`npm run validate` : types, lint,
tests, build) — quatre à cinq minutes. Je l'ai cru figé, j'ai tué ses processus, puis je l'ai
relancé sous `timeout 240` : **la validation a réussi et le délai a coupé l'envoi juste après.**
Lancer `git push` **en arrière-plan, sans délai**, et attendre la ligne « Pre-push réussi. Envoi en
cours… ». Et ne rien éditer dans `src/` pendant ce temps : la validation teste la copie de travail.

### ⭐ La campagne de démonstration se modifie à la main

`e2e/donnees/campagne-de-demo.json` a été produit par un script de passage, qui n'est pas dans le
dépôt. **Le JSON fait foi** ; il suit les types de l'application (`Clue` : `title`, `content`,
`isRevealed` ; `TimelineEvent` : une date *dans le monde*, un `type` ; une séance date en
`AAAA-MM-JJ`) — la campagne d'essai `campagne-temoin.json`, elle, garde sa forme courte, que ses
tests lisent. Le coffre Obsidian de démo est `e2e/donnees/coffre-de-demo/`.

### ⭐ Une capture de tablette demande le jeton d'appairage

Ouverte sans `#token=…`, la télécommande reste en « Reconnexion », rétrogradée en écran de joueur.
L'essai lit le secret par `appBridge.pairing.getSecret()` et ouvre l'adresse du pupitre de l'écran
du bas. Et un jet projeté juste avant s'affiche aussi sur la tablette : attendre qu'il s'efface.

### ⭐ Ce que les captures ont montré et que les tests ne voyaient pas

Les noms de thèmes en clé i18n brute sur la tablette, Dune dans le livre d'une campagne générique,
les dates ISO dans la préparation, les sorties audio réelles de la machine non floutées dans
Sound-OS. *Une planche contact de soixante captures se relit en cinq minutes, et elle trouve ce
que six mille tests ne cherchent pas.*
