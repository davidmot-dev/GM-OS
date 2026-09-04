import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMediaStore } from '../stores/useMediaStore';
import type { MediaType, MediaItem } from '../stores/useMediaStore';
import { Search, Image as ImageIcon, Music, Film, UploadCloud, Trash2, X, Check, FileText, Tag, Plus, Edit2, Users, Clock, ShieldAlert, ArrowDownAZ, ChevronDown, ListFilter, Folder, Lock, RotateCcw, Unplug } from 'lucide-react';
import { usagesDesMedias } from '../services/proprietairesDesMedias';
import { filtreDeSelection } from '../stores/typesDeMedia';
import { importerPlusieursMedias } from './media/importerPlusieursMedias';
import { gmPrompt } from '../stores/useModalStore';
import { gmToast } from '../stores/useToastStore';
import { mediasRestituables, restaurerLesMedias } from '../modules/session/logic/MiroirDesMedias';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useTranslation } from 'react-i18next';

import { MediaItemThumbnail } from '../modules/image/components/MediaItemThumbnail';
import { FullScreenPreview } from '../modules/image/components/FullScreenPreview';
import { TacticalDetailPanel } from '../modules/image/components/TacticalDetailPanel';

const TYPE_ICONS: Record<string, React.ReactNode> = {
    'image': <ImageIcon size={14} className="text-blue-400" />,
    'audio': <Music size={14} className="text-amber-400" />,
    'video': <Film size={14} className="text-purple-400" />,
    'document': <FileText size={14} className="text-emerald-400" />,
};

interface MediaBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (mediaId: string) => void;
    allowedTypes?: MediaType[]; 
    title?: string;
}

