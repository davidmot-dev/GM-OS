import { gmToast } from '../../../stores/useToastStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { cloturerLeJournalDeLaSeance } from '../../journal/clotureDeSeance';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useObsidianStore } from '../useObsidianStore';
import type { SessionOSStore } from '../store/index';
import type { GameSession, Campaign } from '../store/types';
import { suspendreLesScenes, reprendreLesScenes } from './trame';

/**
 * SessionManager logic service.
 * Handles complex state transitions for the Session module.
 */
export class SessionManager {
    /**
     * Activates a campaign and sets the initial UI view.
     *
     * **Changer de campagne n'arrête PAS une séance** — règle de David du
     * 2026-08-18. Ce chemin appelait `stopJournal()` dans ses deux branches :
     * consulter une autre campagne en pleine partie fermait le journal en cours,
     * et le fermait *nu*, sans instantané ni relevé de ce qui attend. La séance,
     * elle, continuait — on se retrouvait à jouer sans que rien ne s'enregistre.
     *
     * Naviguer n'est pas jouer. Une séance ne se termine que là où elle se
     * termine : par son statut (`updateSession`) ou parce qu'une autre prend sa
     * place (`launchSession`).
     */
    static setActiveCampaign(set: any, get: any, id: string | null) {
        const state = get() as SessionOSStore;
        const campaign = state.campaigns.find(c => c.id === id);
        set({
            activeCampaignId: id,
            activeCampaignName: campaign?.name || null,
            activeCampaignWallpaper: campaign?.wallpaperUrl || null,
            currentView: 'cockpit',
            selectedSessionId: null,
            selectedAtlasMapId: null,
            selectedDeckId: null,
        });

        if (id) {
            // Sync Obsidian Vault if path is defined
            if (campaign?.obsidianPath) {
                useObsidianStore.getState().setVaultPath(campaign.obsidianPath);
            }

            /*
              Hors séance, il n'y a rien à consigner. `addEvent` laisse passer les
              `SYSTEM` même à l'arrêt : sans ce garde, feuilleter ses campagnes un
              mardi soir ajoutait des lignes « Campagne activée » à un journal
              archivé des semaines plus tôt.
            */
            if (useJournalStore.getState().isRecording) {
                useJournalStore.getState().addEvent({
                    type: 'SYSTEM',
                    title: 'Campagne activée',
                    content: `La campagne "${campaign?.name || id}" est maintenant active.`,
                });
            }
        } else {
            gmToast('Campagne désactivée.', 'info');
        }
    }

