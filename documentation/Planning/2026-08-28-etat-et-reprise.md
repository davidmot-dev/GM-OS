# État et reprise — 2026-08-28

**Instantané daté.** Le point d'entrée pour reprendre.
`tsc -b` propre, **2 503 tests au vert**. Arbre propre, **tout est poussé**
(`origin/feature/tablet-hub-pwa`, jusqu'à `8dd75e8`).

> Le registre **vivant** des chantiers garés est ailleurs :
> `2026-08-23-chantiers-gares.md`. Celui-ci ne se met pas à jour.

---

## Les cinq commits de la reprise

| | |
| --- | --- |
| `6ea52cf` | **La couture des fiches** — `window.RPGSheet` + `postMessage`, 9 tests sur le vrai moteur |
| `a0cb8c6` | **La course de réhydratation** — on n'écrit plus avant d'avoir relu la base |
| `35e853c` | **La sauvegarde automatique** — sans git, sans dialogue, éprouvée en réel |
| `1d0bd66` | La carte de séance cesse de contenir un bouton dans un bouton |
| `8dd75e8` | Les documents de planification |

*Le bouton « Quitter GM-OS » est réparé dans `35e853c` et non dans un commit
propre : son correctif et la sauvegarde de sortie sont le même geste.*

---

## 1 · Ce qui est fermé, et ne doit pas se rouvrir

### La couture des fiches — chantier 3b débloqué

Le moteur expose `window.RPGSheet = { version, getData, setData, getTemplate,
onChange }` et le même contrat par `postMessage` (canal `rpg-sheet`).
**« Trois lignes » en cachait trois autres :** `setByPath` signale la clé (seul
point par lequel passent tous les chemins d'édition), `openCharacter` annonce
l'ouverture, et **`setData` redessine** — écrire sans rafraîchir laisse la donnée
juste et l'écran menteur.

### La course de réhydratation — le dernier chemin qui coûtait des données

`PersistenceService` n'ouvre l'écriture qu'une fois la base **relue**. Et sa
moitié silencieuse : `idbStateStorage.getItem` avalait l'erreur et rendait
`null`, indiscernable d'un premier démarrage — *une lecture ratée qui se fait
passer pour une base vide est un effacement à retardement.*

### La sauvegarde automatique — éprouvée en réel

Trois sauvegardes de **1,5 Mo** écrites par l'application dans
`%APPDATA%\gm-os-v5\backups\` : 7 campagnes réelles, 125 PNJ, 102 scènes, **zéro
mock**. Trois règles de construction (aucun git · jamais sous `APP_ROOT` · ne
supprime que ses propres fichiers), écriture atomique et relue, rotation de 12 +
7 jours ≈ 28 Mo.

📄 Le récit complet de l'incident de mars — pourquoi c'est le `checkout` d'une
branche orpheline qui vidait l'application, et pourquoi le correctif de l'époque
avait visé la mauvaise commande : `2026-08-27-sauvegarde-automatique.md`.

---

## 2 · Par quoi reprendre

**1. ⛔ La décision sur les images.** `gmos-media-db` — environ **263 Mo** — n'est
sauvegardée par personne. La sauvegarde livrée est une **sauvegarde de
pointeurs** : elle protège tout ce qui a été perdu les deux fois, mais restaurer
sur un profil neuf rendrait les images mortes. Ce n'est pas une régression, c'est
un chantier distinct, chiffré. **C'est la seule chose qui attende une réponse de
David.**

**2. L'hôte des fiches côté GM-OS** — l'iframe, la bascule sur les deux écrans,
puis la table de correspondance (étapes 3 à 6 du document de correspondance). La
couture ne demande plus rien à personne.

**3. L'essai de l'afficheur Ulanzi en conditions**, et les quatre autres modules
de l'axe N.3 — ils attendent la même séance de Blade Runner.

**4. Deck-OS** ne peut toujours pas commencer : ses deux décisions ne sont pas
tranchées.

---

## 3 · Trois pièges payés aujourd'hui, à ne pas repayer

**Un garde-fou qui ne sait pas se rouvrir est une panne à retardement.** Le refus
du rétrécissement aurait bloqué **toutes** les sauvegardes suivant une
suppression de campagne légitime, en silence et pour toujours.

**La croix de la fenêtre ne passe pas par `before-quit`.** Elle fait `close` →
`window-all-closed` → `app.quit()` **fenêtre déjà détruite**. La garde sortait
proprement — *en n'écrivant rien*. Elle n'aurait jamais planté, elle se serait
tue : le pire mode d'échec pour un filet.

**Le bouton « Quitter GM-OS » n'avait aucun destinataire**, et ça n'avait jamais
été le cas — vérifié dans `HEAD` avant de conclure. Une chose qui ne marche pas
n'est pas forcément une chose qu'on vient de casser.
