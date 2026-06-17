import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookText, Save, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';
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
    
    const lastSyncRef = useRef(character?.playerNotes || '');
    const notesRef = useRef(localNotes);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Mettre à jour la ref à chaque changement de localNotes sans déclencher d'effet
    useEffect(() => {
        notesRef.current = localNotes;
    }, [localNotes]);

    // Sync local state with store ONLY if store changes from outside (e.g. sync from MJ)
    useEffect(() => {
        if (character?.playerNotes !== undefined && character.playerNotes !== lastSyncRef.current) {
            // Uniquement si on n'est pas déjà en train de taper ou que la valeur diffère substantiellement
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

    // Cleanup timer on unmount and final save
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            // Sauvegarde finale au démontage si nécessaire
            if (notesRef.current !== lastSyncRef.current) {
                remoteUpdateCharacterNarrative(playerId, characterId, { playerNotes: notesRef.current });
            }
        };
    }, [playerId, characterId, remoteUpdateCharacterNarrative]); // localNotes retiré des dépendances !

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
                    <h3 className="font-semibold text-slate-100 uppercase tracking-wider text-sm">Notes Privées</h3>
                </div>
                
                <div className="flex items-center gap-4">
                    {isSaving ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-medium animate-pulse">
                            <RefreshCcw className="w-3 h-3 animate-spin" />
                            <span>SYNCHRO...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 font-medium">
                            <Save className="w-3 h-3" />
                            <span>À JOUR</span>
                        </div>
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
            </div>

            {/* Content Area */}
            {isExpanded && (
                <div className="p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea
                        value={localNotes}
                        onChange={handleChange}
                        placeholder="Notez ici vos théories, secrets et rappels personnels... Ces notes ne sont visibles que par vous (et sauvegardées chez le MJ)."
                        className="w-full h-[640px] bg-slate-950/50 border border-white/5 rounded-lg p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                    />
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 italic">
                        <span>Sauvegarde automatique activée</span>
                        <span>{localNotes.length} caractères</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerPrivateNotes;
