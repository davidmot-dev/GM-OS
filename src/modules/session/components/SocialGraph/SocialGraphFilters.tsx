import React, { useState } from 'react';
import { 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    Search,
    ChevronDown
} from 'lucide-react';

interface CustomSelectProps {
    label: string;
    value: string;
    options: { value: string, label: string }[];
    onChange: (val: string) => void;
    placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="space-y-1 relative">
            <label className="text-[9px] font-bold text-slate-500 uppercase px-1">{label}</label>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white flex justify-between items-center hover:border-neonCyan/50 transition-all"
            >
                <span className={!selectedOption ? 'text-slate-500' : ''}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[70] animate-fade-in animate-slide-up-subtle max-h-48 overflow-y-auto no-scrollbar">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-xs transition-all hover:bg-neonCyan/10 ${value === opt.value ? 'text-neonCyan bg-neonCyan/5 font-bold' : 'text-slate-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

interface SocialGraphFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    typeFilter: string;
    setTypeFilter: (val: string) => void;
    factionFilter: string;
    setFactionFilter: (val: string) => void;
    uniqueFactions: string[];
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    isHeaderHidden: boolean;
    onToggleHeader: () => void;
}

const SocialGraphFilters: React.FC<SocialGraphFiltersProps> = ({
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    factionFilter,
    setFactionFilter,
    uniqueFactions,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    isHeaderHidden,
    onToggleHeader
}) => {
    return (
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 max-w-2xl">
            <div className="flex gap-4">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-2 shadow-2xl">
                    <button onClick={onZoomIn} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white" title="Zoom In">
                        <ZoomIn size={20} />
                    </button>
                    <button onClick={onZoomOut} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white" title="Zoom Out">
                        <ZoomOut size={20} />
                    </button>
                    <button 
                        onClick={onToggleHeader} 
                        className={`p-3 rounded-xl transition-all ${isHeaderHidden ? 'text-accent bg-accent/20 shadow-glow-accent border border-accent/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                        title={isHeaderHidden ? "Sortir du mode immersif" : "Mode Immersif (Plein écran)"}
                    >
                        <Maximize2 size={20} />
                    </button>
                    <div className="w-px h-8 bg-white/10 self-center mx-1" />
                    <button onClick={onZoomReset} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white" title="Reset View">
                        <Search size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl min-w-[300px]">
                    <div className="px-3 text-slate-500">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Rechercher un personnage ou une faction..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-slate-600"
                    />
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-4">
                <div className="w-[140px]">
                    <CustomSelect 
                        label="Filtrer par Type"
                        value={typeFilter}
                        options={[
                            { value: 'all', label: 'TOUS' },
                            { value: 'pc', label: 'PJ (JOUEURS)' },
                            { value: 'npc', label: 'PNJ' },
                            { value: 'monster', label: 'MONSTRES' }
                        ]}
                        onChange={setTypeFilter}
                    />
                </div>
                <div className="flex-1">
                    <CustomSelect 
                        label="Filtrer par Faction"
                        value={factionFilter}
                        options={[
                            { value: 'all', label: 'TOUTES LES FACTIONS' },
                            ...uniqueFactions.map(f => ({ value: f, label: f }))
                        ]}
                        onChange={setFactionFilter}
                    />
                </div>
            </div>
        </div>
    );
};

export default SocialGraphFilters;
export { CustomSelect };
