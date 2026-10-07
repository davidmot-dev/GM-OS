import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import LootGeneratorPanel from './LootGeneratorPanel';
import LootPoolViewer from './LootPoolViewer';
import LootHistoryViewer from './LootHistoryViewer';
import { Sparkles, Package, Coins, History } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { estDeLaCampagne } from '../store/lootSlice';
import { estRemarquable, nomDeLaMonnaie } from '../logic/vocabulaireDuButin';
import { motion } from 'framer-motion';
import { Panneau, Etiquette, Icone } from '../../../components/socle';
import { useHeureDuRendu } from '../../../hooks/useHeureDuRendu';

const LootOS: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { lootPool, lootHistory, activeCampaignId, getActiveDriver } = useSessionOSStore();
    const [activeTab, setActiveTab] = useState<'generate' | 'pool' | 'history'>('generate');
    const heure = useHeureDuRendu();

    const driver = getActiveDriver();
    // Le résumé compte ce que l'écran montre, donc le butin de cette campagne.
    const butin = useMemo(
        () => lootPool.filter(it => estDeLaCampagne(it.campaignId, activeCampaignId)),
        [lootPool, activeCampaignId],
    );

    const totalValue = butin.reduce((acc, it) => acc + (Number(it.value) || 0) * (it.quantity || 1), 0);
    const remarquables = butin.filter(it => estRemarquable(driver, it.rarity)).length;
    const monnaie = nomDeLaMonnaie(driver);

    const gmQuotes = t('modules:loot.gm_tips.quotes', { returnObjects: true }) as string[];

    const dailyQuote = useMemo(() => {
        if (!Array.isArray(gmQuotes) || gmQuotes.length === 0) return '';
        const quoteIndex = Math.floor((heure / 3600000) % gmQuotes.length);
        return gmQuotes[quoteIndex];
    }, [gmQuotes, heure]);

    const distribues = lootHistory.filter(e => estDeLaCampagne(e.campaignId, activeCampaignId)).length;
    /*
      **Les trois étapes, numérotées, dans l'ordre où l'on s'en sert** —
      refonte, L5, étape 2 : générer, distribuer, relire. Chaque onglet dit
      ce qui l'attend (« 3 en attente », « 5 distribués »).
    */
    const ETAPES = [
        { id: 'generate', icone: Sparkles, libelle: t('modules:loot.tabs.generate'), compte: null },
        { id: 'pool', icone: Package, libelle: t('modules:loot.tabs.pool'), compte: butin.length ? t('modules:loot.agencement.en_attente', { count: butin.length }) : null },
        { id: 'history', icone: History, libelle: t('modules:loot.tabs.history'), compte: distribues ? t('modules:loot.agencement.distribues', { count: distribues }) : null },
    ] as const;

    return (
        <div className="flex h-full flex-col bg-app-bg">
            <div role="tablist" className="flex border-b border-app-border bg-app-surface/40">
                {ETAPES.map((etape, rang) => {
                    const actif = activeTab === etape.id;
                    return (
                        <button
                            key={etape.id}
                            role="tab"
                            aria-selected={actif}
                            onClick={() => setActiveTab(etape.id)}
                            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                                actif ? 'border-accent bg-accent/5 text-accent' : 'border-transparent text-app-muted hover:text-app-text'
                            }`}
                        >
                            <etape.icone size={14} />
                            {rang + 1}. {etape.libelle}
                            {etape.compte && <Etiquette ton={actif ? 'accent' : 'neutre'}>{etape.compte}</Etiquette>}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {activeTab === 'generate' && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <LootGeneratorPanel />
                        </motion.div>
                    )}
                    {activeTab === 'pool' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                            <LootPoolViewer />
                        </motion.div>
                    )}
                    {activeTab === 'history' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <LootHistoryViewer />
                        </motion.div>
                    )}
                </div>

                {/* À droite, toujours visibles : le trésor et le conseil */}
                <aside className="hidden w-64 flex-col gap-4 border-l border-app-border bg-app-surface/40 p-4 lg:flex">
                    <Panneau className="p-4">
                        <p className="font-display text-sm font-bold uppercase tracking-wider text-app-text">{t('modules:loot.stats.title')}</p>
                        <p className="mt-3 text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('modules:loot.stats.total_value')}</p>
                        <p className="flex items-baseline gap-1.5 text-gm-gold" title={monnaie}>
                            <span className="font-display text-2xl font-bold">{totalValue.toLocaleString()}</span>
                            {/*
                                Le jeu nomme sa monnaie, ou personne ne la nomme.
                                Une pièce d'or dessinée sur un butin de Blade Runner
                                est une affirmation, pas une décoration.
                            */}
                            {monnaie
                                ? <span className="text-ui-10 font-bold uppercase tracking-wider">{monnaie}</span>
                                : <Icone nom="butin" taille={14} repli={<Coins size={14} />} />}
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-app-border pt-3 text-xs">
                            <span className="text-app-muted">{t('modules:loot.stats.remarkable_items')}</span>
                            <Etiquette ton="accent">{remarquables}</Etiquette>
                        </div>
                    </Panneau>

                    <Panneau className="p-4">
                        <p className="font-display text-sm font-bold uppercase tracking-wider text-app-text">{t('modules:loot.gm_tips.title')}</p>
                        <p className="mt-2 text-xs italic leading-relaxed text-app-muted">« {dailyQuote} »</p>
                    </Panneau>
                </aside>
            </div>
        </div>
    );
};

export default LootOS;
