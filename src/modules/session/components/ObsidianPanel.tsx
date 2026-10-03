import React, { useEffect, useMemo, useRef, useState } from 'react';
import TexteMarkdown from '../../../components/TexteMarkdown';
import LoupeDeLecture from '../../../components/LoupeDeLecture';
import { useObsidianStore } from '../useObsidianStore';
import type { NoteEntry } from '../useObsidianStore';
import {
    Folder,
    FolderOpen,
    FileText,
    ChevronRight,
    ChevronDown,
    Search,
    RefreshCw,
    Share2,
    ExternalLink,
    AlertCircle,
    Info,
    Sparkles,
    ListTree,
} from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmToast } from '../../../stores/useToastStore';
import { Bouton, Etiquette, EnTeteDeModule, Panneau } from '../../../components/socle';
import { useRegimeDInterface } from '../hooks/useRegimeDInterface';
import {
    liensInternes, tableDesMatieres, trouverLaNote, compterLesNotes, nomDeLaNote, sansLeTitreRepete, PREFIXE_DE_LIEN_INTERNE,
} from '../logic/lectureDuCoffre';

/**
 * **Nexus Wiki — le coffre de campagne (Obsidian)** — refonte, L6, maquette
 * retenue (`stitch/outillage/outillage-nexus.png`) : *« l'arborescence est un
 * peu petite et le texte aussi »*. L'arborescence s'élargit et grossit, la note
 * se lit en grand, **les liens `[[…]]` mènent à leur note**, et la table des
 * matières de la note est à droite.
 *
 * **Vérifié avant d'intégrer** (le README le demandait) : Nexus **lit** le
 * coffre et ne l'écrit pas — « Nouvelle note » et « Mode édition » ne sont donc
 * pas repris ; les rétroliens (« Notes liées entrant ») n'existent pas et
 * demanderaient de relire tout le coffre — pas repris non plus.
 */
