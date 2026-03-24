import React, { useEffect } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Sparkles, Brain, Save, ArrowLeft, PenTool, Music, Beaker, User,
    BookOpen, Dice5, Zap, Map, type LucideIcon 
} from 'lucide-react';
import { useGemStore } from '../../../stores/useGemStore';
import type { GameDriver, TacticalConfig } from '../../../types/drivers';
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

export const RuleEngineEditor: React.FC = () => {
    const { 
        editingDriverId, 
        setEditingDriverId, 
        updateGameDriver, 
        getGameDriver,
        setCurrentView,
        customSheetTemplates 
    } = useSessionOSStore();

    const driver = React.useMemo(() => 
        editingDriverId ? getGameDriver(editingDriverId) : null
    , [editingDriverId, getGameDriver]);

    const { gems, syncGemsWithDefaults } = useGemStore();
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState<'core' | 'combat' | 'tactical' | 'ai' | 'notebook'>('core');

    useEffect(() => {
        syncGemsWithDefaults();
    }, [syncGemsWithDefaults]);

    if (!driver) return (
        <div className="flex-1 flex items-center justify-center bg-[#0a0a0c] text-white/40">
            Chargement du moteur de règles...
        </div>
    );

    const handleUpdate = (updates: Partial<GameDriver>) => {
        updateGameDriver(driver.id, updates);
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
                                            <select 
                                                value={dice.engine || 'standard'}
                                                onChange={e => handleUpdate({ dice: { ...dice, engine: e.target.value as GameDriver['dice']['engine'] } })}
                                                className="w-full bg-black/40 px-5 py-4 rounded-2xl border border-white/10 text-sm text-white focus:border-cyan-500/50 outline-none transition-all appearance-none cursor-pointer"
                                                title="Moteur de résolution"
                                            >
                                                <option value="standard">Standard (Somme de dés)</option>
                                                <option value="exploding">Somme Explosive</option>
                                                <option value="formula">Formule Libre</option>
                                                <option value="threshold">Jet de Seuil (Target)</option>
                                                <option value="pool">Pool de Dés (Succès)</option>
                                                <option value="pool_explode">Pool Explosif</option>
                                                <option value="advantage">Avantage (Garde Meilleur)</option>
                                                <option value="disadvantage">Désavantage (Garde Pire)</option>
                                                <option value="year-zero">Year Zero Engine (Alien/Blade Runner)</option>
                                                <option value="yze">YZE (Succès sur 6)</option>
                                                <option value="fate">FATE / Fudge</option>
                                                <option value="rolemaster">Rolemaster / D100</option>
                                                <option value="2d20">2d20 (Star Trek/Dune)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 mb-3 block px-1">Formule de Dés par défaut</label>
                                            <input 
                                                type="text"
                                                value={dice.defaultDice || ''}
                                                onChange={e => handleUpdate({ dice: { ...dice, defaultDice: e.target.value } })}
                                                className="w-full bg-black/40 px-5 py-4 rounded-2xl border border-white/10 font-mono text-base text-cyan-400 focus:border-cyan-500/50 outline-none transition-all shadow-inner"
                                                placeholder="Ex: 1d20, 2d6+4..."
                                            />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-sm flex flex-col justify-center">
                                        <div className="mb-6">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60 mb-3 block px-1">Liaison Fiche de Personnage</label>
                                            <select 
                                                value={driver.templateId}
                                                onChange={e => handleUpdate({ templateId: e.target.value })}
                                                className="w-full bg-black/40 px-5 py-4 rounded-2xl border border-white/10 text-sm text-white focus:border-cyan-500/50 outline-none transition-all appearance-none cursor-pointer"
                                                title="Liaison Fiche de Personnage"
                                            >
                                                <option value="">Aucune fiche liée</option>
                                                {[...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates].map(t => (
                                                    <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
                                                ))}
                                            </select>
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
                                                    onChange={e => handleUpdate({ combat: { ...combat, initiativeFormula: e.target.value } })}
                                                    className="w-full bg-black/40 px-5 py-4 rounded-2xl border border-white/5 font-mono text-base text-indigo-400 focus:border-indigo-500/40 outline-none shadow-inner"
                                                    placeholder="Ex: dex, 1d6 + int..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 block px-1">Gestion de la Santé</label>
                                                <select 
                                                    value={combat.defaultHealthType || 'hp'}
                                                    onChange={e => handleUpdate({ combat: { ...combat, defaultHealthType: e.target.value as GameDriver['combat']['defaultHealthType'] } })}
                                                    className="w-full bg-black/40 px-5 py-4 rounded-2xl border border-white/5 text-sm text-white focus:border-indigo-500/40 outline-none appearance-none cursor-pointer"
                                                    title="Type de santé"
                                                >
                                                    <option value="hp">Points de Vie (HP)</option>
                                                    <option value="wounds">Niveaux de Blessure</option>
                                                    <option value="boxes">Cases de Blessure</option>
                                                    <option value="clocks">Horloges (Type Blades)</option>
                                                    <option value="anatomy">Anatomie (Ciblée)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-4 block px-1">Ordre de tri temporel</label>
                                            <div className="flex p-1 bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
                                                <button 
                                                    onClick={() => handleUpdate({ combat: { ...combat, initiativeSort: 'desc' } })}
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
                                                                        (newRanges as any)[rangeKey] = { ...range, maxUnits: isNaN(val) ? 0 : val };
                                                                        handleUpdate({ tactical: { ...tactical, ranges: newRanges } });
                                                                    }}
                                                                    className="w-24 bg-black/40 text-center py-2.5 rounded-xl border border-white/10 text-xs font-mono text-emerald-400 focus:border-emerald-500/50 outline-none"
                                                                    placeholder="Cases"
                                                                />
                                                            </div>
                                                            <div className="col-span-4 flex justify-center">
                                                                <input 
                                                                    type="number"
                                                                    value={range.modifier}
                                                                    onChange={e => {
                                                                        const val = parseInt(e.target.value);
                                                                        const newRanges = { ...(tactical.ranges || {}) } as TacticalConfig['ranges'];
                                                                        (newRanges as any)[rangeKey] = { ...range, modifier: val };
                                                                        handleUpdate({ tactical: { ...tactical, ranges: newRanges } });
                                                                    }}
                                                                    className={`w-24 bg-black/40 text-center py-2.5 rounded-xl border border-white/10 text-xs font-mono focus:border-emerald-500/50 outline-none ${range.modifier > 0 ? 'text-emerald-400' : range.modifier < 0 ? 'text-rose-400' : 'text-slate-500'}`}
                                                                    placeholder="Mod."
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
                                            placeholder="Ex: Système D&D 5e. Initiative = 1d20+DEX. Les critiques font 2x dés de dégâts. L'IA doit toujours suggérer une option tactique lors de son tour..."
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
