import React from 'react';
import { X, Star } from 'lucide-react';
import type { ImageMedia } from '../types';
import { useImageStore } from '../useImageStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';

interface ImagePadProps {
    media: ImageMedia;
}

const ImagePad: React.FC<ImagePadProps> = ({ media }) => {
    const {
        projections, displays,
        projectSolo, toggleMediaActive, removeMedia,
        folders, moveMediaToFolder, toggleMediaFavorite
    } = useImageStore();

    // Find all targets currently projecting this media
    const activeTargets = Object.entries(projections)
        .filter(([, mediaId]) => mediaId === media.id)
        .map(([targetId]) => {
            if (targetId === 'hub') return 'Player Hub';
            return displays.find(d => d.id === targetId)?.label || `Screen ${targetId}`;
        });

    const isProjected = activeTargets.length > 0;

    // Use the Stitch HTML styling, adapting active / playing states
    const borderClass = isProjected
        ? "ring-4 ring-accent shadow-glow-accent border-white/5"
        : "border-white/5 hover:border-accent/50 hover:shadow-glow-accent";

    const resolvedUrl = useMediaUrl(media.path);
    const safePath = resolvedUrl || '';

    return (
        <div
            onClick={() => projectSolo(media)}
            className={`group aspect-video rounded-2xl bg-app-surface/40 border overflow-hidden relative cursor-pointer transition-all ${borderClass}`}
        >
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url('${safePath}')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-app-bg/90 via-transparent to-transparent"></div>

            {isProjected && (
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {activeTargets.map(targetLabel => (
                        <span
                            key={targetLabel}
                            className={`${targetLabel === 'Player Hub' ? 'bg-accent text-slate-950' : 'bg-amber-500 text-white'} text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-lg whitespace-nowrap`}
                        >
                            {targetLabel}
                        </span>
                    ))}
                </div>
            )}

            {/* Top Right Controls: Checkbox for Sequence and Remove */}
            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                <button
                    onClick={(e) => { e.stopPropagation(); toggleMediaFavorite(media.id); }}
                    className={`p-1 rounded-md transition-colors ${media.isFavorite ? 'bg-yellow-500/80 text-white' : 'bg-app-surface/50 text-slate-400 hover:text-yellow-400'}`}
                    title={media.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                    <Star size={14} fill={media.isFavorite ? "currentColor" : "none"} />
                </button>

                <input
                    type="checkbox"
                    checked={media.active}
                    onChange={() => toggleMediaActive(media.id)}
                    className="w-4 h-4 rounded border-app-border bg-app-surface/50 text-accent cursor-pointer focus:ring-0 focus:ring-offset-0"
                    title="Inclure dans la séquence"
                />

                <button
                    onClick={(e) => { e.stopPropagation(); removeMedia(media.id); }}
                    className="p-1 bg-red-900/40 hover:bg-red-600 text-white rounded-md transition-colors"
                    title="Retirer"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <button
                    onClick={() => projectSolo(media)}
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 pointer-events-auto shadow-lg"
                >
                    SOLO
                </button>
            </div>

            <div className="absolute bottom-0 w-full p-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-sm font-bold text-white truncate drop-shadow-md group-hover:text-accent transition-colors">
                            {media.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            {media.sizeInfo && (
                                <span className="text-[10px] text-slate-300 font-mono bg-app-bg/40 px-1.5 py-0.5 rounded">
                                    {media.sizeInfo}
                                </span>
                            )}
                            <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                <select
                                    value={media.folderId || ''}
                                    onChange={(e) => moveMediaToFolder(media.id, e.target.value || null)}
                                    className="text-[10px] text-slate-300 font-mono bg-app-bg/60 border border-app-border rounded px-1 py-0.5 focus:outline-none focus:border-accent hover:bg-app-bg/80 cursor-pointer pointer-events-auto"
                                    onClick={(e) => e.stopPropagation()} // Prevent trigger solo
                                >
                                    <option value="">Root</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImagePad;
