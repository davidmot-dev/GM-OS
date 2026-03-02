import React, { useState, useMemo } from 'react';
import { Plus, MoreHorizontal, Music, Link, Edit3, Trash2, GripVertical } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import type { MusicPad as MusicPadType } from '../useMusicStore';
import { gmConfirm, gmPrompt } from '../../../stores/useModalStore';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const Pad: React.FC<{ pad: MusicPadType; index: number; playlistId: string }> = ({ pad, index, playlistId }) => {
    const { playPad, updatePad, deckA, deckB } = useMusicStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOver, setIsOver] = useState(false);

    const isPlayingOnA = deckA.activePadId === pad.id && deckA.isPlaying;
    const isPlayingOnB = deckB.activePadId === pad.id && deckB.isPlaying;
    const isPlaying = isPlayingOnA || isPlayingOnB;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: pad.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    const handlePadClick = () => {
        if (isMenuOpen) return;
        if (!pad.url) {
            // Un pad vide est cliqué, on demande une URL système
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    // @ts-expect-error global
                    const path = window.appBridge ? window.appBridge.getPathForFile(file) : (file.path || file.name);
                    updatePad(playlistId, index, { url: path, label: file.name });
                }
            };
            input.click();
            return;
        }
        playPad(pad);
    };

    // External File Drop Handlers
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            // Utilisation du bridge pour récupérer le chemin réel (Electron requirement)
            // @ts-expect-error - appBridge est injecté par preload.ts
            const path = window.appBridge ? window.appBridge.getPathForFile(file) : (file.path || file.name);

            updatePad(playlistId, index, {
                url: path,
                label: file.name
            });
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={handlePadClick}
            onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={onDrop}
            className={`relative group aspect-video rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-2 text-center select-none 
                ${isOver ? 'bg-gm-violet/20 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]' :
                    isPlaying ? 'bg-gm-violet/20 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] ring-1 ring-violet-500/50' :
                        'bg-slate-900/80 border-slate-700/50 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                }`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 right-2 p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-300 cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={14} />
            </div>

            {/* Pad Type Icon */}
            <div className="absolute top-2 left-2 opacity-30 group-hover:opacity-100 transition-opacity">
                {pad.type === 'local' ? <Music size={12} className="text-slate-400" /> : <Link size={12} className="text-violet-400" />}
            </div>

            {/* More Menu */}
            <button
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                className="absolute bottom-1 right-1 p-1 text-slate-500 hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100"
            >
                <MoreHorizontal size={14} />
            </button>

            {isMenuOpen && (
                <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col p-2 gap-1 animate-in fade-in zoom-in duration-150">
                    <button onClick={() => setIsMenuOpen(false)} className="text-[9px] uppercase font-bold text-slate-500 mb-2 hover:text-white">Retour</button>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-800 hover:bg-gm-violet text-[10px] font-bold transition-all">
                        <Edit3 size={10} /> ÉDITER
                    </button>
                    <button
                        onClick={() => {
                            updatePad(playlistId, index, { url: '', label: `Pad ${index + 1}` });
                            setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-800 hover:bg-red-600 text-[10px] font-bold transition-all"
                    >
                        <Trash2 size={10} /> VIDER
                    </button>
                </div>
            )}

            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors line-clamp-2 uppercase tracking-tight px-1">
                {pad.label}
            </span>

            {/* Play Overlay Feedback on hover */}
            <div className={`absolute inset-0 bg-slate-950/40 transition-opacity flex items-center justify-center pointer-events-none ${isPlaying ? 'opacity-100 bg-slate-950/20' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg border backdrop-blur-sm transition-all ${isPlaying ? 'bg-red-600/80 border-red-400/50 animate-pulse' : 'bg-gm-violet/80 border-violet-400/50'}`}>
                    {pad.url ? (isPlaying ? <div className="w-3 h-3 bg-white rounded-sm" /> : <Music size={18} className="translate-x-[1px]" />) : <Plus size={18} />}
                </div>
            </div>
        </div>
    );
};

const PlaylistManager: React.FC = () => {
    const { playlists, activePlaylistId, addPlaylist, reorderPads, clearPlaylistPads } = useMusicStore();
    const [currentPlaylistId, setCurrentPlaylistId] = useState(activePlaylistId || playlists[0].id);

    const activePlaylist = playlists.find(p => p.id === currentPlaylistId) || playlists[0];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = activePlaylist.pads.findIndex(p => p.id === active.id);
            const newIndex = activePlaylist.pads.findIndex(p => p.id === over.id);

            reorderPads(currentPlaylistId, oldIndex, newIndex);
        }
    };

    const padIds = useMemo(() => activePlaylist.pads.map(p => p.id), [activePlaylist]);

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex items-center px-6 py-3 border-b border-slate-800/50 bg-slate-900/60 gap-4 overflow-x-auto no-scrollbar">
                {playlists.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setCurrentPlaylistId(p.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${currentPlaylistId === p.id
                            ? 'bg-gm-violet/10 border-violet-500/50 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                            : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {p.name}
                    </button>
                ))}
                <button
                    onClick={() => {
                        gmPrompt("Nom de la playlist :", "", (name) => {
                            if (name) addPlaylist(name);
                        });
                    }}
                    className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all ml-2"
                    title="Ajouter une playlist"
                >
                    <Plus size={14} />
                </button>
                <div className="h-6 w-px bg-slate-800 mx-1" />
                <button
                    onClick={() => {
                        gmConfirm("Voulez-vous vraiment vider tous les pads de cette playlist ?", () => {
                            clearPlaylistPads(currentPlaylistId);
                        });
                    }}
                    className="p-1.5 rounded-full bg-slate-800 text-slate-500 hover:bg-red-900/30 hover:text-red-500 transition-all"
                    title="Vider tous les pads"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Pad Grid with DND */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[radial-gradient(circle_at_bottom,rgba(29,78,216,0.03),transparent_70%)]">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={padIds}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {activePlaylist.pads.map((pad, i) => (
                                <Pad key={pad.id} pad={pad} index={i} playlistId={activePlaylist.id} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};

export default PlaylistManager;
