import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionOSStore } from '../useSessionOSStore';
import { History, ArrowRight } from 'lucide-react';
import { CharacterPortrait } from './LootPoolViewer';
import { estDeLaCampagne } from '../store/lootSlice';
import { libelleDeRarete, rangDepuisLeSommet } from '../logic/vocabulaireDuButin';

/**
 * La couleur d'un badge suit la **place** du palier dans l'échelle du jeu, pas
 * son nom : le plus rare en ambre, celui d'en dessous en violet, le troisième en
 * bleu, le reste en neutre. L'échelle par défaut retrouve exactement les
 * couleurs d'avant — mais un jeu qui nomme ses paliers autrement les obtient
 * aussi, ce qu'un `rarity === 'legendary'` écrit en dur ne permettait pas.
 */
const COULEURS_PAR_RANG = [
    'bg-gm-gold/20 text-gm-gold border border-gm-gold/30',
    'bg-gm-violet/20 text-gm-violet border border-gm-violet/30',
    'bg-gm-cyan/20 text-gm-cyan border border-gm-cyan/30',
];
const COULEUR_NEUTRE = 'bg-app-text/5 text-app-text/40 border border-app-text/10';

const LootHistoryViewer: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { lootHistory, clearLootHistory, activeCampaignId, getActiveDriver } = useSessionOSStore();
    const driver = getActiveDriver();

    // L'historique se lit campagne par campagne, comme le pool qui l'alimente.
    const dons = React.useMemo(
        () => lootHistory.filter(e => estDeLaCampagne(e.campaignId, activeCampaignId)),
        [lootHistory, activeCampaignId],
    );

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t('modules:loot.history.time.just_now');
        if (mins < 60) return t('modules:loot.history.time.mins_ago', { count: mins });
        const hours = Math.floor(mins / 60);
        if (hours < 24) return t('modules:loot.history.time.hours_ago', { count: hours });
        return new Date(ts).toLocaleDateString();
    };

    if (dons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-app-text/40 border-2 border-dashed border-app-text/5 rounded-xl bg-app-text/2">
                <History size={48} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">{t('modules:loot.history.empty')}</p>
                <p className="text-ui-10 uppercase tracking-widest mt-1">{t('modules:loot.history.empty_hint')}</p>
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
                    className="text-ui-10 font-bold uppercase tracking-widest text-etat-danger/60 hover:text-etat-danger transition-colors"
                >
                    {t('modules:loot.history.clear_all')}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {dons.map((entry) => (
                        <motion.div
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-app-bg/20 border border-app-text/5 rounded-lg p-3 hover:bg-app-text/5 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                {/* Item Info */}
                                <div className="flex-1 flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-app-text truncate">
                                            {entry.itemName} {entry.quantity > 1 ? `(x${entry.quantity})` : ''}
                                        </span>
                                        <span className={`text-ui-8 font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                            COULEURS_PAR_RANG[rangDepuisLeSommet(driver, entry.rarity)] ?? COULEUR_NEUTRE
                                        }`}>
                                            {libelleDeRarete(driver, entry.rarity)}
                                        </span>
                                    </div>
                                    <span className="text-ui-10 text-app-text/30">
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
                                        <span className="text-ui-10 font-bold text-accent/80 whitespace-nowrap">
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
