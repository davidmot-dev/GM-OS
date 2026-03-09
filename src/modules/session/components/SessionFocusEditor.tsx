import React from 'react';
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
    StickyNote
} from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import SessionChecklist from './SessionChecklist';
import SessionPrepEntityManager from './SessionPrepEntityManager';

const SessionFocusEditor: React.FC = () => {
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
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-10">
                <BookOpen size={64} className="text-slate-800 mb-6" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">Session Not Found</p>
                <button 
                    onClick={() => setCurrentView('session-prep')}
                    className="mt-6 px-6 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold"
                >
                    BACK TO LIST
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

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100">
            {/* Header Area */}
            <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-slate-900/30 backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setCurrentView('session-prep')}
                        className="p-3 bg-slate-800/50 hover:bg-gm-gold/10 hover:text-gm-gold rounded-xl transition-all border border-white/5 active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-gm-gold/20 text-gm-gold text-[10px] font-bold rounded uppercase tracking-widest">{activeCampaign?.name || 'Campagne'}</span>
                            <span className="text-slate-600 font-bold text-[10px]">/</span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase tracking-widest">Session #{session.number}</span>
                            <h2 className="text-2xl font-black tracking-tight">Détails de Préparation</h2>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">Édition immersive de la session du {new Date(session.date).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Status Toggle */}
                    <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/5">
                        {(['planned', 'active', 'done'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => updateSession(session.id, { status })}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    session.status === status 
                                    ? 'bg-gm-gold text-slate-900 shadow-glow-gold/20' 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => setCurrentView('cockpit')}
                        className="flex items-center gap-3 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                    >
                        <Save size={18} />
                        SAUVEGARDER & FERMER
                    </button>
                </div>
            </header>

            {/* Main Content Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-screen-2xl mx-auto p-10 grid grid-cols-12 gap-10">
                    
                    {/* Left Column: Massive Content Editor */}
                    <div className="col-span-8 flex flex-col gap-10">
                        {/* Summary Section */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-gm-gold">
                                <MessageSquare size={20} />
                                <h3 className="text-sm font-bold uppercase tracking-[0.3em]">Narration & Synopsis</h3>
                            </div>
                            
                            <div className="bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-2xl focus-within:border-gm-gold/30 transition-colors">
                                <div className="grid grid-cols-2 divide-x divide-white/5 min-h-[600px]">
                                    {/* Public Side */}
                                    <div className="flex flex-col p-8 gap-6">
                                        <div className="flex items-center justify-between opacity-60">
                                            <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Eye size={12} /> Synopsis Joueurs
                                            </span>
                                            <span className="text-[10px] font-mono">MDD • PUBLIC</span>
                                        </div>
                                        <textarea 
                                            value={session.publicSummary}
                                            onChange={(e) => updateSession(session.id, { publicSummary: e.target.value })}
                                            placeholder="Que savent les joueurs à ce stade ? Résumez ici ce qui sera visible dans leur journal de quête..."
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg leading-relaxed text-slate-300 resize-none p-0 placeholder:text-slate-700"
                                        />
                                    </div>

                                    {/* Private Side */}
                                    <div className="flex flex-col p-8 gap-6 bg-gm-gold/[0.02]">
                                        <div className="flex items-center justify-between text-gm-gold/60">
                                            <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Lock size={12} /> Secrets du MJ
                                            </span>
                                            <span className="text-[10px] font-mono font-bold tracking-tighter cursor-help" title="Ces notes ne sont jamais partagées aux joueurs">TOP SECRET</span>
                                        </div>
                                        <textarea 
                                            value={session.gmSecrets}
                                            onChange={(e) => updateSession(session.id, { gmSecrets: e.target.value })}
                                            placeholder="Notes de préparation, plot twists, stats de boss, récompenses cachées..."
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg leading-relaxed text-gm-gold/80 italic resize-none p-0 placeholder:text-gm-gold/20 scroll-pt-10 scrollbar-thin"
                                        />
                                    </div>
                                </div>
                                <div className="bg-slate-900/80 px-8 py-4 border-t border-white/5 flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity">
                                    <div className="flex gap-8 text-[11px] font-mono font-bold uppercase tracking-widest">
                                        <span>Words: {session.publicSummary.split(/\s+/).filter(Boolean).length + session.gmSecrets.split(/\s+/).filter(Boolean).length}</span>
                                        <span>Characters: {session.publicSummary.length + session.gmSecrets.length}</span>
                                    </div>
                                    <div className="text-[10px] font-bold uppercase flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        Dernière synchro: {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Session Notes Section (from Cockpit) */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-gm-cyan">
                                <StickyNote size={20} />
                                <h3 className="text-sm font-bold uppercase tracking-[0.3em]">Notes de Session (Cockpit)</h3>
                            </div>
                            <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-8 shadow-xl flex flex-col gap-4">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                    Ces notes ont été prises en cours de partie via le cockpit. Elles servent de base pour votre résumé final.
                                </p>
                                <textarea 
                                    value={session.sessionNotes || ''}
                                    onChange={(e) => updateSession(session.id, { sessionNotes: e.target.value })}
                                    placeholder="Aucune note n'a encore été prise pour cette session..."
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-6 text-sm leading-relaxed text-slate-300 resize-none min-h-[200px] focus:ring-gm-cyan/30 focus:border-gm-cyan/30 transition-all custom-scrollbar"
                                />
                            </div>
                        </div>

                        {/* Checklist Section */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-slate-400">
                                <CheckSquare size={20} />
                                <h3 className="text-sm font-bold uppercase tracking-[0.3em]">Checklist de Session</h3>
                            </div>
                            <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-8 shadow-xl">
                                <SessionChecklist sessionId={session.id} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Entity Management */}
                    <div className="col-span-4 flex flex-col gap-10">
                        {/* Section Date Quick Pick */}
                        <div className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4 text-slate-400">
                                <Calendar size={18} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Date de la Partie</span>
                            </div>
                            <input 
                                type="date"
                                value={session.date}
                                onChange={(e) => updateSession(session.id, { date: e.target.value })}
                                className="w-full bg-slate-800/50 border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:ring-gm-gold focus:border-gm-gold transition-all"
                            />
                        </div>

                        {/* Additional Resources (Link & File) */}
                        <div className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 shadow-2xl flex flex-col gap-6">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Link size={18} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Ressources Annexes</span>
                            </div>
                            
                            {/* HTTP Link */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] text-slate-500 uppercase font-black ml-1">Lien Externe (HTTP/S)</label>
                                <div className="relative group/input">
                                    <input 
                                        type="url"
                                        value={session.externalLink || ''}
                                        onChange={(e) => updateSession(session.id, { externalLink: e.target.value })}
                                        placeholder="https://example.com"
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-gm-gold focus:border-gm-gold transition-all"
                                    />
                                    <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-gm-gold transition-colors" />
                                </div>
                            </div>

                            {/* File Path */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] text-slate-500 uppercase font-black ml-1">Fichier Lié</label>
                                <div className="relative group/input">
                                    <input 
                                        type="text"
                                        value={session.filePath || ''}
                                        onChange={(e) => updateSession(session.id, { filePath: e.target.value })}
                                        placeholder="C:/MonDossier/mon_scénario.pdf"
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-gm-gold focus:border-gm-gold transition-all"
                                    />
                                    <File size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-gm-gold transition-colors" />
                                </div>
                                <p className="text-[8px] text-slate-600 italic px-1">Collez le chemin complet du fichier.</p>
                            </div>
                        </div>

                        {/* Players Management */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between text-blue-400">
                                <div className="flex items-center gap-3">
                                    <Users size={20} />
                                    <h3 className="text-sm font-bold uppercase tracking-[0.3em]">PJ Presents</h3>
                                </div>
                                <span className="text-[10px] font-bold opacity-60">({linkedPlayers.length})</span>
                            </div>
                            <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 flex flex-col gap-4 shadow-xl">
                                <div className="flex flex-wrap gap-2">
                                    {campaignCharacters.map(char => {
                                        const isLinked = linkedEntityIds.includes(char.id);
                                        return (
                                            <button
                                                key={char.id}
                                                onClick={() => isLinked ? removeEntityFromSession(session.id, char.id) : addEntityToSession(session.id, char.id)}
                                                className={`group relative w-14 h-14 rounded-2xl border-2 transition-all p-1 hover:scale-110 active:scale-90 ${
                                                    isLinked ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-slate-800 grayscale hover:grayscale-0'
                                                }`}
                                                title={char.name}
                                            >
                                                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900">
                                                    <ResolvedImage src={char.portraitUrl} alt={char.name} className="w-full h-full object-cover" />
                                                </div>
                                                {isLinked && (
                                                    <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-0.5 border-2 border-slate-950 shadow-lg">
                                                        <X size={10} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                    {campaignCharacters.length === 0 && (
                                        <div className="flex-1 py-4 text-center border border-dashed border-white/5 rounded-2xl">
                                            <p className="text-[10px] text-slate-600 italic">Aucun PJ lié à cette campagne.</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[9px] text-slate-600 italic mt-2">Cliquez pour ajouter/retirer un joueur de cette session.</p>
                            </div>
                        </div>

                        {/* NPCs & Monsters Management */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between text-gm-gold">
                                <div className="flex items-center gap-3">
                                    <Skull size={20} />
                                    <h3 className="text-sm font-bold uppercase tracking-[0.3em]">PNJ & Monstres</h3>
                                </div>
                                <span className="text-[10px] font-bold opacity-60">({linkedNpcs.length})</span>
                            </div>
                            <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 shadow-xl">
                                <SessionPrepEntityManager sessionId={session.id} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SessionFocusEditor;
