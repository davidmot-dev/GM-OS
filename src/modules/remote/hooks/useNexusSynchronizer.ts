import { useCallback, useEffect, useRef } from 'react';

import { useSoundStore } from '../../sound/useSoundStore';
import { useStoryboardStore } from '../../storyboard/useStoryboardStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useFavoriteStore } from '../../favorite/useFavoriteStore';
import { useWhiteboardStore } from '../../whiteboard/useWhiteboardStore';
import { useClockStore, jaugesVuesParLesJoueurs } from '../../../store/useClockStore';
import { useMusicStore } from '../../music/useMusicStore';
import { useImageStore } from '../../image/useImageStore';
import { useAmbientStore } from '../../ambient/useAmbientStore';

import { useDiceStore } from '../../../stores/useDiceStore';
import { useMapStore } from '../../map/useMapStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { getDifferentialPayload } from '../../../utils/syncUtils';
import { resolveToSendableUrl } from '../../../utils/mediaResolver';
import { crossWindowSync } from '../../../services/CrossWindowEventService';
import { cartesRestantesPourLaTable, mainsPourLaTable } from '../../session/logic/mainsDuPaquet';

/**
 * Intervalle minimal entre deux synchronisations **forcées**.
 *
 * Assez court pour qu'un appareil qui se connecte ne le remarque pas, assez
 * long pour qu'une tablette qui se reconnecte en boucle ne déclenche pas autant
 * de synchronisations complètes.
 */
const FORCED_SYNC_FLOOR_MS = 1000;

