import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionOSStore } from '../useSessionOSStore';
import { History, ArrowRight, Archive, Undo2 } from 'lucide-react';
import { CharacterPortrait } from './LootPoolViewer';
import { estDeLaCampagne } from '../store/lootSlice';
import { libelleDeRarete } from '../logic/vocabulaireDuButin';
import { couleurDeRarete } from './couleurDeRarete';
import { Etiquette } from '../../../components/socle';
import { gmConfirm } from '../../../stores/useModalStore';

const LootHistoryViewer: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { lootHistory, lootReserve, clearLootHistory, remettreAuPool, activeCampaignId, getActiveDriver } = useSessionOSStore();
    const driver = getActiveDriver();

    // L'historique se lit campagne par campagne, comme le pool qui l'alimente.
    const dons = React.useMemo(
        () => lootHistory.filter(e => estDeLaCampagne(e.campaignId, activeCampaignId)),
        [lootHistory, activeCampaignId],
    );
    /* La réserve des reliquats — ce que personne n'a pris, mis de côté pour
       une séance suivante. `?? []` : un état d'avant le 2026-10-02 ne la porte pas. */
    const misDeCote = React.useMemo(
        () => (lootReserve ?? []).filter(it => estDeLaCampagne(it.campaignId, activeCampaignId)),
        [lootReserve, activeCampaignId],
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

    return (
        <div className="flex flex-col gap-6">
            {misDeCote.length > 0 && (
                <section className="flex flex-col gap-3">
                    <div className="flex items-end justify-between gap-3 border-b border-app-border pb-3">
                        <div>
                            <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                                <Archive size={16} className="text-accent" />{t('modules:loot.history.agencement.mis_de_cote')}
                            </h3>
                            <p className="text-ui-10 text-app-muted">{t('modules:loot.history.agencement.mis_de_cote_aide')}</p>
                        </div>
                        <Etiquette>{misDeCote.length}</Etiquette>
                    </div>
                    <div className="flex flex-col gap-2">
                        {misDeCote.map(item => {
                            const couleur = couleurDeRarete(driver, item.rarity);
                            return (
                                <div key={item.id} className={`flex items-center gap-3 rounded-lg border border-app-border border-l-4 ${couleur.lisere} bg-app-surface px-3 py-2`}>
                                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-app-text">
                                        {item.quantity > 1 && <span className="mr-1 text-gm-gold">{item.quantity}</span>}{item.name}
                                    </span>
                                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-ui-9 font-black uppercase tracking-widest ${couleur.etiquette}`}>
                                        {libelleDeRarete(driver, item.rarity)}
                                    </span>
                                    <button
                                        onClick={() => remettreAuPool(item.id)}
                                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-app-border px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest text-accent transition-all hover:border-accent/50 hover:bg-accent/10"
                                    >
                                        <Undo2 size={12} />{t('modules:loot.history.agencement.remettre')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between gap-3 border-b border-app-border pb-3">
                    <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                        <History size={16} className="text-accent" />{t('modules:loot.history.title')}
                    </h3>
                    {dons.length > 0 && (
                        <button
                            onClick={() => gmConfirm(t('modules:loot.history.agencement.vider_confirm', { count: dons.length }), () => clearLootHistory())}
                            className="text-ui-10 font-black uppercase tracking-widest text-app-subtle transition-colors hover:text-etat-danger"
                        >
                            {t('modules:loot.history.clear_all')}
                        </button>
                    )}
                </div>

                {dons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-app-border p-8 text-app-muted">
                        <History size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-medium">{t('modules:loot.history.empty')}</p>
                        <p className="mt-1 text-ui-10 uppercase tracking-widest">{t('modules:loot.history.empty_hint')}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <AnimatePresence mode="popLayout">
                            {dons.map((entry) => {
                                const couleur = couleurDeRarete(driver, entry.rarity);
                                return (
                                    <motion.div
                                        key={entry.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex items-center gap-3 rounded-lg border border-app-border border-l-4 ${couleur.lisere} bg-app-surface px-3 py-2`}
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-sm font-bold text-app-text">
                                                    {entry.quantity > 1 && <span className="mr-1 text-gm-gold">{entry.quantity}</span>}{entry.itemName}
                                                </span>
                                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-ui-9 font-black uppercase tracking-widest ${couleur.etiquette}`}>
                                                    {libelleDeRarete(driver, entry.rarity)}
                                                </span>
                                            </div>
                                            <span className="text-ui-10 text-app-muted">{formatTime(entry.timestamp)}</span>
                                        </div>

                                        <ArrowRight size={12} className="shrink-0 text-app-subtle" />
                                        <div className="flex shrink-0 items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-2 py-1">
                                            <CharacterPortrait
                                                character={{ portraitUrl: entry.recipientPortrait || '', name: entry.recipientName }}
                                                size={20}
                                            />
                                            <span className="whitespace-nowrap text-ui-10 font-bold text-accent">{entry.recipientName}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </section>
        </div>
    );
};

export default LootHistoryViewer;
