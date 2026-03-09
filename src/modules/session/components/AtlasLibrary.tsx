import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { AtlasMap } from '../useSessionOSStore';
import { Search, FolderOpen, Film, Globe, Swords, Map, Building2, Hexagon, Trash2 } from 'lucide-react';
import { useMapStore } from '../../map/useMapStore';
import { useMediaStore } from '../../../stores/useMediaStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { ResolvedAsset } from '../../../components/ResolvedAsset';

const TYPE_META: Record<AtlasMap['type'], { label: string; icon: React.ReactNode; color: string }> = {
    'battlemap': { label: 'Battlemap', icon: <Swords size={10} />, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    'world-map': { label: 'Monde', icon: <Globe size={10} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    'region': { label: 'Region', icon: <Map size={10} />, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    'city': { label: 'Ville', icon: <Building2 size={10} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    'dungeon': { label: 'Donjon', icon: <Hexagon size={10} />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

const MapCard: React.FC<{
    map: AtlasMap,
    isSelected: boolean,
    isProjected: boolean,
    onClick: () => void,
    onDelete: () => void
}> = ({ map, isSelected, isProjected, onClick, onDelete }) => {
    const typeMeta = TYPE_META[map.type];

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            className={`group w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all relative cursor-pointer ${isSelected
                ? 'bg-gm-gold/10 border border-gm-gold/30'
                : 'hover:bg-slate-800/60 border border-transparent'
                }`}
        >
            {/* Thumbnail */}
            <div className="w-12 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-white/5">
                <ResolvedAsset 
                    src={map.fileUrl} 
                    isVideo={map.isVideo}
                    className="w-full h-full object-cover"
                    alt={map.name}
                    fallback={
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 border border-slate-700/50 rounded-lg">
                            <Map size={16} className="text-slate-600" />
                        </div>
                    }
                />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={`font-bold text-xs truncate ${isSelected ? 'text-gm-gold' : 'text-slate-200'}`}>
                    {map.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${typeMeta.color}`}>
                        {typeMeta.icon} {typeMeta.label}
                    </span>
                    {map.isVideo && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border text-purple-400 bg-purple-500/10 border-purple-500/20">
                            <Film size={8} /> Animé
                        </span>
                    )}
                    {isProjected && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                            ● Actif
                        </span>
                    )}
                </div>
            </div>
            {/* Delete Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400 text-slate-600"
            >
                <Trash2 size={13} />
            </button>
        </div>
    );
};

const AtlasLibrary: React.FC = () => {
    const { atlasMaps, selectedAtlasMapId, setSelectedAtlasMap, addAtlasMap, deleteAtlasMap, activeCampaignId } = useSessionOSStore();
    const { mapUrl } = useMapStore();
    const { mediaList } = useMediaStore();

    const [search, setSearch] = useState('');
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);

    const filtered = atlasMaps.filter(m =>
        m.campaignId === activeCampaignId &&
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleMediaSelect = (mediaId: string) => {
        const media = mediaList.find(m => m.id === mediaId);
        if (!media) return;

        addAtlasMap({
            name: media.name.replace(/\.[^/.]+$/, ''),
            fileUrl: mediaId, // Save the mediaId instead of blob URL
            isVideo: media.type === 'video',
            type: 'battlemap',
            narrativeDescription: '',
            gmNotes: '',
            linkedEntities: [],
            campaignId: activeCampaignId || 'c-1'
        });
    };

    return (
        <div className="w-72 flex-shrink-0 h-full bg-slate-900/90 border-r border-slate-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                    <Globe size={16} className="text-gm-gold" />
                    <h3 className="text-slate-100 font-bold text-sm uppercase tracking-widest">World Atlas</h3>
                </div>
                <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Rechercher une carte..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:ring-1 focus:ring-gm-gold/50 focus:outline-none"
                    />
                </div>
            </div>

            {/* Map List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                {filtered.map(map => (
                    <MapCard
                        key={map.id}
                        map={map}
                        isSelected={selectedAtlasMapId === map.id}
                        isProjected={mapUrl === map.fileUrl} // Note: This will need coordination with Map-OS which might now receive mediaId
                        onClick={() => setSelectedAtlasMap(map.id)}
                        onDelete={() => deleteAtlasMap(map.id)}
                    />
                ))}
                {filtered.length === 0 && (
                    <p className="text-slate-600 text-xs text-center p-4">Aucune carte trouvée</p>
                )}
            </div>

            {/* Import Button */}
            <div className="p-3 border-t border-slate-800">
                <button
                    onClick={() => setIsBrowserOpen(true)}
                    className="w-full flex items-center justify-center gap-2 border border-gm-gold/40 text-gm-gold hover:bg-gm-gold/10 py-2.5 rounded-lg text-xs font-bold transition-all"
                >
                    <FolderOpen size={14} />
                    Importer depuis Media Hub
                </button>
            </div>

            <MediaBrowser
                isOpen={isBrowserOpen}
                onClose={() => setIsBrowserOpen(false)}
                onSelect={handleMediaSelect}
                allowedTypes={['image', 'video']}
                title="Sélecteur de Cartes (Atlas)"
            />
        </div>
    );
};

export default AtlasLibrary;
