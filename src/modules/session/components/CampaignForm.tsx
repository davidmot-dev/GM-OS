import React, { useState } from 'react';
import { useSessionOSStore, type Campaign } from '../useSessionOSStore';
import { Save, X, BookOpen, ImageIcon, Info, MapPin } from 'lucide-react';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmToast } from '../../../stores/useToastStore';

interface CampaignFormProps {
    campaign?: Campaign; // If provided, we are in Edit mode
    onClose: () => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ campaign, onClose }) => {
    const { addCampaign, updateCampaign } = useSessionOSStore();
    
    const [name, setName] = useState(campaign?.name || '');
    const [system, setSystem] = useState(campaign?.system || 'D&D 5E');
    const [description, setDescription] = useState(campaign?.description || '');
    const [synopsis, setSynopsis] = useState(campaign?.synopsis || '');
    const [wallpaperUrl, setWallpaperUrl] = useState(campaign?.wallpaperUrl || '');
    const [activeLocationIds, setActiveLocationIds] = useState<string[]>(campaign?.activeLocationIds || []);
    
    // Get maps for this campaign to allow pinning as "active"
    const campaignMaps = useSessionOSStore.getState().atlasMaps.filter(m => m.campaignId === campaign?.id);
    
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const resolvedWallpaper = useMediaUrl(wallpaperUrl);

    const isEdit = !!campaign;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const campaignData = {
            name,
            system,
            description,
            synopsis,
            wallpaperUrl,
            activeLocationIds
        };

        if (isEdit && campaign) {
            updateCampaign(campaign.id, campaignData);
            gmToast('Campagne mise à jour avec succès !');
        } else {
            addCampaign(campaignData);
            gmToast('Nouvelle aventure créée !');
        }
        
        onClose();
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gm-gold/10 flex items-center justify-center text-gm-gold">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter">
                            {isEdit ? 'Éditer la Campagne' : 'Nouvelle Aventure'}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configure ton univers de jeu</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* Left Column: Story & Identity */}
                    <div className="space-y-8">
                        {/* Identity */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Nom de la Campagne</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input 
                                        required
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="ex: Le Trésor de l'Île Morte"
                                        className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-gm-gold/40 transition-all font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Système de Jeu</label>
                                <select 
                                    value={system}
                                    onChange={e => setSystem(e.target.value)}
                                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-gm-gold/40 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    <option value="D&D 5E">D&D 5E</option>
                                    <option value="Pathfinder 2E">Pathfinder 2E</option>
                                    <option value="Call of Cthulhu 7E">L'Appel de Cthulhu 7E</option>
                                    <option value="Coriolis">Coriolis</option>
                                    <option value="Générique / Autre">Générique / Autre</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                                <Info size={12} /> Accroche (Courte)
                            </label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Une brève description pour la bibliothèque..."
                                rows={2}
                                className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gm-gold/40 transition-all font-bold"
                            />
                        </div>

                        {/* Synopsis */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                                <BookOpen size={12} /> Synopsis de l'Aventure
                            </label>
                            <textarea 
                                value={synopsis}
                                onChange={e => setSynopsis(e.target.value)}
                                placeholder="Le texte détaillé de l'intrigue..."
                                rows={10}
                                className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gm-gold/40 transition-all font-serif italic text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Right Column: Visuals & Places */}
                    <div className="space-y-8">
                        {/* Visual Header / Wallpaper */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gm-gold flex items-center gap-2 px-1">
                                <ImageIcon size={12} /> Ambiance Visuelle
                            </label>
                            <div 
                                className="relative h-64 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-800 hover:border-gm-gold/30 transition-all group cursor-pointer overflow-hidden flex items-center justify-center p-2"
                                onClick={() => setIsMediaBrowserOpen(true)}
                            >
                                {wallpaperUrl && resolvedWallpaper ? (
                                    <img src={resolvedWallpaper} className="w-full h-full object-cover rounded-xl shadow-2xl" alt="Wallpaper" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-700 group-hover:text-gm-gold/50">
                                        <ImageIcon size={32} />
                                        <span className="text-xs font-bold">Choisir une image de fond</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-gm-gold font-bold text-xs uppercase tracking-widest">
                                    Changer l'image
                                </div>
                            </div>
                        </div>

                        {/* Active Locations Management */}
                        {isEdit && campaignMaps.length > 0 && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 flex items-center gap-2">
                                    <MapPin size={12} /> Lieux Actifs (Favoris)
                                </label>
                                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                    {campaignMaps.map(map => (
                                        <button
                                            key={map.id}
                                            type="button"
                                            onClick={() => {
                                                if (activeLocationIds.includes(map.id)) {
                                                    setActiveLocationIds(activeLocationIds.filter(id => id !== map.id));
                                                } else {
                                                    setActiveLocationIds([...activeLocationIds, map.id]);
                                                }
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                                activeLocationIds.includes(map.id)
                                                ? 'bg-gm-gold/10 border-gm-gold/40 text-gm-gold shadow-glow-gold/10'
                                                : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded bg-slate-800 overflow-hidden flex-shrink-0 border border-white/5">
                                                <img src={map.fileUrl} className={`w-full h-full object-cover ${activeLocationIds.includes(map.id) ? 'opacity-100' : 'opacity-40'}`} alt="" />
                                            </div>
                                            <span className="text-xs font-bold truncate">{map.name}</span>
                                            {activeLocationIds.includes(map.id) && <div className="w-2 h-2 rounded-full bg-gm-gold shadow-glow-gold ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-600 italic px-1">
                                    Les lieux épinglés apparaissent dans le cockpit de session pour un accès rapide.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </form>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-slate-900/40 flex justify-end gap-3">
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                    Annuler
                </button>
                <button 
                    onClick={handleSubmit}
                    className="flex items-center gap-2 bg-gm-gold hover:bg-yellow-400 text-slate-950 font-black px-8 py-2.5 rounded-xl text-xs tracking-widest transition-all shadow-[0_4px_20px_-5px_rgba(234,179,8,0.4)] hover:scale-105 active:scale-95"
                >
                    <Save size={16} />
                    {isEdit ? 'Mettre à jour' : 'Créer la Campagne'}
                </button>
            </div>

            <MediaBrowser 
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    setWallpaperUrl(id);
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title="Choisir un Fond de Campagne"
            />
        </div>
    );
};

export default CampaignForm;
