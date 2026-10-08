import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { BookText, Save, RefreshCcw, ChevronDown, ChevronUp, Star, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { Bouton } from '../../../components/socle';
import type { PlayerCharacter } from '../../../types/player.types';
import type { SessionFeedback } from '../../../types/session.types';

interface PlayerPrivateNotesProps {
    playerId: string;
    characterId: string;
}

const PlayerPrivateNotes: React.FC<PlayerPrivateNotesProps> = ({ playerId, characterId }) => {
    // Sélecteur ciblé pour éviter de re-render sur TOUT le store (clocks, voix, etc.)
    const character = useSessionOSStore(state => 
        state.players.find(p => p.id === playerId)?.characters.find(c => c.id === characterId)
    );
    if (!character) return null;
    return <NotesDuPersonnage key={JSON.stringify([playerId, characterId])} playerId={playerId} character={character} />;
};

type RetourDeSeance = Pick<SessionFeedback, 'funRating' | 'storyRating' | 'combatRating' | 'notes'> & {
    cle: string | null;
    isSubmitted: boolean;
};

function lireRetourDeSeance(cle: string | null): RetourDeSeance {
    const vide: RetourDeSeance = { cle, funRating: 5, storyRating: 5, combatRating: 5, notes: '', isSubmitted: false };
    if (!cle) return vide;
    const saved = localStorage.getItem(cle);
    if (!saved) return vide;
    try {
        const parsed: unknown = JSON.parse(saved);
        if (typeof parsed !== 'object' || parsed === null) return vide;
        const retour = parsed as Record<string, unknown>;
        const estNote = (valeur: unknown): valeur is number =>
            typeof valeur === 'number' && Number.isInteger(valeur) && valeur >= 1 && valeur <= 5;
        if (!estNote(retour.funRating) || !estNote(retour.storyRating) || !estNote(retour.combatRating) || typeof retour.notes !== 'string') return vide;
        return { cle, funRating: retour.funRating, storyRating: retour.storyRating, combatRating: retour.combatRating, notes: retour.notes, isSubmitted: true };
    } catch (e) {
        console.error('Failed to parse saved feedback', e);
        return vide;
    }
}

const NotesDuPersonnage: React.FC<{ playerId: string; character: PlayerCharacter }> = ({ playerId, character }) => {
    const characterId = character.id;
    const remoteUpdateCharacterNarrative = useSessionOSStore(state => state.remoteUpdateCharacterNarrative);
    const notesDuMagasin = character.playerNotes ?? '';
    const [notes, setNotes] = useState({ valeurDuMagasin: notesDuMagasin, texte: notesDuMagasin, reference: notesDuMagasin });
    // Un écho de notre sauvegarde ne doit pas effacer une saisie plus récente.
    if (notes.valeurDuMagasin !== notesDuMagasin) {
        setNotes({
            ...notes,
            valeurDuMagasin: notesDuMagasin,
            ...(notesDuMagasin === notes.reference ? {} : { texte: notesDuMagasin, reference: notesDuMagasin }),
        });
    }
    const localNotes = notes.texte;
    const [isSaving, setIsSaving] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState<'notes' | 'feedback'>('notes');

    const notesRef = useRef(notes);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const indicateurRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeSession = useSessionOSStore(state =>
        state.sessions.find(s => s.status === 'active' && s.campaignId === character?.campaignId)
    );

    const storageKey = activeSession && character 
        ? `feedback:${character.campaignId}:${activeSession.id}:${character.id}`
        : null;

    const [retour, setRetour] = useState(() => lireRetourDeSeance(storageKey));
    if (retour.cle !== storageKey) setRetour(lireRetourDeSeance(storageKey));
    const { funRating, storyRating, combatRating, notes: feedbackComments, isSubmitted } = retour;
    const setFunRating = (valeur: number) => setRetour(precedent => ({ ...precedent, funRating: valeur }));
    const setStoryRating = (valeur: number) => setRetour(precedent => ({ ...precedent, storyRating: valeur }));
    const setCombatRating = (valeur: number) => setRetour(precedent => ({ ...precedent, combatRating: valeur }));
    const setFeedbackComments = (valeur: string) => setRetour(precedent => ({ ...precedent, notes: valeur }));
    const setIsSubmitted = (valeur: boolean) => setRetour(precedent => ({ ...precedent, isSubmitted: valeur }));

    useLayoutEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    const saveNotes = useCallback(() => {
        const { texte, reference } = notesRef.current;
        if (texte === reference) return;
        // Poser la référence avant l'appel : le magasin peut répondre immédiatement.
        notesRef.current = { ...notesRef.current, reference: texte };
        setNotes(precedent => ({ ...precedent, reference: texte }));
        setIsSaving(true);
        if (indicateurRef.current !== null) clearTimeout(indicateurRef.current);
        indicateurRef.current = setTimeout(() => {
            indicateurRef.current = null;
            setIsSaving(false);
        }, 800);
        remoteUpdateCharacterNarrative(playerId, characterId, { playerNotes: texte });
    }, [playerId, characterId, remoteUpdateCharacterNarrative]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        notesRef.current = { ...notesRef.current, texte: val };
        setNotes(precedent => ({ ...precedent, texte: val }));

        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            saveNotes();
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
            if (timerRef.current !== null) clearTimeout(timerRef.current);
            if (indicateurRef.current !== null) clearTimeout(indicateurRef.current);
            const { texte, reference } = notesRef.current;
            if (texte !== reference) {
                notesRef.current = { ...notesRef.current, reference: texte };
                remoteUpdateCharacterNarrative(playerId, characterId, { playerNotes: texte });
            }
        };
    }, [playerId, characterId, remoteUpdateCharacterNarrative]);

    return (
        <div className="flex flex-col bg-app-bg/40 backdrop-blur-md border border-app-text/10 rounded-xl overflow-hidden transition-all duration-300 shadow-2xl">
            {/* Header */}
            <Bouton habillage="libre" cibleTactile
                className="flex flex-wrap gap-2 w-full items-center justify-between px-4 py-3 bg-app-text/5 cursor-pointer text-left hover:bg-app-text/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <span className="flex items-center gap-2 min-w-0">
                    <BookText className="w-5 h-5 text-etat-info" />
                    <span role="heading" aria-level={3} className="font-semibold text-app-text text-[16px]">Notes & Feedback</span>
                </span>
                
                <span className="flex items-center gap-2">
                    {activeTab === 'notes' && (
                        isSaving ? (
                            <span className="flex items-center gap-1.5 text-[14px] text-etat-info font-medium animate-pulse">
                                <RefreshCcw className="w-3 h-3 animate-spin" />
                                <span>SYNCHRO...</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-[14px] text-etat-succes/70 font-medium">
                                <Save className="w-3 h-3" />
                                <span>À JOUR</span>
                            </span>
                        )
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-app-muted" /> : <ChevronDown className="w-5 h-5 text-app-muted" />}
                </span>
            </Bouton>

            {/* Expanded View */}
            {isExpanded && (
                <>
                    {/* Tab Navigation */}
                    <div className="flex bg-app-bg/40 p-1 border-b border-app-text/5">
                        <Bouton habillage="libre" cibleTactile
                            onClick={() => setActiveTab('notes')}
                            aria-pressed={activeTab === 'notes'}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[14px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                activeTab === 'notes'
                                    ? 'bg-etat-info/30 text-etat-info border border-etat-info/20'
                                    : 'text-app-muted hover:text-app-text'
                            }`}
                        >
                            <BookText className="w-4 h-4" />
                            Notes Privées
                        </Bouton>
                        <Bouton habillage="libre" cibleTactile
                            onClick={() => setActiveTab('feedback')}
                            aria-pressed={activeTab === 'feedback'}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[14px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                activeTab === 'feedback'
                                    ? 'bg-etat-info/30 text-etat-info border border-etat-info/20 shadow-glow-indigo/5'
                                    : 'text-app-muted hover:text-app-text'
                            }`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            Feedback MJ
                        </Bouton>
                    </div>

                    {/* Content Pane */}
                    {activeTab === 'notes' ? (
                        <div className="p-4 flex flex-col gap-3 animate-in fade-in duration-300">
                            <textarea
                                value={localNotes}
                                onChange={handleChange}
                                placeholder="Notez ici vos théories, secrets et rappels personnels... Ces notes ne sont visibles que par vous (et sauvegardées chez le MJ)."
                                className="w-full min-h-48 h-[40dvh] bg-app-bg/50 border border-app-text/5 rounded-lg p-4 text-app-text placeholder:text-app-subtle focus:outline-none focus:border-etat-info/50 focus:ring-1 focus:ring-etat-info/20 transition-all resize-none text-[16px] leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                            />
                            <div className="flex justify-between items-center text-[14px] text-app-subtle italic">
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
                                    <p className="text-[16px] text-app-muted max-w-sm mb-8 leading-relaxed">
                                        Vos ressentis et remarques ont été partagés au Maître du Jeu de manière confidentielle.
                                    </p>
                                    
                                    {/* Summary of ratings submitted */}
                                    <div className="w-full bg-app-bg/40 border border-app-text/5 rounded-2xl p-6 mb-8 flex flex-col gap-3 max-w-md">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[14px] text-app-muted font-bold uppercase tracking-wider">Plaisir de jeu</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < funRating ? 'text-etat-alerte fill-etat-alerte' : 'text-app-subtle'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[14px] text-app-muted font-bold uppercase tracking-wider">Histoire</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < storyRating ? 'text-etat-alerte fill-etat-alerte' : 'text-app-subtle'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[14px] text-app-muted font-bold uppercase tracking-wider">Combat / Action</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < combatRating ? 'text-etat-alerte fill-etat-alerte' : 'text-app-subtle'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <Bouton habillage="libre" cibleTactile
                                        onClick={handleEditFeedback}
                                        className="px-6 py-2.5 bg-app-surface-2 hover:bg-app-surface-2 text-app-text border border-app-text/5 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Modifier mon feedback
                                    </Bouton>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-5 pr-1">
                                    <p className="text-app-muted text-[14px] leading-relaxed italic border-l-2 border-etat-info/50 pl-3 mb-2">
                                        Donnez votre feedback sur la session active. Ces informations sont confidentielles et transmises uniquement au MJ.
                                    </p>
                                    
                                    <div className="flex flex-col gap-4 bg-app-bg/30 border border-app-text/5 p-3 rounded-2xl">
                                        {/* Fun Rating */}
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-[14px] font-black text-app-text uppercase tracking-wider">Plaisir de jeu (Fun)</span>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setFunRating(i + 1)}
                                                        aria-label={`Plaisir de jeu : ${i + 1} sur 5`}
                                                        aria-pressed={funRating === i + 1}
                                                        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent hover:bg-app-text/10"
                                                    >
                                                        <Star className={`w-5 h-5 ${i < funRating ? 'text-etat-alerte fill-etat-alerte drop-shadow-glow' : 'text-app-subtle hover:text-etat-alerte/50'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Story Rating */}
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-[14px] font-black text-app-text uppercase tracking-wider">Histoire / Scénario</span>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setStoryRating(i + 1)}
                                                        aria-label={`Histoire : ${i + 1} sur 5`}
                                                        aria-pressed={storyRating === i + 1}
                                                        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent hover:bg-app-text/10"
                                                    >
                                                        <Star className={`w-5 h-5 ${i < storyRating ? 'text-etat-alerte fill-etat-alerte drop-shadow-glow' : 'text-app-subtle hover:text-etat-alerte/50'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Combat Rating */}
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-[14px] font-black text-app-text uppercase tracking-wider">Action / Combat</span>
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setCombatRating(i + 1)}
                                                        aria-label={`Combat / Action : ${i + 1} sur 5`}
                                                        aria-pressed={combatRating === i + 1}
                                                        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent hover:bg-app-text/10"
                                                    >
                                                        <Star className={`w-5 h-5 ${i < combatRating ? 'text-etat-alerte fill-etat-alerte drop-shadow-glow' : 'text-app-subtle hover:text-etat-alerte/50'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Written Comments */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-black text-app-muted uppercase tracking-widest pl-1">
                                            Remarques & Notes pour le MJ
                                        </label>
                                        <textarea
                                            value={feedbackComments}
                                            onChange={(e) => setFeedbackComments(e.target.value)}
                                            placeholder="Ce que vous avez aimé, vos théories, vos envies, ou ce qui pourrait être amélioré..."
                                            className="w-full h-36 bg-app-bg/50 border border-app-text/5 rounded-xl p-4 text-app-text placeholder:text-app-subtle focus:outline-none focus:border-etat-info/50 focus:ring-1 focus:ring-etat-info/20 transition-all resize-none text-[16px]"
                                        />
                                    </div>

                                    <Bouton habillage="libre" cibleTactile
                                        onClick={handleSubmitFeedback}
                                        disabled={!activeSession}
                                        className={`w-full py-3.5 rounded-xl font-black text-[14px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                                            activeSession
                                                ? 'bg-etat-info hover:bg-etat-info text-app-bg shadow-etat-info/20 active:scale-[0.98]'
                                                : 'bg-app-surface-2 text-app-muted cursor-not-allowed border border-app-text/5'
                                        }`}
                                    >
                                        <Send className="w-4 h-4" />
                                        {activeSession ? 'Transmettre au MJ' : 'Aucune session active'}
                                    </Bouton>
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
