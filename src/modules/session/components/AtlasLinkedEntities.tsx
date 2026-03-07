import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { AtlasLinkedEntity, AtlasEntityCategory } from '../useSessionOSStore';
import { Users, MapPin, Package, Zap, Plus, X } from 'lucide-react';
import { gmPrompt } from '../../../stores/useModalStore';

const CATEGORY_META: Record<AtlasEntityCategory, { label: string; icon: React.ReactNode; color: string }> = {
    npc: { label: 'PNJs', icon: <Users size={14} className="text-blue-400" />, color: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
    lieu: { label: 'Lieux', icon: <MapPin size={14} className="text-green-400" />, color: 'bg-green-500/10 border-green-500/20 text-green-300' },
    objet: { label: 'Objets', icon: <Package size={14} className="text-amber-400" />, color: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
    evenement: { label: 'Événements', icon: <Zap size={14} className="text-purple-400" />, color: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
};

const CATEGORIES: AtlasEntityCategory[] = ['npc', 'lieu', 'objet', 'evenement'];

const AtlasLinkedEntities: React.FC = () => {
    const { atlasMaps, selectedAtlasMapId, addLinkedEntity, removeLinkedEntity } = useSessionOSStore();
    const selectedMap = atlasMaps.find(m => m.id === selectedAtlasMapId);

    if (!selectedMap) {
        return (
            <div className="w-64 flex-shrink-0 h-full bg-slate-900/90 border-l border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                Sélectionne une carte
            </div>
        );
    }

    const handleAdd = (category: AtlasEntityCategory) => {
        gmPrompt(
            `Nom de l'entité (${CATEGORY_META[category].label}) :`,
            '',
            (name) => {
                if (name.trim()) addLinkedEntity(selectedMap.id, { name: name.trim(), category });
            }
        );
    };

    return (
        <div className="w-64 flex-shrink-0 h-full bg-slate-900/90 border-l border-slate-800 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
                <h3 className="text-slate-100 font-bold text-sm uppercase tracking-widest">Entités Liées</h3>
                <p className="text-slate-600 text-xs mt-1 truncate">{selectedMap.name}</p>
            </div>

            <div className="p-4 flex flex-col gap-5">
                {CATEGORIES.map(cat => {
                    const meta = CATEGORY_META[cat];
                    const entities = selectedMap.linkedEntities.filter(e => e.category === cat);
                    return (
                        <div key={cat}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {meta.icon}
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{meta.label}</span>
                                </div>
                                <button
                                    onClick={() => handleAdd(cat)}
                                    className="w-5 h-5 rounded border border-slate-700 flex items-center justify-center text-slate-500 hover:border-gm-gold/50 hover:text-gm-gold transition-all"
                                >
                                    <Plus size={11} />
                                </button>
                            </div>
                            {entities.length === 0 ? (
                                <p className="text-slate-700 text-[10px] italic pl-1">Aucun élément lié</p>
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
}> = ({ entity, meta, onRemove }) => (
    <div className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border text-xs ${meta.color}`}>
        <span className="truncate">{entity.name}</span>
        <button onClick={onRemove} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <X size={10} />
        </button>
    </div>
);

export default AtlasLinkedEntities;
