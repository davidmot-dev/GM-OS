import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    Search,
    ChevronDown,
    Lock,
    Unlock,
    RefreshCw,
    Sliders
} from 'lucide-react';

interface CustomSelectProps {
    label: string;
    value: string;
    options: { value: string, label: string }[];
    onChange: (val: string) => void;
    placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange, placeholder }) => {
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
    isLocked?: boolean;
    onToggleLock?: () => void;
    onResetLayout?: () => void;
    
    // Nouveaux réglages de physique
    physicsSettings: {
        charge: number;
        distance: number;
        collision: number;
    };
    setPhysicsSettings: {
        setCharge: (val: number) => void;
        setDistance: (val: number) => void;
        setCollision: (val: number) => void;
    };
    isSettingsOpen: boolean;
    setIsSettingsOpen: (val: boolean) => void;
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
    onToggleHeader,
    isLocked,
    onToggleLock,
    onResetLayout,
    physicsSettings,
    setPhysicsSettings,
    isSettingsOpen,
    setIsSettingsOpen
}) => {
    const { t } = useTranslation();
    return (

        <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 max-w-2xl">
            <div className="flex gap-4">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-2 shadow-2xl">
                    <button onClick={onZoomIn} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white" title={t('modules:session.social_graph.tooltips.zoom_in')}>
                        <ZoomIn size={20} />
                    </button>
                    <button onClick={onZoomOut} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white" title={t('modules:session.social_graph.tooltips.zoom_out')}>
                        <ZoomOut size={20} />
                    </button>
                    <button 
                        onClick={onToggleHeader} 
                        className={`p-3 rounded-xl transition-all ${isHeaderHidden ? 'text-accent bg-accent/20 shadow-glow-accent border border-accent/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                        title={isHeaderHidden ? t('modules:session.social_graph.tooltips.immersive_on') : t('modules:session.social_graph.tooltips.immersive_off')}
                    >
                        <Maximize2 size={20} />
                    </button>
                    <div className="w-px h-8 bg-white/10 self-center mx-1" />
                    <button onClick={onZoomReset} className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white" title={t('modules:session.social_graph.tooltips.reset_view')}>
                        <Search size={20} className="rotate-45" />
                    </button>
                    <div className="w-px h-8 bg-white/10 self-center mx-1" />
                    <button 
                        onClick={onToggleLock} 
                        className={`p-3 rounded-xl transition-all ${isLocked ? 'text-neonCyan bg-neonCyan/20 shadow-glow border border-neonCyan/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                        title={isLocked ? t('modules:session.social_graph.tooltips.lock_on') : t('modules:session.social_graph.tooltips.lock_off')}
                    >
                        {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                    <button 
                        onClick={onResetLayout} 
                        className="p-3 hover:bg-red-500/20 rounded-xl transition-all text-slate-400 hover:text-red-400" 
                        title={t('modules:session.social_graph.tooltips.reset_layout')}
                    >
                        <RefreshCw size={20} />
                    </button>
                    <div className="w-px h-8 bg-white/10 self-center mx-1" />
                    <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                        className={`p-3 rounded-xl transition-all ${isSettingsOpen ? 'text-accent bg-accent/20 shadow-glow-accent border border-accent/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                        title={t('modules:session.social_graph.tooltips.physics_settings')}
                    >
                        <Sliders size={20} />
                    </button>
                </div>


                <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl min-w-[300px]">
                    <div className="px-3 text-slate-500">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text"
                        placeholder={t('modules:session.social_graph.filters.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-slate-600"
                    />
                </div>

            </div>

            {/* Physics Settings Popover */}
            {isSettingsOpen && (
                <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in animate-slide-up-subtle w-[350px] space-y-6 mt-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] font-black uppercase text-accent tracking-widest">{t('modules:session.social_graph.physics.settings_title')}</span>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white text-[10px] font-bold uppercase transition-colors">{t('modules:session.social_graph.physics.close')}</button>
                    </div>


                    {/* Charge Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                            <span className="text-slate-400">{t('modules:session.social_graph.physics.charge_label')}</span>
                            <span className="text-neonCyan">{physicsSettings.charge}</span>
                        </div>

                        <input 
                            type="range" 
                            min="-500" 
                            max="-50" 
                            step="10"
                            value={physicsSettings.charge}
                            onChange={(e) => setPhysicsSettings.setCharge(Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-neonCyan"
                            title="Ajuster la force de répulsion entre les nœuds"
                        />
                        <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase">
                            <span>{t('modules:session.social_graph.physics.dense')}</span>
                            <span>{t('modules:session.social_graph.physics.airy')}</span>
                        </div>
                    </div>


                    {/* Distance Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                            <span className="text-slate-400">{t('modules:session.social_graph.physics.distance_label')}</span>
                            <span className="text-neonCyan">{physicsSettings.distance}px</span>
                        </div>

                        <input 
                            type="range" 
                            min="50" 
                            max="300" 
                            step="10"
                            value={physicsSettings.distance}
                            onChange={(e) => setPhysicsSettings.setDistance(Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-neonCyan"
                            title="Ajuster la longueur par défaut des liens"
                        />
                         <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase">
                            <span>{t('modules:session.social_graph.physics.tight')}</span>
                            <span>{t('modules:session.social_graph.physics.wide')}</span>
                        </div>
                    </div>


                    {/* Collision Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                            <span className="text-slate-400">{t('modules:session.social_graph.physics.collision_label')}</span>
                            <span className="text-neonCyan">{physicsSettings.collision}px</span>
                        </div>

                        <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            step="5"
                            value={physicsSettings.collision}
                            onChange={(e) => setPhysicsSettings.setCollision(Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-neonCyan"
                            title="Ajuster l'espace de collision autour de chaque personnage"
                        />
                         <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase">
                            <span>{t('modules:session.social_graph.physics.small')}</span>
                            <span>{t('modules:session.social_graph.physics.imposing')}</span>
                        </div>
                    </div>

                    
                    <button 
                        onClick={() => {
                            setPhysicsSettings.setCharge(-100);
                            setPhysicsSettings.setDistance(150);
                            setPhysicsSettings.setCollision(40);
                        }}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-all"
                    >
                        {t('modules:session.social_graph.physics.default_btn')}
                    </button>

                </div>
            )}

            {/* Filters Row */}
            <div className="flex items-center gap-4">
                <div className="w-[140px]">
                    <CustomSelect 
                        label={t('modules:session.social_graph.filters.type_label')}
                        value={typeFilter}
                        options={[
                            { value: 'all', label: t('modules:session.social_graph.filters.all_types') },
                            { value: 'pc', label: t('modules:session.social_graph.node_detail.type_pj') },
                            { value: 'npc', label: t('modules:session.social_graph.node_detail.type_npc') },
                            { value: 'monster', label: t('modules:session.social_graph.node_detail.type_monster') }
                        ]}
                        onChange={setTypeFilter}
                    />
                </div>
                <div className="flex-1">
                    <CustomSelect 
                        label={t('modules:session.social_graph.filters.faction_label')}
                        value={factionFilter}
                        options={[
                            { value: 'all', label: t('modules:session.social_graph.filters.all_factions') },
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