const ObsidianPanel: React.FC = () => {
    const {
        notes,
        vaultPath,
        fetchNotes,
        selectNote,
        activeNotePath,
        activeNoteContent,
        isLoading,
        error,
        syncActiveNoteToOracle
    } = useObsidianStore();
    const regime = useRegimeDInterface();

    const { campaigns, activeCampaignId } = useSessionOSStore();
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    // Try to find a notebook URL in the active campaign
    const notebookUrl = activeCampaign?.notebookUrl;

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const article = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const nombreDeNotes = useMemo(() => compterLesNotes(notes), [notes]);
    /* Le corps de la note, sans le titre qui redit son nom — la table suit le même corps. */
    const corps = useMemo(
        () => sansLeTitreRepete(activeNoteContent || '', activeNotePath ? nomDeLaNote(activeNotePath) : ''),
        [activeNoteContent, activeNotePath],
    );
    const contenu = useMemo(() => liensInternes(corps), [corps]);
    const table = useMemo(() => tableDesMatieres(corps), [corps]);

    const toggleFolder = (path: string) => {
        const newSet = new Set(expandedFolders);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        setExpandedFolders(newSet);
    };

    /** Ouvrir une note, et déplier les dossiers qui la contiennent : on voit où l'on est. */
    const ouvrir = (chemin: string) => {
        const dossiers = chemin.split(/[\\/]/).slice(0, -1);
        if (dossiers.length) {
            setExpandedFolders(prev => {
                const s = new Set(prev);
                dossiers.forEach((_, i) => s.add(dossiers.slice(0, i + 1).join('\\')));
                return s;
            });
        }
        void selectNote(chemin);
        article.current?.scrollTo({ top: 0 });
    };

    const handleSync = async () => {
        if (!notebookUrl || !activeNotePath) return;

        // Extract notebook ID from URL
        const match = notebookUrl.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
        const notebookId = match ? match[0] : null;

        if (!notebookId) {
            setSyncStatus('error');
            return;
        }

        setSyncStatus('syncing');
        const success = await syncActiveNoteToOracle(notebookId);
        setSyncStatus(success ? 'success' : 'error');

        if (success) {
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    /*
      **Ouvrir dans Obsidian par le chemin, plus par le nom du coffre.** Le lien
      visait un coffre nommé « Obsidian Vault » en dur : un coffre appelé
      autrement ne s'ouvrait pas. Obsidian accepte le chemin absolu de la note.
    */
    const ouvrirDansObsidian = () => {
        if (!activeNotePath) return;
        const absolu = `${vaultPath.replace(/[\\/]+$/, '')}\\${activeNotePath}`;
        window.appBridge?.web?.openExternal?.(`obsidian://open?path=${encodeURIComponent(absolu)}`);
    };

    /** Aller au n-ième titre de la note : la table et la page suivent le même ordre. */
    const allerAuTitre = (rang: number) => {
        const titres = article.current?.querySelectorAll('h1, h2, h3');
        titres?.[rang]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /*
      Les liens internes ouvrent leur note dans Nexus ; une note absente le dit,
      au lieu de ne rien faire. Les autres liens partent au navigateur.
    */
    const composants = useMemo(() => ({
        a: ({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'> & { href?: string }) => {
            if (!href?.startsWith(PREFIXE_DE_LIEN_INTERNE)) return <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>;
            const cible = decodeURIComponent(href.slice(PREFIXE_DE_LIEN_INTERNE.length));
            const chemin = trouverLaNote(notes, cible);
            return (
                <button
                    type="button"
                    onClick={() => chemin ? ouvrir(chemin) : gmToast(`« ${cible} » n'existe pas encore dans le coffre.`, 'warning')}
                    title={chemin ? `Ouvrir « ${cible} »` : `« ${cible} » n'existe pas encore`}
                    className={`rounded border px-1 font-mono text-[0.92em] transition-colors ${chemin
                        ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
                        : 'border-dashed border-app-border text-app-muted'}`}
                >
                    {children}
                </button>
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [notes]);

    const renderTree = (items: NoteEntry[], level = 0): React.ReactNode => {
        return items
            .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.type === 'directory' && item.children))
            .map(item => {
                const isExpanded = expandedFolders.has(item.path) || !!searchQuery;
                const isActive = activeNotePath === item.path;

                if (item.type === 'directory') {
                    return (
                        <div key={item.path} style={{ paddingLeft: `${level * 14}px` }}>
                            <button
                                onClick={() => toggleFolder(item.path)}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-app-text transition-colors hover:bg-app-text/5"
                            >
                                {isExpanded ? <ChevronDown size={15} className="text-app-muted" /> : <ChevronRight size={15} className="text-app-muted" />}
                                {isExpanded ? <FolderOpen size={16} className="text-accent" /> : <Folder size={16} className="text-accent" />}
                                <span className="truncate">{item.name}</span>
                                <span className="ml-auto text-ui-10 font-bold text-app-muted">{compterLesNotes(item.children ?? [])}</span>
                            </button>
                            {isExpanded && item.children && renderTree(item.children, level + 1)}
                        </div>
                    );
                }

                return (
                    <div key={item.path} style={{ paddingLeft: `${level * 14 + 22}px` }}>
                        <button
                            onClick={() => ouvrir(item.path)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-sm transition-colors ${
                                isActive
                                ? 'border-accent/50 bg-accent/10 font-semibold text-accent'
                                : 'border-transparent text-app-muted hover:bg-app-text/5 hover:text-app-text'
                            }`}
                        >
                            <FileText size={15} className={isActive ? 'text-accent' : 'text-app-subtle'} />
                            <span className="truncate">{nomDeLaNote(item.name)}</span>
                        </button>
                    </div>
                );
            });
    };

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-4 text-app-text">
            <EnTeteDeModule
                titre="Nexus Wiki"
                surtitre="Le coffre de campagne (Obsidian)"
                etat={<>
                    <Etiquette ton={error ? 'danger' : 'succes'}>{error ? 'Coffre illisible' : `${nombreDeNotes} notes`}</Etiquette>
                    <Etiquette ton="neutre">Lecture seule</Etiquette>
                </>}
                actions={<>
                    <Bouton aLaTable={regime.aLaTable} icone={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />} onClick={() => fetchNotes()}>
                        Recharger le coffre
                    </Bouton>
                    {activeNotePath && (
                        <Bouton aLaTable={regime.aLaTable} icone={<ExternalLink size={15} />} onClick={ouvrirDansObsidian}>
                            Ouvrir dans Obsidian
                        </Bouton>
                    )}
                </>}
            />

            <div className="flex min-h-0 flex-1 gap-4">
                {/* ── L'arborescence, large ── */}
                <Panneau as="aside" className="flex w-80 shrink-0 flex-col">
                    <div className="relative shrink-0 border-b border-app-border p-3">
                        <Search size={15} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-app-muted" />
                        <input
                            type="text"
                            placeholder="Chercher une note…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-app-border bg-app-bg py-2.5 pl-9 pr-3 text-sm text-app-text placeholder:text-app-subtle focus:border-accent/60 focus:outline-none"
                        />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {error ? (
                            <div className="space-y-2 p-4 text-center">
                                <AlertCircle size={24} className="mx-auto text-etat-danger" />
                                <p className="text-sm text-etat-danger">{error}</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">{renderTree(notes)}</div>
                        )}
                    </div>
                </Panneau>

                {/* ── La note, en grand ── */}
                <div ref={article} className="min-w-0 flex-1 overflow-y-auto custom-scrollbar">
                    {activeNotePath ? (
                        <Panneau className="mx-auto max-w-4xl p-8">
                            <p className="mb-1 font-mono text-ui-10 uppercase tracking-widest text-app-muted">
                                {activeNotePath.split(/[\\/]/).slice(0, -1).join(' › ') || 'Racine du coffre'}
                            </p>
                            <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-app-border pb-4">
                                <h1 className="font-display text-3xl font-bold leading-tight text-accent">{nomDeLaNote(activeNotePath)}</h1>
                                <Bouton
                                    aLaTable={regime.aLaTable}
                                    variante={syncStatus === 'success' ? 'succes' : syncStatus === 'error' ? 'danger' : 'neutre'}
                                    icone={syncStatus === 'syncing' ? <RefreshCw size={15} className="animate-spin" /> : <Share2 size={15} />}
                                    onClick={handleSync}
                                    disabled={!notebookUrl || syncStatus === 'syncing'}
                                    title={notebookUrl ? 'Envoyer cette note comme source du carnet NotebookLM de la campagne' : 'La campagne n’a pas de carnet NotebookLM'}
                                >
                                    {syncStatus === 'success' ? 'Envoyée' : syncStatus === 'error' ? 'Échec' : 'Envoyer au carnet'}
                                </Bouton>
                            </div>

                            {isLoading && !activeNoteContent ? (
                                <div className="flex h-64 items-center justify-center">
                                    <RefreshCw size={32} className="animate-spin text-accent/40" />
                                </div>
                            ) : (
                                <LoupeDeLecture>
                                    <div className="prose prose-invert max-w-none text-base prose-headings:font-display prose-headings:text-accent prose-h2:border-b prose-h2:border-app-border prose-h2:pb-1 prose-p:leading-relaxed prose-p:text-app-text prose-li:text-app-text prose-strong:text-app-text prose-blockquote:border-accent prose-blockquote:text-app-muted prose-a:text-accent">
                                        <TexteMarkdown components={composants}>
                                            {contenu || 'Cette note semble vide.'}
                                        </TexteMarkdown>
                                    </div>
                                </LoupeDeLecture>
                            )}
                        </Panneau>
                    ) : (
                        <Panneau vide className="flex h-full flex-col items-center justify-center gap-3 text-center">
                            <Sparkles size={40} className="text-app-subtle" />
                            <p className="font-display text-lg text-app-text">Choisissez une note</p>
                            <p className="max-w-sm text-sm text-app-muted">Votre savoir d'Obsidian, au service de vos parties — les liens [[…]] mènent d'une note à l'autre.</p>
                        </Panneau>
                    )}
                </div>

                {/* ── La table des matières, et ce que Nexus fait ── */}
                {activeNotePath && (
                    <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto custom-scrollbar">
                        <Panneau className="p-4">
                            <p className="mb-3 flex items-center gap-2 text-ui-10 font-black uppercase tracking-widest text-app-muted">
                                <ListTree size={13} className="text-accent" />Table des matières
                            </p>
                            {table.length === 0 ? (
                                <p className="text-xs italic text-app-subtle">Cette note n'a pas de titres.</p>
                            ) : (
                                <ol className="flex flex-col gap-0.5">
                                    {table.map((entree, rang) => (
                                        <li key={rang}>
                                            <button
                                                onClick={() => allerAuTitre(rang)}
                                                className={`w-full truncate rounded px-2 py-1 text-left text-sm transition-colors hover:bg-accent/10 hover:text-accent ${
                                                    entree.niveau === 1 ? 'font-bold text-app-text' : entree.niveau === 2 ? 'pl-4 text-app-text' : 'pl-7 text-app-muted'
                                                }`}
                                            >
                                                {entree.titre}
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </Panneau>
                        <Panneau className="flex gap-3 p-4">
                            <Info size={16} className="mt-0.5 shrink-0 text-accent" />
                            <p className="text-xs leading-relaxed text-app-muted">
                                <strong className="text-app-text">Lecture seule.</strong> Pour modifier une note, ouvrez-la
                                dans Obsidian. « Envoyer au carnet » en fait une source du carnet NotebookLM ; pour que
                                l'Oracle lise le coffre en séance, branchez-le dans les réglages IA.
                            </p>
                        </Panneau>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default ObsidianPanel;
