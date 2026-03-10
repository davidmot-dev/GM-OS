import React, { useState, useRef, useEffect } from 'react';
import { useMediaStore } from '../stores/useMediaStore';
import type { MediaType, MediaItem } from '../stores/useMediaStore';
import { Search, Image as ImageIcon, Music, Film, UploadCloud, Trash2, X, Check, FileText, Tag, Plus, Edit2 } from 'lucide-react';
import { useMediaUrl } from '../hooks/useMediaUrl';
import { gmPrompt } from '../stores/useModalStore';

interface MediaBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (mediaId: string) => void;
    allowedTypes?: MediaType[]; // If undefined, allow all
    title?: string;
}

const TYPE_ICONS = {
    'image': <ImageIcon size={14} className="text-blue-400" />,
    'audio': <Music size={14} className="text-amber-400" />,
    'video': <Film size={14} className="text-purple-400" />,
    'document': <FileText size={14} className="text-emerald-400" />,
};

const MediaPreview: React.FC<{ media: MediaItem }> = ({ media }) => {
    const url = useMediaUrl(media.id);

    if (!url) {
        return <div className="w-full h-full bg-app-surface flex items-center justify-center animate-pulse" />;
    }

    if (media.type === 'image') {
        return <img src={url} alt={media.name} className="w-full h-full object-cover" />;
    }
    if (media.type === 'video') {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center relative">
                <video src={url} className="w-full h-full object-cover opacity-50" />
                <Film size={24} className="text-white/50 absolute" />
            </div>
        );
    }
    if (media.type === 'audio') {
        return (
            <div className="w-full h-full bg-app-surface flex flex-col items-center justify-center gap-2">
                <Music size={24} className="text-amber-400" />
                <audio src={url} controls className="w-full h-8 px-2 opacity-50 hover:opacity-100 transition-opacity" />
            </div>
        );
    }
    if (media.type === 'document') {
        const ext = media.name.split('.').pop()?.toUpperCase() ?? 'DOC';
        return (
            <div className="w-full h-full bg-app-surface/50 flex flex-col items-center justify-center gap-2 p-2">
                <FileText size={28} className="text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">{ext}</span>
                <p className="text-[9px] text-slate-500 text-center truncate w-full px-1">{media.name}</p>
            </div>
        );
    }
    return null;
};

