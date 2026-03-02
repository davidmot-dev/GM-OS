import React from 'react';
import { Link, Edit2, Palette, X } from 'lucide-react';
import type { WebLink } from '../types';
import { useWebStore } from '../useWebStore';

interface WebLinkPadProps {
    link: WebLink;
    onEdit: (link: WebLink) => void;
}

const WebLinkPad: React.FC<WebLinkPadProps> = ({ link, onEdit }) => {
    const { openLink, removeLink } = useWebStore();

    // Mapping colors to Tailwind classes
    const colorClasses: Record<string, string> = {
        orange: 'border-orange-500/30 hover:border-orange-500 text-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/10 hover:bg-orange-500/20',
        cyan: 'border-cyan-500/30 hover:border-cyan-500 text-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-cyan-500/10 hover:bg-cyan-500/20',
        purple: 'border-purple-500/30 hover:border-purple-500 text-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-purple-500/10 hover:bg-purple-500/20',
        emerald: 'border-emerald-500/30 hover:border-emerald-500 text-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-500/10 hover:bg-emerald-500/20',
        amber: 'border-amber-500/30 hover:border-amber-500 text-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-amber-500/10 hover:bg-amber-500/20',
        rose: 'border-rose-500/30 hover:border-rose-500 text-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] bg-rose-500/10 hover:bg-rose-500/20',
        default: 'border-slate-700/30 hover:border-slate-500 text-slate-400 hover:shadow-lg bg-slate-800/10 hover:bg-slate-800/20'
    };

    const currentClasses = colorClasses[link.color] || colorClasses.default;

    return (
        <div
            className={`relative group aspect-square rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden p-4 ${currentClasses}`}
            onClick={() => openLink(link.url)}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${currentClasses.split(' ').find(c => c.startsWith('bg-'))}`}>
                <Link size={24} className={currentClasses.split(' ').find(c => c.startsWith('text-'))} />
            </div>

            <span className="text-xs font-medium text-slate-300 text-center truncate w-full">
                {link.name}
            </span>

            {/* Overlay Controls */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center gap-2 px-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(link); }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
                    title="Edit"
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(link); }} // Palette opens edit for now
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
                    title="Palette"
                >
                    <Palette size={18} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); removeLink(link.id); }}
                    className="p-2 bg-red-900/50 hover:bg-red-800/70 rounded-lg text-red-100 transition-colors"
                    title="Remove"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default WebLinkPad;
