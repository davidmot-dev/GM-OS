import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Calendar, 
    ChevronLeft, 
    Eye, 
    Lock, 
    CheckSquare, 
    BookOpen,
    Skull,
    Users,
    X,
    MessageSquare,
    Save,
    Link,
    File,
    StickyNote,
    Star,
    Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ResolvedImage } from '../../../components/ResolvedImage';
import SessionChecklist from './SessionChecklist';
import SessionPrepEntityManager from './SessionPrepEntityManager';
import PanneauDeTrameDeSeance from './PanneauDeTrameDeSeance';

const SessionFocusEditor: React.FC = () => {
    const { t } = useTranslation();
    const { 
        sessions, 
        selectedSessionId, 
        updateSession,
        setCurrentView,
        entities,
        players: storePlayers,
        activeCampaignId,
        addEntityToSession,
        removeEntityFromSession,
        campaigns
    } = useSessionOSStore();

    const session = sessions.find(s => s.id === selectedSessionId && s.campaignId === activeCampaignId);
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

    if (!session) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-app-bg p-10">
                <BookOpen size={64} className="text-slate-800 mb-6" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">{t('modules:session.focus.not_found')}</p>
                <button 
                    onClick={() => setCurrentView('session-prep')}
                    className="mt-6 px-6 py-2 bg-app-surface text-app-text/60 rounded-lg font-bold"
                    title={t('modules:session.focus.back_to_list_tooltip')}
                    aria-label={t('modules:session.focus.back_to_list_tooltip')}
                >
                    {t('modules:session.focus.back_to_list')}
                </button>
            </div>
        );
    }

    // Get all characters linked to the active campaign
    const campaignCharacters = storePlayers.flatMap(p => 
        p.characters.filter(c => c.campaignId === activeCampaignId)
    );

    const linkedEntityIds = session.sessionEntityIds || [];
    
    // Sort linked items by type for display
    const linkedPlayers = campaignCharacters.filter(c => linkedEntityIds.includes(c.id));
    const linkedNpcs = entities.filter(e => linkedEntityIds.includes(e.id) && e.campaignId === activeCampaignId);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1, 
            transition: { 
                duration: 0.5, 
                ease: [0.33, 1, 0.68, 1] as const
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-bg text-app-text">
            {/* Header Area (Glassmorphism 2.0) */}
            <header className="flex items-center justify-between px-8 py-6 border-b border-app-border/40 bg-app-surface/20 backdrop-blur-3xl shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setCurrentView('session-prep')}
                        className="p-3 bg-app-surface/50 hover:bg-accent/10 hover:text-accent rounded-xl transition-all border border-app-border active:scale-95"
                        title={t('modules:session.focus.back_to_list_tooltip')}
                        aria-label={t('modules:session.focus.back_to_list_tooltip')}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-accent/20 text-accent text-ui-10 font-bold rounded uppercase tracking-widest">{activeCampaign?.name || t('modules:session.prep.no_active_campaign')}</span>
                            <span className="text-app-text/60 font-bold text-ui-10">/</span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-ui-10 font-bold rounded uppercase tracking-widest">{t('modules:session.prep.session_card_number', { number: session.number })}</span>
                            <h2 className="text-2xl font-black tracking-tight text-app-text">{t('modules:session.focus.title')}</h2>
                        </div>
                        <p className="text-xs text-app-text/60 font-medium mt-1">{t('modules:session.focus.subtitle', { date: new Date(session.date).toLocaleDateString() })}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Status Toggle (Pills Style) */}
                    <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
                        {(['planned', 'active', 'done'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => updateSession(session.id, { status })}
                                className={`px-5 py-2 rounded-xl text-ui-10 font-black uppercase tracking-widest transition-all ${
                                    session.status === status 
                                    ? 'bg-accent text-app-bg shadow-glow-accent' 
                                    : 'text-app-text/30 hover:text-app-text/60 hover:bg-white/5'
                                }`}
                            >
                                {t(`modules:session.prep.status.${status}`)}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => setCurrentView('cockpit')}
                        className="flex items-center gap-3 px-6 py-3 bg-accent hover:brightness-110 text-white rounded-xl font-bold text-sm shadow-glow-accent transition-all active:scale-95"
                    >
                        <Save size={18} />
                        {t('modules:session.focus.save_close')}
                    </button>
                </div>
            </header>

            {/* Main Content Scrollable */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 overflow-y-auto custom-scrollbar"
            >
                <div className="max-w-screen-2xl mx-auto p-10 grid grid-cols-12 gap-10">
                    
                    {/* Left Column: Massive Content Editor */}
                    <div className="col-span-8 flex flex-col gap-10">
                        {/* Summary Section */}
                        <motion.div variants={itemVariants} className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-accent group/title">
                                <MessageSquare size={20} className="group-hover/title:rotate-12 transition-transform" />
                                <h3 className="text-sm font-black uppercase tracking-[0.3em]">{t('modules:session.focus.narration_title')}</h3>
                            </div>
                            
                            <div className="glass-bento rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl focus-within:border-accent/30 transition-colors">
                                <div className="grid grid-cols-2 divide-x divide-white/5 min-h-[600px]">
                                    {/* Public Side */}
                                    <div className="flex flex-col p-8 gap-6">
                                        <div className="flex items-center justify-between opacity-80">
                                            <span className="text-ui-10 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Eye size={12} /> {t('modules:session.focus.synopsis_players')}
                                            </span>
                                            <span className="text-ui-10 font-mono">{t('modules:session.focus.synopsis_mdd')}</span>
                                        </div>
                                        <textarea 
                                            value={session.publicSummary}
                                            onChange={(e) => updateSession(session.id, { publicSummary: e.target.value })}
                                            placeholder={t('modules:session.focus.synopsis_placeholder')}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg leading-relaxed text-app-text outline-none resize-none p-0 placeholder:text-app-text/40"
                                        />
                                    </div>

                                    {/* Private Side */}
                                    <div className="flex flex-col p-8 gap-6 bg-accent/[0.04]">
                                        <div className="flex items-center justify-between text-accent">
                                            <span className="text-ui-10 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Lock size={12} /> {t('modules:session.focus.secrets_title')}
                                            </span>
                                            <span className="text-ui-10 font-mono font-bold tracking-tighter cursor-help" title={t('modules:session.focus.secrets_tooltip')}>{t('modules:session.focus.secrets_security')}</span>
                                        </div>
                                        <textarea 
                                            value={session.gmSecrets}
                                            onChange={(e) => updateSession(session.id, { gmSecrets: e.target.value })}
                                            placeholder={t('modules:session.focus.secrets_placeholder')}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg leading-relaxed text-accent outline-none italic resize-none p-0 placeholder:text-accent/50 scroll-pt-10 scrollbar-thin"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white/5 px-8 py-4 border-t border-white/5 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex gap-8 text-ui-11 font-mono font-bold uppercase tracking-widest text-app-text/40">
                                        <span>{t('modules:session.focus.stats_words', { count: session.publicSummary.split(/\s+/).filter(Boolean).length + session.gmSecrets.split(/\s+/).filter(Boolean).length })}</span>
                                        <span>{t('modules:session.focus.stats_chars', { count: session.publicSummary.length + session.gmSecrets.length })}</span>
                                    </div>
                                    <div className="text-ui-9 font-black uppercase flex items-center gap-2 text-accent/60">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow-emerald"></div>
                                        {t('modules:session.focus.sync_status')}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        {/*
                            La trame prévue vient AVANT les notes et la
                            checklist : c'est elle qui dit ce que la séance va
                            traverser, et le reste s'y accroche.
                        */}
                        <motion.div variants={itemVariants} className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-accent">
                                <Layers size={20} />
                                <h3 className="text-sm font-black uppercase tracking-[0.3em]">Trame prévue</h3>
                            </div>
                            <PanneauDeTrameDeSeance session={session} />
                        </motion.div>

                        {/* Session Notes Section (from Cockpit) */}
                        <motion.div variants={itemVariants} className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-gm-cyan">
                                <StickyNote size={20} />
                                <h3 className="text-sm font-black uppercase tracking-[0.3em]">{t('modules:session.focus.notes_title')}</h3>
                            </div>
                            <div className="glass-bento rounded-[2.5rem] border border-white/5 p-8 shadow-xl flex flex-col gap-4">
                                <p className="text-ui-10 text-app-text/40 font-black uppercase tracking-widest leading-relaxed">
                                    {t('modules:session.focus.notes_subtitle')}
                                </p>
                                <textarea 
                                    value={session.sessionNotes || ''}
                                    onChange={(e) => updateSession(session.id, { sessionNotes: e.target.value })}
                                    placeholder={t('modules:session.focus.notes_placeholder')}
                                    className="w-full bg-transparent border-none rounded-2xl p-4 text-sm leading-relaxed text-app-text/90 outline-none resize-none min-h-[200px] focus:ring-0 transition-all custom-scrollbar placeholder:text-app-text/20"
                                />
                            </div>
                        </motion.div>

                        {/* Checklist Section */}
                        <motion.div variants={itemVariants} className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-app-text/30">
                                <CheckSquare size={20} />
                                <h3 className="text-sm font-black uppercase tracking-[0.3em]">{t('modules:session.focus.checklist_title')}</h3>
                            </div>
                            <div className="glass-bento rounded-[2.5rem] border border-white/5 p-8 shadow-xl">
                                <SessionChecklist sessionId={session.id} />
                            </div>
                        </motion.div>

                        {/* Feedbacks Section */}
                        <motion.div variants={itemVariants} className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-accent group/title">
                                <MessageSquare size={20} className="group-hover/title:rotate-12 transition-transform" />
                                <h3 className="text-sm font-black uppercase tracking-[0.3em]">{t('modules:session.feedback.title')}</h3>
                            </div>
                            
                            <div className="glass-bento rounded-[2.5rem] border border-white/5 p-8 shadow-2xl flex flex-col gap-6">
                                {(!session.feedbacks || session.feedbacks.length === 0) ? (
                                    <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                                        <p className="text-xs text-app-text/50 font-black uppercase tracking-widest">{t('modules:session.feedback.no_feedback')}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {/* Averages */}
                                        {(() => {
                                            const fbs = session.feedbacks || [];
                                            const total = fbs.length;
                                            const funAvg = Number((fbs.reduce((sum, f) => sum + f.funRating, 0) / total).toFixed(1));
                                            const storyAvg = Number((fbs.reduce((sum, f) => sum + f.storyRating, 0) / total).toFixed(1));
                                            const combatAvg = Number((fbs.reduce((sum, f) => sum + f.combatRating, 0) / total).toFixed(1));

                                            const renderStarsShort = (rating: number) => (
                                                <div className="flex gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, idx) => (
                                                        <Star key={idx} size={12} className={idx < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
                                                    ))}
                                                </div>
                                            );

                                            return (
                                                <div className="grid grid-cols-3 gap-4 bg-black/20 p-5 rounded-2xl border border-white/5 mb-2">
                                                    <div className="flex flex-col gap-1 items-center text-center">
                                                        <span className="text-ui-10 text-slate-400 font-bold uppercase tracking-wider">{t('modules:session.feedback.fun')}</span>
                                                        <span className="font-mono text-accent text-sm font-black">{funAvg} / 5</span>
                                                        {renderStarsShort(funAvg)}
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-center text-center">
                                                        <span className="text-ui-10 text-slate-400 font-bold uppercase tracking-wider">{t('modules:session.feedback.story')}</span>
                                                        <span className="font-mono text-accent text-sm font-black">{storyAvg} / 5</span>
                                                        {renderStarsShort(storyAvg)}
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-center text-center">
                                                        <span className="text-ui-10 text-slate-400 font-bold uppercase tracking-wider">{t('modules:session.feedback.combat')}</span>
                                                        <span className="font-mono text-accent text-sm font-black">{combatAvg} / 5</span>
                                                        {renderStarsShort(combatAvg)}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Individual list */}
                                        <div className="flex flex-col gap-3 mt-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                                            {session.feedbacks.map((f) => {
                                                const char = storePlayers
                                                    .flatMap(p => p.characters)
                                                    .find(c => c.id === f.characterId);
                                                
                                                return (
                                                    <div key={f.characterId} className="bg-black/10 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-slate-950/40">
                                                                    {char?.portraitUrl ? (
                                                                        <ResolvedImage src={char.portraitUrl} alt={f.characterName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-ui-10 font-bold text-slate-400">
                                                                            {f.characterName.substring(0, 2).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="font-bold text-xs text-slate-200">{f.characterName}</span>
                                                            </div>
                                                            <span className="text-ui-9 text-slate-500 font-mono">
                                                                {new Date(f.timestamp).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {f.notes && (
                                                            <p className="text-xs text-slate-300 bg-black/20 rounded-xl p-3 border border-white/5 whitespace-pre-wrap leading-relaxed">
                                                                {f.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Entity Management */}
                    <div className="col-span-4 flex flex-col gap-10">
                        {/* Section Date Quick Pick */}
                        <motion.div variants={itemVariants} className="glass-bento rounded-[2.5rem] border border-white/5 p-8 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6 text-app-text/40">
                                <Calendar size={18} className="text-accent" />
                                <span className="text-ui-10 font-black uppercase tracking-widest">{t('modules:session.focus.date_title')}</span>
                            </div>
                            <input 
                                type="date"
                                value={session.date}
                                onChange={(e) => updateSession(session.id, { date: e.target.value })}
                                title={t('modules:session.focus.date_tooltip')}
                                aria-label={t('modules:session.focus.date_tooltip')}
                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-4 text-sm font-black text-accent focus:ring-accent/30 focus:border-accent/40 shadow-inner transition-all appearance-none"
                            />
                        </motion.div>

                        {/* Additional Resources (Link & File) */}
                        <motion.div variants={itemVariants} className="glass-bento rounded-[2.5rem] border border-white/5 p-8 shadow-2xl flex flex-col gap-8">
                            <div className="flex items-center gap-3 text-app-text/40">
                                <Link size={18} className="text-accent" />
                                <span className="text-ui-10 font-black uppercase tracking-widest">{t('modules:session.focus.resources_title')}</span>
                            </div>
                            
                            {/* HTTP Link */}
                            <div className="flex flex-col gap-3">
                                <label className="text-ui-9 text-app-text/30 uppercase font-black ml-1 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-accent"></div>
                                    {t('modules:session.focus.resource_link_label')}
                                </label>
                                <div className="relative group/input">
                                    <input 
                                        type="url"
                                        value={session.externalLink || ''}
                                        onChange={(e) => updateSession(session.id, { externalLink: e.target.value })}
                                        placeholder="https://example.com"
                                        className="w-full bg-black/20 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-xs focus:ring-accent/30 focus:border-accent/40 transition-all text-app-text placeholder:text-app-text/20 shadow-inner"
                                    />
                                    <Link size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text/20 group-focus-within/input:text-accent transition-colors" />
                                </div>
                            </div>

                            {/* File Path */}
                            <div className="flex flex-col gap-3">
                                <label className="text-ui-9 text-app-text/30 uppercase font-black ml-1 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-accent"></div>
                                    {t('modules:session.focus.resource_file_label')}
                                </label>
                                <div className="relative group/input">
                                    <input 
                                        type="text"
                                        value={session.filePath || ''}
                                        onChange={(e) => updateSession(session.id, { filePath: e.target.value })}
                                        placeholder="C:/MonDossier/mon_scénario.pdf"
                                        className="w-full bg-black/20 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-xs focus:ring-accent/30 focus:border-accent/40 transition-all text-app-text placeholder:text-app-text/20 shadow-inner"
                                    />
                                    <File size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text/20 group-focus-within/input:text-accent transition-colors" />
                                </div>
                                <p className="text-ui-8 text-app-text/20 italic px-1 opacity-60">{t('modules:session.focus.resource_file_hint')}</p>
                            </div>
                        </motion.div>

                        {/* Players Management */}
                        <motion.div variants={itemVariants} className="flex flex-col gap-4">
                            <div className="flex items-center justify-between text-blue-400">
                                <div className="flex items-center gap-3">
                                    <Users size={20} />
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em]">{t('modules:session.focus.players_title')}</h3>
                                </div>
                                <span className="text-ui-10 font-black opacity-40">({linkedPlayers.length})</span>
                            </div>
                            <div className="glass-bento rounded-[2.5rem] border border-white/5 p-8 flex flex-col gap-6 shadow-xl">
                                <div className="flex flex-wrap gap-3">
                                    {campaignCharacters.map(char => {
                                        const isLinked = linkedEntityIds.includes(char.id);
                                        return (
                                            <button
                                                key={char.id}
                                                onClick={() => isLinked ? removeEntityFromSession(session.id, char.id) : addEntityToSession(session.id, char.id)}
                                                className={`group relative w-16 h-16 rounded-2xl border-2 transition-all p-1 hover:scale-110 active:scale-95 ${
                                                    isLinked ? 'border-accent bg-accent/10 shadow-glow-accent/10' : 'border-white/5 bg-black/20 grayscale hover:grayscale-0'
                                                }`}
                                                title={char.name}
                                            >
                                                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900 border border-white/5">
                                                    <ResolvedImage src={char.portraitUrl} alt={char.name} className="w-full h-full object-cover" />
                                                </div>
                                                {isLinked && (
                                                    <div className="absolute -top-1.5 -right-1.5 bg-accent text-app-bg rounded-full p-0.5 border-2 border-app-bg shadow-lg">
                                                        <X size={10} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                    {campaignCharacters.length === 0 && (
                                        <div className="flex-1 py-8 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                                            <p className="text-ui-10 text-app-text/50 font-black uppercase tracking-widest leading-relaxed">{t('modules:session.focus.no_players')}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-ui-9 text-app-text/20 italic font-medium uppercase tracking-wider">
                                    <div className="w-1 h-1 bg-accent rounded-full animate-pulse"></div>
                                    {t('modules:session.focus.toggle_presence_hint')}
                                </div>
                            </div>
                        </motion.div>

                        {/* NPCs & Monsters Management */}
                        <motion.div variants={itemVariants} className="flex flex-col gap-4">
                            <div className="flex items-center justify-between text-accent">
                                <div className="flex items-center gap-3">
                                    <Skull size={20} />
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em]">{t('modules:session.focus.npcs_title')}</h3>
                                </div>
                                <span className="text-ui-10 font-black opacity-40">({linkedNpcs.length})</span>
                            </div>
                            <div className="glass-bento rounded-[2.5rem] border border-white/5 p-8 shadow-xl">
                                <SessionPrepEntityManager sessionId={session.id} />
                            </div>
                        </motion.div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default SessionFocusEditor;
