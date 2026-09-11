# 🛡️ Standard d'Architecture : Bridge GM-OS (Electron/Tauri)

## 1. Vision & Objectif

L'architecture **Bridge** de GM-OS est conçue pour garantir une isolation totale entre la couche de présentation (React) et la couche système native. Cette séparation permet trois avantages critiques :
- **Sécurité** : Aucune API Node.js/OS n'est exposée directement au Web.
- **Portabilité** : Le passage d'Electron à Tauri (ou inversement) se fait sans toucher une seule ligne de code UI.
- **Robustesse** : Centralisation des interfaces système dans un contrat unique.

## 2. Règle d'Or : Isolation Stricte

Il est **strictement interdit** d'importer les modules suivants dans `/src/renderer` :
- `electron` (ipcRenderer, remote, etc.)
- `fs`, `path`, `os`, `child_process`
- Tout package Node.js natif.

**Méthode unique d'accès :** L'objet global `window.appBridge`.

## 3. Structure du Bridge (`window.appBridge`)

Le bridge est structuré par module fonctionnel pour éviter un objet "fourre-tout" massif.

### Exemple de structure :
```typescript
interface AppBridge {
    system: SystemBridge;    // Boot, Versions, Logs
    image: ImageBridge;      // Projections, Écrans
    audio: AudioBridge;      // Périphériques, Gain Master
    voice: VoiceBridge;      // Worklets, Transcription
    nexus: NexusBridge;      // P2P, WebSocket Sync
}
```

## 4. Communication Inter-Fenêtres

Dans un environnement multi-fenêtres (MJ, Hub, Projecteurs), la synchronisation suit ce protocole :

### A. Le Store Persistant (Zustand + Storage)
- Utilisé pour l'état de "fond" (Campagne, Paramètres).
- Les fenêtres secondaires écoutent l'événement global `storage` et appellent `Store.persist.rehydrate()`.

### B. Le Canal Direct (IPC Broadcast)
- Utilisé pour les actions temps-réel (Projection flash, Blackout, Volume).
- **Verrouillage IPC** : Pour éviter que le Store (plus lent à se synchroniser) n'écrase une commande directe, les fenêtres d'affichage utilisent un compteur `ipcCount`. Une fois le premier IPC reçu, le Store local est ignoré au profit du flux IPC.

## 5. Meilleures Pratiques

1. **Typage Strict** : Toutes les interfaces du Bridge doivent être définies dans `window.d.ts` et utiliser les types métiers du dossier `types/`.
2. **Promisification** : Toutes les méthodes du Bridge doivent être asynchrones (`Promise`) pour ne pas bloquer le thread UI.
3. **Mocks de Test** : Pour les tests Vitest, simulez systématiquement `window.appBridge` pour tester la logique métier sans avoir besoin d'un environnement Electron.

---

## 6. ⛔ Aucun canal libre (2026-09-10)

**Le pont n'expose aucune méthode générique.** Il n'y a plus de `on`, `off`,
`send` ni `invoke` prenant un nom de canal en paramètre : **chaque canal a sa
méthode nommée**, et le canal y est écrit en toutes lettres.

### Pourquoi

Deux raisons, et la seconde est la vraie.

1. **La surface réelle du pont n'était pas celle que le contrat annonçait.** Six
   canaux transitaient par le générique sans figurer nulle part — dont
   `remote:eject-all`, qui déconnecte toute la table.

2. ⛔ **`off` ne retirait jamais rien.** `on` enregistrait une fonction
   *enveloppe* anonyme et `off` demandait à Electron de retirer le `listener`
   d'origine, qui n'avait jamais été enregistré. Electron compare par référence :
   aucune correspondance, aucun retrait. **Tout abonnement passé par ce pont
   était définitif.**

Trois fuites que ce silence cachait, trouvées en le fermant : `fetchDisplays`
posait un écouteur *à chaque appel*, les deux abonnements d'`App.tsx` n'étaient
pas dans le nettoyage de leur effet, et `map:ping` écoutait un canal **qu'aucun
émetteur n'alimente** — son `off` visant en prime une autre fonction que son
`on`.

### La règle

> **Tout ce que le préload abonne, il doit savoir le retirer.** Une méthode
> d'abonnement ferme sur l'écouteur qu'elle pose et **rend la fonction qui le
> retire** ; l'appelant s'en sert dans le nettoyage de son effet.

