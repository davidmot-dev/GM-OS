import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Trash2, ArrowRight, Settings, Package, Upload, Power, Archive, ArchiveRestore, Eraser, ImagePlus, PenLine } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import { Etiquette } from '../../../components/socle';
import { ceQueLaClotureVaFaire } from '../logic/trame';
import { motion } from 'framer-motion';
import { gmConfirm, gmCustom } from '../../../stores/useModalStore';
import { useSessionOSStore } from '../useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { nexusService } from '../../system/archive/NexusService';
import { NexusHUD } from '../../system/archive/NexusHUD';
import { NexusConflictResolver } from '../../system/archive/NexusConflictResolver';
import type { NexusProgress, NexusConflict, NexusConflictResolution } from '../../system/archive/nexus.types';
import DialogueDePurge from '../../../components/purge/DialogueDePurge';
// Nexus-OS State
const CampaignLibrary: React.FC = () => {
    const { t } = useTranslation(['common', 'modules']);
    /*
      **Deux gestes, et ils ne font pas la même chose.** La corbeille retire la
      campagne de Session-OS ; la gomme va chercher ce qui porte encore son nom
      ailleurs — journal, storyboard, réserves de table, combats garés — et le
      dossier de ses fiches sur le disque. C'est la seconde qui répond à
      *« il reste des résidus qui polluent la tentative suivante »*.
    */
    const [aPurger, setAPurger] = useState<string | null>(null);
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

    /* « Gérer » mène à la fiche de la campagne — l'écran « Gérer » de la
       maquette —, en l'ouvrant si ce n'est pas déjà elle. */
    const gerer = (id: string) => {
        if (id !== activeCampaignId) setActiveCampaign(id);
        setCurrentView('campaign-details');
    };

    const exporter = async (id: string) => {
        nexusService.onProgress(setNexusProgress);
        setNexusProgress({ phase: 'scraping', progress: 0, message: t('modules:session.campaign_details.toasts.nexus_export_start') });
        await nexusService.exportBundle(id, { includeAssets: true });
        setTimeout(() => setNexusProgress(null), 3000);
    };

    const cloturerOuRouvrir = (campaign: (typeof campaigns)[number]) => {
        const os = useSessionOSStore.getState();
        if (campaign.clotureeLe) {
            os.rouvrirLaCampagne(campaign.id);
            return;
        }
        /*
          **Clôturer n'est pas supprimer**, et les deux boutons se touchent :
          celui-ci range, l'autre détruit. D'où l'annonce AVANT — le nombre de
          scènes qu'on va barrer se dit, sinon on découvre après coup ce qu'on
          vient de faire. Même règle que pour l'achèvement d'un acte.
        */
        const { annulees, terminees, actesOuverts } = ceQueLaClotureVaFaire(os.scenes, os.actes, campaign.id);
        const dits = [
            terminees.length > 0 && `${terminees.length} scène(s) jouée(s) seront terminées`,
            annulees.length > 0 && `${annulees.length} jamais jouée(s) seront annulées`,
            actesOuverts > 0 && `${actesOuverts} acte(s) seront achevés`,
        ].filter(Boolean).join(', ');
        gmConfirm(
            `Clôturer « ${campaign.name} » ?` + (dits ? ` ${dits}.` : '') + " Rien n'est effacé, et on peut rouvrir.",
            () => os.cloturerLaCampagne(campaign.id),
        );
    };

    /* La recherche filtre enfin : le champ était posé sans rien derrière. */
    const [recherche, setRecherche] = useState('');
    const visibles = campaigns.filter(c => {
        const q = recherche.trim().toLowerCase();
        return !q || c.name.toLowerCase().includes(q) || getSystemName(c.system).toLowerCase().includes(q);
    });

    const geste = 'flex items-center gap-1.5 text-ui-10 font-bold uppercase tracking-widest transition-colors';

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-bg">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-app-border bg-app-surface/40 px-6 py-5 shrink-0">
                <div>
                    <h1 className="font-display text-2xl font-bold leading-tight text-app-text">{t('modules:session.campaign_library.title')}</h1>
                    <p className="mt-1 text-sm text-app-muted">{t('modules:session.campaign_library.subtitle')}</p>
                </div>
                <Etiquette ton="accent">
                    {t('modules:session.campaign_library.agencement.compte', { count: campaigns.length })}
                    {activeCampaignId ? ` · ${t('modules:session.campaign_library.agencement.une_active')}` : ''}
                </Etiquette>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[16rem] flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle" size={16} />
                        <input
                            type="text"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            placeholder={t('modules:session.campaign_library.actions.search_placeholder')}
                            className="w-full rounded-lg border border-app-border bg-app-surface py-2.5 pl-10 pr-4 text-sm text-app-text outline-none transition-all placeholder:text-app-subtle focus:border-accent"
                        />
                    </div>
                    {activeCampaignId && (
                        <button
                            onClick={() => setActiveCampaign(null)}
                            className="flex items-center gap-2 rounded-lg border border-etat-danger/40 px-4 py-2.5 text-ui-10 font-black uppercase tracking-widest text-etat-danger transition-all hover:bg-etat-danger/10"
                        >
                            <Power size={14} />{t('modules:session.campaign_library.actions.deactivate_campaign')}
                        </button>
                    )}
                    <button
                        onClick={handleImport}
                        className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 py-2.5 text-ui-10 font-black uppercase tracking-widest text-app-text transition-all hover:border-accent/50"
                    >
                        <Upload size={14} />{t('modules:session.campaign_library.actions.import_nexus')}
                    </button>
                    <button
                        onClick={() => gmCustom('campaign-add')}
                        className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-ui-10 font-black uppercase tracking-widest text-app-on-accent transition-all hover:brightness-110"
                    >
                        <Plus size={14} />{t('modules:session.campaign_library.actions.create_campaign')}
                    </button>
                </div>

                <motion.div
                    className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
                >
                    {visibles.map(campaign => {
                        const active = campaign.id === activeCampaignId;
                        const medias = getMediaAssetCount(campaign.id);
                        return (
                            <motion.div
                                key={campaign.id}
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                className={`flex flex-col overflow-hidden rounded-xl border bg-app-surface transition-all ${active ? 'border-accent shadow-glow-accent/20' : 'border-app-border hover:border-accent/40'}`}
                            >
                                {/*
                                  **L'image de fond, et sa place même vide** — une
                                  invitation, pas un trou. Elle existait
                                  (`wallpaperUrl`) mais ne paraissait qu'en filigrane.
                                */}
                                <div className="relative h-40 shrink-0 overflow-hidden bg-app-surface-2">
                                    {campaign.wallpaperUrl ? (
                                        <button type="button" onClick={() => handleSelectCampaign(campaign.id)} className="block h-full w-full" title={t('modules:session.campaign_library.agencement.ouvrir')}>
                                            <ResolvedImage src={campaign.wallpaperUrl} alt="" className={`h-full w-full object-cover transition-transform duration-700 hover:scale-105 ${campaign.clotureeLe ? 'grayscale opacity-60' : ''}`} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => gmCustom('campaign-edit', campaign)}
                                            className="flex h-full w-full items-center justify-center"
                                        >
                                            <span className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-app-border px-5 py-3 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-all hover:border-accent/50 hover:text-accent">
                                                <ImagePlus size={20} />{t('modules:session.campaign_library.agencement.ajouter_image')}
                                            </span>
                                        </button>
                                    )}
                                    <div className="absolute left-3 top-3 flex gap-1.5">
                                        {active && <Etiquette ton="accent">{t('modules:session.campaign_library.status.active')}</Etiquette>}
                                        {campaign.clotureeLe && <Etiquette>{t('modules:session.campaign_library.agencement.cloturee')}</Etiquette>}
                                    </div>
                                    <span className="absolute bottom-3 right-3 rounded border border-app-border bg-app-bg/85 px-2 py-0.5 text-ui-9 font-black uppercase tracking-widest text-app-text">
                                        {getSystemName(campaign.system)}
                                    </span>
                                </div>

                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    <h3 className={`font-display text-lg font-bold leading-tight ${campaign.clotureeLe ? 'text-app-muted line-through' : 'text-app-text'}`}>{campaign.name}</h3>
                                    {/* Le synopsis, et non la description : c'est lui qui
                                        dit en trois lignes de quoi parle la campagne. */}
                                    {campaign.synopsis?.trim() ? (
                                        <p className="line-clamp-3 text-sm leading-relaxed text-app-muted">{campaign.synopsis}</p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => gmCustom('campaign-edit', campaign)}
                                            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-app-border py-3 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-all hover:border-accent/50 hover:text-accent"
                                        >
                                            <PenLine size={13} />{t('modules:session.campaign_library.agencement.ecrire_synopsis')}
                                        </button>
                                    )}

                                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-app-border pt-3">
                                        <button
                                            onClick={() => void exporter(campaign.id)}
                                            className={`${geste} text-app-muted hover:text-accent`}
                                            title={medias > 0
                                                ? t('modules:session.campaign_library.status.nexus_ready_tooltip', { count: medias })
                                                : t('modules:session.campaign_library.status.nexus_lite_tooltip')}
                                        >
                                            <Package size={12} />{t('modules:session.campaign_library.agencement.exporter', { count: medias })}
                                        </button>
                                        <button onClick={() => gmCustom('campaign-edit', campaign)} className={`${geste} text-app-muted hover:text-accent`}>
                                            <Settings size={12} />{t('common:actions.edit')}
                                        </button>
                                        <button
                                            onClick={() => cloturerOuRouvrir(campaign)}
                                            className={`${geste} text-app-muted hover:text-accent`}
                                            title={campaign.clotureeLe ? 'Rouvrir la campagne' : "Clôturer la campagne — elle se range, rien n'est effacé"}
                                        >
                                            {campaign.clotureeLe ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                                            {campaign.clotureeLe ? t('modules:session.campaign_library.agencement.rouvrir') : t('modules:session.campaign_library.agencement.cloturer')}
                                        </button>
                                        <span className="ml-auto flex items-center gap-3">
                                            <button
                                                onClick={() => gmConfirm(t('modules:session.campaign_library.status.delete_confirm', { name: campaign.name }), () => {
                                                    useSessionOSStore.getState().deleteCampaign(campaign.id);
                                                })}
                                                className={`${geste} text-etat-danger/80 hover:text-etat-danger`}
                                            >
                                                <Trash2 size={12} />{t('common:actions.delete')}
                                            </button>
                                            <button
                                                onClick={() => setAPurger(campaign.id)}
                                                className={`${geste} text-app-subtle hover:text-etat-danger`}
                                                title="Tout effacer — jusqu’aux résidus dans les autres modules et au dossier de ses fiches"
                                            >
                                                <Eraser size={12} />
                                            </button>
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => gerer(campaign.id)}
                                        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                            active ? 'bg-accent text-app-on-accent hover:brightness-110' : 'border border-app-border bg-app-surface-2 text-app-text hover:border-accent/50 hover:text-accent'
                                        }`}
                                    >
                                        {active ? t('modules:session.campaign_library.agencement.gerer_active') : t('modules:session.campaign_library.actions.manage')}
                                        <ArrowRight size={13} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {visibles.length === 0 && (
                    <p className="py-16 text-center text-sm italic text-app-subtle">
                        {recherche ? t('modules:session.campaign_library.agencement.aucun_resultat', { q: recherche }) : t('modules:session.campaign_library.agencement.aucune')}
                    </p>
                )}
            </div>

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

            {aPurger && (
                <DialogueDePurge
                    genre="campagne"
                    cibleId={aPurger}
                    onClose={() => setAPurger(null)}
                />
            )}
        </div>
    );
};

export default CampaignLibrary;
