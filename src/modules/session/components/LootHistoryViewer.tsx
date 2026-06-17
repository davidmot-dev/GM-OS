import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionOSStore } from '../useSessionOSStore';
import { History, ArrowRight } from 'lucide-react';
import { CharacterPortrait } from './LootPoolViewer';

const LootHistoryViewer: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { lootHistory, clearLootHistory } = useSessionOSStore();

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t('modules:loot.history.time.just_now');
        if (mins < 60) return t('modules:loot.history.time.mins_ago', { count: mins });
        const hours = Math.floor(mins / 60);
        if (hours < 24) return t('modules:loot.history.time.hours_ago', { count: hours });
        return new Date(ts).toLocaleDateString();
    };

    if (lootHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-app-text/40 border-2 border-dashed border-white/5 rounded-xl bg-white/2">
                <History size={48} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">{t('modules:loot.history.empty')}</p>
                <p className="text-[10px] uppercase tracking-widest mt-1">{t('modules:loot.history.empty_hint')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <History size={20} className="text-accent" />
                    <h3 className="text-sm font-bold uppercase tracking-tighter">{t('modules:loot.history.title')}</h3>
                </div>
                <button 
                    onClick={() => clearLootHistory()}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
                >
                    {t('modules:loot.history.clear_all')}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {lootHistory.map((entry) => (
                        <motion.div
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-black/20 border border-white/5 rounded-lg p-3 hover:bg-white/5 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                {/* Item Info */}
                                <div className="flex-1 flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-app-text truncate">
                                            {entry.itemName} {entry.quantity > 1 ? `(x${entry.quantity})` : ''}
                                        </span>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                            entry.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            entry.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                            entry.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                            'bg-white/5 text-app-text/40 border border-white/10'
                                        }`}>
                                            {t(`modules:loot.rarities.${entry.rarity || 'common'}`)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-app-text/30">
                                        {formatTime(entry.timestamp)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <ArrowRight size={12} className="text-app-text/20" />
                                    
                                    {/* Recipient */}
                                    <div className="flex items-center gap-2 bg-accent/5 px-2 py-1 rounded-md border border-accent/10">
                                        <CharacterPortrait 
                                            character={{ portraitUrl: entry.recipientPortrait || '', name: entry.recipientName }} 
                                            size={20} 
                                        />
                                        <span className="text-[10px] font-bold text-accent/80 whitespace-nowrap">
                                            {entry.recipientName}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LootHistoryViewer;
