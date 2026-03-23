import React, { useState } from 'react';
import { X, Trash2, Folder, Tag, Users, Check, Image as ImageIcon, Music, Film, FileText } from 'lucide-react';
import type { MediaItem, MediaCollection } from '../../../stores/useMediaStore';
import type { Campaign } from '../../session/useSessionOSStore';
import { MediaItemThumbnail } from './MediaItemThumbnail';

interface TacticalDetailPanelProps {
    media: MediaItem;
    onClose: () => void;
    collections: MediaCollection[];
    toggleMediaInCollection: (cid: string, mid: string) => void;
    updateMediaTags: (mid: string, tags: string[]) => void;
    updateMediaCampaigns: (mid: string, campaignIds: string[]) => void;
    deleteMedia: (mid: string) => void;
    campaigns: Campaign[];
    onSelect: (mid: string) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    'image': <ImageIcon size={14} className="text-blue-400" />,
    'audio': <Music size={14} className="text-amber-400" />,
    'video': <Film size={14} className="text-purple-400" />,
    'document': <FileText size={14} className="text-emerald-400" />,
};

export const TacticalDetailPanel: React.FC<TacticalDetailPanelProps> = ({ 
    media, 
    onClose, 
    collections, 
    toggleMediaInCollection, 
    updateMediaTags, 
    updateMediaCampaigns, 
    deleteMedia, 
    campaigns, 
    onSelect 
}) => {
    const [newTag, setNewTag] = useState('');

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div 
            className="fixed inset-y-0 right-0 w-[500px] bg-[#050a18]/95 backdrop-blur-3xl border-l border-[#53ddfc]/20 z-[120] flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-500"
            onClick={e => e.stopPropagation()}
        >
            {/* Header HUD */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#53ddfc]/5">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#53ddfc]/10 flex items-center justify-center text-[#53ddfc] border border-[#53ddfc]/20 shadow-[0_0_20px_rgba(83,221,252,0.1)]">
                        {TYPE_ICONS[media.type] || <FileText size={20} />}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-lg font-black uppercase tracking-widest text-[#dee5ff] truncate max-w-[280px]" title={media.name}>{media.name}</h3>
                        <span className="text-[10px] font-bold text-[#53ddfc]/60 uppercase tracking-[0.3em]">Neural Interface : Asset Detail</span>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/20 hover:text-white rounded-2xl transition-all border border-white/5 hover:border-white/20"
                    title="Fermer le panneau tactique"
                    aria-label="Fermer le panneau tactique"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                {/* Large Preview */}
                <div className="relative group aspect-video rounded-3xl overflow-hidden bg-black/40 border border-white/5 shadow-2xl">
                    <MediaItemThumbnail media={media} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6 flex items-center gap-4">
                        <span className="px-3 py-1 bg-[#53ddfc]/10 border border-[#53ddfc]/20 rounded-lg text-[10px] font-black text-[#53ddfc] uppercase tracking-widest">
                            {media.type}
                        </span>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            {formatSize(media.size)}
                        </span>
                    </div>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onSelect(media.id)}
                        className="flex items-center justify-center gap-3 py-4 bg-[#53ddfc] text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(83,221,252,0.3)]"
                    >
                        <Check size={16} strokeWidth={3} />
                        Sélectionner
                    </button>
                    <button 
                        onClick={() => {
                            if (confirm(`INITIATE DELETION: "${media.name}"?`)) {
                                deleteMedia(media.id);
                                onClose();
                            }
                        }}
                        className="flex items-center justify-center gap-3 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                        <Trash2 size={16} />
                        Supprimer
                    </button>
                </div>

                {/* Classification Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Folder size={14} className="text-[#53ddfc]/40" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Classification Dossier</h4>
                    </div>
                    <div className="space-y-2">
                        {collections.map(coll => (
                            <button
                                key={coll.id}
                                onClick={() => toggleMediaInCollection(coll.id, media.id)}
                                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${coll.mediaIds.includes(media.id) ? 'bg-blue-600/20 text-blue-400 border border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-white/5 text-slate-500 border border-transparent hover:bg-white/10'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <Folder size={16} className={coll.mediaIds.includes(media.id) ? 'text-blue-400' : 'opacity-30'} />
                                    {coll.name}
                                </div>
                                {coll.mediaIds.includes(media.id) && <Check size={16} />}
                            </button>
                        ))}
                        {collections.length === 0 && (
                            <div className="py-6 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <p className="text-[10px] italic text-white/5 uppercase tracking-widest font-bold">Aucun dossier configuré</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Tags Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Tag size={14} className="text-[#53ddfc]/40" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Matrice de Tags</h4>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {media.tags.map(t => (
                                <span key={t} className="inline-flex items-center gap-2 bg-[#53ddfc]/5 text-[#53ddfc] border border-[#53ddfc]/20 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase">
                                    #{t}
                                    <button 
                                        onClick={() => updateMediaTags(media.id, media.tags.filter(tag => tag !== t))}
                                        className="hover:text-red-400 opacity-40 hover:opacity-100 transition-all"
                                        title={`Retirer le tag ${t}`}
                                        aria-label={`Retirer le tag ${t}`}
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            {media.tags.length === 0 && <span className="text-[9px] font-bold text-white/10 uppercase italic tracking-widest">No Active Links</span>}
                        </div>
                        <input
                            type="text"
                            placeholder="TRANSMETTRE NOUVEAU TAG..."
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-[#53ddfc] outline-none placeholder:text-white/10 uppercase tracking-[0.2em] focus:border-[#53ddfc]/30 transition-all"
                            onKeyDown={async e => {
                                if (e.key === 'Enter' && newTag.trim()) {
                                    const tag = newTag.trim().toLowerCase();
                                    if (!media.tags.includes(tag)) {
                                        await updateMediaTags(media.id, [...media.tags, tag]);
                                    }
                                    setNewTag('');
                                }
                            }}
                        />
                    </div>
                </section>

                {/* Metadata Section */}
                <section className="bg-white/5 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-white/20">Identifiant</span>
                        <span className="text-white/60 font-mono text-[9px]">{media.id.split('-')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-white/20">Date d'import</span>
                        <span className="text-white/60">{new Date(media.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] block mb-3">Attribution Opérationnelle</span>
                        <div className="flex flex-wrap gap-2">
                             {campaigns.map(campaign => {
                                 const isLinked = media.campaignIds.includes(campaign.id);
                                 return (
                                     <button 
                                         key={campaign.id} 
                                         onClick={() => {
                                             const newCampaignIds = isLinked 
                                                 ? media.campaignIds.filter(id => id !== campaign.id)
                                                 : [...media.campaignIds, campaign.id];
                                             updateMediaCampaigns(media.id, newCampaignIds);
                                         }}
                                         className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${isLinked ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-white/5 text-white/20 border-transparent hover:border-white/10 hover:text-white/40'}`}
                                         title={isLinked ? `Délier de ${campaign.name}` : `Lier à ${campaign.name}`}
                                         aria-label={isLinked ? `Délier de ${campaign.name}` : `Lier à ${campaign.name}`}
                                     >
                                         <Users size={10} className={isLinked ? 'opacity-100' : 'opacity-30'} />
                                         {campaign.name}
                                     </button>
                                 );
                             })}
                             {campaigns.length === 0 && (
                                 <span className="text-[8px] font-bold text-white/5 uppercase italic tracking-widest">Aucune unité opérationnelle détectée</span>
                             )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
