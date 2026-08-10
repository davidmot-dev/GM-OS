# 🔢 Convention de versionnage GM-OS

> Document de référence unique. En cas de doute sur un numéro de version, c'est ici que ça se tranche.

## La règle

Le projet vit sur **deux branches parallèles**, chacune avec sa propre pile technique et sa
propre série de versions. Les deux séries sont indépendantes : elles ne se rattrapent jamais.

| Série | Pile | Branche git | État | Worktree | Point d'entrée |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **6.x** | **Electron** | `feature/tablet-hub-pwa` | **active** | `C:/Projet_David/GM-OS-v5` | `dist-electron/main.js` |
| **7.x** | **Tauri** | ~~`GM-OS_v7_P2P`~~ → tag `archive/v7-tauri-migration` | **abandonnée** (voir ci-dessous) | — | `src-tauri/` (Rust) |

### La branche 7.x a été supprimée le 2026-08-10

Décision de David, dans ses mots : *« je referais une migration plus tard quand l'application sur
Electron sera finie, si la migration vers Tauri m'apporte quelque chose »*, puis *« on peut même
supprimer la 7.x car la dette technique ne va que s'accentuer avec le temps »*.

Le raisonnement tient : **une branche qu'on refera de zéro n'a aucune valeur de convergence.** Au
moment de la suppression, elle portait 9 commits en propre et 131 commits de retard sur la 6.x, et
l'écart n'aurait fait que croître.

**Rien n'est perdu.** Les 96 commits de la migration restent atteignables par le tag annoté
`archive/v7-tauri-migration` (pointe `e24a79e`) — abstraction du pont, multimédia, gestion des
fenêtres et multi-écran, permissions Tauri v2. Pour les consulter :

```sh
git log archive/v7-tauri-migration          # l'historique
git switch -c v7-reprise archive/v7-tauri-migration   # repartir de là, si jamais
```

Un tag ne réclame aucune maintenance et n'encombre pas la liste des branches : c'est ce qui le
distingue d'une branche « conservée au cas où », laquelle repose la question de sa fusion à chaque
fois qu'on la voit.

**Le worktree `C:/Projet_David/GM-OS-v7` est désenregistré de git.** Son dossier peut subsister sur
le disque si un processus en tenait un fichier au moment du retrait : il est alors supprimable à la
main, sans conséquence.

### Ce que `main` est vraiment

`main` n'est **pas** la branche de publication de la 6.x, malgré ce qu'une lecture rapide de son nom
suggère. C'est une cible de sauvegardes automatiques : au 2026-08-10, **160 de ses 172 commits
d'écart** s'intitulent « Automated GM-OS Backup », et son dernier commit date du 2026-03-25.

Y fusionner la 6.x n'aurait donc pas de sens. La branche de travail *est* la branche de référence.

Vérification rapide de la branche sur laquelle on se trouve :

```sh
git branch --show-current       # feature/tablet-hub-pwa  ou  GM-OS_v7_P2P
grep '"version"' package.json   # 6.x                     ou  7.x
```

## Source unique de vérité

La version affichée dans l'interface provient **exclusivement** du `package.json` de la
branche, injectée au build via la clé `define` de `vite.config.ts` :

```ts
define: { __APP_VERSION__: JSON.stringify(pkg.version) }
```

Les composants consomment la constante globale `__APP_VERSION__` (déclarée dans
`src/vite-env.d.ts`). **Ne jamais coder un numéro de version en dur dans un composant.**

Pour publier une nouvelle version : modifier `package.json`, et c'est tout — les cinq
emplacements de l'interface (Shell, splash Cyberpunk, splash Recovery ×2, lobby tablette)
se mettent à jour automatiquement.

## ⚠️ Piège historique : les entrées « v7.0.1 » à « v7.0.6 »

Plusieurs documents de `documentation/Planning/` et de `documentation/Walkthroughs/`
décrivent des livraisons numérotées **v7.0.1 à v7.0.6** (identité `deviceId` stable,
isolation des canaux de messagerie, notes privées des joueurs, parité visuelle des dés).

**Ces travaux sont du code Electron, pas du code Tauri.** Ils ont été numérotés « v7 »
avant que la présente convention n'existe, alors que la branche Tauri en était — et en est
toujours — à la 7.0.0.

Ces numéros sont **conservés tels quels** dans les documents et non réécrits : les messages
de commit git y font référence (`b66179c`, `8017032`, …), et les renuméroter désynchroniserait
la documentation de l'historique. Il faut simplement les lire comme des **jalons 6.5.x**.

## État constaté le 5 août 2026

Avant l'application de cette convention, le lobby de la tablette affichait `GM-OS V7.0.4`
aux joueurs pendant que le reste de l'application affichait `v6.5.0` — cinq chaînes codées
en dur qui avaient dérivé indépendamment. C'est ce qui a motivé le passage à `__APP_VERSION__`.

---

*Voir aussi : [roadmap-v5-evolution.md](./Planning/roadmap-v5-evolution.md) et [amélioration.md](./Planning/amélioration.md).*
