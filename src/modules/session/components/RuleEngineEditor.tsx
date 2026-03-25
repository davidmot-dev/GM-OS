import React, { useEffect } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Sparkles, Brain, Save, ArrowLeft, PenTool, Music, Beaker, User, Search,
    BookOpen, Dice5, Zap, Map, Gift, Swords, Plus, Trash2, ChevronRight, type LucideIcon 
} from 'lucide-react';
import { useGemStore } from '../../../stores/useGemStore';
import type { GameDriver, TacticalConfig, LootEntryType } from '../../../types/drivers';
import { LootGenerator } from '../logic/LootGenerator';
import { EncounterGenerator } from '../logic/EncounterGenerator';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { gmToast } from '../../../stores/useToastStore';
import { personaGeneratorService } from '../../ai/PersonaGeneratorService';
import { Loader2 } from 'lucide-react';

const DEFAULT_RANGES: TacticalConfig['ranges'] = {
    contact: { label: 'Corps à corps', maxUnits: 1, modifier: 0 },
    courte: { label: 'Portée courte', maxUnits: 3, modifier: 0 },
    moyenne: { label: 'Portée moyenne', maxUnits: 6, modifier: -2 },
    longue: { label: 'Portée longue', maxUnits: 12, modifier: -5 },
    extreme: { label: 'Portée extrême', maxUnits: 24, modifier: -10 }
};

const SearchableNPCSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    entities: Array<{ id: string, name: string, campaignId: string, templateId?: string, type?: string }>;
    activeCampaignId: string | null;
    targetTemplateId: string;
}> = ({ value, onChange, entities, activeCampaignId, targetTemplateId }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selectedEntity = entities.find(e => e.id === value);

    const filteredEntities = React.useMemo(() => {
        const systemEntities = entities.filter(e => e.templateId === targetTemplateId);
        const campaignEntities = systemEntities.filter(e => 
            (e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase())) &&
            e.campaignId === activeCampaignId
        );
        const otherEntities = systemEntities.filter(e => 
            (e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase())) &&
            e.campaignId !== activeCampaignId
        );
        return [...campaignEntities, ...otherEntities];
    }, [entities, search, activeCampaignId, targetTemplateId]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-10 px-4 bg-black/40 rounded-xl border border-white/10 text-left flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-lg backdrop-blur-sm"
                title="Sélectionner un NPC"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <User size={14} className={selectedEntity ? "text-emerald-400" : "text-slate-500"} />
                    <span className={`text-xs truncate font-bold ${selectedEntity ? "text-emerald-400" : "text-slate-500 uppercase tracking-widest"}`}>
                        {selectedEntity ? selectedEntity.name : "Sélectionner NPC"}
                    </span>
                </div>
                <ChevronRight size={14} className={`text-slate-600 group-hover:text-emerald-500/50 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] top-full left-0 right-0 mt-2 p-2 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-200 origin-top min-w-[240px]">
                    <div className="relative mb-2">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setIsOpen(false);
                            }}
                            className="w-full bg-black/40 border border-white/5 rounded-xl pl-8 pr-3 py-2 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/30"
                            title="Rechercher un PNJ"
                        />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1 divide-y divide-white/5">
                        {filteredEntities.length === 0 ? (
                            <div className="p-4 text-center text-[10px] text-slate-600 uppercase tracking-widest italic">Aucun PNJ trouvé</div>
                        ) : (
                            filteredEntities.map(en => (
                                <button
                                    key={en.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(en.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full p-3 text-left hover:bg-white/5 rounded-xl transition-all group flex flex-col gap-1 ${en.id === value ? "bg-emerald-500/10 border border-emerald-500/20" : "border border-transparent"}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-[11px] font-black uppercase tracking-wider ${en.id === value ? "text-emerald-400" : "text-slate-300 group-hover:text-white"}`}>
                                            {en.name}
                                        </span>
                                        {en.campaignId === activeCampaignId && (
                                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase">Campagne</span>
                                        )}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between">
                                        <span>ID: {en.id.slice(0, 8)}...</span>
                                        {en.campaignId !== activeCampaignId && (
                                            <span className="opacity-40 italic">Hors campagne</span>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const GlassSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: { value: string, label: string }[];
    title: string;
    className?: string;
}> = ({ value, onChange, options, title, className = "" }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.value === value);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border border-white/5 bg-black/20 hover:bg-black/40 hover:border-white/10 transition-all group ${className}`}
                title={title}
            >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-200 truncate">
                    {selectedOption?.label || value}
                </span>
                <ChevronRight size={10} className={`text-slate-600 group-hover:text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-90" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[110] top-full left-0 right-0 mt-1 p-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in duration-150 origin-top min-w-max">
                    <div className="space-y-0.5">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left rounded-lg transition-all flex items-center justify-between gap-4 group ${opt.value === value ? "bg-white/10" : "hover:bg-white/5"}`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${opt.value === value ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"}`}>
                                    {opt.label}
                                </span>
                                {opt.value === value && <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const RuleEngineEditor: React.FC = () => {
    const { 
        editingDriverId, 
        setEditingDriverId, 
        updateGameDriver, 
        getGameDriver,
        setCurrentView,
        customSheetTemplates,
        customGameDrivers,
        saveGameDriver,
        entities,
        activeCampaignId
    } = useSessionOSStore();

    // Group entities for encounter selection: current campaign first, then others
    const sessionEntities = React.useMemo(() => {
        const campaignEntities = entities.filter(e => e.campaignId === activeCampaignId && e.type === 'npc');
        const otherEntities = entities.filter(e => e.campaignId !== activeCampaignId && e.type === 'npc');
        return [...campaignEntities, ...otherEntities];
    }, [entities, activeCampaignId]);

    const driver = React.useMemo(() => 
        editingDriverId ? getGameDriver(editingDriverId) : null
        // eslint-disable-next-line react-hooks/exhaustive-deps
    , [editingDriverId, getGameDriver, customGameDrivers]);

    const { gems, syncGemsWithDefaults } = useGemStore();
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState<'core' | 'combat' | 'tactical' | 'ai' | 'notebook' | 'loot' | 'encounters'>('core');
    const [selectedLootTableId, setSelectedLootTableId] = React.useState<string | null>(null);
    const [selectedEncounterTemplateId, setSelectedEncounterTemplateId] = React.useState<string | null>(null);

    useEffect(() => {
        syncGemsWithDefaults();
    }, [syncGemsWithDefaults]);

    if (!driver) return (
        <div className="flex-1 flex items-center justify-center bg-[#0a0a0c] text-white/40">
            Chargement du moteur de règles...
        </div>
    );

    const handleUpdate = (updates: Partial<GameDriver>) => {
        if (!driver) return;
        
        // If editing a built-in driver, we need to fork it into a custom one
        if (DEFAULT_GAME_DRIVERS.some(d => d.id === driver.id)) {
            const newId = `custom-${driver.id}-${Date.now()}`;
            const newDriver: GameDriver = { 
                ...driver, 
                ...updates, 
                id: newId
            };
            saveGameDriver(newDriver);
            setEditingDriverId(newId);
            gmToast(`Nouveau système personnalisé créé à partir de "${driver.name}"`, "success");
        } else {
            updateGameDriver(driver.id, updates);
        }
    };

    const handleBack = () => {
        setEditingDriverId(null);
        setCurrentView('templates');
    };

    const handleAutoGenerate = async () => {
        setIsGenerating(true);
        try {
            const context = {
                name: driver.name,
                universe: driver.description || driver.name,
                style: 'Technique et immersif'
            };
            const personas = await personaGeneratorService.generateAllPersonas(context);
            handleUpdate({ aiPersonas: personas });
            gmToast("Résonances aethériques synchronisées", "success");
        } catch (error) {
            console.error("Génération error:", error);
            gmToast("Échec de la résonance", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const navItems = [
        { id: 'core', label: 'Système', icon: Dice5, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { id: 'combat', label: 'Combat', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { id: 'tactical', label: 'Tactique', icon: Map, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'loot', label: 'Butin', icon: Gift, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'encounters', label: 'Rencontres', icon: Swords, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        { id: 'ai', label: 'Intelligence', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { id: 'notebook', label: 'Knowledge', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    ];

    // Ensure nested objects exist to avoid crashes
    const dice = driver.dice || { engine: 'standard', defaultDice: '1d20' };
    const combat = driver.combat || { initiativeFormula: 'dex', initiativeSort: 'desc', defaultHealthType: 'hp' };
    const tactical = driver.tactical || { useTacticalAI: true, ranges: DEFAULT_RANGES };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0c] select-none font-inter text-app-text/90">
            {/* Top Premium Bar */}
            <div className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl px-8 flex items-center justify-between z-50">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-cyan-500/40 transition-all shadow-lg hover:scale-105 active:scale-95 group"
                        title="Retour aux templates"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="h-10 w-[1px] bg-white/10 mx-2" />
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={driver.emoji || ''}
                            onChange={e => handleUpdate({ emoji: e.target.value })}
                            className="w-12 h-12 bg-black/40 text-center text-2xl rounded-2xl p-1 border border-white/10 focus:outline-none focus:border-cyan-500/50 shadow-inner"
                            maxLength={2}
                            title="Emoji du système"
                        />
                        <div>
                            <input
                                type="text"
                                value={driver.name || ''}
                                onChange={e => handleUpdate({ name: e.target.value })}
                                className="bg-transparent text-xl font-black text-white focus:outline-none border-b border-transparent focus:border-cyan-500/40 transition-all min-w-[200px]"
                                placeholder="Nom du moteur de règles"
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    Rule Engine Core
                                </span>
                                <span className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">ID: {driver.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => gmToast("Configuration du moteur synchronisée", "success")}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:opacity-90 transition-all"
                    title="Synchroniser la configuration"
                >
                    <Save size={16} /> Synchroniser
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-24 border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col items-center py-8 gap-4">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as 'core' | 'combat' | 'tactical' | 'ai' | 'notebook')}
                            className={`group relative w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                                activeSection === item.id 
                                ? `${item.bg} ${item.color} shadow-lg ring-1 ring-white/10` 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                            title={item.label}
                        >
                            <item.icon size={22} className={`transition-transform duration-300 ${activeSection === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            {activeSection === item.id && (
                                <div className={`absolute -right-1 w-1 h-6 rounded-full ${item.color.replace('text', 'bg')} shadow-[0_0_10px_currentColor]`} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Workspace */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.05),transparent_40%)]">
                    <div className="max-w-5xl mx-auto p-12 animate-fade-in">
                        
                        {activeSection === 'loot' && (
                            <div className="space-y-8">
                                <header className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-4">
                                        <Gift className="text-amber-400" size={32} />
                                        Tables de <span className="text-amber-500/20 underline decoration-amber-500/40">Butin</span>
                                    </h2>
                                    <p className="text-slate-500 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                        Créez des tables de butin aléatoires. Définissez des objets, des quantités et des probabilités (poids).
                                    </p>
                                </header>

                                <div className="grid grid-cols-12 gap-8">
                                    {/* Tables List */}
                                    <div className="col-span-4 space-y-4">
                                        <button 
                                            onClick={() => {
                                                const newTable = { id: `lt-${Date.now()}`, name: 'Nouvelle Table', entries: [] };
                                                handleUpdate({ lootTables: [...(driver.lootTables || []), newTable] });
                                                setSelectedLootTableId(newTable.id);
                                            }}
                                            className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-all"
                                        >
                                            <Plus size={16} /> Ajouter une Table
                                        </button>
                                        <div className="space-y-2">
                                            {(driver.lootTables || []).map(table => (
                                                <button
                                                    key={table.id}
                                                    onClick={() => setSelectedLootTableId(table.id)}
                                                    className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all ${selectedLootTableId === table.id ? 'bg-amber-500 text-black shadow-glow-amber' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                                >
                                                    <span className="text-xs font-bold truncate">{table.name}</span>
                                                    <ChevronRight size={14} className={selectedLootTableId === table.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Table Editor */}
                                    <div className="col-span-8">
                                        {selectedLootTableId ? (
                                            (() => {
                                                const table = driver.lootTables?.find(t => t.id === selectedLootTableId);
                                                if (!table) return null;
                                                return (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        {/* First Row: Name and Action Buttons */}
                                                        <div className="flex items-center justify-between gap-6">
                                                            <input 
                                                                type="text"
                                                                value={table.name}
                                                                title="Nom de la table de butin"
                                                                placeholder="Nom de la table (ex: Trésor de Boss)"
                                                                onChange={e => {
                                                                    const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, name: e.target.value } : t);
                                                                    handleUpdate({ lootTables: newTables });
                                                                }}
                                                                className="bg-transparent text-2xl font-black text-white focus:outline-none border-b border-white/10 focus:border-amber-500/40 pb-2 flex-1"
                                                            />
                                                            <div className="flex items-center gap-3">
                                                                <button 
                                                                    onClick={() => {
                                                                        try {
                                                                            const items = LootGenerator.generateFromTable(table, driver.lootTables || []);
                                                                            console.log('Test Loot Result:', items);
                                                                            alert(`Test réussi ! ${items.length} objets générés. Voir console pour détails.`);
                                                                        } catch (e) {
                                                                            alert('Erreur lors du test : ' + (e as Error).message);
                                                                        }
                                                                    }}
                                                                    className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all border border-amber-500/20 shadow-lg shadow-amber-500/10 h-10"
                                                                >
                                                                    Tester
                                                                </button>

                                                                <button 
                                                                    onClick={() => {
                                                                        if (window.confirm('Supprimer cette table ?')) {
                                                                            const newTables = driver.lootTables?.filter(t => t.id !== table.id);
                                                                            handleUpdate({ lootTables: newTables });
                                                                            setSelectedLootTableId(null);
                                                                        }
                                                                    }}
                                                                    className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20 h-10 w-10 flex items-center justify-center"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Second Row: Configuration Options */}
                                                        <div className="flex items-center gap-6 bg-white/[0.03] px-6 py-3 rounded-2xl border border-white/10 shadow-xl w-fit">
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest leading-none">Tirages (Dés)</span>
                                                                <input 
                                                                    type="text"
                                                                    value={String(table.rolls || '1')}
                                                                    title="Nombre de tirages automatique pour cette table (ex: 1, 2d4, 5)"
                                                                    onChange={e => {
                                                                        const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, rolls: e.target.value } : t);
                                                                        handleUpdate({ lootTables: newTables });
                                                                    }}
                                                                    className="w-16 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-center text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500/50 transition-all focus:bg-amber-500/10"
                                                                    placeholder="1"
                                                                />
                                                            </div>

                                                            <div className="w-px h-8 bg-white/10" />

                                                            <div className="flex flex-col gap-1.5">
                                                                <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest leading-none">Mode Tirage</span>
                                                                <div className="flex p-0.5 bg-black/20 rounded-lg border border-white/5">
                                                                    <button
                                                                        onClick={() => {
                                                                            const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, rollMode: 'weighted' as const } : t);
                                                                            handleUpdate({ lootTables: newTables });
                                                                        }}
                                                                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${table.rollMode === 'weighted' || !table.rollMode ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40' : 'text-slate-500 hover:text-slate-300'}`}
                                                                    >
                                                                        Pondéré
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, rollMode: 'independent' as const } : t);
                                                                            handleUpdate({ lootTables: newTables });
                                                                        }}
                                                                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${table.rollMode === 'independent' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40' : 'text-slate-500 hover:text-slate-300'}`}
                                                                    >
                                                                        Indépendant
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between px-2">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60">Entrées de butin ({table.entries.length})</h4>
                                                                <button 
                                                                    onClick={() => {
                                                                        const newEntry = { id: `entry-${Date.now()}`, type: 'item' as const, name: 'Nouvel Objet', weight: 1, minAmount: '1' };
                                                                        const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, entries: [...t.entries, newEntry] } : t);
                                                                        handleUpdate({ lootTables: newTables });
                                                                    }}
                                                                    className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:underline"
                                                                >
                                                                    + Ajouter une entrée
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-12 gap-3 mb-2 px-4 opacity-40">
                                                                <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Nom de l'objet / Table</div>
                                                                <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Poids</div>
                                                                <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Quantité / Dés</div>
                                                                <div className="col-span-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Type</div>
                                                                <div className="col-span-1"></div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {table.entries.map(entry => (
                                                                    <div key={entry.id} className="grid grid-cols-12 gap-3 p-3 bg-black/40 rounded-2xl border border-white/5 items-center group/entry hover:border-amber-500/20 transition-all">
                                                                        <div className="col-span-4">
                                                                            <input 
                                                                                type="text"
                                                                                value={entry.name}
                                                                                title="Nom de l'objet"
                                                                                onChange={e => {
                                                                                    const newEntries = table.entries.map(en => en.id === entry.id ? { ...en, name: e.target.value } : en);
                                                                                    const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, entries: newEntries } : t);
                                                                                    handleUpdate({ lootTables: newTables });
                                                                                }}
                                                                                className="w-full bg-transparent text-xs font-bold text-white focus:outline-none placeholder:text-slate-700"
                                                                                placeholder="Nom ou ID..."
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <input 
                                                                                type="number"
                                                                                value={entry.weight}
                                                                                title="Poids du tirage (Probabilité relative)"
                                                                                onChange={e => {
                                                                                    const newEntries = table.entries.map(en => en.id === entry.id ? { ...en, weight: parseInt(e.target.value) || 0 } : en);
                                                                                    const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, entries: newEntries } : t);
                                                                                    handleUpdate({ lootTables: newTables });
                                                                                }}
                                                                                className="w-full bg-black/20 text-center py-2 rounded-xl text-[10px] font-mono text-amber-400 border border-white/5 focus:border-amber-500/40 outline-none"
                                                                                placeholder="W"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-2">
                                                                            <input 
                                                                                type="text"
                                                                                value={String(entry.minAmount || '1')}
                                                                                title="Quantité ou Formule (ex: 1, 2d6, 100)"
                                                                                onChange={e => {
                                                                                    const newEntries = table.entries.map(en => en.id === entry.id ? { ...en, minAmount: e.target.value } : en);
                                                                                    const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, entries: newEntries } : t);
                                                                                    handleUpdate({ lootTables: newTables });
                                                                                }}
                                                                                className="w-full bg-black/20 text-center py-2 rounded-xl text-[10px] font-mono text-cyan-400 border border-white/5 focus:border-cyan-500/40 outline-none"
                                                                                placeholder="Qty/Rolls"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-3">
                                                                            <GlassSelect 
                                                                                value={entry.type}
                                                                                title="Type de butin"
                                                                                options={[
                                                                                    { value: 'item', label: '🗃️ Objet' },
                                                                                    { value: 'currency', label: '💰 Devise' },
                                                                                    { value: 'table', label: '📋 Sous-Table' }
                                                                                ]}
                                                                                onChange={val => {
                                                                                    const newEntries = table.entries.map(en => en.id === entry.id ? { ...en, type: val as LootEntryType } : en);
                                                                                    const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, entries: newEntries } : t);
                                                                                    handleUpdate({ lootTables: newTables });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-1 flex justify-end">
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const newEntries = table.entries.filter(en => en.id !== entry.id);
                                                                                    const newTables = driver.lootTables?.map(t => t.id === table.id ? { ...t, entries: newEntries } : t);
                                                                                    handleUpdate({ lootTables: newTables });
                                                                                }}
                                                                                className="opacity-0 group-hover/entry:opacity-100 p-2 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                                                title="Supprimer l'entrée"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem] text-slate-500 italic text-sm">
                                                Sélectionnez une table pour modifier ses entrées.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'encounters' && (
                            <div className="space-y-8">
                                <header className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-4">
                                        <Swords className="text-rose-400" size={32} />
                                        Templates de <span className="text-rose-500/20 underline decoration-rose-500/40">Rencontre</span>
                                    </h2>
                                    <p className="text-slate-500 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                        Automatisez la génération de groupes d'ennemis. Liez des entités prototypes et gérez leur nombre aléatoire.
                                    </p>
                                </header>

                                <div className="grid grid-cols-12 gap-8">
                                    {/* Templates List */}
                                    <div className="col-span-4 space-y-4">
                                        <button 
                                            onClick={() => {
                                                const newTemplate = { id: `et-${Date.now()}`, name: 'Nouvelle Rencontre', entities: [] };
                                                handleUpdate({ encounterTemplates: [...(driver.encounterTemplates || []), newTemplate] });
                                                setSelectedEncounterTemplateId(newTemplate.id);
                                            }}
                                            className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all"
                                        >
                                            <Plus size={16} /> Ajouter un Template
                                        </button>
                                        <div className="space-y-2">
                                            {(driver.encounterTemplates || []).map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => setSelectedEncounterTemplateId(template.id)}
                                                    className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all ${selectedEncounterTemplateId === template.id ? 'bg-rose-500 text-black shadow-glow-rose' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                                >
                                                    <span className="text-xs font-bold truncate">{template.name}</span>
                                                    <ChevronRight size={14} className={selectedEncounterTemplateId === template.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Template Editor */}
                                    <div className="col-span-8">
                                        {selectedEncounterTemplateId ? (
                                            (() => {
                                                const template = driver.encounterTemplates?.find(t => t.id === selectedEncounterTemplateId);
                                                if (!template) return null;
                                                return (
                                                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        <div className="flex items-center justify-between">
                                                            <input 
                                                                type="text"
                                                                value={template.name}
                                                                onChange={e => {
                                                                    const newTemplates = driver.encounterTemplates?.map(t => t.id === template.id ? { ...t, name: e.target.value } : t);
                                                                    handleUpdate({ encounterTemplates: newTemplates });
                                                                }}
                                                                className="bg-transparent text-2xl font-black text-white focus:outline-none border-b border-white/10 focus:border-rose-500/40 pb-2 flex-1 mr-4"
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        try {
                                                                            const prototypes = useSessionOSStore.getState().entities;
                                                                            const newEntities = EncounterGenerator.generateFromTemplate(template, prototypes);
                                                                            console.log('Test Encounter Result:', newEntities);
                                                                            alert(`Test réussi ! ${newEntities.length} entités générées. Voir console pour détails.`);
                                                                        } catch (e) {
                                                                            alert('Erreur lors du test : ' + (e as Error).message);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/30 transition-all border border-rose-500/20"
                                                                >
                                                                    Tester
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const newTemplates = driver.encounterTemplates?.filter(t => t.id !== template.id);
                                                                        handleUpdate({ encounterTemplates: newTemplates });
                                                                        setSelectedEncounterTemplateId(null);
                                                                    }}
                                                                    className="p-2 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                                    title="Supprimer le template"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between px-2">
                                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400/60">Unités prototypes ({template.entities.length})</h4>
                                                                <button 
                                                                    onClick={() => {
                                                                        const newEntity = { templateId: '', count: '1', role: 'mook' as const };
                                                                        const newTemplates = driver.encounterTemplates?.map(t => t.id === template.id ? { ...t, entities: [...t.entities, newEntity] } : t);
                                                                        handleUpdate({ encounterTemplates: newTemplates });
                                                                    }}
                                                                    className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:underline"
                                                                >
                                                                    + Ajouter une unité
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {template.entities.map((en, idx) => (
                                                                    <div key={idx} className="grid grid-cols-12 gap-3 p-3 bg-black/40 rounded-2xl border border-white/5 items-center group/entity">
                                                                        <div className="col-span-5 relative">
                                                                            <SearchableNPCSelect 
                                                                                value={en.templateId}
                                                                                entities={sessionEntities}
                                                                                activeCampaignId={activeCampaignId}
                                                                                targetTemplateId={driver.templateId}
                                                                                onChange={val => {
                                                                                    const newEntities = [...template.entities];
                                                                                    newEntities[idx] = { ...en, templateId: val };
                                                                                    const newTemplates = driver.encounterTemplates?.map(t => t.id === template.id ? { ...t, entities: newEntities } : t);
                                                                                    handleUpdate({ encounterTemplates: newTemplates });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[9px] font-black text-slate-600 uppercase">Nombre</span>
                                                                                <input 
                                                                                    type="text"
                                                                                    value={en.count}
                                                                                    title="Nombre d'unités"
                                                                                    onChange={e => {
                                                                                        const newEntities = [...template.entities];
                                                                                        newEntities[idx] = { ...en, count: e.target.value };
                                                                                        const newTemplates = driver.encounterTemplates?.map(t => t.id === template.id ? { ...t, entities: newEntities } : t);
                                                                                        handleUpdate({ encounterTemplates: newTemplates });
                                                                                    }}
                                                                                    placeholder="1, 1d4..."
                                                                                    className="w-full bg-black/20 text-center py-1 rounded text-[10px] font-mono text-rose-400 border border-white/5"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-span-3">
                                                                             <GlassSelect 
                                                                                 value={en.role || 'mook'}
                                                                                title="Rôle de l'entité"
                                                                                options={[
                                                                                    { value: 'mook', label: 'Mook (Sbire)' },
                                                                                    { value: 'elite', label: 'Élite' },
                                                                                    { value: 'boss', label: 'Boss' }
                                                                                ]}
                                                                                onChange={val => {
                                                                                    const newEntities = [...template.entities];
                                                                                    newEntities[idx] = { ...en, role: val as 'mook' | 'elite' | 'boss' };
                                                                                    const newTemplates = driver.encounterTemplates?.map(t => t.id === template.id ? { ...t, entities: newEntities } : t);
                                                                                    handleUpdate({ encounterTemplates: newTemplates });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-1 flex justify-end">
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const newEntities = template.entities.filter((_, i) => i !== idx);
                                                                                    const newTemplates = driver.encounterTemplates?.map(t => t.id === template.id ? { ...t, entities: newEntities } : t);
                                                                                    handleUpdate({ encounterTemplates: newTemplates });
                                                                                }}
                                                                                className="opacity-0 group-hover/entity:opacity-100 p-1 text-rose-500/40 hover:text-rose-500 transition-all"
                                                                                title="Supprimer l'unité"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem] text-slate-500 italic text-sm">
                                                Sélectionnez un template pour modifier ses unités.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'core' && (
                            <div className="space-y-8">
                                <header className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-4">
                                        <Dice5 className="text-cyan-400" size={32} />
                                        Système de Jeu <span className="text-cyan-500/20 underline decoration-cyan-500/40">Core</span>
                                    </h2>
                                    <p className="text-slate-500 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                        Configurez les fondations mécaniques de votre jeu. Ces paramètres définissent comment les dés sont interprétés par le système.
                                    </p>
                                </header>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-sm space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 mb-3 block px-1">Moteur de Résolution</label>
                                            <GlassSelect 
                                                value={dice.engine || 'standard'}
                                                title="Moteur de résolution"
                                                options={[
                                                    { value: 'standard', label: 'Standard (Somme)' },
                                                    { value: 'threshold', label: 'Seuil de Succès' },
                                                    { value: 'pool', label: 'Réserve de Dés' },
                                                    { value: 'formula', label: 'Formule Libre' },
                                                    { value: 'year-zero', label: 'Year Zero Engine' },
                                                    { value: 'yze', label: 'YZE (Succès sur 6)' },
                                                    { value: 'fate', label: 'FATE / Fudge' },
                                                    { value: 'rolemaster', label: 'Rolemaster / D100' },
                                                    { value: '2d20', label: '2d20' }
                                                ]}
                                                onChange={val => handleUpdate({ dice: { ...dice, engine: val as any } })}
                                                className="bg-black/20 px-4 py-3 rounded-xl border border-white/10 text-sm text-cyan-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 mb-3 block px-1">Formule de Dés par défaut</label>
                                            <input 
                                                type="text"
                                                value={dice.defaultDice || ''}
                                                onChange={e => handleUpdate({ dice: { ...dice, defaultDice: e.target.value } })}
                                                className="w-full bg-black/40 px-5 py-4 rounded-2xl border border-white/10 font-mono text-base text-cyan-400 focus:border-cyan-500/50 outline-none transition-all shadow-inner"
                                                placeholder="Ex: 1d20, 2d6+4..."
                                                title="Formule de dés par défaut"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-sm flex flex-col justify-center">
                                        <div className="mb-6">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 mb-3 block px-1">Liaison Fiche de Personnage</label>
                                            <GlassSelect 
                                                value={driver.templateId}
                                                title="Liaison Fiche de Personnage"
                                                options={[
                                                    { value: '', label: 'Aucune fiche liée' },
                                                    ...[...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates].map(t => ({
                                                        value: t.id,
                                                        label: `${t.emoji} ${t.name}`
                                                    }))
                                                ]}
                                                onChange={val => handleUpdate({ templateId: val })}
                                                className="bg-black/20 px-4 py-3 rounded-xl border border-white/10 text-sm text-white"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed italic px-2">
                                            La liaison permet à l'IA d'automatiser le remplissage des caractéristiques et d'utiliser les bons modificateurs lors des jets.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'combat' && (
                            <div className="space-y-8">
                                <header className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-4">
                                        <Zap className="text-indigo-400" size={32} />
                                        Combat & <span className="text-indigo-500/20 underline decoration-indigo-500/40">Initiative</span>
                                    </h2>
                                    <p className="text-slate-500 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                        Gérez la brutalité des rencontres. Définissez comment l'ordre de combat est établi et comment la santé des entités est traquée.
                                    </p>
                                </header>

                                <div className="grid grid-cols-12 gap-8">
                                    <div className="col-span-7 p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 block px-1">Formule Initiative</label>
                                                <input 
                                                    type="text"
                                                    value={combat.initiativeFormula || ''}
                                                    onChange={(e) => updateGameDriver(driver.id, { combat: { ...combat, initiativeFormula: e.target.value } })}
                                                    className="w-full bg-black/40 px-5 py-4 rounded-2xl border border-white/5 font-mono text-base text-indigo-400 focus:border-indigo-500/40 outline-none shadow-inner"
                                                    placeholder="Ex: dex, 1d6 + int..."
                                                    title="Formule d'initiative"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 block px-1">Gestion de la Santé</label>
                                                <GlassSelect 
                                                    value={combat.defaultHealthType || 'hp'}
                                                    title="Type de gestion de la santé"
                                                    className="bg-black/40 px-5 py-4 rounded-2xl border border-white/5 text-sm text-white"
                                                    options={[
                                                        { value: 'hp', label: 'Points de Vie (HP)' },
                                                        { value: 'wounds', label: 'Niveaux de Blessure' },
                                                        { value: 'boxes', label: 'Cases de Blessure' },
                                                        { value: 'clocks', label: 'Horloges (Type Blades)' },
                                                        { value: 'anatomy', label: 'Anatomie (Ciblée)' }
                                                    ]}
                                                    onChange={val => updateGameDriver(driver.id, { combat: { ...combat, defaultHealthType: val as GameDriver['combat']['defaultHealthType'] } })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-4 block px-1">Ordre de tri temporel</label>
                                            <div className="flex p-1 bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
                                                <button 
                                                    onClick={() => updateGameDriver(driver.id, { combat: { ...combat, initiativeSort: 'desc' } })}
                                                    className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${combat.initiativeSort !== 'asc' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                    title="Trier par ordre décroissant (High Start)"
                                                >
                                                    Décroissant (High Start)
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdate({ combat: { ...combat, initiativeSort: 'asc' } })}
                                                    className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${combat.initiativeSort === 'asc' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                    title="Trier par ordre croissant (Low Start)"
                                                >
                                                    Croissant (Low Start)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-5 p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] flex flex-col justify-between group">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                Tirage par Cartes
                                            </h4>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 block px-1">Taille du Deck (Initiative)</label>
                                            <input 
                                                type="number"
                                                value={combat.initiativeCards || ''}
                                                onChange={e => handleUpdate({ combat: { ...combat, initiativeCards: e.target.value ? parseInt(e.target.value) : undefined } })}
                                                className="w-full bg-black/40 px-5 py-4 rounded-2xl border border-white/10 font-mono text-base text-white focus:border-indigo-500/40 outline-none"
                                                placeholder="Ex: 10, 52..."
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-600 leading-relaxed uppercase font-bold tracking-tight border-t border-white/5 pt-4 mt-6">
                                            Si activé, chaque entité pioche une valeur unique entre 1 et N par round. Parfait pour Savage Worlds ou Year Zero.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'tactical' && (
                            <div className="space-y-8">
                                <header className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-4">
                                        <Map className="text-emerald-400" size={32} />
                                        Cortex <span className="text-emerald-500/20 underline decoration-emerald-500/40">Tactique</span>
                                    </h2>
                                    <p className="text-slate-500 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                        Le cortex analyse les distances sur la carte pour suggérer des bonus ou malus aux jets de combat basés sur les zones définies.
                                    </p>
                                </header>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/20 shadow-xl">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] font-black uppercase text-white tracking-[0.2em]">Activer l'Optimisation Tactique</label>
                                            <span className="text-[10px] text-emerald-500/60 font-medium italic">Calcul automatique des modificateurs de portée</span>
                                        </div>
                                        <button 
                                            onClick={() => handleUpdate({ tactical: { ...tactical, useTacticalAI: !tactical.useTacticalAI } })}
                                            className={`w-14 h-7 rounded-full transition-all relative p-1 ${tactical.useTacticalAI ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 border border-white/10'}`}
                                            title={tactical.useTacticalAI ? 'Désactiver l\'IA' : 'Activer l\'IA'}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-all transform ${tactical.useTacticalAI ? 'translate-x-7' : 'translate-x-0 opacity-40'}`} />
                                        </button>
                                    </div>

                                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-sm overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-12 text-emerald-500/5 -rotate-12 select-none group-hover:scale-110 transition-transform">
                                            <Map size={240} />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="grid grid-cols-12 gap-4 mb-6 px-4">
                                                <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Zone d'influence</div>
                                                <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Seuil Max (Grid Units)</div>
                                                <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Modificateur</div>
                                            </div>

                                            <div className="space-y-3">
                                                {(['contact', 'courte', 'moyenne', 'longue', 'extreme'] as const).map(rangeKey => {
                                                    const range = tactical.ranges?.[rangeKey] || { label: rangeKey.toUpperCase(), maxUnits: 0, modifier: 0 };
                                                    return (
                                                        <div key={rangeKey} className="grid grid-cols-12 gap-4 items-center p-2 hover:bg-white/5 rounded-2xl transition-all">
                                                            <div className="col-span-4 text-xs font-black uppercase tracking-widest text-white/80 pl-2 border-l-2 border-emerald-500/40">{range.label}</div>
                                                            <div className="col-span-4 flex justify-center">
                                                                <input 
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={range.maxUnits}
                                                                    onChange={e => {
                                                                        const val = parseFloat(e.target.value);
                                                                        const newRanges = { ...(tactical.ranges || {}) } as TacticalConfig['ranges'];
                                                                        (newRanges as Record<string, any>)[rangeKey] = { ...range, maxUnits: isNaN(val) ? 0 : val };
                                                                        handleUpdate({ tactical: { ...tactical, ranges: newRanges } });
                                                                    }}
                                                                    className="w-24 bg-black/40 text-center py-2.5 rounded-xl border border-white/10 text-xs font-mono text-emerald-400 focus:border-emerald-500/50 outline-none"
                                                                    placeholder="Cases"
                                                                    title={`Distance maximale pour ${range.label}`}
                                                                />
                                                            </div>
                                                            <div className="col-span-4 flex justify-center">
                                                                <input 
                                                                    type="number"
                                                                    value={range.modifier}
                                                                    onChange={e => {
                                                                        const val = parseInt(e.target.value);
                                                                        const newRanges = { ...(tactical.ranges || {}) } as TacticalConfig['ranges'];
                                                                        (newRanges as Record<string, any>)[rangeKey] = { ...range, modifier: val };
                                                                        handleUpdate({ tactical: { ...tactical, ranges: newRanges } });
                                                                    }}
                                                                    className={`w-24 bg-black/40 text-center py-2.5 rounded-xl border border-white/10 text-xs font-mono focus:border-emerald-500/50 outline-none ${range.modifier > 0 ? 'text-emerald-400' : range.modifier < 0 ? 'text-rose-400' : 'text-slate-500'}`}
                                                                    placeholder="Mod."
                                                                    title={`Modificateur pour ${range.label}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'ai' && (
                            <div className="space-y-12 pb-20">
                                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-4">
                                            <Sparkles className="text-violet-400" size={32} />
                                            Intelligence <span className="text-violet-500/20 underline decoration-violet-500/40">Artificielle</span>
                                        </h2>
                                        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                            Définissez la conscience de l'IA pour ce système. Le prompt global définit les règles, tandis que les résonances gèrent les rôles.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleAutoGenerate}
                                        disabled={isGenerating}
                                        className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-violet-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
                                        title="Générer les Personas via IA"
                                    >
                                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        {isGenerating ? 'En cours...' : 'Générer les Personas'}
                                    </button>
                                </header>

                                <div className="space-y-8">
                                    <div className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Brain size={120} />
                                        </div>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-400 mb-6 flex items-center gap-3 font-mono">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                            Protocoles Système (Prompt Global)
                                        </h4>
                                        <textarea 
                                            value={driver.aiInstructions || ''}
                                            onChange={e => handleUpdate({ aiInstructions: e.target.value })}
                                            placeholder="Ex: Système D&D 5e..."
                                            title="Protocoles Système IA"
                                            className="w-full h-64 bg-black/40 text-sm text-slate-300 p-6 rounded-3xl border border-white/5 focus:border-violet-500/40 outline-none transition-all font-mono leading-relaxed custom-scrollbar shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-4 px-2">
                                            Aetheric Resonance / Gèmes de Rôles
                                            <div className="h-px bg-white/5 flex-1" />
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {gems.map(gem => {
                                                const iconMap: Record<string, LucideIcon> = { BookOpen, PenTool, Music, Beaker, Map, User, Sparkles, Brain };
                                                const Icon = iconMap[gem.icon] || Brain;
                                                const currValue = driver.aiPersonas?.[gem.id] || '';
                                                return (
                                                    <div key={gem.id} className={`p-6 rounded-[2rem] border transition-all duration-500 ${currValue ? 'bg-violet-500/5 border-violet-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/20'} group`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-3 rounded-2xl transition-all ${currValue ? 'bg-violet-500 text-white shadow-glow-violet' : 'bg-black/60 text-slate-600'}`}>
                                                                    <Icon size={18} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-xs font-black uppercase tracking-[0.2em] ${currValue ? 'text-violet-400' : 'text-slate-500'}`}>{gem.name}</span>
                                                                    <span className="text-[10px] text-slate-600 font-medium">Assistant de type {gem.id}</span>
                                                                </div>
                                                            </div>
                                                            {currValue && <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_10px_rgba(139,92,246,1)]" />}
                                                        </div>
                                                        <textarea
                                                            value={currValue}
                                                            onChange={e => {
                                                                const newVal = e.target.value;
                                                                const newPersonas = { ...(driver.aiPersonas || {}) };
                                                                if (newVal.trim() === '') {
                                                                    delete newPersonas[gem.id];
                                                                } else {
                                                                    newPersonas[gem.id] = newVal;
                                                                }
                                                                handleUpdate({ aiPersonas: newPersonas });
                                                            }}
                                                            placeholder={`Directives spécifiques pour ${gem.name}...`}
                                                            className="w-full h-36 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-slate-400 focus:border-violet-500/40 outline-none transition-all font-mono resize-none leading-relaxed custom-scrollbar"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notebook' && (
                            <div className="space-y-8 h-full flex flex-col items-center justify-center py-20">
                                <header className="text-center space-y-4 mb-12">
                                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-glow-blue/5">
                                        <BookOpen className="text-blue-400" size={48} />
                                    </div>
                                    <h2 className="text-4xl font-black text-white tracking-tight uppercase italic underline decoration-blue-500/40">
                                        NotebookLM <span className="text-blue-500/20">Sync</span>
                                    </h2>
                                    <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed uppercase tracking-widest font-bold">
                                        Connectez votre base de connaissance externe pour une érudition infinie de l'IA.
                                    </p>
                                </header>

                                <div className="w-full max-w-2xl p-10 bg-black/40 border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 text-blue-500/5 -rotate-12 translate-x-4 -translate-y-4 pointer-events-none">
                                        <BookOpen size={180} />
                                    </div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2 block px-2 italic">Neural Link Entry Point</label>
                                        <div className="relative">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500/40">
                                                <BookOpen size={20} />
                                            </div>
                                            <input 
                                                type="text"
                                                value={driver.defaultNotebookUrl || ''}
                                                onChange={e => handleUpdate({ defaultNotebookUrl: e.target.value })}
                                                placeholder="https://notebooklm.google.com/notebook/..."
                                                className="w-full bg-black/60 text-sm text-white pl-16 pr-8 py-6 rounded-[2rem] border border-white/10 focus:outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner"
                                                title="Lien vers NotebookLM"
                                            />
                                        </div>
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                                <strong className="text-blue-400/80 uppercase">Note :</strong> En liant un Notebook, l'Oracle pourra citer des passages précis des règles ou du lore lors de vos sessions.
                                            </p>
                                            <div className="flex gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default RuleEngineEditor;
