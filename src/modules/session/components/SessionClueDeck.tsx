import React, { useRef } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useImageStore } from '../../image/useImageStore';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import { Share2, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';

const SessionClueDeck: React.FC = () => {
    const { clues, activeCampaignId } = useSessionOSStore();
    const { projectEntity } = useImageStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Only show revealed clues in the deck for the GM AND the active campaign
    const revealedClues = clues.filter(c => c.isRevealed && c.campaignId === activeCampaignId);

    const handleProject = (clue: { id: string; title: string; mediaUrl?: string; content: string }) => {
        projectEntity({
            id: clue.id,
            type: 'evidence',
            name: clue.title,
            imageUrl: clue.mediaUrl,
            description: clue.content
        });
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (clues.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 group/deck">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1 px-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                        Deck de Session
                    </div>
                    <span className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest">
                        Indices Révélés ({revealedClues.length})
                    </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover/deck:opacity-100 transition-opacity">
                    <button 
                        onClick={() => scroll('left')}
                        className="p-1 rounded-full bg-app-surface border border-app-border/40 text-app-text/40 hover:text-accent transition-all"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button 
                        onClick={() => scroll('right')}
                        className="p-1 rounded-full bg-app-surface border border-app-border/40 text-app-text/40 hover:text-accent transition-all"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar snap-x snap-mandatory"
            >
                {revealedClues.length === 0 ? (
                    <div className="flex-shrink-0 w-full h-32 rounded-2xl border border-dashed border-app-border/20 flex flex-col items-center justify-center text-app-text/20">
                        <Search size={24} className="mb-2 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Aucun indice révélé</span>
                    </div>
                ) : (
                    revealedClues.map(clue => (
                        <ClueCard key={clue.id} clue={clue} onProject={() => handleProject(clue)} />
                    ))
                )}

                {/* Quick Add Placeholder */}
                <button 
                    onClick={() => useSessionOSStore.getState().setCurrentView('world-atlas')}
                    className="flex-shrink-0 w-48 h-32 rounded-2xl border-2 border-dashed border-app-border/10 hover:border-accent/30 hover:bg-accent/5 flex flex-col items-center justify-center gap-2 text-app-text/20 hover:text-accent transition-all group/add snap-start"
                >
                    <FileText size={20} className="group-hover/add:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Gérer les indices</span>
                </button>
            </div>
        </div>
    );
};

interface ClueCardProps {
    clue: {
        id: string;
        title: string;
        content: string;
        mediaUrl?: string;
        revealedAt?: number;
        campaignMoment?: string;
    };
    onProject: () => void;
}

const ClueCard: React.FC<ClueCardProps> = ({ clue, onProject }) => {
    return (
        <div className="flex-shrink-0 w-64 h-32 rounded-2xl bg-app-surface/60 border border-white/5 relative overflow-hidden group snap-start hover:border-accent/40 transition-all shadow-xl">
            {/* Background Image with blur */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
                <ResolvedAsset src={clue.mediaUrl} className="w-full h-full object-cover blur-[2px]" />
            </div>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

            <div className="absolute inset-x-0 top-3 px-4 flex justify-between items-start z-10">
                <span className="text-[8px] font-black text-accent uppercase tracking-widest bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                    Indice
                </span>
                {clue.revealedAt && (
                    <span className="text-[7px] font-bold text-white/20 uppercase tracking-tighter">
                        {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(clue.revealedAt)}
                    </span>
                )}
            </div>

            <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <div className="flex flex-col gap-0.5 mb-1">
                    <h4 className="text-white text-xs font-bold truncate group-hover:text-accent transition-colors">
                        {clue.title}
                    </h4>
                    {clue.campaignMoment && (
                        <span className="text-[7px] font-black text-white/30 uppercase tracking-widest truncate">
                            {clue.campaignMoment}
                        </span>
                    )}
                </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 p-4">
                <p className="text-[10px] text-white/60 line-clamp-2 text-center italic mb-1 px-2">
                    {clue.content}
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={onProject}
                        className="flex items-center gap-2 px-3 py-1.5 bg-accent text-app-bg rounded-lg text-[10px] font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-glow-accent/20"
                    >
                        <Share2 size={12} />
                        Projeter
                    </button>
                    <button 
                        onClick={() => useSessionOSStore.getState().setCurrentView('world-atlas')}
                        className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                    >
                        <Search size={14} />
                    </button>
                </div>
            </div>

            {/* Progress/Status line */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-accent/40 w-full"></div>
        </div>
    );
};

export default SessionClueDeck;
