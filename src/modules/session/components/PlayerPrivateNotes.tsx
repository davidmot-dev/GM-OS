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
        <div className="flex flex-col bg-app-bg/40 backdrop-blur-md border border-app-text/10 rounded-xl overflow-hidden transition-all duration-300 shadow-2xl">
            {/* Header */}
            <div 
                className="flex items-center justify-between px-4 py-3 bg-app-text/5 cursor-pointer hover:bg-app-text/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <BookText className="w-5 h-5 text-etat-info" />
                    <h3 className="font-semibold text-app-text uppercase tracking-wider text-sm">Notes & Feedback</h3>
                </div>
                
                <div className="flex items-center gap-4">
                    {activeTab === 'notes' && (
                        isSaving ? (
                            <div className="flex items-center gap-1.5 text-ui-10 text-etat-info font-medium animate-pulse">
                                <RefreshCcw className="w-3 h-3 animate-spin" />
                                <span>SYNCHRO...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-ui-10 text-etat-succes/70 font-medium">
                                <Save className="w-3 h-3" />
                                <span>À JOUR</span>
                            </div>
                        )
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-app-muted" /> : <ChevronDown className="w-5 h-5 text-app-muted" />}
                </div>
            </div>

            {/* Expanded View */}
            {isExpanded && (
                <>
                    {/* Tab Navigation */}
                    <div className="flex bg-app-bg/40 p-1 border-b border-app-text/5">
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                activeTab === 'notes'
                                    ? 'bg-etat-info/30 text-etat-info border border-etat-info/20'
                                    : 'text-app-muted hover:text-app-text'
                            }`}
                        >
                            <BookText className="w-4 h-4" />
                            Notes Privées
                        </button>
                        <button
                            onClick={() => setActiveTab('feedback')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                activeTab === 'feedback'
                                    ? 'bg-etat-info/30 text-etat-info border border-etat-info/20 shadow-glow-indigo/5'
                                    : 'text-app-muted hover:text-app-text'
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
                                className="w-full h-[600px] bg-app-bg/50 border border-app-text/5 rounded-lg p-4 text-app-text placeholder:text-app-subtle focus:outline-none focus:border-etat-info/50 focus:ring-1 focus:ring-etat-info/20 transition-all resize-none text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                            />
                            <div className="flex justify-between items-center text-ui-10 text-app-subtle italic">
                                <span>Sauvegarde automatique activée</span>
                                <span>{localNotes.length} caractères</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 flex flex-col gap-4 animate-in fade-in duration-300">
                            {isSubmitted ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in-95 duration-300">
                                    <div className="w-16 h-16 rounded-full bg-etat-succes/10 border border-etat-succes/30 flex items-center justify-center text-etat-succes mb-6 shadow-glow-emerald/10">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-black text-app-text uppercase tracking-wider mb-2">Feedback Transmis !</h4>
                                    <p className="text-sm text-app-muted max-w-sm mb-8 leading-relaxed">
                                        Vos ressentis et remarques ont été partagés au Maître du Jeu de manière confidentielle.
                                    </p>
                                    
                                    {/* Summary of ratings submitted */}
                                    <div className="w-full bg-app-bg/40 border border-app-text/5 rounded-2xl p-6 mb-8 flex flex-col gap-3 max-w-md">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-app-muted font-bold uppercase tracking-wider">Plaisir de jeu</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < funRating ? 'text-etat-alerte fill-etat-alerte' : 'text-app-subtle'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-app-muted font-bold uppercase tracking-wider">Histoire</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < storyRating ? 'text-etat-alerte fill-etat-alerte' : 'text-app-subtle'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-app-muted font-bold uppercase tracking-wider">Combat / Action</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < combatRating ? 'text-etat-alerte fill-etat-alerte' : 'text-app-subtle'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleEditFeedback}
                                        className="px-6 py-2.5 bg-app-surface-2 hover:bg-app-surface-2 text-app-text border border-app-text/5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Modifier mon feedback
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-5 max-h-[640px] overflow-y-auto pr-1">
                                    <p className="text-app-muted text-xs leading-relaxed italic border-l-2 border-etat-info/50 pl-3 mb-2">
                                        Donnez votre feedback sur la session active. Ces informations sont confidentielles et transmises uniquement au MJ.
                                    </p>
                                    
                                    <div className="flex flex-col gap-4 bg-app-bg/30 border border-app-text/5 p-5 rounded-2xl">
                                        {/* Fun Rating */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-app-text uppercase tracking-wider">Plaisir de jeu (Fun)</span>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setFunRating(i + 1)}
                                                        className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                                    >
                                                        <Star className={`w-5 h-5 ${i < funRating ? 'text-etat-alerte fill-etat-alerte drop-shadow-glow' : 'text-app-subtle hover:text-etat-alerte/50'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Story Rating */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-app-text uppercase tracking-wider">Histoire / Scénario</span>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setStoryRating(i + 1)}
                                                        className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                                    >
                                                        <Star className={`w-5 h-5 ${i < storyRating ? 'text-etat-alerte fill-etat-alerte drop-shadow-glow' : 'text-app-subtle hover:text-etat-alerte/50'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Combat Rating */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-app-text uppercase tracking-wider">Action / Combat</span>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setCombatRating(i + 1)}
                                                        className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
                                                    >
                                                        <Star className={`w-5 h-5 ${i < combatRating ? 'text-etat-alerte fill-etat-alerte drop-shadow-glow' : 'text-app-subtle hover:text-etat-alerte/50'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Written Comments */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-ui-10 font-black text-app-muted uppercase tracking-widest pl-1">
                                            Remarques & Notes pour le MJ
                                        </label>
                                        <textarea
                                            value={feedbackComments}
                                            onChange={(e) => setFeedbackComments(e.target.value)}
                                            placeholder="Ce que vous avez aimé, vos théories, vos envies, ou ce qui pourrait être amélioré..."
                                            className="w-full h-36 bg-app-bg/50 border border-app-text/5 rounded-xl p-4 text-app-text placeholder:text-app-subtle focus:outline-none focus:border-etat-info/50 focus:ring-1 focus:ring-etat-info/20 transition-all resize-none text-sm"
                                        />
                                    </div>

                                    <button
                                        onClick={handleSubmitFeedback}
                                        disabled={!activeSession}
                                        className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                                            activeSession
                                                ? 'bg-etat-info hover:bg-etat-info text-app-bg shadow-etat-info/20 active:scale-[0.98]'
                                                : 'bg-app-surface-2 text-app-muted cursor-not-allowed border border-app-text/5'
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
