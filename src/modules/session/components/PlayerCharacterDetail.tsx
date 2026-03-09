import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { ArrowLeft } from 'lucide-react';
import CharacterSheetEditor from './CharacterSheetEditor';

const PlayerCharacterDetail: React.FC = () => {
    const { players, selectedPlayerId, selectedCharacterId, setSelectedCharacter, updateCharacter } = useSessionOSStore();

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    const character = selectedPlayer?.characters.find(c => c.id === selectedCharacterId);

    if (!character || !selectedPlayerId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-950/20 text-slate-600 italic text-sm">
                Sélectionnez un personnage pour afficher sa fiche
            </div>
        );
    }

    return (
        <div className="flex-1 h-full bg-slate-950/60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Top Navigation Bar */}
            <div className="flex items-center gap-6 px-12 py-8 border-b border-slate-800/50 bg-slate-900/60 backdrop-blur-md flex-shrink-0">
                <button
                    onClick={() => setSelectedCharacter(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-gm-gold hover:border-gm-gold/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    Retour
                </button>
                <div className="flex-1 flex flex-col items-start gap-1">
                    <input 
                        type="text"
                        value={character.name}
                        onChange={(e) => updateCharacter(selectedPlayerId, character.id, { name: e.target.value })}
                        className="bg-transparent text-xl font-black text-white focus:outline-none focus:ring-1 focus:ring-gm-gold/20 rounded px-1 -ml-1 w-full"
                        placeholder="Nom du personnage"
                    />
                    <input 
                        type="text"
                        value={character.classRace}
                        onChange={(e) => updateCharacter(selectedPlayerId, character.id, { classRace: e.target.value })}
                        className="bg-transparent text-xs text-slate-500 italic focus:outline-none focus:ring-1 focus:ring-gm-gold/20 rounded px-1 -ml-1 w-full"
                        placeholder="Classe / Race"
                    />
                </div>
            </div>

            {/* Sheet Editor — key resets the local state when character changes */}
            <CharacterSheetEditor key={`${character.id}-${character.templateId}`} />
        </div>
    );
};

export default PlayerCharacterDetail;
