# Restes après l'unification du transport — plan d'action

> État au **2026-08-07**, branche `feature/tablet-hub-pwa`, HEAD `4036726`, poussée.
> Fait suite à `2026-08-05-architecture-review-hardening.md`, dont la section
> **« Bilan du chantier »** contient le détail. Ce document-ci est la liste de ce qui reste,
> écrite pour être reprise à froid.

## Où on en est

Le transport entre fenêtres locales est unifié. Tous les flux — `clock`, `combat`, `map`, les
deux types de verrous de jetons, `whiteboard`, `hub:ready` — passent par
`electron/WindowRelay.ts`, hébergé par le process principal. Le `BroadcastChannel` ne subsiste
que comme repli hors Electron (tablette en PWA, navigateur de développement).

Validé en conditions réelles le 2026-08-07, sauf le flux `combat` — voir le point 2.

Deux règles acquises, à ne pas redécouvrir :

- **Le relais transporte des chaînes, pas des objets.** Le surcoût du saut IPC suit le nombre
  de nœuds d'objet, pas les octets. Pré-sérialiser en JSON rend le relais plus rapide que le
  `BroadcastChannel`. C'est mesuré (`scripts/ipc-bench/`) et inscrit dans le code : le relais
  refuse ce qui n'est pas une chaîne.
- **Un flux est sûr à basculer si son payload est dans le `partialize` de son store** — un
  état persisté par Zustand subit déjà l'aller-retour JSON. Commode, mais pas général :
  `useMapStore` exclut de sa persistance exactement les champs qu'il diffuse.

---

## 1. Le contrôle de rôle au niveau du relais

**Le seul vrai reste de fond.** Referme l'angle mort ouvert au point 9 de la revue.

### Le problème

Toutes les fenêtres locales sont traitées comme égales. Le Player Hub peut émettre n'importe
quel message, et la fenêtre MJ l'adopte sans se demander si l'expéditeur avait autorité pour
le dire.

Ce n'est pas théorique : **c'est le bug de l'étape 6**. Le Player Hub s'ouvrait, diffusait son
tableau vide et sa projection à `null`, le MJ adoptait, puis rediffusait — la projection
s'éteignait toute seule. Il est resté invisible des mois, et n'est apparu que parce que la
bascule du flux a changé l'ordre d'arrivée des messages.

### Ce qui rustine le problème aujourd'hui

Deux gardes, posées **dans le renderer**, dans `src/services/CrossWindowEventService.ts` :

- `stripProjectionTarget()` — retire la cible de projection d'un payload venu d'une fenêtre
  secondaire, parce que cette décision appartient au MJ.
- `hasReceivedSharedState` — une fenêtre secondaire n'émet rien tant qu'elle n'a pas reçu
  l'état partagé.

Elles fonctionnent, et elles sont testées (`CrossWindowEventService.relay.test.ts`). Mais
chacune traite un cas précis, et elles vivent dans la fenêtre qu'il s'agit justement de ne pas
croire sur parole. Le jour où un champ est ajouté au payload, rien ne signalera qu'il faut le
protéger.

### Pourquoi c'est faisable maintenant

Deux conditions viennent d'être réunies :

- **Le process principal sait qui est qui.** `electron/main.ts` tient `win` (la fenêtre MJ),
  `hubWindow` (le Player Hub) et `projectorWindows` (les projecteurs, par identifiant
  d'écran). Le rôle se déduit donc de `event.sender.id`.
- **Tous les messages passent par un seul point** — `installWindowRelay`, appelé à
  `electron/main.ts:792`.

### Ce qu'il y a à faire

1. Une fonction qui associe un `webContents.id` à un rôle (`gm` | `hub` | `projector` |
   inconnu), dans `electron/main.ts` où les trois références vivent.
2. Une politique — un fichier à part, testable seul, sur le modèle d'`electron/actionPolicy.ts` :
   quel rôle a le droit d'émettre quel type de message, et quels champs. Refus par défaut pour
   ce qui n'est pas énoncé, comme au point 9.
3. Le branchement dans `installWindowRelay` : le contrôle doit précéder **toute** la logique de
   diffusion. C'était le piège au point 9 — contrôler après aurait laissé passer les messages
   usurpés.
4. Journaliser les refus via `electron/auditLog.ts`. C'est la journalisation qui avait révélé
   la régression `remote:request-sync` au point 9, pas la relecture.

**Point à arbitrer avant d'écrire :** garder ou retirer les deux gardes du renderer une fois la
politique en place. Retirer donne un seul endroit de vérité ; garder laisse une ceinture en cas
de trou dans la politique. À trancher au moment de faire, pas maintenant.

**Attention** — la politique doit laisser passer ce qui est légitime :

- Le Player Hub **est** émetteur légitime sur le tableau blanc (`PlayerDrawingCanvas` publie
  via `setActivePath` et `setLaserPointer`) et sur les positions de jetons.
- Les verrous de jetons (`map:lock` / `map:unlock`) doivent rester libres pour toutes les
  fenêtres : les retenir laisserait un jeton saisissable deux fois pendant les premières
  secondes d'une fenêtre.
- Le message de nettoyage émis par `TokenLockRegistry` à la fermeture d'une fenêtre part avec
  `senderId: -1`, qui ne correspond à aucune fenêtre (`electron/main.ts:811`). Il ne doit pas
  être refusé.

### Comment vérifier

Les tests d'abord (politique seule, puis câblage réel dans le relais, comme
`SyncServer.register.test.ts` le fait pour le point 9), puis en conditions réelles : ouvrir le
Player Hub alors que le tableau **et** la carte sont déjà projetés, et vérifier que rien ne
s'éteint. C'est le scénario exact que les gardes actuelles corrigent.

