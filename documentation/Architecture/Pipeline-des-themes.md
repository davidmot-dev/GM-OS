# Pipeline des thèmes de jeu — qui fait quoi, dans quel ordre

**Version 1.2 — 2026-09-26.** Adapté de la proposition « Architecture V2 — pipeline multi-agent de
construction de thèmes GM-OS » (26/09), confrontée au dépôt réel.

**Pour** : David (le meneur), **RPG Theme Builder** (un assistant dans ChatGPT, qui construit les
thèmes), et Claude Code (l'outillage, le dépôt des fichiers, l'intégration).

**Source de vérité** : [`Cahier-des-charges-theme-de-jeu.md`](./Cahier-des-charges-theme-de-jeu.md).
Ce document-ci dit **comment on travaille** ; le cahier des charges dit **ce qui est permis**. En cas
de désaccord, le cahier l'emporte.

> ⚠️ **La v1.1 supposait que le constructeur était Codex, dans VS Code** — une déduction faite à
> partir des extensions installées, sans demander. C'était faux : RPG Theme Builder vit dans une
> fenêtre ChatGPT et **n'a pas accès au dépôt**. *Une déduction sur l'outil de quelqu'un se
> vérifie auprès de lui.*

---

## 1 · La règle centrale

```text
Le contrat décide ce qui est possible.
RPG Theme Builder décide comment l'exprimer visuellement.
Le validateur prouve la conformité.
La vitrine montre le résultat réel.
David juge, décide, et fait le lien entre les deux fenêtres.
```

Aucune IA ne contourne le contrat. **Ce qui se prouve par du code ne se demande pas à un
modèle** : RPG Theme Builder ne recalcule pas un contraste, il lit le rapport du validateur.

## 2 · Le pipeline

RPG Theme Builder ne voit pas le dépôt, et Claude Code ne voit pas ChatGPT. David passe de l'un à
l'autre ; **Claude Code s'occupe des fichiers**, pour que David n'ait jamais à les ranger à la
main.

```text
Références (PDF, captures, images) + la demande de David
   ↓
① RPG Theme Builder ─ theme.css + intention.md (dans la fenêtre ChatGPT)
   ↓   David copie la réponse (ou télécharge les fichiers) et la donne à Claude Code
② Claude Code ─ dépose les fichiers tels quels dans docs/systems/<jeu>/theme/
   ↓
③ Claude Code ─ lance le validateur → rapport
   ↓ refusé ─→ David colle le rapport dans ChatGPT ─→ ①
   ↓ accepté
④ Claude Code ─ lance la vitrine → captures de GM-OS avec le thème du jeu actif
   ↓
⑤ David ─ juge sur image ; au besoin, joint les captures dans ChatGPT,
          RPG Theme Builder classe les remarques (§ 5) ─→ ①
   ↓ bon
⑥ Claude Code ─ commit ; l'essai des thèmes tourne avant chaque envoi
```

**Pourquoi pas d'automatisation.** Aucune API n'est payée. Un assistant ChatGPT ne peut être appelé
par un programme que par des *Actions*, qui exigent un serveur HTTPS **public** : exposer la
machine du meneur pour économiser deux copier-coller par tour serait un mauvais échange.

**Ce que David doit donner à RPG Theme Builder** : le **cahier des charges**, une fois pour
toutes. S'il en est l'auteur, en *connaissance* jointe à l'assistant ; sinon, en pièce jointe au
début de chaque conversation. À chaque nouvelle version du cahier, remplacer le fichier.

## 3 · Les rôles

| Rôle | Fait | Ne fait pas |
| --- | --- | --- |
| **RPG Theme Builder** | Lit les références et le cahier ; écrit `theme.css` (jetons **et** composants `.rpg-*` des fiches) et `intention.md` ; corrige d'après le rapport ; classe les remarques visuelles | Recalculer ce que le validateur prouve ; inventer un jeton ou un emplacement d'ornement ; régler l'interface par des sélecteurs CSS |
| **David** | Fournit les références ; demande ; fait le lien entre les deux fenêtres ; **juge sur image** ; décide | Ranger les fichiers à la main |
| **Claude Code** | Dépose les fichiers **tels quels** ; lance le validateur et la vitrine ; rend le rapport et les captures ; commite ; construit et entretient l'outillage ; fait évoluer le contrat **avec David** | **Retoucher un thème** : une correction passe par RPG Theme Builder, sinon deux auteurs se contredisent au tour suivant |
| **Validateur** | Vérifie le contrat de bout en bout ; rend un rapport chiffré ; refuse | Réparer un thème en silence |
| **Vitrine** | Lance GM-OS jetable avec le thème du jeu et capture les écrans de référence | Juger |

