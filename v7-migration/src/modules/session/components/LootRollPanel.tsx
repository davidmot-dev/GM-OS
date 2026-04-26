import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { Dice6, Gift, ChevronRight } from 'lucide-react';

interface LootRollPanelProps {
    playerId: string;
    characterId: string;
    onClose?: () => void;
}

export const LootRollPanel: React.FC<LootRollPanelProps> = ({ playerId, characterId, onClose }) => {
    const { t } = useTranslation(['modules']);
    const { getActiveDriver, generateLoot, players } = useSessionOSStore();
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [rollCount, setRollCount] = useState<number>(1);

    const driver = getActiveDriver();
    const character = players.find(p => p.id === playerId)?.characters.find(c => c.id === characterId);

    if (!driver || !driver.lootTables || driver.lootTables.length === 0) {
        return (
            <div className="p-6 text-center text-slate-400">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{t('modules:loot.roll_panel.no_tables')}</p>
            </div>
        );
    }

    const handleRoll = () => {
        if (!selectedTableId) return;
        setIsRolling(true);
        
        // Simuler le délai de lancer
        setTimeout(() => {
            const count = Math.max(1, Math.min(10, rollCount)); // Limite à 10 pour éviter le spam
            for (let i = 0; i < count; i++) {
                generateLoot(playerId, characterId, selectedTableId);
            }
            setIsRolling(false);
            if (onClose) onClose();
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-white">{t('modules:loot.roll_panel.title')}</h3>
                </div>
                {character && (
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {t('modules:loot.roll_panel.target', { name: character.name })}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-xs text-slate-400 px-1 mb-2">{t('modules:loot.roll_panel.select_table')}</p>
                {driver.lootTables.map((table) => (
                    <button
                        key={table.id}
                        onClick={() => setSelectedTableId(table.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
                            selectedTableId === table.id
                                ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className={`font-semibold ${selectedTableId === table.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                                    {table.name}
                                </h4>
                                {table.description && (
                                    <p className="text-xs text-slate-400 line-clamp-1">{table.description}</p>
                                )}
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${selectedTableId === table.id ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
                        </div>
                    </button>
                ))}
            </div>

            {/* Selection Info & Roll Count */}
            <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('modules:loot.roll_panel.roll_count')}</span>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={rollCount}
                        onChange={(e) => setRollCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                        className="w-12 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-center text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10">
                <button
                    onClick={handleRoll}
                    disabled={!selectedTableId || isRolling}
                    className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
                        !selectedTableId || isRolling
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-900/20 active:scale-95'
                    }`}
                >
                    {isRolling ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Dice6 className="w-5 h-5" />
                    )}
                    {isRolling ? t('modules:loot.roll_panel.status_rolling') : t('modules:loot.roll_panel.action_roll')}
                </button>
            </div>
        </div>
    );
};
