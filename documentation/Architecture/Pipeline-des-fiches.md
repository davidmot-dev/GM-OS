# Pipeline des fiches de personnage — les spécificités du chantier

**Version 1 — 2026-09-26.** La boucle de travail est commune aux deux constructeurs :
[`Flux-des-constructeurs.md`](./Flux-des-constructeurs.md). Cette page dit **ce qui est propre
aux fiches**. Le chantier est **indépendant des thèmes** : une fiche ne lit jamais `theme.css`.

⏳ **Le cahier des charges des fiches n'est pas encore écrit** — c'est un chantier distinct, inscrit
au registre (§ 76). Cette page rassemble ce qu'il devra fixer.

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
  (`src/modules/fiches/correspondanceDeFiche.ts`). **Elle n'existe aujourd'hui que pour Blade
  Runner.**

## 3 · Ce que le cahier des charges des fiches devra fixer

| Point | Aujourd'hui | Pourquoi |
| --- | --- | --- |
| **Les clés de données sont un contrat** | Rien ne l'interdit | ⛔ Renommer une clé en régénérant casse la correspondance **en silence** — arrivé le 2026-08-24 avec les `.level` de Blade Runner |
| **Le manifeste est obligatoire** | Spécifié (`HTML_MANIFEST_SPEC.md`) mais **pas exigé** par les instructions du constructeur | Sans lui, le moteur ne peut pas importer la fiche comme modèle. NOC et Star Trek l'ont ; **Alien et Blade Runner non** |
| **Où livrer** | Non dit | `docs/fiches/<Jeu>/`, et la correspondance dans `docs/systems/<jeu>/fiche/` |
| **Qui écrit la correspondance** | Écrite à la main, pour un seul jeu | À trancher : le constructeur la propose, ou Claude Code la dérive des clés |
| **Les fonctions exigées du HTML** | Zoom, export, import… | À confronter à ce que le moteur fournit déjà : ne pas payer deux fois |

## 4 · Le validateur — `fiche:valider`, à construire

Sa **pièce maîtresse existe déjà** : `verifierLaCorrespondance`
(`src/modules/fiches/correspondanceDeFiche.ts`, éprouvée par
`electron/correspondanceDesFiches.test.ts`) regarde **dans les deux sens** — aucune clé citée qui
n'existe pas, aucune clé de la fiche oubliée. C'est elle qui aurait attrapé les `.level`.

Il lui restera à vérifier : le manifeste présent et lisible, **aucune clé disparue ou renommée**
par rapport à la version précédente de la fiche, les fonds de page intégrés (fiche autonome).

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
