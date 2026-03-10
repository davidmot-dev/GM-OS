import React from 'react';
// Let's use Lucide icons since it's the standard in this project.
import {
    Ban, Folder as FolderIcon, History as HistoryIcon,
    Star as StarIcon, Search as SearchIcon,
    Filter, Plus, RotateCcw
} from 'lucide-react';

import { useImageStore } from './useImageStore';
import ImagePad from './components/ImagePad';
import { MediaBrowser } from '../../components/MediaBrowser';
import { useMediaStore } from '../../stores/useMediaStore';
import { gmConfirm } from '../../stores/useModalStore';

const ImageDashboard: React.FC = () => {
    const {
        mediaList, projectionTarget, setProjectionTarget,
        projectSequence, blackout, blackoutAll, addMedia, displays, fetchDisplays,
        folders, activeFolderId, setActiveFolderId, addFolder, removeFolder,
        currentView, setCurrentView, reset
    } = useImageStore();

    React.useEffect(() => {
        fetchDisplays();
    }, [fetchDisplays]);

    const { mediaList: storeMediaList } = useMediaStore();
    const [isBrowserOpen, setIsBrowserOpen] = React.useState(false);

    const handleUploadClick = () => {
        setIsBrowserOpen(true);
    };

    const handleMediaSelect = (mediaId: string) => {
        const media = storeMediaList.find(m => m.id === mediaId);
        if (!media) return;

        addMedia({
            name: media.name,
            path: mediaId,
            sizeInfo: `${(media.size / (1024 * 1024)).toFixed(1)}MB`
        });
    };

    const handleCreateFolder = () => {
        const name = prompt('Nom du nouveau dossier :');
        if (name) {
            addFolder(name);
        }
    };

    let displayedMedia = mediaList;
    if (currentView === 'favorites') {
        displayedMedia = mediaList.filter(m => m.isFavorite);
    } else if (activeFolderId) {
        displayedMedia = mediaList.filter(m => m.folderId === activeFolderId);
    }

    const currentFolderName = currentView === 'favorites'
        ? 'Favorites'
        : (activeFolderId
            ? folders.find(f => f.id === activeFolderId)?.name || 'Inconnu'
            : 'All Media');


    return (
        <div className="flex h-full bg-app-bg font-display text-app-text overflow-hidden">
            <MediaBrowser
                isOpen={isBrowserOpen}
                onClose={() => setIsBrowserOpen(false)}
                onSelect={handleMediaSelect}
                allowedTypes={['image']}
                title="Importer des Images"
            />


            {/* Left Sidebar */}
            <aside className="w-80 bg-app-surface/90 backdrop-blur-md border-r border-app-border p-5 flex flex-col gap-6 flex-shrink-0">


                <div className="flex flex-col gap-3 px-2">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={blackout}
                            className="bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/40 font-black py-4 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 text-[10px] tracking-[0.2em] group"
                            title="Éteindre l'écran cible uniquement"
                        >
                            <div className="p-2 rounded-full bg-rose-500/10 group-hover:scale-110 transition-transform shadow-glow-rose">
                                <Ban size={18} />
                            </div>
                            TARGET
                        </button>
                        <button
                            onClick={blackoutAll}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl shadow-glow-rose transition-all flex flex-col items-center justify-center gap-2 text-[10px] tracking-[0.2em] group"
                            title="Éteindre TOUS les écrans"
                        >
                            <div className="p-2 rounded-full bg-white/20 group-hover:scale-110 transition-transform shadow-lg">
                                <Ban size={18} />
                            </div>
                            ALL
                        </button>
                    </div>

                    <button
                        onClick={() => gmConfirm("Voulez-vous vraiment réinitialiser le module Image OS ? Toutes les images, dossiers et projections seront perdus.", () => reset())}
                        className="w-full bg-app-bg/60 border border-red-500/10 text-red-500/40 hover:bg-red-500/10 hover:text-red-500 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase hover:border-red-500/30 group"
                        title="Réinitialiser le module"
                    >
                        <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
                        RESTORE DEFAULT
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase px-2 tracking-wider">Navigation</h3>
                    <nav className="flex flex-col gap-1">
                        <div
                            onClick={() => { setCurrentView('library'); setActiveFolderId(null); }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentView === 'library' && activeFolderId === null ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:bg-app-surface/50'}`}
                        >
                            <FolderIcon size={18} />
                            <span className="text-sm font-medium">Media Library</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-app-surface/50 transition-colors cursor-pointer opacity-50">
                            <HistoryIcon size={18} />
                            <span className="text-sm font-medium">Recent Uploads</span>
                        </div>
                        <div
                            onClick={() => setCurrentView('favorites')}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentView === 'favorites' ? 'bg-accent/20 text-accent' : 'text-slate-400 hover:bg-app-surface/50'}`}
                        >
                            <StarIcon size={18} />
                            <span className="text-sm font-medium">Favorites</span>
                        </div>
                    </nav>
                </div>

                <div className="bg-app-surface/30 p-3 rounded-lg flex-grow overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Folder Tree</h3>
                        <button onClick={handleCreateFolder} className="text-slate-400 hover:text-accent transition-colors" title="Nouveau dossier">
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                onClick={() => { setCurrentView('library'); setActiveFolderId(folder.id); }}
                                className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${currentView === 'library' && activeFolderId === folder.id ? 'bg-app-surface text-accent' : 'text-slate-400 hover:bg-app-surface/50 hover:text-white'}`}
                            >
                                <FolderIcon size={14} className={activeFolderId === folder.id ? "text-accent" : ""} />
                                <span className="flex-1 truncate">{folder.name}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFolder(folder.id); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1"
                                    title="Supprimer dossier"
                                >
                                    <Ban size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-app-border flex flex-col gap-3">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        <span>Local Storage</span>
                        <span>{mediaList.length} Items</span>
                    </div>
                </div>
            </aside>

            {/* Central Grid */}
            <main className="flex-1 bg-app-bg p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                {/* Top Nav */}
                <header className="flex items-center justify-between bg-app-surface/50 p-4 rounded-2xl border border-app-border">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 uppercase">Target Screen:</span>
                            <div className="flex bg-app-surface p-1 rounded-xl">
                                <button
                                    onClick={() => setProjectionTarget('hub')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${projectionTarget === 'hub'
                                        ? 'bg-accent text-slate-950 shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    Player Hub
                                </button>
                                {displays.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setProjectionTarget(d.id)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${projectionTarget === d.id
                                            ? 'bg-accent text-slate-950 shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                className="bg-app-surface border-none rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-accent text-white"
                                placeholder="Search assets..."
                                type="text"
                            />
                        </div>

                        <button
                            onClick={projectSequence}
                            className="bg-accent text-slate-950 px-6 py-2 rounded-xl font-bold text-sm tracking-wide shadow-glow-accent hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            PROJECT SEQUENCE
                        </button>

                        <div className="w-10 h-10 rounded-full bg-app-surface border border-app-border flex items-center justify-center overflow-hidden">
                            {/* Dummy Profile */}
                            <div className="w-full h-full bg-app-surface flex items-center justify-center text-white font-bold">GM</div>
                        </div>
                    </div>
                </header>

                {/* Filters & Tabs */}
                <div className="flex items-center justify-between mt-2">
                    <div className="mt-4 flex gap-6">
                        <button className="text-app-text font-bold border-b-2 border-accent pb-2 text-sm">{currentFolderName}</button>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg bg-app-bg border border-app-border text-slate-400 hover:text-white transition-colors">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedMedia.map(media => (
                        <ImagePad key={media.id} media={media} />
                    ))}

                    {/* Empty State / Add New */}
                    <div
                        onClick={handleUploadClick}
                        className="group aspect-video rounded-2xl bg-app-surface/20 border-2 border-dashed border-app-border flex flex-col items-center justify-center gap-3 hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full bg-app-surface flex items-center justify-center text-accent group-hover:bg-accent/20 group-hover:text-accent transition-colors">
                            <Plus size={24} />
                        </div>
                        <p className="text-slate-500 font-bold text-sm group-hover:text-accent transition-colors">Add New Media</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ImageDashboard;
