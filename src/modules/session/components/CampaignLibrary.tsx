import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, BookOpen, Trash2, ArrowRight, Settings, Package, Upload, Power } from 'lucide-react';
import { motion } from 'framer-motion';
import { gmConfirm, gmCustom } from '../../../stores/useModalStore';
import { useSessionOSStore } from '../useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { nexusService } from '../../system/archive/NexusService';
import { NexusHUD } from '../../system/archive/NexusHUD';
import { NexusConflictResolver } from '../../system/archive/NexusConflictResolver';
import type { NexusProgress, NexusConflict, NexusConflictResolution } from '../../system/archive/nexus.types';
// Nexus-OS State
const CampaignLibrary: React.FC = () => {
    const { t } = useTranslation(['common', 'modules']);
    const { campaigns, setActiveCampaign, setCurrentView, activeCampaignId, customSheetTemplates, customGameDrivers, entities, atlasMaps, wikiEntries, clues } = useSessionOSStore();

    const getSystemName = (systemId: string) => {
        const customDriver = customGameDrivers?.find(d => d.id === systemId);
        if (customDriver) return customDriver.name;
        
        const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...(customSheetTemplates || [])];
        return allTemplates.find(t => t.id === systemId)?.name || systemId;
    };

    /**
     * Compte le nombre total de références media pour une campagne.
     * Identique à ce que fait NexusService.collectAssetPaths(), mais
     * calculé côté UI pour l'affichage du badge.
     * Une ref est un ID Media Hub (commence par "m-") ou un chemin absolu.
     */
    const getMediaAssetCount = (campaignId: string): number => {
        const isMediaRef = (ref: string | undefined | null) =>
            !!ref && !ref.startsWith('http') && !ref.startsWith('blob:') && ref.trim().length > 0;

        let count = 0;
        const campaign = campaigns.find(c => c.id === campaignId);

        if (campaign?.wallpaperUrl && isMediaRef(campaign.wallpaperUrl)) count++;

        entities
            .filter(e => e.campaignId === campaignId)
            .forEach(e => { if (isMediaRef(e.avatar)) count++; });

        atlasMaps
            .filter(m => m.campaignId === campaignId)
            .forEach(m => { if (isMediaRef(m.fileUrl)) count++; });

        wikiEntries
            .filter(w => w.campaignId === campaignId)
            .forEach(w => { count += (w.imageUrls ?? []).filter(isMediaRef).length; });

        clues
            .filter(cl => cl.campaignId === campaignId)
            .forEach(cl => { if (isMediaRef(cl.mediaUrl)) count++; });

        return count;
    };

    // ── Nexus-OS State ────────────────────────────────────────────────────
    const [nexusProgress, setNexusProgress] = useState<NexusProgress | null>(null);
    const [conflictState, setConflictState] = useState<NexusConflict[] | null>(null);
    const resolverRef = useRef<((resolution: NexusConflictResolution) => void) | null>(null);

    const handleImport = async () => {
        nexusService.onProgress(setNexusProgress);
        setNexusProgress({ phase: 'importing', progress: 0, message: t('modules:session.campaign_details.toasts.nexus_import_select') });

        const onConflict = (conflicts: NexusConflict[]): Promise<NexusConflictResolution> => {
            setConflictState(conflicts);
            return new Promise<NexusConflictResolution>((resolve) => {
                resolverRef.current = resolve;
            });
        };

        await nexusService.importBundle(onConflict);
        setConflictState(null);
        setTimeout(() => setNexusProgress(null), 3000);
    };

    const handleConflictResolve = (resolution: NexusConflictResolution) => {
        setConflictState(null);
        resolverRef.current?.(resolution);
        resolverRef.current = null;
    };
    // ─────────────────────────────────────────────────────────────────────

    const handleSelectCampaign = (id: string) => {
        setActiveCampaign(id);
        setCurrentView('cockpit');
    };

    return (
        <div className="flex-1 flex flex-col gap-6 p-8 h-full overflow-y-auto custom-scrollbar bg-app-bg">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-app-text/90 uppercase tracking-tighter">{t('modules:session.campaign_library.title')}</h2>
                <p className="text-app-text/40 font-medium">{t('modules:session.campaign_library.subtitle')}</p>
            </div>

            <div className="flex items-center gap-4 py-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/20 group-focus-within:text-accent transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder={t('modules:session.campaign_library.actions.search_placeholder')}
                        className="w-full bg-app-surface/60 border border-app-border/40 rounded-xl py-3 pl-11 pr-4 text-app-text/80 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all font-display"
                    />
                </div>
                
                {/* Global Import Action */}
                <button
                    onClick={handleImport}
                    className="flex items-center gap-2 glass-bento px-6 py-3 rounded-xl text-app-text/60 font-bold hover:text-app-text transition-all hover:-translate-y-0.5"
                >
                    <Upload size={20} />
                    {t('modules:session.campaign_library.actions.import_nexus')}
                </button>

                {activeCampaignId && (
                    <button
                        onClick={() => setActiveCampaign(null)}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-xl text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all hover:-translate-y-0.5"
                    >
                        <Power size={20} />
                        {t('modules:session.campaign_library.actions.deactivate_campaign')}
                    </button>
                )}

                <button
                    onClick={() => gmCustom('campaign-add')}
                    className="flex items-center gap-2 bg-accent px-6 py-3 rounded-xl text-app-bg font-bold hover:brightness-110 transition-all shadow-glow-accent/20 hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    {t('modules:session.campaign_library.actions.create_campaign')}
                </button>
            </div>

            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                    }
                }}
            >
                {campaigns.map(campaign => (
                    <motion.div
                        key={campaign.id}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                        }}
                        className={`group glass-bento relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer shadow-xl ${campaign.id === activeCampaignId ? 'ring-2 ring-accent shadow-glow-accent/20' : 'hover:ring-1 hover:ring-white/20 hover:shadow-glow-accent/5'}`}
                        onClick={() => handleSelectCampaign(campaign.id)}
                    >
                        {/* Background subtle image if available */}
                        {campaign.wallpaperUrl && (
                            <div className="absolute inset-0 opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-700">
                                <img src={campaign.wallpaperUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                        )}

                        <div className="relative p-6 flex flex-col h-64 justify-between z-10">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-app-bg flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-app-bg transition-all duration-500">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            className="p-2 text-app-text/20 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                gmCustom('campaign-edit', campaign); 
                                            }}
                                            title={t('common:actions.edit')}
                                        >
                                            <Settings size={18} />
                                        </button>
                                        <button
                                            className="p-2 text-app-text/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                gmConfirm(t('modules:session.campaign_library.status.delete_confirm', { name: campaign.name }), () => {
                                                    useSessionOSStore.getState().deleteCampaign(campaign.id);
                                                });
                                            }}
                                            title={t('common:actions.delete')}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-app-text/90 mb-1 group-hover:text-accent transition-colors">{campaign.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-app-bg text-app-text/40 px-2 py-0.5 rounded font-black uppercase tracking-widest">{getSystemName(campaign.system)}</span>
                                    {campaign.id === activeCampaignId && (
                                        <span className="text-[10px] bg-accent text-app-bg px-2 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">{t('modules:session.campaign_library.status.active')}</span>
                                    )}
                                </div>
                                <p className="text-app-text/40 text-xs mt-3 line-clamp-2 leading-relaxed italic">
                                    "{campaign.description}"
                                </p>
                            </div>

                             <div className="flex items-center justify-between mt-4">
                                <div className="flex -space-x-2">
                                    {/* Mock player avatars */}
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-7 h-7 rounded-full border-2 border-app-bg bg-app-surface overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Player${i}${campaign.id}`} alt="" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Badge Nexus-Ready — basé sur le compte réel des assets media */}
                                    {(() => {
                                        const assetCount = getMediaAssetCount(campaign.id);
                                        return assetCount > 0 ? (
                                            <span
                                                title={t('modules:session.campaign_library.status.nexus_ready_tooltip', { count: assetCount })}
                                                className="flex items-center gap-1 text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest"
                                            >
                                                <Package size={8} />
                                                Nexus-Ready
                                            </span>
                                        ) : (
                                            <span
                                                title={t('modules:session.campaign_library.status.nexus_lite_tooltip')}
                                                className="flex items-center gap-1 text-[9px] text-app-text/20 border border-app-border/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest"
                                            >
                                                <Package size={8} />
                                                Nexus
                                            </span>
                                        );
                                    })()}
                                    <div className="flex items-center gap-1 text-accent font-bold text-xs group-hover:translate-x-1 transition-transform">
                                        {t('modules:session.campaign_library.actions.manage')} <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Nexus Overlays */}
            {nexusProgress && (
                <NexusHUD 
                    progress={nexusProgress} 
                    onResolveInteraction={(choice) => nexusService.resolveInteraction(choice)}
                />
            )}

            {conflictState && (
                <NexusConflictResolver 
                    conflicts={conflictState} 
                    onResolve={handleConflictResolve}
                />
            )}
        </div>
    );
};

export default CampaignLibrary;