---

## 2. Exercer `combat` en conditions réelles

**À faire par David, pas par moi. Environ trente secondes.**

C'est le seul flux basculé que personne n'a jamais vérifié pour lui-même. Sa bascule est
`49c9747`, et rien n'a changé dans le code de transport à ce moment-là — seul le contenu de
`RELAYED_TYPES`. La sûreté JSON est acquise par le critère du `partialize` : celui de
`useCombatStore` est exactement les quatre champs diffusés.

**Le test :** lancer un combat, faire tourner l'initiative, vérifier que le Player Hub et le
projecteur suivent.

Si ça marche, il n'y a rien à faire et le point se ferme. Si ça ne marche pas, **ça passe
devant tout le reste** — y compris le point 1.

---

## 3. La rediffusion complète du MJ quand une fenêtre secondaire dessine

**À faire seulement sur symptôme constaté.**

Quand le Player Hub dessine, la fenêtre MJ reprogramme un `broadcastFullState()` 50 ms après le
dernier message reçu (`CrossWindowEventService.handleMessage`, branche `whiteboard`). Celui-ci
renvoie **tout** — le tableau entier *et* tout le payload carte.

La temporisation est glissante : le minuteur redémarre à chaque message, donc elle ne se
déclenche qu'en fin de rafale, pas en continu. Ce n'est pas le trafic permanent que l'étape
6 bis a supprimé — mais l'optimisation de cette étape (`lastBroadcastPaths`) ne couvre pas ce
chemin, parce que `broadcastFullState()` envoie les tracés sans condition, à dessein : c'est le
chemin de resynchronisation, dont le destinataire n'a précisément rien à fusionner.

**Le symptôme à guetter :** des à-coups quand un joueur dessine depuis le Hub. Sans symptôme,
c'est de l'optimisation à l'aveugle — et le tableau blanc est le flux le plus souvent recorrigé
du projet, ce n'est pas celui sur lequel improviser.

---

## 4. `isTokenLocked` n'est pas réactif

**Veille, pas chantier.**

`isTokenLocked` est lu pendant le rendu de `MapTokenNode` sans être réactif : un verrou qui
change n'entraîne pas de re-rendu, l'état est constaté au rendu suivant. Concrètement, un jeton
peut sembler saisissable une fraction de seconde alors qu'il ne l'est plus.

Antérieur au chantier — c'était déjà le cas avec le `BroadcastChannel`. La bascule ne l'a ni
aggravé ni corrigé.

---

## 5. Limiter le débit de `remote:request-sync`

**Veille, pas chantier.**

Une tablette peut réclamer une resynchronisation complète en rafale : `remote:request-sync`
déclenche `handleSync(true)`, qui contourne l'étranglement de 500 ms.

C'était sérieux quand le payload pesait 7,6 Mo. À 305 Ko depuis le point 6, c'est devenu bénin.
Ne compte que sur un réseau où tous les appareils ne sont pas connus.

---

## Ordre recommandé

1. **Le point 2** — il ne coûte que du temps de David, et un échec rebattrait les cartes.
2. **Le point 1** — le seul vrai reste de fond.
3. Les points 3, 4 et 5 sont des veilles. Ils ne se déclenchent que sur symptôme constaté, ou
   sur un changement d'usage (le 5 : jouer sur un réseau non maîtrisé).
