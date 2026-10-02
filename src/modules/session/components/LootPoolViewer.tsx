import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionOSStore } from '../useSessionOSStore';
import { Package, User, Trash2, Scale, Archive } from 'lucide-react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { estDeLaCampagne } from '../store/lootSlice';
import { libelleDeRarete } from '../logic/vocabulaireDuButin';
import { partagerEquitablement, estUneMonnaie } from '../logic/partageDuButin';
import { couleurDeRarete } from './couleurDeRarete';
import { Etiquette } from '../../../components/socle';
import { gmConfirm } from '../../../stores/useModalStore';
/**
 * Petit composant pour gérer la résolution de l'URL du portrait (Media-OS)
 */
export const CharacterPortrait: React.FC<{ character?: { portraitUrl: string; name?: string }; size?: number }> = ({ character, size = 16 }) => {
    const resolvedUrl = useMediaUrl(character?.portraitUrl);
    
    return (
        <div 
            className="rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border border-app-text/10 shadow-inner"
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
        partagerLaMonnaie,
        archiverLesReliquats,
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

    /* Les PJ présents à la séance — les seuls à qui l'on donne, et entre qui
       la monnaie se partage (décidé par David le 2026-10-02). */
    const presents = players.flatMap(player => player.characters
        .filter(char => sessionEntityIds.includes(char.id))
        .map(char => ({ player, char })));

    if (butin.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-app-border p-8 text-app-muted">
                <Package size={48} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">{t('modules:loot.pool.empty')}</p>
                <p className="mt-1 text-ui-10 uppercase tracking-widest">{t('modules:loot.pool.empty_hint')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3 border-b border-app-border pb-3">
                <div>
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-app-text">{t('modules:loot.pool.agencement.titre')}</h3>
                    <p className="text-ui-10 text-app-muted">{t('modules:loot.pool.agencement.aide')}</p>
                </div>
                <Etiquette ton="accent">{t('modules:loot.pool.title', { count: butin.length })}</Etiquette>
            </div>

            <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {butin.map((item) => {
                        const couleur = couleurDeRarete(driver, item.rarity);
                        const monnaie = estUneMonnaie(item.type);
                        const partage = monnaie ? partagerEquitablement(item.quantity, presents.length) : null;
                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group flex flex-col gap-3 rounded-lg border border-app-border border-l-4 ${couleur.lisere} bg-app-surface p-4`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-display text-base font-bold text-app-text">
                                            {item.quantity > 1 && <span className="mr-1 text-gm-gold">{item.quantity}</span>}{item.name}
                                        </p>
                                        {item.description && <p className="mt-1 text-xs leading-relaxed text-app-muted">{item.description}</p>}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <span className="rounded border border-app-border px-1.5 py-0.5 text-ui-9 font-black uppercase tracking-widest text-app-muted">
                                            {t(`modules:loot.types.${item.type || 'item'}`, { defaultValue: item.type })}
                                        </span>
                                        <span className={`rounded px-1.5 py-0.5 text-ui-9 font-black uppercase tracking-widest ${couleur.etiquette}`}>
                                            {libelleDeRarete(driver, item.rarity)}
                                        </span>
                                        <button
                                            onClick={() => removeFromPool(item.id)}
                                            className="rounded-md p-1.5 text-app-subtle transition-all hover:bg-etat-danger/10 hover:text-etat-danger"
                                            title={t('modules:loot.pool.agencement.retirer')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 border-t border-app-border pt-3">
                                    <span className="mr-1 text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('modules:loot.pool.agencement.donner_a')}</span>
                                    {presents.map(({ player, char }) => (
                                        <button
                                            key={`${player.id}-${char.id}`}
                                            onClick={() => assignLootToCharacter(item.id, player.id, char.id)}
                                            className="flex items-center gap-2 rounded-lg border border-app-border bg-app-bg/40 px-2.5 py-1.5 transition-all hover:border-accent/50 hover:bg-accent/10"
                                            title={t('modules:loot.pool.assign_to', { name: char.name })}
                                        >
                                            <CharacterPortrait character={char} size={20} />
                                            <span className="max-w-[8rem] truncate text-ui-10 font-bold text-app-text">{char.name}</span>
                                        </button>
                                    ))}
                                    {/* La monnaie se partage : une part entière chacun,
                                        le reste attend ici. Le bouton dit la part, et
                                        s'éteint quand chacun recevrait zéro. */}
                                    {monnaie && presents.length > 1 && (
                                        <button
                                            onClick={() => partagerLaMonnaie(item.id, presents.map(({ player, char }) => ({ playerId: player.id, characterId: char.id })))}
                                            disabled={!partage}
                                            className="flex items-center gap-1.5 rounded-lg border border-dashed border-gm-gold/50 px-2.5 py-1.5 text-ui-10 font-bold text-gm-gold transition-all hover:bg-gm-gold/10 disabled:opacity-30"
                                            title={partage
                                                ? t('modules:loot.pool.agencement.partager_aide', { part: partage.part, count: presents.length, reste: partage.reste })
                                                : t('modules:loot.pool.agencement.partage_impossible')}
                                        >
                                            <Scale size={12} />{t('modules:loot.pool.agencement.partager')}
                                            {partage && <span className="font-mono">({partage.part} × {presents.length})</span>}
                                        </button>
                                    )}
                                    {presents.length === 0 && (
                                        <span className="text-ui-10 italic text-app-subtle">{t('modules:loot.pool.no_active_chars')}</span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-app-border pt-3">
                <span className="mr-auto text-ui-10 text-app-muted">{t('modules:loot.pool.agencement.en_attente', { count: butin.length })}</span>
                {/* Ce que personne n'a pris part dans la réserve, d'où il revient
                    (onglet Historique, « Remettre au pool »). */}
                <button
                    onClick={() => archiverLesReliquats()}
                    className="flex items-center gap-2 rounded-lg border border-app-border px-4 py-2 text-ui-10 font-black uppercase tracking-widest text-app-text transition-all hover:border-accent/50 hover:text-accent"
                >
                    <Archive size={13} />{t('modules:loot.pool.agencement.archiver')}
                </button>
                <button
                    onClick={() => gmConfirm(t('modules:loot.pool.agencement.vider_confirm', { count: butin.length }), () => clearLootPool())}
                    className="flex items-center gap-2 rounded-lg border border-etat-danger/40 px-4 py-2 text-ui-10 font-black uppercase tracking-widest text-etat-danger transition-all hover:bg-etat-danger/10"
                >
                    <Trash2 size={13} />{t('modules:loot.pool.clear_all')}
                </button>
            </div>
        </div>
    );
};

export default LootPoolViewer;
