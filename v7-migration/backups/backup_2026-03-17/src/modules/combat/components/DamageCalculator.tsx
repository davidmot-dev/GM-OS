import React, { useState } from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { Zap, Shield, HeartPulse, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

const DEFAULT_DAMAGE_TYPES = ["Magique", "Physique", "Feu", "Froid", "Foudre", "Acide", "Psychique", "Nécrotique", "Radiant"];

const DamageCalculator: React.FC = () => {
    const { combatants, applyDamage } = useCombatStore();
    const { getActiveDriver } = useSessionOSStore();
    const { closeModal } = useModalStore();
    
    const activeDriver = getActiveDriver();
    const damageTypes = activeDriver?.combat.damageTypes || DEFAULT_DAMAGE_TYPES;

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

    const calculatePreview = (c: Combatant) => {
        if (isHealing) return -amount;
        
        let final = amount;
        if (c.immunities?.includes(type)) final = 0;
        else if (c.resistances?.includes(type)) final = Math.floor(amount / 2);
        else if (c.vulnerabilities?.includes(type)) final = amount * 2;
        
        return final;
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-display p-6 overflow-hidden">
            {/* Top Bar: Amount & Type */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        {isHealing ? <HeartPulse size={12} className="text-emerald-400" /> : <Zap size={12} className="text-gm-crimson" />}
                        {isHealing ? 'Soins' : 'Dégâts'}
                    </label>
                    <div className="flex bg-black/40 rounded-xl border border-white/10 overflow-hidden">
                        <button 
                            onClick={() => setIsHealing(false)}
                            className={`flex-1 py-3 text-xs font-bold transition-all ${!isHealing ? 'bg-gm-crimson text-white shadow-glow-crimson' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            DEGATS
                        </button>
                        <button 
                            onClick={() => setIsHealing(true)}
                            className={`flex-1 py-3 text-xs font-bold transition-all ${isHealing ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            SOINS
                        </button>
                    </div>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-2xl font-black text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Shield size={12} /> Type de Dégâts
                    </label>
                    <div className="grid grid-cols-2 gap-2 h-[calc(100%-24px)] overflow-y-auto custom-scrollbar pr-2">
                        {damageTypes.map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                                    type === t 
                                    ? 'bg-primary/20 border-primary text-primary' 
                                    : 'bg-white/5 border-transparent text-slate-500 hover:border-white/10 hover:text-slate-300'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Target Selection */}
            <div className="flex-1 flex flex-col min-h-0 bg-black/20 rounded-2xl border border-white/5 p-4 mb-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cibles ({selectedIds.length})</h4>
                    <button onClick={toggleAll} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">
                        {selectedIds.length === combatants.length ? 'Tout déselectionner' : 'Tout sélectionner'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {combatants.map(c => {
                        const isSelected = selectedIds.includes(c.id);
                        const preview = calculatePreview(c);
                        const hasResistance = c.resistances?.includes(type);
                        const hasVulnerability = c.vulnerabilities?.includes(type);
                        const hasImmunity = c.immunities?.includes(type);

                        return (
                            <div 
                                key={c.id}
                                onClick={() => toggleTarget(c.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                    isSelected 
                                    ? 'bg-primary/10 border-primary/30' 
                                    : 'bg-white/5 border-transparent hover:border-white/10 p-3'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                        isSelected ? 'bg-primary border-primary' : 'border-white/20'
                                    }`}>
                                        {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{c.name}</span>
                                        <div className="flex gap-1 items-center">
                                            <span className="text-[9px] font-mono text-slate-500">{c.hp}/{c.hpMax} PV</span>
                                            {!isHealing && (
                                                <div className="flex gap-1 ml-2">
                                                    {hasImmunity && <span className="text-[8px] px-1 bg-blue-500/20 text-blue-400 rounded">IMMUNE</span>}
                                                    {hasResistance && <span className="text-[8px] px-1 bg-amber-500/20 text-amber-400 rounded">RESIST</span>}
                                                    {hasVulnerability && <span className="text-[8px] px-1 bg-red-500/20 text-red-400 rounded">VULN</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className={`text-sm font-black ${isHealing ? 'text-emerald-400' : preview === 0 ? 'text-blue-400' : preview > amount ? 'text-red-500' : 'text-amber-400'}`}>
                                                {isHealing ? `+${amount}` : `-${preview}`}
                                            </div>
                                            <span className="text-[9px] text-slate-500 uppercase tracking-tighter">PRÉCO</span>
                                        </div>
                                        {preview !== amount && !isHealing && (
                                            <div className="flex flex-col items-center text-amber-500">
                                                {hasImmunity ? <ShieldAlert size={14} /> : hasResistance ? <Shield size={14} /> : <AlertTriangle size={14} />}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <button 
                    onClick={closeModal}
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-2xl transition-all"
                >
                    ANNULER
                </button>
                <button 
                    disabled={selectedIds.length === 0}
                    onClick={handleApply}
                    className={`flex-[2] py-4 rounded-2xl font-black tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                        selectedIds.length === 0 
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                        : isHealing 
                            ? 'bg-emerald-600 text-white shadow-glow-emerald hover:bg-emerald-500' 
                            : 'bg-gm-crimson text-white shadow-glow-crimson hover:bg-red-500'
                    }`}
                >
                    {isHealing ? <HeartPulse size={18} /> : <Zap size={18} />}
                    APPLIQUER {isHealing ? 'SOINS' : 'DEGATS'}
                </button>
            </div>
        </div>
    );
};

export default DamageCalculator;
