import React, { useState } from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { Zap, Shield, HeartPulse, CheckCircle2, AlertTriangle, ShieldAlert, RotateCcw, Target as TargetIcon, Dices } from 'lucide-react';

const DEFAULT_DAMAGE_TYPES = ["Magique", "Physique", "Feu", "Froid", "Foudre", "Acide", "Psychique", "Nécrotique", "Radiant"];

const DamageCalculator: React.FC = () => {
    const { combatants, applyDamage } = useCombatStore();
    const { getActiveDriver } = useSessionOSStore();
    const { closeModal, defaultValue } = useModalStore();
    const { lastRoll } = useDiceStore();
    
    const activeDriver = getActiveDriver();
    const damageTypes = activeDriver?.combat.damageTypes || DEFAULT_DAMAGE_TYPES;

    const [selectedIds, setSelectedIds] = useState<string[]>(() => {
        if (defaultValue && typeof defaultValue === 'object') {
            const data = defaultValue as { targetIds?: string[] };
            return data.targetIds || [];
        }
        return [];
    });
    const [amount, setAmount] = useState<number>(10);
    const [type, setType] = useState<string>(damageTypes[0]);
    const [isHealing, setIsHealing] = useState(false);

    const toggleTarget = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === combatants.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(combatants.map(c => c.id));
        }
    };

    const handleApply = () => {
        if (selectedIds.length === 0) return;
        const finalAmount = isHealing ? -amount : amount;
        applyDamage(finalAmount, type, selectedIds);
        closeModal();
    };

    const handleUseLastRoll = () => {
        if (lastRoll) {
            setAmount(lastRoll.total);
        }
    };

    const calculatePreview = (c: Combatant) => {
        if (isHealing) return -amount;
        
        let final = amount;
        if (c.immunities?.includes(type)) final = 0;
        else if (c.resistances?.includes(type)) final = Math.floor(amount / 2);
        else if (c.vulnerabilities?.includes(type)) final = amount * 2;
        
        return final;
    };

    const getHealthSystem = (c: Combatant) => {
        const sessionState = useSessionOSStore.getState();
        if (c.isPlayer && c.sourcePlayerId) {
            const player = sessionState.players.find(p => p.characters.some(char => char.id === c.sourcePlayerId));
            return player?.characters.find(char => char.id === c.sourcePlayerId)?.healthSystem;
        } else if (c.sourceEntityId) {
            return sessionState.entities.find(e => e.id === c.sourceEntityId)?.healthSystem;
        }
        return undefined;
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-display p-8 overflow-hidden relative">
            {/* Background elements for premium feel */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gm-crimson/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header: Amount & Type */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Amount Input Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                {isHealing ? <HeartPulse size={12} className="text-emerald-400" /> : <Zap size={12} className="text-gm-crimson" />}
                                {isHealing ? 'Soins à prodiguer' : 'Dégâts à infliger'}
                            </label>
                            {lastRoll && (
                                <button 
                                    onClick={handleUseLastRoll}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] font-black text-indigo-400 transition-all animate-in fade-in slide-in-from-right-2"
                                >
                                    <Dices size={10} /> DERNIER JET: {lastRoll.totalDisplay}
                                </button>
                            )}
                        </div>
                        
                        <div className="relative group">
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-6 text-5xl font-black text-center focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.05] transition-all"
                                title="Montant"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setAmount(prev => prev + 1)} className="p-1 hover:bg-white/10 rounded text-slate-500" title="Augmenter">+</button>
                                <button onClick={() => setAmount(prev => Math.max(0, prev - 1))} className="p-1 hover:bg-white/10 rounded text-slate-500" title="Diminuer">-</button>
                            </div>
                        </div>

                        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                            <button 
                                onClick={() => setIsHealing(false)}
                                className={`flex-1 py-2.5 text-[10px] font-black tracking-widest transition-all rounded-lg ${!isHealing ? 'bg-gm-crimson text-white shadow-glow-crimson' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                DÉGÂTS
                            </button>
                            <button 
                                onClick={() => setIsHealing(true)}
                                className={`flex-1 py-2.5 text-[10px] font-black tracking-widest transition-all rounded-lg ${isHealing ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                SOINS
                            </button>
                        </div>
                    </div>

                    {/* Type Selector Section */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <Shield size={12} /> Type énergétique
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-[156px] overflow-y-auto custom-scrollbar pr-2">
                            {damageTypes.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                        type === t 
                                        ? 'bg-primary text-white border-primary shadow-glow-primary/30' 
                                        : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Target Selection: The "List" feel */}
                <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] rounded-[2rem] border border-white/5 p-6 mb-8 overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <TargetIcon size={18} />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Cibles ({selectedIds.length})</h4>
                        </div>
                        <button 
                            onClick={toggleAll} 
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black text-slate-500 hover:text-primary transition-all uppercase tracking-widest border border-white/5"
                        >
                            <RotateCcw size={10} className="group-hover:rotate-180 transition-transform duration-500" />
                            {selectedIds.length === combatants.length ? 'Tout vider' : 'Tout cocher'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-3">
                        {combatants.map(c => {
                            const isSelected = selectedIds.includes(c.id);
                            const preview = calculatePreview(c);
                            const hasResistance = c.resistances?.includes(type);
                            const hasVulnerability = c.vulnerabilities?.includes(type);
                            const hasImmunity = c.immunities?.includes(type);
                            const healthSys = getHealthSystem(c);

                            return (
                                <div 
                                    key={c.id}
                                    onClick={() => toggleTarget(c.id)}
                                    className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                                        isSelected 
                                        ? 'bg-primary/10 border-primary/40 shadow-glow-primary/5' 
                                        : 'bg-white/[0.02] border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary animate-pulse" />}
                                    
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                            isSelected ? 'bg-primary border-primary rotate-0' : 'border-white/10 rotate-45'
                                        }`}>
                                            {isSelected && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black tracking-wide ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                {c.name}
                                            </span>
                                            <div className="flex gap-2 items-center">
                                                {(!healthSys || healthSys.type === 'hp') ? (
                                                    <>
                                                        <div className="flex bg-black/40 h-1 w-24 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all duration-500 ${c.hp / c.hpMax < 0.3 ? 'bg-gm-crimson' : 'bg-emerald-500'}`}
                                                                style={{ width: `${(c.hp / c.hpMax) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[9px] font-mono text-slate-500 font-bold">{c.hp}/{c.hpMax} PV</span>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                                                            healthSys.state === 'dead' ? 'bg-slate-500/10 border-slate-500/30 text-slate-500' :
                                                            healthSys.state === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                                            'bg-primary/10 border-primary/30 text-primary'
                                                        }`}>
                                                            {healthSys.type}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 capitalize">
                                                            {healthSys.type === 'wounds' && (healthSys.data.levels as string[])[healthSys.data.currentIndex as number] || 'Sain'}
                                                            {healthSys.type === 'clocks' && `${healthSys.data.filled}/${healthSys.data.segments} segments`}
                                                            {healthSys.type === 'boxes' && `${((healthSys.data.boxes as {filled: boolean}[]) || []).filter(b => b.filled).length}/${((healthSys.data.boxes as any[]) || []).length} stress`}
                                                        </span>
                                                    </div>
                                                )}
                                                {!isHealing && (
                                                    <div className="flex gap-1 ml-2">
                                                        {hasImmunity && <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded lowercase font-black border border-blue-500/20">immune</span>}
                                                        {hasResistance && <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded lowercase font-black border border-amber-500/20">resist</span>}
                                                        {hasVulnerability && <span className="text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded lowercase font-black border border-red-500/20">vuln</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={`text-xl font-black ${isHealing ? 'text-emerald-400' : preview === 0 ? 'text-blue-400' : preview > amount ? 'text-red-500' : 'text-amber-400'}`}>
                                                    {isHealing ? `+${amount}` : `-${preview}`}
                                                </div>
                                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">
                                                    {(healthSys && healthSys.type !== 'hp') ? 'IMPACT' : 'POINTS DE VIE'}
                                                </span>
                                            </div>
                                            {preview !== amount && !isHealing && (
                                                <div className={`p-2 rounded-lg ${hasImmunity ? 'bg-blue-500/10 text-blue-400' : hasResistance ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-500'}`}>
                                                    {hasImmunity ? <ShieldAlert size={18} /> : hasResistance ? <Shield size={18} /> : <AlertTriangle size={18} />}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Final Actions */}
                <div className="flex gap-4">
                    <button 
                        onClick={closeModal}
                        className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-slate-500 font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all border border-white/5 text-xs"
                    >
                        ANNULER
                    </button>
                    <button 
                        disabled={selectedIds.length === 0}
                        onClick={handleApply}
                        className={`flex-[2] py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-xs ${
                            selectedIds.length === 0 
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-30 border border-white/5' 
                            : isHealing 
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow-emerald hover:shadow-glow-emerald/30 hover:scale-[1.02]' 
                                : 'bg-gradient-to-r from-gm-crimson to-red-600 text-white shadow-glow-crimson hover:shadow-glow-crimson/30 hover:scale-[1.02]'
                        }`}
                    >
                        {isHealing ? <HeartPulse size={18} /> : <Zap size={18} />}
                        {isHealing ? 'DÉCLENCHER SOINS' : 'DÉCLENCHER DÉGÂTS'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DamageCalculator;