export const MediaBrowser: React.FC<MediaBrowserProps> = ({
    isOpen,
    onClose,
    onSelect,
    allowedTypes,
    title,
}) => {
    const { t } = useTranslation('common');
    // 1. All Hooks (State & Stores)
    const { 
        mediaList, 
        isLoading, 
        isInitialized, 
        initDB, 
        addMedia, 
        deleteMedia, 
        clearDB, 
        renameMedia,
        updateMediaTags,
        updateMediaCampaigns,
        collections, 
        addCollection, 
        deleteCollection, 
        renameCollection, 
        toggleMediaInCollection,
        toggleMediaPersistence, 
    } = useMediaStore();

    const { activeCampaignId, campaigns } = useSessionOSStore();

    /**
     * **Ce que le miroir peut rendre — chantier n° 4.**
     *
     * Recompté à chaque changement de la bibliothèque : après une restauration
     * le compte tombe à zéro et le bandeau disparaît de lui-même, plutôt que de
     * rester à proposer un geste déjà fait.
     */
    const [aRestituer, setARestituer] = useState(0);
    const [restauration, setRestauration] = useState(false);

    useEffect(() => {
        let annule = false;
        void mediasRestituables()
            .then(ids => { if (!annule) setARestituer(ids.length); })
            .catch(() => { /* pas de miroir joignable : rien à proposer */ });
        return () => { annule = true; };
    }, [mediaList.length, isInitialized]);

    const lancerLaRestauration = async () => {
        setRestauration(true);
        try {
            const bilan = await restaurerLesMedias();
            gmToast(
                bilan.rendus > 0
                    ? `${bilan.rendus} média(s) restauré(s)`
                        + (bilan.brouillard ? ', brouillard compris' : '')
                        + (bilan.echecs > 0 ? ` — ${bilan.echecs} échec(s)` : '')
                    : 'Rien à restaurer : la bibliothèque a déjà tout.',
            );
        } finally { setRestauration(false); }
    };

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagLogic, setTagLogic] = useState<'AND' | 'OR'>('OR');
    const [smartFilter, setSmartFilter] = useState<'none' | 'recent' | 'untagged' | 'orphans'>('none');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'name-asc'>('date-desc');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
    const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
    const [campaignFilterEnabled, setCampaignFilterEnabled] = useState(true);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    /*
      **Qui se sert de quoi — calculé une fois par ouverture.**

      Le recensement lit une douzaine de magasins ; le refaire à chaque rendu
      coûterait pour rien, puisque rien de ce qu'on filtre ici ne le modifie.
      `mediaList` sert de déclencheur : c'est le seul changement qui puisse
      créer ou résorber un orphelin sans quitter cet écran.
    */
    const orphelins = React.useMemo(() => {
        if (!isOpen) return new Set<string>();
        const { usages } = usagesDesMedias();
        return new Set(mediaList.filter(m => !usages.has(m.id)).map(m => m.id));
    }, [isOpen, mediaList]);
    const estOrphelin = React.useCallback((id: string) => orphelins.has(id), [orphelins]);

    // 2. Lifecycle & Effects
    useEffect(() => {
        if (isOpen && !isInitialized && !isLoading) {
            initDB();
        }
    }, [isOpen, isInitialized, isLoading, initDB]);

    // 3. Logic Handlers
    const handleCreateCollection = () => {
        gmPrompt(t('mediaBrowser.renameFolder'), "", (name) => {
            if (name.trim()) addCollection(name.trim());
        });
    };

    const handleRenameCollection = (id: string, currentName: string) => {
        gmPrompt(t('mediaBrowser.renameFolder'), currentName, (newName) => {
            if (newName.trim()) renameCollection(id, newName.trim());
        });
    };

    const handleDeleteCollection = (id: string) => {
        if (confirm(t('mediaBrowser.deleteFolderConfirm'))) {
            deleteCollection(id);
            if (selectedCollectionId === id) setSelectedCollectionId(null);
        }
    };

    const handleRenameMedia = (id: string, currentName: string) => {
        gmPrompt(t('mediaBrowser.renameIdent'), currentName, (newName) => {
            if (newName.trim()) renameMedia(id, newName.trim());
        });
    };

    /**
     * **Le Hub prend plusieurs fichiers d'un coup** (point H8, 2026-09-05).
     *
     * Il n'en lisait qu'un — `files?.[0]` — alors que le sélecteur en aurait
     * accepté autant qu'on veut. Ranger une sonothèque se faisait donc fichier
     * par fichier, avec une fenêtre de sélection à rouvrir entre chaque.
     *
     * La règle elle-même vit dans `importerPlusieursMedias`, où elle est
     * testée : *une logique cachée dans un composant n'est couverte par rien.*
     *
     * ⚠️ **Le contrôle de doublon porte sur le nom ET la taille**, pas sur le
     * contenu : une empreinte demanderait de relire toute la base à chaque
     * import. Deux fichiers de même nom et de même octet près sont le même
     * fichier dans tous les cas qui se produisent vraiment. *Et il avertit, il
     * n'interdit pas* — le meneur peut vouloir la copie, une variante
     * retouchée sous le même nom par exemple.
     */
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fichiers = Array.from(e.target.files ?? []);
        if (fichiers.length === 0) return;

        setIsUploading(true);
        const campaignIds = activeCampaignId ? [activeCampaignId] : [];

        const resultat = await importerPlusieursMedias(fichiers, {
            existants: mediaList,
            ajouter: (fichier) => addMedia(fichier, [], campaignIds),
            demanderPourLeDoublon: (nom) => confirm(t('mediaBrowser.duplicateConfirm', { name: nom })),
        });

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        if (resultat.echecs.length > 0) {
            alert(`${t('error_save')} : ${resultat.echecs.join(', ')}`);
        } else if (resultat.ranges > 1) {
            gmToast(t('mediaBrowser.importDone', { count: resultat.ranges }), 'success');
        }
    };

    // 4. Filtering Logic
    const filteredMedia = mediaList.filter(m => {
        if (allowedTypes && !allowedTypes.includes(m.type)) return false;
        if (typeFilter !== 'all' && m.type !== typeFilter) return false;
        
        if (smartFilter === 'untagged') {
            if (m.tags.length > 0) return false;
        }

        /*
          **Un orphelin verrouillé reste dans la liste.** Ce dossier sert à
          passer les orphelins en revue avant un nettoyage, pas à prédire ce que
          le nettoyage supprimera — et ce qu'on a déjà pris la peine de
          protéger mérite d'être revu comme le reste.
        */
        if (smartFilter === 'orphans' && !estOrphelin(m.id)) return false;

        if (smartFilter !== 'untagged' && selectedTags.length > 0) {
            const mediaTagsLower = m.tags.map(t => t.toLowerCase());
            if (tagLogic === 'OR') {
                if (!selectedTags.some(tag => mediaTagsLower.includes(tag.toLowerCase()))) return false;
            } else { // AND
                if (!selectedTags.every(tag => mediaTagsLower.includes(tag.toLowerCase()))) return false;
            }
        }

        if (search) {
            const searchLower = search.toLowerCase();
            const nameMatch = m.name.toLowerCase().includes(searchLower);
            const tagMatch = m.tags.some(t => t.toLowerCase().includes(searchLower));
            const typeMatch = m.type.toLowerCase().includes(searchLower);
            if (!nameMatch && !tagMatch && !typeMatch) return false;
        }
        
        if (campaignFilterEnabled && activeCampaignId) {
            if (!m.campaignIds?.includes(activeCampaignId)) return false;
        }

        if (selectedCollectionId) {
            const coll = collections.find(c => c.id === selectedCollectionId);
            if (!coll || !coll.mediaIds.includes(m.id)) return false;
        }
        
        return true;
    });

    const sortedAndFilteredMedia = [...filteredMedia].sort((a, b) => {
        if (sortBy === 'date-desc') return b.createdAt - a.createdAt;
        if (sortBy === 'date-asc') return a.createdAt - b.createdAt;
        if (sortBy === 'size-desc') return b.size - a.size;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return b.createdAt - a.createdAt;
    });

    const displayMedia = smartFilter === 'recent' ? sortedAndFilteredMedia.slice(0, 50) : sortedAndFilteredMedia;
    const allTags = Array.from(new Set(mediaList.flatMap(m => m.tags))).sort();

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (!isOpen) return null;

    // 5. Render Obsidian Edition
    return createPortal(
        <div className="fixed inset-0 z-[100] flex bg-app-bg text-app-text font-sans overflow-hidden animate-in fade-in duration-500 select-none">
            {/* Full preview overlay */}
            {previewItem && (
                <FullScreenPreview 
                    media={previewItem} 
                    onClose={() => setPreviewItem(null)} 
                />
            )}
            
            <div className="flex-1 flex flex-row overflow-hidden relative">
                
                {/* Visual Background Decoration */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20 overflow-hidden">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-500/10 blur-[150px] rounded-full" />
                    <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-[#53ddfc]/10 blur-[150px] rounded-full" />
                </div>

                {/* SideNavBar Glassmorphic */}
                <aside className="w-80 h-full bg-app-surface/40 backdrop-blur-3xl border-r border-app-border/10 flex flex-col z-20 relative">
                    <div className="p-8 border-b border-app-border/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.1)] border border-accent/20 group transition-all duration-500 hover:scale-105 active:scale-95">
                                <UploadCloud className="text-accent group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)] transition-all" size={24} />
                            </div>
                            <div>
                                <h1 className="text-base font-black uppercase tracking-[0.25em] text-app-text drop-shadow-[0_0_10px_rgba(var(--app-text-rgb),0.3)] font-display">{title || t('mediaBrowser.hubTitle')}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_5px_var(--accent)]" />
                                    <p className="text-[10px] font-bold text-app-text/30 uppercase tracking-widest leading-none">{t('mediaBrowser.nexusProtocol')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-8">
                        {/* Virtual Directories */}
                        <section>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2 opacity-60 font-display">
                                    <Folder size={14} />
                                    {t('mediaBrowser.foldersTitle')}
                                </h3>
                                <button 
                                    onClick={handleCreateCollection}
                                    className="p-1 px-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-all border border-accent/20 text-[10px] font-black uppercase tracking-widest"
                                    title={t('mediaBrowser.newFolder')}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            
                            <div className="space-y-1.5">
                                <button
                                    onClick={() => {
                                        setSelectedCollectionId(null);
                                        setSelectedTags([]);
                                        setSmartFilter('none');
                                    }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 ${(!selectedCollectionId && selectedTags.length === 0 && smartFilter === 'none') ? 'bg-accent/10 text-accent border border-accent/30 shadow-[0_0_30px_rgba(var(--accent-rgb),0.15)]' : 'text-app-text/40 hover:bg-app-text/5 hover:text-app-text/70'}`}
                                >
                                    <Search size={18} className="opacity-50" />
                                    {t('mediaBrowser.globalArchive')}
                                </button>

                                <div className="pt-3 space-y-1.5">
                                    <h4 className="px-5 text-[9px] font-black text-app-text/15 uppercase tracking-[0.3em] mb-2 font-display">{t('mediaBrowser.smartMatrix')}</h4>
                                    <button
                                        onClick={() => {
                                            setSmartFilter('recent');
                                            setSelectedCollectionId(null);
                                            setSelectedTags([]);
                                        }}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 ${smartFilter === 'recent' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'text-app-text/40 hover:bg-app-text/5 hover:text-app-text/70'}`}
                                    >
                                        <Clock size={18} className="opacity-50" />
                                        {t('mediaBrowser.latestFrequency')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSmartFilter('untagged');
                                            setSelectedCollectionId(null);
                                            setSelectedTags([]);
                                        }}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 ${smartFilter === 'untagged' ? 'bg-accent/10 text-accent border border-accent/30' : 'text-app-text/40 hover:bg-app-text/5 hover:text-app-text/70'}`}
                                    >
                                        <ShieldAlert size={18} className="opacity-50" />
                                        {t('mediaBrowser.unaliasContent')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSmartFilter(smartFilter === 'orphans' ? 'none' : 'orphans');
                                            setSelectedCollectionId(null);
                                            setSelectedTags([]);
                                        }}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 ${smartFilter === 'orphans' ? 'bg-app-text/10 text-app-text/80 border border-app-text/20' : 'text-app-text/40 hover:bg-app-text/5 hover:text-app-text/70'}`}
                                    >
                                        <Unplug size={18} className="opacity-50" />
                                        {t('mediaBrowser.orphans')}
                                    </button>
                                </div>
                                
                                <div className="pt-6 space-y-1.5">
                                    <h4 className="px-5 text-[9px] font-black text-app-text/15 uppercase tracking-[0.3em] mb-2 font-display">{t('mediaBrowser.userDomains')}</h4>
                                    {collections.map(coll => (
                                        <div key={coll.id} className="group flex items-center gap-1 pr-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCollectionId(coll.id);
                                                    setSelectedTags([]);
                                                    setSmartFilter('none');
                                                }}
                                                className={`flex-1 flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 ${selectedCollectionId === coll.id ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]' : 'text-app-text/30 hover:bg-app-text/5 hover:text-app-text/60'}`}
                                            >
                                                <Folder size={18} className={`opacity-50 ${selectedCollectionId === coll.id ? 'text-accent' : ''}`} />
                                                <span className="truncate">{coll.name}</span>
                                            </button>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-300">
                                                <button 
                                                    onClick={() => handleRenameCollection(coll.id, coll.name)} 
                                                    className="p-2 text-app-text/20 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                                                    title={t('mediaBrowser.renameFolder')}
                                                    aria-label={t('mediaBrowser.renameFolder')}
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteCollection(coll.id)} 
                                                    className="p-2 text-app-text/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title={t('mediaBrowser.deleteFolder')}
                                                    aria-label={t('mediaBrowser.deleteFolder')}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {collections.length === 0 && (
                                        <div className="px-5 py-8 text-center border border-dashed border-app-border/10 rounded-2xl">
                                            <p className="text-[10px] font-bold text-app-text/10 uppercase tracking-widest">{t('mediaBrowser.noUnitsDetected')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Tactical Metadata Tags */}
                        <section className="pt-8 border-t border-app-border/10">
                            <div className="flex items-center justify-between mb-5 px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2 opacity-60 font-display">
                                    <Tag size={14} />
                                    {t('mediaBrowser.tacticalTags')}
                                </h3>
                                <button 
                                    onClick={() => setTagLogic(tagLogic === 'AND' ? 'OR' : 'AND')}
                                    className={`px-3 py-1 rounded-xl text-[9px] font-black tracking-widest transition-all border ${tagLogic === 'AND' ? 'bg-accent/10 border-accent/40 text-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.1)]' : 'bg-app-text/5 border-app-text/10 text-app-text/40 hover:text-app-text/70'}`}
                                    title={`${t('mediaBrowser.matrixLogic')}: ${tagLogic}`}
                                >
                                    {tagLogic}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 px-1">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            setSelectedTags(prev => 
                                                prev.includes(tag) 
                                                    ? prev.filter(t => t !== tag)
                                                    : [...prev, tag]
                                            );
                                            setSelectedCollectionId(null);
                                            setSmartFilter('none');
                                        }}
                                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all duration-300 ${selectedTags.includes(tag) ? 'bg-accent/10 border-accent/40 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]' : 'bg-app-text/5 border-app-text/5 text-app-text/20 hover:border-app-text/20 hover:text-app-text/60 hover:bg-app-text/10'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                                {allTags.length === 0 && (
                                    <div className="text-[10px] font-bold text-app-text/5 uppercase tracking-widest text-center w-full py-4 italic">{t('mediaBrowser.noTagTraces')}</div>
                                )}
                            </div>
                        </section>
                    </div>
                    
                    {/* Bottom Status & Actions */}
                    <div className="p-6 border-t border-app-border/10 bg-app-bg/20 space-y-3">
                        {/*
                            **Le retour du miroir — chantier n° 4.**

                            Il vit ici parce que c'est ici qu'on gère les médias :
                            posé sur l'autre écran le 2026-08-29, il était
                            invisible depuis celui que David ouvre réellement.
                            *Un filet rangé là où personne ne regarde n'est pas
                            un filet.*

                            Il n'apparaît que si le miroir porte ce que cette
                            bibliothèque n'a plus, et il annonce le compte avant
                            de proposer quoi que ce soit — juste au-dessus du
                            bouton qui purge, qui est précisément le geste après
                            lequel on en aura besoin.
                        */}
                        {aRestituer > 0 && (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                                <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                                    {aRestituer} média{aRestituer > 1 ? 's' : ''} dans la sauvegarde,
                                    absent{aRestituer > 1 ? 's' : ''} d'ici.
                                </p>
                                <button
                                    type="button"
                                    disabled={restauration}
                                    onClick={lancerLaRestauration}
                                    className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/30 transition-all duration-300 disabled:opacity-30"
                                >
                                    <RotateCcw size={15} />
                                    {restauration ? 'Restauration…' : 'Restaurer depuis la sauvegarde'}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (confirm(t('mediaBrowser.purgeConfirm'))) {
                                    clearDB();
                                }
                            }}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/5 text-red-500/40 hover:bg-red-500/20 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] border border-red-500/10 hover:border-red-500/40 transition-all duration-500 group"
                        >
                            <Trash2 size={16} className="group-hover:rotate-12 transition-transform duration-500" />
                            {t('mediaBrowser.purgeHub')}
                        </button>
                    </div>
                </aside>

                {/* Main View Port Area */}
                <main className="flex-1 h-full flex flex-col relative z-20">
                    
                    {/* Integrated HUD Toolbar */}
                    <header className="h-24 border-b border-app-border/10 flex items-center px-10 bg-app-surface/40 backdrop-blur-3xl justify-between relative">
                        {/* Decorative HUD line */}
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                        
                        <div className="flex items-center gap-8 flex-1 max-w-5xl">
                            {/* Search Tactical HUD */}
                            <div className="relative flex-1 group max-w-xl">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-app-text/10 group-focus-within:text-accent group-focus-within:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)] transition-all duration-500" size={18} />
                                <input 
                                    type="text" 
                                    placeholder={t('mediaBrowser.searchPlaceholder')} 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-app-bg/80 border border-app-border/10 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold tracking-wide focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-500 placeholder:text-app-text/5 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em] text-app-text"
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none">
                                    <div className="px-1.5 py-0.5 border border-accent/20 rounded text-[8px] font-black text-accent/50 font-display">{t('mediaBrowser.scanMode')}</div>
                                </div>
                            </div>

                            {/* Matrix Type Tabs */}
                            <div className="flex bg-app-bg/90 p-1.5 rounded-2xl border border-app-border/10 shadow-2xl">
                                {[
                                    { id: 'all', key: 'all', icon: null },
                                    { id: 'image', key: 'image', icon: <ImageIcon size={14} /> },
                                    { id: 'audio', key: 'audio', icon: <Music size={14} /> },
                                    { id: 'video', key: 'video', icon: <Film size={14} /> },
                                    { id: 'document', key: 'document', icon: <FileText size={14} /> }
                                ].map(btn => (
                                    <button
                                        key={btn.id}
                                        onClick={() => setTypeFilter(btn.id as MediaType | 'all')}
                                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${typeFilter === btn.id ? 'bg-accent text-app-bg shadow-[0_0_25px_rgba(var(--accent-rgb),0.4)] translate-y-[-1px]' : 'text-app-text/20 hover:text-app-text/70 hover:bg-app-text/5'}`}
                                    >
                                        {btn.icon}
                                        {t(`mediaBrowser.tabs.${btn.key}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            {/* Campaign Context Filter */}
                            {activeCampaignId && (
                                <button
                                    onClick={() => setCampaignFilterEnabled(!campaignFilterEnabled)}
                                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border group ${campaignFilterEnabled ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'bg-app-bg/80 border-app-border/10 text-app-text/20 hover:border-app-text/20 hover:text-app-text/60'}`}
                                >
                                    <Users size={16} className={`transition-transform duration-500 ${campaignFilterEnabled ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    {campaignFilterEnabled ? t('mediaBrowser.focusOperational') : t('mediaBrowser.globalMatrix')}
                                </button>
                            )}

                            {/* Custom HUD Sort Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                    className={`flex items-center gap-3 px-6 py-3.5 bg-app-bg/80 border ${isSortMenuOpen ? 'border-accent/40 text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]' : 'border-app-border/10 text-app-text/30'} rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 group`}
                                >
                                    <ListFilter size={18} className={`transition-colors duration-500 ${isSortMenuOpen ? 'text-accent' : 'group-hover:text-app-text/60 text-app-text/20'}`} />
                                    <span>{t(`mediaBrowser.sort.${sortBy.split('-')[0]}.label`)}</span>
                                    <ChevronDown size={16} className={`transition-transform duration-500 ${isSortMenuOpen ? 'rotate-180 text-accent' : 'text-app-text/10 group-hover:text-app-text/30'}`} />
                                </button>

                                {isSortMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)} />
                                        <div className="absolute right-0 top-[calc(100%+12px)] w-64 bg-app-surface/95 border border-app-border/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-500 p-2 border-accent/10">
                                            <div className="space-y-1">
                                                {[
                                                    { id: 'date-desc', key: 'recent', icon: <Clock size={16} /> },
                                                    { id: 'date-asc', key: 'oldest', icon: <Clock size={16} /> },
                                                    { id: 'size-desc', key: 'size', icon: <UploadCloud size={16} /> },
                                                    { id: 'name-asc', key: 'name', icon: <ArrowDownAZ size={16} /> }
                                                ].map(option => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            setSortBy(option.id as 'date-desc' | 'date-asc' | 'size-desc' | 'name-asc');
                                                            setIsSortMenuOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 group/opt ${sortBy === option.id ? 'bg-accent text-app-bg shadow-[0_8px_20px_rgba(var(--accent-rgb),0.3)]' : 'hover:bg-app-text/5'}`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className={sortBy === option.id ? 'text-app-bg' : 'text-accent/40'}>{option.icon}</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{t(`mediaBrowser.sort.${option.key}.label`)}</span>
                                                            </div>
                                                            {sortBy === option.id && <Check size={14} className="text-app-bg" />}
                                                        </div>
                                                        <p className={`text-[9px] font-bold uppercase tracking-widest opacity-40 group-hover/opt:opacity-60 transition-opacity ${sortBy === option.id ? 'text-app-bg' : 'text-app-text'}`}>{t(`mediaBrowser.sort.${option.key}.desc`)}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Main Import Interface */}
                            <label className="bg-accent hover:bg-accent/80 text-app-bg px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all duration-500 shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_40px_rgba(var(--accent-rgb),0.5)] hover:scale-[1.02] active:scale-95 flex items-center gap-3 group">
                                <UploadCloud size={18} className="group-hover:translate-y-[-2px] transition-transform duration-500" />
                                {isUploading ? t('mediaBrowser.uploadingAsset') : t('mediaBrowser.importAsset')}
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handleUpload}
                                    className="hidden"
                                    accept={filtreDeSelection(allowedTypes)}
                                />
                            </label>

                            <button 
                                onClick={onClose} 
                                className="w-12 h-12 flex items-center justify-center bg-app-text/5 rounded-2xl text-app-text/20 hover:text-app-text hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/20 active:scale-90 group duration-500"
                                title={t('mediaBrowser.deactivateInterface')}
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>
                    </header>

                    {/* Operational Content Area */}
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-app-bg">
                        
                        {displayMedia.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-app-surface/50 flex items-center justify-center border border-app-border/10 mb-10 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] relative">
                                    <div className="absolute inset-0 rounded-[2.5rem] border border-accent/10 animate-ping opacity-20" />
                                    <UploadCloud size={48} className="text-app-text/5 animate-pulse" />
                                </div>
                                <h4 className="text-2xl font-black uppercase tracking-[0.4em] text-app-text/10 mb-4 font-display">{t('mediaBrowser.noDataDetected')}</h4>
                                <p className="text-[10px] font-bold text-app-text/5 uppercase tracking-[0.3em] leading-loose mb-10">
                                    {t('mediaBrowser.noDataSub')}
                                </p>
                                <button 
                                    onClick={() => {
                                        setSearch('');
                                        setTypeFilter('all');
                                        setSelectedTags([]);
                                        setSelectedCollectionId(null);
                                        setCampaignFilterEnabled(false);
                                        setSmartFilter('none');
                                    }}
                                    className="px-10 py-4 rounded-2xl bg-app-text/5 hover:bg-accent/10 text-app-text/20 hover:text-accent text-[10px] font-black uppercase tracking-[0.25em] border border-app-text/10 hover:border-accent/30 transition-all duration-500"
                                >
                                    {t('mediaBrowser.resetFrequency')}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-10 pb-20 auto-rows-max">
                                {displayMedia.map(media => (
                                    <div 
                                        key={media.id} 
                                        className="group relative bg-app-surface/40 border border-app-border/10 hover:border-accent/30 rounded-[2.5rem] overflow-hidden transition-all duration-700 hover:shadow-[0_0_60px_rgba(var(--accent-rgb),0.08)] hover:translate-y-[-12px] flex flex-col h-full shadow-2xl backdrop-blur-sm"
                                    >
                                        {/* Visual Tactical Scan Lines */}
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-accent/20 opacity-0 group-hover:opacity-100 group-hover:animate-scan z-10 pointer-events-none" />

                                        {/* Premium Thumbnail Container */}
                                        <div 
                                            className="aspect-[4/5] relative overflow-hidden bg-black/40 cursor-pointer"
                                            onClick={() => setPreviewItem(media)}
                                        >
                                            <MediaItemThumbnail media={media} />
                                            
                                            {/* Data Overlay Logic */}
                                            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-app-bg via-app-bg/80 to-transparent translate-y-[20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-accent tracking-tighter drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]">{formatSize(media.size)}</span>
                                                        <span className="text-[8px] font-bold text-app-text/30 uppercase tracking-widest mt-1.5 opacity-60">
                                                            {t('mediaBrowser.synchronizedDate', { date: new Date(media.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' }) })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm(t('mediaBrowser.initiateDeletion', { name: media.name }))) {
                                                                    deleteMedia(media.id);
                                                                }
                                                            }}
                                                            className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500/60 hover:bg-red-500/20 hover:text-red-500 rounded-2xl transition-all border border-red-500/10 hover:border-red-500/40"
                                                            title={t('mediaBrowser.deleteAsset')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onSelect(media.id); }}
                                                            className="w-12 h-12 flex items-center justify-center bg-accent text-app-bg rounded-full transition-all shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)] hover:scale-110 active:scale-90"
                                                            title={t('mediaBrowser.selectTransmission')}
                                                        >
                                                            <Check size={20} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* HUD Type Icon Badge */}
                                            <div className="absolute top-6 left-6 flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 opacity-60 group-hover:opacity-100 group-hover:text-accent group-hover:border-accent/20 transition-all duration-500">
                                                    {TYPE_ICONS[media.type] || <FileText size={18} />}
                                                </div>
                                                {media.isPersistent && (
                                                    <div className="w-10 h-10 rounded-2xl bg-accent/10 backdrop-blur-md border border-accent/20 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]">
                                                        <Lock size={16} />
                                                    </div>
                                                )}
                                                {estOrphelin(media.id) && (
                                                    <div
                                                        className="h-10 px-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-white/40"
                                                        title={t('mediaBrowser.orphanBadgeTitle')}
                                                    >
                                                        <Unplug size={13} />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">
                                                            {t('mediaBrowser.orphanBadge')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Metadata Footer */}
                                        <div className="p-7 flex flex-col flex-1 relative">
                                            {/* Micro HUD decoration */}
                                            <div className="absolute -right-4 -bottom-4 w-12 h-12 border border-white/5 rotate-45 pointer-events-none opacity-20" />
                                            
                                            <div className="flex items-start justify-between mb-4 gap-4">
                                                <h3 className="text-sm font-black uppercase tracking-wider text-app-text group-hover:text-accent transition-colors leading-tight truncate flex-1 font-display" title={media.name}>
                                                    {media.name}
                                                </h3>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRenameMedia(media.id, media.name); }}
                                                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-all text-app-text/50 hover:text-accent"
                                                    title={t('mediaBrowser.renameIdent')}
                                                    aria-label={t('mediaBrowser.renameIdent')}
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            </div>

                                            {/* Domain Tags Row */}
                                            <div className="flex flex-wrap gap-2 mb-6 min-h-[22px]">
                                                {collections.filter(c => c.mediaIds.includes(media.id)).map(coll => (
                                                    <span key={coll.id} className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border border-blue-400/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                                        <FileText size={10} className="opacity-50" />
                                                        {coll.name}
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleMediaInCollection(coll.id, media.id);
                                                            }}
                                                            className="hover:text-red-400 opacity-30 hover:opacity-100 transition-all ml-1"
                                                            title={t('mediaBrowser.removeFromFolder')}
                                                            aria-label={t('mediaBrowser.removeFromFolder')}
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </span>
                                                ))}
                                                {media.campaignIds.map(cid => {
                                                    const campaignName = campaigns.find(c => c.id === cid)?.name || t('unknown_unit', { id: cid.substring(0, 4) });
                                                    return (
                                                        <span key={cid} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                                                            {campaignName}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            {/* Tactical Neural Tags */}
                                            <div className="mt-auto pt-5 border-t border-app-border/10 flex items-center justify-between">
                                                <div className="flex flex-wrap gap-2 items-center max-w-[75%] overflow-hidden">
                                                    {media.tags.map(t => (
                                                        <span key={t} className="text-[9px] font-bold text-app-text/10 group-hover:text-accent/40 transition-colors uppercase tracking-widest">#{t}</span>
                                                    ))}
                                                    {media.tags.length === 0 && <span className="text-[8px] font-bold text-app-text/5 uppercase italic tracking-[0.2em]">{t('mediaBrowser.noTagTraces')}</span>}
                                                </div>
                                                
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingMediaId(editingMediaId === media.id ? null : media.id);
                                                        }}
                                                        className={`w-10 h-10 flex items-center justify-center rounded-2xl border transition-all duration-500 ${editingMediaId === media.id ? 'bg-accent/20 border-accent/40 text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]' : 'bg-app-text/5 border-transparent text-app-text/10 hover:text-accent hover:bg-accent/10'}`}
                                                        title={t('mediaBrowser.detailedEdition')}
                                                    >
                                                        <Plus size={18} className={`transition-transform duration-500 ${editingMediaId === media.id ? 'rotate-45' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
            {/* Tactical Detail Panel Overlay Backdrop */}
            {editingMediaId && (
                <div 
                    className="absolute inset-0 z-[115] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setEditingMediaId(null)}
                />
            )}

            {/* Tactical Detail Panel Component */}
            {editingMediaId && (
                <TacticalDetailPanel 
                    media={mediaList.find(m => m.id === editingMediaId)!}
                    onClose={() => setEditingMediaId(null)}
                    collections={collections}
                    toggleMediaInCollection={toggleMediaInCollection}
                    updateMediaTags={updateMediaTags}
                    updateMediaCampaigns={updateMediaCampaigns}
                    toggleMediaPersistence={toggleMediaPersistence}
                    deleteMedia={deleteMedia}
                    campaigns={campaigns}
                    onSelect={onSelect}
                />
            )}
        </div>,
        document.body
    );
};
