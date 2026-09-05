import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import type { AtlasMap } from '../useSessionOSStore';
import { Search, FolderOpen, Film, Globe, Swords, Map, Building2, MapPin, Trash2, Pin, CheckCircle2 } from 'lucide-react';
import { useMapStore } from '../../map/useMapStore';
import { useMediaStore } from '../../../stores/useMediaStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import { gmToast } from '../../../stores/useToastStore';

const TYPE_META: Record<AtlasMap['type'], { labelKey: string; icon: React.ReactNode; color: string }> = {
    'battlemap': { labelKey: 'modules:session.world_atlas.library.types.battlemap', icon: <Swords size={10} />, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    'world-map': { labelKey: 'modules:session.world_atlas.library.types.world-map', icon: <Globe size={10} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    'region': { labelKey: 'modules:session.world_atlas.library.types.region', icon: <Map size={10} />, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    'city': { labelKey: 'modules:session.world_atlas.library.types.city', icon: <Building2 size={10} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    'dungeon': { labelKey: 'modules:session.world_atlas.library.types.dungeon', icon: <MapPin size={10} />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

const MapCard: React.FC<{
    map: AtlasMap,
    isSelected: boolean,
    isProjected: boolean,
    isPinned: boolean,
    onClick: () => void,
    onDelete: () => void,
    onTogglePin: () => void,
    onToggleVisited: () => void
}> = ({ map, isSelected, isProjected, isPinned, onClick, onDelete, onTogglePin, onToggleVisited }) => {
    const { t } = useTranslation();
    const typeMeta = TYPE_META[map.type] || { labelKey: 'modules:session.world_atlas.library.unknown_type', icon: <Map size={10} />, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };

    return (
        <div
            className={`group w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all relative border ${isSelected
                ? 'bg-accent/10 border-accent/30'
                : 'hover:bg-app-surface/60 border-transparent'
                }`}
        >
            <button
                onClick={onClick}
                className="flex-1 flex items-center gap-3 text-left focus:outline-none min-w-0"
                title={t('modules:session.world_atlas.library.select_map', { name: map.name })}
            >
                {/* Thumbnail */}
                <div className="w-12 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-app-bg border border-app-border/20">
                    <ResolvedAsset 
                        src={map.fileUrl} 
                        isVideo={map.isVideo}
                        className="w-full h-full object-cover"
                        alt={map.name}
                        fallback={
                            <div className="w-full h-full flex items-center justify-center bg-app-bg border border-app-border/20 rounded-lg">
                                <Map size={16} className="text-app-text/20" />
                            </div>
                        }
                    />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className={`font-bold text-xs truncate ${isSelected ? 'text-accent' : 'text-app-text/80'}`}>
                        {map.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-ui-9 font-bold px-1.5 py-0.5 rounded border ${typeMeta.color}`}>
                            {typeMeta.icon} {t(typeMeta.labelKey)}
                        </span>
                        {map.isVideo && (
                            <span className="inline-flex items-center gap-1 text-ui-9 font-bold px-1.5 py-0.5 rounded border text-purple-400 bg-purple-500/10 border-purple-500/20">
                                <Film size={8} /> {t('modules:session.world_atlas.library.animated')}
                            </span>
                        )}
                        {isProjected && (
                            <span className="inline-flex items-center gap-1 text-ui-9 font-bold px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                            </span>
                        )}
                        {map.isVisited && (
                            <span className="inline-flex items-center gap-1 text-ui-9 font-bold px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                                <CheckCircle2 size={8} /> {t('modules:session.world_atlas.library.visited')}
                            </span>
                        )}
                    </div>
                </div>
            </button>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Visited Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleVisited(); }}
                    className={`p-1.5 rounded-lg transition-all ${map.isVisited ? 'text-emerald-400 bg-emerald-500/10' : 'text-app-text/20 hover:text-emerald-400/60'}`}
                    title={map.isVisited ? t('modules:session.world_atlas.library.mark_unvisited') : t('modules:session.world_atlas.library.mark_visited')}
                >
                    <CheckCircle2 size={13} fill={map.isVisited ? "currentColor" : "none"} className={map.isVisited ? "text-emerald-400" : ""} />
                </button>
                {/* Pin Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                    className={`p-1.5 rounded-lg transition-all ${isPinned ? 'text-accent bg-accent/10' : 'text-app-text/20 hover:text-accent/60'}`}
                    title={isPinned ? t('modules:session.world_atlas.library.unpin_from_cockpit') : t('modules:session.world_atlas.library.pin_to_cockpit')}
                >
                    <Pin size={13} fill={isPinned ? "currentColor" : "none"} />
                </button>
                {/* Delete Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 hover:text-red-400 text-app-text/20 transition-colors"
                    title={t('modules:session.world_atlas.library.delete_map')}
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
};

const AtlasLibrary: React.FC = () => {
    const { 
        atlasMaps, selectedAtlasMapId, setSelectedAtlasMap, 
        addAtlasMap, deleteAtlasMap, toggleMapVisited, activeCampaignId,
        campaigns, toggleActiveLocation,
        pendingPreFill, clearPendingPreFill 
    } = useSessionOSStore();
    const { t } = useTranslation();
    const { mapUrl } = useMapStore();
    const { mediaList } = useMediaStore();

    const [search, setSearch] = useState('');
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);
    const [wikiPreFill, setWikiPreFill] = useState<{ name: string, description: string } | null>(null);

    // Wiki Bridge Receiver
    React.useEffect(() => {
        if (pendingPreFill && pendingPreFill.type === 'location') {
            setWikiPreFill({
                name: pendingPreFill.data.title,
                description: pendingPreFill.data.content
            });
            setIsBrowserOpen(true);
            clearPendingPreFill();
            gmToast(t('modules:session.world_atlas.library.wiki_location_detected', { name: pendingPreFill.data.title }), 'info');
        }
    }, [pendingPreFill, clearPendingPreFill, t]);

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    const activeLocationIds = activeCampaign?.activeLocationIds || [];

    const filtered = atlasMaps.filter(m =>
        m.campaignId === activeCampaignId &&
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleMediaSelect = (mediaId: string) => {
        const media = mediaList.find(m => m.id === mediaId);
        if (!media) return;

        addAtlasMap({
            name: wikiPreFill?.name || media.name.replace(/\.[^/.]+$/, ''),
            fileUrl: mediaId,
            isVideo: media.type === 'video',
            type: 'dungeon', // Par défaut pour un lieu Wiki
            narrativeDescription: wikiPreFill?.description || '',
            gmNotes: '',
            linkedEntities: [],
            campaignId: activeCampaignId || 'c-1'
        });

        // Reset pre-fill
        setWikiPreFill(null);
    };

    return (
        <div className="w-72 flex-shrink-0 h-full bg-app-surface/90 border-r border-app-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-app-border">
                <div className="flex items-center gap-2 mb-3">
                    <Globe size={16} className="text-accent" />
                    <h3 className="text-app-text font-bold text-sm uppercase tracking-widest">{t('modules:session.world_atlas.title')}</h3>
                </div>
                <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/40" />
                    <input
                        type="text"
                        placeholder={t('modules:session.world_atlas.library.search_placeholder')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-app-bg border border-app-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-app-text/60 placeholder:text-app-text/20 focus:ring-1 focus:ring-accent/50 focus:outline-none"
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
                        isProjected={mapUrl === map.fileUrl} 
                        isPinned={activeLocationIds.includes(map.id)}
                        onClick={() => setSelectedAtlasMap(map.id)}
                        onDelete={() => deleteAtlasMap(map.id)}
                        onTogglePin={() => toggleActiveLocation(map.id)}
                        onToggleVisited={() => toggleMapVisited(map.id)}
                    />
                ))}
                {filtered.length === 0 && (
                    <p className="text-app-text/20 text-xs text-center p-4">{t('modules:session.world_atlas.library.no_maps_found')}</p>
                )}
            </div>

            {/* Import Button */}
            <div className="p-3 border-t border-app-border">
                <button
                    onClick={() => setIsBrowserOpen(true)}
                    className="w-full flex items-center justify-center gap-2 border border-accent/40 text-accent hover:bg-accent/10 py-2.5 rounded-lg text-xs font-bold transition-all"
                >
                    <FolderOpen size={14} />
                    {t('modules:session.world_atlas.library.import_from_media')}
                </button>
            </div>

            <MediaBrowser
                isOpen={isBrowserOpen}
                onClose={() => setIsBrowserOpen(false)}
                onSelect={handleMediaSelect}
                allowedTypes={['image', 'video']}
                title={t('modules:session.world_atlas.library.media_browser_title')}
            />
        </div>
    );
};

export default AtlasLibrary;
