# Pipeline des thèmes de jeu — qui fait quoi, dans quel ordre

**Version 1.1 — 2026-09-26.** Adapté de la proposition « Architecture V2 — pipeline multi-agent de
construction de thèmes GM-OS » (26/09), confrontée au dépôt réel. **v1.1** : le constructeur n'est
plus un GPT mais **Codex**, l'extension d'OpenAI dans VS Code — il travaille dans le dépôt.

**Pour** : David (le meneur, qui juge), Codex (qui construit les thèmes), et Claude Code
(l'outillage et l'intégration).

**Source de vérité** : [`Cahier-des-charges-theme-de-jeu.md`](./Cahier-des-charges-theme-de-jeu.md).
Ce document-ci dit **comment on travaille** ; le cahier des charges dit **ce qui est permis**. En cas
de désaccord, le cahier l'emporte. Les consignes que Codex lit seul sont dans
[`AGENTS.md`](../../AGENTS.md), à la racine du dépôt.

---

## 1 · La règle centrale

```text
Le contrat décide ce qui est possible.
Codex décide comment l'exprimer visuellement.
Le validateur prouve la conformité.
La vitrine montre le résultat réel.
David juge et décide.
```

Aucune IA ne contourne le contrat. **Ce qui se prouve par du code ne se demande pas à un
modèle** : Codex ne recalcule pas un contraste, il lit le rapport du validateur.

## 2 · Le pipeline

```text
Références (PDF, captures, images) + la demande de David
   ↓
① Codex ─ écrit dans docs/systems/<jeu>/theme/ : theme.css + intention.md
   ↓
② Codex ─ lance le validateur
   ↓ refusé ─→ Codex corrige d'après le rapport ─→ ①
   ↓ accepté
③ Vitrine ─ captures de GM-OS avec le thème du jeu actif
   ↓
④ David ─ juge sur image ; Codex classe ses remarques (§ 5)
   ↓ à retoucher ─→ ①
   ↓ bon
⑤ Commit ─ par David ou Claude Code ; l'essai des thèmes tourne avant chaque envoi
```

**Le dépôt fait le pont.** Codex lit le cahier des charges, écrit le thème et lance le validateur
lui-même : plus de copier-coller entre deux fenêtres. David n'intervient qu'aux deux moments qui
lui appartiennent — **la demande** et **le jugement sur image**. Aucune API n'est payée : Codex
tourne sur l'abonnement ChatGPT de David.

## 3 · Les rôles

| Rôle | Fait | Ne fait pas |
| --- | --- | --- |
| **Codex** | Lit les références et le cahier ; écrit `theme.css` (jetons **et** composants `.rpg-*` des fiches) et `intention.md` ; lance le validateur et corrige ; classe les remarques visuelles | Écrire hors de `docs/systems/<jeu>/theme/` sans demande explicite ; toute commande git qui écrit ; modifier le contrat ; recalculer ce que le validateur prouve ; inventer un jeton ou un emplacement d'ornement ; régler l'interface par des sélecteurs CSS |
| **David** | Fournit les références ; demande ; **juge sur image** ; décide ; fait commiter | — |
| **Validateur** | Vérifie le contrat de bout en bout ; rend un rapport chiffré ; refuse | Réparer un thème en silence |
| **Vitrine** | Lance GM-OS jetable avec le thème du jeu et capture les écrans de référence | Juger |
| **Claude Code** | Construit et entretient le validateur, la vitrine, le contrat en données ; intègre et commite ; fait évoluer le contrat **avec David** | Écrire le thème à la place de Codex |

⚠️ **Deux agents dans le même dépôt.** Un seul écrivain par fichier : Codex reste dans le dossier
du thème, Claude Code hors de lui. Si l'un voit dans `git status` des changements qu'il n'a pas
faits, ils ne sont pas à lui.

## 4 · Le validateur

- **Réutilise ce qui existe** : l'analyseur des jetons (`extraireJetons`), le calcul de contraste
  et la liste des hôtes de polices de `src/theme/`. Aucun second analyseur.
- **Le contrat vit en données dans `src/theme/`**, en TypeScript : ce que GM-OS applique
  (`PONT`) en est **dérivé**, le validateur l'importe, un essai vérifie que les tableaux du cahier
  des charges le reflètent, et un **JSON en est généré** pour les outils qui le veulent. *Trois
  copies écrites à la main — le cahier, un JSON, le code — finiraient par se contredire ; deux
  fichiers d'accord peuvent être faux ensemble.*
