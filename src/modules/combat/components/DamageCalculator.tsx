import React, { useState, useEffect } from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { fractionDeVie } from '../logic/SanteDuCombattant';
import { Zap, HeartPulse, CheckCircle2, AlertTriangle, ShieldAlert, Shield, RotateCcw, Target as TargetIcon, Dices } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_DAMAGE_TYPES = ['magical', 'physical', 'fire', 'cold', 'lightning', 'acid', 'psychic', 'necrotic', 'radiant'];

const DamageCalculator: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
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

    useEffect(() => {
        if (lastRoll && lastRoll.total > 0) {
            setAmount(lastRoll.total);
        }
    }, [lastRoll]);

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
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gm-crimson/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                {isHealing ? <HeartPulse size={12} className="text-emerald-400" /> : <Zap size={12} className="text-gm-crimson" />}
                                {isHealing ? t('modules:combat.damage.amount_heal') : t('modules:combat.damage.amount_dmg')}
                            </label>
                            {lastRoll && (
                                <button 
                                    onClick={() => setAmount(lastRoll.total)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] font-black text-indigo-400 transition-all"
                                >
                                    <Dices size={10} /> {t('modules:combat.damage.last_roll', { total: lastRoll.total })}
                                </button>
                            )}
                        </div>
                        
                        <div className="relative group">
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-6 text-5xl font-black text-center focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.05] transition-all"
                            />
                        </div>

                        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                            <button 
                                onClick={() => setIsHealing(false)}
                                className={`flex-1 py-2.5 text-[10px] font-black tracking-widest transition-all rounded-lg ${!isHealing ? 'bg-gm-crimson text-white shadow-glow-crimson' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t('modules:combat.damage.action_dmg')}
                            </button>
                            <button 
                                onClick={() => setIsHealing(true)}
                                className={`flex-1 py-2.5 text-[10px] font-black tracking-widest transition-all rounded-lg ${isHealing ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t('modules:combat.damage.action_heal')}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            {t('modules:combat.damage.type_label')}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-[156px] overflow-y-auto custom-scrollbar pr-2">
                            {damageTypes.map(tKey => (
                                <button
                                    key={tKey}
                                    onClick={() => setType(tKey)}
                                    className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                        type === tKey 
                                        ? 'bg-primary text-white border-primary shadow-glow-primary/30' 
                                        : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'
                                    }`}
                                >
                                    {t(`modules:combat.damage.types.${tKey}`, { defaultValue: tKey })}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] rounded-[2rem] border border-white/5 p-6 mb-8 overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <TargetIcon size={18} />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('modules:combat.damage.targets', { count: selectedIds.length })}</h4>
                        </div>
                        <button 
                            onClick={toggleAll} 
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black text-slate-500 hover:text-primary transition-all uppercase tracking-widest border border-white/5"
                        >
                            <RotateCcw size={10} className="group-hover:rotate-180 transition-transform duration-500" />
                            {selectedIds.length === combatants.length ? t('common:actions.clear') : t('common:actions.all')}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-3">
                        {combatants.map(c => {
                            const isSelected = selectedIds.includes(c.id);
                            const preview = calculatePreview(c);
                            const hasResistance = c.resistances?.includes(type);
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
                                                {/* Sans jauge, on ne dessine pas une barre vide : on dit
                                                    qu'il n'y en a pas. Un 0/0 se lirait « mourant ». */}
                                                {(!healthSys || healthSys.type === 'hp') ? (
                                                    fractionDeVie(c) === null ? (
                                                        <span className="text-[9px] font-mono text-slate-600 font-bold uppercase tracking-widest">
                                                            sans jauge
                                                        </span>
                                                    ) : (
                                                    <>
                                                        <div className="flex bg-black/40 h-1 w-24 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${fractionDeVie(c)! < 0.3 ? 'bg-gm-crimson' : 'bg-emerald-500'}`}
                                                                style={{ width: `${fractionDeVie(c)! * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[9px] font-mono text-slate-500 font-bold">{c.hp}/{c.hpMax} PV</span>
                                                    </>
                                                    )
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                                                            healthSys.state === 'dead' ? 'bg-slate-500/10 border-slate-500/30 text-slate-500' :
                                                            healthSys.state === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                                            'bg-primary/10 border-primary/30 text-primary'
                                                        }`}>
                                                            {healthSys.type}
                                                        </div>
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

                <div className="flex gap-4">
                    <button 
                        onClick={closeModal}
                        className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-slate-500 font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all border border-white/5 text-xs"
                    >
                        {t('common:actions.cancel')}
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
                        {isHealing ? t('modules:combat.damage.action_heal') : t('modules:combat.damage.action_dmg')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DamageCalculator;