export const MediaBrowser: React.FC<MediaBrowserProps> = ({
    isOpen,
    onClose,
    onSelect,
    allowedTypes,
    title = "Media Hub"
}) => {
    const { mediaList, isLoading, isInitialized, initDB, addMedia, deleteMedia, clearDB, renameMedia } = useMediaStore();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [tagInputId, setTagInputId] = useState<string | null>(null);
    const [newTag, setNewTag] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && !isInitialized && !isLoading) {
            initDB();
        }
    }, [isOpen, isInitialized, isLoading, initDB]);

    if (!isOpen) return null;

    const filteredMedia = mediaList.filter(m => {
        if (allowedTypes && !allowedTypes.includes(m.type)) return false;
        if (typeFilter !== 'all' && m.type !== typeFilter) return false;
        if (tagFilter && !m.tags.includes(tagFilter)) return false;
        if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const allTags = Array.from(new Set(mediaList.flatMap(m => m.tags))).sort();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await addMedia(file);
            // Optionally auto-select after upload:
            // onSelect('auto-sel');
        } catch (err) {
            alert("Erreur lors de l'import : " + err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-app-bg/80 backdrop-blur-sm p-4">
            <div className="bg-app-bg border border-app-border w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-surface/50">
                    <h2 className="text-lg font-bold text-app-text flex items-center gap-2">
                        <UploadCloud className="text-accent" />
                        {title}
                    </h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (confirm("Voulez-vous vraiment vider tout le Media Hub ? Cette action effacera tous les médias de manière irréversible.")) {
                                    clearDB();
                                }
                            }}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                            title="Vider entièrement le Media Hub"
                        >
                            <Trash2 size={14} />
                            Vider le Hub
                        </button>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 bg-app-surface rounded-lg hover:bg-red-500/20">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-app-border/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-app-bg border border-app-border rounded-lg py-2 pl-9 pr-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-accent/50"
                            />
                        </div>

                        {!allowedTypes && (
                            <div className="flex bg-app-bg rounded-lg p-1 border border-app-border">
                                {(['all', 'image', 'audio', 'video', 'document'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(type)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${typeFilter === type ? 'bg-app-surface text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {type === 'all' ? 'Tous' : type === 'document' ? 'Doc' : type}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleUpload}
                            accept={allowedTypes 
                                ? allowedTypes.map(t => t === 'document' ? '.pdf,.doc,.docx,.txt,.odt,.rtf' : t + '/*').join(',') 
                                : 'image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.odt,.rtf'}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`flex items-center gap-2 px-4 py-2 ${isUploading ? 'bg-app-surface text-slate-500 cursor-not-allowed' : 'bg-accent hover:bg-accent/80 text-slate-950 shadow-glow-accent'} rounded-xl font-bold text-sm transition-all`}
                        >
                            <UploadCloud size={16} />
                            {isUploading ? 'Import...' : 'Importer des fichiers'}
                        </button>
                    </div>
                </div>

                {/* Main Content Area (Grid + Sidebar) */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Library Grid */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-app-bg/50">
                        {isLoading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                <p>Chargement du Hub Media...</p>
                            </div>
                        ) : filteredMedia.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                <UploadCloud size={48} className="opacity-20 mb-2" />
                                <p>Aucun fichier trouvé.</p>
                                <p className="text-xs">Importez des fichiers avec le bouton ci-dessus.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredMedia.map(media => (
                                    <div key={media.id} className="group relative bg-app-surface border border-app-border rounded-xl overflow-hidden hover:border-accent/50 transition-colors flex flex-col">
                                        {/* Preview Area */}
                                        <div className="aspect-video w-full relative bg-app-bg border-b border-app-border">
                                            <MediaPreview media={media} />

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-app-bg/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                                <button
                                                    onClick={() => { onSelect(media.id); onClose(); }}
                                                    className="bg-accent text-slate-950 rounded-full p-2 hover:scale-110 transition-transform shadow-lg shadow-black"
                                                    title="Sélectionner"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        gmPrompt(
                                                            `Renommer ${media.name}`,
                                                            media.name,
                                                            (newName) => {
                                                                if (newName.trim() && newName.trim() !== media.name) {
                                                                    renameMedia(media.id, newName.trim());
                                                                }
                                                            }
                                                        );
                                                    }}
                                                    className="bg-accent/80 text-slate-950 rounded-full p-2 hover:scale-110 transition-transform shadow-lg shadow-black hover:bg-accent"
                                                    title="Renommer"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Supprimer ${media.name} ? Cette action l'effacera de tous les modules.`)) {
                                                            deleteMedia(media.id);
                                                        }
                                                    }}
                                                    className="bg-red-500/80 text-white rounded-full p-2 hover:scale-110 transition-transform shadow-lg shadow-black hover:bg-red-500"
                                                    title="Supprimer définitivement"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info Area */}
                                        <div className="p-3 space-y-2">
                                            <p className="text-xs font-medium text-slate-200 truncate" title={media.name}>
                                                {media.name}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    {TYPE_ICONS[media.type]}
                                                    <span className="text-[10px] text-slate-500 capitalize">{media.type}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-600">{formatSize(media.size)}</span>
                                            </div>

                                            {/* Tags display */}
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {media.tags.map(tag => (
                                                    <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-app-bg text-slate-400 text-[9px] font-bold border border-white/5 group/tag">
                                                        {tag}
                                                        <button
                                                            onClick={() => {
                                                                const nextTags = media.tags.filter(t => t !== tag);
                                                                useMediaStore.getState().updateMediaTags(media.id, nextTags);
                                                            }}
                                                            className="opacity-0 group-hover/tag:opacity-100 hover:text-red-400 transition-opacity"
                                                        >
                                                            <X size={8} />
                                                        </button>
                                                    </span>
                                                ))}
                                                {tagInputId === media.id ? (
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={newTag}
                                                        onChange={e => setNewTag(e.target.value)}
                                                        onKeyDown={async e => {
                                                            if (e.key === 'Enter' && newTag.trim()) {
                                                                const tag = newTag.trim().toLowerCase();
                                                                if (!media.tags.includes(tag)) {
                                                                    await useMediaStore.getState().updateMediaTags(media.id, [...media.tags, tag]);
                                                                }
                                                                setNewTag('');
                                                                setTagInputId(null);
                                                            } else if (e.key === 'Escape') {
                                                                setTagInputId(null);
                                                                setNewTag('');
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setTagInputId(null);
                                                            setNewTag('');
                                                        }}
                                                        className="bg-app-bg border border-accent/30 rounded px-1.5 py-0.5 text-[9px] text-accent outline-none w-16"
                                                        placeholder="tag..."
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => setTagInputId(media.id)}
                                                        className="flex items-center justify-center w-5 h-5 rounded hover:bg-app-bg text-slate-600 hover:text-accent transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tags Sidebar */}
                    <div className="w-64 border-l border-app-border bg-app-surface/40 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-app-border bg-app-surface/40">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Tag size={12} className="text-accent" />
                                Filtrage par Tags
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-1">
                            <button
                                onClick={() => setTagFilter(null)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group ${!tagFilter ? 'bg-accent text-slate-950 shadow-glow-accent' : 'text-slate-400 hover:bg-app-bg hover:text-slate-200'}`}
                            >
                                <span>TOUS LES MÉDIAS</span>
                                <Check size={14} className={!tagFilter ? 'opacity-100' : 'opacity-0'} />
                            </button>

                            <div className="h-4" />

                            {allTags.length === 0 ? (
                                <p className="text-[10px] text-slate-600 italic px-3">Aucun tag créé.</p>
                            ) : (
                                allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-3 group ${tag === tagFilter ? 'bg-app-bg text-accent border border-accent/30' : 'text-slate-500 hover:bg-app-bg/50 hover:text-slate-300'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full transition-all ${tag === tagFilter ? 'bg-accent scale-125' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                                        <span className="flex-1 truncate uppercase tracking-tight">{tag}</span>
                                        <Tag size={12} className={tag === tagFilter ? 'text-accent' : 'text-slate-700 opacity-0 group-hover:opacity-100'} />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
