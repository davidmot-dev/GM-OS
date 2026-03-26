import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { AtlasLinkedEntity, AtlasEntityCategory } from '../useSessionOSStore';
import { useFavoriteStore } from '../../favorite/useFavoriteStore';
import { Users, MapPin, Package, Zap, Plus, X, Bookmark, Star } from 'lucide-react';
import { gmPrompt, gmCustom } from '../../../stores/useModalStore';

const CATEGORY_META: Record<AtlasEntityCategory, { label: string; icon: React.ReactNode; color: string; favType: string }> = {
    npc: { label: 'PNJs', icon: <Users size={14} className="text-blue-400" />, color: 'bg-blue-500/10 border-blue-500/20 text-blue-300', favType: 'npc' },
    lieu: { label: 'Lieux', icon: <MapPin size={14} className="text-green-400" />, color: 'bg-green-500/10 border-green-500/20 text-green-300', favType: 'place' },
    objet: { label: 'Objets', icon: <Package size={14} className="text-amber-400" />, color: 'bg-amber-500/10 border-amber-500/20 text-amber-300', favType: 'item' },
    evenement: { label: 'Événements', icon: <Zap size={14} className="text-purple-400" />, color: 'bg-purple-500/10 border-purple-500/20 text-purple-300', favType: 'lore' },
};

const CATEGORIES: AtlasEntityCategory[] = ['npc', 'lieu', 'objet', 'evenement'];

