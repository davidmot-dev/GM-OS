import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookText, Save, RefreshCcw, ChevronDown, ChevronUp, Star, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';

interface PlayerPrivateNotesProps {
    playerId: string;
    characterId: string;
}

const PlayerPrivateNotes: React.FC<PlayerPrivateNotesProps> = ({ playerId, characterId }) => {
    // Sélecteur ciblé pour éviter de re-render sur TOUT le store (clocks, voix, etc.)
    const character = useSessionOSStore(state => 
        state.players.find(p => p.id === playerId)?.characters.find(c => c.id === characterId)
    );
    const remoteUpdateCharacterNarrative = useSessionOSStore(state => state.remoteUpdateCharacterNarrative);
    
    const [localNotes, setLocalNotes] = useState(character?.playerNotes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'notes' | 'feedback'>('notes');

    // Feedback State
    const [funRating, setFunRating] = useState(5);
    const [storyRating, setStoryRating] = useState(5);
    const [combatRating, setCombatRating] = useState(5);
    const [feedbackComments, setFeedbackComments] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const lastSyncRef = useRef(character?.playerNotes || '');
    const notesRef = useRef(localNotes);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeSession = useSessionOSStore(state =>
        state.sessions.find(s => s.status === 'active' && s.campaignId === character?.campaignId)
    );

    const storageKey = activeSession && character 
        ? `feedback:${character.campaignId}:${activeSession.id}:${character.id}`
        : null;

    // Load saved feedback status
    useEffect(() => {
        if (!storageKey) return;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setFunRating(parsed.funRating);
                setStoryRating(parsed.storyRating);
                setCombatRating(parsed.combatRating);
                setFeedbackComments(parsed.notes);
                setIsSubmitted(true);
            } catch (e) {
                console.error('Failed to parse saved feedback', e);
            }
        } else {
            setFunRating(5);
            setStoryRating(5);
            setCombatRating(5);
            setFeedbackComments('');
            setIsSubmitted(false);
        }
    }, [storageKey]);

    // Mettre à jour la ref à chaque changement de localNotes sans déclencher d'effet
    useEffect(() => {
        notesRef.current = localNotes;
    }, [localNotes]);

    // Sync local state with store ONLY if store changes from outside (e.g. sync from MJ)
    useEffect(() => {
        if (character?.playerNotes !== undefined && character.playerNotes !== lastSyncRef.current) {
            if (character.playerNotes !== notesRef.current) {
                setLocalNotes(character.playerNotes);
                lastSyncRef.current = character.playerNotes;
            }
        }
    }, [character?.playerNotes]);

    const saveNotes = useCallback((content: string) => {
        if (content === lastSyncRef.current) return;
        
        setIsSaving(true);
        remoteUpdateCharacterNarrative(playerId, characterId, { playerNotes: content });
        lastSyncRef.current = content;
        
        setTimeout(() => setIsSaving(false), 800);
    }, [playerId, characterId, remoteUpdateCharacterNarrative]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setLocalNotes(val);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            saveNotes(val);
        }, 1500);
    };

    const handleSubmitFeedback = () => {
        if (!activeSession || !character || !storageKey) return;
        
        const feedback = {
            characterId: character.id,
            characterName: character.name,
            funRating,
            storyRating,
            combatRating,
            notes: feedbackComments,
            timestamp: Date.now()
        };

        localStorage.setItem(storageKey, JSON.stringify(feedback));
        setIsSubmitted(true);

        const remoteSubmitSessionFeedback = useSessionOSStore.getState().remoteSubmitSessionFeedback;
        remoteSubmitSessionFeedback(activeSession.id, feedback);
    };

    const handleEditFeedback = () => {
        setIsSubmitted(false);
    };

    // Cleanup timer on unmount and final save
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (notesRef.current !== lastSyncRef.current) {
                remoteUpdateCharacterNarrative(playerId, characterId, { playerNotes: notesRef.current });
            }
        };
    }, [playerId, characterId, remoteUpdateCharacterNarrative]);

    if (!character) return null;

    return (
        <div className="flex flex-col bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden transition-all duration-300 shadow-2xl">
            {/* Header */}
            <div 
                className="flex items-center justify-between px-4 py-3 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <BookText className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-slate-100 uppercase tracking-wider text-sm">Notes & Feedback</h3>
                </div>
                
                <div className="flex items-center gap-4">
                    {activeTab === 'notes' && (
                        isSaving ? (
                            <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-medium animate-pulse">
                                <RefreshCcw className="w-3 h-3 animate-spin" />
                                <span>SYNCHRO...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 font-medium">
                                <Save className="w-3 h-3" />
                                <span>À JOUR</span>
                            </div>
                        )
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
            </div>

            {/* Expanded View */}
            {isExpanded && (
                <>
                    {/* Tab Navigation */}
                    <div className="flex bg-slate-950/40 p-1 border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                activeTab === 'notes'
                                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/20'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <BookText className="w-4 h-4" />
                            Notes Privées
                        </button>
                        <button
                            onClick={() => setActiveTab('feedback')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                activeTab === 'feedback'
                                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 shadow-glow-indigo/5'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Feedback MJ
                        </button>
                    </div>

                    {/* Content Pane */}
                    {activeTab === 'notes' ? (
                        <div className="p-4 flex flex-col gap-3 animate-in fade-in duration-300">
                            <textarea
                                value={localNotes}
                                onChange={handleChange}
                                placeholder="Notez ici vos théories, secrets et rappels personnels... Ces notes ne sont visibles que par vous (et sauvegardées chez le MJ)."
                                className="w-full h-[600px] bg-slate-950/50 border border-white/5 rounded-lg p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                            />
                            <div className="flex justify-between items-center text-[10px] text-slate-500 italic">
                                <span>Sauvegarde automatique activée</span>
                                <span>{localNotes.length} caractères</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-300">
                            {isSubmitted ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in-95 duration-300">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-glow-emerald/10">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-black text-slate-100 uppercase tracking-wider mb-2">Feedback Transmis !</h4>
                                    <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
                                        Vos ressentis et remarques ont été partagés au Maître du Jeu de manière confidentielle.
                                    </p>
                                    
                                    {/* Summary of ratings submitted */}
                                    <div className="w-full bg-slate-950/40 border border-white/5 rounded-2xl p-6 mb-8 flex flex-col gap-3 max-w-md">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Plaisir de jeu</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < funRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Histoire</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < storyRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Combat / Action</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < combatRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleEditFeedback}
                                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Modifier mon feedback
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-5 max-h-[640px] overflow-y-auto pr-1">
                                    <p className="text-slate-400 text-xs leading-relaxed italic border-l-2 border-indigo-500/50 pl-3 mb-2">
                                        Donnez votre feedback sur la session active. Ces informations sont confidentielles et transmises uniquement au MJ.
                                    </p>
                                    
                                    <div className="flex flex-col gap-4 bg-slate-950/30 border border-white/5 p-5 rounded-2xl">
                                        {/* Fun Rating */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Plaisir de jeu (Fun)</span>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setFunRating(i + 1)}
                                                        className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                                    >
                                                        <Star className={`w-5 h-5 ${i < funRating ? 'text-amber-400 fill-amber-400 drop-shadow-glow' : 'text-slate-600 hover:text-amber-400/50'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Story Rating */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Histoire / Scénario</span>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setStoryRating(i + 1)}
                                                        className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                                    >
                                                        <Star className={`w-5 h-5 ${i < storyRating ? 'text-amber-400 fill-amber-400 drop-shadow-glow' : 'text-slate-600 hover:text-amber-400/50'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Combat Rating */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Action / Combat</span>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setCombatRating(i + 1)}
                                                        className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                                    >
                                                        <Star className={`w-5 h-5 ${i < combatRating ? 'text-amber-400 fill-amber-400 drop-shadow-glow' : 'text-slate-600 hover:text-amber-400/50'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Written Comments */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                            Remarques & Notes pour le MJ
                                        </label>
                                        <textarea
                                            value={feedbackComments}
                                            onChange={(e) => setFeedbackComments(e.target.value)}
                                            placeholder="Ce que vous avez aimé, vos théories, vos envies, ou ce qui pourrait être amélioré..."
                                            className="w-full h-36 bg-slate-950/50 border border-white/5 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none text-sm"
                                        />
                                    </div>

                                    <button
                                        onClick={handleSubmitFeedback}
                                        disabled={!activeSession}
                                        className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                                            activeSession
                                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-[0.98]'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                                        }`}
                                    >
                                        <Send className="w-4 h-4" />
                                        {activeSession ? 'Transmettre au MJ' : 'Aucune session active'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PlayerPrivateNotes;
