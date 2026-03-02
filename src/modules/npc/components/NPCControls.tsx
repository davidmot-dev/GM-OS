import React from 'react';
import { useNPCStore, type NPCCategory } from '../useNPCStore';
import { Users, MapPin, Box, Zap, MessageSquare, Dices, type LucideIcon } from 'lucide-react';

const NPCControls: React.FC = () => {
    const { config, setConfig, availableUniverses, generate, isGenerating } = useNPCStore();

    const categories: { id: NPCCategory, label: string, icon: LucideIcon }[] = [
        { id: 'npcs', label: 'PNJ', icon: Users },
        { id: 'places', label: 'Lieux', icon: MapPin },
        { id: 'items', label: 'Objets', icon: Box },
        { id: 'events', label: 'Événements', icon: Zap },
        { id: 'rumors', label: 'Rumeurs', icon: MessageSquare },
    ];

    return (
        <div className="p-4 flex flex-col gap-4 border-b border-slate-800 bg-obsidian-light/50">
            <h2 className="text-gm-cyan font-display font-bold text-lg flex items-center gap-2">
                <Dices size={20} />
                Générateur Universel
            </h2>

            {/* Category Selectors */}
            <div className="grid grid-cols-5 gap-1">
                {categories.map(cat => {
                    const Icon = cat.icon;
                    const isActive = config.category === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setConfig({ category: cat.id })}
                            className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${isActive
                                ? 'bg-gm-cyan text-obsidian shadow-glow-cyan scale-105'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                            title={cat.label}
                        >
                            <Icon size={18} />
                        </button>
                    );
                })}
            </div>

            {/* Universe Selector */}
            <div className="flex flex-col gap-3">
                {/* Level 1: Universe */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 font-sans tracking-tight">Univers (Préfixe)</label>
                    <select
                        value={config.universe.split('_')[0]}
                        onChange={(e) => {
                            const selectedPrefix = e.target.value;
                            // Reset to the first theme of this universe
                            const firstTheme = availableUniverses.find(u => u.startsWith(selectedPrefix)) || "";
                            setConfig({ universe: firstTheme });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-gm-cyan custom-scrollbar"
                    >
                        {Array.from(new Set(availableUniverses.map(u => u.split('_')[0]))).sort().map(prefix => (
                            <option key={prefix} value={prefix}>{prefix}</option>
                        ))}
                        {availableUniverses.length === 0 && <option disabled>Aucune base</option>}
                    </select>
                </div>

                {/* Level 2: Theme */}
                <div className="flex flex-col gap-1 animate-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 font-sans tracking-tight">Thème / Fichier</label>
                    <select
                        value={config.universe}
                        onChange={(e) => setConfig({ universe: e.target.value })}
                        disabled={availableUniverses.length === 0}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-gm-cyan font-bold focus:outline-none focus:border-gm-cyan custom-scrollbar shadow-inner"
                    >
                        {availableUniverses
                            .filter(u => u.startsWith(config.universe.split('_')[0]))
                            .sort()
                            .map((u: string) => (
                                <option key={u} value={u}>
                                    {u.includes('_') ? u.split('_').slice(1).join('_') : u}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={() => generate()}
                disabled={isGenerating || availableUniverses.length === 0}
                className="w-full py-3 bg-gm-cyan hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-obsidian font-bold rounded-xl shadow-glow-cyan flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group mt-2"
            >
                <Dices size={20} className={isGenerating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'} />
                <span className="uppercase tracking-wider text-xs font-sans">
                    {isGenerating ? 'Génération...' : `Générer ${categories.find(c => c.id === config.category)?.label}`}
                </span>
            </button>
        </div>
    );
};

export default NPCControls;