```typescript
onUpdateDisplay: (rappel: (chemins: string[]) => void) => {
    const ecouteur = (_e: Electron.IpcRendererEvent, chemins: string[]) => rappel(chemins);
    ipcRenderer.on('image:update-display', ecouteur);
    return () => ipcRenderer.off('image:update-display', ecouteur);
}
```

⚠️ **Deux exceptions, et la liste ne doit pas grandir** : `ulanzi:before-quit` et
`backup:before-quit`. Ce sont des poignées de main de fermeture — le rappel vit
aussi longtemps que la fenêtre, et le danger n'est pas la fuite mais le
**doublon**, `StrictMode` montant chaque effet deux fois. Elles se protègent donc
par `removeAllListeners` avant de s'abonner : le processus principal attend avec
`ipcMain.once`, et *la première réponse libère la fermeture — la plus rapide
étant celle qui n'a rien écrit*.

### Le contrôle

`electron/pontSansCanalLibre.test.ts` tient les deux invariants : aucun appel IPC
ne prend son canal dans une variable, et chaque `on` a son `off`. **Retirer le
générique du *type* (`window.d.ts`) est ce qui rend `tsc` exhaustif** — il a
trouvé trois appelants que `grep` avait ratés, et un canal absent du relevé.

---

## 7. 🔑 Les secrets ne traversent pas le pont (2026-09-10/11)

**Aucune clé d'API ne circule dans le renderer.** Le processus principal les
détient (coffre `SecurityManager`) et les **pose lui-même** sur les requêtes
sortantes ; l'écran déclare seulement **pour quel fournisseur** il parle.

| Fichier | Rôle |
| --- | --- |
| `electron/hotesDesFournisseurs.ts` | Quel hôte un fournisseur a le droit de joindre. Un hôte **libre** (`custom`, `ollama`) est écrit ; un fournisseur **absent** est refusé. |
| `electron/clesDesFournisseurs.ts` | Où la clé s'attache — en-tête `x-api-key`, `Authorization: Bearer`, ou **paramètre d'URL** pour Gemini. |

⚠️ **Elles ne se posent pas toutes au même endroit**, et c'est ce qui interdit
une fonction unique : **Gemini met sa clé dans l'URL**. Une URL voyage dans les
journaux du serveur d'en face — d'où le caviardage du journal d'erreur de
`main.ts`, qui recopiait l'URL entière.

Côté magasin, `useAIStore` ne connaît que `clesPresentes` : **qui** a une clé,
jamais laquelle. Il le demande à `etatDuCoffre()`, qui rend les *noms* des
entrées. Le type `AIModelConfig` n'a plus de champ `apiKey` — *c'est le typage
qui refuse, pas une discipline qu'on oublie*.

**Conséquence pour l'écran** : on ne relit plus une clé, **on la remplace**.

### ⛔ Le piège que cette architecture a ouvert (2026-09-11)

Pour que le proxy lise le même coffre, `securityManager` est devenu une **instance de niveau
module**. Son constructeur appelait `app.getPath('userData')` — et `main.ts` l'importe.

> `app.getPath('userData')` ne lit pas un chemin : il le **verrouille** pour toute la vie du
> processus, d'après `app.name` **au moment de l'appel**. Or `main.ts` pose
> `app.name = 'gm-os-v5'` dans son corps, donc **après** l'évaluation de ses imports.

Résultat : toutes les données ont basculé sur le profil `gm-os-v6`, vide, et le meneur a trouvé une
campagne de démonstration à la place des siennes.

**La règle, désormais tenue par `electron/verrouDuCheminDeDonnees.test.ts`** :

> **Aucun module importé par `main.ts` ne doit appeler `app.getPath` à son évaluation** — ni au
> niveau module, ni dans un constructeur. Le chemin se résout au **premier besoin**, par un accesseur
> paresseux.

⚠️ Un singleton exporté est du code qui s'exécute à l'import. *Le `new` de niveau module est discret ;
c'est le constructeur qu'il faut lire.*

---
*Date de création : 16 Avril 2026*
*Version : 1.2 — 11 Septembre 2026 (fermeture du canal libre, garde des clés)*
