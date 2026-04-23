import React, { useState, useMemo, useEffect } from 'react';
import { Music, Link, Edit3, Trash2, GripVertical, MoreHorizontal, Lightbulb } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import type { MusicPad as MusicPadType } from '../useMusicStore';
import { gmPrompt, gmConfirm, gmCustom } from '../../../stores/useModalStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaStore } from '../../../stores/useMediaStore';

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

const Pad: React.FC<{ pad: MusicPadType; index: number; playlistId: string; onRequestMediaBrowser: () => void }> = ({ pad, index, playlistId, onRequestMediaBrowser }) => {
    const { playPad, updatePad, deckA, deckB, isKeyLearnActive, activePadLearnInfo, setActiveLearnPad } = useMusicStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOver, setIsOver] = useState(false);

    const isPlayingOnA = deckA.activePadId === pad.id && deckA.isPlaying;
    const isPlayingOnB = deckB.activePadId === pad.id && deckB.isPlaying;
    const isPlaying = isPlayingOnA || isPlayingOnB;

    const isLearningThis = activePadLearnInfo?.playlistId === playlistId && activePadLearnInfo?.padIndex === index;

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
        if (isKeyLearnActive) {
            setActiveLearnPad(playlistId, index);
            return;
        }

        if (isMenuOpen) return;
        if (!pad.url) {
            gmConfirm(
                "Source de la musique :",
                // Confirm -> Fichier Local
                () => {
                    onRequestMediaBrowser();
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
                updatePad(playlistId, index, { label: newLabel });
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

    const keyLabel = pad.keybind ? pad.keybind.replace('Key', '').replace('Numpad', 'NUM ') : '';

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
            className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-300 relative group overflow-hidden shadow-2xl
                ${isLearningThis
                    ? 'border-cyan-500 bg-cyan-900/40 shadow-glow-cyan'
                    : isPlaying
                        ? 'bg-accent/40 border-accent shadow-glow-accent animate-jitter scale-[1.05]'
                        : 'bg-app-bg/40 border-app-border/50 hover:bg-app-surface/60 hover:border-accent/40 hover:shadow-glow-accent/20 hover:scale-[1.02]'
                } ${isOver && !isLearningThis ? 'border-accent bg-accent/10' : ''} cursor-pointer`}
        >
            {/* Premium Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.08] via-transparent to-transparent pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Keybind Indicator */}
            {keyLabel && (
                <div className={`absolute top-2 left-2 border text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-sm transition-all uppercase tracking-widest ${isLearningThis ? 'bg-cyan-900 text-cyan-400 border-cyan-500' : 'bg-app-bg text-slate-500 border-app-border/50 opacity-60 group-hover:opacity-100 group-hover:text-accent group-hover:border-accent/40'}`}>
                    {keyLabel}
                </div>
            )}

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className={`absolute top-2 right-2 p-1.5 text-slate-700 hover:text-white cursor-grab active:cursor-grabbing ${isLearningThis ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}
            >
                <GripVertical size={12} />
            </div>

            {/* Light Link Indicator */}
            {pad.linkedLightSceneId && (
                <div className="absolute bottom-2 left-2 p-1.5 text-gm-cyan drop-shadow-glow-cyan animate-pulse">
                    <Lightbulb size={12} fill="currentColor" />
                </div>
            )}

            <div className={`transition-all duration-500 ${isPlaying || isLearningThis ? (isLearningThis ? 'text-cyan-400 scale-110 drop-shadow-glow-cyan' : 'text-accent scale-110 drop-shadow-glow-accent') : 'text-slate-700 group-hover:text-accent/70'}`}>
                {pad.type === 'link' ? <Link size={36} strokeWidth={1} /> : <Music size={36} strokeWidth={1} />}
            </div>

            <div className="mt-3 px-3 w-full text-center">
                <span className={`text-[10px] font-black uppercase tracking-widest line-clamp-1 transition-colors ${isPlaying || isLearningThis ? 'text-white drop-shadow-sm' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {pad.label}
                </span>
                <div className="text-[7px] font-black text-white/20 mt-0.5 uppercase tracking-tighter">[{pad.id}]</div>
                {isPlaying && (
                    <div className="flex justify-center gap-0.5 mt-1.5">
                        <div className="w-0.5 h-2 bg-accent rounded-full animate-bounce shadow-glow-accent" style={{ animationDelay: '0ms' }} />
                        <div className="w-0.5 h-2 bg-accent rounded-full animate-bounce shadow-glow-accent" style={{ animationDelay: '100ms' }} />
                        <div className="w-0.5 h-2 bg-accent rounded-full animate-bounce shadow-glow-accent" style={{ animationDelay: '200ms' }} />
                    </div>
                )}
            </div>

            {/* More Menu Trigger */}
            <div
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }}
                className={`absolute bottom-2 right-2 p-1.5 text-slate-700 hover:text-white ${isLearningThis ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}
            >
                <MoreHorizontal size={14} />
            </div>

            {isMenuOpen && !isLearningThis && (
                <div className="absolute inset-0 bg-app-bg/98 z-50 flex flex-col items-center justify-center p-4 gap-2 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} className="text-[9px] font-black text-slate-500 mb-2 hover:text-white uppercase tracking-[0.2em]">Retour</button>
                    <button
                        onClick={handleEdit}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-app-surface border border-app-border/50 hover:bg-accent hover:border-accent text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <Edit3 size={12} /> ÉDITER
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            updatePad(playlistId, index, { 
                                url: '', 
                                label: `Pad ${index + 1}`, 
                                type: 'local', 
                                keybind: undefined,
                                linkedLightSceneId: undefined,
                                loopA: null,
                                loopB: null
                            });
                            setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-app-surface border border-app-border/50 hover:bg-red-600 hover:border-red-600 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <Trash2 size={12} /> VIDER
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            gmCustom('light-scene-select', { 
                                type: 'music', 
                                playlistId, 
                                padIndex: index 
                            });
                            setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${pad.linkedLightSceneId ? 'bg-gm-cyan/20 border-gm-cyan text-gm-cyan' : 'bg-app-surface border-app-border/50 hover:bg-gm-cyan hover:border-gm-cyan'}`}
                    >
                        <Lightbulb size={12} /> {pad.linkedLightSceneId ? 'LIÉ' : 'LIER LUMIÈRE'}
                    </button>
                </div>
            )}
        </div>
    );
};


const PlaylistManager: React.FC = () => {
    const { playlists, activePlaylistId, setActivePlaylistId, reorderPads, updatePad } = useMusicStore();
    const currentPlaylistId = activePlaylistId || playlists[0]?.id;
    const activePlaylist = playlists.find(p => p.id === currentPlaylistId) || playlists[0];

    // Auto-select first playlist if none is active
    useEffect(() => {
        if (!activePlaylistId && activePlaylist) {
            setActivePlaylistId(activePlaylist.id);
        }
    }, [activePlaylistId, activePlaylist, setActivePlaylistId]);

    // Media Browser State
    const [browserTarget, setBrowserTarget] = useState<{ index: number, playlistId: string } | null>(null);

    const handleMediaSelect = (mediaId: string) => {
        if (browserTarget) {
            const { mediaList } = useMediaStore.getState();
            const media = mediaList.find((m: { id: string; name: string }) => m.id === mediaId);
            if (media) {
                updatePad(browserTarget.playlistId, browserTarget.index, { url: mediaId, label: media.name, type: 'local' });
            }
            setBrowserTarget(null);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = activePlaylist.pads.findIndex(p => p.id === active.id);
            const newIndex = activePlaylist.pads.findIndex(p => p.id === over.id);
            reorderPads(activePlaylist.id, oldIndex, newIndex);
        }
    };

    const padIds = useMemo(() => activePlaylist?.pads.map(p => p.id) || [], [activePlaylist]);

    if (!activePlaylist) return null;

    return (
        <div className="flex flex-col h-full">
            <MediaBrowser
                isOpen={!!browserTarget}
                onClose={() => setBrowserTarget(null)}
                onSelect={handleMediaSelect}
                allowedTypes={['audio']}
                title="Sélectionner une Musique"
            />
            <div className="grid grid-cols-5 gap-6 pb-8 w-full">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={padIds.slice(0, 5)}
                        strategy={rectSortingStrategy}
                    >
                        {activePlaylist.pads.slice(0, 5).map((pad, i) => {
                            const actualPLId = activePlaylist.id;
                            return (
                                <Pad
                                    key={pad.id}
                                    pad={pad}
                                    index={i}
                                    playlistId={actualPLId}
                                    onRequestMediaBrowser={() => setBrowserTarget({ index: i, playlistId: actualPLId })}
                                />
                            );
                        })}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};

export default PlaylistManager;

