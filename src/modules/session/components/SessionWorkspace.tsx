import React from 'react';
import { useTranslation } from 'react-i18next';
import { aUneJaugeDeVie, fractionDeVie, pointsDeVieApres, decrireLaSante } from '../../combat/logic/SanteDuCombattant';
import { useSessionOSStore } from '../useSessionOSStore';
import { useMapStore } from '../../map/useMapStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { Eye, EyeOff, Lock, MapPin, Plus, Users, X, Clapperboard, ArrowRight, Search, Map as MapIcon } from 'lucide-react';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { Panneau, Etiquette } from '../../../components/socle';
import { scenesDansLEtat } from '../logic/trame';

import SessionClueDeck from './SessionClueDeck';
import PanneauDeTrameEnCours from './PanneauDeTrameEnCours';
import TableauDeBordUlanzi from '../../ulanzi/TableauDeBordUlanzi';

/** Le camp d'un PNJ, dans les états du thème — la même lecture que la galerie. */
const TON_DU_CAMP = { ally: 'succes', neutral: 'neutre', hostile: 'danger', boss: 'accent' } as const;

/** Un portrait, ou une silhouette : une image vide montrait son texte de remplacement, cassé. */
const Portrait: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => src
    ? <ResolvedAsset src={src} alt={alt} className="h-full w-full object-cover" />
    : <span className="flex h-full w-full items-center justify-center text-app-subtle"><Users size={20} strokeWidth={1.5} /></span>;

/** La barre de santé d'une carte : rien quand le jeu ne compte pas de points. */
const BarreDeSante: React.FC<{ fraction: number | null }> = ({ fraction }) => fraction === null ? null : (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-app-bg">
        <div
            className={`h-full transition-all duration-500 ${fraction > 0.5 ? 'bg-etat-succes' : fraction > 0.25 ? 'bg-etat-alerte' : 'bg-etat-danger'}`}
            style={{ width: `${fraction * 100}%` }}
        />
    </div>
);

/**
 * **Le cockpit, l'écran où le meneur passe la partie** — refonte, L5, étape 2.
 *
 * L'ordre suit la maquette retenue : d'abord **où on en est** (la scène en
 * cours, en grand), puis **qui est là** (le groupe et les PNJ de la scène en
 * cartes), puis ce qu'on écrit pendant la partie, la carte et les indices.
 */
