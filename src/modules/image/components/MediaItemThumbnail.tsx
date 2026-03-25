import { Music, Film, FileText } from 'lucide-react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { MediaItem } from '../../../stores/useMediaStore';

interface MediaItemThumbnailProps {
    media: MediaItem;
}

export const MediaItemThumbnail: React.FC<MediaItemThumbnailProps> = ({ media }) => {
    const url = useMediaUrl(media.id);

    if (!url) {
        return <div className="w-full h-full bg-[#091328] flex items-center justify-center animate-pulse" />;
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
            <div className="w-full h-full bg-[#091328] flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-amber-500 rounded-full animate-ping" />
                </div>
                <Music size={32} className="text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                <div className="px-3 py-1 bg-amber-500/10 rounded-full text-[9px] font-black text-amber-500 border border-amber-500/20 tracking-widest uppercase">Sonic Data</div>
            </div>
        );
    }
    if (media.type === 'document') {
        const ext = media.name.split('.').pop()?.toUpperCase() ?? 'DOC';
        return (
            <div className="w-full h-full bg-[#091328] flex flex-col items-center justify-center gap-4 p-6">
                <FileText size={36} className="text-emerald-400/40 group-hover:text-emerald-400 transition-colors" />
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60">Fichier {ext}</span>
                    <div className="w-8 h-0.5 bg-emerald-400/20 rounded-full" />
                </div>
            </div>
        );
    }
    return null;
};
