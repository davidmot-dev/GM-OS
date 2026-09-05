import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Shield, User } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import type { FavoriteEntity } from '../../modules/favorite/useFavoriteStore';

interface HubItemViewerProps {
    item: FavoriteEntity | null;
    onClose: () => void;
}

export const HubItemViewer: React.FC<HubItemViewerProps> = ({ item, onClose }) => {
    if (!item) return null;

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
                    title="Fermer l'objet"
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
                        {item.imageUrl ? (
                            <>
                                {/* Background Ambient Glow */}
                                <ResolvedImage 
                                    src={item.imageUrl} 
                                    className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-125 select-none pointer-events-none" 
                                />
                                <ResolvedImage 
                                    src={item.imageUrl} 
                                    alt={item.name}
                                    className="relative z-10 w-full h-full object-contain p-4 md:p-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-1000 group-hover:scale-105"
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-8 animate-pulse-slow">
                                <div className="p-12 bg-app-surface/10 rounded-full border border-app-border/10 shadow-[0_0_80px_rgba(0,0,0,0.05)]">
                                    <Package size={120} className="text-app-text/20 stroke-[1]" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-ui-10 font-black uppercase tracking-[0.5em] text-app-text/10">Inventaire Privé</p>
                                    <p className="text-ui-8 font-bold text-app-text/5 uppercase tracking-widest">Objet sans image</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="w-full md:w-[450px] flex flex-col justify-center gap-8 p-4">
                        <div className="space-y-4">
                            {/* Metadata Badges */}
                            <div className="flex flex-wrap gap-3">
                                {item.ownerId && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                        <User size={12} className="text-emerald-500/50" />
                                        <span className="text-ui-9 font-black text-emerald-400 uppercase tracking-widest">
                                            Objet Privé
                                        </span>
                                    </div>
                                )}
                                {item.attributes && Object.keys(item.attributes).length > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 rounded-full border border-rose-500/20">
                                        <Shield size={12} className="text-rose-500/50" />
                                        <span className="text-ui-9 font-black text-rose-500/80 uppercase tracking-widest">
                                            Stats Incluses
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Title & Subtitle */}
                            <div className="space-y-2">
                                <h2 className="text-4xl md:text-5xl font-black text-app-text leading-none uppercase tracking-tighter">
                                    {item.name}
                                </h2>
                                {item.subtitle && (
                                    <p className="text-sm font-bold text-accent/60 uppercase tracking-[0.2em]">
                                        {item.subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Narrative Content */}
                        <div className="relative">
                            <div className="absolute top-0 left-0 w-12 h-0.5 bg-accent/30 mb-6" />
                            <div className="max-h-[30vh] md:max-h-[40vh] overflow-y-auto custom-scrollbar-minimal pr-6 mt-8">
                                <p className="text-xl md:text-2xl text-app-text/80 leading-relaxed font-serif italic text-justify">
                                    {item.lore || "Aucune description de l'objet disponible."}
                                </p>
                            </div>
                        </div>

                        {/* Footnote */}
                        <div className="pt-8 border-t border-app-border/10">
                            <p className="text-ui-10 font-bold text-app-text/20 uppercase tracking-[0.3em]">Item Management | GM-OS Legacy</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
