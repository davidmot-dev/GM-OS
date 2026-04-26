import React, { useState } from 'react';
import { useFavoriteStore, type FavoriteEntity } from '../useFavoriteStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useMapStore } from '../../map/useMapStore';
import {
    X, Save, Trash2, Edit3, FolderOpen,
    Plus, Sword, MapPin
} from 'lucide-react';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmToast } from '../../../stores/useToastStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';

export const FavoriteDetailPanel: React.FC = () => {
    const {
        favorites, selectedFavoriteId, updateFavorite,
        selectFavorite, setViewMode
    } = useFavoriteStore();
    const { addCombatant } = useCombatStore();
    const { addToken } = useMapStore();

    const entity = favorites.find(f => f.id === selectedFavoriteId);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<FavoriteEntity>>(entity || {});

    // Session Data
    const campaigns = useSessionOSStore(s => s.campaigns);
    const players = useSessionOSStore(s => s.players);

    // Media Browser State
    const [browserTarget, setBrowserTarget] = useState<'imageUrl' | 'tokenUrl' | null>(null);

    // Resolved URLs for display
    const resolvedImageUrl = useMediaUrl(formData.imageUrl);

    const handleMediaSelect = (mediaId: string) => {
        if (browserTarget) {
            setFormData(prev => ({ ...prev, [browserTarget]: mediaId }));
            setBrowserTarget(null);
        }
    };

    if (!entity) return null;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'npc': return 'person_celebrate';
            case 'place': return 'map';
            case 'item': return 'auto_fix_high';
            case 'lore': return 'auto_stories';
            default: return 'star';
        }
    };

    const handleSave = () => {
        if (entity.id && formData) {
            updateFavorite(entity.id, formData);
            setIsEditing(false);
            gmToast("Entité mise à jour avec succès !");
        }
    };

    const handleCancel = () => {
        setFormData({ ...entity });
        setIsEditing(false);
    };

    const typeColor =
        entity.type === 'npc' ? 'text-amber-500 ring-amber-500/20' :
            entity.type === 'place' ? 'text-emerald-500 ring-emerald-500/20' :
                entity.type === 'item' ? 'text-purple-500 ring-purple-500/20' :
                    'text-accent ring-accent/20';

    return (
        <aside className="w-96 bg-app-surface/80 backdrop-blur-xl border-l border-app-border p-8 pb-24 overflow-y-auto hidden xl:flex flex-col gap-8 shrink-0 shadow-2xl custom-scrollbar">
            <MediaBrowser
                isOpen={browserTarget !== null}
                onClose={() => setBrowserTarget(null)}
                onSelect={handleMediaSelect}
                allowedTypes={['image']}
                title={`Sélectionner une ${browserTarget === 'tokenUrl' ? 'icône/token' : 'image de portrait'}`}
            />
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100">{isEditing ? 'Editing Dossier' : 'Details'}</h2>
                <div className="flex items-center gap-2">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 rounded-lg bg-app-surface border border-app-border hover:bg-accent/20 text-slate-400 hover:text-accent transition-all"
                            title="Edit Dossier"
                        >
                            <Edit3 size={18} />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all"
                                title="Save Changes"
                            >
                                <Save size={18} />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                                title="Cancel"
                            >
                                <X size={18} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => selectFavorite(null)}
                        className="p-1 rounded-lg hover:bg-app-surface text-slate-400 hover:text-white transition-colors ml-2"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className={`w-32 h-32 rounded-full ring-4 ${typeColor.split(' ')[1]} overflow-hidden bg-app-bg relative group`}>
                        {resolvedImageUrl ? (
                            <img className="w-full h-full object-cover" src={resolvedImageUrl} alt={formData.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                <span className="material-symbols-outlined text-4xl">{getTypeIcon(entity.type)}</span>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="w-full space-y-3">
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-app-surface border-b-2 border-accent/50 text-white text-xl font-bold text-center focus:outline-none focus:border-accent transition-colors"
                                placeholder="Name..."
                            />
                            <input
                                type="text"
                                value={formData.subtitle || ''}
                                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                className="w-full bg-app-bg border border-app-border rounded-lg p-2 text-sm text-center text-slate-300 focus:outline-none focus:border-accent"
                                placeholder="Subtitle (e.g. Ruler of mountains)..."
                            />
                            
                            {/* Campaign & Owner Selectors */}
                            <div className="space-y-4 pt-2">
                                <section className="space-y-2 text-left">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Campagne Associée</label>
                                    <select
                                        value={formData.campaignId || ''}
                                        onChange={e => setFormData({ ...formData, campaignId: e.target.value || undefined, ownerId: undefined })}
                                        className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-accent"
                                    >
                                        <option value="">-- Aucune Campagne --</option>
                                        {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </section>

                                {formData.campaignId && entity.type === 'item' && (
                                    <section className="space-y-2 text-left animate-in fade-in">
                                        <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest ml-1">Propriétaire Privé</label>
                                        <select
                                            value={formData.ownerId || ''}
                                            onChange={e => setFormData({ ...formData, ownerId: e.target.value || undefined })}
                                            className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-emerald-400 focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="">-- Aucun (Inventaire MJ) --</option>
                                            {players
                                                .flatMap(p => p.characters)
                                                .filter(c => c.campaignId === formData.campaignId)
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))
                                            }
                                        </select>
                                    </section>
                                )}
                            </div>

                            <div className="space-y-4">
                                <section className="space-y-2 text-left">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Portrait URL / Media</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.imageUrl || ''}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                            className="flex-1 bg-app-bg border border-app-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-accent font-mono"
                                            placeholder="https://... ou m-..."
                                        />
                                        <button
                                            onClick={() => setBrowserTarget('imageUrl')}
                                            className="p-2 rounded-lg bg-app-surface border border-app-border text-slate-400 hover:text-accent transition-colors"
                                            title="Parcourir le Media Hub"
                                        >
                                            <FolderOpen size={14} />
                                        </button>
                                    </div>
                                </section>
                                <section className="space-y-2 text-left">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Token URL / Media</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.tokenUrl || ''}
                                            onChange={e => setFormData({ ...formData, tokenUrl: e.target.value })}
                                            className="flex-1 bg-app-bg border border-app-border rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-accent font-mono"
                                            placeholder="https://... ou m-..."
                                        />
                                        <button
                                            onClick={() => setBrowserTarget('tokenUrl')}
                                            className="p-2 rounded-lg bg-app-surface border border-app-border text-slate-400 hover:text-accent transition-colors"
                                            title="Parcourir le Media Hub"
                                        >
                                            <FolderOpen size={14} />
                                        </button>
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-2xl font-bold text-slate-100">{entity.name}</h3>
                            {entity.subtitle && (
                                <p className={`${typeColor.split(' ')[0]} font-semibold text-sm`}>{entity.subtitle}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Quick Traits</h4>
                        {isEditing && (
                            <button
                                onClick={() => {
                                    const attrs = { ...(formData.attributes || {}) };
                                    attrs[`Trait ${Object.keys(attrs).length + 1}`] = 'Value';
                                    setFormData({ ...formData, attributes: attrs });
                                }}
                                className="text-accent hover:text-white transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(formData.attributes || {}).map(([key, value]) => (
                            <div key={key} className="p-4 rounded-2xl bg-app-surface/50 border border-app-border/50 flex flex-col items-center justify-center text-center relative group/attr">
                                {isEditing ? (
                                    <>
                                        <input
                                            type="text"
                                            value={key}
                                            onChange={e => {
                                                const newKey = e.target.value;
                                                const attrs = { ...formData.attributes };
                                                delete attrs[key];
                                                attrs[newKey] = value;
                                                setFormData({ ...formData, attributes: attrs });
                                            }}
                                            className="w-full bg-transparent text-[10px] text-accent uppercase font-bold text-center focus:outline-none mb-1"
                                        />
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={e => {
                                                const attrs = { ...formData.attributes };
                                                attrs[key] = e.target.value;
                                                setFormData({ ...formData, attributes: attrs });
                                            }}
                                            className="w-full bg-transparent text-sm font-bold text-white text-center focus:outline-none"
                                        />
                                        <button
                                            onClick={() => {
                                                const attrs = { ...formData.attributes };
                                                delete attrs[key];
                                                setFormData({ ...formData, attributes: attrs });
                                            }}
                                            className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover/attr:opacity-100 transition-opacity scale-75"
                                        >
                                            <X size={10} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{key}</p>
                                        <p className="text-sm font-bold text-slate-200">{value}</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Gauges & Stats</h4>
                        {isEditing && (
                            <button
                                onClick={() => {
                                    const stats = { ...(formData.stats || {}) };
                                    stats[`Stat ${Object.keys(stats).length + 1}`] = 50;
                                    setFormData({ ...formData, stats: stats });
                                }}
                                className="text-accent hover:text-white transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {Object.entries(formData.stats || {}).map(([stat, val]) => {
                            const blocks = 5;
                            const filledBlocks = Math.round((val / 100) * blocks);

                            return (
                                <div key={stat} className="flex flex-col gap-1 group/stat">
                                    <div className="flex items-center justify-between text-sm">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={stat}
                                                    onChange={e => {
                                                        const newKey = e.target.value;
                                                        const stats = { ...formData.stats };
                                                        delete stats[stat];
                                                        stats[newKey] = val;
                                                        setFormData({ ...formData, stats: stats });
                                                    }}
                                                    className="bg-transparent text-slate-400 focus:text-white focus:outline-none w-24"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const stats = { ...formData.stats };
                                                        delete stats[stat];
                                                        setFormData({ ...formData, stats: stats });
                                                    }}
                                                    className="opacity-0 group-hover/stat:opacity-100 text-rose-500 transition-opacity"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">{stat}</span>
                                        )}

                                        {isEditing ? (
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="20"
                                                value={val}
                                                onChange={e => {
                                                    const stats = { ...formData.stats };
                                                    stats[stat] = parseInt(e.target.value);
                                                    setFormData({ ...formData, stats: stats });
                                                }}
                                                className="w-20 accent-accent"
                                            />
                                        ) : (
                                            <div className="flex gap-1">
                                                {Array.from({ length: blocks }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-6 h-1 rounded-full ${i < filledBlocks ? typeColor.replace('text-', 'bg-').split(' ')[0] : 'bg-app-bg'}`}
                                                    ></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Background Lore</h4>
                    {isEditing ? (
                        <textarea
                            value={formData.lore || ''}
                            onChange={e => setFormData({ ...formData, lore: e.target.value })}
                            className="w-full bg-app-surface/50 border border-app-border/50 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-accent/50 min-h-[120px] custom-scrollbar"
                            placeholder="Describe history, motivations, secrets..."
                        />
                    ) : (
                        <p className="text-sm text-slate-400 leading-relaxed italic">
                            {entity.lore || "No lore recorded yet."}
                        </p>
                    )}
                </div>

                <div className="pt-6 mt-auto space-y-3">
                    {entity.type === 'npc' && (
                        <button
                            onClick={() => {
                                addCombatant({
                                    name: entity.name,
                                    hp: 10,
                                    hpMax: 10,
                                    init: Math.floor(Math.random() * 20) + 1,
                                    isPlayer: false,
                                    avatar: entity.tokenUrl || entity.imageUrl,
                                    faction: 'neutral',
                                    statuses: []
                                });
                                gmToast(`${entity.name} envoyé au Combat OS!`);
                            }}
                            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Sword size={18} />
                            SEND TO COMBAT
                        </button>
                    )}

                    {(entity.type === 'npc' || entity.type === 'place') && (
                        <button
                            onClick={() => {
                                addToken({
                                    name: entity.name,
                                    avatar: entity.tokenUrl || entity.imageUrl || '',
                                    x: 200,
                                    y: 200,
                                    size: 1
                                });
                                gmToast(`${entity.name} envoyé sur la Map!`);
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            <MapPin size={18} />
                            SEND TO MAP
                        </button>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const newVal = !entity.isSyncedToPlayerHub;
                            updateFavorite(entity.id, { isSyncedToPlayerHub: newVal });
                            gmToast(`${entity.name} ${newVal ? 'partagé avec' : 'retiré du'} Player Hub!`);
                        }}
                        className={`w-full py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg
                            ${entity.isSyncedToPlayerHub
                                ? 'bg-accent/20 border-accent text-accent shadow-glow-accent'
                                : 'bg-app-bg border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}
                    >
                        <span className="material-symbols-outlined text-sm">{entity.isSyncedToPlayerHub ? 'visibility' : 'visibility_off'}</span>
                        PLAYER HUB SYNC
                    </button>

                    <button
                        onClick={() => setViewMode('detail')}
                        className="w-full py-3 bg-accent hover:bg-accent/80 text-slate-950 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg"
                    >
                        OPEN FULL DOSSIER
                    </button>
                </div>
            </div>
        </aside>
    );
};
