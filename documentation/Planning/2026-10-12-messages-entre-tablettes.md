# Les messages entre tablettes — plan du 12/10/2026

**Né du débriefing de la première séance jouée** (11/10) : *les messages entre joueurs
disparaissent — souvent tous d'un coup*. Ligne du § 1 bis du
[registre](2026-08-23-chantiers-gares.md), chantier n° 2 de la reprise.

**État au 12/10 : M1, M2 et M4 faits, non commités, à éprouver avec deux tablettes. Reste M3.**
La règle vit dans `electron/destinatairesDesMessages.ts` ; le fil du meneur dans
`src/modules/session/logic/filDesMessages.ts`. ⚠️ M4 est passé **avec** M2 et non après : dès que le
meneur reçoit les messages de joueur à joueur, son fil (`CockpitMessenger`) et sa fenêtre d'alerte
(`MessageAlertOverlay`, trouvée en vérifiant tous les lecteurs de `messages`) les auraient montrés.
L'alerte ne se déclenche plus non plus pour un message relu au démarrage.

## Pourquoi ils disparaissent (rappel du 11/10)

Les messages ne vivent **qu'en mémoire**. `messages` n'est pas dans `lesDonneesDeLaSession`, une
tablette n'écrit rien (`gmOnlyStateStorage`), et le meneur **ne rend jamais** le fil à une tablette
qui se reconnecte. Tout rechargement de la page d'une tablette vide le fil : veille de l'iPad, mise à
jour de la PWA, et surtout, **en `npm run dev`, le rechargement automatique de Vite dès que sa
connexion tombe une seconde**. Un redémarrage de GM-OS le vide partout.

## Ce que la lecture du 12/10 a ajouté

| Constat | Où |
| --- | --- |
| ⚠️ **Le meneur ne reçoit jamais un message de joueur à joueur.** Le serveur le relaie entre tablettes et ne le transmet pas au renderer (`isStrictP2P`) : *le meneur ne peut pas garder ce qu'il n'a pas* | `electron/SyncServer.ts:513-522` |
| ⛔ **Toutes les tablettes reçoivent tous les messages privés.** Le relais joueur → joueur part vers **toutes** les sockets (`broadcastAction` sans rôle) ; le message privé du meneur aussi (`sendDirectMessage` → `broadcastUIAction` sans rôle) ; chaque tablette les **range tous** (`addSessionMessage` sans filtre) et ne les **cache qu'à l'affichage** (`HubMessenger`) | `SyncServer.ts:514`, `uiSlice.ts:221`, `useHubSync.ts:436` |
| ⛔ **L'état complet porte les 50 derniers messages à toutes les tablettes**, joueurs compris : la clé `messages` n'est pas retirée de `playerDiff`. La tablette du joueur l'ignore à la fusion — mais elle la reçoit | `useNexusSynchronizer.ts:464` et `:607-636` |

*Un message privé caché à l'affichage n'est pas un message privé : il est sur la tablette d'à côté.*

## Les décisions de David (11 et 12/10)

| Question | Décision |
| --- | --- |
| Qui fait foi | **Le meneur** : il garde les messages avec la campagne, et rend à chaque tablette qui se (re)connecte **les siens seulement** (11/10) |
| Les messages de joueur à joueur, côté meneur | **Gardés mais cachés** : GM-OS les garde pour les rendre aux tablettes, **il ne les affiche pas** au meneur |
| La durée du fil | **Fil de campagne** : il continue d'une séance à l'autre ; un joueur retrouve les messages de la semaine dernière |
| La tablette du meneur | **Reçoit le même fil que GM-OS** — donc **sans** les messages de joueur à joueur, qui restent cachés au meneur |

## Ce qu'un message voit — une règle, écrite une fois

```ts
// electron/destinatairesDesMessages.ts — pure, testée, importée aussi par src/
type Lecteur = { role: 'meneur' } | { role: 'joueur'; characterId: string };

/** Un message est-il pour ce lecteur ? */
messagePourLeLecteur(message, lecteur): boolean
//  joueur  : il l'a envoyé, il en est le destinataire, ou c'est un message à tous
//  meneur  : il l'a envoyé, il en est le destinataire, ou c'est un message à tous
//            — JAMAIS un message de joueur à joueur (décision du 12/10)

/** Le fil à rendre à un lecteur qui se (re)connecte, pour une campagne. */
filDuLecteur(messages, campagneId, lecteur, plafond = 200): SessionMessage[]
```

