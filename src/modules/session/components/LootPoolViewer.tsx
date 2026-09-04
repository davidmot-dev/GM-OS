import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionOSStore } from '../useSessionOSStore';
import { Package, User, Trash2, Gift } from 'lucide-react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { estDeLaCampagne } from '../store/lootSlice';
import { libelleDeRarete } from '../logic/vocabulaireDuButin';
/**
 * Petit composant pour gérer la résolution de l'URL du portrait (Media-OS)
 */
export const CharacterPortrait: React.FC<{ character?: { portraitUrl: string; name?: string }; size?: number }> = ({ character, size = 16 }) => {
    const resolvedUrl = useMediaUrl(character?.portraitUrl);
    
    return (
        <div 
            className="rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner"
            style={{ width: size, height: size }}
        >
            {resolvedUrl ? (
                <img src={resolvedUrl} alt="" className="w-full h-full object-cover" />
            ) : (
                <User size={size * 0.6} className="text-accent" />
            )}
        </div>
    );
};

const LootPoolViewer: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { 
        lootPool, 
        players, 
        removeFromPool, 
        assignLootToCharacter, 
        clearLootPool,
        activeCampaignId,
        campaigns,
        sessions,
        getActiveDriver
    } = useSessionOSStore();

    const driver = getActiveDriver();

    /*
      **Le butin de la campagne ouverte, et d'elle seule.**

      Le pool était unique pour toutes : le trésor du donjon de l'une attendait
      dans l'écran de l'autre, où il n'avait aucun sens et où on pouvait le
      distribuer par erreur.
    */
    const butin = React.useMemo(
        () => lootPool.filter(it => estDeLaCampagne(it.campaignId, activeCampaignId)),
        [lootPool, activeCampaignId],
    );

    // Trouver la session active pour filtrer les personnages
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    const activeSession = activeCampaign?.activeSessionId 
        ? sessions.find(s => s.id === activeCampaign.activeSessionId)
        : null;

    const sessionEntityIds = activeSession?.sessionEntityIds || [];

    const handleAssign = (itemId: string, playerId: string, characterId: string) => {
        assignLootToCharacter(itemId, playerId, characterId);
    };

    if (butin.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-app-text/40 border-2 border-dashed border-white/5 rounded-xl bg-white/2">
                <Package size={48} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">{t('modules:loot.pool.empty')}</p>
                <p className="text-[10px] uppercase tracking-widest mt-1">{t('modules:loot.pool.empty_hint')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <Package size={20} className="text-accent" />
                    <h3 className="text-sm font-bold uppercase tracking-tighter">
                        {t('modules:loot.pool.title', { count: butin.length })}
                    </h3>
                </div>
                <button 
                    onClick={() => clearLootPool()}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
                >
                    {t('modules:loot.pool.clear_all')}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {butin.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-bento p-3 flex flex-col gap-3 group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-app-text group-hover:text-accent transition-colors">
                                        {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-widest text-app-text/40 font-bold">
                                        {libelleDeRarete(driver, item.rarity)} • {t(`modules:loot.types.${item.type || 'item'}`, { defaultValue: item.type })}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => removeFromPool(item.id)}
                                    className="p-1.5 rounded-md hover:bg-red-500/10 text-app-text/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {players.map(player => 
                                    player.characters
                                        .filter(char => sessionEntityIds.includes(char.id))
                                        .map(char => (
                                            <button
                                                key={`${player.id}-${char.id}`}
                                                onClick={() => handleAssign(item.id, player.id, char.id)}
                                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-accent/30 hover:bg-accent/10 transition-all group/btn"
                                                title={t('modules:loot.pool.assign_to', { name: char.name })}
                                            >
                                                <CharacterPortrait character={char} size={20} />
                                                <span className="text-[10px] font-bold text-app-text/60 group-hover/btn:text-accent truncate max-w-[80px]">
                                                    {char.name}
                                                </span>
                                                <Gift size={10} className="text-accent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                            </button>
                                        ))
                                )}
                                {sessionEntityIds.length === 0 && (
                                    <span className="text-[8px] uppercase font-bold text-app-text/20 py-2 italic">
                                        {t('modules:loot.pool.no_active_chars')}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LootPoolViewer;
