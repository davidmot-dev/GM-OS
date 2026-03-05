import React, { useRef } from 'react';
// Let's use Lucide icons since it's the standard in this project.
import {
    Grid as GridIcon, UploadCloud, Ban, Folder as FolderIcon, History as HistoryIcon,
    Star as StarIcon, Search as SearchIcon,
    Filter, Plus, MonitorPlay
} from 'lucide-react';

import { useImageStore } from './useImageStore';
import ImagePad from './components/ImagePad';

const ImageDashboard: React.FC = () => {
    const {
        mediaList, projectionTarget, setProjectionTarget,
        projectSequence, blackout, addMedia, displays, fetchDisplays,
        folders, activeFolderId, setActiveFolderId, addFolder, removeFolder,
        currentView, setCurrentView
    } = useImageStore();

    React.useEffect(() => {
        fetchDisplays();
    }, [fetchDisplays]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            // @ts-expect-error global
            const rawPath = window.appBridge ? window.appBridge.getPathForFile(file) : (file.path || file.name);
            // @ts-expect-error global
            const formattedPath = window.appBridge?.utils?.formatFileUrl ? window.appBridge.utils.formatFileUrl(rawPath) : rawPath.replace(/\\/g, '/');

            addMedia({
                name: file.name,
                path: formattedPath,
                sizeInfo: `${(file.size / (1024 * 1024)).toFixed(1)}MB`
            });
        });

        // reset format
        e.target.value = '';
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

    const handleLaunchHub = () => {
        if (window.appBridge?.session?.launchHubWindow) {
            window.appBridge.session.launchHubWindow();
        } else {
            alert("Veuillez lancer le Player Hub dans un onglet `http://localhost:5173/?window=hub`");
        }
    };

    return (
        <div className="flex h-full bg-slate-950 font-display text-slate-100 overflow-hidden">
            <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {/* Left Sidebar */}
            <aside className="w-80 bg-slate-900/90 backdrop-blur-md border-r border-slate-800 p-5 flex flex-col gap-6 flex-shrink-0">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white">
                        <GridIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white leading-none">Image OS</h1>
                        <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Media Manager</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleUploadClick}
                        className="w-full bg-sky-500 hover:bg-sky-500/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-500/40 transition-all flex items-center justify-center gap-2"
                    >
                        <UploadCloud size={20} />
                        UPLOAD
                    </button>
                    <button
                        onClick={blackout}
                        className="w-full bg-rose-950/40 border border-rose-500/50 text-rose-500 hover:bg-rose-600 hover:text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Ban size={20} />
                        BLACKOUT
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase px-2 tracking-wider">Navigation</h3>
                    <nav className="flex flex-col gap-1">
                        <div
                            onClick={() => { setCurrentView('library'); setActiveFolderId(null); }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentView === 'library' && activeFolderId === null ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:bg-slate-800/50'
                                }`}
                        >
                            <FolderIcon size={18} />
                            <span className="text-sm font-medium">Media Library</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/50 transition-colors cursor-pointer opacity-50">
                            <HistoryIcon size={18} />
                            <span className="text-sm font-medium">Recent Uploads</span>
                        </div>
                        <div
                            onClick={() => setCurrentView('favorites')}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentView === 'favorites' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:bg-slate-800/50'
                                }`}
                        >
                            <StarIcon size={18} />
                            <span className="text-sm font-medium">Favorites</span>
                        </div>
                    </nav>
                </div>

                <div className="bg-slate-800/30 p-3 rounded-lg flex-grow overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Folder Tree</h3>
                        <button onClick={handleCreateFolder} className="text-slate-400 hover:text-sky-400 transition-colors" title="Nouveau dossier">
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                onClick={() => { setCurrentView('library'); setActiveFolderId(folder.id); }}
                                className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${currentView === 'library' && activeFolderId === folder.id ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                    }`}
                            >
                                <FolderIcon size={14} className={activeFolderId === folder.id ? "text-sky-400" : ""} />
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

                <div className="mt-auto pt-4 border-t border-slate-800 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        <span>Local Storage</span>
                        <span>{mediaList.length} Items</span>
                    </div>
                </div>
            </aside>

            {/* Central Grid */}
            <main className="flex-1 bg-slate-950 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                {/* Top Nav */}
                <header className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 uppercase">Target Screen:</span>
                            <div className="flex bg-slate-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setProjectionTarget('hub')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${projectionTarget === 'hub'
                                        ? 'bg-sky-500 text-white shadow-md'
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
                                            ? 'bg-sky-500 text-white shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleLaunchHub}
                            className="text-slate-400 hover:text-white mt-1 ml-4 py-1.5 flex items-center gap-1 transition-colors"
                            title="Launch Hub Window"
                        >
                            <MonitorPlay size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Launch Hub</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                className="bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-sky-500 text-white"
                                placeholder="Search assets..."
                                type="text"
                            />
                        </div>

                        <button
                            onClick={projectSequence}
                            className="bg-sky-500 text-white px-6 py-2 rounded-xl font-bold text-sm tracking-wide shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            PROJECT SEQUENCE
                        </button>

                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                            {/* Dummy Profile */}
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-white font-bold">GM</div>
                        </div>
                    </div>
                </header>

                {/* Filters & Tabs */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-4">
                        <button className="text-white font-bold border-b-2 border-sky-500 pb-2 text-sm">{currentFolderName}</button>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
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
                        className="group aspect-video rounded-2xl bg-slate-900/20 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-3 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-colors">
                            <Plus size={24} />
                        </div>
                        <p className="text-slate-500 font-bold text-sm group-hover:text-sky-400 transition-colors">Add New Media</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ImageDashboard;