    /**
     * Launches a session, updating statuses and starting the Journal.
     */
    static launchSession(set: any, get: any, sessionId: string) {
        const { sessions, campaigns, scenes } = get() as SessionOSStore;
        const session = sessions.find((s: GameSession) => s.id === sessionId);
        if (!session) return;

        // 1. Update session statuses (Only ONE active session globally)
        const sortante = sessions.find(s => s.status === 'active' && s.id !== sessionId);
        const updatedSessions = sessions.map(s => {
            if (s.id === sessionId) return { ...s, status: 'active' as const };
            if (s.status === 'active') return { ...s, status: 'done' as const };
            return s;
        });

        /*
          **Les scènes suivent le changement de séance, ici aussi.**

          `updateSession` porte déjà cette règle, mais ce chemin ne passe pas par
          lui : il réécrit le tableau des séances en bloc pour garantir qu'une
          seule est active. Il doit donc appliquer la même chose — la séance qui
          s'arrête SUSPEND ses scènes, celle qui s'ouvre relance ce qui était en
          pause.

          Quand les deux séances sont de la même campagne, les deux passes se
          suivent et c'est voulu : le passage de la veille se ferme, un nouveau
          s'ouvre au nom de la séance du jour. C'est précisément ce que le
          journal aura besoin de distinguer.
        */
        const quand = Date.now();
        const scenesSuspendues = sortante
            ? suspendreLesScenes(scenes ?? [], sortante.campaignId, quand)
            : (scenes ?? []);
        const updatedScenes = reprendreLesScenes(scenesSuspendues, session.campaignId, sessionId, quand);

        // 2. Update campaign's active session
        const updatedCampaigns = campaigns.map(c => {
            if (c.id === session.campaignId) {
                return { ...c, activeSessionId: sessionId };
            }
            return c;
        });

        const campaign = updatedCampaigns.find(c => c.id === session.campaignId);

        /*
          **Une seule séance à la fois : celle qui part clôt son journal.**

          Ce chemin déclassait la séance sortante en `done` en réécrivant le
          tableau en bloc — sans jamais passer par `updateSession`, qui est le
          seul endroit à savoir clore un journal. Le journal de la séance sortante
          restait donc **ouvert pour toujours** : pas d'heure de fin, pas de
          durée, pas d'état des lieux, pas de « ce qui attend ». Puis
          `startJournal` remplaçait `activeJournalId` et il devenait orphelin.
          Même famille que l'oubli des scènes noté juste au-dessus, et même
          remède — ce chemin doit porter les règles qu'il court-circuite.

          **L'appel est synchrone, et l'ordre fait tout** : la clôture lit la
          séance encore `active` dans le store global pour relever son état, et
          elle doit s'achever AVANT `startJournal`, sinon elle refermerait le
          journal qu'on vient d'ouvrir. C'est pourquoi ce n'est pas un
          `queueMicrotask` comme dans `updateSession` — là-bas, l'appel se fait
          depuis un calcul d'état et doit en sortir ; ici, non.
        */
        // Relancer la séance déjà active la clôt aussi : c'est bien un journal
        // sortant, celui de la même séance, et `sortante` ne le voit pas.
        const campagneSortante = sortante?.campaignId
            ?? (session.status === 'active' ? session.campaignId : undefined);
        if (campagneSortante) {
            cloturerLeJournalDeLaSeance(campagneSortante);
        }

        /*
          **Le journal porte le NOM de la campagne, pas son identifiant.**

          `startJournal` reçoit ce texte pour en faire le titre du journal — un
          titre qui se lit dans la liste des séances, et se relit des mois plus
          tard. On lui passait `session.campaignId`, si bien que chaque séance
          s'appelait « c-1187082150026-gtbgs — 18/08 21h59 » : illisible, et
          impossible à rattacher de tête à sa campagne.

          L'identifiant reste la clé, jamais l'étiquette. Il ne sert de repli que
          si la campagne a disparu entre-temps — mieux vaut un titre laid qu'un
          titre vide.
        */
        useJournalStore.getState().startJournal(
            /*
              Deux champs nommés, et la confusion du 18/08 devient impossible à
              écrire : `campaignName` recevait `session.campaignId`, et le
              compilateur ne pouvait rien dire puisque les deux sont des chaînes.
              L'identifiant rattache, le nom s'affiche.
            */
            { id: session.campaignId, nom: campaign?.name || session.campaignId },
            `Session #${session.number}`,
            { publicSummary: session.publicSummary }
        );

        // Sync Obsidian Vault if path is defined
        if (campaign?.obsidianPath) {
            useObsidianStore.getState().setVaultPath(campaign.obsidianPath);
        }

        set({
            sessions: updatedSessions,
            campaigns: updatedCampaigns,
            scenes: updatedScenes,
            activeCampaignId: session.campaignId,
            activeCampaignName: campaign?.name || null,
            activeCampaignWallpaper: campaign?.wallpaperUrl || null,
            currentView: 'cockpit',
            selectedDeckId: null
        });

        gmToast(`Session #${session.number} lancée.`, 'success');
    }

    /**
     * Performs a cascade delete of a campaign and its related data.
     */
    static deleteCampaign(set: any, get: any, id: string) {
        const state = get() as SessionOSStore;
        const campaign = state.campaigns.find((c: Campaign) => c.id === id);
        if (!campaign) return;

        set((state: SessionOSStore) => ({
            campaigns: state.campaigns.filter((c) => c.id !== id),
            activeCampaignId: state.activeCampaignId === id ? null : state.activeCampaignId,
            
            entities: state.entities.filter(e => e.campaignId !== id),
            sessions: state.sessions.filter(s => s.campaignId !== id),
            atlasMaps: state.atlasMaps.filter(m => m.campaignId !== id),
            wikiEntries: state.wikiEntries.filter(w => w.campaignId !== id),
            timelineEvents: state.timelineEvents.filter(t => t.campaignId !== id),
            clues: state.clues.filter(c => c.campaignId !== id),
            // Oubliés à l'arrivée de la trame le 2026-08-15 : sans ces deux
            // lignes, actes et scènes survivaient à leur campagne — invisibles
            // partout, puisque tous les écrans filtrent par campagne, et
            // définitivement irrécupérables puisqu'aucune campagne ne les
            // réclamait plus.
            actes: state.actes.filter(a => a.campaignId !== id),
            scenes: state.scenes.filter(s => s.campaignId !== id),
            
            players: state.players.map(p => ({
                ...p,
                characters: p.characters.map(c => 
                    c.campaignId === id ? { ...c, campaignId: null } : c
                )
            }))
        }));

        useMediaStore.getState().removeCampaignReference(id);
        gmToast(`Campagne "${campaign.name}" supprimée avec succès.`, 'info');
    }

    /**
     * Atomic navigation helpers
     */
    static navigateToAtlasMap(set: any, get: any, id: string | null) {
        set({ selectedAtlasMapId: id, currentView: 'world-atlas' });
        if (id) {
            const map = (get() as SessionOSStore).atlasMaps.find(m => m.id === id);
            if (map) {
                useJournalStore.getState().addEvent({
                    type: 'LOCATION',
                    title: `📍 Navigation: ${map.name}`,
                    content: map.narrativeDescription || `Le groupe se déplace vers ${map.name}.`,
                });
            }
        }
    }
}
