import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icone } from '../../../components/socle';
import { useTranslation } from 'react-i18next';
import { 
    Sparkles, X, ExternalLink, RefreshCw, Send, MessageSquare, 
    Book, Bot, User, Trash2, BookOpen, PenTool, Music, Beaker, Map,
    ChevronDown, type LucideIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotebookLM } from '../hooks/useNotebookLM';
import { useGemStore } from '../../../stores/useGemStore';
import { useSessionOSStore } from '../useSessionOSStore';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { useRegimeDInterface } from '../hooks/useRegimeDInterface';
import HorsDePortee from './HorsDePortee';
import { gmConfirm } from '../../../stores/useModalStore';
import TexteMarkdown from '../../../components/TexteMarkdown';

interface OraclePanelProps {
    isOpen: boolean;
    onClose: () => void;
    campaignNotebookUrl?: string;
    templateNotebookUrl?: string;
    driverNotebookUrl?: string;
}

const OraclePanel: React.FC<OraclePanelProps> = ({ isOpen, onClose, campaignNotebookUrl, templateNotebookUrl, driverNotebookUrl }) => {
    /**
     * **Axe N — ce qui est à portée de main.** L'Oracle est le quatrième des
     * cinq modules dédoublés. « Vider la discussion » efface le fil entier
     * **sans confirmation**, à côté des boutons de vue qu'on touche en séance.
     */
    const regime = useRegimeDInterface();
    const { t } = useTranslation(['settings', 'modules']);
    const { messages, isQuerying, queryNotebook, extractNotebookId, clearChat } = useNotebookLM();
    const { activeGemId, gems, setActiveGemId, syncGemsWithDefaults } = useGemStore();
    const activeDriver = useSessionOSStore(state => state.getActiveDriver());
    
    // Resolve active GEM
    const activeGem = useMemo(() => gems.find(g => g.id === activeGemId), [gems, activeGemId]);
    
    // Icon map for all 6 Gems + default
    const iconMap: Record<string, LucideIcon> = {
        BookOpen,
        PenTool,
        Sparkles,
        Music,
        Beaker,
        Map,
        User,
        Bot
    };

    const GemIcon = activeGem ? (iconMap[activeGem.icon] || Sparkles) : Sparkles;
    const [viewMode, setViewMode] = useState<'chat' | 'iframe'>('chat');
    const [input, setInput] = useState('');
    const [isGemMenuOpen, setIsGemMenuOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const gemMenuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (gemMenuRef.current && !gemMenuRef.current.contains(event.target as Node)) {
                setIsGemMenuOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /*
      **Son Échap était à lui seul, il entre dans la pile** (2026-09-13).

      Il écoutait déjà, mais sans rien savoir de ce qui pouvait s'ouvrir
      par-dessus — et surtout sans **prendre la main sur le clavier** : une
      lettre frappée dans l'Oracle hors du champ de saisie lançait la pastille
      de Sound-OS liée à cette touche.
    */
    useFermetureParEchap(isOpen, onClose, 'Oracle');

    // Sync gems with defaults when panel opens
    useEffect(() => {
        if (isOpen) {
            syncGemsWithDefaults?.();
        }
    }, [isOpen, syncGemsWithDefaults]);

    // Initial state based on props - but we'll use a local state that follows props
    const [userSelectedType, setUserSelectedType] = useState<'campaign' | 'driver' | 'template' | null>(null);

    // Derived state for the actual active type (Priority: Campaign > Driver > Template)
    const selectedUrlType = useMemo(() => {
        if (userSelectedType === 'campaign' && campaignNotebookUrl) return 'campaign';
        if (userSelectedType === 'driver' && driverNotebookUrl) return 'driver';
        if (userSelectedType === 'template' && templateNotebookUrl) return 'template';
        
        if (campaignNotebookUrl) return 'campaign';
        if (driverNotebookUrl) return 'driver';
        return 'template';
    }, [userSelectedType, campaignNotebookUrl, driverNotebookUrl, templateNotebookUrl]);

    const activeNotebookUrl = useMemo(() => {
        if (selectedUrlType === 'campaign') return campaignNotebookUrl;
        if (selectedUrlType === 'driver') return driverNotebookUrl;
        return templateNotebookUrl;
    }, [selectedUrlType, campaignNotebookUrl, driverNotebookUrl, templateNotebookUrl]);
    
    // Memoize notebook ID to avoid recalculating unnecessarily
    const notebookId = useMemo(() => activeNotebookUrl ? extractNotebookId(activeNotebookUrl) : null, [activeNotebookUrl, extractNotebookId]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [key, setKey] = useState(0);

    // Reset load error when key or URL changes - Handled via manual triggers to avoid cascading renders
    const handleSetViewMode = (mode: 'chat' | 'iframe') => {
        if (mode === 'iframe') setLoadError(false);
        setViewMode(mode);
    };

    const availableSources = [
        { type: 'campaign', url: campaignNotebookUrl },
        { type: 'driver', url: driverNotebookUrl },
        { type: 'template', url: templateNotebookUrl }
    ].filter(s => !!s.url);

    const hasMultipleSources = availableSources.length > 1;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isQuerying]);

    // NotebookLM often blocks iframes via X-Frame-Options: DENY
    const isGoogleDomain = activeNotebookUrl?.includes('google.com');

    // Handle iframe timeout with a separate effect
    useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => {
                setLoadError(true);
                setIsLoading(false);
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!isOpen) return null;

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !notebookId || isQuerying) return;

        const query = input.trim();
        setInput('');
        
        try {
            await queryNotebook(notebookId, query);
        } catch (err) {
            console.error("Oracle Query Failed", err);
        }
    };

    const handleReload = () => {
        setKey(prev => prev + 1);
        setIsLoading(true);
        setLoadError(false);
    };

    const handleOpenExternal = () => {
        if (activeNotebookUrl) {
            /* ⛔ Cet appel visait `appBridge.openExternal`, declare a la racine du
               contrat mais expose sous `web` : la garde etait toujours fausse et
               le lien partait dans le repli navigateur. (2026-09-09) */
            if (window.appBridge?.web?.openExternal) {
                window.appBridge.web.openExternal(activeNotebookUrl);
            } else {
                window.open(activeNotebookUrl, '_blank');
            }
        }
    };

    const nomDuPersona = activeGem ? t(activeGem.name) : 'Oracle';
    const LIBELLE_DE_SOURCE: Record<string, string> = { campaign: 'Campagne', driver: 'Système', template: 'Modèle' };
    /*
      **Une réponse longue, lisible à un mètre** — refonte, L5, étape 2. Le
      texte de NotebookLM arrive en Markdown : on le rend en paragraphes
      aérés, le gras ressort, et une liste d'étapes se pose dans un encadré.
      Il s'affichait brut, astérisques compris.
    */
    const rendus: React.ComponentProps<typeof TexteMarkdown>['components'] = {
        p: ({ node: _node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
        strong: ({ node: _node, ...props }) => <strong className="font-bold text-app-text" {...props} />,
        ul: ({ node: _node, ...props }) => <ul className="my-3 list-disc space-y-1.5 rounded-lg border-l-2 border-accent bg-accent/5 py-3 pl-8 pr-4" {...props} />,
        ol: ({ node: _node, ...props }) => <ol className="my-3 list-decimal space-y-1.5 rounded-lg border-l-2 border-accent bg-accent/5 py-3 pl-8 pr-4" {...props} />,
        h1: ({ node: _node, ...props }) => <h3 className="mb-2 mt-4 font-display text-lg font-bold text-accent" {...props} />,
        h2: ({ node: _node, ...props }) => <h3 className="mb-2 mt-4 font-display text-base font-bold text-accent" {...props} />,
        h3: ({ node: _node, ...props }) => <h4 className="mb-2 mt-3 text-sm font-black uppercase tracking-widest text-accent" {...props} />,
    };
    const tailleDeLecture = regime.aLaTable ? 'text-lg' : 'text-base';

    const boutonDEnTete = 'flex items-center gap-2 rounded-lg border border-app-border px-3 py-2 text-ui-10 font-black uppercase tracking-widest transition-all';

    return (
        <>
            {/* Le fond : un clic dehors ferme, comme Échap. */}
            <div
                className="fixed inset-0 bg-app-bg/60 backdrop-blur-sm z-[95] animate-in fade-in duration-300 cursor-pointer"
                onClick={onClose}
            />

            {/*
              **Une fenêtre large par-dessus le tableau de bord** — maquette
              retenue le 2026-09-27. Le tiroir de 650 px tassait les réponses
              longues en une colonne qu'on lisait mal à la table.
            */}
            <aside
                role="dialog"
                aria-label="Oracle"
                className="fixed inset-3 md:inset-x-[6%] md:inset-y-[4%] z-[100] flex flex-col overflow-hidden rounded-xl border border-accent/40 bg-app-surface shadow-2xl animate-in fade-in zoom-in-95 duration-300"
            >
                <header className="flex flex-wrap items-center gap-2 border-b border-app-border bg-app-bg/60 px-4 py-3 shrink-0">
                    {/* Le persona, et sa liste */}
                    <div className="relative min-w-[14rem] max-w-[20rem] flex-1">
                        <button
                            onClick={() => setIsGemMenuOpen(!isGemMenuOpen)}
                            className={`flex w-full items-center gap-3 rounded-lg border p-1.5 pr-3 transition-all ${
                                isGemMenuOpen ? 'border-accent/50 bg-accent/10' : 'border-app-border bg-app-surface hover:border-accent/40'
                            }`}
                        >
                            <span className={`shrink-0 rounded-md border p-2 ${isQuerying ? 'border-accent bg-accent/20 animate-pulse' : 'border-app-border bg-app-bg'}`}>
                                <Icone nom="oracle" taille={18} className="text-accent" repli={<GemIcon size={18} className="text-accent" />} />
                            </span>
                            <span className="min-w-0 flex-1 text-left">
                                <span className="block text-ui-9 font-black uppercase tracking-[0.15em] text-app-muted">Persona</span>
                                <span className="flex items-center gap-1.5">
                                    <span className="truncate text-sm font-black text-app-text">{nomDuPersona}</span>
                                    <ChevronDown size={12} className={`shrink-0 text-app-muted transition-transform duration-300 ${isGemMenuOpen ? 'rotate-180' : ''}`} />
                                </span>
                            </span>
                        </button>

                        {isGemMenuOpen && (
                            <div
                                ref={gemMenuRef}
                                className="absolute left-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-xl border border-accent/30 bg-app-surface shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                            >
                                <div className="flex items-center justify-between border-b border-app-border bg-accent/5 p-3">
                                    <span className="text-ui-10 font-black uppercase tracking-widest text-accent">Changer de persona</span>
                                    <Sparkles size={12} className="text-accent/60" />
                                </div>
                                <div className="grid max-h-[400px] grid-cols-1 gap-1 overflow-y-auto p-2 custom-scrollbar">
                                    {gems.map((gem) => {
                                        const Icon = iconMap[gem.icon] || Sparkles;
                                        const isActive = gem.id === activeGemId;
                                        const hasDriverOverride = !!activeDriver?.aiPersonas?.[gem.id];

                                        return (
                                            <button
                                                key={gem.id}
                                                onClick={() => {
                                                    setActiveGemId(gem.id);
                                                    setIsGemMenuOpen(false);
                                                }}
                                                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                                                    isActive
                                                        ? 'border-accent bg-accent text-app-on-accent'
                                                        : 'border-transparent text-app-muted hover:border-accent/20 hover:bg-accent/10 hover:text-app-text'
                                                }`}
                                            >
                                                <span className={`rounded-md p-1.5 ${isActive ? 'bg-app-bg/20' : 'border border-app-border bg-app-bg'}`}>
                                                    <Icon size={16} className={isActive ? 'text-app-on-accent' : 'text-accent'} />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center gap-2 text-xs font-black uppercase tracking-tight">
                                                        {t(gem.name)}
                                                        {hasDriverOverride && (
                                                            <span
                                                                className={`rounded border px-1.5 py-0.5 text-ui-8 font-black ${isActive ? 'border-app-on-accent/30' : 'border-accent/30 text-accent'}`}
                                                                title={t('modules:session.oracle.synced_with_system', 'Synchronisé avec le système')}
                                                            >
                                                                {t('modules:session.oracle.synced_short', 'Système')}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className={`mt-0.5 line-clamp-2 block text-ui-10 leading-tight ${isActive ? 'opacity-80' : 'text-app-muted'}`}>
                                                        {t(gem.description)}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* La source : Campagne / Système, en mots */}
                    {hasMultipleSources && (
                        <div className="flex rounded-lg border border-app-border bg-app-bg/40 p-1">
                            {availableSources.map(source => (
                                <button
                                    key={source.type}
                                    onClick={() => setUserSelectedType(source.type as 'campaign' | 'driver' | 'template')}
                                    className={`rounded-md px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                        selectedUrlType === source.type ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:text-app-text'
                                    }`}
                                >
                                    {LIBELLE_DE_SOURCE[source.type]}
                                </button>
                            ))}
                        </div>
                    )}

                    {/*
                      **Deux modes, et c'est voulu** — décidé par David le
                      2026-09-29. Google interdit d'intégrer NotebookLM dans une
                      page : la source ne peut pas vivre à côté de la discussion.
                    */}
                    <div className="flex rounded-lg border border-app-border bg-app-bg/40 p-1">
                        {([['chat', MessageSquare, 'Discussion'], ['iframe', Book, 'Voir la source']] as const).map(([mode, Icone, libelle]) => (
                            <button
                                key={mode}
                                onClick={() => handleSetViewMode(mode)}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                    viewMode === mode ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:text-app-text'
                                }`}
                            >
                                <Icone size={13} />{libelle}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        {viewMode === 'iframe' && (
                            <button onClick={handleReload} className={`${boutonDEnTete} text-app-muted hover:text-accent`}>
                                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />Actualiser la source
                            </button>
                        )}
                        {viewMode === 'chat' && (
                            /* **Axe N** — vider efface le fil entier ; hors de portée à la table. */
                            <HorsDePortee regime={regime} libelle="Vider la discussion" compact icone={<Trash2 size={13} />}>
                                <button
                                    onClick={() => gmConfirm(
                                        'Vider toute la discussion avec l’Oracle ? Les questions et les réponses partent, et cela ne s’annule pas.',
                                        clearChat,
                                    )}
                                    disabled={messages.length === 0}
                                    className={`${boutonDEnTete} text-app-muted hover:border-etat-danger/50 hover:text-etat-danger disabled:opacity-30`}
                                >
                                    <Trash2 size={13} />Vider la discussion
                                </button>
                            </HorsDePortee>
                        )}
                        <button
                            onClick={handleOpenExternal}
                            disabled={!activeNotebookUrl}
                            className={`${boutonDEnTete} text-accent hover:border-accent/50 hover:bg-accent/10 disabled:opacity-30`}
                        >
                            <ExternalLink size={13} />Ouvrir NotebookLM dans le navigateur
                        </button>
                        <button
                            onClick={onClose}
                            className={`${boutonDEnTete} border-etat-danger/40 text-etat-danger hover:bg-etat-danger hover:text-app-bg`}
                            title="Fermer l'Oracle"
                        >
                            <X size={13} />Échap
                        </button>
                    </div>
                </header>

                {/* Le contenu */}
                <div className="relative flex flex-1 flex-col overflow-hidden bg-app-bg">
                    {!activeNotebookUrl ? (
                        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-app-surface">
                                <Sparkles size={32} className="text-app-subtle" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-app-text">Aucun carnet lié</h3>
                            <p className="max-w-sm text-sm leading-relaxed text-app-muted">
                                Pour utiliser l'Oracle, ajoutez l'adresse d'un carnet NotebookLM dans les paramètres de votre campagne ou le modèle du système.
                            </p>
                        </div>
                    ) : viewMode === 'chat' ? (
                        <>
                            <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
                                <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 text-center">
                                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-accent/20 bg-accent/5">
                                                <Icone nom="oracle" taille={40} className="text-accent" repli={<GemIcon size={40} className="text-accent" />} />
                                            </div>
                                            <h4 className="mb-2 text-lg font-bold text-app-text">Consultation : {nomDuPersona}</h4>
                                            <p className="max-w-sm text-sm text-app-muted">{activeGem ? t(activeGem.description) : "Posez vos questions sur les règles ou l'univers."}</p>
                                        </div>
                                    ) : (
                                        <AnimatePresence initial={false}>
                                            {messages.map((msg, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                                    className={msg.role === 'assistant' ? 'flex flex-col gap-2' : 'flex flex-col items-end gap-1.5'}
                                                >
                                                    {msg.role === 'assistant' ? (
                                                        <>
                                                            <span className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-widest text-accent">
                                                                <GemIcon size={14} />{nomDuPersona}
                                                            </span>
                                                            <div className={`rounded-xl border border-app-border bg-app-surface px-5 py-4 leading-relaxed text-app-text ${tailleDeLecture}`}>
                                                                <TexteMarkdown components={rendus}>{msg.content}</TexteMarkdown>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-ui-10 font-black uppercase tracking-widest text-app-muted">Le meneur</span>
                                                            <div className={`max-w-[80%] whitespace-pre-wrap rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 font-bold text-app-text ${tailleDeLecture}`}>
                                                                {msg.content}
                                                            </div>
                                                        </>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                    {isQuerying && (
                                        <div className="flex animate-pulse flex-col gap-2">
                                            <span className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-widest text-accent">
                                                <RefreshCw size={14} className="animate-spin" />{nomDuPersona} consulte le carnet…
                                            </span>
                                            <div className="space-y-2 rounded-xl border border-app-border bg-app-surface px-5 py-4">
                                                <div className="h-4 w-full rounded bg-accent/10" />
                                                <div className="h-4 w-2/3 rounded bg-accent/10" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* La saisie, en pied */}
                            <div className="border-t border-app-border bg-app-surface/60 shrink-0">
                                <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl items-end gap-3 p-4">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder={`Posez une question à ${nomDuPersona}…`}
                                        rows={2}
                                        className="min-w-0 flex-1 resize-none rounded-lg border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none transition-all placeholder:text-app-subtle focus:border-accent custom-scrollbar"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isQuerying}
                                        className="flex shrink-0 items-center gap-2 rounded-lg bg-accent px-5 py-3 text-ui-10 font-black uppercase tracking-widest text-app-on-accent transition-all hover:brightness-110 disabled:opacity-30"
                                    >
                                        Envoyer<Send size={14} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="relative flex-1">
                            {isLoading && !loadError && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-app-bg">
                                    <RefreshCw className="mb-4 animate-spin text-accent" size={32} />
                                    <p className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-muted">Chargement de la source…</p>
                                </div>
                            )}

                            {(loadError || isGoogleDomain) && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-app-bg p-12 text-center">
                                    <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-etat-alerte/30 bg-etat-alerte/10">
                                        <ExternalLink size={36} className="text-etat-alerte" />
                                    </div>
                                    <h3 className="mb-4 text-xl font-bold text-app-text">La source s'ouvre à part</h3>
                                    <p className="mb-8 max-w-sm text-sm leading-relaxed text-app-text">
                                        Google interdit d'intégrer NotebookLM dans une page. La source se consulte dans le navigateur.
                                    </p>
                                    <button
                                        onClick={handleOpenExternal}
                                        className="flex items-center gap-3 rounded-lg bg-accent px-8 py-3 text-sm font-bold text-app-on-accent transition-all hover:brightness-110"
                                    >
                                        Ouvrir NotebookLM dans le navigateur <ExternalLink size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('chat')}
                                        className="mt-6 flex items-center gap-2 text-ui-10 font-black uppercase tracking-widest text-accent hover:underline"
                                    >
                                        Revenir à la discussion <MessageSquare size={11} />
                                    </button>
                                </div>
                            )}

                            <iframe
                                key={`${key}-${activeNotebookUrl}`}
                                src={isGoogleDomain ? 'about:blank' : activeNotebookUrl}
                                className={`h-full w-full border-none transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={() => setIsLoading(false)}
                                title="NotebookLM Oracle"
                                allow="clipboard-read; clipboard-write; microphone"
                            />
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default OraclePanel;
