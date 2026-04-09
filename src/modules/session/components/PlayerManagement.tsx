import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import PlayerRoster from './PlayerRoster';
import CharacterGrid from './CharacterGrid';
import PlayerCharacterDetail from './PlayerCharacterDetail';

const PlayerManagement: React.FC = () => {
    const { selectedCharacterId, setCurrentView } = useSessionOSStore();

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            {selectedCharacterId ? (
                <PlayerCharacterDetail />
            ) : (
                <>
                    {/* Header for Fullscreen Mode */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-app-border bg-app-bg/40 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setCurrentView('cockpit')}
                                className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border text-app-text/60 hover:text-accent hover:border-accent/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                            >
                                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                                Retour au Cockpit
                            </button>
                            <div className="h-8 w-px bg-app-border hidden md:block"></div>
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-accent" />
                                <h2 className="text-xl font-black text-app-text uppercase tracking-tight">Roster des Joueurs</h2>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex overflow-hidden">
                        <PlayerRoster />
                        <CharacterGrid ignoreCampaignFilter={true} />
                    </div>
                </>
            )}
        </div>
    );
};

export default PlayerManagement;
