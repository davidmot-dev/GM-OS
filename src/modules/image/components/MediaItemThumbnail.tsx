import { Music, Film, FileText } from 'lucide-react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { MediaItem } from '../../../stores/useMediaStore';

interface MediaItemThumbnailProps {
    media: MediaItem;
}

export const MediaItemThumbnail: React.FC<MediaItemThumbnailProps> = ({ media }) => {
    const url = useMediaUrl(media.id);

    if (!url) {
        return <div className="w-full h-full bg-app-bg/50 flex items-center justify-center animate-pulse" />;
    }

    if (media.type === 'image') {
        return <img src={url} alt={media.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />;
    }
    if (media.type === 'video') {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center relative">
                <video src={url} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Film size={20} className="text-white/70" />
                    </div>
                </div>
            </div>
        );
    }
    if (media.type === 'audio') {
        return (
            <div className="w-full h-full bg-app-surface/20 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-accent rounded-full animate-ping" />
                </div>
                <Music size={32} className="text-accent/60 group-hover:text-accent transition-colors" />
                <div className="px-3 py-1 bg-accent/10 rounded-full text-[9px] font-black text-accent border border-accent/20 tracking-widest uppercase font-display">Sonic Data</div>
            </div>
        );
    }
    if (media.type === 'document') {
        const ext = media.name.split('.').pop()?.toUpperCase() ?? 'DOC';
        return (
            <div className="w-full h-full bg-app-surface/20 flex flex-col items-center justify-center gap-4 p-6">
                <FileText size={36} className="text-accent/40 group-hover:text-accent transition-colors" />
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 font-display">Fichier {ext}</span>
                    <div className="w-8 h-0.5 bg-accent/20 rounded-full" />
                </div>
            </div>
        );
    }
    return null;
};