## 4 · Le validateur

- **Réutilise ce qui existe** : l'analyseur des jetons (`extraireJetons`), le calcul de contraste
  et la liste des hôtes de polices de `src/theme/`. Aucun second analyseur.
- **Le contrat vit en données dans `src/theme/`**, en TypeScript : ce que GM-OS applique
  (`PONT`) en est **dérivé**, le validateur l'importe, et un essai vérifie que les tableaux du
  cahier des charges le reflètent. *Trois copies écrites à la main — le cahier, un JSON, le code —
  finiraient par se contredire ; deux fichiers d'accord peuvent être faux ensemble.*
- **Vérifie tout le cahier** : structure, format du bloc, jetons obligatoires, formats et bornes,
  transparence, contrastes, **polarité conforme au fond réel**, polices, chemins, SVG,
  `intention.md` présent.
- **Rend un rapport à trois colonnes** pour chaque jeton : **appliqué maintenant**, **annoncé
  (V2)**, **fiches seulement** — plus les erreurs, les avertissements et les contrastes chiffrés.
  En JSON pour la machine, et **en texte prêt à coller dans ChatGPT**.
- **Sort en erreur** si le thème est refusé.
- **Un essai le passe sur tous les thèmes du dépôt**, y compris les quatre thèmes de base de GM-OS
  une fois devenus des paquets (refonte, décision D3). Un seul outil pour les deux chantiers.

## 5 · La revue visuelle — classer avant de corriger

Chaque remarque sur une capture reçoit **une** classe :

| Classe | Sens | Suite |
| --- | --- | --- |
| **RÉALISABLE** | Un jeton du contrat l'exprime | RPG Theme Builder corrige |
| **PARTIELLEMENT RÉALISABLE** | Seulement approchable (par la forme, la matière, les ornements…) | Il approche, et l'inscrit dans les limites d'`intention.md` |
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
| Un pont Node.js et une machine à états des travaux | Oui | Aucune API : David fait le lien, Claude Code gère les fichiers |
| Une branche et un **worktree** par thème | Oui | Un thème est un commit. ⛔ Et un worktree mal nettoyé peut **vider le vrai `node_modules`** — payé le 2026-09-25 |
| **Codex** relecteur d'un thème | Reporté | Sur un fichier de données, le validateur couvre ce qu'il relèverait. Il servira mieux à relire le **code** de la refonte |
| Claude « implémenteur » du thème | Oui | RPG Theme Builder écrit le thème, composants des fiches compris ; Claude Code **dépose** sans retoucher |
| Un `theme-spec.json` recopiant les jetons | Réduit | Il doublerait `theme.css`. Seules l'intention et les limites restent, dans `intention.md` |
| La documentation dans `docs/theme-automation/` | ⛔ **Non** | **`docs/` est le corpus que l'Oracle indexe** : ces pages entreraient dans ses réponses en pleine partie. La place est `documentation/`. Pour la même raison, les dossiers `theme/` sont exclus de l'index (`docs/.ragignore`) |
| `tools/`, `.theme-lab/`, points d'accès REST ou MCP, tableau de bord | Oui | Rien à héberger |

**Ces choix se rouvrent** si le nombre de thèmes le justifie un jour : la proposition d'origine
reste alors la cible.

## 8 · Ordre de construction

| Étape | Contenu | État |
| --- | --- | --- |
| **Consignes** | `AGENTS.md` (garde-fous pour tout agent dans le dépôt) · `theme/` exclu de l'index de l'Oracle | ✅ 2026-09-26 |
| **P0** | Le contrat en données · le validateur et sa commande · l'essai sur tous les thèmes du dépôt · la vitrine qui charge un thème de jeu | À faire |
| **Premier usage** | Réparer **Dune, NOC, Star Trek et Torg**, sous les seuils de contraste (mesuré le 26/09), en donnant leur rapport à RPG Theme Builder | Après P0 |
| **Plus tard** | Les formats de revue en JSON ; Codex relecteur du code de la refonte | Si besoin |
