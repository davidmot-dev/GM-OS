import React, { memo } from 'react';
import { Archive, Search } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import { type Clue } from '../../modules/session/store/types';

interface HubArchivesProps {
    clues: Clue[];
    activeCampaignId: string | null;
    onSelectClue: (clue: Clue) => void;
}

export const HubArchives: React.FC<HubArchivesProps> = memo(({ clues, activeCampaignId, onSelectClue }) => {
    const revealedClues = clues.filter(c => c.isRevealed && String(c.campaignId) === String(activeCampaignId));

    return (
        <div className="w-full h-full p-4 overflow-hidden flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-app-text flex items-center gap-3">
                        <Archive className="text-accent" size={24} />
                        Archives du Groupe
                    </h2>
                    <p className="text-ui-10 text-app-text/30 font-bold uppercase tracking-widest">Preuves et indices collectés lors de la campagne.</p>
                </div>
                <div className="text-ui-10 font-black bg-app-text/5 border border-app-border/40 px-4 py-2 rounded-full text-app-text/40 uppercase tracking-widest">
                    {revealedClues.length} Fragments Découverts
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {revealedClues.map((clue, idx) => (
                        <button 
                            key={clue.id} 
                            onClick={() => onSelectClue(clue)}
                            type="button"
                            className={`group text-left bg-app-surface/60 backdrop-blur-xl border border-app-border/40 rounded-3xl p-6 transition-all hover:border-accent/30 hover:bg-app-surface/80 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500 delay-${Math.min(idx * 50, 500)}`}
                        >
                            <div className="flex gap-4 items-start">
                                <div className="size-16 rounded-2xl bg-app-surface/40 border border-app-border/40 overflow-hidden flex-none">
                                    {clue.mediaUrl ? (
                                        <ResolvedImage src={clue.mediaUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-app-text/10">
                                            <Search size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-app-text group-hover:text-accent transition-colors">{clue.title}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {clue.revealedAt && (
                                                <span className="text-ui-7 font-black text-app-text/30 uppercase tracking-[0.2em] bg-app-text/5 px-2 py-0.5 rounded border border-app-border/40">
                                                    DÉCOUVERT LE {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(clue.revealedAt))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-ui-11 text-app-text/40 leading-relaxed italic font-serif line-clamp-4">{clue.content}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                    
                    {revealedClues.length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-app-border/40 rounded-[3rem]">
                            <Archive size={48} className="text-app-text/5" />
                            <p className="text-xs font-black uppercase tracking-widest text-app-text/20">Aucune archive disponible</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