const AtlasLinkedEntities: React.FC = () => {
    const { 
        atlasMaps, selectedAtlasMapId, addLinkedEntity, removeLinkedEntity, 
        entities, activeCampaignId, wikiEntries
    } = useSessionOSStore();
    const { favorites } = useFavoriteStore();
    const [pickingCategory, setPickingCategory] = useState<AtlasEntityCategory | null>(null);

    const selectedMap = atlasMaps.find(m => m.id === selectedAtlasMapId);

    if (!selectedMap) {
        return (
            <div className="w-64 flex-shrink-0 h-full bg-app-surface/90 border-l border-app-border flex items-center justify-center text-app-text/20 text-xs">
                Sélectionne une carte
            </div>
        );
    }

    const handleAddManual = (category: AtlasEntityCategory) => {
        gmPrompt(
            `Nom de l'entité (${CATEGORY_META[category].label}) :`,
            '',
            (name) => {
                if (name.trim()) addLinkedEntity(selectedMap.id, { name: name.trim(), category });
            }
        );
    };

    const handleLinkFavorite = (favId: string) => {
        const fav = favorites.find(f => f.id === favId);
        if (fav && pickingCategory) {
            addLinkedEntity(selectedMap.id, { 
                name: fav.name, 
                category: pickingCategory,
                favoriteId: fav.id 
            });
            setPickingCategory(null);
        }
    };

    const handleLinkCampaignEntity = (entityId: string) => {
        const entity = entities.find(e => e.id === entityId);
        if (entity && pickingCategory) {
            addLinkedEntity(selectedMap.id, {
                name: entity.name,
                category: pickingCategory,
                entityId: entity.id
            });
            setPickingCategory(null);
        }
    };

    const handleLinkAtlasMap = (mapId: string) => {
        const targetMap = atlasMaps.find(m => m.id === mapId);
        if (targetMap && pickingCategory) {
            addLinkedEntity(selectedMap.id, {
                name: targetMap.name,
                category: pickingCategory,
                mapId: targetMap.id
            });
            setPickingCategory(null);
        }
    };

    const handleLinkWikiEntry = (entryId: string) => {
        const entry = wikiEntries.find(e => e.id === entryId);
        if (entry && pickingCategory) {
            addLinkedEntity(selectedMap.id, {
                name: entry.title,
                category: pickingCategory,
                wikiEntryId: entry.id
            });
            setPickingCategory(null);
        }
    };

    return (
        <div className="w-64 flex-shrink-0 h-full bg-app-surface/90 border-l border-app-border flex flex-col overflow-y-auto custom-scrollbar relative">
            <div className="p-4 border-b border-app-border sticky top-0 bg-app-surface/90 backdrop-blur-sm z-10">
                <h3 className="text-app-text font-bold text-sm uppercase tracking-widest">Entités Liées</h3>
                <p className="text-app-text/20 text-xs mt-1 truncate">{selectedMap.name}</p>
            </div>

            {/* Favorite Picker Overlay */}
            {pickingCategory && (
                <div className="absolute inset-0 z-20 bg-app-bg/95 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black text-accent uppercase tracking-widest">Lier un Favori</h4>
                        <button 
                            onClick={() => setPickingCategory(null)} 
                            className="text-app-text/20 hover:text-white"
                            title="Fermer le sélecteur"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                        {/* Section Favoris */}
                        <div>
                            <div className="text-[8px] font-bold text-app-text/30 px-3 mb-1 flex items-center gap-1 uppercase tracking-tighter">
                                <Bookmark size={8} /> Favoris
                            </div>
                            <div className="flex flex-col gap-1">
                                {favorites
                                    .filter(f => f.type === CATEGORY_META[pickingCategory].favType)
                                    .map(fav => (
                                        <button
                                            key={fav.id}
                                            onClick={() => handleLinkFavorite(fav.id)}
                                            className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-accent/30 hover:bg-accent/5 transition-all group flex items-center justify-between"
                                            title={`Lier le favori ${fav.name}`}
                                        >
                                            <div className="min-w-0 pr-2">
                                                <div className="text-xs font-bold text-app-text/80 group-hover:text-accent transition-colors truncate">{fav.name}</div>
                                                {fav.subtitle && <div className="text-[10px] text-app-text/20 truncate">{fav.subtitle}</div>}
                                            </div>
                                            <Star size={10} className="text-accent/50 flex-shrink-0" />
                                        </button>
                                    ))}
                            </div>
                        </div>

                        {/* Section Campagne (Entities) - Uniquement pour les PNJs pour l'instant */}
                        {pickingCategory === 'npc' && (
                            <div className="mt-2">
                                <div className="text-[8px] font-bold text-app-text/30 px-3 mb-1 flex items-center gap-1 uppercase tracking-tighter">
                                    <Users size={8} /> Galerie PNJ
                                </div>
                                <div className="flex flex-col gap-1">
                                    {entities
                                        .filter(e => e.campaignId === activeCampaignId)
                                        .map(entity => (
                                            <button
                                                key={entity.id}
                                                onClick={() => handleLinkCampaignEntity(entity.id)}
                                                className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-accent/30 hover:bg-accent/5 transition-all group flex items-center justify-between"
                                                title={`Lier le PNJ ${entity.name}`}
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <div className="text-xs font-bold text-app-text/80 group-hover:text-accent transition-colors truncate">{entity.name}</div>
                                                    <div className="text-[10px] text-app-text/20 truncate">{entity.description || 'PNJ de campagne'}</div>
                                                </div>
                                                <Users size={10} className="text-blue-400/50 flex-shrink-0" />
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Section Cartes Atlas - Uniquement pour les Lieux pour l'instant */}
                        {pickingCategory === 'lieu' && (
                            <div className="mt-2">
                                <div className="text-[8px] font-bold text-app-text/30 px-3 mb-1 flex items-center gap-1 uppercase tracking-tighter">
                                    <MapPin size={8} /> Cartes de l'Atlas
                                </div>
                                <div className="flex flex-col gap-1">
                                    {atlasMaps
                                        .filter(m => m.campaignId === activeCampaignId && m.id !== selectedMap.id)
                                        .map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => handleLinkAtlasMap(m.id)}
                                                className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-accent/30 hover:bg-accent/5 transition-all group flex items-center justify-between"
                                                title={`Lier la carte ${m.name}`}
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <div className="text-xs font-bold text-app-text/80 group-hover:text-accent transition-colors truncate">{m.name}</div>
                                                    <div className="text-[10px] text-app-text/20 truncate">Carte de l'Atlas</div>
                                                </div>
                                                <MapPin size={10} className="text-green-400/50 flex-shrink-0" />
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Section Wiki - Événements ou Objets */}
                        {(pickingCategory === 'evenement' || pickingCategory === 'objet') && (
                            <div className="mt-2">
                                <div className="text-[8px] font-bold text-app-text/30 px-3 mb-1 flex items-center gap-1 uppercase tracking-tighter">
                                    {pickingCategory === 'evenement' ? <Zap size={8} /> : <Package size={8} />} Wiki du Monde
                                </div>
                                <div className="flex flex-col gap-1">
                                    {wikiEntries
                                        .filter(e => e.campaignId === activeCampaignId)
                                        .filter(e => pickingCategory === 'evenement' ? true : e.category === 'item')
                                        .map(entry => (
                                            <button
                                                key={entry.id}
                                                onClick={() => handleLinkWikiEntry(entry.id)}
                                                className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-accent/30 hover:bg-accent/5 transition-all group flex items-center justify-between"
                                                title={`Lier l'article ${entry.title}`}
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <div className="text-xs font-bold text-app-text/80 group-hover:text-accent transition-colors truncate">{entry.title}</div>
                                                    <div className="text-[10px] text-app-text/20 truncate">Article {entry.category}</div>
                                                </div>
                                                {pickingCategory === 'evenement' ? (
                                                    <Zap size={10} className="text-purple-400/50 flex-shrink-0" />
                                                ) : (
                                                    <Package size={10} className="text-amber-400/50 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        {favorites.filter(f => f.type === CATEGORY_META[pickingCategory].favType).length === 0 && 
                         (pickingCategory === 'npc' ? entities.filter(e => e.campaignId === activeCampaignId).length === 0 : 
                          pickingCategory === 'lieu' ? atlasMaps.filter(m => m.campaignId === activeCampaignId && m.id !== selectedMap.id).length === 0 : 
                          pickingCategory === 'evenement' ? wikiEntries.filter(e => e.campaignId === activeCampaignId).length === 0 :
                          pickingCategory === 'objet' ? wikiEntries.filter(e => e.campaignId === activeCampaignId && e.category === 'item').length === 0 : true) && (
                            <p className="text-app-text/20 text-[10px] italic text-center mt-10">Aucun élément disponible</p>
                        )}
                    </div>
                </div>
            )}

            <div className="p-4 flex flex-col gap-5">
                {CATEGORIES.map(cat => {
                    const meta = CATEGORY_META[cat];
                    const entities = (selectedMap.linkedEntities || []).filter(e => e.category === cat);
                    return (
                        <div key={cat}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {meta.icon}
                                    <span className="text-xs font-bold text-app-text/40 uppercase tracking-wider">{meta.label}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPickingCategory(cat)}
                                        className="w-5 h-5 rounded border border-app-border flex items-center justify-center text-app-text/20 hover:border-accent/50 hover:text-accent transition-all"
                                        title="Lier un favori"
                                    >
                                        <Bookmark size={10} />
                                    </button>
                                    <button
                                        onClick={() => handleAddManual(cat)}
                                        className="w-5 h-5 rounded border border-app-border flex items-center justify-center text-app-text/20 hover:border-accent/50 hover:text-accent transition-all"
                                        title="Saisie manuelle"
                                    >
                                        <Plus size={11} />
                                    </button>
                                </div>
                            </div>
                            {entities.length === 0 ? (
                                <p className="text-app-text/10 italic pl-1">Aucun élément lié</p>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {entities.map(entity => (
                                        <EntityChip
                                            key={entity.id}
                                            entity={entity}
                                            meta={meta}
                                            onRemove={() => removeLinkedEntity(selectedMap.id, entity.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const EntityChip: React.FC<{
    entity: AtlasLinkedEntity;
    meta: { color: string };
    onRemove: () => void;
}> = ({ entity, meta, onRemove }) => {
    const { selectFavorite } = useFavoriteStore();
    const { setSelectedEntity, setCurrentView, setSelectedAtlasMap, setWikiTab, setSelectedWikiEntryId } = useSessionOSStore();

    const handleView = () => {
        if (entity.favoriteId) {
            selectFavorite(entity.favoriteId);
            gmCustom('favorite-dossier');
        } else if (entity.entityId) {
            setSelectedEntity(entity.entityId);
            setCurrentView('npc-gallery');
        } else if (entity.mapId) {
            setSelectedAtlasMap(entity.mapId);
        } else if (entity.wikiEntryId) {
            setWikiTab('wiki');
            setSelectedWikiEntryId(entity.wikiEntryId);
            setCurrentView('timeline-wiki');
        }
    };

    return (
        <div className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border text-xs transition-all ${meta.color} ${entity.favoriteId || entity.entityId || entity.mapId || entity.wikiEntryId ? 'cursor-pointer hover:brightness-125 hover:border-accent/50' : ''}`}
            onClick={entity.favoriteId || entity.entityId || entity.mapId || entity.wikiEntryId ? handleView : undefined}
        >
            <div className="flex items-center gap-1.5 min-w-0">
                {entity.favoriteId && <Star size={10} className="text-accent fill-accent/20 flex-shrink-0" />}
                {entity.entityId && <Users size={10} className="text-blue-400 flex-shrink-0" />}
                {entity.mapId && <MapPin size={10} className="text-green-400 flex-shrink-0" />}
                {entity.wikiEntryId && entity.category === 'evenement' && <Zap size={10} className="text-purple-400 flex-shrink-0" />}
                {entity.wikiEntryId && entity.category === 'objet' && <Package size={10} className="text-amber-400 flex-shrink-0" />}
                <span className="truncate">{entity.name}</span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }} 
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                title="Supprimer le lien"
            >
                <X size={10} />
            </button>
        </div>
    );
};

export default AtlasLinkedEntities;
