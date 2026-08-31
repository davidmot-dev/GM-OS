import { contextBridge, ipcRenderer, webUtils } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('appBridge', {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args
        return ipcRenderer.off(channel, ...omit)
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args
        return ipcRenderer.send(channel, ...omit)
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args
        return ipcRenderer.invoke(channel, ...omit)
    },
    getPathForFile(file: File) {
        return webUtils.getPathForFile(file)
    },
    app: {
        quit: () => ipcRenderer.send('app:quit'),
        onDisplayChanged: (callback: (count: number) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, count: number) => callback(count);
            ipcRenderer.on('app:display-changed', listener);
            return () => ipcRenderer.off('app:display-changed', listener);
        }
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
        syncHubData: (type: 'image' | 'entity' | 'voice-level', data: string) => ipcRenderer.send('image:sync-hub-data', type, data),
        launchDisplay: (paths: string[], target: string) => ipcRenderer.send('image:launch-display', paths, target),
        closeAllDisplays: () => ipcRenderer.send('image:close-all-displays')
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
        extractPDF: (filePath: string) => ipcRenderer.invoke('ai:extract-pdf', filePath),
        proxyRequest: (url: string, method: string, headers: Record<string, string>, body: unknown) => 
            ipcRenderer.invoke('ai:proxy-request', url, method, headers, body),
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
        sendSync: (data: unknown) => ipcRenderer.send('remote:broadcast-sync', data),
        broadcastUIAction: (action: unknown) => ipcRenderer.send('remote:broadcast-ui-action', action),
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
