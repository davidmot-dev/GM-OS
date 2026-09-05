import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { DEFAULT_SHEET_TEMPLATES, type SheetTemplate } from '../../../data/defaultSheetTemplates';
import { corpusOrphelins } from '../../../../electron/corpusSysteme';
import LienAuCorpus from '../../forge/corpus/LienAuCorpus';
import { tousLesPilotes } from '../store/tousLesPilotes';
import { Search, Hammer, Trash2, Copy, FileText, Sparkles, CheckCircle2, ChevronRight, Pencil, DownloadCloud, Upload, Eye, FolderTree, Swords } from 'lucide-react';
import { gmToast } from '../../../stores/useToastStore';
import { useModalStore, gmCustom } from '../../../stores/useModalStore';
import type { GameDriver } from '../../../types/drivers';
import { nexusService } from '../../system/archive/NexusService';
import type { NexusProgress, NexusConflict, NexusConflictResolution } from '../../system/archive/nexus.types';
import { NexusHUD } from '../../system/archive/NexusHUD';
import { NexusConflictResolver } from '../../system/archive/NexusConflictResolver';

const TemplateDashboard: React.FC = () => {
    const { t } = useTranslation(['common', 'modules']);
    const { 
        customSheetTemplates, 
        deleteSheetTemplate, 
        setCurrentView, 
        addSheetTemplate,
        customGameDrivers,
        deleteGameDriver,
        saveGameDriver,
        setEditingTemplateId,
        setEditingDriverId,
        templateDashboardTab,
        setTemplateDashboardTab,
        activeCampaignId,
        campaigns
    } = useSessionOSStore();

    // La Forge est un module, plus une vue de Session OS.
    const setActiveModule = useSessionStore(s => s.setActiveModule);
    const ouvrirLaForge = () => setActiveModule('forge');

    /**
     * Les corpus posés sur le disque que personne ne réclame.
     *
     * **Le défaut, vu de ce côté-ci.** Alien a un corpus complet — fiches,
     * index, huit personas — et aucun pilote. Il n'apparaît donc dans aucun
     * sélecteur de système : le travail est là, et l'application se comporte
     * comme s'il n'existait pas. Rien ne le signalait, parce qu'on ne remarque
     * pas l'absence de ce qu'on n'a jamais listé.
     *
     * C'est le pendant exact du pilote sans corpus que la Forge fabriquait, et
     * les deux se corrigent au même endroit : ici, on montre l'orphelin et on
     * propose de lui donner un pilote.
     */
    const [dossiersSystemes, setDossiersSystemes] = React.useState<string[]>([]);
    React.useEffect(() => {
        window.appBridge?.ai?.listSystems?.().then(setDossiersSystemes).catch(() => setDossiersSystemes([]));
    }, []);

    const orphelins = React.useMemo(
        () => corpusOrphelins(
            dossiersSystemes,
            tousLesPilotes(customGameDrivers).map(d => ({
                systemId: d.id,
                systemName: d.name,
                corpusId: d.corpusId,
                ragPath: d.ragPath,
            })),
        ),
        [dossiersSystemes, customGameDrivers],
    );

    /**
     * Donne un pilote à un corpus orphelin.
     *
     * Le pilote est **minimal et honnête** : il déclare `corpusId`, ce qui suffit
     * à faire apparaître le système partout et à ce que lecture et écriture
     * tombent au bon endroit. Il ne prétend pas connaître les règles du jeu —
     * dés, combat, instructions restent à la charge de la Forge ou de l'éditeur.
     * Inventer des valeurs plausibles ici serait pire que de les laisser vides :
     * elles s'appliqueraient en séance sans que personne ne les ait choisies.
     */
    const adopterLeCorpus = (dossier: string) => {
        const nom = dossier.replace(/[-_]+/g, ' ').replace(/\b\p{Ll}/gu, c => c.toUpperCase());
        saveGameDriver({
            // Identifiant dérivé du dossier, non horodaté : adopter deux fois le
            // même corpus met à jour le pilote au lieu d'en créer un jumeau.
            // C'est aussi ce qui rend le geste rejouable sans conséquence.
            id: `corpus-${dossier}`,
            name: nom,
            author: 'User',
            version: '1.0.0',
            description: t('modules:session.template_dashboard.orphans.driver_description', { dossier }),
            emoji: '📚',
            templateId: DEFAULT_SHEET_TEMPLATES[0]?.id ?? '',
            corpusId: dossier,
            dice: { engine: 'standard', defaultDice: '1d20', logic: 'sum', successThreshold: 6 },
            combat: { statsToTrack: [], initiativeFormula: 'dex', initiativeSort: 'desc', defaultHealthType: 'hp' },
            aiInstructions: '',
        });
        gmToast(t('modules:session.template_dashboard.orphans.adopted', { nom }));
    };

    const { showConfirm } = useModalStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [montrerReferences, setMontrerReferences] = useState(false);

    const activeTab = templateDashboardTab;
    const setActiveTab = setTemplateDashboardTab;

    // ── Nexus-OS State ──────────────────────────────────────────────
    const [nexusProgress, setNexusProgress] = useState<NexusProgress | null>(null);
    const isNexusAvailable = typeof window !== 'undefined' && !!window.appBridge?.nexus;
    const [conflictState, setConflictState] = useState<NexusConflict[] | null>(null);
    const resolverRef = useRef<((resolution: NexusConflictResolution) => void) | null>(null);

    const handleExportDriver = async (driverId: string) => {
        if (!driverId) return;
        nexusService.onProgress(setNexusProgress);
        setNexusProgress({ phase: 'scraping', progress: 0, message: t('modules:session.campaign_details.toasts.nexus_export_start') });
        await nexusService.exportDriverBundle(driverId);
        setTimeout(() => setNexusProgress(null), 3000);
    };

    const handleImportDriver = async () => {
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
    
    // Auto-select active driver when entering drivers tab
    React.useEffect(() => {
        if (activeTab === 'drivers' && !selectedId) {
            const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
            if (activeCampaign?.system) {
                const driver = customGameDrivers.find(d => d.id === activeCampaign.system);
                if (driver) {
                    setSelectedId(driver.id);
                } else if (customGameDrivers.length > 0) {
                    setSelectedId(customGameDrivers[0].id);
                }
            } else if (customGameDrivers.length > 0) {
                setSelectedId(customGameDrivers[0].id);
            }
        } else if (activeTab === 'sheets' && !selectedId) {
            const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
            if (allTemplates.length > 0) {
                setSelectedId(allTemplates[0].id);
            }
        }
    }, [activeTab, activeCampaignId, customGameDrivers, selectedId]);
    // ────────────────────────────────────────────────────────────────

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    
    /**
     * **Les fiches de référence sont masquées, pas supprimées.**
     *
     * David, le 2026-08-15 : *« la fiche de référence ne me sert à rien, si tu
     * ne peux pas l'effacer, explique-moi pourquoi et au pire cache-la »*.
     *
     * On ne peut pas l'effacer, et pour une raison qui vaut d'être écrite :
     * `DEFAULT_SHEET_TEMPLATES.find(t => t.id === 'dune')` est **l'étalon qui
     * calibre les contrôles du pilote** (`controlesDuPilote.test.ts`). La règle
     * qui les gouverne est que *le pilote Dune de référence ne doit produire
     * aucun constat — s'il en produisait, ce seraient les contrôles qu'il
     * faudrait corriger.* Sans étalon, plus rien n'empêche un contrôle de crier
     * à tort, ce qui est déjà arrivé sur les portées d'Alien.
     *
     * Elles sortent donc de la liste, sans disparaître du code. Et **on dit
     * qu'elles sont masquées** : cacher en silence ce qu'on ne peut pas
     * supprimer transformerait une contrainte en énigme.
     */
    const referencesMasquees = allTemplates.filter(t => t.isBuiltin).length;

    const filteredItems = activeTab === 'sheets' 
        ? allTemplates.filter(t => (montrerReferences || !t.isBuiltin)
            && t.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : customGameDrivers.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const selectedItem = activeTab === 'sheets'
        ? (allTemplates.find(t => t.id === selectedId) || allTemplates[0])
        : (customGameDrivers.find(d => d.id === selectedId) || (customGameDrivers.length > 0 ? customGameDrivers[0] : null));

    const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        showConfirm(
            t('modules:session.template_dashboard.status.delete_confirm', { 
                type: activeTab === 'sheets' ? t('modules:session.template_dashboard.status.type_template') : t('modules:session.template_dashboard.status.type_driver'),
                name 
            }),
            () => {
                if (activeTab === 'sheets') {
                    deleteSheetTemplate(id);
                } else {
                    deleteGameDriver(id);
                }
                if (selectedId === id) setSelectedId(null);
                gmToast(activeTab === 'sheets' ? t('modules:session.template_dashboard.status.template_deleted') : t('modules:session.template_dashboard.status.system_deleted'));
            },
            undefined,
            t('common:actions.delete').toUpperCase(),
            t('common:actions.cancel').toUpperCase()
        );
    };

    const handleDuplicate = (e: React.MouseEvent, template: SheetTemplate) => {
        e.stopPropagation();
        addSheetTemplate({
            name: t('modules:session.template_dashboard.status.duplicate_suffix', { name: template.name }),
            emoji: template.emoji,
            sections: JSON.parse(JSON.stringify(template.sections)),
            defaultNotebookUrl: template.defaultNotebookUrl
        });
        gmToast(t('modules:session.template_dashboard.toasts.template_duplicated'));
    };

    const selectedTemplate = selectedItem && activeTab === 'sheets' ? (selectedItem as SheetTemplate) : null;

    return (
        <>
        <div className="flex-1 flex overflow-hidden h-full bg-app-bg animate-in fade-in duration-500">
            {/* Left Column: Library */}
            <div className="flex-1 flex flex-col border-r border-app-border/40 min-w-[600px]">
                {/* Header Actions */}
                <div className="p-8 border-b border-app-border/20 bg-app-surface/20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-app-text uppercase tracking-tight flex items-center gap-3">
                                <FileText className="text-accent" size={32} />
                                {t('modules:session.template_dashboard.title')}
                            </h2>
                            <p className="text-app-text/40 text-xs font-bold uppercase tracking-[0.2em] mt-1 ml-1 text-accent/60">{t('modules:session.template_dashboard.subtitle')}</p>
                        </div>
                        <div className="flex gap-2">
                            {activeTab === 'drivers' && isNexusAvailable && (
                                <button 
                                    onClick={handleImportDriver}
                                    className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-black px-6 py-3 rounded-xl text-xs tracking-[0.15em] transition-all shadow-glow-accent/20 hover:scale-105 active:scale-95 group"
                                >
                                    <Upload size={18} className="group-hover:-translate-y-1 transition-transform" />
                                    {t('modules:session.template_dashboard.actions.import_driver')}
                                </button>
                            )}
                            <button 
                                onClick={ouvrirLaForge}
                                className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-app-bg font-black px-6 py-3 rounded-xl text-xs tracking-[0.15em] transition-all shadow-glow-accent/20 hover:scale-105 active:scale-95 group"
                            >
                                <Hammer size={18} className="group-hover:rotate-12 transition-transform" />
                                {t('modules:session.template_dashboard.actions.create_forge')}
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6">
                        <button 
                            onClick={() => { setActiveTab('sheets'); setSelectedId(allTemplates[0].id); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'sheets' ? 'bg-accent text-app-bg shadow-glow-accent/20' : 'text-app-text/40 hover:text-app-text/60'}`}
                        >
                            <FileText size={14} /> {t('modules:session.template_dashboard.tabs.sheets')}
                        </button>
                        <button 
                            onClick={() => { setActiveTab('drivers'); setSelectedId(customGameDrivers[0]?.id || null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'drivers' ? 'bg-accent text-app-bg shadow-glow-accent/20' : 'text-app-text/40 hover:text-app-text/60'}`}
                        >
                            <Sparkles size={14} /> {t('modules:session.template_dashboard.tabs.drivers')}
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text/20 group-focus-within:text-accent transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder={activeTab === 'sheets' ? t('modules:session.template_dashboard.actions.search_sheets_placeholder') : t('modules:session.template_dashboard.actions.search_drivers_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-app-surface/40 border border-app-border/40 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/20 transition-all font-medium placeholder-app-text/20"
                        />
                    </div>
                </div>

                {/* Grid of Items */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/*
                        Les corpus sans pilote, annoncés avant la liste.
                        Un corpus complet qui n'apparaît nulle part est du travail
                        perdu de vue, pas une anomalie technique : il faut le voir
                        à l'endroit où l'on gère les systèmes, et pouvoir y
                        remédier d'un geste.
                    */}
                    {activeTab === 'drivers' && orphelins.length > 0 && (
                        <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <FolderTree size={18} className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="text-sm font-black text-amber-300 uppercase tracking-tight">
                                        {t('modules:session.template_dashboard.orphans.title')}
                                    </h3>
                                    <p className="text-xs text-amber-200/50 leading-relaxed mt-1">
                                        {t('modules:session.template_dashboard.orphans.description')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {orphelins.map(dossier => (
                                    <button
                                        key={dossier}
                                        onClick={() => adopterLeCorpus(dossier)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-app-bg border border-amber-500/30 hover:border-amber-400 text-amber-200 hover:text-amber-100 transition-all text-xs font-bold"
                                    >
                                        <span className="font-mono">{dossier}</span>
                                        <span className="text-ui-10 font-black uppercase tracking-widest text-amber-400/60">
                                            {t('modules:session.template_dashboard.orphans.adopt')}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'drivers' && customGameDrivers.length === 0 && orphelins.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                            <Hammer size={64} className="animate-pulse" />
                            <p className="text-xl font-black uppercase tracking-widest">{t('modules:session.template_dashboard.status.no_drivers_found')}</p>
                            <p className="text-xs font-bold max-w-xs">{t('modules:session.template_dashboard.status.no_drivers_hint')}</p>
                        </div>
                    ) : (
                        <>
                        {/* Ce qui est masqué se dit, avec le moyen de l'ouvrir. */}
                        {activeTab === 'sheets' && referencesMasquees > 0 && (
                            <button
                                type="button"
                                onClick={() => setMontrerReferences(v => !v)}
                                className="mb-4 flex items-center gap-2 text-ui-10 font-bold uppercase tracking-widest text-app-text/30 hover:text-app-text/60 transition-colors"
                            >
                                <Eye size={12} />
                                {montrerReferences
                                    ? `Masquer les ${referencesMasquees} fiches de référence`
                                    : `${referencesMasquees} fiches de référence masquées — livrées avec l'application, elles calibrent les contrôles de la Forge`}
                            </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    className={`group relative bg-app-surface/40 backdrop-blur-xl border rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedId === item.id ? 'border-accent shadow-glow-accent/10 ring-1 ring-accent/20' : 'border-app-border/40 hover:border-app-border/80'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-14 h-14 bg-app-bg rounded-xl flex items-center justify-center text-3xl shadow-inner border border-white/5 mb-4 group-hover:scale-110 transition-transform">
                                            {item.emoji}
                                        </div>
                                        
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                            {activeTab === 'sheets' && (
                                                <button 
                                                    onClick={(e) => handleDuplicate(e, item as SheetTemplate)}
                                                    className="p-2 bg-app-surface border border-app-border rounded-lg text-app-text/40 hover:text-accent hover:border-accent/40 transition-all"
                                                    title={t('common:actions.duplicate')}
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            )}
                                            {(!('isBuiltin' in item) || !(item as SheetTemplate).isBuiltin) && (
                                                <button 
                                                    onClick={(e) => handleDelete(e, item.id, item.name)}
                                                    className="p-2 bg-app-surface border border-app-border rounded-lg text-app-text/40 hover:text-red-400 hover:border-red-400/40 transition-all"
                                                    title={t('common:actions.delete')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-app-text mb-1 uppercase tracking-tight">{item.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-ui-10 font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                                            {activeTab === 'sheets' 
                                                ? t('modules:session.template_dashboard.status.fields_count', { count: (item as SheetTemplate).sections.reduce((acc, s) => acc + s.fields.length, 0) })
                                                : t('modules:session.template_dashboard.status.driver_version', { version: (item as GameDriver).version || '1.0' })
                                            }
                                        </span>
                                        {activeTab === 'sheets' && (item as SheetTemplate).isBuiltin && (
                                            <span className="text-ui-10 font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                                {t('modules:session.template_dashboard.status.builtin')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right Column: Preview */}
            <div className="w-[450px] bg-app-surface/60 backdrop-blur-3xl p-8 overflow-y-auto custom-scrollbar border-l border-app-border/20 shadow-2xl relative">
                {selectedItem ? (
                    <>
                        <div className="sticky top-0 z-10 bg-gradient-to-b from-app-surface to-transparent pb-6 -mt-8 pt-8">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-ui-10 font-black uppercase tracking-[0.3em] text-accent opacity-60">
                                    {activeTab === 'sheets' ? t('modules:session.template_dashboard.preview.ui_preview') : t('modules:session.template_dashboard.preview.ai_engine')}
                                </span>
                                {selectedTemplate && (
                                    <button
                                        onClick={() => {
                                            setEditingTemplateId(selectedTemplate.id);
                                            setCurrentView('template-editor');
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent border border-accent/30 rounded-xl text-ui-10 font-black uppercase tracking-widest hover:bg-accent/20 transition-all shadow-lg"
                                    >
                                        <Pencil size={14} /> {selectedTemplate.isBuiltin ? t('modules:session.template_dashboard.actions.resonance_custom') : t('modules:session.template_dashboard.actions.edit_template')}
                                    </button>
                                )}
                                {activeTab === 'drivers' && selectedItem && (
                                    /*
                                      **Une grille de deux, et non une rangée.**

                                      ⛔ Défaut vu par David le 2026-09-03, capture à
                                      l'appui : ces quatre actions vivaient dans un
                                      `flex` sans repli. Le panneau de droite est étroit,
                                      et l'arrivée du bestiaire a poussé « Éditer le
                                      moteur » hors du cadre — *une action qu'on ne voit
                                      plus n'existe plus, et rien ne prévient.*

                                      La grille ne dépend d'aucune longueur d'étiquette :
                                      elle tient donc dans les deux langues, et le
                                      cinquième bouton du prochain chantier ne cassera
                                      rien non plus.
                                    */
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <button
                                            onClick={() => {
                                                setCurrentView('rulebook');
                                            }}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-xl text-ui-10 font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all shadow-lg"
                                        >
                                            <Eye size={14} className="shrink-0" />
                                            <span className="truncate">{t('modules:session.header.grimoire_label').toUpperCase()}</span>
                                        </button>
                                        {/*
                                          **La seconde porte du bestiaire — 2026-09-03.**
                                          David : « je ne trouve pas l'atelier et le
                                          bestiaire ». Ils vivaient dans Combat-OS, alors
                                          qu'on pense a ses adversaires en regardant SON
                                          JEU. Le bestiaire etant deja indexe par pilote,
                                          il suffisait d'une porte de plus — et elle
                                          designe explicitement le pilote selectionne,
                                          qui n'est pas forcement celui de la partie.
                                        */}
                                        <button
                                            onClick={() => gmCustom('atelier-adversaires', { jeuId: selectedItem.id })}
                                            title="Fabriquer des adversaires pour ce jeu, et relire son bestiaire"
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-ui-10 font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all shadow-lg"
                                        >
                                            <Swords size={14} className="shrink-0" />
                                            <span className="truncate">BESTIAIRE</span>
                                        </button>
                                        {isNexusAvailable && (
                                            <button
                                                onClick={() => handleExportDriver(selectedItem.id)}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl text-ui-10 font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all shadow-lg"
                                            >
                                                <DownloadCloud size={14} className="shrink-0" />
                                                <span className="truncate">{t('common:actions.export').toUpperCase()}</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                const driver = selectedItem as GameDriver;
                                                setEditingDriverId(driver.id);
                                                setCurrentView('driver-editor');
                                            }}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-accent/10 text-accent border border-accent/30 rounded-xl text-ui-10 font-black uppercase tracking-widest hover:bg-accent/20 transition-all shadow-lg"
                                        >
                                            <Pencil size={14} className="shrink-0" />
                                            <span className="truncate">{t('modules:session.template_dashboard.actions.edit_engine')}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-4xl drop-shadow-glow-accent">{selectedItem.emoji}</span>
                                <div>
                                    <h2 className="text-xl font-black text-app-text line-clamp-1 uppercase">{selectedItem.name}</h2>
                                    {selectedTemplate && (
                                        <p className="text-ui-10 text-app-text/40 font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10">{selectedTemplate.id}</p>
                                    )}
                                    <p className="text-ui-9 text-app-text/40 font-bold uppercase tracking-widest">
                                        {activeTab === 'sheets' ? t('modules:session.template_dashboard.preview.ui_subtitle') : t('modules:session.template_dashboard.preview.ai_subtitle')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {activeTab === 'sheets' ? (
                                (selectedItem as SheetTemplate).sections.map((section, idx) => (
                                    <div key={section.id} className="space-y-4" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent"></div>
                                            <h4 className="text-ui-10 font-black uppercase tracking-[0.2em] text-accent/80">{section.label}</h4>
                                            <div className="h-px flex-1 bg-gradient-to-l from-accent/40 to-transparent"></div>
                                        </div>
                                        <div className="space-y-3">
                                            {section.fields.map(field => (
                                                <div key={field.id} className="p-4 rounded-xl bg-app-bg/40 border border-app-border/20 group hover:border-accent/30 transition-all">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 uppercase">{field.label}</label>
                                                        <span className="text-ui-8 font-bold text-accent/40 bg-accent/5 px-1.5 py-0.5 rounded border border-accent/10">{field.type}</span>
                                                    </div>
                                                    {field.type === 'gauge' ? (
                                                        <div className="h-1.5 w-full bg-app-surface rounded-full overflow-hidden mt-2">
                                                            <div className="h-full w-2/3 bg-accent/40 shadow-glow-accent/20"></div>
                                                        </div>
                                                    ) : field.type === 'number' ? (
                                                        <div className="text-sm font-mono font-bold text-app-text/60">00</div>
                                                    ) : (
                                                        <div className="h-4 w-full bg-app-surface/50 rounded animate-pulse"></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="space-y-6">
                                    {/*
                                      **À quel corpus ce pilote est rattaché.**
                                      C'est `corpusId` qui décide des fiches que
                                      l'Oracle lit et des personas qu'il emploie,
                                      et il n'apparaissait sur aucun écran : un
                                      pilote branché sur le mauvais dossier
                                      produit exactement la même fiche que le bon.
                                    */}
                                    <LienAuCorpus pilote={selectedItem as GameDriver} />

                                    <div className="p-6 rounded-2xl bg-black/40 border border-app-border/20 space-y-4">
                                        <div className="flex items-center gap-3 text-accent border-b border-white/5 pb-3">
                                            <Sparkles size={16} />
                                            <h4 className="text-xs font-black uppercase tracking-widest">{t('modules:session.template_dashboard.preview.sections.dice_mechanics')}</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-app-surface/40 p-3 rounded-lg border border-white/5 text-center">
                                                <p className="text-ui-9 text-app-text/40 font-bold uppercase mb-1">{t('modules:session.template_dashboard.preview.labels.default_dice')}</p>
                                                <p className="text-sm font-mono font-black text-accent uppercase">{(selectedItem as GameDriver).dice?.defaultDice || '1D20'}</p>
                                            </div>
                                            <div className="bg-app-surface/40 p-3 rounded-lg border border-white/5 text-center">
                                                <p className="text-ui-9 text-app-text/40 font-bold uppercase mb-1">{t('modules:session.template_dashboard.preview.labels.logic')}</p>
                                                <p className="text-xs font-black text-emerald-400 uppercase">{(selectedItem as GameDriver).dice?.logic || 'SUM'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-4">
                                        <div className="flex items-center gap-3 text-indigo-400 border-b border-indigo-500/10 pb-3">
                                            <Hammer size={16} />
                                            <h4 className="text-xs font-black uppercase tracking-widest">{t('modules:session.template_dashboard.preview.sections.ai_protocols')}</h4>
                                        </div>
                                        <p className="text-xs text-app-text/60 italic leading-relaxed line-clamp-6">
                                            {(selectedItem as GameDriver).aiInstructions || t('modules:session.template_dashboard.preview.status.no_instructions')}
                                        </p>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-4">
                                        <div className="flex items-center gap-3 text-emerald-400 border-b border-emerald-500/10 pb-3">
                                            <CheckCircle2 size={16} />
                                            <h4 className="text-xs font-black uppercase tracking-widest">{t('modules:session.template_dashboard.preview.sections.combat_tracking')}</h4>
                                        </div>
                                        <div className="space-y-2">
                                            {(selectedItem as GameDriver).combat?.statsToTrack?.map((s, i) => (
                                                <div key={i} className="flex items-center justify-between text-ui-10 bg-black/20 p-2 rounded">
                                                    <span className="font-bold opacity-60">{s.label}</span>
                                                    <span className="font-mono text-accent uppercase font-black">{s.fieldId}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI Personas Section */}
                                    {((selectedItem as GameDriver).aiPersonas && Object.keys((selectedItem as GameDriver).aiPersonas || {}).length > 0) && (
                                        <div className="p-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-4">
                                            <div className="flex items-center gap-3 text-violet-400 border-b border-violet-500/10 pb-3">
                                                <Sparkles size={16} />
                                                <h4 className="text-xs font-black uppercase tracking-widest">{t('modules:session.rule_engine_editor.ai.personas_title')}</h4>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries((selectedItem as GameDriver).aiPersonas || {}).map(([id, text]) => (
                                                    <div key={id} className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-ui-10 font-black uppercase tracking-widest text-violet-400">{t(`modules:session.rule_engine_editor.ai.persona_type_label`, { id })}</span>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-glow-violet" />
                                                        </div>
                                                        <p className="text-ui-10 text-app-text/60 italic leading-relaxed line-clamp-3">{text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center opacity-20 italic text-center px-4">
                        {t('modules:session.template_dashboard.preview.status.empty_selection')}
                    </div>
                )}

                {/* Bottom Call to Action */}
                <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20 text-center">
                    <Sparkles className="mx-auto text-accent mb-3 animate-pulse" size={24} />
                    <h3 className="text-sm font-bold text-app-text mb-2">{t('modules:session.template_dashboard.cta.title')}</h3>
                    <p className="text-xs text-app-text/40 mb-6 leading-relaxed">
                        {t('modules:session.template_dashboard.cta.description')}
                    </p>
                    <button 
                         onClick={ouvrirLaForge}
                         className="w-full bg-app-bg border border-accent/40 hover:border-accent text-accent font-black py-4 rounded-xl text-ui-10 tracking-[0.2em] transition-all hover:bg-accent hover:text-app-bg shadow-lg shadow-accent/5 group"
                    >
                        {t('modules:session.template_dashboard.actions.open_forge')} <ChevronRight size={14} className="inline ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
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

export default TemplateDashboard;
