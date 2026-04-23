import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { ArrowLeft } from 'lucide-react';
import CharacterSheetEditor from './CharacterSheetEditor';

const PlayerCharacterDetail: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { players, selectedPlayerId, selectedCharacterId, setSelectedCharacter, updateCharacter } = useSessionOSStore();

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    const character = selectedPlayer?.characters.find(c => c.id === selectedCharacterId);

    if (!character || !selectedPlayerId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-app-bg/20 text-app-text/20 italic text-sm">
                {t('modules:session.characters.detail_hint')}
            </div>
        );
    }

    return (
        <div className="flex-1 h-full bg-app-bg/60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Top Navigation Bar */}
            <div className="flex items-center gap-6 px-12 py-8 border-b border-app-border/50 bg-app-surface/60 backdrop-blur-md flex-shrink-0">
                <button
                    onClick={() => setSelectedCharacter(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border text-app-text/40 hover:text-accent hover:border-accent/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    {t('modules:session.characters.back_to_list')}
                </button>
                <div className="flex-1 flex flex-col items-start gap-1">
                    <input 
                        type="text"
                        value={character.name}
                        onChange={(e) => updateCharacter(selectedPlayerId, character.id, { name: e.target.value })}
                        className="bg-transparent text-xl font-black text-app-text focus:outline-none focus:ring-1 focus:ring-accent/20 rounded px-1 -ml-1 w-full"
                        placeholder={t('modules:session.characters.name_placeholder')}
                    />
                    <input 
                        type="text"
                        value={character.classRace}
                        onChange={(e) => updateCharacter(selectedPlayerId, character.id, { classRace: e.target.value })}
                        className="bg-transparent text-xs text-app-text/40 italic focus:outline-none focus:ring-1 focus:ring-accent/20 rounded px-1 -ml-1 w-full"
                        placeholder={t('modules:session.characters.class_race_placeholder')}
                    />
                </div>
            </div>

            {/* Sheet Editor — key resets the local state when character changes */}
            <CharacterSheetEditor key={`${character.id}-${character.templateId}`} />
        </div>
    );
};

export default PlayerCharacterDetail;
