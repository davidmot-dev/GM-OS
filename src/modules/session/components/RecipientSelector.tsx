import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { User, X } from 'lucide-react';

interface RecipientSelectorProps {
    onSelect: (playerId: string, characterId: string) => void;
    onCancel: () => void;
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({ onSelect, onCancel }) => {
    const { players, activeCampaignId } = useSessionOSStore();
    
    // Get all characters tied to the active campaign
    const activePCsForCampaign = players.flatMap(p => 
        (p.characters || [])
            .filter(c => c.campaignId === activeCampaignId)
            .map(c => ({ playerId: p.id, character: c }))
    );

    if (activePCsForCampaign.length === 0) {
        return (
            <div className="p-4 bg-app-surface border border-app-border rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-64 z-50">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">Donner à...</span>
                    <button onClick={onCancel} className="text-app-text/20 hover:text-red-400 transition-colors"><X size={14} /></button>
                </div>
                <p className="text-xs text-app-text/40 italic">Aucun personnage dans la campagne active.</p>
            </div>
        );
    }

    return (
        <div className="p-2 bg-app-surface border border-app-border/60 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 min-w-[220px] z-50 backdrop-blur-xl">
            <div className="flex justify-between items-center px-3 py-1.5 border-b border-app-border/40 mb-1">
                <span className="text-ui-10 font-black uppercase tracking-widest text-accent">Sélecteur de PJ</span>
                <button onClick={onCancel} className="text-app-text/40 hover:text-red-400 transition-colors"><X size={14} /></button>
            </div>
            
            <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar p-1">
                {activePCsForCampaign.map(({ playerId, character }) => (
                    <button
                        key={character.id}
                        onClick={() => onSelect(playerId, character.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/10 rounded-lg transition-all group text-left border border-transparent hover:border-accent/20 active:scale-95"
                    >
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-app-border/40 bg-app-bg group-hover:border-accent/40 shadow-inner group-hover:shadow-glow-accent/5 transition-all">
                            {character.portraitUrl ? (
                                <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-app-text/20">
                                    <User size={16} />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-app-text group-hover:text-accent transition-colors truncate">{character.name}</span>
                            <span className="text-ui-9 text-app-text/40 font-bold uppercase tracking-tighter truncate opacity-80">{character.classRace}</span>
                        </div>
                    </button>
                ))}
            </div>
            
            <div className="px-3 py-2 mt-1 border-t border-app-border/30">
                <button 
                    onClick={onCancel}
                    className="w-full text-center text-ui-9 font-black uppercase tracking-widest text-app-text/40 hover:text-app-text transition-colors"
                >
                    Annuler
                </button>
            </div>
        </div>
    );
};
