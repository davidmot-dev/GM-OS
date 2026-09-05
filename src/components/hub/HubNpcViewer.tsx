import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Info } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import type { Entity } from '../../modules/session/store/types';

interface HubNpcViewerProps {
    npc: Entity | null;
    onClose: () => void;
}

export const HubNpcViewer: React.FC<HubNpcViewerProps> = ({ npc, onClose }) => {
    if (!npc) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12"
            >
                {/* Backdrop with high blur */}
                <div 
                    className="absolute inset-0 bg-app-bg/95 backdrop-blur-3xl"
                    onClick={onClose}
                />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[210] p-4 bg-app-surface/40 hover:bg-app-surface border border-app-border/10 rounded-full text-app-text/40 hover:text-app-text transition-all hover:scale-110 active:scale-95 group"
                    title="Fermer"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>

                {/* Main Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    transition={{ type: "spring", damping: 30, stiffness: 200 }}
                    className="relative z-[205] w-full max-w-6xl max-h-full overflow-hidden flex flex-col md:flex-row gap-8 lg:gap-16 items-center md:items-stretch"
                >
                    {/* Portrait Section (Grand Format) */}
                    <div className="w-full md:flex-1 h-[40vh] md:h-auto min-h-[350px] bg-app-surface/20 border border-app-border/10 rounded-[3rem] overflow-hidden relative shadow-2xl flex items-center justify-center group">
                        <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent opacity-60 z-10" />
                        
                        {npc.avatar ? (
                            <>
                                <ResolvedImage 
                                    src={npc.avatar} 
                                    className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-125 select-none pointer-events-none" 
                                />
                                <ResolvedImage 
                                    src={npc.avatar || npc.avatar} 
                                    alt={npc.name}
                                    className="relative z-10 w-full h-full object-contain p-2 md:p-4 drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-transform duration-1000 group-hover:scale-105"
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <div className="p-10 bg-app-surface/20 rounded-full border border-app-border/10">
                                    <User size={80} className="text-app-text/10" />
                                </div>
                                <p className="text-ui-10 font-black uppercase tracking-[0.4em] text-app-text/20">Identité Non Documentée</p>
                            </div>
                        )}
                    </div>

                    {/* NPC Info Section */}
                    <div className="w-full md:w-[480px] flex flex-col justify-center gap-8 md:gap-12 p-4 md:p-0">
                        <div className="space-y-6">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-app-surface/40 rounded-full border border-app-border/20 shadow-lg">
                                    <Shield size={12} className="text-accent" />
                                    <span className="text-ui-10 font-black text-app-text/60 uppercase tracking-widest">
                                        {npc.role || 'NPC'}
                                    </span>
                                </div>
                                {npc.faction && (
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                        <Info size={12} className="text-indigo-400" />
                                        <span className="text-ui-10 font-black text-indigo-400/80 uppercase tracking-widest text-shadow-glow">
                                            {npc.faction}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Nom & Titre */}
                            <div className="space-y-2">
                                <h2 className="text-5xl md:text-7xl font-black text-app-text leading-none uppercase tracking-tighter drop-shadow-2xl">
                                    {npc.name}
                                </h2>
                                <p className="text-accent/60 text-xs md:text-sm font-black uppercase tracking-[0.4em] pl-1">
                                    {npc.type === 'npc' ? 'Profil Civil / Neutre' : 'Sujet d\'intérêt'}
                                </p>
                            </div>
                        </div>

                        {/* Description / Lore */}
                        <div className="relative group">
                            <div className="absolute -top-6 left-0 w-16 h-1 bg-gradient-to-r from-accent/40 to-transparent rounded-full" />
                            <div className="max-h-[30vh] md:max-h-[40vh] overflow-y-auto custom-scrollbar-minimal pr-8">
                                <p className="text-xl md:text-2xl text-app-text/70 leading-relaxed font-serif italic text-justify group-hover:text-app-text/90 transition-colors duration-500">
                                    {npc.description || "Aucune donnée biographique supplémentaire n'est accessible pour ce sujet."}
                                </p>
                            </div>
                        </div>

                        {/* Footer decorative */}
                        <div className="pt-8 border-t border-app-border/10 flex items-center justify-between opacity-30">
                            <p className="text-ui-10 font-black uppercase tracking-[0.3em]">Archives du Nexus</p>
                            <div className="flex gap-2">
                                <div className="w-8 h-1 bg-app-text/20 rounded-full" />
                                <div className="w-2 h-1 bg-accent/40 rounded-full" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
