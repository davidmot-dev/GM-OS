import React from 'react';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
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
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setCurrentView('cockpit')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-gm-gold hover:border-gm-gold/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                            >
                                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                                Retour au Cockpit
                            </button>
                            <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-gm-gold" />
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Roster des Joueurs</h2>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex overflow-hidden">
                        <PlayerRoster />
                        <CharacterGrid />
                    </div>
                </>
            )}
        </div>
    );
};

export default PlayerManagement;