export const useNexusSynchronizer = (isMainPC: boolean) => {
    const lastSyncRef = useRef(0);
    /** Dernière synchronisation **forcée**, pour en borner la cadence. */
    const lastForcedSyncRef = useRef(0);
    /** Rafale en cours : la dernière valeur part à l'expiration du frein. */
    const trailingSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** Toujours la version courante de `handleSync`, pour que le report s'y réfère. */
    const handleSyncRef = useRef<((force?: boolean) => void) | null>(null);
    const lastBroadcastRef = useRef<Record<string, unknown>>({});
    const lastMapFastSyncRef = useRef(0);
    const lastWhiteboardFastSyncRef = useRef(0);

    const syncFast = useCallback((segmentName: string) => {
        if (!isMainPC) return;
        // Avoid re-broadcasting updates that are already being handled by CrossWindowSync
        if (crossWindowSync.isSyncing()) return;

        // Throttle map fast sync to avoid flooding the network (e.g. 100ms = 10fps)
        if (segmentName === 'map') {
            const now = Date.now();
            if (now - lastMapFastSyncRef.current < 100) return;
            lastMapFastSyncRef.current = now;
        }

        // Throttle whiteboard fast sync during drawing to 50ms (20fps), but bypass on end (activePath: null)
        if (segmentName === 'whiteboard') {
            const s = useWhiteboardStore.getState();
            const now = Date.now();
            const isDrawingEnd = s.activePath === null;
            if (!isDrawingEnd && (now - lastWhiteboardFastSyncRef.current < 50)) return;
            lastWhiteboardFastSyncRef.current = now;
        }
        
        try {
            const payload: Record<string, unknown> = {};
            if (segmentName === 'dice') {
                const s = useDiceStore.getState();
                payload.dice = { lastRoll: s.lastRoll, isDiceProjected: s.isDiceProjected, projectionTrigger: s.projectionTrigger };
            } else if (segmentName === 'clock') {
                const s = useClockStore.getState();
                payload.clock = { 
                    timestamp: s.timestamp, mode: s.mode, isClockProjected: s.isClockProjected, 
                    theme: s.theme, tensions: jaugesVuesParLesJoueurs(s.tensions), timerRemaining: s.timerRemaining,
                    timerIsRunning: s.timerIsRunning, timerLabel: s.timerLabel, timerDuration: s.timerDuration
                };
            } else if (segmentName === 'combat') {
                const s = useCombatStore.getState();
                // `isCombatProjected` fait partie du segment, comme `isClockProjected`
                // pour l'horloge : sans lui, un destinataire qui ne recevrait que ce
                // segment garderait indéfiniment son ancien état de projection.
                payload.combat = {
                    combatants: s.combatants,
                    currentTurnIdx: s.currentTurnIdx,
                    round: s.round,
                    isCombatProjected: s.isCombatProjected,
                };
            } else if (segmentName === 'whiteboard') {
                const s = useWhiteboardStore.getState();
                payload.whiteboard = { 
                    paths: s.paths,
                    activePath: s.activePath, 
                    laserPointer: s.laserPointer, 
                    activeDrawerId: s.activeDrawerId, 
                    backgroundMode: s.backgroundMode,
                    pathsCount: s.paths.length, 
                    version: s.version
                };
            } else if (segmentName === 'map') {
                const s = useMapStore.getState();
                payload.map = {
                    projectionTarget: s.projectionTarget,
                    projectedMapUrl: s.projectedMapUrl,
                    projectedIsVideo: s.projectedIsVideo,
                    projectedTokens: s.projectedTokens,
                    projectedPings: s.projectedPings,
                    projectedFogDataUrl: s.projectedFogDataUrl,
                    projectedMapWidth: s.projectedMapWidth,
                    projectedMapHeight: s.projectedMapHeight,
                    projectedIsGridEnabled: s.projectedIsGridEnabled,
                    projectedGridSize: s.projectedGridSize,
                    projectedGridColor: s.projectedGridColor,
                    projectedGridOpacity: s.projectedGridOpacity,
                    projectedIsMapMuted: s.projectedIsMapMuted,
                    projectedMapVolume: s.projectedMapVolume
                };
            }

            if (Object.keys(payload).length > 0 && window.appBridge) {
                window.appBridge.send('remote:broadcast-sync', payload, 'remote');
                window.appBridge.send('remote:broadcast-sync', payload, 'gm');
                window.appBridge.send('remote:broadcast-sync', payload, 'player');
                window.appBridge.send('remote:broadcast-sync', payload, 'hub');
            }
        } catch (e) {
            console.error(`[NexusSync] Fast-Sync Error (${segmentName}):`, e);
        }
    }, [isMainPC]);

    const handleSync = useCallback(async (force: boolean = false) => {
        if (!isMainPC) return;
        
        // Skip sync if the system is performing an atomic operation (Nexus import)
        if (useSessionOSStore.getState().isSystemSyncing || crossWindowSync.isSyncing()) {
            console.log('[NexusSync] Sync skipped: system or cross-window sync in progress.');
            return;
        }

        const now = Date.now();

        // Une demande forcée court-circuite le frein, et c'est voulu : un
        // appareil qui se connecte doit recevoir l'état sans attendre. Mais rien
        // n'en bornait la cadence, et `remote:request-sync` est déclenché par le
        // réseau — à chaque connexion de socket (SyncServer), et sur simple
        // message d'une tablette. Une tablette qui se reconnecte en boucle
        // relançait donc autant de synchronisations complètes, résolution des
        // médias comprise.
        //
        // Le plancher ne refuse pas la demande : il la reporte, et les demandes
        // d'une même rafale se fondent en une seule.
        if (force && now - lastForcedSyncRef.current < FORCED_SYNC_FLOOR_MS) {
            const reste = FORCED_SYNC_FLOOR_MS - (now - lastForcedSyncRef.current);
            if (trailingSyncRef.current) clearTimeout(trailingSyncRef.current);
            trailingSyncRef.current = setTimeout(() => {
                trailingSyncRef.current = null;
                handleSyncRef.current?.(true);
            }, reste);
            return;
        }
        if (force) lastForcedSyncRef.current = now;

        if (!force && now - lastSyncRef.current < 500) {
            // Report plutôt qu'abandon. Un `return` sec perdait définitivement la
            // dernière valeur d'une rafale : l'état diffusé restait celui d'avant,
            // sans que rien ne le rattrape.
            //
            // C'est la seule voie qu'emprunte le combat — `useCombatStore` est
            // abonné à `handleSync`, quand l'horloge, le tableau et la carte
            // passent par `syncFast`, qui ne freine ni l'horloge ni les dés. D'où
            // une bascule de projection qui s'appliquait pour ces trois-là et pas
            // pour le combat.
            if (trailingSyncRef.current) clearTimeout(trailingSyncRef.current);
            trailingSyncRef.current = setTimeout(() => {
                trailingSyncRef.current = null;
                handleSyncRef.current?.(true);
            }, 500 - (now - lastSyncRef.current));
            return;
        }

        if (trailingSyncRef.current) {
            clearTimeout(trailingSyncRef.current);
            trailingSyncRef.current = null;
        }
        lastSyncRef.current = now;

        try {
            const soundStore = useSoundStore.getState();
            const storyboardStore = useStoryboardStore.getState();
            const combatStore = useCombatStore.getState();
            const freshSessionOS = useSessionOSStore.getState();
            const favoriteStore = useFavoriteStore.getState();
            const musicStore = useMusicStore.getState();
            const imageStore = useImageStore.getState();
            const ambientStore = useAmbientStore.getState();

            const clockStore = useClockStore.getState();
            const whiteboardStore = useWhiteboardStore.getState();
            const diceStore = useDiceStore.getState();
            const mapStore = useMapStore.getState();
            const reservesStore = useRessourcesDeTableStore.getState();

            const { sessions, campaigns, entities, players, activeCampaignId: currentCampaignId, clues, atlasMaps, customSheetTemplates, customGameDrivers } = freshSessionOS;

            /*
              **Le pilote de la campagne, pour le pupitre de la tablette.**

              *Défaut trouvé en corrigeant les dés échelonnés, le 2026-09-03 :*
              `RemoteSyncData` déclare `session.activeDiceConfig` depuis
              toujours, la tablette le lit — et **personne ne l'écrivait**. La
              carte « Système actif » et son bouton « Lancer Système » ne se sont
              donc jamais affichés : tout jet parti d'une tablette était un jet
              manuel. *Un champ déclaré des deux côtés et rempli par personne ne
              rend pas une erreur, il rend `undefined` — et une carte qui ne
              s'affiche pas ne se signale pas.*
            */
            const piloteActif = freshSessionOS.getActiveDriver();

            // 1. SOUNDS/PADS
            const atmosId = soundStore.activeAtmosphereId;
            const atmosphere = soundStore.atmospheres.find(a => a.id === atmosId) || soundStore.atmospheres[0];
            const sounds = atmosphere ? Object.values(atmosphere.pads).filter(p => !!p.filePath).map(p => ({
                id: p.id, title: p.title || p.id, active: true 
            })) : [];

            // 2. UNIVERSAL PADS
            /*
              **Quels pads sont actifs, et ce qui joue.**

              `RemoteUniversalPad.isActive` existait, la tablette dessinait son
              anneau lumineux — et **rien ne posait jamais le champ** : le point
              n'a donc pu s'allumer sur aucun pad depuis qu'il est écrit. Ce sont
              les deux platines de Music-OS et le thème chargé d'Ambient-OS qui
              détiennent la réponse ; il suffisait de la demander.
            */
            const platines = [musicStore.deckA, musicStore.deckB];
            const padsMusiqueActifs = new Set(
                platines.filter(d => d?.isPlaying && d.activePadId).map(d => d!.activePadId as string),
            );
            const pistesDAmbiance = ambientStore.tracks.filter(t => t.isPlaying).length;
            const themeDAmbianceActif = pistesDAmbiance > 0 ? ambientStore.themeChargeId : null;

            const musicPlaylist = musicStore.playlists.find(p => p.id === musicStore.activePlaylistId) || musicStore.playlists[0];
            const morceauxJouables = musicPlaylist?.pads.filter(p => !!p.url) || [];
            const musicPads = morceauxJouables.slice(0, 5).map(p => ({
                id: p.id, type: 'music' as const, label: p.label || 'Sans Nom', color: 'var(--accent)',
                isActive: padsMusiqueActifs.has(p.id),
            }));

            const toutesLesFavorites = imageStore.mediaList.filter(m => m.isFavorite);
            const favoriteImages = toutesLesFavorites.slice(0, 12);
            /* Une image projetée quelque part est un pad actif : le meneur voit d'un
               coup d'œil ce qui est déjà à l'écran, et n'a pas à le rappuyer. */
            const imagesProjetees = new Set(Object.values(imageStore.projections ?? {}).filter(Boolean) as string[]);
            const resolvedImagePads = await Promise.all(favoriteImages.map(async (m) => ({
                id: m.id, type: 'image' as const, label: m.name, imageUrl: await resolveToSendableUrl(m.path), color: 'var(--emerald-500)',
                isActive: imagesProjetees.has(m.id),
            })));

            /*
              **Les thèmes d'ambiance, ajoutés le 2026-09-04.**

              `sceneActions` savait déjà en lancer un depuis un pad — mais rien
              ne lui en envoyait jamais : la branche était **inatteignable**, et
              le guide d'Ambient-OS promettait depuis des mois un geste qui
              n'existait pas.

              Le sous-titre porte l'univers : deux jeux peuvent avoir leur
              « Taverne », et sur un téléphone on ne survole rien pour lever le
              doute.
            */
            const ambientPads = ambientStore.presets.slice(0, 8).map(p => ({
                id: p.id,
                type: 'ambient' as const,
                label: p.name,
                sublabel: p.universe,
                color: 'var(--cyan-500)',
                isActive: p.id === themeDAmbianceActif,
            }));

            const universalPads = [...musicPads, ...ambientPads, ...resolvedImagePads];

            /*
              **Les plafonds se disent.** La grille tronquait en silence : trente
              favoris en donnaient douze, et rien à l'écran ne l'indiquait. On
              envoie les deux nombres et la tablette écrit « 12 sur 30 » —
              *une liste tronquée sans le dire se lit comme une liste complète.*
            */
            const comptesDePads = {
                music: { montres: musicPads.length, total: morceauxJouables.length },
                ambient: { montres: ambientPads.length, total: ambientStore.presets.length },
                image: { montres: resolvedImagePads.length, total: toutesLesFavorites.length },
            };

            /*
              **Ce qui joue en ce moment.** Le flux portait ce qu'on peut
              déclencher et jamais ce qui est en cours : il fallait changer
              d'onglet — ou regarder l'écran du PC — pour savoir si une musique
              tournait.

              L'ambiance porte **son compte de pistes en plus de son nom** : une
              ambiance composée à la main n'a pas de thème, et dire « 3 pistes »
              reste vrai là où un nom serait inventé.
            */
            const platineQuiJoue = platines.find(d => d?.isPlaying);
            const lecture = {
                musique: platineQuiJoue?.activeTrackLabel ?? null,
                ambiance: ambientStore.presets.find(p => p.id === themeDAmbianceActif)?.name ?? null,
                pistesDAmbiance,
            };

            // 3. COMBAT & ENTITIES
            const resolvedCombatants = (await Promise.all(combatStore.combatants.map(async (c) => ({
                id: c.id, name: c.name, hp: c.hp, hpMax: c.hpMax, init: c.init, isPlayer: c.isPlayer,
                healthSystem: c.healthSystem, avatar: await resolveToSendableUrl(c.avatar || ''), statuses: c.statuses
            })))).filter(c => c.isPlayer || !c.statuses?.some(s => ['invisible', 'caché', 'hidden'].includes(s.name.toLowerCase())));

            // 4. SESSION & NOTES
            const activeSession = sessions.find(s => s.status === 'active' && String(s.campaignId) === String(currentCampaignId));
            const notes = {
                public: activeSession?.publicSummary || 'Aucun résumé public.',
                private: activeSession?.gmSecrets || 'Confidentiel.'
            };

            // ── RÉSOLUTION GLOBALE DES MÉDIAS (m-xxx → URL HTTP/base64) ────────
            // Champs réels utilisés par les composants Hub :
            //   Entity    → .avatar
            //   AtlasMap  → .fileUrl
            //   Clue      → .mediaUrl
            //   Player    → .avatarUrl  |  PlayerCharacter → .portraitUrl
            //   Favorite  → .imageUrl, .tokenUrl

            // 4a. Avatars des joueurs et portraits des personnages
            const resolvedPlayers = await Promise.all(players.map(async (player) => ({
                ...player,
                avatarUrl: player.avatarUrl ? await resolveToSendableUrl(player.avatarUrl) : undefined,
                characters: await Promise.all((player.characters || []).map(async (char) => ({
                    ...char,
                    portraitUrl: char.portraitUrl ? await resolveToSendableUrl(char.portraitUrl) : undefined,
                }))),
            })));

            // 4b. Avatars des entités (PNJ, créatures) — champ réel : .avatar
            const resolvedEntities = await Promise.all(entities.map(async (entity) => ({
                ...entity,
                avatar: entity.avatar ? await resolveToSendableUrl(entity.avatar) : '',
            })));

            // 4c. Images des lieux (AtlasMap) — champ réel : .fileUrl
            const resolvedAtlasMaps = await Promise.all(atlasMaps.map(async (map) => ({
                ...map,
                fileUrl: map.fileUrl ? await resolveToSendableUrl(map.fileUrl) : '',
            })));

            // 4d. Indices (Clue) — champ réel : .mediaUrl
            const resolvedClues = await Promise.all(clues.map(async (clue) => ({
                ...clue,
                mediaUrl: clue.mediaUrl ? await resolveToSendableUrl(clue.mediaUrl) : undefined,
            })));

            // 4e. Wallpaper de campagne
            const activeCampaign = campaigns.find(c => c.id === currentCampaignId);
            const rawWallpaper = activeCampaign?.wallpaperUrl || freshSessionOS.activeCampaignWallpaper;
            const resolvedWallpaper = rawWallpaper
                ? await resolveToSendableUrl(rawWallpaper)
                : null;

            if (resolvedWallpaper && rawWallpaper) {
                console.log(`[NexusSync] Wallpaper resolved: ${rawWallpaper.substring(0, 30)}... -> ${resolvedWallpaper.substring(0, 50)}...`);
            }

            // 4f. Favoris — champs réels : .imageUrl, .tokenUrl
            const resolvedFavorites = await Promise.all(favoriteStore.favorites.map(async (fav) => ({
                ...fav,
                imageUrl: (fav as { imageUrl?: string }).imageUrl
                    ? await resolveToSendableUrl((fav as { imageUrl?: string }).imageUrl!)
                    : undefined,
                tokenUrl: (fav as { tokenUrl?: string }).tokenUrl
                    ? await resolveToSendableUrl((fav as { tokenUrl?: string }).tokenUrl!)
                    : undefined,
            })));

            const fullState = {
                sounds, moments: storyboardStore.moments.filter(m => String(m.campaignId) === String(currentCampaignId)).map(m => ({ id: m.id, name: m.name })),
                masterVolume: soundStore.masterVolume,
                combat: { 
                    combatants: resolvedCombatants, 
                    currentTurnIdx: combatStore.currentTurnIdx, 
                    round: combatStore.round,
                    isCombatProjected: combatStore.isCombatProjected
                },
                notes,
                whiteboard: { paths: whiteboardStore.paths, activePath: whiteboardStore.activePath, laserPointer: whiteboardStore.laserPointer, backgroundMode: whiteboardStore.backgroundMode },
                clock: { timestamp: clockStore.timestamp, tensions: jaugesVuesParLesJoueurs(clockStore.tensions), timerRemaining: clockStore.timerRemaining, timerIsRunning: clockStore.timerIsRunning },
                universalPads,
                comptesDePads,
                lecture,
                dice: { lastRoll: diceStore.lastRoll, isDiceProjected: diceStore.isDiceProjected, projectionTrigger: diceStore.projectionTrigger },
                map: { 
                    projectionTarget: mapStore.projectionTarget, 
                    projectedMapUrl: mapStore.projectedMapUrl, 
                    projectedIsVideo: mapStore.projectedIsVideo,
                    projectedTokens: mapStore.projectedTokens, 
                    projectedPings: mapStore.projectedPings,
                    projectedFogDataUrl: mapStore.projectedFogDataUrl,
                    projectedMapWidth: mapStore.projectedMapWidth,
                    projectedMapHeight: mapStore.projectedMapHeight,
                    projectedIsGridEnabled: mapStore.projectedIsGridEnabled,
                    projectedGridSize: mapStore.projectedGridSize,
                    projectedGridColor: mapStore.projectedGridColor,
                    projectedGridOpacity: mapStore.projectedGridOpacity,
                    projectedIsMapMuted: mapStore.projectedIsMapMuted,
                    projectedMapVolume: mapStore.projectedMapVolume
                },
                // ── Session Data ──────────────────────────────────────────────────
                session: {
                    sessions,
                    campaigns,
                    players: resolvedPlayers,
                    entities: resolvedEntities,
                    atlasMaps: resolvedAtlasMaps,
                    clues: resolvedClues,
                    customSheetTemplates,
                    customGameDrivers,
                    activeCampaignId: currentCampaignId,
                    activeCampaignName: freshSessionOS.activeCampaignName || campaigns.find(c => c.id === currentCampaignId)?.name || 'NONE',
                    activeCampaignWallpaper: resolvedWallpaper,
                    characterLocks: freshSessionOS.connectedCharacters,
                    favorites: resolvedFavorites,
                    /*
                      **Les réserves de table, et l'état qu'elles portent.**

                      Demandé par David le 2026-08-15 : *« permet juste aux
                      joueurs d'avoir une vue sur l'Impulsion et de la gérer »*.
                      L'Impulsion est **commune aux joueurs** et n'existait que
                      dans la fenêtre du meneur — une réserve partagée que le
                      groupe ne voit pas n'est pas partagée, c'est la réserve du
                      MJ qu'il annonce à voix haute.

                      On envoie l'état brut, sans le filtrer par ce qui est
                      visible : le caviardage se fait à l'affichage, et un
                      filtrage ici priverait le panneau de jet du montant à
                      débiter sur une réserve que le joueur ne voit pas mais
                      dont le report l'alimente — la Menace, précisément.
                    */
                    reservesDeTable: currentCampaignId ? (reservesStore.reserves[currentCampaignId] ?? {}) : {},
                    /*
                      **Ce que la tablette a besoin de savoir du pilote pour
                      lancer** : sa configuration de dés, et **s'il s'agit d'un
                      jeu à dés échelonnés**.

                      Ce second point ne se déduit pas de `dice.engine` seul : un
                      pilote peut déclarer `jet.desEchelonnes` et un moteur qui
                      dit autre chose — c'est le défaut que David a trouvé au
                      pupitre le 2026-09-03, et la Forge a un contrôle exprès
                      pour lui. *On envoie donc la réponse, pas la question.*
                    */
                    activeDiceConfig: piloteActif?.dice ?? null,
                    desEchelonnes: !!piloteActif?.jet?.desEchelonnes
                        || piloteActif?.dice?.engine === 'yze-echelonne',
                    /*
                      **Les cartes tenues en main — décidé par David le 2026-08-30.**

                      Le paquet détient la vérité ; la tablette n'en reçoit que
                      ce qu'elle a le droit de montrer. `mainsPourLaTable`
                      **retire l'index de toute carte face cachée** et n'en
                      laisse que le compte : la diffusion est un seul message
                      pour toutes les tablettes, et un secret caviardé à
                      l'affichage serait déposé sur l'appareil de chaque joueur.

                      Les manifestes suivent, sans quoi la tablette recevrait
                      des numéros de carte et aucun moyen d'en tirer une image.
                    */
                    decks: freshSessionOS.decks ?? [],
                    /*
                      Les propositions de carte, pour que le destinataire les
                      voie et puisse répondre. Seules celles **en attente**
                      partent : une demande acceptée ou refusée n'a plus rien à
                      dire, et l'historique complet grossirait la charge à
                      chaque diffusion.
                    */
                    demandesDeCarte: (freshSessionOS.demandesDeCarte ?? [])
                        .filter(d => d.statut === 'en-attente'),
                    /*
                      **Le compte des pioches, et rien de plus.** Sans lui, la
                      tablette d'un paquet ouvert ne saurait ni annoncer ce
                      qu'il reste ni éteindre son bouton sur un paquet vide.
                      `cartesRestantesPourLaTable` n'en sort que des nombres :
                      `remainingIndices` est le paquet **dans l'ordre où il sera
                      tiré**, et le diffuser livrerait la suite de la partie.
                    */
                    cartesRestantes: cartesRestantesPourLaTable(freshSessionOS.deckStates ?? {}),
                    mainsDesPaquets: Object.fromEntries(
                        Object.entries(freshSessionOS.deckStates ?? {})
                            .map(([deckId, etat]) => [deckId, mainsPourLaTable(etat)])
                            .filter(([, mains]) => (mains as unknown[]).length > 0),
                    ),
                },
            };

            if (isMainPC) {
                console.log('[NexusSync] Broadcasting state update:', {
                    activeCampaignId: currentCampaignId,
                    activeCampaignName: fullState.session.activeCampaignName,
                    sessions: fullState.session.sessions.length,
                    activeSessionId: fullState.session.sessions.find(s => s.status === 'active')?.id
                });
            }

            // `session` agrège campagnes, entités, lieux, indices et favoris —
            // les médias résolus compris. Comparé d'un bloc, renommer un
            // personnage retransmettait tout le reste ; comparé champ par champ,
            // seul ce qui bouge repart. Les destinataires appliquent déjà ces
            // champs individuellement (voir applySyncPayload).
            const diffPayload = force
                ? fullState
                : getDifferentialPayload(fullState, lastBroadcastRef.current, { deepSegments: ['session'] });
            
            if (Object.keys(diffPayload).length > 0 && window.appBridge) {
                // Roles: remote/gm see everything. player sees sanitized.
                window.appBridge.send('remote:broadcast-sync', diffPayload, 'remote');
                window.appBridge.send('remote:broadcast-sync', diffPayload, 'gm');

                const playerDiff = JSON.parse(JSON.stringify(diffPayload));
                
                // Sanitization for Player Role
                if (playerDiff.notes) playerDiff.notes.private = '•••••';
                
                if (playerDiff.session?.sessions) {
                    playerDiff.session.sessions = playerDiff.session.sessions.map((s: any) => {
                        const { feedbacks, ...rest } = s;
                        return rest;
                    });
                }

                if (playerDiff.session?.entities) {
                    playerDiff.session.entities = playerDiff.session.entities.map((e: any) => ({
                        ...e,
                        gmSecretInfo: '•••••',
                        roleplayingNotes: '•••••'
                    }));
                }

                if (playerDiff.combat?.combatants) {
                    playerDiff.combat.combatants = playerDiff.combat.combatants.map((c: any) => ({
                        ...c,
                        gmSecretInfo: '•••••',
                        roleplayingNotes: '•••••'
                    }));
                }

                window.appBridge.send('remote:broadcast-sync', playerDiff, 'player');
                window.appBridge.send('remote:broadcast-sync', playerDiff, 'hub'); // Ensuring Hubs get the player-sanitized data too

                lastBroadcastRef.current = fullState;
            }
        } catch (e) {
            console.error('[NexusSync] Full Sync Error:', e);
        }
    }, [isMainPC]);

    // Le report du frein passe par cette référence : `handleSync` ne peut pas
    // s'appeler lui-même depuis son propre `useCallback`.
    handleSyncRef.current = handleSync;

    // Subscriptions logic
    useEffect(() => {
        if (!isMainPC) return;

        const unsubs = [
            useWhiteboardStore.subscribe(() => syncFast('whiteboard')),
            useClockStore.subscribe(() => syncFast('clock')),
            useMusicStore.subscribe(() => handleSync()),
            useSoundStore.subscribe(() => handleSync()),
            useImageStore.subscribe(() => handleSync()),
            useCombatStore.subscribe(() => handleSync()),
            useDiceStore.subscribe(() => syncFast('dice')),
            useMapStore.subscribe((s, prev) => (s.projectedMapUrl !== prev.projectedMapUrl) ? handleSync() : syncFast('map')),
            useSessionOSStore.subscribe(() => handleSync())
        ];

        handleSync(true); // Initial sync

        return () => {
            unsubs.forEach(u => u());
            if (trailingSyncRef.current) {
                clearTimeout(trailingSyncRef.current);
                trailingSyncRef.current = null;
            }
        };
    }, [isMainPC, handleSync, syncFast]);

    return { handleSync, syncFast };
};
