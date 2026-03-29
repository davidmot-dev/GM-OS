import React, { useState, useCallback } from 'react';
import { DiceEngine } from './DiceEngine';
import type { RollResult } from './DiceEngine';
import { Dices, RotateCcw, Zap, BookmarkPlus, X } from 'lucide-react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useMapStore } from '../map/useMapStore';
import { tacticalService } from '../map/TacticalService';
import { Target, Info, Cast, XCircle } from 'lucide-react';
import { useDiceStore } from '../../stores/useDiceStore';

const generateId = () => Math.random().toString(36).substring(7);

interface RollRecord extends RollResult {
    id: string;
    timestamp: Date;
    title: string;
    batchId?: string;
}

interface QuickRoll {
    id: string;
    label: string;
    formula: string; // ex: 1d20+5
}

type DiceMode = 'standard' | 'formula' | 'pool' | 'pool_explode' | 'threshold' | 'advantage' | 'disadvantage' | 'exploding' | 'fate' | 'rolemaster' | 'yze';

const DiceBoard: React.FC = () => {
    // Tactical Bridge State
    const { tokens, gridSize } = useMapStore();
    const [lastSelectedTokenId, setLastSelectedTokenId] = useState<string | null>(null);
    const [targetTokenId, setTargetTokenId] = useState<string | null>(null);
    const { isDiceProjected, setIsDiceProjected, triggerDiceProjection } = useDiceStore();
    // Le timer est désormais géré au niveau du Player Hub via projectionTrigger

    const handleToggleProjection = () => {
        setIsDiceProjected(!isDiceProjected);
        if (!isDiceProjected) {
            triggerDiceProjection(); // Déclencher immédiatement si on l'allume
        }
    };
    // Config
    const [mode, setMode] = useState<DiceMode>('standard');
    const [diceCount, setDiceCount] = useState<number>(1);
    const [modifier, setModifier] = useState<number | string>(0);
    const [target, setTarget] = useState<number>(10);
    const [gearCount, setGearCount] = useState<number>(1); // For YZE secondary pool
    const [formulaInput, setFormulaInput] = useState<string>('2d6+5');

    // v3 Features State
    const [targetRule, setTargetRule] = useState<'over' | 'under'>('over');
    const [batchCount, setBatchCount] = useState<number>(1);

    // Data
    const [history, setHistory] = useState<RollRecord[]>([]);
    const [quickRolls, setQuickRolls] = useState<QuickRoll[]>([
        { id: 'qr1', label: 'Attaque Épée Longue', formula: '1d20+7' },
        { id: 'qr2', label: 'Dégâts', formula: '1d8+4' },
        { id: 'qr3', label: 'Lancer D66', formula: '1d66' }
    ]);
    const [newQuickRollLabel, setNewQuickRollLabel] = useState('');
    const [newQuickRollFormula, setNewQuickRollFormula] = useState('');
    const [isAddingQuickRoll, setIsAddingQuickRoll] = useState(false);

    const diceTypes = [4, 6, 8, 10, 12, 20, 100];

    const resetConfig = () => {
        setDiceCount(1);
        setModifier(0);
        setTarget(10);
        setGearCount(1);
        setBatchCount(1);
        setTargetRule('over');
        setFormulaInput('2d6+5');
    };

    const { getActiveDriver } = useSessionOSStore();
    const activeDriver = getActiveDriver();
    const [useSystemDriver, setUseSystemDriver] = useState(false);

    // Auto-sync with active system driver
    React.useEffect(() => {
        if (activeDriver) {
            setUseSystemDriver(true);
            
            // Map engine to local mode
            const engine = activeDriver.dice.engine as string | undefined;
            
            if (engine === 'yze' || engine === 'year-zero') {
                setMode('yze');
                const dCount = parseInt(activeDriver.dice.defaultDice) || 6;
                setDiceCount(dCount);
            } else {
                // Try to extract count from "XdY"
                const dicePart = activeDriver.dice.defaultDice.match(/(\d+)d(\d+)/i);
                if (dicePart) {
                    setDiceCount(parseInt(dicePart[1]));
                }
                
                if (engine === 'rolemaster' || engine === 'd100') {
                    setMode('rolemaster');
                } else if (engine === '2d20') {
                    setMode('standard'); // Handled by engine logic
                } else if (engine === 'pool' || engine === 'pool_explode') {
                    setMode(engine);
                    setTarget(activeDriver.dice.successThreshold || 8);
                } else if (engine === 'threshold') {
                    setMode('threshold');
                    setTarget(activeDriver.dice.successThreshold || 10);
                } else if (engine === 'advantage' || engine === 'disadvantage') {
                    setMode(engine);
                } else if (engine === 'fate') {
                    setMode('fate');
                } else if (engine === 'exploding') {
                    setMode('exploding');
                } else if (engine === 'formula') {
                    setMode('formula');
                } else if (activeDriver.dice.logic === 'count-success') {
                    setMode('pool');
                    setTarget(activeDriver.dice.successThreshold || 8);
                } else {
                    setMode('standard');
                }
            }
        } else {
            setUseSystemDriver(false);
            setMode('standard');
        }
    }, [activeDriver, activeDriver?.id]); // Only re-run when actual system changes

    const executeRoll = useCallback((sides: number = 20, isFormulaText: boolean = false, customFormula: string = "") => {
        let result: RollResult;
        
        if (useSystemDriver && activeDriver) {
            const modVal = typeof modifier === 'string' ? (parseInt(modifier.replace('+', ''), 10) || 0) : modifier;
            result = DiceEngine.rollFromConfig(activeDriver.dice, {
                modifier: modVal,
                baseCount: diceCount,
                gearCount: gearCount,
                targetOverwrite: target
            });
            return { result, title: `Système: ${activeDriver.name}` };
        }

        let title = `${diceCount}d${sides}`;
        const modVal = typeof modifier === 'string' ? (parseInt(modifier.replace('+', ''), 10) || 0) : modifier;

        if (isFormulaText) {
            const formObj = customFormula || formulaInput;
            result = DiceEngine.rollFormula(formObj);
            title = `Formule: ${formObj}`;
        } else {
            switch (mode) {
                case 'standard':
                    result = DiceEngine.rollStandard(sides, diceCount, modVal, false); // Always false for standard
                    break;
                case 'exploding':
                    result = DiceEngine.rollStandard(sides, diceCount, modVal, true);
                    title = `Explosif ${diceCount}d${sides}`;
                    break;
                case 'pool':
                    result = DiceEngine.rollPool(sides, diceCount, modVal, target, false); // Always false for pool
                    title = `Pool ${diceCount}d${sides} (Diff ${target})`;
                    break;
                case 'pool_explode':
                    result = DiceEngine.rollPool(sides, diceCount, modVal, target, true);
                    title = `Pool Exp. ${diceCount}d${sides} (Diff ${target})`;
                    break;
                case 'threshold':
                    result = DiceEngine.rollThreshold(sides, diceCount, modVal, target, targetRule);
                    title = `Test ${diceCount}d${sides} ${targetRule === 'over' ? '≥' : '≤'} ${target}`;
                    break;
                case 'advantage':
                    result = DiceEngine.rollAdvantage(sides, modVal, true, target, targetRule);
                    title = `Avantage 2d${sides}`;
                    break;
                case 'disadvantage':
                    result = DiceEngine.rollAdvantage(sides, modVal, false, target, targetRule);
                    title = `Désavantage 2d${sides}`;
                    break;
                case 'fate':
                    result = DiceEngine.rollFate(diceCount, modVal);
                    title = `FATE ${diceCount}dF`;
                    break;
                case 'rolemaster':
                    result = DiceEngine.rollRolemaster(modVal);
                    title = `Rolemaster d100`;
                    break;
                case 'yze':
                    result = DiceEngine.rollYZE(diceCount, gearCount);
                    title = `YZE (${diceCount} Base + ${gearCount} Gear)`;
                    break;
                default:
                    result = DiceEngine.rollStandard(sides, diceCount, modVal);
            }
        }
        return { result, title };
    }, [useSystemDriver, activeDriver, modifier, diceCount, gearCount, target, formulaInput, mode, targetRule]);

    const handleRoll = useCallback((sides: number = 20, isFormulaText: boolean = false, customFormula: string = "") => {
        try {
            const batchId = batchCount > 1 ? generateId() : undefined;
            const newRecords: RollRecord[] = [];
            const { setLastRoll } = (window as unknown as Record<string, { getState: () => { setLastRoll: (r: RollRecord) => void } }>).useDiceStore.getState();

            for (let i = 0; i < batchCount; i++) {
                const { result, title } = executeRoll(sides, isFormulaText, customFormula);

                let repTitle = title;
                if (batchCount > 1) repTitle = `${title} (Jet ${i + 1}/${batchCount})`;

                const record = {
                    ...result,
                    id: generateId(),
                    timestamp: new Date(),
                    title: repTitle,
                    batchId
                };
                newRecords.push(record);
                
                // Only set as last global roll the very last one of the batch
                if (i === batchCount - 1) {
                    setLastRoll(record);
                    // Automatiquement projeter sur le Player Hub si le mode est activé
                    if (isDiceProjected) {
                        triggerDiceProjection();
                    }
                }
            }

            setHistory((prev) => [...newRecords.reverse(), ...prev].slice(0, 50));
        } catch (error) {
            console.error("Erreur de lancer:", error);
        }
    }, [batchCount, executeRoll, isDiceProjected, triggerDiceProjection]);

    const handleQuickRoll = (formula: string, label: string) => {
        handleRoll(0, true, formula);
        // Rename the last added history to match label
        setHistory((prev) => {
            const updated = [...prev];
            // Since we batch-added them, the newest are at the start. Update the title.
            // If batch = 1, just update 0. If batch > 1, update 0 to batchCount
            for (let i = 0; i < batchCount && i < updated.length; i++) {
                updated[i].title = `${label} ${batchCount > 1 ? `(Jet ${batchCount - i}/${batchCount})` : ''}`.trim();
            }
            return updated;
        });
    };

    const addQuickRoll = () => {
        if (newQuickRollLabel && newQuickRollFormula) {
            setQuickRolls([...quickRolls, { id: generateId(), label: newQuickRollLabel, formula: newQuickRollFormula }]);
            setIsAddingQuickRoll(false);
            setNewQuickRollLabel('');
            setNewQuickRollFormula('');
        }
    };

    const removeQuickRoll = (id: string) => {
        setQuickRolls(quickRolls.filter(qr => qr.id !== id));
    };

    // --- Remote Control Listeners ---
    React.useEffect(() => {
        const handleRemoteRoll = (e: Event) => {
            const detail = (e as CustomEvent<{ die?: number }>).detail;
            if (detail?.die) {
                console.log("[DiceBoard] Remote Roll Triggered:", detail.die);
                handleRoll(detail.die);
            }
        };
        const handleRemoteClear = () => {
            console.log("[DiceBoard] Remote Clear Triggered");
            setHistory([]);
        };

        window.addEventListener('remote:roll-die', handleRemoteRoll);
        window.addEventListener('remote:clear-dice', handleRemoteClear);
        return () => {
            window.removeEventListener('remote:roll-die', handleRemoteRoll);
            window.removeEventListener('remote:clear-dice', handleRemoteClear);
        };
    }, [handleRoll]);

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 text-app-text">

            {/* LEFT & CENTER COLUMN: Config + Dices + Quick Rolls */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">

                {/* Top: Engine Config */}
                <div className="bg-app-surface/60 p-5 rounded-2xl border border-app-border backdrop-blur-md shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {activeDriver && (
                                <button 
                                    onClick={() => setUseSystemDriver(!useSystemDriver)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${useSystemDriver ? 'bg-accent text-app-bg border-accent/40 shadow-glow-accent/20' : 'bg-app-bg text-app-text/40 border-app-border hover:border-app-border/80'}`}
                                >
                                    <Zap size={14} className={useSystemDriver ? 'animate-pulse' : ''} />
                                    MODE SYSTÈME: {activeDriver.name.toUpperCase()}
                                </button>
                            )}
                        </div>
                        <button onClick={resetConfig} title="Réinitialiser la configuration" className="text-xs flex items-center gap-1.5 text-app-text/60 hover:text-accent transition-colors bg-app-bg px-3 py-1.5 rounded-lg border border-app-border/80">
                            <RotateCcw size={14} /> Réinitialiser
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">Mode</label>
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as DiceMode)}
                                title="Mode de jet de dés"
                                aria-label="Choisir le mode de jet de dés"
                                className="w-full bg-app-bg border border-app-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-app-text"
                            >
                                <option value="standard">Standard d20/d6</option>
                                <option value="exploding">Somme Explosive</option>
                                <option value="formula">Formule Libre</option>
                                <option value="threshold">Jet de Seuil (Target)</option>
                                <option value="pool">Pool de Dés (Succès)</option>
                                <option value="pool_explode">Pool Explosif</option>
                                <option value="advantage">Avantage (Garde Meilleur)</option>
                                <option value="disadvantage">Désavantage (Garde Pire)</option>
                                <option value="yze">Year Zero Engine</option>
                                <option value="fate">FATE / Fudge</option>
                                <option value="rolemaster">Rolemaster</option>
                            </select>
                        </div>

                        {mode === 'formula' ? (
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">Expression (ex: 2d6+1d4-2)</label>
                                <div className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/50 h-[38px]">
                                    <input
                                        type="text" value={formulaInput} onChange={e => setFormulaInput(e.target.value)}
                                        className="w-full bg-transparent px-4 py-2 font-mono text-sm text-app-text outline-none"
                                        placeholder="Entrez une formule..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Qty & Mod */}
                                {mode === 'yze' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">Dés Base/Equip</label>
                                        <div className="flex space-x-2">
                                            <div className="flex flex-1 bg-app-bg border border-app-border rounded-xl overflow-hidden shadow-inner h-[38px]">
                                                <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-xs px-2 flex items-center border-r border-app-border">B</span>
                                                <input 
                                                    type="number" 
                                                    value={diceCount} 
                                                    onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                    title="Dés de base"
                                                    aria-label="Nombre de dés de base"
                                                    className="w-full bg-transparent text-center font-semibold text-app-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                />
                                                <div className="flex flex-col border-l border-app-border">
                                                    <button onClick={() => setDiceCount(diceCount + 1)} className="flex-1 px-1 flex items-center justify-center hover:bg-app-surface text-xs">+</button>
                                                    <button onClick={() => setDiceCount(Math.max(1, diceCount - 1))} className="flex-1 px-1 flex items-center justify-center hover:bg-app-surface text-xs border-t border-app-border">-</button>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 bg-app-bg border border-app-border rounded-xl overflow-hidden shadow-inner h-[38px]">
                                                <span className="bg-app-surface text-app-text/60 text-xs px-2 flex items-center border-r border-app-border">E</span>
                                                <input 
                                                    type="number" 
                                                    value={gearCount} 
                                                    onChange={(e) => setGearCount(Math.max(0, parseInt(e.target.value) || 0))}
                                                    title="Dés d'équipement"
                                                    aria-label="Nombre de dés d'équipement"
                                                    className="w-full bg-transparent text-center font-semibold text-app-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                />
                                                <div className="flex flex-col border-l border-app-border">
                                                    <button onClick={() => setGearCount(gearCount + 1)} className="flex-1 px-1 flex items-center justify-center hover:bg-app-surface text-xs">+</button>
                                                    <button onClick={() => setGearCount(Math.max(0, gearCount - 1))} className="flex-1 px-1 flex items-center justify-center hover:bg-app-surface text-xs border-t border-app-border">-</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">Quantité</label>
                                        <div className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden h-[38px]">
                                            <button onClick={() => setDiceCount(Math.max(1, diceCount - 1))} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">-</button>
                                            <input 
                                                type="number" 
                                                value={diceCount} 
                                                onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))} 
                                                title="Quantité de dés"
                                                aria-label="Nombre de dés à lancer"
                                                className="w-full bg-transparent text-center font-semibold text-app-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                            />
                                            <button onClick={() => setDiceCount(diceCount + 1)} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">+</button>
                                        </div>
                                    </div>
                                )}

                                <div className={`space-y-2 ${['yze'].includes(mode) ? 'hidden' : ''}`}>
                                    <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">Modificateur</label>
                                    <div className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden h-[38px]">
                                        <button onClick={() => setModifier((typeof modifier === 'number' ? modifier : parseInt(modifier.toString().replace('+', '')) || 0) - 1)} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">-</button>
                                        <input 
                                            type="text" 
                                            value={modifier === 0 || modifier === "0" ? "0" : typeof modifier === 'number' && modifier > 0 ? `+${modifier}` : modifier} 
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/[^0-9+-]/g, '');
                                                if (raw === '' || raw === '-' || raw === '+') setModifier(raw);
                                                else setModifier(parseInt(raw.replace('+', ''), 10) || 0);
                                            }} 
                                            title="Modificateur de jet"
                                            aria-label="Ajouter un bonus ou malus au jet"
                                            className="w-full bg-transparent text-center font-semibold text-app-text outline-none" 
                                        />
                                        <button onClick={() => setModifier((typeof modifier === 'number' ? modifier : parseInt(modifier.toString().replace('+', '')) || 0) + 1)} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">+</button>
                                    </div>
                                </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">Répétitions</label>
                                        <div className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden h-[38px]">
                                            <button onClick={() => setBatchCount(Math.max(1, batchCount - 1))} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">-</button>
                                            <input 
                                                type="number" 
                                                value={batchCount} 
                                                onChange={(e) => setBatchCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                                                title="Nombre de répétitions"
                                                aria-label="Répéter le jet plusieurs fois"
                                                className="w-full bg-transparent text-center font-semibold text-app-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                            />
                                            <button onClick={() => setBatchCount(Math.min(20, batchCount + 1))} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">+</button>
                                        </div>
                                    </div>
                            </>
                        )}

                        {/* Dynamic Inputs depending on mode */}
                        {['pool', 'pool_explode', 'threshold', 'advantage', 'disadvantage'].includes(mode) && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">Seuil & Règle</label>
                                <div className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden h-[38px]">
                                    <select 
                                        value={targetRule} 
                                        onChange={e => setTargetRule(e.target.value as 'over' | 'under')} 
                                        title="Règle du seuil"
                                        aria-label="Coup au dessus ou en dessous"
                                        className="bg-app-surface text-app-text text-xs px-2 outline-none border-r border-app-border"
                                    >
                                        <option value="over">≥</option>
                                        <option value="under">≤</option>
                                    </select>
                                    <button onClick={() => setTarget(target - 1)} className="px-2 hover:bg-app-surface text-app-text/60 transition-colors">-</button>
                                    <input 
                                        type="number" 
                                        value={target} 
                                        onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                                        title="Valeur du seuil"
                                        aria-label="Entrer manuellement le seuil"
                                        className="w-full bg-transparent text-center font-semibold text-app-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                    />
                                    <button onClick={() => setTarget(target + 1)} className="px-2 hover:bg-app-surface text-app-text/60 transition-colors">+</button>
                                </div>
                            </div>
                        )}



                    </div>
                </div>

                {/* Center: Dices Grid */}
                <div className="bg-app-surface/60 p-5 rounded-2xl border border-app-border backdrop-blur-md shadow-xl flex flex-col items-center justify-center min-h-[160px]">
                    {['formula', 'fate', 'rolemaster', 'yze'].includes(mode) ? (
                        <button onClick={() => handleRoll(0, mode === 'formula')} className="px-8 py-4 bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 rounded-xl text-xl font-bold uppercase tracking-widest transition-transform active:scale-95">
                            LANCER
                        </button>
                    ) : (
                        <div className="grid grid-cols-4 lg:grid-cols-7 gap-4 w-full">
                            {diceTypes.map((sides) => (
                                <button
                                    key={sides}
                                    onClick={() => handleRoll(sides)}
                                    className="aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl bg-app-surface hover:bg-accent/90 text-app-text/70 hover:text-white border border-app-border/80 hover:border-accent transition-all duration-300 group relative overflow-hidden shadow-lg"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img src={`/icons/D${sides}b.png`} alt={`d${sides}`} className="w-10 h-10 object-contain relative z-10 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] invert dark:invert-0" />
                                    <span className="text-xs font-bold tracking-widest relative z-10 opacity-70 group-hover:opacity-100">d{sides}</span>
                                    {sides === 20 && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom: Quick Rolls Panel */}
                <div className="bg-app-surface/60 p-5 rounded-2xl border border-app-border backdrop-blur-md shadow-xl flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Zap className="text-amber-500" size={18} />
                            <h3 className="text-sm font-bold text-app-text/90 uppercase tracking-widest">Quick Rolls</h3>
                        </div>
                        {!isAddingQuickRoll && (
                            <button onClick={() => setIsAddingQuickRoll(true)} className="text-xs flex items-center gap-1 text-app-text/60 hover:text-accent transition-colors bg-app-surface px-3 py-1.5 rounded-lg border border-app-border">
                                <BookmarkPlus size={14} /> Ajouter
                            </button>
                        )}
                    </div>

                    {isAddingQuickRoll && (
                        <div className="flex items-center gap-3 mb-4 bg-app-bg p-3 rounded-xl border border-accent/30">
                            <input
                                type="text" placeholder="Nom (ex: Soin)" value={newQuickRollLabel} onChange={(e) => setNewQuickRollLabel(e.target.value)}
                                className="flex-1 bg-transparent border-b border-app-border focus:border-accent text-sm py-1 outline-none text-app-text"
                            />
                            <input
                                type="text" placeholder="Formule (ex: 2d8+3)" value={newQuickRollFormula} onChange={(e) => setNewQuickRollFormula(e.target.value)}
                                className="flex-1 bg-transparent border-b border-app-border focus:border-accent text-sm py-1 outline-none text-app-text"
                            />
                            <button onClick={addQuickRoll} className="px-4 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-semibold transition-colors">OK</button>
                            <button onClick={() => setIsAddingQuickRoll(false)} title="Annuler" className="px-2 py-1.5 text-app-text/60 hover:text-rose-500 transition-colors"><X size={16} /></button>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        {quickRolls.map(qr => (
                            <div key={qr.id} className="group flex items-center gap-px bg-app-bg/50 border border-app-border hover:border-accent/50 rounded-xl overflow-hidden transition-all shadow-md">
                                <button
                                    onClick={() => handleQuickRoll(qr.formula, qr.label)}
                                    className="px-4 py-2 hover:bg-app-surface transition-colors flex flex-col items-start"
                                >
                                    <span className="text-sm font-semibold text-app-text">{qr.label}</span>
                                    <span className="text-[10px] text-accent font-mono tracking-wider">{qr.formula}</span>
                                </button>
                                <button onClick={() => removeQuickRoll(qr.id)} title={`Supprimer ${qr.label}`} className="px-2 self-stretch hover:bg-rose-500/20 text-app-text/50 hover:text-rose-500 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {quickRolls.length === 0 && <p className="text-xs text-app-text/50 italic py-2">Aucun raccourci pour l'instant.</p>}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Results & History */}
            <div className="w-[400px] flex flex-col gap-6">

                {/* Tactical Advice Panel */}
                {tokens.length >= 2 && (
                    <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="text-accent" size={16} />
                            <h3 className="text-xs font-bold text-accent uppercase tracking-widest">Conseil Tactique</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="space-y-1">
                                <label className="text-[10px] text-app-text/40 uppercase">Attaquant</label>
                                <select 
                                    value={lastSelectedTokenId || ''} 
                                    onChange={e => setLastSelectedTokenId(e.target.value)}
                                    title="Attaquant"
                                    className="w-full bg-app-bg/50 border border-app-border rounded-lg text-xs py-1 px-2 outline-none"
                                >
                                    <option value="">Sélectionner...</option>
                                    {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-app-text/40 uppercase">Cible</label>
                                <select 
                                    value={targetTokenId || ''} 
                                    onChange={e => setTargetTokenId(e.target.value)}
                                    title="Cible"
                                    className="w-full bg-app-bg/50 border border-app-border rounded-lg text-xs py-1 px-2 outline-none"
                                >
                                    <option value="">Sélectionner...</option>
                                    {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {lastSelectedTokenId && targetTokenId && lastSelectedTokenId !== targetTokenId && (() => {
                            const tA = tokens.find(t => t.id === lastSelectedTokenId);
                            const tB = tokens.find(t => t.id === targetTokenId);
                            if (tA && tB) {
                                const range = tacticalService.getRangeInfo(tA, tB, gridSize, activeDriver?.tactical);
                                return (
                                    <div className="bg-app-bg/40 rounded-xl p-3 border border-accent/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-accent font-bold uppercase">{range.category}</span>
                                            <span className="text-xs text-app-text/80">{range.distanceUnits} cases ({Math.round(range.distancePx)}px)</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-app-text/40 uppercase">Modificateur</span>
                                            <button 
                                                onClick={() => setModifier(range.modifier)}
                                                className="text-sm font-black text-accent hover:text-accent/80 transition-colors bg-accent/10 px-2 py-0.5 rounded border border-accent/30 flex items-center gap-1"
                                            >
                                                {range.modifier > 0 ? '+' : ''}{range.modifier}
                                                <Zap size={10} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                        {!lastSelectedTokenId || !targetTokenId ? (
                            <div className="text-[10px] text-app-text/30 italic flex items-center gap-1.5 justify-center py-2 h-[42px]">
                                <Info size={12} /> Sélectionnez deux jetons pour voir le calcul de portée
                            </div>
                        ) : lastSelectedTokenId === targetTokenId ? (
                            <div className="text-[10px] text-rose-400/50 italic flex items-center gap-1.5 justify-center py-2 h-[42px]">
                                L'attaquant et la cible doivent être différents
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Latest Result */}
                <div className="min-h-[16rem] max-h-[50%] flex-shrink-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-app-surface/60 to-app-bg border border-accent/20 rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden shadow-2xl backdrop-blur-xl group/result">
                    
                    {/* Projection Controls Overlay */}
                    {history.length > 0 && (
                        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 opacity-0 group-hover/result:opacity-100 transition-opacity">
                            <button
                                onClick={handleToggleProjection}
                                title={isDiceProjected ? "Arrêter la projection" : "Projeter sur le Player Hub (5s)"}
                                className={`p-2 rounded-lg border transition-all ${
                                    isDiceProjected 
                                        ? 'bg-red-500/20 border-red-500/50 text-red-500 hover:bg-red-500/30' 
                                        : 'bg-accent/20 border-accent/50 text-accent hover:bg-accent/30'
                                }`}
                            >
                                {isDiceProjected ? <XCircle size={18} /> : <Cast size={18} />}
                            </button>
                        </div>
                    )}

                    {isDiceProjected && (
                        <div className="absolute top-4 left-4 z-40">
                             <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent/10 border border-accent/30 text-[9px] font-black text-accent uppercase tracking-widest animate-pulse">
                                <Cast size={10} /> Projection Active
                             </span>
                        </div>
                    )}
                    {history.length > 0 ? (
                        <>
                            <p className="text-app-text/70 font-medium mb-3 relative z-10 text-sm text-center line-clamp-2">{history[0].title}</p>
                            <div className={`font-black text-app-text mb-4 z-10 drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] text-center w-full px-2 break-words ${
                                history[0].totalDisplay.length > 12 ? 'text-3xl' : 
                                history[0].totalDisplay.length > 8 ? 'text-4xl' : 
                                'text-5xl'
                            }`}>
                                {history[0].totalDisplay}
                            </div>
                            {history[0].tagSuccess !== undefined && (
                                <div className={`px-4 py-1 mb-2 rounded-full text-xs font-bold uppercase tracking-widest z-10 shadow-lg ${history[0].tagSuccess ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/50'}`}>
                                    {history[0].tagSuccess ? 'Succès' : 'Échec'}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2 justify-center z-10 max-h-[8rem] w-full overflow-y-auto custom-scrollbar px-2 py-1">
                                {history[0].rolls.map((r, i) => (
                                    <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold shadow-inner ${r.cssClass ? r.cssClass + ' bg-app-bg border border-app-border' :
                                        r.isExploded ? 'bg-accent/30 text-accent-dark dark:text-accent-light border border-accent/50' :
                                            r.isCritMax ? 'bg-emerald-500/30 text-emerald-700 dark:text-emerald-100 border border-emerald-400/50' :
                                                r.isCritMin ? 'bg-rose-500/30 text-rose-700 dark:text-rose-100 border border-rose-400/50' :
                                                    'bg-app-surface border border-app-border text-app-text/80'
                                        }`}>
                                        {r.displayStr ? r.displayStr : r.val}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center opacity-50 relative z-10">
                            <Dices size={48} className="mx-auto mb-4 text-app-text/40" />
                            <p className="text-app-text/50 font-medium">En attente d'un lancer...</p>
                        </div>
                    )}
                </div>

                {/* History Log */}
                <div className="flex-1 bg-app-surface/60 border border-app-border rounded-2xl p-5 flex flex-col overflow-hidden backdrop-blur-md shadow-xl">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-app-border">
                        <h3 className="text-sm font-bold text-app-text/90 uppercase tracking-widest">Historique</h3>
                        <button
                            onClick={() => setHistory([])}
                            disabled={history.length === 0}
                            className="flex items-center gap-1.5 text-xs font-medium text-app-text/50 hover:text-app-text transition-colors disabled:opacity-30"
                        >
                            <RotateCcw size={12} /> Vider
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {history.map(record => (
                            <div key={record.id} className="flex flex-col gap-2 p-3 rounded-xl bg-app-bg/50 border border-app-border/50 hover:bg-app-bg transition-colors relative">
                                {record.batchId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/20 rounded-l-xl"></div>}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-app-text/50">{record.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    <span className="text-xs font-semibold text-accent max-w-[60%] truncate text-right">{record.title}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-1 max-w-[60%] items-center">
                                        {record.rolls.map((r, idx) => (
                                            <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center justify-center ${r.cssClass ? r.cssClass.replace('text-', 'bg-app-bg border border-') :
                                                r.isExploded ? 'bg-accent/20 text-accent' :
                                                    r.isCritMax ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                                        r.isCritMin ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                                                            'bg-app-surface text-app-text/60'
                                                }`}>
                                                {r.displayStr || r.val}
                                            </span>
                                        ))}
                                        {record.modifier !== 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold ml-1">
                                                {record.modifier > 0 ? '+' : ''}{record.modifier}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-lg font-black text-app-text">{record.totalDisplay}</span>
                                </div>
                                {record.tagSuccess !== undefined && (
                                    <div className={`mt-1 text-[10px] uppercase font-bold text-right ${record.tagSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {record.tagSuccess ? 'Succès' : 'Échec'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DiceBoard;
