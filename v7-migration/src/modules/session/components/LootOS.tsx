import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import LootGeneratorPanel from './LootGeneratorPanel';
import LootPoolViewer from './LootPoolViewer';
import LootHistoryViewer from './LootHistoryViewer';
import { Sparkles, Package, Coins, History } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { motion } from 'framer-motion';

const LootOS: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { lootPool } = useSessionOSStore();
    const [activeTab, setActiveTab] = useState<'generate' | 'pool' | 'history'>('generate');

    const totalValue = lootPool.reduce((acc, it) => acc + (Number(it.value) || 0) * (it.quantity || 1), 0);
    const magicItemsCount = lootPool.filter(it => it.rarity && !['common', 'currency'].includes(it.rarity)).length;

    const gmQuotes = t('modules:loot.gm_tips.quotes', { returnObjects: true }) as string[];
    
    const dailyQuote = useMemo(() => {
        if (!Array.isArray(gmQuotes) || gmQuotes.length === 0) return '';
        const quoteIndex = Math.floor((Date.now() / 3600000) % gmQuotes.length);
        return gmQuotes[quoteIndex];
    }, [gmQuotes]);

    return (
        <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl">
            {/* Sub-header Tabs */}
            <div className="flex border-b border-white/5 bg-black/20">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === 'generate' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-app-text/40 hover:text-app-text/60 hover:bg-white/2'
                    }`}
                >
                    <Sparkles size={14} />
                    {t('modules:loot.tabs.generate')}
                </button>
                <button
                    onClick={() => setActiveTab('pool')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === 'pool' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-app-text/40 hover:text-app-text/60 hover:bg-white/2'
                    }`}
                >
                    <Package size={14} />
                    {t('modules:loot.tabs.pool')}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === 'history' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-app-text/40 hover:text-app-text/60 hover:bg-white/2'
                    }`}
                >
                    <History size={14} />
                    {t('modules:loot.tabs.history')}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {activeTab === 'generate' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <LootGeneratorPanel />
                        </motion.div>
                    )}
                    
                    {activeTab === 'pool' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <LootPoolViewer />
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <LootHistoryViewer />
                        </motion.div>
                    )}
                </div>

                {/* Side Stats / Quick Info */}
                <div className="w-64 border-l border-white/5 bg-black/10 p-5 hidden lg:flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text/30">{t('modules:loot.stats.title')}</span>
                        <div className="glass-bento p-3 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-app-text/60 font-medium">{t('modules:loot.stats.total_value')}</span>
                                <div className="flex items-center gap-1 text-gm-gold">
                                    <span className="text-xs font-bold">{totalValue.toLocaleString()}</span>
                                    <Coins size={12} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-app-text/40">{t('modules:loot.stats.magic_items')}</span>
                                <span className="text-violet-400 font-bold">{magicItemsCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text/30">{t('modules:loot.gm_tips.title')}</span>
                        <p className="text-[11px] text-app-text/50 leading-relaxed italic">
                            "{dailyQuote}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LootOS;
