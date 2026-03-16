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
    const { atlasMaps, selectedAtlasMapId, addLinkedEntity, removeLinkedEntity } = useSessionOSStore();
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
                        <button onClick={() => setPickingCategory(null)} className="text-app-text/20 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                        {favorites
                            .filter(f => f.type === CATEGORY_META[pickingCategory].favType)
                            .map(fav => (
                                <button
                                    key={fav.id}
                                    onClick={() => handleLinkFavorite(fav.id)}
                                    className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-accent/30 hover:bg-accent/5 transition-all group"
                                >
                                    <div className="text-xs font-bold text-app-text/80 group-hover:text-accent transition-colors">{fav.name}</div>
                                    {fav.subtitle && <div className="text-[10px] text-app-text/20 truncate">{fav.subtitle}</div>}
                                </button>
                            ))}
                        {favorites.filter(f => f.type === CATEGORY_META[pickingCategory].favType).length === 0 && (
                            <p className="text-app-text/20 text-[10px] italic text-center mt-10">Aucun favori dans cette catégorie</p>
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

    const handleView = () => {
        if (entity.favoriteId) {
            selectFavorite(entity.favoriteId);
            gmCustom('favorite-dossier');
        }
    };

    return (
        <div className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border text-xs transition-all ${meta.color} ${entity.favoriteId ? 'cursor-pointer hover:brightness-125 hover:border-accent/50' : ''}`}
            onClick={entity.favoriteId ? handleView : undefined}
        >
            <div className="flex items-center gap-1.5 min-w-0">
                {entity.favoriteId && <Star size={10} className="text-accent fill-accent/20 flex-shrink-0" />}
                <span className="truncate">{entity.name}</span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }} 
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
                <X size={10} />
            </button>
        </div>
    );
};

export default AtlasLinkedEntities;
