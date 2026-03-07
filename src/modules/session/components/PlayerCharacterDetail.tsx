import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { ArrowLeft } from 'lucide-react';
import CharacterSheetEditor from './CharacterSheetEditor';

const PlayerCharacterDetail: React.FC = () => {
    const { players, selectedPlayerId, selectedCharacterId, setSelectedCharacter } = useSessionOSStore();

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    const character = selectedPlayer?.characters.find(c => c.id === selectedCharacterId);

    if (!character) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-950/20 text-slate-600 italic text-sm">
                Sélectionnez un personnage pour afficher sa fiche
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Top Navigation Bar */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm flex-shrink-0">
                <button
                    onClick={() => setSelectedCharacter(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-gm-gold hover:border-gm-gold/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    Retour
                </button>
                <div>
                    <h2 className="text-base font-black text-white">{character.name}</h2>
                    <p className="text-xs text-slate-500 italic">{character.classRace}</p>
                </div>
            </div>

            {/* Sheet Editor — key resets the local state when character changes */}
            <CharacterSheetEditor key={`${character.id}-${character.templateId}`} />
        </div>
    );
};

export default PlayerCharacterDetail;