- **Vérifie tout le cahier** : structure, format du bloc, jetons obligatoires, formats et bornes,
  transparence, contrastes, **polarité conforme au fond réel**, polices, chemins, SVG,
  `intention.md` présent.
- **Rend un rapport à trois colonnes** pour chaque jeton : **appliqué maintenant**, **annoncé
  (V2)**, **fiches seulement** — plus les erreurs, les avertissements et les contrastes chiffrés.
  En JSON pour la machine, et en résumé lisible pour David.
- **Sort en erreur** si le thème est refusé.
- **Un essai le passe sur tous les thèmes du dépôt**, y compris les quatre thèmes de base de GM-OS
  une fois devenus des paquets (refonte, décision D3). Un seul outil pour les deux chantiers.

## 5 · La revue visuelle — classer avant de corriger

Chaque remarque sur une capture reçoit **une** classe :

| Classe | Sens | Suite |
| --- | --- | --- |
| **RÉALISABLE** | Un jeton du contrat l'exprime | Codex corrige |
| **PARTIELLEMENT RÉALISABLE** | Seulement approchable (par la forme, la matière, les ornements…) | Codex approche, et l'inscrit dans les limites d'`intention.md` |
| **NON EXPRIMABLE** | Le contrat ne le permet pas (géométrie d'un composant, mise en page) | **On s'arrête là.** Si David y tient, ça devient une demande d'évolution du contrat, jamais un contournement |
| **FICHES SEULEMENT** | Concerne les fiches, pas l'interface | Composants `.rpg-*` |

*Une limite signalée vaut mieux qu'une fausse implémentation sans effet.*

⚠️ **Un jeton V2 n'est jamais un défaut visuel.** Tant que GM-OS ne l'applique pas (refonte,
phase 1), son absence à l'écran est **normale** : le rapport du validateur dit lesquels.

## 6 · La vitrine pour un thème

`e2e/vitrine.spec.ts`, sur demande (`GMOS_VITRINE=1`) : instance jetable semée par la dernière
sauvegarde, médias restaurés, taille du Zenbook. **Elle doit encore apprendre à charger le thème
d'un jeu** : son corpus est un dossier vide par isolation, il faut y copier le dossier `theme/`
du jeu avant le lancement.

Ce que les captures doivent montrer, au minimum : le poste du meneur, un panneau, une boîte de
dialogue, un élément actif, un danger, un texte estompé — et une fiche de personnage si le thème en
habille.

## 7 · Ce que ce pipeline écarte, et pourquoi

| Proposition d'origine | Écartée | Raison |
| --- | --- | --- |
| Un pont Node.js et une machine à états des travaux | Oui | Codex travaille dans le dépôt : le dépôt est le pont |
| Une branche et un **worktree** par thème | Oui | Un thème est un commit. ⛔ Et un worktree mal nettoyé peut **vider le vrai `node_modules`** — payé le 2026-09-25 |
| Codex **relecteur** d'un thème | Sans objet | Codex **écrit** le thème ; le validateur le contrôle. Codex relecteur reste une piste pour le **code** de la refonte |
| Claude « implémenteur » du thème | Oui | Codex écrit le thème, composants des fiches compris ; deux auteurs pour un fichier, c'est deux vérités |
| Un `theme-spec.json` recopiant les jetons | Réduit | Il doublerait `theme.css`. Seules l'intention et les limites restent, dans `intention.md` |
| La documentation dans `docs/theme-automation/` | ⛔ **Non** | **`docs/` est le corpus que l'Oracle indexe** : ces pages entreraient dans ses réponses en pleine partie. La place est `documentation/`. Pour la même raison, les dossiers `theme/` sont exclus de l'index (`docs/.ragignore`) |
| `tools/`, `.theme-lab/`, points d'accès REST ou MCP, tableau de bord | Oui | Rien à héberger |

**Ces choix se rouvrent** si le nombre de thèmes le justifie un jour : la proposition d'origine
reste alors la cible.

## 8 · Ordre de construction

| Étape | Contenu | État |
| --- | --- | --- |
| **Consignes** | `AGENTS.md` à la racine · `theme/` exclu de l'index de l'Oracle | ✅ 2026-09-26 |
| **P0** | Le contrat en données · le validateur et sa commande `npm run theme:valider -- <jeu>` · l'essai sur tous les thèmes du dépôt · la vitrine qui charge un thème de jeu | À faire |
| **Premier usage** | Réparer **Dune, NOC, Star Trek et Torg**, sous les seuils de contraste (mesuré le 26/09) — Codex partant de leur rapport | Après P0 |
| **Plus tard** | Les formats de revue en JSON ; Codex relecteur du code de la refonte | Si besoin |
