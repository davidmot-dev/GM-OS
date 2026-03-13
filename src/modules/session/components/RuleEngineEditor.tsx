import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Sparkles, Brain, Save, ArrowLeft, PenTool, Music, Beaker, User,
    Hammer, BookOpen, Dice5, type LucideIcon 
} from 'lucide-react';
import { useGemStore } from '../../../stores/useGemStore';
import type { GameDriver } from '../../../types/drivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { gmToast } from '../../../stores/useToastStore';

/**
 * RuleEngineEditor: Full-window interface for modifying the "Brain" of a system.
 * Handles dice mechanics, global AI instructions, and NotebookLM bindings.
 */
const RuleEngineEditor: React.FC = () => {
    const { 
        customGameDrivers, 
        customSheetTemplates,
        updateGameDriver, 
        editingDriverId, 
        setEditingDriverId,
        setCurrentView
    } = useSessionOSStore();

    const driver = customGameDrivers.find(d => d.id === editingDriverId);

    if (!driver) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-app-text/40">
                <Hammer size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-bold">Rule Engine Offline</p>
                <p className="text-sm mt-2 mb-8 text-center max-w-md">The requested rule engine driver could not be found in active memory.</p>
                <button 
                    onClick={() => setCurrentView('templates')}
                    className="px-6 py-2 bg-app-surface border border-app-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-app-surface/80"
                >
                    Return to Library
                </button>
            </div>
        );
    }

    const handleUpdate = (updates: Partial<GameDriver>) => {
        updateGameDriver(driver.id, updates);
    };

    const handleBack = () => {
        setEditingDriverId(null);
        setCurrentView('templates');
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-app-bg select-none">
            {/* Top Premium Bar */}
            <div className="h-20 border-b border-app-border/40 bg-app-surface/80 backdrop-blur-2xl px-8 flex items-center justify-between z-50">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-app-bg border border-app-border/40 text-app-text/60 hover:text-white hover:border-accent/40 transition-all shadow-lg hover:scale-105 active:scale-95 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="h-10 w-[1px] bg-app-border/20 mx-2" />
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={driver.emoji}
                            onChange={e => handleUpdate({ emoji: e.target.value })}
                            className="w-12 h-12 bg-app-bg text-center text-2xl rounded-2xl p-1 border border-app-border/40 focus:outline-none focus:border-accent/50 shadow-inner"
                            maxLength={2}
                        />
                        <div>
                            <input
                                type="text"
                                value={driver.name}
                                onChange={e => handleUpdate({ name: e.target.value })}
                                className="bg-transparent text-xl font-black text-white focus:outline-none border-b border-transparent focus:border-accent/40 transition-all min-w-[200px]"
                                placeholder="Nom du moteur de règles"
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    Rule Engine Core
                                </span>
                                <span className="text-[9px] text-app-text/20 font-bold uppercase tracking-tighter">ID: {driver.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => gmToast("Configuration du moteur synchronisée", "success")}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-app-bg font-black text-xs uppercase tracking-widest shadow-glow-accent hover:opacity-90 transition-all"
                >
                    <Save size={16} /> Synchroniser
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-dots-pattern">
                <div className="max-w-6xl mx-auto p-12 space-y-12 pb-32">
                    
                    {/* section: Mechanics & Dice */}
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-4 space-y-6">
                            <div className="p-6 bg-app-surface/40 rounded-3xl border border-app-border/40 shadow-2xl relative overflow-hidden group">
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent mb-4">
                                    <Dice5 size={16} /> Dice-OS Core
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-app-text/40 mb-2 block">Dés par défaut</label>
                                        <input 
                                            type="text"
                                            value={driver.dice.defaultDice}
                                            onChange={e => handleUpdate({ dice: { ...driver.dice, defaultDice: e.target.value } })}
                                            className="w-full bg-app-bg px-4 py-3 rounded-xl border border-app-border/40 font-mono text-sm focus:border-accent/40 outline-none"
                                            placeholder="Ex: 1d20, 3d6..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-app-text/40 mb-2 block">Liaison Fiche (Body)</label>
                                        <select 
                                            value={driver.templateId}
                                            onChange={e => handleUpdate({ templateId: e.target.value })}
                                            className="w-full bg-app-bg px-4 py-3 rounded-xl border border-app-border/40 text-xs focus:border-accent/40 outline-none"
                                        >
                                            <option value="">Aucune fiche liée</option>
                                            {[...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates].map(t => (
                                                <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-8 space-y-6">
                            <div className="p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/20 shadow-2xl">
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-400 mb-6 font-mono">
                                    <Hammer size={16} /> Extraction Logique (Prompt Global)
                                </h4>
                                <textarea 
                                    value={driver.aiInstructions}
                                    onChange={e => handleUpdate({ aiInstructions: e.target.value })}
                                    placeholder="Décrivez les règles fondamentales (système de dés, critiques, avantages...) pour que l'IA puisse les appliquer."
                                    className="w-full h-48 bg-black/20 text-[11px] text-app-text/80 p-4 rounded-2xl border border-white/5 focus:border-indigo-500/40 outline-none transition-all font-mono leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-transparent via-app-border/40 to-transparent" />

                    {/* AI Resonances (Personas & Gems) */}
                    <div className="space-y-8">
                        <div className="flex flex-col gap-2">
                             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-3">
                                <Sparkles size={14} /> Aetheric Resonance & Personas
                            </h3>
                            <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest max-w-2xl">
                                Définissez comment l'IA doit interpréter le système pour chaque rôle. Ces instructions surchargent les protocoles par défaut.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            {useGemStore.getState().gems.map(gem => {
                                const iconMap: Record<string, LucideIcon> = { BookOpen, PenTool, Music, Beaker, User, Sparkles, Brain };
                                const Icon = iconMap[gem.icon] || Brain;
                                const currValue = driver.aiPersonas?.[gem.id] || '';
                                return (
                                    <div key={gem.id} className={`p-4 rounded-2xl border transition-all ${currValue ? 'bg-accent/5 border-accent/30 shadow-glow-accent/5' : 'bg-app-surface/20 border-app-border/40 hover:border-app-border/60'} group`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${currValue ? 'bg-accent text-app-bg' : 'bg-app-bg text-app-text/40'}`}>
                                                    <Icon size={14} />
                                                </div>
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${currValue ? 'text-accent' : 'text-app-text/60'}`}>{gem.name}</span>
                                            </div>
                                            {currValue && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
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
                                            placeholder={`Instructions IA pour ${gem.name}...`}
                                            className="w-full h-32 bg-app-bg/40 border border-app-border/20 rounded-xl p-3 text-[11px] text-app-text/80 focus:border-accent/40 outline-none transition-all font-mono resize-none leading-relaxed"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-transparent via-app-border/40 to-transparent" />

                    {/* NotebookLM Binding */}
                    <div className="p-8 bg-app-surface/40 rounded-3xl border border-app-border/40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-accent/5 -rotate-12 translate-x-4 -translate-y-4">
                            <BookOpen size={120} />
                        </div>
                        <div className="max-w-xl space-y-6">
                            <h4 className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-accent">
                                <BookOpen size={18} /> Neural Knowledge Link (NotebookLM)
                            </h4>
                            <p className="text-[11px] text-app-text/60 leading-relaxed uppercase font-bold tracking-widest">
                                Liez une base de connaissance externe pour que l'IA puisse consulter les règles complètes, le lore et les monstres en temps réel.
                            </p>
                            <div className="relative group">
                                <BookOpen size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40" />
                                <input 
                                    type="text"
                                    value={driver.defaultNotebookUrl || ''}
                                    onChange={e => handleUpdate({ defaultNotebookUrl: e.target.value })}
                                    placeholder="URL du NotebookLM (https://notebooklm.google.com/...)"
                                    className="w-full bg-app-bg/60 text-xs text-app-text/80 pl-11 pr-4 py-4 rounded-2xl border border-app-border/40 focus:outline-none focus:border-accent/50 transition-all font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RuleEngineEditor;
