import React, { useState, useEffect } from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { fractionDeVie, decrireLaSante } from '../logic/SanteDuCombattant';
import { typesDeDegats } from '../logic/TypesDeDegats';
import { Zap, HeartPulse, CheckCircle2, AlertTriangle, ShieldAlert, Shield, RotateCcw, Target as TargetIcon, Dices } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DamageCalculator: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { combatants, applyDamage } = useCombatStore();
    const { getActiveDriver } = useSessionOSStore();
    const { closeModal, defaultValue } = useModalStore();
    const { lastRoll } = useDiceStore();
    
    const activeDriver = getActiveDriver();
    // La liste vit dans `TypesDeDegats` depuis le 2026-08-19 : le panneau de
    // santé en a besoin aussi, et deux copies auraient divergé au premier ajout.
    const damageTypes = typesDeDegats(activeDriver);

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
        <div className="flex flex-col h-full bg-app-bg text-app-text font-display p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gm-crimson/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-subtle flex items-center gap-2">
                                {isHealing ? <HeartPulse size={12} className="text-etat-succes" /> : <Zap size={12} className="text-gm-crimson" />}
                                {isHealing ? t('modules:combat.damage.amount_heal') : t('modules:combat.damage.amount_dmg')}
                            </label>
                            {lastRoll && (
                                <button 
                                    onClick={() => setAmount(lastRoll.total)}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-etat-info/10 hover:bg-etat-info/20 border border-etat-info/30 rounded text-ui-9 font-black text-etat-info transition-all"
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
                                className="w-full bg-app-text/[0.03] border border-app-text/10 rounded-2xl px-6 py-6 text-5xl font-black text-center focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-app-text/[0.05] transition-all"
                            />
                        </div>

                        <div className="flex p-1 bg-app-bg/40 rounded-xl border border-app-text/5 shadow-inner">
                            <button 
                                onClick={() => setIsHealing(false)}
                                className={`flex-1 py-2.5 text-ui-10 font-black tracking-widest transition-all rounded-lg ${!isHealing ? 'bg-gm-crimson text-app-bg shadow-glow-crimson' : 'text-app-subtle hover:text-app-text'}`}
                            >
                                {t('modules:combat.damage.action_dmg')}
                            </button>
                            <button 
                                onClick={() => setIsHealing(true)}
                                className={`flex-1 py-2.5 text-ui-10 font-black tracking-widest transition-all rounded-lg ${isHealing ? 'bg-etat-succes text-app-bg shadow-glow-emerald' : 'text-app-subtle hover:text-app-text'}`}
                            >
                                {t('modules:combat.damage.action_heal')}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-subtle flex items-center gap-2">
                            {t('modules:combat.damage.type_label')}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-[156px] overflow-y-auto custom-scrollbar pr-2">
                            {damageTypes.map(tKey => (
                                <button
                                    key={tKey}
                                    onClick={() => setType(tKey)}
                                    className={`px-3 py-2.5 rounded-xl text-ui-10 font-black uppercase tracking-wider transition-all border ${
                                        type === tKey 
                                        ? 'bg-primary text-app-on-accent border-primary shadow-glow-primary/30' 
                                        : 'bg-app-text/[0.02] border-app-text/5 text-app-subtle hover:border-app-text/20 hover:text-app-text'
                                    }`}
                                >
                                    {t(`modules:combat.damage.types.${tKey}`, { defaultValue: tKey })}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 bg-app-text/[0.02] rounded-[2rem] border border-app-text/5 p-6 mb-8 overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <TargetIcon size={18} />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-app-muted">{t('modules:combat.damage.targets', { count: selectedIds.length })}</h4>
                        </div>
                        <button 
                            onClick={toggleAll} 
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-text/5 hover:bg-app-text/10 text-ui-9 font-black text-app-subtle hover:text-primary transition-all uppercase tracking-widest border border-app-text/5"
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
                                        : 'bg-app-text/[0.02] border-transparent hover:border-app-text/10 hover:bg-app-text/[0.04]'
                                    }`}
                                >
                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary animate-pulse" />}
                                    
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                            isSelected ? 'bg-primary border-primary rotate-0' : 'border-app-text/10 rotate-45'
                                        }`}>
                                            {isSelected && <CheckCircle2 size={14} className="text-app-on-accent" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black tracking-wide ${isSelected ? 'text-app-text' : 'text-app-muted group-hover:text-app-text'}`}>
                                                {c.name}
                                            </span>
                                            <div className="flex gap-2 items-center">
                                                {/* Sans jauge, on ne dessine pas une barre vide : on dit
                                                    qu'il n'y en a pas. Un 0/0 se lirait « mourant ». */}
                                                {(!healthSys || healthSys.type === 'hp') ? (
                                                    fractionDeVie(c) === null ? (
                                                        <span className="text-ui-9 font-mono text-app-subtle font-bold uppercase tracking-widest">
                                                            sans jauge
                                                        </span>
                                                    ) : (
                                                    <>
                                                        <div className="flex bg-app-bg/40 h-1 w-24 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${fractionDeVie(c)! < 0.3 ? 'bg-gm-crimson' : 'bg-etat-succes'}`}
                                                                style={{ width: `${fractionDeVie(c)! * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-ui-9 font-mono text-app-subtle font-bold">{decrireLaSante(c) ?? "—"}</span>
                                                    </>
                                                    )
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-1.5 py-0.5 rounded text-ui-8 font-black uppercase tracking-tighter border ${
                                                            healthSys.state === 'dead' ? 'bg-app-subtle/10 border-app-subtle/30 text-app-subtle' :
                                                            healthSys.state === 'critical' ? 'bg-etat-danger/10 border-etat-danger/30 text-etat-danger' :
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
                                                <div className={`text-xl font-black ${isHealing ? 'text-etat-succes' : preview === 0 ? 'text-etat-info' : preview > amount ? 'text-etat-danger' : 'text-etat-alerte'}`}>
                                                    {isHealing ? `+${amount}` : `-${preview}`}
                                                </div>
                                            </div>
                                            {preview !== amount && !isHealing && (
                                                <div className={`p-2 rounded-lg ${hasImmunity ? 'bg-etat-info/10 text-etat-info' : hasResistance ? 'bg-etat-alerte/10 text-etat-alerte' : 'bg-etat-danger/10 text-etat-danger'}`}>
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
                        className="flex-1 py-5 bg-app-text/5 hover:bg-app-text/10 text-app-subtle font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all border border-app-text/5 text-xs"
                    >
                        {t('common:actions.cancel')}
                    </button>
                    <button 
                        disabled={selectedIds.length === 0}
                        onClick={handleApply}
                        className={`flex-[2] py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-xs ${
                            selectedIds.length === 0 
                            ? 'bg-app-surface-2 text-app-subtle cursor-not-allowed opacity-30 border border-app-text/5' 
                            : isHealing 
                                ? 'bg-gradient-to-r from-etat-succes to-etat-succes/80 text-app-bg shadow-glow-emerald hover:shadow-glow-emerald/30 hover:scale-[1.02]' 
                                : 'bg-gradient-to-r from-gm-crimson to-etat-danger text-app-bg shadow-glow-crimson hover:shadow-glow-crimson/30 hover:scale-[1.02]'
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
