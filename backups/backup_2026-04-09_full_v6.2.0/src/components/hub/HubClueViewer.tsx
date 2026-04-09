import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSearch, Calendar, Bookmark } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import type { Clue } from '../../modules/session/store/types';

interface HubClueViewerProps {
    clue: Clue | null;
    onClose: () => void;
}

export const HubClueViewer: React.FC<HubClueViewerProps> = ({ clue, onClose }) => {
    if (!clue) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12"
            >
                {/* Backdrop with extreme blur for "Surgical" focus */}
                <div 
                    className="absolute inset-0 bg-app-bg/90 backdrop-blur-3xl"
                    onClick={onClose}
                />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 z-[210] p-4 bg-app-surface/40 hover:bg-app-surface border border-app-border/10 rounded-full text-app-text/40 hover:text-app-text transition-all hover:scale-110 active:scale-95 group"
                    title="Fermer l'indice"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>

                {/* Main Content Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative z-[205] w-full max-w-5xl max-h-full overflow-hidden flex flex-col md:flex-row gap-8 items-stretch"
                >
                    {/* Media Section (Image or XXL Stylized Icon) */}
                    <div className="flex-1 min-h-[300px] md:min-h-0 bg-app-surface/20 border border-app-border/10 rounded-[3rem] overflow-hidden relative shadow-2xl flex items-center justify-center group">
                        {clue.mediaUrl ? (
                            <>
                                {/* Background Ambient Glow */}
                                <ResolvedImage 
                                    src={clue.mediaUrl} 
                                    className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-125 select-none pointer-events-none" 
                                />
                                <ResolvedImage 
                                    src={clue.mediaUrl} 
                                    alt={clue.title}
                                    className="relative z-10 w-full h-full object-contain p-4 md:p-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-1000 group-hover:scale-105"
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-8 animate-pulse-slow">
                                <div className="p-12 bg-app-surface/10 rounded-full border border-app-border/10 shadow-[0_0_80px_rgba(0,0,0,0.05)]">
                                    <FileSearch size={120} className="text-app-text/20 stroke-[1]" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-app-text/10">Archives Sécurisées</p>
                                    <p className="text-[8px] font-bold text-app-text/5 uppercase tracking-widest">Preuve immatérielle</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="w-full md:w-[450px] flex flex-col justify-center gap-8 p-4">
                        <div className="space-y-4">
                            {/* Metadata Badges */}
                            <div className="flex flex-wrap gap-3">
                                {clue.revealedAt && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-app-surface/40 rounded-full border border-app-border/20">
                                        <Calendar size={12} className="text-app-text/30" />
                                        <span className="text-[9px] font-black text-app-text/40 uppercase tracking-widest">
                                            {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(clue.revealedAt)}
                                        </span>
                                    </div>
                                )}
                                {clue.campaignMoment && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
                                        <Bookmark size={12} className="text-accent/50" />
                                        <span className="text-[9px] font-black text-accent/60 uppercase tracking-widest">
                                            {clue.campaignMoment}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <h2 className="text-4xl md:text-5xl font-black text-app-text leading-none uppercase tracking-tighter">
                                {clue.title}
                            </h2>
                        </div>

                        {/* Narrative Content */}
                        <div className="relative">
                            <div className="absolute top-0 left-0 w-12 h-0.5 bg-accent/30 mb-6" />
                            <div className="max-h-[30vh] md:max-h-[40vh] overflow-y-auto custom-scrollbar-minimal pr-6 mt-8">
                                <p className="text-2xl text-app-text/80 leading-relaxed font-serif italic text-justify">
                                    {clue.content}
                                </p>
                            </div>
                        </div>

                        {/* Footnote */}
                        <div className="pt-8 border-t border-app-border/10">
                            <p className="text-[10px] font-bold text-app-text/20 uppercase tracking-[0.3em]">Session History | GM-OS Legacy</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
