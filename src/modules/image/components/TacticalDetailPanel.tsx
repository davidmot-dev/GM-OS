import React, { useState } from 'react';
import { X, Trash2, Folder, Tag, Users, Check, Image as ImageIcon, Music, Film, FileText, Lock, Unlock, ShieldCheck } from 'lucide-react';
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
    toggleMediaPersistence: (id: string) => void;
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
    toggleMediaPersistence,
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
            className="fixed inset-y-0 right-0 w-[500px] bg-app-surface/95 backdrop-blur-3xl border-l border-app-border/20 z-[120] flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-500"
            onClick={e => e.stopPropagation()}
        >
            {/* Header HUD */}
            <div className="p-8 border-b border-app-border/10 flex items-center justify-between bg-accent/5">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]">
                        {TYPE_ICONS[media.type] || <FileText size={20} />}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-lg font-black uppercase tracking-widest text-app-text truncate max-w-[280px] font-display" title={media.name}>{media.name}</h3>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-accent/60 uppercase tracking-[0.3em] font-display">Neural Interface</span>
                             {media.isPersistent && (
                                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 rounded-full border border-accent/20">
                                     <ShieldCheck size={8} className="text-accent" />
                                     <span className="text-[8px] font-black text-accent uppercase tracking-widest">Persistant</span>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center bg-app-text/5 hover:bg-app-text/10 text-app-text/20 hover:text-app-text rounded-2xl transition-all border border-app-border/10 hover:border-app-border/20"
                    title="Fermer le panneau tactique"
                    aria-label="Fermer le panneau tactique"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                {/* Large Preview */}
                <div className="relative group aspect-video rounded-3xl overflow-hidden bg-black/40 border border-app-border/10 shadow-2xl">
                    <MediaItemThumbnail media={media} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6 flex items-center gap-4">
                        <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-[10px] font-black text-accent uppercase tracking-widest">
                            {media.type}
                        </span>
                        <span className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">
                            {formatSize(media.size)}
                        </span>
                    </div>

                    {/* Persistence Toggle Overlay */}
                    <button 
                        onClick={() => toggleMediaPersistence(media.id)}
                        className={`absolute top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 backdrop-blur-md border ${media.isPersistent ? 'bg-accent/20 border-accent/40 text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]' : 'bg-black/40 border-app-border/10 text-app-text/20 hover:text-app-text/60 hover:bg-black/60'}`}
                        title={media.isPersistent ? "Désactiver la persistance (Risque de suppression)" : "Activer la persistance (Protéger du nettoyage)"}
                    >
                        {media.isPersistent ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onSelect(media.id)}
                        className="flex items-center justify-center gap-3 py-4 bg-accent text-app-bg rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]"
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
                        <Folder size={14} className="text-accent/40" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text/30 font-display">Classification Dossier</h4>
                    </div>
                    <div className="space-y-2">
                        {collections.map(coll => (
                            <button
                                key={coll.id}
                                onClick={() => toggleMediaInCollection(coll.id, media.id)}
                                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${coll.mediaIds.includes(media.id) ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]' : 'bg-app-text/5 text-app-text/30 border border-transparent hover:bg-app-text/10'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <Folder size={16} className={coll.mediaIds.includes(media.id) ? 'text-accent' : 'opacity-30'} />
                                    {coll.name}
                                </div>
                                {coll.mediaIds.includes(media.id) && <Check size={16} />}
                            </button>
                        ))}
                        {collections.length === 0 && (
                            <div className="py-6 text-center border-2 border-dashed border-app-border/10 rounded-3xl">
                                <p className="text-[10px] italic text-app-text/5 uppercase tracking-widest font-bold">Aucun dossier configuré</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Tags Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Tag size={14} className="text-accent/40" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text/30 font-display">Matrice de Tags</h4>
                    </div>
                    <div className="bg-app-surface/40 border border-app-border/10 rounded-[2rem] p-6 space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {media.tags.map(t => (
                                <span key={t} className="inline-flex items-center gap-2 bg-accent/5 text-accent border border-accent/20 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase">
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
                            {media.tags.length === 0 && <span className="text-[9px] font-bold text-app-text/10 uppercase italic tracking-widest">No Active Links</span>}
                        </div>
                        <input
                            type="text"
                            placeholder="TRANSMETTRE NOUVEAU TAG..."
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            className="w-full bg-app-bg/60 border border-app-border/10 rounded-2xl px-6 py-4 text-xs font-bold text-accent outline-none placeholder:text-app-text/10 uppercase tracking-[0.2em] focus:border-accent/30 transition-all font-display"
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
                <section className="bg-app-surface/20 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-app-text/20">Identifiant</span>
                        <span className="text-app-text/60 font-mono text-[9px]">{media.id.split('-')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-app-text/20">Date d'import</span>
                        <span className="text-app-text/60">{new Date(media.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="pt-4 border-t border-app-border/10">
                        <span className="text-[9px] font-black text-app-text/20 uppercase tracking-[0.3em] block mb-3 font-display">Attribution Opérationnelle</span>
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
                                         className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${isLinked ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-app-surface/5 text-app-text/20 border-transparent hover:border-app-border/10 hover:text-app-text/40'}`}
                                         title={isLinked ? `Délier de ${campaign.name}` : `Lier à ${campaign.name}`}
                                         aria-label={isLinked ? `Délier de ${campaign.name}` : `Lier à ${campaign.name}`}
                                     >
                                         <Users size={10} className={isLinked ? 'opacity-100' : 'opacity-30'} />
                                         {campaign.name}
                                     </button>
                                 );
                             })}
                             {campaigns.length === 0 && (
                                 <span className="text-[8px] font-bold text-app-text/5 uppercase italic tracking-widest">Aucune unité opérationnelle détectée</span>
                             )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
