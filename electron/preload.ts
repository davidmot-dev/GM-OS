import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { FournisseurReseau } from './hotesDesFournisseurs'
import type { GuideDuManuel } from './guidesDuManuel'

// --------- Expose some API to the Renderer process ---------
/*
  **Le pont generique a ete retire le 2026-09-10.**

  Il exposait `on` / `off` / `send` / `invoke` sur n'importe quel canal, a cote
  des methodes nommees. Deux raisons de le fermer, et la seconde est la vraie :

  1. La surface reelle du pont n'etait pas celle que ce fichier annonce. Six
     canaux transitaient par lui sans figurer dans aucun contrat, dont
     `remote:eject-all` — deconnecter toute la table.

  2. ⛔ **`off` ne retirait JAMAIS rien.** `on` enregistrait une fonction
     enveloppe anonyme (`(event, ...args) => listener(...)`) et `off` demandait
     a Electron de retirer le `listener` d'origine, qui n'avait jamais ete
     enregistre. Electron compare par reference : aucune correspondance, aucun
     retrait. **Chaque abonnement etait definitif**, et l'effet du hub se
     reabonnait a chaque changement de `applySyncPayload` — les charges utiles
     se rejouaient donc autant de fois qu'il y avait eu de rendus.

  Les methodes nommees ci-dessous n'ont pas ce defaut par construction : elles
  ferment sur l'ecouteur qu'elles ont pose, et **rendent la fonction qui le
  retire**. C'est le motif deja suivi par `onAction`, `onStreamToken` et
  `onDisplayChanged` — il n'a jamais ete faux, il n'etait juste pas applique
  partout.
*/
contextBridge.exposeInMainWorld('appBridge', {
    getPathForFile(file: File) {
        return webUtils.getPathForFile(file)
    },
    /*
      **Le bouton du cockpit de campagne ouvrait une alerte.** `openFile` etait
      declare dans le contrat et expose nulle part : son repli affichait le
      chemin dans une boite de dialogue. (2026-09-09)

      ⚠️ Il est pose A LA RACINE, la ou le contrat l'annonce et ou l'appelant le
      cherche. C'est la lecon du voisin : `openExternal` etait declare ici et
      expose sous `web`, et le panneau de l'Oracle appelait donc le vide.
    */
    openFile: (chemin: string) => ipcRenderer.invoke('app:open-file', chemin),
    app: {
        quit: () => ipcRenderer.send('app:quit'),
        onDisplayChanged: (callback: (count: number) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, count: number) => callback(count);
            ipcRenderer.on('app:display-changed', listener);
            return () => ipcRenderer.off('app:display-changed', listener);
        }
    },
    /**
     * Le manuel du meneur — lecture seule.
     *
     * Une seule methode : il n'y a rien a ecrire. Voir
     * `electron/guidesDuManuel.ts`.
     */
    aide: {
        guides: (): Promise<GuideDuManuel[]> => ipcRenderer.invoke('aide:guides'),
    },
    /**
     * La semence d'une instance de repetition — `null` partout ailleurs.
     * Voir `electron/perimetreDeLInstance.ts`.
     */
    semence: {
        lire: (): Promise<unknown | null> => ipcRenderer.invoke('semence:lire'),
    },
    debug: {
        openConsole: () => ipcRenderer.send('debug:open-console')
    },
    session: {
        launchHubWindow: (mode?: string) => ipcRenderer.send('session:launch-hub-window', mode),
        saveSession: (data: unknown) => ipcRenderer.invoke('save-session', data),
        loadSession: () => ipcRenderer.invoke('load-session'),
    },
    npc: {
        listDatabases: (category: string) => ipcRenderer.invoke('npc:list-databases', category),
        loadDatabase: (category: string, name: string) => ipcRenderer.invoke('npc:load-database', category, name),
        selectAvatar: () => ipcRenderer.invoke('npc:select-avatar'),
        saveAvatar: (buffer: ArrayBuffer, fileName: string) => ipcRenderer.invoke('npc:save-avatar', buffer, fileName)
    },
    tables: {
        listUniverses: () => ipcRenderer.invoke('tables:list-universes'),
        listTables: (universe: string) => ipcRenderer.invoke('tables:list-tables', universe),
        loadTable: (universe: string, tableName: string) => ipcRenderer.invoke('tables:load-table', universe, tableName)
    },
    web: {
        openExternal: (url: string) => ipcRenderer.send('web:open-external', url),
        saveList: (data: unknown) => ipcRenderer.invoke('web:save-list', data),
        loadList: () => ipcRenderer.invoke('web:load-list'),
    },
    image: {
        getDisplays: () => ipcRenderer.invoke('image:get-displays'),
        syncHubData: (type: 'image' | 'video' | 'entity' | 'voice-level' | 'titre' | 'son-video', data: string) => ipcRenderer.send('image:sync-hub-data', type, data),
        launchDisplay: (paths: string[], target: string) => ipcRenderer.send('image:launch-display', paths, target),
        /*
          **Un écran qui s'ouvre demande le titre en cours.** Sans ça, le titre
          d'une séquence qui vient d'ouvrir la fenêtre de projection est émis
          avant que le rendu n'écoute — et il est perdu, pas en retard.
        */
        requestCurrentTitle: (cible: string) => ipcRenderer.send('image:request-current-title', cible),
        /*
          ⛔ **Et l'IMAGE avait le même trou, béant depuis toujours.**

          Le processus principal répond déjà à `image:request-current-display`
          depuis longtemps — **et personne ne l'appelait**. Un récepteur sans
          émetteur ne lève aucune erreur.

          Sans cet appel, une fenêtre de projection qui vient de naître dépend
          d'un message émis sur `did-finish-load`, c'est-à-dire **avant que React
          n'ait attaché son écouteur** : le message est perdu, pas en retard. Le
          projecteur retombait alors sur le magasin, qui porte la **marque** de ce
          qui occupe l'écran — et non le chemin de son fichier. Les deux
          coïncidaient par hasard pour Image-OS ; pour un lieu de l'Atlas ou le
          portrait d'un PNJ, la marque ne désigne aucun média, et **rien ne se
          chargeait**. Trouvé par David le 2026-09-06.
        */
        requestCurrentDisplay: (cible: string) => ipcRenderer.send('image:request-current-display', cible),
        closeAllDisplays: () => ipcRenderer.send('image:close-all-displays'),

        /**
         * Ce que le processus principal ordonne d'afficher sur cet ecran.
         *
         * Ecoute par la fenetre de projection. Rend la fonction de retrait :
         * sans elle, chaque remontage du composant ajoutait un ecouteur de plus,
         * et l'image se redessinait autant de fois qu'il y avait eu de montages.
         */
        onUpdateDisplay: (rappel: (chemins: string[]) => void) => {
            const ecouteur = (_event: Electron.IpcRendererEvent, chemins: string[]) => rappel(chemins);
            ipcRenderer.on('image:update-display', ecouteur);
            return () => ipcRenderer.off('image:update-display', ecouteur);
        },

        /** Le pendant en lecture de `syncHubData` : meme canal, meme couple (type, donnee). */
        onSyncHubData: (rappel: (type: string, donnee: string) => void) => {
            const ecouteur = (_event: Electron.IpcRendererEvent, type: string, donnee: string) => rappel(type, donnee);
            ipcRenderer.on('image:sync-hub-data', ecouteur);
            return () => ipcRenderer.off('image:sync-hub-data', ecouteur);
        }
    },
    sound: {
        loadAudios: () => ipcRenderer.invoke('sound:load-audios')
    },
    tactical: {
        listSounds: () => ipcRenderer.invoke('tactical:list-sounds')
    },
    light: {
        request: (url: string, method: string, body?: unknown, headers?: Record<string, string>) =>
            ipcRenderer.invoke('light:request', url, method, body, headers)
    },
    /**
     * L'afficheur Ulanzi emprunte le relais HTTP du Light OS.
     *
     * C'est un alias, pas un second canal : un nom juste côté rendu, et un seul
     * relais à tenir côté principal. Voir `light:request` dans `main.ts`.
     */
    ulanzi: {
        request: (url: string, method: string, body?: unknown, headers?: Record<string, string>) =>
            ipcRenderer.invoke('light:request', url, method, body, headers),

        /*
          **Rendre l'appareil à la fermeture — signalé par David le 2026-08-30 :**
          *« quand je ferme l'application, le Ulanzi ne reprend pas sa routine »*.

          La restitution vivait dans un nettoyage d'effet React, et **fermer une
          fenêtre Electron ne démonte pas l'arbre React** : le nettoyage n'était
          même pas appelé. Quand bien même, il tirait quatre requêtes HTTP sans
          les attendre dans un rendu qu'on détruisait. *Une restitution ne peut
          pas vivre dans un processus qui meurt avant elle.*

          D'où ce rail, le même que la sauvegarde de sortie : le principal
          **retient la fermeture** pendant que le rendu, encore vivant, rend la
          main — et le rendu dit quand il a fini.
        */
        surDemandeDeFermeture: (rappel: () => void) => {
            /*
              **Un seul abonné, quoi qu'il arrive.** React tourne en
              `StrictMode` : il monte chaque effet **deux fois** en
              développement. Deux abonnements, donc deux réponses — et le
              principal ne retient la fermeture que jusqu'à la **première**.
              La plus rapide gagnait, et c'était celle qui n'avait rien fait.
            */
            ipcRenderer.removeAllListeners('ulanzi:before-quit');
            ipcRenderer.on('ulanzi:before-quit', () => rappel());
        },
        /** « J'ai rendu » — sans quoi la fermeture attend le délai de sécurité. */
        fermetureTerminee: () => ipcRenderer.send('ulanzi:before-quit-done'),

        /**
         * Dépose les icônes animées du signal, et dit **ce qui manque encore**.
         * Ne dépose que ce qui manque : le cas courant est donc une seule
         * lecture.
         *
         * **Le seul envoi binaire du projet**, et il ne passe pas par le relais
         * JSON : `light:request` sérialise son corps, ce qui détruirait un GIF.
         *
         * `manquantes` vide est la seule preuve que le signal peut s'afficher —
         * c'est ce qui règle la veille du battement.
         */
        deposerLesIcones: (hote: string): Promise<{ deposees: string[]; manquantes: string[] }> =>
            ipcRenderer.invoke('ulanzi:deposer-icones', hote),
    },
    clock: {
        listCalendars: () => ipcRenderer.invoke('clock:list-calendars'),
        loadCalendar: (id: string) => ipcRenderer.invoke('clock:load-calendar', id)
    },
    utils: {
        formatFileUrl: (path: string) => {
            if (!path) return '';
            // Si le chemin contient déjà un protocole (ex: gmos://, http://, data:), on le retourne tel quel
            if (path.includes('://') || path.startsWith('data:')) return path;
            const normalized = path.replace(/\\/g, '/');
            return `file:///${encodeURI(normalized).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
        }
    },
    ai: {
        listDocs: () => ipcRenderer.invoke('ai:list-docs'),
        /** Dossiers sous docs/systems/, pour resoudre le corpus d'un systeme. */
        listSystems: (): Promise<string[]> => ipcRenderer.invoke('ai:list-systems'),
        /** Fichiers d'un dossier de docs/, sans recursion. */
        listDir: (relativePath: string): Promise<string[]> => ipcRenderer.invoke('ai:list-dir', relativePath),
        /** Supprime un document — les brouillons de la Forge, une fois publies. */
        deleteDoc: (relativePath: string): Promise<boolean> => ipcRenderer.invoke('ai:delete-doc', relativePath),
        /** Cree les dossiers d'un corpus. Rend ceux qui ont reellement ete crees. */
        createCorpus: (dossiers: string[]): Promise<string[]> => ipcRenderer.invoke('ai:create-corpus', dossiers),
        /** Resout les sections citees par une fiche en pages de l'index du livre. */
        resolveSections: (systeme: string, contenuFiche: string) =>
            ipcRenderer.invoke('ai:resolve-sections', systeme, contenuFiche),
        readDoc: (filePath: string) => ipcRenderer.invoke('ai:read-doc', filePath),
        writeDoc: (filePath: string, content: string) => ipcRenderer.invoke('ai:write-doc', filePath, content),
        /*
          ⛔ **Ce nom s'ecrivait `extractPDF` et son unique appelant
          `extractPdf`.** Le contrat declarait LES DEUX, donc le typage
          n'avait rien a dire, l'appel optionnel valait `undefined`, et
          `RAGService` concluait simplement que le PDF ne contenait rien.
          *Aucun PDF du corpus n'a jamais nourri la Forge.*

          On garde la graphie de ses voisins (`readDoc`, `writeDoc`) :
          `PDF` en capitales invitait la faute a se reproduire.
        */
        extractPdf: (filePath: string) => ipcRenderer.invoke('ai:extract-pdf', filePath),
        /**
         * @param fournisseur Pour qui cet appel parle. Le processus principal
         *        s'en sert pour verifier que l'hote vise est ouvert a ce
         *        fournisseur — voir `hotesDesFournisseurs.ts`. Les cles voyagent
         *        dans les en-tetes, et celle de Gemini dans l'URL elle-meme.
         */
        proxyRequest: (url: string, method: string, headers: Record<string, string>, body: unknown, fournisseur: FournisseurReseau) => 
            ipcRenderer.invoke('ai:proxy-request', url, method, headers, body, fournisseur),
        chercherDansLIndex: (
            systeme: string,
            question: string,
        ): Promise<{ indexDisponible: boolean; trouvailles: { titre: string; page: number; mots: number }[] }> =>
            ipcRenderer.invoke('ai:chercher-index', systeme, question),
        searchContext: (
            systemId: string,
            campaignName: string,
            options?: {
                query?: string; systemName?: string; systemPath?: string; campaignPath?: string;
                maxTokens?: number;
                /** Le penchant du cortex qui pose la question — `regles` ou `campagne`. */
                penchant?: 'regles' | 'campagne';
            },
        ): Promise<{ context: string; sources: { path: string; relu?: boolean; aRegenerer?: boolean; provenance: string; sujet?: string }[] }> =>
            ipcRenderer.invoke('ai:search-context', systemId, campaignName, options),
        reindex: () => ipcRenderer.invoke('ai:reindex'),
        /**
         * Le coffre Obsidian, **en plus** de `docs/`. `null` l'éteint.
         *
         * Volontairement séparé de `reindex`, qui n'accepte aucun argument et
         * ne doit jamais en accepter : c'est par là que la racine du corpus
         * s'était fait remplacer.
         */
        coffreBrancher: (chemin: string | null): Promise<{ accepte: boolean; raison?: string }> =>
            ipcRenderer.invoke('ai:coffre-brancher', chemin),
        coffreEtat: (): Promise<{ chemin: string | null; fichiers: number }> =>
            ipcRenderer.invoke('ai:coffre-etat'),
        // Ollama Local AI
        ollamaChat: (
            model: string,
            messages: { role: string; content: string }[],
            endpoint?: string,
            options?: { json?: boolean; schema?: Record<string, unknown>; num_ctx?: number; num_predict?: number },
            /**
             * Nom et libellé de la requête. Un `AbortSignal` ne traverse pas
             * l'IPC — il n'est pas sérialisable —, donc on échange une identité
             * et le contrôleur reste du côté où vit le `fetch`. Le libellé sert
             * à dire au meneur CE QUI tourne, pas seulement qu'il se passe
             * quelque chose.
             */
            requete?: { id: string; libelle: string },
        ) => ipcRenderer.invoke('ai:ollama-chat', model, messages, endpoint, options, requete),
        ollamaChatStream: (
            model: string,
            messages: { role: string; content: string }[],
            endpoint?: string,
            // Les mêmes options que `ollamaChat`. Elles ne voyageaient pas :
            // le flux partait sans borne de génération ni `think: false`.
            options?: { num_ctx?: number; num_predict?: number },
            requete?: { id: string; libelle: string },
        ) => ipcRenderer.invoke('ai:ollama-chat-stream', model, messages, endpoint, options, requete),

        /** Arrête une requête en vol. Rend `false` si elle était déjà finie. */
        ollamaAbort: (requeteId: string): Promise<boolean> => ipcRenderer.invoke('ai:ollama-abort', requeteId),
        /** Ce qui tourne, nommé et daté — de quoi montrer le verrou. */
        ollamaEnVol: (): Promise<{ id: string; libelle: string; depuis: number }[]> => ipcRenderer.invoke('ai:ollama-en-vol'),
        /**
         * Charge le modèle d'avance, à l'ouverture de la séance.
         *
         * Rend `false` sans bruit si Ollama ne répond pas : un préchauffage
         * raté ne coûte que le démarrage qu'on payait déjà.
         */
        ollamaPrechauffer: (model: string, endpoint?: string): Promise<boolean> =>
            ipcRenderer.invoke('ai:ollama-prechauffer', model, endpoint),
        ollamaStatus: (endpoint?: string) => ipcRenderer.invoke('ai:ollama-status', endpoint),
        ollamaListModels: (endpoint?: string) => ipcRenderer.invoke('ai:ollama-list-models', endpoint),
        ollamaPull: (model: string, endpoint?: string) => ipcRenderer.invoke('ai:ollama-pull', model, endpoint),
        ollamaGenerateImage: (model: string, prompt: string, endpoint?: string, requete?: { id: string; libelle: string }) => ipcRenderer.invoke('ai:ollama-generate-image', model, prompt, endpoint, requete),
        onStreamToken: (callback: (token: string) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, token: string) => callback(token);
            ipcRenderer.on('ai:ollama-stream-token', listener);
            return () => ipcRenderer.off('ai:ollama-stream-token', listener);
        }
    },
    mcp: {
        listTools: (serverName: string) => ipcRenderer.invoke('mcp:list-tools', serverName),
        callTool: (serverName: string, toolName: string, args: Record<string, unknown>) => 
            ipcRenderer.invoke('mcp:call-tool', serverName, toolName, args),
        reauthenticate: () => ipcRenderer.invoke('mcp:reauthenticate'),
        restart: () => ipcRenderer.invoke('mcp:restart'),
        /**
         * Journal d'activité du pont : requête partie, réponse reçue et sa durée,
         * lignes du serveur quand il en émet. C'est la seule visibilité possible
         * pendant un appel — `callTool` est un aller-retour sans rien entre les
         * deux, et une génération peut attendre plusieurs minutes.
         */
        onActivity: (callback: (evenement: unknown) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, evenement: unknown) => callback(evenement);
            ipcRenderer.on('mcp:activity', listener);
            return () => ipcRenderer.off('mcp:activity', listener);
        }
    },
    /**
     * Le verrou de la souris des joueurs (Windows). Voir `sourisDesJoueurs.ts` :
     * toute coupure se rend d'elle-même si elle n'est pas confirmée.
     */
    souris: {
        inventaire: (): Promise<{ id: string; nom: string; active: boolean }[]> =>
            ipcRenderer.invoke('souris:inventaire'),
        couper: (id: string): Promise<{ ok: boolean; message?: string; retourDans?: number }> =>
            ipcRenderer.invoke('souris:couper', id),
        confirmer: (id: string): Promise<{ ok: boolean }> => ipcRenderer.invoke('souris:confirmer', id),
        rendre: (id: string): Promise<{ ok: boolean; message?: string }> =>
            ipcRenderer.invoke('souris:rendre', id),
    },
    obsidian: {
        listNotes: (vaultPath?: string) => ipcRenderer.invoke('obsidian:list-notes', vaultPath),
        readNote: (relativePath: string, vaultPath?: string) => ipcRenderer.invoke('obsidian:read-note', relativePath, vaultPath),
        writeNote: (relativePath: string, content: string, vaultPath?: string) => ipcRenderer.invoke('obsidian:write-note', relativePath, content, vaultPath),
        ensureDirectory: (relativePath: string, vaultPath?: string) => ipcRenderer.invoke('obsidian:ensure-directory', relativePath, vaultPath),
        vaultExists: (vaultPath?: string) => ipcRenderer.invoke('obsidian:vault-exists', vaultPath),
        selectVault: () => ipcRenderer.invoke('obsidian:select-vault')
    },
    remote: {
        getConnectionInfo: () => ipcRenderer.invoke('remote:get-connection-info'),
        onAction: (callback: (data: unknown) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
            ipcRenderer.on('remote:action', listener);
            return () => ipcRenderer.off('remote:action', listener);
        },
        removeActions: () => ipcRenderer.removeAllListeners('remote:action'),
        /**
         * ⚠️ **Le role compte ici autant que pour `broadcastUIAction` ci-dessous.**
         *
         * Cette methode l'avalait, alors que `SyncServer` le lit depuis toujours
         * (`ipcMain.on('remote:broadcast-sync', (_e, data, role) => ...)`).
         * `useNexusSynchronizer` envoie quatre fois : la charge complete aux
         * roles `remote` et `gm`, et une charge **caviardee** aux roles `player`
         * et `hub`. Perdre le role ferait partir la version non caviardee a
         * tout le monde — *un secret caviarde a l'affichage a deja voyage*.
         *
         * Sans role, tout le monde recoit : c'est ce que fait `useCombatStore`,
         * et c'est voulu.
         */
        sendSync: (data: unknown, role?: string) => ipcRenderer.send('remote:broadcast-sync', data, role),

        /** La synchronisation venue du meneur, telle que la recoivent hub et projecteur. */
        onBroadcastSync: (rappel: (donnees: unknown) => void) => {
            const ecouteur = (_event: Electron.IpcRendererEvent, donnees: unknown) => rappel(donnees);
            ipcRenderer.on('remote:broadcast-sync', ecouteur);
            return () => ipcRenderer.off('remote:broadcast-sync', ecouteur);
        },

        /* ── Le moniteur de salon ───────────────────────────────────────────
           Quatre gestes qui passaient par le pont generique, donc hors contrat.
           `ejectAll` deconnecte toute la table : il merite d'etre nomme. */

        /** La liste des appareils connectes, poussee par le SyncServer. */
        onSyncClients: (rappel: (clients: unknown[]) => void) => {
            const ecouteur = (_event: Electron.IpcRendererEvent, clients: unknown[]) => rappel(clients);
            ipcRenderer.on('remote:sync-clients', ecouteur);
            return () => ipcRenderer.off('remote:sync-clients', ecouteur);
        },
        /**
         * Le processus principal reclame une synchronisation complete — il le
         * fait a chaque connexion d'un appareil (`SyncServer.handleConnection`).
         * Ecoute par la fenetre du meneur, qui seule detient l'etat.
         */
        onRequestSync: (rappel: () => void) => {
            const ecouteur = () => rappel();
            ipcRenderer.on('remote:request-sync', ecouteur);
            return () => ipcRenderer.off('remote:request-sync', ecouteur);
        },
        requestClientSync: () => ipcRenderer.send('remote:request-client-sync'),
        clearDisconnected: () => ipcRenderer.send('remote:clear-disconnected'),
        ejectAll: () => ipcRenderer.send('remote:eject-all'),
        /*
          **Le rôle destinataire, ajouté le 2026-09-05.**

          `SyncServer.broadcastAction` sait viser un rôle depuis toujours — son
          troisième paramètre —, et **le pont l'avalait** : tout partait à tout
          le monde. Sans lui, répondre à une tablette de meneur déposerait la
          réponse **sur l'appareil de chaque joueur**.

          *C'est la règle de `mainsPourLaTable` : un secret caviardé à
          l'affichage a déjà voyagé.* Elle s'applique ici au coffre Obsidian,
          qui est le carnet privé du meneur.
        */
        broadcastUIAction: (action: unknown, role?: string) =>
            ipcRenderer.send('remote:broadcast-ui-action', action, role),
        cacheMedia: (buffer: ArrayBuffer, id: string) => ipcRenderer.invoke('remote:cache-media', buffer, id),
    },
    relay: {
        // Relais entre fenêtres locales par le process principal.
        // Le message est une chaîne DÉJÀ sérialisée : la sérialisation d'Electron
        // coûte proportionnellement au nombre de nœuds d'objet traversés, et le
        // relais refuse tout ce qui n'est pas une chaîne. Voir electron/WindowRelay.ts.
        // Le type voyage à côté du corps : le process principal arbitre par type
        // sans avoir à ouvrir le JSON. Voir electron/relayPolicy.ts.
        publish: (type: string, message: string) => ipcRenderer.send('relay:publish', type, message),
        onMessage: (callback: (message: string, senderRole: string) => void) => {
            // `senderRole` est établi par le process principal, pas par
            // l'émetteur : c'est ce qui le rend digne de confiance côté MJ.
            const listener = (
                _event: Electron.IpcRendererEvent,
                message: string,
                senderRole: string,
            ) => callback(message, senderRole);
            ipcRenderer.on('relay:message', listener);
            return () => ipcRenderer.off('relay:message', listener);
        },
    },
    pairing: {
        // Secret partagé permettant à un appareil de réclamer un rôle privilégié.
        getSecret: (): Promise<string> => ipcRenderer.invoke('pairing:get-secret'),
        rotate: (): Promise<string> => ipcRenderer.invoke('pairing:rotate'),
    },
    logger: {
        info: (message: string, ...args: unknown[]) => ipcRenderer.send('log:message', 'info', message, ...args),
        warn: (message: string, ...args: unknown[]) => ipcRenderer.send('log:message', 'warn', message, ...args),
        error: (message: string, ...args: unknown[]) => ipcRenderer.send('log:message', 'error', message, ...args),
        debug: (message: string, ...args: unknown[]) => ipcRenderer.send('log:message', 'debug', message, ...args),
    },
    security: {
        getSecret: (id: string) => ipcRenderer.invoke('security:get-secret', id),
        saveSecret: (id: string, value: string) => ipcRenderer.invoke('security:set-secret', id, value),
        deleteSecret: (id: string) => ipcRenderer.invoke('security:delete-secret', id),
        /** L'état du coffre et les noms de ses entrées — jamais les valeurs. */
        etatDuCoffre: () => ipcRenderer.invoke('security:etat'),
    },
    /*
      **`git` a été retiré ici le 2026-08-27, et ne doit pas revenir.**

      Ce pont exposait `git:status`, `git:setup-branch` et `git:sync`. Leurs
      gestionnaires étaient déjà commentés dans `main.ts` — mais le levier
      restait sur le tableau de bord, et il s'appelait `syncData`. Ce qu'il
      commandait autrefois : `git stash`, `git checkout data-sync`, `git push`,
      dans le dépôt de GM-OS lui-même. **Il vidait l'application.**

      Une sauvegarde écrit un fichier ; elle n'exécute aucune commande de
      gestion de version. Voir `sauvegardeAutomatique.ts`.
    */
    sauvegarde: {
        /** Écrit une sauvegarde automatique, sans dialogue, sous `userData/backups`. */
        ecrire: (donnees: unknown, options?: { baisseAttendue?: boolean }) =>
            ipcRenderer.invoke('backup:auto-write', donnees, options),
        /** Ce que le dossier contient déjà — la plus récente d'abord. */
        lister: () => ipcRenderer.invoke('backup:list'),
        /** Ouvre le dossier des sauvegardes dans l'explorateur. */
        ouvrirLeDossier: () => ipcRenderer.invoke('backup:reveal'),
        /** GM-OS va se fermer : dernière occasion d'écrire. */
        surDemandeDeFermeture: (rappel: () => void) => {
            /*
              ⛔ **Un seul abonné, comme pour le jumeau Ulanzi (2026-08-30).**

              `StrictMode` monte chaque effet DEUX fois : sans ce nettoyage, deux
              rappels s'abonnent et deux `fermetureTerminee()` partent. Or le
              processus principal attend avec `ipcMain.once` — **la première
              réponse libère la fermeture**, et la plus rapide est celle qui n'a
              rien écrit.

              Le remède est en place sur `ulanzi:before-quit` depuis le 30/08,
              avec ce raisonnement mot pour mot. Il n'avait jamais été reporté
              ici, sur le chemin qui porte la sauvegarde automatique — celui où
              perdre la course coûte le plus cher. Reporté le 2026-09-10.
            */
            ipcRenderer.removeAllListeners('backup:before-quit');
            ipcRenderer.on('backup:before-quit', () => rappel());
        },
        /** « J'ai fini » — sans quoi la fermeture attend le délai de sécurité. */
        fermetureTerminee: () => ipcRenderer.send('backup:before-quit-done'),

        /*
          **Le miroir des médias — chantier n° 4.**

          Les images ne passent pas par `ecrire` : 261 Mo mesurés chez David, et
          la sauvegarde de session en porterait une copie complète à chaque fois.
          Le miroir écrit CHAQUE image UNE fois. `mediasCopies` est ce qui rend
          l'incrément possible — sans elle il faudrait relire 261 Mo à chaque
          passage, et la sauvegarde de sortie n'en aurait jamais le temps.
        */
        mediasCopies: (): Promise<string[]> => ipcRenderer.invoke('miroir:medias-copies'),
        copierUnMedia: (id: string, octets: ArrayBuffer) =>
            ipcRenderer.invoke('miroir:copier-media', id, octets),
        inscrireAuCatalogue: (fiches: unknown[]) =>
            ipcRenderer.invoke('miroir:catalogue', fiches),

        /* Le retour. Sans lui, le miroir n'est qu'un dossier plein d'octets. */
        lireLeCatalogue: () => ipcRenderer.invoke('miroir:lire-catalogue'),
        lireUnMedia: (id: string): Promise<ArrayBuffer | null> =>
            ipcRenderer.invoke('miroir:lire-media', id),
    },
    nexus: {
        selectExportPath: (bundleType?: 'campaign' | 'driver') => ipcRenderer.invoke('nexus:select-export-path', bundleType),
        selectImportFile: () => ipcRenderer.invoke('nexus:select-import-file'),
        // Streaming d'un seul asset vers le main process (évite la limite de taille IPC)
        registerAsset: (mediaHubId: string, dataUrl: string) =>
            ipcRenderer.invoke('nexus:register-asset', mediaHubId, dataUrl),
        clearAssets: () => ipcRenderer.invoke('nexus:clear-assets'),
        exportBundle: (
            contextId: string,
            outputPath: string,
            stateJson: string,
            manifestJson: string,
            assetRefs: string[]
        ) => ipcRenderer.invoke('nexus:export-bundle', contextId, outputPath, stateJson, manifestJson, assetRefs),
        importBundle: (filePath: string) => ipcRenderer.invoke('nexus:import-bundle', filePath),
    }
})


// Note: appBridge is the ONLY authorized gateway. ipcRenderer exposure is forbidden.