⛔ **La même règle sert à quatre endroits**, et c'est tout son intérêt : l'acheminement par le
serveur, le fil rendu à la reconnexion, l'affichage chez le meneur, et la tablette du meneur. Le
serveur ne lit que `electron/` (`tsconfig.electron.json`) : la règle vit donc **dans `electron/`**,
et `src/` l'importe — le précédent existe, `AIService` et `ficheQuiRepond` importent déjà
`electron/corpusSysteme` et `electron/motsDeLaQuestion`, deux modules purs.

## Les étapes

| Étape | Contenu |
| --- | --- |
| **M1 — Le meneur garde tout** | `SessionMessage.campaignId?` (facultatif : posé par l'expéditeur, sinon par le meneur à la réception avec sa campagne active). `messages` entre dans `lesDonneesDeLaSession` → persistance vivante **et** sauvegarde. Le plafond de 100 messages **tous confondus** devient un plafond **par campagne** (1 000 : du texte court). Le serveur **transmet au meneur** les messages de joueur à joueur. La purge d'une campagne emporte ses messages (`services/purge/detenteursDeLaCampagne.ts`). |
| **M2 — Chacun ne reçoit que les siens** | Le serveur achemine un message **aux seules sockets** de l'expéditeur, du destinataire, du meneur ; « à tous » aux joueurs et au meneur. Le message du meneur part par ce même chemin au lieu de `broadcastUIAction`. `messages` est **retiré** de l'état complet envoyé aux joueurs ; la tablette du meneur n'y reçoit que ce que `messagePourLeLecteur(…, meneur)` laisse passer. La tablette **filtre aussi à la réception** — une seconde porte, pas la seule. |
| **M3 — Le fil revient à la reconnexion** | À l'inscription d'une tablette (`remote:register`, qui demande déjà l'état complet), le meneur lui envoie **à elle seule** `filDuLecteur(…)`. Il faut un envoi **à un appareil** : il n'existe aujourd'hui que des envois **par rôle** — un canal IPC neuf, `remote:envoyer-a-l-appareil`, dans la liste blanche du préchargement. La tablette fusionne sans doublon (`addSessionMessage` écarte déjà les identifiants connus). |
| **M4 — L'affichage du meneur** | `CockpitMessenger` et `RemoteMessenger` lisent par `messagePourLeLecteur(…, meneur)` : les messages de joueur à joueur restent stockés, jamais montrés. |

**M1 seul ne suffit pas** : il protège contre un redémarrage de GM-OS, pas contre le rechargement
d'une tablette — c'est M3 qui répond au constat de la séance. **M2 passe avant M3**, parce que M3
sans M2 rendrait le fil à une tablette par un chemin qui fuit encore.

## Les essais qui doivent exister

- Un joueur reçoit ses messages, ceux qu'on lui adresse et ceux à tous — **jamais** ceux de deux
  autres joueurs, ni un message privé du meneur à un autre joueur.
- Le meneur garde un message de joueur à joueur, et **ne l'affiche pas**.
- Une tablette qui se reconnecte retrouve son fil de la campagne, et **seulement** le sien.
- Le fil survit à un redémarrage de GM-OS (persistance) et entre dans la sauvegarde
  (`CHAMPS_DURABLES` le prouve tout seul dès que la clé y est).
- Un changement de campagne ne rend pas les messages de l'autre campagne.

## Restent sans réponse

- **L'export Nexus-OS emporte-t-il le fil ?** Le plan dit **non** par défaut : l'export transporte
  une campagne **préparée** pour la partager, et ce qui s'est dit entre joueurs n'en fait pas partie.
- **La lecture du meneur en différé** : les messages de joueur à joueur étant cachés, faut-il un
  geste pour les **ouvrir** volontairement (après la séance, par exemple) ? Pas dans ce plan.
