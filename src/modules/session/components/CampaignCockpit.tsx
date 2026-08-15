import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useModalStore } from '../../../stores/useModalStore';
import { AlertTriangle, BookOpen, LayoutDashboard, Swords, Users, Users2, Map as MapIcon, Archive, PlusCircle, Library, FileText, ExternalLink, File, StickyNote, Play, RefreshCw, Eye, Zap, Layers, MessageSquare } from 'lucide-react';
import SessionChecklist from './SessionChecklist';
import TradeRequestPanel from './TradeRequestPanel';
import { tousLesPilotes } from '../store/tousLesPilotes';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';

const CampaignCockpit: React.FC = () => {
    const { t } = useTranslation();
    const { 
        campaigns, 
        activeCampaignId, 
        sessions, 
        setCurrentView, 
        currentView, 
        updateSession, 
        applySystemSnapshot,
        decks,
        customGameDrivers,
        customSheetTemplates
    } = useSessionOSStore();
    const { setActiveModule } = useSessionStore();
    const { showCustom, showConfirm, customVariant, type: modalType } = useModalStore();
    const isLootOSOpen = modalType === 'custom' && customVariant === 'loot-os';

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    const campaignSystem = activeCampaign?.system || 'generic';
    const hasLinkedDeck = decks.some(d => d.systemId === campaignSystem);
    const { theme } = useSessionStore();

    /**
     * À quel jeu cette campagne est rattachée — **et le dire quand elle ne
     * l'est à aucun**.
     *
     * **Le défaut, trouvé le 2026-08-15 en cherchant pourquoi David ne voyait
     * pas ses réserves de table.** « Agents de Dune » porte `system: 'generic'`
     * — l'identifiant d'un **gabarit de fiche**, pas d'un pilote. Le sélecteur
     * de la fiche de campagne propose les deux familles dans le même champ, et
     * `'generic'` est la valeur par défaut : une campagne créée sans choix
     * explicite se retrouve donc rattachée à aucun jeu.
     *
     * Rien ne le disait. La carte annonçait « CAMPAGNE ACTIVE » et s'arrêtait
     * là, pendant que le bandeau des réserves, le modèle de santé, le moteur de
     * dés et l'ordre du tour se taisaient tous les quatre — chacun ayant
     * d'excellentes raisons de se taire, aucun ne pouvant savoir que les trois
     * autres se taisaient aussi. *C'est la forme exacte du défaut que ce projet
     * traque : quelque chose qui ne fonctionne pas sans le dire.*
     *
     * On ne corrige rien d'autorité : rattacher une chronique à un jeu est une
     * décision, pas une réparation. On la nomme, et on ouvre la porte.
     */
    const rattachement = React.useMemo(() => {
        if (!activeCampaign) return null;
        const pilote = tousLesPilotes(customGameDrivers).find(d => d.id === activeCampaign.system);
        if (pilote) return { pilote };
        const gabarit = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates]
            .find(t_val => t_val.id === activeCampaign.system);
        return { pilote: null, gabarit };
    }, [activeCampaign, customGameDrivers, customSheetTemplates]);

    // Find active session for progress (mock logic for now)
    const activeSession = activeCampaign ? sessions.find(s => s.id === activeCampaign.activeSessionId && s.status === 'active') : null;
    const sessionCount = sessions.filter(s => s.campaignId === activeCampaignId).length;

    return (
        <aside className="flex-1 min-h-0 premium-glass border-r-0 flex flex-col">
            <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none z-10" />
            
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar w-full flex flex-col gap-6 p-5">
                {/* Campaign Card */}
            <div
                onClick={() => setCurrentView('campaign-details')}
                className={`flex-shrink-0 glass-bento rounded-xl p-4 cursor-pointer transition-all group relative ${
                    theme === 'medieval' ? 'shadow-glow-accent/20' : 'shadow-glow-gold/10'
                } hover:scale-[1.02] hover:shadow-glow-accent/40`}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className={`text-app-text font-bold text-lg group-hover:text-accent transition-colors ${theme === 'medieval' ? 'font-display tracking-[0.05em]' : ''}`}>
                            {activeCampaign?.name || t('modules:session.cockpit.none_active')}
                        </h3>
                        <p className={`text-app-text/60 text-[10px] uppercase tracking-[0.18em] ${theme === 'medieval' ? 'font-display italic' : 'font-semibold'}`}>
                            {theme === 'medieval' ? t('modules:session.cockpit.active_chronicle') : t('modules:session.cockpit.active_campaign')}
                        </p>
                    </div>
                    <BookOpen className="text-accent group-hover:scale-110 transition-transform" size={24} />
                </div>

                {/*
                    Le jeu de la campagne, nommé. Trois cas, et les deux
                    derniers sont des impasses silencieuses qu'il fallait
                    rendre visibles.
                */}
                {rattachement?.pilote && (
                    <p className="text-[10px] text-app-text/40 flex items-center gap-1.5">
                        <span className="text-sm">{rattachement.pilote.emoji}</span>
                        <span className="font-bold">{rattachement.pilote.name}</span>
                    </p>
                )}
                {rattachement && !rattachement.pilote && (
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setCurrentView('campaign-editor'); }}
                        className="mt-1 w-full text-left flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[10px] leading-snug text-amber-300/90 hover:bg-amber-500/20 transition-colors"
                    >
                        <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                        <span>
                            {rattachement.gabarit
                                ? <>Rattachée à « {rattachement.gabarit.name} », qui est un <b>gabarit de fiche</b> et non un jeu.</>
                                : <>Rattachée à <b>aucun jeu</b>.</>}
                            {' '}Ni dés, ni modèle de santé, ni réserves de table. <u>Choisir le jeu</u>
                        </span>
                    </button>
                )}

                <div className="mt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-app-text/40">
                        <span>{t('modules:session.cockpit.session_progress')}</span>
                        <span>{t('modules:session.cockpit.session_step', { current: activeSession?.number || 0, total: sessionCount || 0 })}</span>
                    </div>
                    <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-accent h-full shadow-glow-accent"
                            style={{ width: `${sessionCount ? ((activeSession?.number || 0) / sessionCount) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-1 flex-shrink-0">
                <p className={`text-app-text/40 text-[10px] uppercase tracking-[0.2em] mb-2 px-3 ${theme === 'medieval' ? 'font-display' : ''}`}>
                    {theme === 'medieval' ? t('modules:session.cockpit.management_arcanic') : t('modules:session.cockpit.management')}
                </p>
                <button
                    onClick={() => setCurrentView('cockpit')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all nav-item-glow ${
                        currentView === 'cockpit' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-white/5 hover:text-app-text'
                    }`}
                >
                    <LayoutDashboard className={currentView === 'cockpit' ? 'scale-110 shadow-glow-accent' : 'group-hover:scale-110 transition-transform'} size={20} />
                    <span className={`text-sm tracking-tight ${theme === 'medieval' ? 'font-display' : 'font-bold'}`}>
                        {t('modules:session.cockpit.view_cockpit')}
                    </span>
                </button>
                <button
                    onClick={() => setActiveModule('combat')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-app-text/80 hover:bg-app-surface hover:text-app-text transition-all w-full text-left"
                >
                    <Swords size={20} />
                    <span className="text-sm font-medium">{t('modules:session.cockpit.view_encounters')}</span>
                </button>
                <button
                    onClick={() => setCurrentView('storyboard')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all nav-item-glow ${
                        currentView === 'storyboard' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-white/5 hover:text-app-text'
                    }`}
                >
                    <Zap className={currentView === 'storyboard' ? 'text-accent scale-110 shadow-glow-accent' : 'group-hover:scale-110 transition-transform'} size={20} />
                    <span className={`text-sm tracking-tight ${theme === 'medieval' ? 'font-display' : 'font-bold'}`}>
                        {t('modules:session.cockpit.view_storyboard')}
                    </span>
                </button>
                <button
                    onClick={() => setCurrentView('npc-gallery')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'npc-gallery' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                >
                    <Users size={20} />
                    <span className="text-sm font-medium">{t('modules:session.cockpit.view_npc_gallery')}</span>
                </button>
                <button
                    onClick={() => setCurrentView('social-graph')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'social-graph' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                >
                    <Users size={20} className={currentView === 'social-graph' ? 'text-accent' : 'text-app-text/60'} />
                    <span className="text-sm font-medium">{t('modules:session.cockpit.view_social_graph')}</span>
                </button>
                <button
                    onClick={() => setCurrentView('world-atlas')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'world-atlas' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                >
                    <MapIcon size={20} />
                    <span className="text-sm font-medium">{t('modules:session.cockpit.view_world_atlas')}</span>
                </button>
                <button
                    onClick={() => showCustom('loot-os')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${
                        isLootOSOpen ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-white/5 hover:text-app-text'
                    }`}
                >
                    <Archive size={20} className={isLootOSOpen ? 'text-accent scale-110 shadow-glow-accent' : 'group-hover:scale-110 transition-transform'} />
                    <span className={`text-sm tracking-tight ${theme === 'medieval' ? 'font-display' : 'font-bold'}`}>
                        {t('modules:session.cockpit.view_loot_os')}
                    </span>
                </button>
                <button
                    onClick={() => setCurrentView('session-prep')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'session-prep' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                >
                    <PlusCircle size={20} className={currentView === 'session-prep' ? 'text-accent' : 'text-app-text/60'} />
                    <span className="text-sm font-medium">{t('modules:session.cockpit.view_session_prep')}</span>
                </button>
                {/*
                    Le raccourci « Forge Système » vivait ici. La Forge est un
                    module à part : on la rejoint par la barre latérale, comme
                    tout module. Le cockpit ne liste que les vues de la campagne
                    ouverte, et documenter un livre n'en est pas une.
                */}
                <button
                    onClick={() => setCurrentView(hasLinkedDeck ? 'deck-player' : 'deck-library')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all nav-item-glow ${
                        currentView === 'deck-player' || currentView === 'deck-library' 
                        ? 'bg-gm-gold/10 text-gm-gold border border-gm-gold/20' 
                        : 'text-app-text/60 hover:bg-white/5 hover:text-app-text'
                    }`}
                >
                    <Layers className={currentView === 'deck-player' || currentView === 'deck-library' ? 'text-gm-gold scale-110 shadow-glow-gold' : 'group-hover:scale-110 transition-transform'} size={20} />
                    <span className="text-sm font-bold tracking-tight text-left">{t('modules:session.cockpit.view_deck_os')}</span>
                </button>


                {activeSession ? (
                    <div className="flex flex-col gap-1 mt-1">
                        <motion.button
                            variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                            onClick={() => showConfirm(
                                t('modules:session.cockpit.session_done_confirm'),
                                () => updateSession(activeSession.id, { status: 'done' }),
                                undefined,
                                t('modules:session.cockpit.confirm_finish'),
                                t('modules:session.cockpit.confirm_continue')
                            )}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all glass-bento relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                            <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />
                            <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            
                            <Play size={20} fill="currentColor" className="text-emerald-500 relative z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold uppercase tracking-tighter text-emerald-400 relative z-10 drop-shadow-md">{t('modules:session.cockpit.active_session')}</span>
                        </motion.button>
                        
                        <button
                            onClick={() => showCustom('session-notes')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all text-app-text/60 hover:bg-accent/10 hover:text-accent"
                        >
                            <StickyNote size={20} className="text-accent/60 group-hover:text-accent transition-colors" />
                            <span className="text-sm font-bold uppercase tracking-tighter">{t('modules:session.cockpit.session_notes')}</span>
                        </button>

                        <button
                            onClick={() => showCustom('session-feedback', { sessionId: activeSession.id })}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all text-app-text/60 hover:bg-accent/10 hover:text-accent"
                        >
                            <MessageSquare size={20} className="text-accent/60 group-hover:text-accent transition-colors" />
                            <span className="text-sm font-bold uppercase tracking-tighter">{t('modules:session.feedback.title')}</span>
                        </button>

                        {activeSession.moduleSnapshot && (
                            <div className="flex flex-col gap-1 mt-1">
                                <button
                                    onClick={() => showConfirm(
                                        t('modules:session.cockpit.restore_snapshot_confirm'),
                                        () => applySystemSnapshot(activeSession.moduleSnapshot!),
                                        undefined,
                                        t('modules:session.cockpit.confirm_restore'),
                                        t('modules:session.cockpit.cancel')
                                    )}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/10"
                                    title={t('modules:session.cockpit.restore_state')}
                                >
                                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                                    <span className="text-sm font-bold uppercase tracking-tighter flex-1">{t('modules:session.cockpit.restore_state')}</span>
                                </button>
                                <button
                                    onClick={() => showCustom('snapshot-viewer', { snapshot: activeSession.moduleSnapshot, sessionName: t('modules:session.cockpit.session_hash', { number: activeSession.number }) })}
                                    className="flex items-center gap-3 px-3 py-1.5 rounded-lg group w-full text-left transition-all text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/5 text-[10px]"
                                >
                                    <Eye size={14} />
                                    <span className="font-bold uppercase tracking-widest">{t('modules:session.cockpit.view_content')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    sessions.some(s => s.campaignId === activeCampaignId && s.status === 'planned') && (
                        <button
                            onClick={() => showCustom('session-select')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all text-app-text/60 hover:bg-accent/10 hover:text-accent mt-1"
                        >
                            <Play size={20} className="text-accent/60 group-hover:text-accent transition-colors" />
                            <span className="text-sm font-bold uppercase tracking-tighter">{t('modules:session.cockpit.launch_session')}</span>
                        </button>
                    )
                )}

                <div className="pt-4 mt-2 border-t border-app-border/40">
                    <button
                        onClick={() => setCurrentView('library')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'library' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                    >
                        <Library size={20} className={currentView === 'library' ? 'text-accent' : 'text-app-text/60'} />
                        <span className="text-sm font-bold uppercase tracking-tighter">{t('modules:session.cockpit.library')}</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('players')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'players' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                    >
                        <Users2 size={20} className={currentView === 'players' ? 'text-accent' : 'text-app-text/60'} />
                        <span className="text-sm font-bold uppercase tracking-tighter text-left">{t('modules:session.cockpit.players')}</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('templates')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group w-full text-left transition-all ${currentView === 'templates' ? 'bg-accent/10 text-accent' : 'text-app-text/80 hover:bg-app-bg hover:text-app-text'}`}
                    >
                        <FileText size={20} className={currentView === 'templates' ? 'text-accent' : 'text-app-text/60'} />
                        <span className="text-sm font-bold uppercase tracking-tighter text-left">{t('modules:session.cockpit.sheet_models')}</span>
                    </button>
                </div>
            </nav>

            {/* P2P Trades Validation */}
            <TradeRequestPanel />

            {/* Checklist Section */}
            {activeSession && (
                <SessionChecklist />
            )}

            {/* Session Resources Section */}
            {activeSession && (activeSession.externalLink || activeSession.filePath) && (
                <div className="flex flex-col gap-3 py-4 border-t border-app-border/40 flex-shrink-0">
                    <p className="text-app-text/40 text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-1">{t('modules:session.cockpit.session_resources')}</p>
                    <div className="flex flex-col gap-2 px-1">
                        {activeSession.externalLink && (
                            <a 
                                href={activeSession.externalLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
                            >
                                <ExternalLink size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold truncate">{t('modules:session.cockpit.open_http_link')}</span>
                            </a>
                        )}
                        {activeSession.filePath && (
                            <button 
                                onClick={() => {
                                    if (window.appBridge?.openFile) {
                                        window.appBridge.openFile(activeSession.filePath!);
                                    } else {
                                        console.log('Opening file:', activeSession.filePath);
                                        alert(`File: ${activeSession.filePath}`);
                                    }
                                }}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
                            >
                                <File size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold truncate">{t('modules:session.cockpit.access_file')}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            </div>
        </aside>
    );
};

export default CampaignCockpit;
