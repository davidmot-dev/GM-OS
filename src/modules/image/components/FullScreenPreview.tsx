import React, { useEffect } from 'react';
import { X, Music } from 'lucide-react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { MediaItem } from '../../../stores/useMediaStore';

interface FullScreenPreviewProps {
    media: MediaItem;
    onClose: () => void;
}

export const FullScreenPreview: React.FC<FullScreenPreviewProps> = ({ media, onClose }) => {
    const url = useMediaUrl(media.id);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!url) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-app-bg/95 backdrop-blur-2xl animate-in fade-in duration-500">
             {/* Decorative Background for Preview */}
             <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--accent-rgb),0.1)_0%,transparent_70%)]" />
            </div>

            <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-4 bg-app-text/5 hover:bg-app-text/10 text-app-text/40 hover:text-app-text rounded-2xl transition-all border border-app-border/10 hover:border-app-border/20 hover:scale-110 active:scale-95 z-20 group"
                title="Deactivate Preview"
                aria-label="Fermer la prévisualisation"
            >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>

            <div className="max-w-7xl max-h-[85vh] w-full flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-500 z-10 relative">
                {media.type === 'image' && (
                    <div className="relative group">
                         <div className="absolute -inset-4 bg-accent/10 blur-2xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                         <img src={url} alt={media.name} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-app-border/10 relative z-10" />
                    </div>
                )}
                {media.type === 'audio' && (
                    <div className="bg-app-surface/80 backdrop-blur-3xl border border-app-border/10 p-16 rounded-[4rem] w-full max-w-xl flex flex-col items-center gap-10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--accent-rgb),0.05)_0%,transparent_70%)]" />
                        <div className="w-32 h-32 rounded-[2.5rem] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent animate-pulse relative z-10 shadow-[0_0_40px_rgba(var(--accent-rgb),0.15)]">
                            <Music size={56} />
                        </div>
                        <div className="text-center relative z-10">
                            <h3 className="text-2xl font-black text-app-text uppercase tracking-[0.3em] mb-3 drop-shadow-[0_0_15px_rgba(var(--app-text-rgb),0.2)] font-display">{media.name}</h3>
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-accent" />
                                <p className="text-app-text/20 text-[10px] font-black uppercase tracking-[0.4em] font-display">Sonic Frequency Decoded</p>
                            </div>
                        </div>
                        <audio src={url} autoPlay controls className="w-full h-14 rounded-2xl relative z-10 opacity-80 hover:opacity-100 transition-opacity" />
                    </div>
                )}
                {media.type === 'video' && (
                    <div className="relative group w-full max-w-6xl aspect-video">
                        <div className="absolute -inset-4 bg-accent/10 blur-2xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <video src={url} autoPlay controls className="w-full h-full rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-app-border/10 relative z-10 object-cover" />
                    </div>
                )}
            </div>

            <div className="absolute bottom-12 px-8 py-3 bg-black/40 border border-app-border/5 rounded-full text-app-text/20 text-[10px] uppercase font-black tracking-[0.5em] backdrop-blur-md font-display">
                ESC TO DISCONNECT
            </div>
        </div>
    );
};
