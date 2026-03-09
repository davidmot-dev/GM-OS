import React, { useState } from 'react';
import { Plus, MoreHorizontal, Edit2, Trash2, Check } from 'lucide-react';
import { useSoundStore } from '../useSoundStore';
import type { Atmosphere } from '../useSoundStore';

const AtmosphereManager: React.FC = () => {
    const { 
        atmospheres, 
        activeAtmosphereId, 
        addAtmosphere, 
        removeAtmosphere, 
        setActiveAtmosphereId, 
        renameAtmosphere 
    } = useSoundStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const handleAdd = () => {
        const name = `Atmosphère ${atmospheres.length + 1}`;
        addAtmosphere(name);
    };

    const startRename = (atmos: Atmosphere) => {
        setEditingId(atmos.id);
        setEditValue(atmos.name);
        setMenuOpenId(null);
    };

    const handleRename = () => {
        if (editingId && editValue.trim()) {
            renameAtmosphere(editingId, editValue.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="flex items-center gap-3 py-2 overflow-x-auto no-scrollbar mask-fade-right min-h-[50px]">
            <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-inner">
                {atmospheres.map((atmos) => (
                    <div key={atmos.id} className="relative group flex items-center">
                        {editingId === atmos.id ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gm-violet/20 border border-gm-violet rounded-xl">
                                <input
                                    autoFocus
                                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none w-24"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleRename}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                />
                                <button onClick={handleRename}>
                                    <Check size={12} className="text-gm-violet" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <button
                                    onClick={() => setActiveAtmosphereId(atmos.id)}
                                    onDoubleClick={() => startRename(atmos)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setMenuOpenId(menuOpenId === atmos.id ? null : atmos.id);
                                    }}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeAtmosphereId === atmos.id
                                            ? 'bg-gm-violet text-white shadow-glow-violet'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                                >
                                    {atmos.name}
                                </button>
                                
                                {/* Hover Menu Trigger */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenId(menuOpenId === atmos.id ? null : atmos.id);
                                    }}
                                    className={`absolute -right-1 -top-1 size-5 bg-obsidian-dark border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:border-white/20 hover:bg-slate-800 ${menuOpenId === atmos.id ? 'opacity-100' : ''}`}
                                >
                                    <MoreHorizontal size={10} className="text-slate-400" />
                                </button>

                                {/* Mini Menu */}
                                {menuOpenId === atmos.id && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setMenuOpenId(null)}
                                        />
                                        <div className="absolute top-full left-0 mt-2 w-32 bg-obsidian-dark/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-3xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                                            <button 
                                                onClick={() => startRename(atmos)}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                                            >
                                                <Edit2 size={10} />
                                                Rename
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (confirm('Supprimer cette atmosphère ?')) {
                                                        removeAtmosphere(atmos.id);
                                                    }
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black text-red-400/70 uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={10} />
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={handleAdd}
                className="size-9 flex items-center justify-center bg-black/40 border border-white/5 text-slate-500 rounded-2xl hover:border-gm-violet/30 hover:text-gm-violet hover:bg-gm-violet/5 transition-all active:scale-95 shadow-lg flex-shrink-0"
                title="Nouvelle Atmosphère"
            >
                <Plus size={18} />
            </button>
        </div>
    );
};

export default AtmosphereManager;
