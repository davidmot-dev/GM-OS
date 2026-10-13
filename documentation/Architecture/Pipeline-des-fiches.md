# Pipeline des fiches de personnage — les spécificités du chantier

**Version 1 — 2026-09-26.** La boucle de travail est commune aux deux constructeurs :
[`Flux-des-constructeurs.md`](./Flux-des-constructeurs.md). Cette page dit **ce qui est propre
aux fiches**. Le chantier est **indépendant des thèmes** : une fiche ne lit jamais `theme.css`.

✅ **Le cahier des charges est écrit le 2026-10-13** :
[`Cahier-des-charges-fiche-de-personnage.md`](./Cahier-des-charges-fiche-de-personnage.md), avec
son validateur, `npm run fiche:valider -- <Jeu>`. Le § 3 ci-dessous garde les questions qu'il a
tranchées, et comment.

---

## 1 · Le constructeur

**Character Sheet HTML Studio**, dans ChatGPT. Source versionnée dans
[`outils/rpg-sheet-builder/`](../../outils/rpg-sheet-builder/) (v0.2.1).

À partir du PDF d'une fiche, il produit un **HTML autonome qui reproduit la fiche à l'identique** :
chaque page rendue en image de fond, des champs transparents posés exactement sur les cases
imprimées, avec zoom, export et import JSON, impression, et fonctionnement hors ligne. Ses modèles
de qualité : les couples PDF + HTML d'Alien et de L'Appel de Cthulhu 7.

## 2 · La chaîne jusqu'à GM-OS

```text
PDF ─→ Character Sheet HTML Studio ─→ HTML + manifeste « character-sheet-template »
                                            ↓ importé par
                          le moteur de fiches : docs/fiches/Character_Sheet_Manager.html
                                            ↕ messages (window.RPGSheet / postMessage)
                          GM-OS ─ lit les clés de données (identity.name, weapons.0.damage…)
                                  à travers docs/systems/<jeu>/fiche/correspondance.json
```

- **Le moteur** détient la bibliothèque des personnages ; GM-OS lui parle par messages
  (`src/modules/fiches/pontDeLaFiche.ts`, `FicheHote.tsx`).
- **La correspondance** traduit les clés de la fiche vers les champs de GM-OS — renommages,
  compositions (`"C (D8)"` ↔ niveau + dé), destinations comme l'inventaire
  (`src/modules/fiches/correspondanceDeFiche.ts`). **Elle existe pour Blade Runner et Cthulhu
  Hack** (au 13/10) ; Alien, NOC et Star Trek n'en ont pas encore.

## 3 · Ce que le cahier des charges a fixé

| Point | Avant le 13/10 | Tranché |
| --- | --- | --- |
| **Les clés de données sont un contrat** | Rien ne l'interdit | **§ 6** : on ajoute, on ne renomme jamais ; le validateur compare au gabarit intégré au moteur — une clé disparue est une erreur |
| **Le manifeste est obligatoire** | Spécifié mais **pas exigé** ; Alien et Blade Runner n'en ont pas | **§ 2** : obligatoire, erreur sans lui. Les deux fiches de référence du constructeur n'en ont pas non plus — le cahier le dit |
| **Où livrer** | Non dit | **§ 8** : `docs/fiches/<Jeu>/` ; Claude Code intègre au moteur et monte `BUILTIN_VERSION` |
| **Qui écrit la correspondance** | Écrite à la main, pour deux jeux | **§ 7, David** : Claude Code, après la livraison ; le constructeur ne la produit pas |
| **Les fonctions exigées du HTML** | Zoom, export, import… | **§ 5, David** : la fiche reste utilisable seule ; ces fonctions ne sont pas contrôlées, GM-OS passe par le moteur |

## 4 · Le validateur — `npm run fiche:valider -- <Jeu>` ✅ (2026-10-13)

Sa **pièce maîtresse existe déjà** : `verifierLaCorrespondance`
(`src/modules/fiches/correspondanceDeFiche.ts`, éprouvée par
`electron/correspondanceDesFiches.test.ts`) regarde **dans les deux sens** — aucune clé citée qui
n'existe pas, aucune clé de la fiche oubliée. C'est elle qui aurait attrapé les `.level`.

Construit autour d'elle : `src/modules/fiches/validationDeLaFiche.ts` (logique pure, 17 essais),
`scripts/fiche-valider.mjs` (lecture du disque, rapport à coller dans ChatGPT, `--tous`, `--json`),
et `electron/fichesDuDepot.test.ts`, qui passe les vraies fiches du dépôt à chaque essai. Il vérifie
le manifeste (§ 2), les pages et leurs fonds intégrés (§ 3), les champs et les pistes (§ 4),
l'absence de ressource distante (§ 5), **les clés disparues par rapport au moteur** (§ 6) et la
correspondance dans les deux sens (§ 7).

État au 13/10 : Cthulhu Hack, NOC et Star Trek **acceptées** ; Alien et Blade Runner **refusées**,
faute de manifeste — connues, elles en recevront un à leur prochaine régénération.

## 5 · La vitrine — la fiche ouverte dans le moteur

La preuve visuelle d'une fiche n'est pas un écran de GM-OS : c'est **la fiche ouverte dans le
moteur, zones visibles, à côté du PDF**, pour juger que chaque champ tombe sur sa case. À
construire, sur le modèle de `e2e/vitrine.spec.ts`.

## 6 · La synchronisation du constructeur

`electron/constructeurDeFiches.test.ts` vérifie que les fichiers de connaissance du constructeur
suivent le dépôt : son index nomme exactement les fichiers présents, et sa fiche Alien de
référence est celle de `docs/fiches/Alien/`.

⚠️ Ses références contiennent deux **PDF d'éditeurs** (Alien, Cthulhu 7) : le dépôt est **privé**,
c'est ce qui permet de les y garder. S'il devenait public, ils devraient en sortir.
