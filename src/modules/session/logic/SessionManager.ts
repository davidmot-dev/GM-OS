import i18next from 'i18next';
import { gmToast } from '../../../stores/useToastStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { cloturerLeJournalDeLaSeance } from '../../journal/clotureDeSeance';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useObsidianStore } from '../useObsidianStore';
import type { SessionOSStore } from '../store/index';
import type { GameSession, Campaign } from '../store/types';
import { suspendreLesScenes, reprendreLesScenes, laTrameALaCloture } from './trame';

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
    /**
     * Clôture une campagne : elle est finie, et sa trame se range avec elle.
     *
     * **Il n'existait aucun statut de campagne** — relevé par David le
     * 2026-08-20. On pouvait achever un acte, terminer une scène, clore une
     * séance, mais jamais dire d'une campagne qu'elle est finie.
     *
     * **Clôturer n'efface rien**, et c'est ce qui la distingue de
     * `deleteCampaign` juste en dessous, qui emporte tout. La règle est celle
     * déjà tenue par l'acte achevé et la scène terminée : on range, on ne
     * détruit pas, et rouvrir est un simple geste.
     *
     * Ce que la trame devient est décidé par `laTrameALaCloture` : les scènes
     * jamais jouées deviennent **annulées**, celles qu'on a jouées sans les
     * clore deviennent **terminées**, et les actes s'achèvent.
     *
     * **La séance en cours s'arrête d'abord.** Clôturer une campagne pendant
     * qu'on y joue laisserait un journal ouvert sur une campagne close, et un
     * `activeSessionId` qui désigne une séance d'une campagne finie.
     */
    static cloturerLaCampagne(set: any, get: any, id: string) {
        const state = get() as SessionOSStore;
        const campaign = state.campaigns.find((c: Campaign) => c.id === id);
        if (!campaign || campaign.clotureeLe) return;

        const quand = Date.now();
        const { scenes, actes, annulees, terminees } = laTrameALaCloture(
            state.scenes, state.actes, id, quand,
        );

        set((s: SessionOSStore) => ({
            campaigns: s.campaigns.map(c => (c.id === id ? { ...c, clotureeLe: quand } : c)),
            scenes,
            actes,
            // Une campagne close ne garde pas de séance en cours.
            sessions: s.sessions.map(x =>
                (x.campaignId === id && x.status === 'active' ? { ...x, status: 'done' as const } : x)),
        }));

        gmToast(
            `« ${campaign.name} » est clôturée.`
            + (terminees > 0 ? ` ${terminees} scène(s) terminée(s).` : '')
            + (annulees > 0 ? ` ${annulees} jamais jouée(s), annulée(s).` : ''),
            'info',
        );
    }

    /**
     * Rouvre une campagne close.
     *
     * **Elle ne ranime pas la trame, et c'est délibéré.** Rouvrir rend la
     * campagne jouable ; décider que telle scène annulée redevient à jouer est
     * un geste par scène, que la trame sait déjà faire — *« rouvrir une scène
     * terminée la ranime, délibérément »*. Tout défaire d'un coup ressusciterait
     * aussi ce que le meneur avait clos de sa main avant la clôture, et on ne
     * saurait plus lequel était lequel.
     */
    static rouvrirLaCampagne(set: any, get: any, id: string) {
        const state = get() as SessionOSStore;
        const campaign = state.campaigns.find((c: Campaign) => c.id === id);
        if (!campaign?.clotureeLe) return;

        set((s: SessionOSStore) => ({
            campaigns: s.campaigns.map(c => {
                if (c.id !== id) return c;
                // On retire la date plutôt que de la mettre à `undefined` : une
                // clé absente et une clé vide se lisent pareil dans le code, mais
                // pas dans la base persistée ni dans une sauvegarde relue.
                const rouverte = { ...c };
                delete rouverte.clotureeLe;
                return rouverte;
            }),
        }));
        gmToast(`« ${campaign.name} » est rouverte. Sa trame reste telle quelle.`, 'info');
    }

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
     * Ouvrir une carte de l'atlas. **Regarder, et rien de plus.**
     *
     * **Le défaut, tranché par David le 2026-08-21.** Ce chemin écrivait
     * *« Le groupe se déplace vers X »* en `LOCATION` — donc en `chronique`,
     * donc dans le résumé — sur un simple clic dans l'atlas. Consulter sa carte
     * en pleine séance pour vérifier un nom suffisait à faire voyager le groupe,
     * et le résumé narratif en tirait ensuite un déplacement qui n'avait jamais
     * eu lieu.
     *
     * *C'est le pire des trois défauts d'axe relevés à la revue des émetteurs,
     * parce qu'il n'ajoutait pas du bruit : il ajoutait un FAIT.* Et un fait
     * faux ne se plaint de rien — il se lit comme les autres.
     *
     * Le geste reste consigné, en `trace` et sous son vrai nom : le fil doit
     * pouvoir dire quelle carte le meneur a ouverte. Le déplacement, lui, a
     * désormais son propre geste — `leGroupeSyRend` ci-dessous.
     */
    static navigateToAtlasMap(set: any, get: any, id: string | null) {
        set({ selectedAtlasMapId: id, currentView: 'world-atlas' });
        if (!id) return;

        const map = (get() as SessionOSStore).atlasMaps.find(m => m.id === id);
        if (!map) return;

        useJournalStore.getState().addEvent({
            type: 'LOCATION',
            /*
              Le type reste `LOCATION` — l'icône et le filtre du fil parlent bien
              d'un lieu — et c'est la NATURE qui est corrigée. Même geste que
              « Carte chargée » dans `useMapStore` : *le lieu est le sujet, le
              geste ne l'est pas.*
            */
            nature: 'trace',
            title: i18next.t('modules:session.events.atlas_browse_title', { map: map.name }),
            content: i18next.t('modules:session.events.atlas_browse_content', { map: map.name }),
        });
    }

    /**
     * **Le groupe s'y rend.** Un geste explicite, demandé par David le
     * 2026-08-21.
     *
     * C'est la moitié qui manquait : une fois `navigateToAtlasMap` rendu muet
     * pour la chronique, plus rien n'aurait dit qu'un groupe arrive quelque
     * part — et l'arrivée quelque part est précisément ce qu'une chronique
     * retient. On ne devine donc plus le déplacement d'un clic : **on le
     * déclare.**
     *
     * **Il marque aussi le lieu comme visité**, parce que les deux disent la
     * même chose et qu'un meneur qui vient d'annoncer l'arrivée du groupe ne
     * doit pas avoir à cocher une seconde case pour la même vérité. Il ne
     * dé-visite jamais : `toggleMapVisited` reste là pour se dédire.
     *
     * Le récit du lieu l'emporte sur la phrase de repli. Cette phrase est
     * écrite par le code, pas par le meneur — et c'est elle, précisément, qui
     * entrait dans les résumés jusqu'ici.
     */
    static leGroupeSyRend(set: any, get: any, id: string) {
        const state = get() as SessionOSStore;
        const map = state.atlasMaps.find(m => m.id === id);
        if (!map) return;

        if (!map.isVisited) {
            set({
                atlasMaps: state.atlasMaps.map(m => (m.id === id ? { ...m, isVisited: true } : m)),
            });
        }

        useJournalStore.getState().addEvent({
            // Pas de `nature` : `LOCATION` retombe sur `chronique`, et c'est
            // exactement ce qu'on veut ici. La déclarer serait la répéter.
            type: 'LOCATION',
            title: i18next.t('modules:session.events.atlas_travel_title', { map: map.name }),
            content: map.narrativeDescription
                || i18next.t('modules:session.events.atlas_travel_content', { map: map.name }),
        });
    }
}
