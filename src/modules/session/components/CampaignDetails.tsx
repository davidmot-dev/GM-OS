import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Info, Calendar, Users, MapPin, Edit3, Sparkles, Share2, Package, Upload, DownloadCloud } from 'lucide-react';
import { Panneau, Etiquette } from '../../../components/socle';
import { useModalStore } from '../../../stores/useModalStore';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { nexusService } from '../../system/archive/NexusService';
import type { NexusProgress, NexusConflict, NexusConflictResolution } from '../../system/archive/nexus.types';
import { NexusHUD } from '../../system/archive/NexusHUD';
import { NexusConflictResolver } from '../../system/archive/NexusConflictResolver';

const CampaignDetails: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'modules']);
    const { campaigns, activeCampaignId, sessions, setCurrentView, entities, atlasMaps, customSheetTemplates, customGameDrivers, setSelectedAtlasMap, navigateToNpcDetail } = useSessionOSStore();
    const [apercuReplie, setApercuReplie] = useState(false);
    const [survole, setSurvole] = useState<string | null>(null);
    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const campaignSessions = sessions.filter(s => s.campaignId === activeCampaignId);
    const campaignNPCs = entities.filter(e => e.type === 'npc' && e.campaignId === activeCampaignId);
    const activeLocations = atlasMaps.filter(m => campaign?.activeLocationIds?.includes(m.id));

    // ── Nexus-OS State (doit être avant le early return) ──────────────────
    const [nexusProgress, setNexusProgress] = useState<NexusProgress | null>(null);
    const isNexusAvailable = typeof window !== 'undefined' && !!window.appBridge?.nexus;

    // ── Conflict Resolver State ───────────────────────────────────────────
    const [conflictState, setConflictState] = useState<NexusConflict[] | null>(null);
    // Ref vers la fonction de résolution — permet au callback onConflict
    // de retourner une Promise résolue par l'interaction utilisateur
    const resolverRef = useRef<((resolution: NexusConflictResolution) => void) | null>(null);

    /*
      **L'archive peut partir sans ses médias** (point N6, 2026-09-05).
      `includeAssets` était lu par `exportBundle` depuis toujours, mais **aucun
      écran ne le passait** : le bundle emportait donc toujours tout. Une
      campagne bien illustrée pèse des centaines de mégaoctets, ce qui ne
      s'envoie pas par courriel.

      Le choix ne se retient pas d'une fois sur l'autre : *emporter les médias
      est ce qu'on veut presque toujours*, et une case qui reste décochée
      produirait un jour une archive vide qu'on croit complète.
    */
    const [emporterLesMedias, setEmporterLesMedias] = useState(true);

    const handleExport = async () => {
        if (!activeCampaignId) return;
        nexusService.onProgress(setNexusProgress);
        setNexusProgress({ phase: 'scraping', progress: 0, message: t('modules:session.campaign_details.toasts.nexus_export_start') });
        await nexusService.exportBundle(activeCampaignId, { includeAssets: emporterLesMedias });
        setTimeout(() => setNexusProgress(null), 3000);
    };

    const handleImport = async () => {
        nexusService.onProgress(setNexusProgress);
        setNexusProgress({ phase: 'importing', progress: 0, message: t('modules:session.campaign_details.toasts.nexus_import_select') });

        // Callback onConflict : affiche le modal et suspend l'import
        // jusqu'à ce que l'utilisateur clique sur une stratégie
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

    /**
     * L'export vers le coffre **dit ce qu'il a fait**.
     *
     * Le bouton lançait l'export et jetait le verdict : un coffre introuvable
     * était indiscernable d'une réussite. Le message vient du service, il n'est
     * pas reconstruit ici.
     */
    const [verdictObsidian, setVerdictObsidian] = useState<{ success: boolean; message: string } | null>(null);
    const handleExportObsidian = async () => {
        setVerdictObsidian(null);
        const verdict = await useSessionOSStore.getState().exportActiveCampaignToObsidian();
        setVerdictObsidian(verdict);
        setTimeout(() => setVerdictObsidian(null), 6000);
    };

    // Handler résolution : appelé par NexusConflictResolver au clic
    const handleConflictResolve = (resolution: NexusConflictResolution) => {
        setConflictState(null);
        resolverRef.current?.(resolution);
        resolverRef.current = null;
    };
    // ─────────────────────────────────────────────────────────────────────

    if (!campaign) return null;

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const piloteActif = customGameDrivers.find(d => d.id === campaign.system);
    const systemName =
        allTemplates.find(t => t.id === campaign.system)?.name ||
        piloteActif?.name ||
        campaign.system;

    const seances = [...campaignSessions].sort((a, b) => b.number - a.number);
    const enCours = seances.filter(s => s.status === 'active').length;
    const pnjSurvole = campaignNPCs.find(n => n.id === survole) ?? campaignNPCs[0];
    const TON_DU_STATUT = { planned: 'alerte', active: 'accent', done: 'succes' } as const;
    const TON_DU_CAMP = { ally: 'succes', neutral: 'neutre', hostile: 'danger', boss: 'accent' } as const;
    const dateLongue = (date: string) => {
        /* `AAAA-MM-JJ` se lit à midi (un fuseau négatif reculerait d'un jour) ;
           une date complète, venue d'une importation, se lit telle quelle. */
        const jour = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : new Date(date);
        return Number.isNaN(jour.getTime()) ? date : jour.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const copierPourLOracle = (s: (typeof seances)[number], bouton: HTMLButtonElement) => {
        const checklistText = s.checklist?.length > 0
            ? `\n\nCHECKLIST DE LA SESSION :\n${s.checklist.map(item => `${item.isCompleted ? '[X]' : '[ ]'} ${item.text}`).join('\n')}`
            : '';
        const text = `--- ORACLE UPDATE PROTOCOL ---\nCAMPAIGN: ${campaign.name}\nSESSION: #${s.number} - ${new Date(s.date).toLocaleDateString()}\n\nINSTRUCTIONS POUR L'ORACLE : \n1. Intègre ce compte-rendu de session dans ta base de connaissances.\n2. Identifie les nouveaux PNJs rencontrés et mets à jour les relations existantes.\n3. Note les changements majeurs dans l'univers (lieux visités, quêtes terminées).\n4. Prépare-toi à répondre aux questions futures en tenant compte de ces nouveaux événements.\n\nCONTENU DE LA SESSION :\n${s.publicSummary || "No summary recorded."}${checklistText}\n------------------------------`;
        void navigator.clipboard.writeText(text);
        const avant = bouton.textContent;
        bouton.textContent = t('modules:session.campaign_details.status.copied');
        setTimeout(() => { bouton.textContent = avant; }, 2000);
    };

    const titreDeBloc = (icone: React.ReactNode, titre: React.ReactNode, aside?: React.ReactNode) => (
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
            <h3 className="flex min-w-0 items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                <span className="shrink-0 text-accent">{icone}</span>
                <span className="truncate">{titre}</span>
            </h3>
            {aside}
        </div>
    );
    const boutonDEnTete = 'flex items-center gap-2 rounded-lg border px-3 py-2 text-ui-10 font-black uppercase tracking-widest transition-all';

    return (
        <>
        <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar bg-app-bg">
            {/*
              **L'image de fond en bandeau** — demandée par David, reprise de la
              bibliothèque (refonte, L5, étape 2). Sans image, le bandeau garde
              sa place, sobre.
            */}
            <header className="relative shrink-0 overflow-hidden border-b border-app-border bg-app-surface">
                {campaign.wallpaperUrl && (
                    <ResolvedAsset src={campaign.wallpaperUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-app-bg via-app-bg/80 to-transparent" />
                <div className="relative flex flex-wrap items-end justify-between gap-4 px-6 py-5">
                    <div className="min-w-0">
                        <button
                            onClick={() => setCurrentView('library')}
                            className="flex items-center gap-1 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:text-accent"
                        >
                            <ChevronLeft size={14} />{t('modules:session.campaign_details.agencement.retour')}
                        </button>
                        <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-app-text">{campaign.name}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Etiquette>{systemName}</Etiquette>
                            {piloteActif && <Etiquette ton="info">{piloteActif.emoji} {t('modules:session.campaign_details.status.driver_active')}</Etiquette>}
                            {campaign.id === activeCampaignId && <Etiquette ton="accent">{t('modules:session.campaign_library.status.active')}</Etiquette>}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setCurrentView('campaign-editor')}
                            className={`${boutonDEnTete} border-app-border bg-app-surface text-app-text hover:border-accent/50`}
                        >
                            <Edit3 size={13} />{t('modules:session.campaign_details.actions.edit')}
                        </button>
                        <button
                            onClick={handleExportObsidian}
                            title={verdictObsidian?.message}
                            className={`${boutonDEnTete} ${
                                verdictObsidian === null
                                    ? 'border-gm-violet/40 text-gm-violet hover:bg-gm-violet/10'
                                    : verdictObsidian.success
                                    ? 'border-etat-succes/40 text-etat-succes'
                                    : 'border-etat-danger/40 text-etat-danger'
                            }`}
                        >
                            <Share2 size={13} />{t('modules:session.campaign_details.actions.export_obsidian')}
                        </button>
                    </div>
                </div>
                {verdictObsidian && (
                    <p role="status" className={`relative px-6 pb-3 text-xs font-semibold ${verdictObsidian.success ? 'text-etat-succes' : 'text-etat-danger'}`}>
                        {verdictObsidian.message}
                    </p>
                )}
            </header>

            <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-4">
                    {/* L'aperçu, repliable : on le connaît, on vient chercher le reste */}
                    <Panneau>
                        {titreDeBloc(<Info size={16} />, t('modules:session.campaign_details.sections.overview'),
                            <button onClick={() => setApercuReplie(!apercuReplie)} className="flex items-center gap-1 text-ui-10 font-black uppercase tracking-widest text-app-muted hover:text-accent">
                                {apercuReplie ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                                {apercuReplie ? t('modules:session.campaign_details.agencement.afficher') : t('modules:session.campaign_details.agencement.masquer')}
                            </button>)}
                        {!apercuReplie && (
                            <div className="grid grid-cols-1 gap-4 px-4 pb-4 md:grid-cols-2">
                                <div>
                                    <p className="mb-1 text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('modules:session.campaign_details.labels.description')}</p>
                                    <p className="text-sm leading-relaxed text-app-text">{campaign.description || '—'}</p>
                                </div>
                                <div className="rounded-lg border-l-2 border-accent bg-accent/5 px-3 py-2">
                                    <p className="mb-1 text-ui-10 font-black uppercase tracking-widest text-accent">{t('modules:session.campaign_details.labels.synopsis')}</p>
                                    <p className="text-sm italic leading-relaxed text-app-text">{campaign.synopsis ? `« ${campaign.synopsis} »` : '—'}</p>
                                </div>
                            </div>
                        )}
                    </Panneau>

                    {/* Les séances d'abord : la séance en cours se détache */}
                    <Panneau>
                        {titreDeBloc(<Calendar size={16} />, t('modules:session.campaign_details.sections.sessions'),
                            <span className="flex items-center gap-1.5">
                                <Etiquette>{t('modules:session.campaign_details.agencement.seances', { count: seances.length })}</Etiquette>
                                {enCours > 0 && <Etiquette ton="accent">{t('modules:session.campaign_details.agencement.en_cours', { count: enCours })}</Etiquette>}
                            </span>)}
                        <div className="flex flex-col gap-2 px-4 pb-4">
                            {seances.map(s => (
                                <div key={s.id} className={`rounded-lg border p-3 ${s.status === 'active' ? 'border-accent bg-accent/10' : 'border-app-border bg-app-bg/40'}`}>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className={`font-display text-lg font-bold ${s.status === 'active' ? 'text-accent' : 'text-app-text'}`}>#{s.number}</span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-app-text">{dateLongue(s.date)}</span>
                                        {s.status && <Etiquette ton={TON_DU_STATUT[s.status] ?? 'neutre'} className="ml-auto">{t(`modules:session.prep.status.${s.status}`, { defaultValue: s.status })}</Etiquette>}
                                    </div>
                                    <p className={`mt-1.5 line-clamp-1 text-sm ${s.publicSummary ? 'text-app-text' : 'italic text-app-subtle'} ${s.status === 'active' ? 'font-bold' : ''}`}>
                                        {s.publicSummary || t('modules:session.campaign_details.status.no_summary')}
                                    </p>
                                    <div className="mt-2 flex justify-end gap-3">
                                        <button
                                            onClick={(e) => copierPourLOracle(s, e.currentTarget)}
                                            className="text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:text-accent"
                                            title={t('modules:session.campaign_details.actions.oracle_copy')}
                                        >
                                            {t('modules:session.campaign_details.actions.oracle_copy')}
                                        </button>
                                        <button
                                            onClick={() => useModalStore.getState().showCustom('session-summary', { sessionId: s.id })}
                                            className="text-ui-10 font-black uppercase tracking-widest text-accent underline-offset-2 hover:underline"
                                        >
                                            {t('modules:session.campaign_details.actions.edit_summary')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {seances.length === 0 && <p className="py-3 text-center text-xs italic text-app-subtle">{t('modules:session.campaign_details.agencement.aucune_seance')}</p>}
                        </div>
                    </Panneau>
                </div>

                <div className="flex flex-col gap-4">
                    {/*
                      **La galerie en mosaïque, et l'aperçu de celui qu'on survole**
                      — nom, camp, « Fiche » —, sans quitter l'écran.
                    */}
                    <Panneau>
                        {titreDeBloc(<Users size={16} />, t('modules:session.campaign_details.sections.npcs', { count: campaignNPCs.length }),
                            <button onClick={() => setCurrentView('npc-gallery')} className="text-ui-10 font-black uppercase tracking-widest text-accent hover:underline">
                                {t('modules:session.campaign_details.actions.open_npcs')}
                            </button>)}
                        <div className="grid grid-cols-6 gap-1.5 px-4">
                            {campaignNPCs.map(npc => (
                                <button
                                    key={npc.id}
                                    onMouseEnter={() => setSurvole(npc.id)}
                                    onFocus={() => setSurvole(npc.id)}
                                    onClick={() => navigateToNpcDetail(npc.id)}
                                    className={`aspect-square overflow-hidden rounded-md border bg-app-surface-2 transition-all ${pnjSurvole?.id === npc.id ? 'border-accent' : 'border-app-border hover:border-accent/50'}`}
                                    title={npc.name}
                                >
                                    {npc.avatar
                                        ? <ResolvedAsset src={npc.avatar} className="h-full w-full object-cover" alt={npc.name} />
                                        : <span className="flex h-full w-full items-center justify-center text-app-subtle"><Users size={16} /></span>}
                                </button>
                            ))}
                        </div>
                        {pnjSurvole ? (
                            <div className="m-4 flex items-center gap-3 rounded-lg border border-app-border bg-app-bg/40 px-3 py-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate font-display text-base font-bold text-accent">{pnjSurvole.name}</span>
                                        <Etiquette ton={TON_DU_CAMP[pnjSurvole.role] ?? 'neutre'}>{t(`modules:session.npc_gallery.roles.${pnjSurvole.role}`, { defaultValue: pnjSurvole.role })}</Etiquette>
                                    </div>
                                    {pnjSurvole.description && <p className="truncate text-xs text-app-muted">{pnjSurvole.description}</p>}
                                </div>
                                <button onClick={() => navigateToNpcDetail(pnjSurvole.id)} className="shrink-0 rounded-md border border-accent/40 px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/10">
                                    {t('modules:session.npc_gallery.details_btn')}
                                </button>
                            </div>
                        ) : (
                            <p className="px-4 py-4 text-xs italic text-app-subtle">{t('modules:session.campaign_details.agencement.aucun_pnj')}</p>
                        )}
                    </Panneau>

                    <Panneau>
                        {titreDeBloc(<MapPin size={16} />, t('modules:session.campaign_details.agencement.lieux_actifs', { count: activeLocations.length }))}
                        <div className="flex flex-col gap-1.5 px-4 pb-4">
                            {activeLocations.map(loc => (
                                <button
                                    key={loc.id}
                                    className="group flex items-center gap-3 rounded-lg border border-app-border bg-app-bg/40 p-2 text-left transition-all hover:border-accent/50"
                                    onClick={() => {
                                        setSelectedAtlasMap(loc.id);
                                        setCurrentView('world-atlas');
                                    }}
                                >
                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-app-surface-2">
                                        <ResolvedAsset src={loc.fileUrl} isVideo={loc.isVideo} className="h-full w-full object-cover" alt="" />
                                    </div>
                                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-app-text group-hover:text-accent">{loc.name}</span>
                                    <ChevronRight size={14} className="shrink-0 text-app-subtle" />
                                </button>
                            ))}
                            {activeLocations.length === 0 && (
                                <p className="py-3 text-center text-xs italic text-app-subtle">{t('modules:session.campaign_details.status.no_locations')}</p>
                            )}
                        </div>
                    </Panneau>
                </div>
            </div>

            {/* Les outils de la campagne : le carnet de l'Oracle, les chroniques, la trame, l'archive */}
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 lg:grid-cols-3">
                <Panneau className="p-4">
                    <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                        <Sparkles size={16} className="text-accent" />{t('modules:session.campaign_details.sections.ai_oracle')}
                    </p>
                    <p className="mt-2 text-ui-10 leading-relaxed text-app-muted">{t('modules:session.campaign_details.descriptions.ai_oracle')}</p>
                    <input
                        type="text"
                        defaultValue={campaign.notebookUrl || ''}
                        placeholder="https://notebooklm.google.com/..."
                        onBlur={(e) => useSessionOSStore.getState().updateCampaign(campaign.id, { notebookUrl: e.target.value })}
                        className="mt-3 w-full rounded-lg border border-app-border bg-app-bg/40 px-3 py-2 text-xs text-app-text outline-none transition-all focus:border-accent"
                        title={t('modules:session.campaign_details.sections.ai_oracle')}
                    />
                    {campaign.notebookUrl && (
                        <p className="mt-2 flex items-center gap-1 font-mono text-ui-9 text-etat-succes">
                            <span className="h-1 w-1 rounded-full bg-etat-succes" />{t('modules:session.campaign_details.status.oracle_ready')}
                        </p>
                    )}
                </Panneau>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setCurrentView('timeline-wiki')}
                        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface p-4 text-center transition-all hover:border-accent/50"
                    >
                        <span className="font-display text-sm font-bold uppercase tracking-wider text-app-text">{t('modules:session.campaign_details.actions.open_wiki')}</span>
                        <span className="text-ui-10 text-app-muted">{t('modules:session.campaign_details.descriptions.open_wiki')}</span>
                    </button>
                    {/*
                        La trame vit à côté de la chronique, et pas dedans : le
                        wiki décrit un MONDE, la trame décrit une HISTOIRE. C'est
                        le manque relevé le 2026-08-08 — l'application modélisait
                        l'un sans jamais l'autre.
                    */}
                    <button
                        onClick={() => setCurrentView('trame')}
                        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface p-4 text-center transition-all hover:border-accent/50"
                    >
                        <span className="font-display text-sm font-bold uppercase tracking-wider text-app-text">Trame narrative</span>
                        <span className="text-ui-10 text-app-muted">Actes et scènes</span>
                    </button>
                </div>

                <Panneau className="p-4">
                    <div className="flex items-center gap-2">
                        <Package size={16} className="text-etat-alerte" />
                        <p className="font-display text-sm font-bold uppercase tracking-wider text-app-text">Nexus-OS</p>
                        {!isNexusAvailable && (
                            <span className="ml-auto rounded border border-app-border px-2 py-0.5 font-mono text-ui-9 uppercase text-app-subtle">
                                {t('modules:session.campaign_details.status.no_electron')}
                            </span>
                        )}
                    </div>
                    <p className="mt-2 text-ui-10 text-app-muted">{t('modules:session.campaign_details.descriptions.nexus')}</p>
                    <label className="mt-2 flex cursor-pointer select-none items-center gap-2 text-ui-11 text-app-muted transition-colors hover:text-app-text">
                        <input
                            type="checkbox"
                            checked={!emporterLesMedias}
                            onChange={(e) => setEmporterLesMedias(!e.target.checked)}
                            className="accent-etat-alerte"
                        />
                        <span>{t('modules:session.campaign_details.actions.nexus_light')}</span>
                    </label>
                    <div className="mt-3 flex gap-2">
                        <button
                            id="nexus-export-btn"
                            onClick={handleExport}
                            disabled={!isNexusAvailable || !!nexusProgress}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-etat-alerte/40 px-3 py-2 text-xs font-bold text-etat-alerte transition-all hover:bg-etat-alerte/10 disabled:cursor-not-allowed disabled:opacity-30"
                            title={!isNexusAvailable ? t('modules:session.campaign_details.tooltips.no_electron') : t('modules:session.campaign_details.actions.nexus_export')}
                        >
                            <DownloadCloud size={14} />{t('modules:session.campaign_details.actions.nexus_export')}
                        </button>
                        <button
                            id="nexus-import-btn"
                            onClick={handleImport}
                            disabled={!isNexusAvailable || !!nexusProgress}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-app-border px-3 py-2 text-xs font-bold text-app-text transition-all hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-30"
                            title={!isNexusAvailable ? t('modules:session.campaign_details.tooltips.no_electron') : t('modules:session.campaign_details.actions.nexus_import')}
                        >
                            <Upload size={14} />{t('modules:session.campaign_details.actions.nexus_import')}
                        </button>
                    </div>
                    <p className="mt-2 text-ui-9 leading-relaxed text-app-subtle">{t('modules:session.campaign_details.descriptions.nexus_detailed')}</p>
                </Panneau>
            </div>
        </div>
        {/* Nexus HUD v2 — overlay glassmorphism plein écran */}
        <NexusHUD
            progress={nexusProgress}
            onResolveInteraction={(choice) => nexusService.resolveInteraction(choice)}
        />
        {/* Nexus Conflict Resolver — modal décision utilisateur */}
        {conflictState && (
            <NexusConflictResolver
                conflicts={conflictState}
                onResolve={handleConflictResolve}
            />
        )}
        </>
    );
};

export default CampaignDetails;
