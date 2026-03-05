import React, { useState, useMemo, useEffect } from 'react';
import { Plus, MoreHorizontal, Music, Link, Edit3, Trash2, GripVertical, CloudSnow, Sword, Skull, Beer, Zap, DoorOpen, StopCircle, History as HistoryIcon, Terminal } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import type { MusicPad as MusicPadType } from '../useMusicStore';
import { gmPrompt, gmConfirm } from '../../../stores/useModalStore';
import { musicEngine } from '../MusicEngine';

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
            gmConfirm(
                "Source de la musique :",
                // Confirm -> Fichier Local
                () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*';
                    input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                            // @ts-expect-error global (Electron)
                            const path = window.appBridge ? (window as any).appBridge.getPathForFile(file) : (file.path || file.name);
                            updatePad(playlistId, index, { url: path, label: file.name, type: 'local' });
                        }
                    };
                    input.click();
                },
                // Cancel -> Lien Externe
                () => {
                    gmPrompt("Lien externe (YouTube, Spotify, Deezer) :", "", (url) => {
                        if (url) {
                            const label = url.split('/').pop()?.split('?')[0] || "Lien Externe";
                            updatePad(playlistId, index, { url, label, type: 'link' });
                        }
                    });
                },
                "Fichier Local",
                "Lien Externe"
            );

            return;
        }
        playPad(pad);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        gmPrompt("Nouveau Label :", pad.label, (newLabel) => {
            if (newLabel) {
                gmPrompt("Nouvelle URL :", pad.url, (newUrl) => {
                    if (newUrl) {
                        const isService = musicEngine.isStreamingService(newUrl);
                        updatePad(playlistId, index, {
                            label: newLabel,
                            url: newUrl,
                            type: isService ? 'link' : 'local'
                        });
                    }
                });
            }
        });
        setIsMenuOpen(false);
    };


    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            // @ts-expect-error global
            const path = window.appBridge ? window.appBridge.getPathForFile(file) : (file.path || file.name);
            updatePad(playlistId, index, { url: path, label: file.name, type: 'local' });
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePadClick(); } }}
            className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all relative group
                ${isPlaying
                    ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(124,59,237,0.4)]'
                    : 'bg-slate-900/60 border-white/5 hover:bg-slate-800 hover:border-white/10'
                } ${isOver ? 'border-primary bg-primary/10' : ''} cursor-pointer`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-1 right-1 p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-300 cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={10} />
            </div>

            <div className={`p-2 rounded-full mb-1 transition-colors ${isPlaying ? 'text-primary' : 'text-slate-600'}`}>
                {pad.type === 'link' ? <Link size={20} /> : <Music size={20} />}
            </div>

            <span className={`text-[9px] font-bold uppercase tracking-tighter px-2 line-clamp-1 ${isPlaying ? 'text-white' : 'opacity-60 text-slate-400'}`}>
                {pad.label}
            </span>

            {/* More Menu Trigger */}
            <div
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }}
                className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white"
            >
                <MoreHorizontal size={12} />
            </div>

            {isMenuOpen && (
                <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col p-2 gap-1 rounded-xl">
                    <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} className="text-[8px] font-bold text-slate-500 mb-1 hover:text-white uppercase tracking-widest text-left">Retour</button>
                    <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 p-1.5 rounded bg-slate-800 hover:bg-primary text-[9px] font-bold text-left"
                    >
                        <Edit3 size={10} /> ÉDITER
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            updatePad(playlistId, index, { url: '', label: `Pad ${index + 1}`, type: 'local' });
                            setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 p-1.5 rounded bg-slate-800 hover:bg-red-600 text-[9px] font-bold text-left"
                    >
                        <Trash2 size={10} /> VIDER
                    </button>
                </div>
            )}
        </div>


    );
};


export const PlaylistSidebar: React.FC = () => {
    const { playlists, activePlaylistId, setActivePlaylistId, addPlaylist, stopAll, history, consoleLogs, outputDeviceId, setOutputDevice } = useMusicStore();
    const currentId = activePlaylistId || playlists[0]?.id;

    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
                setAudioDevices(audioOutputs);
            } catch (err) {
                console.error("Error enumerating audio devices:", err);
            }
        };
        fetchDevices();
        navigator.mediaDevices.addEventListener('devicechange', fetchDevices);
        return () => navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    }, []);

    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('wood') || n.includes('forest') || n.includes('snow')) return <CloudSnow className="text-primary size-5" />;
        if (n.includes('orc') || n.includes('battle') || n.includes('combat')) return <Sword className="size-5" />;
        if (n.includes('abyss') || n.includes('skull') || n.includes('death')) return <Skull className="size-5" />;
        if (n.includes('tavern') || n.includes('inn') || n.includes('city')) return <Beer className="size-5" />;
        return <Music className="size-5" />;
    };

    return (
        <aside className="w-80 bg-slate-900/90 backdrop-blur-md border-r border-slate-800 flex flex-col shrink-0">
            {/* Top spacing instead of header */}
            <div className="h-12" />

            <nav className="flex-1 overflow-y-auto px-10 space-y-10 custom-scrollbar">
                {/* Playlists Section */}
                <div>
                    <div className="px-2 pb-4 flex justify-between items-center border-b border-white/[0.03] mb-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Atmospheres</p>
                        <button
                            onClick={() => gmPrompt("Nouvelle playlist :", "", (n) => n && addPlaylist(n))}
                            className="size-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-primary/50"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {playlists.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActivePlaylistId && setActivePlaylistId(p.id)}
                                className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border transition-all ${currentId === p.id
                                    ? 'border-primary/50 bg-primary/10 text-slate-100 shadow-[0_0_20px_rgba(124,59,237,0.1)]'
                                    : 'border-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-100'
                                    }`}
                            >
                                <span className="flex-shrink-0">
                                    {getIcon(p.name)}
                                </span>
                                <span className="text-sm font-bold truncate tracking-tight">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* History Section */}
                <div className="px-2">
                    <div className="flex items-center justify-center gap-2 mb-4 text-slate-500 text-center">
                        <HistoryIcon size={12} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Recent Activity</p>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-hidden">
                        {history.slice(0, 5).map((track, i) => (
                            <div key={i} className="flex flex-col items-center text-center gap-1">
                                <span className="text-[10px] text-slate-500 truncate w-full font-medium leading-relaxed">{track}</span>
                                <div className="w-8 h-[1px] bg-white/[0.05]" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Log Section */}
                <div className="px-2">
                    <div className="flex items-center justify-center gap-2 mb-4 text-slate-500">
                        <Terminal size={12} />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Engine Log</p>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 font-mono text-[9px] space-y-2 max-h-36 overflow-y-auto custom-scrollbar shadow-inner text-center">
                        {consoleLogs.slice(-10).map((log, i) => (
                            <div key={i} className="text-slate-500 hover:text-slate-300 transition-colors border-b border-white/[0.02] pb-1 last:border-0">
                                <span className="block break-words">{log.replace(/^\[.*?\]\s*/, '')}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Access Section */}
                <div className="pb-8">
                    <div className="px-2 pb-4 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Controls</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/60 transition-all hover:scale-[1.05] active:scale-[0.95]">
                            <Zap size={18} className="text-slate-500 mb-2" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Thunder</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/60 transition-all hover:scale-[1.05] active:scale-[0.95]">
                            <DoorOpen size={18} className="text-slate-500 mb-2" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Door</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center">Audio Output</label>
                    <div className="relative">
                        <select
                            value={outputDeviceId}
                            onChange={(e) => setOutputDevice(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 text-slate-300 text-xs rounded-xl py-2 px-3 focus:ring-1 focus:ring-primary appearance-none cursor-pointer outline-none"
                        >
                            <option value="default">Default System Output</option>
                            {audioDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Speaker ${device.deviceId.substring(0, 5)}...`}
                                </option>
                            ))}
                        </select>
                        <MoreHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none size-3" />
                    </div>
                </div>

                <button
                    onClick={() => stopAll()}
                    className="w-full h-14 flex flex-col items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black text-[10px] tracking-[0.3em] transition-all shadow-lg hover:shadow-red-500/20 active:scale-[0.95]"
                >
                    <StopCircle size={20} className="mb-0.5" />
                    STOP ALL
                </button>
            </div>
        </aside>
    );
};




const PlaylistManager: React.FC = () => {
    const { playlists, activePlaylistId, reorderPads } = useMusicStore();
    const currentPlaylistId = activePlaylistId || playlists[0]?.id;
    const activePlaylist = playlists.find(p => p.id === currentPlaylistId) || playlists[0];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = activePlaylist.pads.findIndex(p => p.id === active.id);
            const newIndex = activePlaylist.pads.findIndex(p => p.id === over.id);
            reorderPads(currentPlaylistId, oldIndex, newIndex);
        }
    };

    const padIds = useMemo(() => activePlaylist?.pads.map(p => p.id) || [], [activePlaylist]);

    if (!activePlaylist) return null;

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pb-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={padIds}
                        strategy={rectSortingStrategy}
                    >
                        {activePlaylist.pads.map((pad, i) => (
                            <Pad key={pad.id} pad={pad} index={i} playlistId={currentPlaylistId} />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};

export default PlaylistManager;