const SessionWorkspace: React.FC = () => {
    const { t } = useTranslation();
    const {
        sessions, activeCampaignId, entities, updateSessionPublicSummary, updateSessionGmSecrets,
        campaigns, atlasMaps, players, updateCharacterHP, navigateToAtlasMap, navigateToNpcDetail,
        navigateToPlayerDetail, scenes, actes, clues, revealClue, setCurrentView,
    } = useSessionOSStore();
    const setActiveModule = useSessionStore(s => s.setActiveModule);
    const { mapUrl, mapName, isVideo, setMap } = useMapStore();
    const resolvedMapUrl = useMediaUrl(mapUrl || undefined);

    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const activeLocations = atlasMaps.filter(m => campaign?.activeLocationIds?.includes(m.id));

    // Get the active session for the active campaign
    const session = sessions.find(s => s.campaignId === activeCampaignId && s.status === 'active');

    const updateEntityHP = (id: string, delta: number) => {
        // Check if it's an NPC or a PC
        const npc = entities.find(e => e.id === id);
        if (npc) {
            useSessionOSStore.getState().updateEntityHP(id, npc.hp + delta);
            return;
        }

        // Try to find as PC
        for (const p of players) {
            const pc = p.characters.find(c => c.id === id);
            if (pc) {
                // Rien à ajuster sans jauge : on ne crée pas de points de vie
                // que le système du jeu n'a pas.
                const n = pointsDeVieApres(pc, delta);
                if (n !== null) updateCharacterHP(p.id, id, n);
                break;
            }
        }
    };

    if (!session) {
        return (
            <section className="col-span-6 flex flex-col items-center justify-center p-6 bg-app-surface/40 rounded-xl border border-app-border/20 shadow-inner">
                <p className="text-app-muted font-bold tracking-widest uppercase">{t('modules:session.workspace.no_active_session')}</p>
                <p className="text-app-subtle text-sm mt-2">{t('modules:session.workspace.no_active_session_desc')}</p>
            </section>
        );
    }

    /* `sessionEntityIds` porte à la fois les PJ présents ce soir et les PNJ de
       la scène : on les sépare par où on les trouve. */
    const idsDeLaSeance = Array.from(new Set(session.sessionEntityIds || []));
    const groupe = idsDeLaSeance.flatMap(id => {
        for (const p of players) {
            const pc = p.characters.find(c => c.id === id && c.campaignId === activeCampaignId);
            if (pc) return [{ pc, ownerId: p.id }];
        }
        return [];
    });
    const pnjActifs = idsDeLaSeance.flatMap(id => entities.filter(e => e.id === id));

    const scenesEnCours = scenesDansLEtat(scenes, actes, activeCampaignId, 'en-cours');
    const scene = scenesEnCours[0];
    const acteDeLaScene = scene ? actes.find(a => a.id === scene.acteId) : undefined;
    /*
      **Les indices de la scène qu'on n'a pas encore donnés**, chacun avec
      « Révéler » — retenu par David le 2026-09-29. Le paquet du dessous ne
      montrait que ce qui était déjà révélé : on cherchait ailleurs ce qu'on
      pouvait encore faire tomber.
    */
    const indicesDesScenes = new Set(scenesEnCours.flatMap(s => s.indiceIds ?? []));
    const indicesARevaler = clues.filter(c => indicesDesScenes.has(c.id) && !c.isRevealed);

    const titreDeBloc = (icone: React.ReactNode, titre: React.ReactNode, aside?: React.ReactNode) => (
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
            <h3 className="flex min-w-0 items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                <span className="shrink-0 text-accent">{icone}</span>
                <span className="truncate">{titre}</span>
            </h3>
            {aside}
        </div>
    );
    const lienDeBloc = (libelle: string, onClick: () => void, icone?: React.ReactNode) => (
        <button onClick={onClick} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-app-border px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest text-accent transition-all hover:border-accent/50 hover:bg-accent/10">
            {icone}{libelle}
        </button>
    );

    return (
        <section className="h-full col-span-6 flex flex-col gap-4 p-4 overflow-y-auto custom-scrollbar">
            {/* 1. Où on en est : la scène en cours, en grand */}
            <Panneau className="flex-shrink-0 p-5">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-[12rem] flex-1">
                        <p className="text-ui-10 font-black uppercase tracking-[0.2em] text-accent">
                            {acteDeLaScene ? acteDeLaScene.titre : t('modules:session.workspace.agencement.scene_en_cours')}
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-app-text">
                            {scene ? scene.titre : t('modules:session.workspace.agencement.aucune_scene')}
                        </h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {scenesEnCours.length > 1 && <Etiquette ton="alerte" className="whitespace-nowrap">{t('modules:session.workspace.agencement.scenes_ouvertes', { count: scenesEnCours.length })}</Etiquette>}
                        {/* Un raccourci vers la trame, pas un second écrivain de la
                            scène — décidé par David le 2026-09-29. */}
                        {lienDeBloc(t('modules:session.workspace.agencement.changer_de_scene'), () => setCurrentView('trame'), <Clapperboard size={12} />)}
                    </div>
                </div>
                {scene?.resume && <p className="mt-3 max-w-3xl text-base leading-relaxed text-app-text">{scene.resume}</p>}
            </Panneau>

            {/* 2. Qui est là : le groupe, puis les PNJ de la scène */}
            <Panneau className="flex-shrink-0">
                {titreDeBloc(<Users size={16} />, t('modules:session.workspace.agencement.groupe', { count: groupe.length }),
                    lienDeBloc(t('modules:session.workspace.manage_group'), () => setCurrentView('players')))}
                <div className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-2">
                    {groupe.map(({ pc, ownerId }) => {
                        const fraction = fractionDeVie(pc);
                        return (
                            <div key={pc.id} className="group flex gap-3 rounded-lg border border-app-border bg-app-bg/40 p-3">
                                <button onClick={() => navigateToPlayerDetail(ownerId, pc.id)} className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-app-surface-2" title={pc.name}>
                                    <Portrait src={pc.portraitUrl} alt={pc.name} />
                                </button>
                                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                                    <button onClick={() => navigateToPlayerDetail(ownerId, pc.id)} className="truncate text-left text-sm font-black uppercase tracking-wide text-app-text hover:text-accent">{pc.name}</button>
                                    <div className="flex items-center gap-2">
                                        <div className="min-w-[3rem] flex-1">
                                            {fraction === null
                                                ? <span className="block truncate text-ui-10 text-app-muted">{decrireLaSante(pc) ?? '—'}</span>
                                                : <BarreDeSante fraction={fraction} />}
                                        </div>
                                        {/* Les trois boutons de santé passent par le
                                            module de santé : sur un jeu sans points
                                            de vie, ils n'apparaissent pas. */}
                                        {aUneJaugeDeVie(pc) && (
                                            <div className="flex shrink-0 items-center gap-1 text-ui-10">
                                                <button onClick={() => updateEntityHP(pc.id, -1)} className="h-6 w-6 rounded border border-app-border font-bold text-app-muted hover:border-etat-danger/50 hover:text-etat-danger" title="−1">−</button>
                                                <span className="min-w-[3.5rem] text-center font-mono font-bold text-app-text">{pc.hp} / {pc.maxHp}</span>
                                                <button onClick={() => updateEntityHP(pc.id, 1)} className="h-6 w-6 rounded border border-app-border font-bold text-app-muted hover:border-etat-succes/50 hover:text-etat-succes" title="+1">+</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {groupe.length === 0 && <p className="text-xs italic text-app-subtle">{t('modules:session.workspace.agencement.groupe_vide')}</p>}
                </div>
            </Panneau>

            <Panneau className="flex-shrink-0">
                {titreDeBloc(<Eye size={16} />, t('modules:session.workspace.agencement.pnj_actifs', { count: pnjActifs.length }),
                    lienDeBloc(t('modules:session.workspace.add_npc'), () => setCurrentView('npc-gallery'), <Plus size={12} />))}
                <div className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-3">
                    {pnjActifs.map(npc => {
                        const fraction = fractionDeVie(npc);
                        return (
                            <div key={npc.id} className="group relative flex gap-3 rounded-lg border border-app-border bg-app-bg/40 p-3">
                                <button onClick={() => navigateToNpcDetail(npc.id)} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-app-surface-2" title={npc.name}>
                                    <Portrait src={npc.avatar} alt={npc.name} />
                                </button>
                                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                    <button onClick={() => navigateToNpcDetail(npc.id)} className="truncate pr-5 text-left text-xs font-black uppercase tracking-wide text-app-text hover:text-accent">{npc.name}</button>
                                    <Etiquette ton={TON_DU_CAMP[npc.role] ?? 'neutre'} className="self-start">{t(`modules:session.npc_gallery.roles.${npc.role}`, { defaultValue: npc.role })}</Etiquette>
                                    <BarreDeSante fraction={fraction} />
                                </div>
                                <button
                                    onClick={() => useSessionOSStore.getState().removeEntityFromSession(session.id, npc.id)}
                                    className="absolute right-2 top-2 rounded p-0.5 text-app-subtle transition-colors hover:text-etat-danger"
                                    title={t('modules:session.workspace.remove_from_session')}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                    {pnjActifs.length === 0 && <p className="text-xs italic text-app-subtle">{t('modules:session.workspace.agencement.pnj_vide')}</p>}
                </div>
            </Panneau>

            {/*
                **Le défilé des quarts**, sous le groupe et les PNJ actifs.

                Placé là à la demande de David le 2026-08-23 : il vivait dans la
                colonne du cockpit, où l'on ne regarde pas pendant qu'on joue.
                Ici il est dans le champ de vision de la table.
            */}
            <TableauDeBordUlanzi seanceOuverte />

            {/*
                **Où on en est dans l'histoire, pendant qu'on joue.**

                Relevé par David le 2026-08-17 : il déclarait son acte et ses
                scènes en préparation, lançait la séance, et arrivait sur cet
                écran — qui ne mentionnait ni `actes` ni `scenes`, pas une
                ligne. Le plan existait, on le perdait de vue au moment de
                jouer. Ce panneau vient au-dessus des indices parce que la
                question « où sommes-nous » précède toujours « que trouvent-ils ».
            */}
            <PanneauDeTrameEnCours session={session} />

            {/* 3. Ce qu'on écrit pendant la partie : le public et le secret, marqués */}
            <div className="grid flex-shrink-0 grid-cols-1 gap-4 lg:grid-cols-2">
                <Panneau className="flex min-h-[16rem] flex-col focus-within:border-accent/50">
                    {titreDeBloc(<Eye size={16} />, t('modules:session.workspace.public_summary'),
                        <Etiquette ton="info">{t('modules:session.workspace.agencement.lu_par_les_joueurs')}</Etiquette>)}
                    <textarea
                        className="flex-1 resize-none border-none bg-transparent px-4 pb-4 text-sm leading-relaxed text-app-text focus:ring-0 custom-scrollbar"
                        value={session.publicSummary}
                        onChange={(e) => updateSessionPublicSummary(session.id, e.target.value)}
                        placeholder={t('modules:session.workspace.public_notes_placeholder')}
                        title={t('modules:session.workspace.public_summary')}
                    />
                </Panneau>
                {/* Les secrets partent masqués (« ••••• ») vers les tablettes des
                    joueurs ; seule celle du meneur les lit. */}
                <Panneau className="flex min-h-[16rem] flex-col border-accent/30 focus-within:border-accent/60">
                    {titreDeBloc(<Lock size={16} />, t('modules:session.workspace.gm_secrets'),
                        <Etiquette ton="accent"><EyeOff size={10} className="mr-1 inline -mt-0.5" />{t('modules:session.workspace.agencement.masque_aux_joueurs')}</Etiquette>)}
                    <textarea
                        className="flex-1 resize-none border-none bg-transparent px-4 pb-4 text-sm leading-relaxed text-app-text focus:ring-0 custom-scrollbar"
                        value={session.gmSecrets}
                        onChange={(e) => updateSessionGmSecrets(session.id, e.target.value)}
                        placeholder={t('modules:session.workspace.secret_notes_placeholder')}
                        title={t('modules:session.workspace.gm_secrets')}
                    />
                </Panneau>
            </div>

            {/* 4. La carte active et ses lieux épinglés */}
            <Panneau className="flex-shrink-0">
                {titreDeBloc(<MapIcon size={16} />, mapName || t('modules:session.workspace.no_active_map'),
                    lienDeBloc(t('modules:session.workspace.agencement.ouvrir_la_cartographie'), () => setActiveModule('map'), <ArrowRight size={12} />))}
                <div className="grid grid-cols-1 gap-3 px-4 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="relative h-48 overflow-hidden rounded-lg border border-app-border bg-app-surface-2">
                        {resolvedMapUrl ? (
                            isVideo ? (
                                <video src={resolvedMapUrl} className="h-full w-full object-cover" muted />
                            ) : (
                                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${resolvedMapUrl}')` }} />
                            )
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-app-subtle"><MapIcon size={40} strokeWidth={1} /></div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-widest text-app-muted">
                            <MapPin size={12} className="text-accent" />{t('modules:session.workspace.pinned_locations')}
                        </span>
                        {activeLocations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => {
                                    setMap(loc.fileUrl, loc.isVideo, loc.name);
                                    navigateToAtlasMap(loc.id);
                                }}
                                className={`flex items-center gap-3 rounded-lg border p-2 text-left transition-all ${
                                    mapName === loc.name
                                    ? 'border-accent/50 bg-accent/10 text-accent'
                                    : 'border-app-border bg-app-bg/40 text-app-text hover:border-accent/40'
                                }`}
                            >
                                <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-app-surface-2">
                                    <ResolvedAsset src={loc.fileUrl} isVideo={loc.isVideo} className="h-full w-full object-cover" alt="" />
                                </div>
                                <span className="truncate text-xs font-bold">{loc.name}</span>
                            </button>
                        ))}
                        {activeLocations.length === 0 && <p className="text-xs italic text-app-subtle">{t('modules:session.workspace.agencement.aucun_lieu')}</p>}
                    </div>
                </div>
            </Panneau>

            {/* 5. Les indices : ceux de la scène à faire tomber, puis le paquet révélé */}
            {indicesARevaler.length > 0 && (
                <Panneau className="flex-shrink-0">
                    {titreDeBloc(<Search size={16} />, t('modules:session.workspace.agencement.indices_a_reveler'),
                        <Etiquette>{indicesARevaler.length}</Etiquette>)}
                    <div className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-3">
                        {indicesARevaler.map(indice => (
                            <div key={indice.id} className="flex flex-col gap-2 rounded-lg border border-app-border bg-app-bg/40 p-3">
                                <span className="text-sm font-black text-app-text">{indice.title}</span>
                                {indice.content && <p className="line-clamp-3 text-xs leading-relaxed text-app-muted">{indice.content}</p>}
                                <button
                                    onClick={() => revealClue(indice.id)}
                                    className="mt-auto rounded-lg bg-accent py-2 text-ui-10 font-black uppercase tracking-widest text-app-on-accent transition-all hover:bg-accent/80"
                                >
                                    {t('modules:session.workspace.agencement.reveler')}
                                </button>
                            </div>
                        ))}
                    </div>
                </Panneau>
            )}

            {/* Session Clues Deck (v5.2) */}
            <SessionClueDeck />
        </section>
    );
};

export default SessionWorkspace;
