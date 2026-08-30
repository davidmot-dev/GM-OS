import React, { useState, useCallback } from 'react';
import { EtiquetteDuDegre } from './EtiquetteDuDegre';
import { DiceEngine } from './DiceEngine';
import type { RollResult } from './DiceEngine';
import { Dices, RotateCcw, Zap, BookmarkPlus, X, Target, Settings, Info, XCircle, Cast } from 'lucide-react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useMapStore } from '../map/useMapStore';
import { tacticalService } from '../map/TacticalService';
import { useDiceStore } from '../../stores/useDiceStore';
import { useTranslation } from 'react-i18next';
import { getFateRankLabel, getDieCssClass } from './DiceUIUtils';
import { facesDuNiveau, poigneeDepuisLesLettres, type ModificateurDeDes } from './desEchelonnes';

const generateId = () => Math.random().toString(36).substring(7);

interface RollRecord extends RollResult {
    id: string;
    timestamp: Date;
    title: string;
    batchId?: string;
}

type DiceMode = 'standard' | 'formula' | 'pool' | 'pool_explode' | 'threshold' | 'advantage' | 'disadvantage' | 'exploding' | 'fate' | 'rolemaster' | 'yze' | 'yze-echelonne';

/**
 * Les niveaux que le pupitre propose, du meilleur au pire.
 *
 * L'échelle elle-même — A vaut D12, B vaut D10… — vit dans `desEchelonnes`, et
 * n'est transcrite nulle part ailleurs. Ici on ne nomme que **les lettres
 * saisissables**, et le dé affiché à côté vient de la table.
 */
const LETTRES_ECHELONNEES = ['A', 'B', 'C', 'D'] as const;

/**
 * **Les modes dont le dé est déjà décidé — ils reçoivent un bouton « Lancer ».**
 *
 * Les autres affichent la grille des faces (d4, d6, d20…), et c'est le clic sur
 * une face qui lance. Un mode absent de cette liste tombe donc dans la grille :
 * il propose de choisir un nombre de faces que son moteur ignore, et **il n'a
 * aucun bouton pour lancer**. C'est exactement ce qui est arrivé à
 * `yze-echelonne` le 2026-08-30 — signalé par David, une heure après avoir
 * signalé le même oubli un cran plus haut, dans la reconnaissance du moteur.
 *
 * *Une liste de noms recopiée à la main dérive le jour où un nom s'ajoute.*
 * Elle est nommée ici, une fois, plutôt qu'écrite dans le JSX — et elle répond
 * à une question qui lui est propre : **« ce mode a-t-il une face à choisir ? »**
 * Ce n'est pas celle de `DiceEngine.MOTEURS_A_RESOLUTION_PROPRE`, qui demande
 * si le moteur impose sa propre résolution ; les deux ensembles se croisent
 * sans se confondre — `formula` et `fate` sont ici et pas là-bas.
 */
const MODES_SANS_CHOIX_DE_FACES: readonly DiceMode[] = [
    'formula', 'fate', 'rolemaster', 'yze', 'yze-echelonne',
];

interface RemoteDiceOptions {
    sides?: number;
    die?: number;
    count?: number;
    modifier?: number;
    mode?: string;
    target?: number;
    gearCount?: number;
    title?: string;
}

const DiceBoard: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    // Tactical Bridge State
    const { tokens, gridSize } = useMapStore();
    const [lastSelectedTokenId, setLastSelectedTokenId] = useState<string | null>(null);
    const [targetTokenId, setTargetTokenId] = useState<string | null>(null);
    const { 
        isDiceProjected, 
        setIsDiceProjected, 
        triggerDiceProjection, 
        quickRolls, 
        addQuickRoll: storeAddQuickRoll, 
        removeQuickRoll: storeRemoveQuickRoll,
        history,
        setLastRoll,
        clearHistory,
        enable3D,
        setEnable3D
    } = useDiceStore();
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

    const [newQuickRollLabel, setNewQuickRollLabel] = useState('');
    const [newQuickRollFormula, setNewQuickRollFormula] = useState('');
    const [isAddingQuickRoll, setIsAddingQuickRoll] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

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

    /*
      **Les dés échelonnés au pupitre — David, 2026-08-30.**

      Le moteur savait les résoudre depuis le 29 ; c'est l'entrée qui manquait.
      Faute de fiche, `rollFromConfig` retombait sur une poignée de d6 — le plus
      petit dé de l'échelle, choisi exprès pour ne jamais *inventer* un dé plus
      gros. Prudent, et faux dès qu'on veut le vrai jet d'un PNJ.

      Le meneur nomme donc les deux niveaux lui-même. Les valeurs par défaut
      décrivent un personnage ordinaire — ni le meilleur, ni le pire.
    */
    const [niveauAttribut, setNiveauAttribut] = useState('B');
    const [niveauCompetence, setNiveauCompetence] = useState('C');
    /*
      L'équipement est **facultatif et échelonné lui aussi**. Le lui donner un
      compte de d6, comme le faisait le repli, referait exactement le défaut
      qu'on corrige : un dé d'arme trop petit, et personne pour le voir.
    */
    const [niveauEquipement, setNiveauEquipement] = useState('');
    const [modificateurEchelonne, setModificateurEchelonne] = useState<ModificateurDeDes>('aucun');

    /**
     * La poignée telle que le pupitre la lancera — modificateur et bornes du
     * livre compris. C'est la **même** composition que celle du panneau de
     * fiche : voir `composerLaPoignee`.
     */
    const poigneeEchelonnee = React.useMemo(
        () => poigneeDepuisLesLettres(
            [
                { label: 'Attribut', lettre: niveauAttribut },
                { label: 'Compétence', lettre: niveauCompetence },
            ],
            modificateurEchelonne,
        ),
        [niveauAttribut, niveauCompetence, modificateurEchelonne],
    );

    const facesDeLEquipement = facesDuNiveau(niveauEquipement);

    // Auto-sync with active system driver
    React.useEffect(() => {
        if (activeDriver) {
            setUseSystemDriver(true);
            
            // Map engine to local mode
            const engine = activeDriver.dice.engine as string | undefined;
            
            if (engine === 'yze-echelonne') {
                /*
                  **La variante à dés échelonnés n'était reconnue nulle part
                  ici.** Elle tombait dans le `else`, n'y trouvait aucun nom
                  connu et finissait en `standard` : le bandeau annonçait
                  « Système : Blade Runner » au-dessus des réglages d'un d20.
                  Le jet, lui, partait bien vers le bon moteur — *l'écran
                  mentait, le résultat était juste, et les deux étaient
                  invérifiables l'un par l'autre.*
                */
                setMode('yze-echelonne');
            } else if (engine === 'yze' || engine === 'year-zero') {
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

    const executeRoll = useCallback((sides: number = 20, isFormulaText: boolean = false, customFormula: string = "", remoteOverrides?: RemoteDiceOptions) => {
        let result: RollResult;
        
        // Paramètres finaux (priorité aux overrides distants, puis à l'UI locale)
        const finalCount = (remoteOverrides?.count !== undefined) ? remoteOverrides.count : diceCount;
        const finalModifier = (remoteOverrides?.modifier !== undefined) ? remoteOverrides.modifier : modifier;
        const finalMode = (remoteOverrides?.mode as DiceMode) ?? mode;
        const finalTarget = (remoteOverrides?.target !== undefined) ? remoteOverrides.target : target;
        const finalGearCount = (remoteOverrides?.gearCount !== undefined) ? remoteOverrides.gearCount : gearCount;

        if (useSystemDriver && activeDriver && !remoteOverrides) {
            const modVal = typeof finalModifier === 'string' ? (parseInt(finalModifier.replace('+', ''), 10) || 0) : finalModifier;
            // Le sens du comptage vit sur `jet`, pas sur `dice` : sans ce
            // passage, une réserve « sous le seuil » se résolvait à l'envers.
            /*
              **Les tailles, quand le jeu en a.** Sans elles, la branche
              `yze-echelonne` du moteur retombe sur des d6 — un repli voulu pour
              ne jamais inventer un dé plus gros, mais qui rendait le pupitre
              inutilisable sur Blade Runner : le meneur y lançait toujours la
              poignée d'un débutant.
            */
            const echelonne = activeDriver.dice.engine === 'yze-echelonne';
            result = DiceEngine.rollFromConfig(
                { ...activeDriver.dice, ...(activeDriver.jet?.sens ? { sens: activeDriver.jet.sens } : {}) },
                {
                    modifier: modVal,
                    baseCount: finalCount,
                    gearCount: finalGearCount,
                    targetOverwrite: finalTarget,
                    ...(echelonne ? {
                        taillesDeBase: poigneeEchelonnee.des.map(d => d.faces),
                        taillesSecondaires: facesDeLEquipement !== null ? [facesDeLEquipement] : [],
                    } : {}),
                },
            );
            return { result, title: t('dice.results.system', { name: activeDriver.name }) };
        }

        let title = remoteOverrides?.title || `${finalCount}d${sides}`;
        const modVal = typeof finalModifier === 'string' ? (parseInt(finalModifier.replace('+', ''), 10) || 0) : finalModifier;

        if (isFormulaText) {
            const formObj = customFormula || formulaInput;
            result = DiceEngine.rollFormula(formObj);
            title = t('dice.results.formula', { formula: formObj });
        } else {
            switch (finalMode) {
                case 'standard':
                    result = DiceEngine.rollStandard(sides, finalCount, modVal, false);
                    break;
                case 'exploding':
                    result = DiceEngine.rollStandard(sides, finalCount, modVal, true);
                    title = t('dice.results.exploding', { count: finalCount, sides });
                    break;
                /*
                  **Le sélecteur ≥ / ≤ était affiché et ignoré**, relevé par
                  David le 2026-08-16 : « lorsque je choisis Pool de Dés
                  (Succès), il ne tient pas compte du signe ». Les réserves
                  comptaient toujours AU-DESSUS du seuil, quel que soit le
                  réglage — un 19 passait pour une réussite sous un seuil de 15.

                  Le moteur savait faire depuis le 2026-08-10 : `rollPool` prend
                  un `sens`, et `threshold`, `advantage` et `disadvantage` le lui
                  passaient déjà. Les deux modes de réserve, non. *Le chemin
                  s'arrêtait avant le moteur* — le même geste manquant que les
                  dés de stress d'Alien.

                  Un jet résolu à l'envers ne se voit jamais en séance : il rend
                  des réussites plausibles, simplement inverses.
                */
                case 'pool':
                    result = DiceEngine.rollPool(sides, finalCount, modVal, finalTarget, false, { sens: targetRule });
                    title = t('dice.results.pool', { count: finalCount, sides, target: finalTarget });
                    break;
                case 'pool_explode':
                    result = DiceEngine.rollPool(sides, finalCount, modVal, finalTarget, true, { sens: targetRule });
                    title = t('dice.results.pool_explode', { count: finalCount, sides, target: finalTarget });
                    break;
                case 'threshold':
                    result = DiceEngine.rollThreshold(sides, finalCount, modVal, finalTarget, targetRule);
                    const ruleSym = targetRule === 'over' ? '≥' : '≤';
                    title = t('dice.results.threshold', { count: finalCount, sides, rule: ruleSym, target: finalTarget });
                    break;
                case 'advantage':
                    result = DiceEngine.rollAdvantage(sides, modVal, true, finalTarget, targetRule);
                    title = t('dice.results.advantage', { sides });
                    break;
                case 'disadvantage':
                    result = DiceEngine.rollAdvantage(sides, modVal, false, finalTarget, targetRule);
                    title = t('dice.results.disadvantage', { sides });
                    break;
                case 'fate':
                    result = DiceEngine.rollFate(finalCount, modVal);
                    title = t('dice.results.fate', { count: finalCount });
                    break;
                case 'rolemaster':
                    result = DiceEngine.rollRolemaster(modVal);
                    title = t('dice.results.rolemaster');
                    break;
                case 'yze':
                    result = DiceEngine.rollYZE(finalCount, finalGearCount);
                    title = t('dice.results.yze', { base: finalCount, gear: finalGearCount });
                    break;
                /*
                  Le même jet **sans pilote actif** : le meneur choisit le mode
                  à la main pour un PNJ improvisé. Rien n'oblige à avoir ouvert
                  une campagne Blade Runner pour lancer deux dés échelonnés.
                */
                case 'yze-echelonne':
                    result = DiceEngine.rollYZEEchelonne(
                        poigneeEchelonnee.des.map(d => d.faces),
                        facesDeLEquipement !== null ? [facesDeLEquipement] : [],
                    );
                    title = poigneeEchelonnee.des.map(d => `D${d.faces}`).join(' + ')
                        + (facesDeLEquipement !== null ? ` + D${facesDeLEquipement}` : '');
                    break;
                default:
                    result = DiceEngine.rollStandard(sides, finalCount, modVal);
            }
        }
        return { result, title };
    }, [useSystemDriver, activeDriver, modifier, diceCount, gearCount, target, formulaInput, mode, targetRule,
        // Sans elles, un changement de niveau ne serait pas relu : le pupitre
        // lancerait la poignée d'avant, et le résultat resterait plausible.
        poigneeEchelonnee, facesDeLEquipement]);

    const handleRoll = useCallback((sides: number = 20, isFormulaText: boolean = false, customFormula: string = "", remoteOverrides?: RemoteDiceOptions) => {
        try {
            const batchId = batchCount > 1 ? generateId() : undefined;
            const newRecords: RollRecord[] = [];
            
            for (let i = 0; i < batchCount; i++) {
                const { result, title } = executeRoll(sides, isFormulaText, customFormula, remoteOverrides);

                let repTitle = title;
                if (batchCount > 1) repTitle = t('dice.results.batch', { title, current: i + 1, total: batchCount });

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
        } catch (error) {
            console.error("Erreur de lancer:", error);
        }
    }, [batchCount, executeRoll, isDiceProjected, triggerDiceProjection, setLastRoll]);

    const handleQuickRoll = (formula: string, label: string) => {
        handleRoll(0, true, formula, { mode: 'formula', title: label });
    };

    const addQuickRoll = () => {
        if (newQuickRollLabel && newQuickRollFormula) {
            storeAddQuickRoll(newQuickRollLabel, newQuickRollFormula);
            setIsAddingQuickRoll(false);
            setNewQuickRollLabel('');
            setNewQuickRollFormula('');
        }
    };

    const removeQuickRoll = (id: string) => {
        storeRemoveQuickRoll(id);
    };

    // --- Remote Control Listeners removed: handled globally in App.tsx now ---

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
                                    {t('dice.system_mode', { name: activeDriver.name.toUpperCase() })}
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-1.5 rounded-lg transition-all border ${showSettings ? 'bg-accent text-white border-accent' : 'bg-app-bg text-app-text/40 border-app-border hover:border-app-border/80'}`}
                            >
                                <Settings size={14} />
                            </button>
                            <button onClick={resetConfig} title={t('dice.reset')} className="text-xs flex items-center gap-1.5 text-app-text/60 hover:text-accent transition-colors bg-app-bg px-3 py-1.5 rounded-lg border border-app-border/80 text-nowrap">
                                <RotateCcw size={14} /> {t('dice.reset')}
                            </button>
                        </div>
                    </div>

                    {showSettings && (
                        <div className="mb-6 p-4 rounded-xl bg-app-bg/40 border border-app-border animate-in fade-in slide-in-from-top-2">
                             <h4 className="text-[10px] font-black text-app-text/40 uppercase tracking-widest mb-3">{t('dice.settings.title')}</h4>
                             <div className="flex flex-wrap gap-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            checked={enable3D} 
                                            onChange={e => setEnable3D(e.target.checked)} 
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-app-surface border border-app-border rounded-full peer peer-checked:bg-emerald-500/20 peer-checked:border-emerald-500/50 transition-all"></div>
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-app-text/20 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-emerald-500 shadow-sm"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-app-text/80 group-hover:text-app-text">{t('dice.settings.enable_3d')}</span>
                                        <span className="text-[9px] text-app-text/40">{t('dice.settings.enable_3d_desc')}</span>
                                    </div>
                                </label>
                             </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">{t('dice.inputs.mode')}</label>
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as DiceMode)}
                                title={t('dice.inputs.mode')}
                                aria-label={t('dice.inputs.mode')}
                                className="w-full bg-app-bg border border-app-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-app-text"
                            >
                                <option value="standard">{t('dice.modes.standard')}</option>
                                <option value="exploding">{t('dice.modes.exploding')}</option>
                                <option value="formula">{t('dice.modes.formula')}</option>
                                <option value="threshold">{t('dice.modes.threshold')}</option>
                                <option value="pool">{t('dice.modes.pool')}</option>
                                <option value="pool_explode">{t('dice.modes.pool_explode')}</option>
                                <option value="advantage">{t('dice.modes.advantage')}</option>
                                <option value="disadvantage">{t('dice.modes.disadvantage')}</option>
                                <option value="yze">{t('dice.modes.yze')}</option>
                                <option value="yze-echelonne">Year Zero — dés échelonnés</option>
                                <option value="fate">{t('dice.modes.fate')}</option>
                                <option value="rolemaster">{t('dice.modes.rolemaster')}</option>
                            </select>
                        </div>

                        {mode === 'formula' ? (
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">{t('dice.inputs.formula_label')}</label>
                                <div className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/50 h-[38px]">
                                    <input
                                        type="text" value={formulaInput} onChange={e => setFormulaInput(e.target.value)}
                                        className="w-full bg-transparent px-4 py-2 font-mono text-sm text-app-text outline-none"
                                        placeholder={t('dice.inputs.formula_placeholder')}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Qty & Mod */}
                                {mode === 'yze-echelonne' ? (
                                    /*
                                      **Le meneur nomme les niveaux ; l'échelle
                                      reste dans `desEchelonnes`.** Le dé écrit
                                      à côté de chaque lettre vient de la table
                                      et n'est jamais saisi — une fiche où
                                      quelqu'un a tapé « B (D8) » est corrigée
                                      au passage plutôt que propagée.
                                    */
                                    <div className="space-y-2 col-span-3">
                                        <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">
                                            Attribut / Compétence / Équipement
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {([
                                                { cle: 'attribut', titre: 'Attribut', valeur: niveauAttribut, poser: setNiveauAttribut, facultatif: false },
                                                { cle: 'competence', titre: 'Compétence', valeur: niveauCompetence, poser: setNiveauCompetence, facultatif: false },
                                                { cle: 'equipement', titre: 'Équipement', valeur: niveauEquipement, poser: setNiveauEquipement, facultatif: true },
                                            ] as const).map(({ cle, titre, valeur, poser, facultatif }) => (
                                                <div key={cle} className="flex flex-1 min-w-[8rem] bg-app-bg border border-app-border rounded-xl overflow-hidden shadow-inner h-[38px]">
                                                    <span className="bg-app-surface text-app-text/60 text-[10px] px-2 flex items-center border-r border-app-border uppercase tracking-wider">
                                                        {titre}
                                                    </span>
                                                    <select
                                                        value={valeur}
                                                        onChange={(e) => poser(e.target.value)}
                                                        title={titre}
                                                        aria-label={titre}
                                                        className="w-full bg-transparent text-center font-semibold text-app-text outline-none text-sm"
                                                    >
                                                        {facultatif && <option value="">—</option>}
                                                        {LETTRES_ECHELONNEES.map(lettre => (
                                                            <option key={lettre} value={lettre}>
                                                                {lettre} (D{facesDuNiveau(lettre)})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            {([
                                                { cle: 'aucun', titre: 'Normal' },
                                                { cle: 'avantage', titre: 'Avantage' },
                                                { cle: 'desavantage', titre: 'Désavantage' },
                                            ] as const).map(({ cle, titre }) => (
                                                <button
                                                    key={cle}
                                                    onClick={() => setModificateurEchelonne(cle)}
                                                    aria-pressed={modificateurEchelonne === cle}
                                                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${modificateurEchelonne === cle
                                                        ? 'bg-accent/20 border-accent/60 text-accent'
                                                        : 'bg-app-bg border-app-border text-app-text/50 hover:text-app-text'}`}
                                                >
                                                    {titre}
                                                </button>
                                            ))}

                                            <span className="text-[11px] font-mono text-app-text/60 ml-auto">
                                                {poigneeEchelonnee.des.map(d => `D${d.faces}`).join(' + ') || '—'}
                                                {facesDeLEquipement !== null && ` + D${facesDeLEquipement}`}
                                            </span>
                                        </div>

                                        {/*
                                          *Une correction muette est une règle
                                          perdue.* Le livre plafonne à deux D12
                                          et un désavantage ne vide jamais la
                                          poignée : quand la composition corrige
                                          quelque chose, elle le dit.
                                        */}
                                        {poigneeEchelonnee.remarques.map((remarque, i) => (
                                            <p key={i} className="text-[10px] italic text-amber-500/80">{remarque}</p>
                                        ))}
                                    </div>
                                ) : mode === 'yze' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">{t('dice.inputs.base_dice')} / {t('dice.inputs.gear_dice')}</label>
                                        <div className="flex space-x-2">
                                            <div className="flex flex-1 bg-app-bg border border-app-border rounded-xl overflow-hidden shadow-inner h-[38px]">
                                                <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-xs px-2 flex items-center border-r border-app-border">B</span>
                                                <input 
                                                    type="number" 
                                                    value={diceCount} 
                                                    onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                    title={t('dice.inputs.base_dice')}
                                                    aria-label={t('dice.inputs.base_dice')}
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
                                                    title={t('dice.inputs.gear_dice')}
                                                    aria-label={t('dice.inputs.gear_dice')}
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
                                        <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">{t('dice.inputs.qty')}</label>
                                        <div className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden h-[38px]">
                                            <button onClick={() => setDiceCount(Math.max(1, diceCount - 1))} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">-</button>
                                            <input 
                                                type="number" 
                                                value={diceCount} 
                                                onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))} 
                                                title={t('dice.inputs.qty')}
                                                aria-label={t('dice.inputs.qty')}
                                                className="w-full bg-transparent text-center font-semibold text-app-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                            />
                                            <button onClick={() => setDiceCount(diceCount + 1)} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">+</button>
                                        </div>
                                    </div>
                                )}

                                <div className={`space-y-2 ${['yze'].includes(mode) ? 'hidden' : ''}`}>
                                    <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">{t('dice.inputs.mod')}</label>
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
                                            title={t('dice.inputs.mod')}
                                            aria-label={t('dice.inputs.mod')}
                                            className="w-full bg-transparent text-center font-semibold text-app-text outline-none" 
                                        />
                                        <button onClick={() => setModifier((typeof modifier === 'number' ? modifier : parseInt(modifier.toString().replace('+', '')) || 0) + 1)} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">+</button>
                                    </div>
                                </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">{t('dice.inputs.repeat')}</label>
                                        <div className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden h-[38px]">
                                            <button onClick={() => setBatchCount(Math.max(1, batchCount - 1))} className="px-3 hover:bg-app-surface text-app-text/60 transition-colors">-</button>
                                            <input 
                                                type="number" 
                                                value={batchCount} 
                                                onChange={(e) => setBatchCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                                                title={t('dice.inputs.repeat')}
                                                aria-label={t('dice.inputs.repeat')}
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
                                <label className="text-xs font-semibold text-app-text/60 uppercase tracking-widest">{t('dice.inputs.threshold_rule')}</label>
                                <div className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden h-[38px]">
                                    <select 
                                        value={targetRule} 
                                        onChange={e => setTargetRule(e.target.value as 'over' | 'under')} 
                                        title={t('dice.inputs.threshold_rule')}
                                        aria-label={t('dice.inputs.threshold_rule')}
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
                                        title={t('dice.inputs.threshold_rule')}
                                        aria-label={t('dice.inputs.threshold_rule')}
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
                    {MODES_SANS_CHOIX_DE_FACES.includes(mode) ? (
                        <button onClick={() => handleRoll(0, mode === 'formula')} className="px-8 py-4 bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 rounded-xl text-xl font-bold uppercase tracking-widest transition-transform active:scale-95">
                            {t('dice.actions.roll')}
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
                            <h3 className="text-sm font-bold text-app-text/90 uppercase tracking-widest">{t('dice.quick_rolls.title')}</h3>
                        </div>
                        {!isAddingQuickRoll && (
                            <button onClick={() => setIsAddingQuickRoll(true)} className="text-xs flex items-center gap-1 text-app-text/60 hover:text-accent transition-colors bg-app-surface px-3 py-1.5 rounded-lg border border-app-border">
                                <BookmarkPlus size={14} /> {t('dice.actions.add_quick')}
                            </button>
                        )}
                    </div>

                    {isAddingQuickRoll && (
                        <div className="flex items-center gap-3 mb-4 bg-app-bg p-3 rounded-xl border border-accent/30">
                            <input
                                type="text" placeholder={t('dice.quick_rolls.placeholder_name')} value={newQuickRollLabel} onChange={(e) => setNewQuickRollLabel(e.target.value)}
                                className="flex-1 bg-transparent border-b border-app-border focus:border-accent text-sm py-1 outline-none text-app-text"
                            />
                            <input
                                type="text" placeholder={t('dice.quick_rolls.placeholder_formula')} value={newQuickRollFormula} onChange={(e) => setNewQuickRollFormula(e.target.value)}
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
                                    onClick={() => handleQuickRoll(qr.formula, t(qr.label))}
                                    className="px-4 py-2 hover:bg-app-surface transition-colors flex flex-col items-start"
                                >
                                    <span className="text-sm font-semibold text-app-text">{t(qr.label)}</span>
                                    <span className="text-[10px] text-accent font-mono tracking-wider">{qr.formula}</span>
                                </button>
                                <button onClick={() => removeQuickRoll(qr.id)} title={t('common:actions.delete') + " " + t(qr.label)} className="px-2 self-stretch hover:bg-rose-500/20 text-app-text/50 hover:text-rose-500 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {quickRolls.length === 0 && <p className="text-xs text-app-text/50 italic py-2">{t('dice.quick_rolls.empty')}</p>}
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
                            <h3 className="text-xs font-bold text-accent uppercase tracking-widest">{t('dice.tactical.title')}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="space-y-1">
                                <label className="text-[10px] text-app-text/40 uppercase">{t('dice.tactical.attacker')}</label>
                                <select 
                                    value={lastSelectedTokenId || ''} 
                                    onChange={e => setLastSelectedTokenId(e.target.value)}
                                    title={t('dice.tactical.attacker')}
                                    className="w-full bg-app-bg/50 border border-app-border rounded-lg text-xs py-1 px-2 outline-none"
                                >
                                    <option value="">{t('common:actions.select')}...</option>
                                    {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-app-text/40 uppercase">{t('dice.tactical.target')}</label>
                                <select 
                                    value={targetTokenId || ''} 
                                    onChange={e => setTargetTokenId(e.target.value)}
                                    title={t('dice.tactical.target')}
                                    className="w-full bg-app-bg/50 border border-app-border rounded-lg text-xs py-1 px-2 outline-none"
                                >
                                    <option value="">{t('common:actions.select')}...</option>
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
                                            <span className="text-[10px] text-accent font-bold uppercase">{t('dice.tactical.range_category', { category: range.category })}</span>
                                            <span className="text-xs text-app-text/80">{t('dice.tactical.distance', { units: range.distanceUnits, px: Math.round(range.distancePx) })}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-app-text/40 uppercase">{t('dice.inputs.mod')}</span>
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
                                <Info size={12} /> {t('dice.tactical.hint')}
                            </div>
                        ) : lastSelectedTokenId === targetTokenId ? (
                            <div className="text-[10px] text-rose-400/50 italic flex items-center gap-1.5 justify-center py-2 h-[42px]">
                                {t('dice.tactical.error_same')}
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
                                title={isDiceProjected ? t('dice.status.project_stop') : t('dice.status.project_start')}
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
                                <Cast size={10} /> {t('dice.status.projected')}
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
                            {history[0].fateRank !== undefined && (
                                <div className="text-xs text-accent font-bold uppercase tracking-wider mb-2 z-10">
                                    {getFateRankLabel(history[0].fateRank, t)}
                                </div>
                            )}
                            <EtiquetteDuDegre
                                resultat={history[0]}
                                classes={reussi => 'px-4 py-1 mb-2 rounded-full text-xs font-bold uppercase tracking-widest z-10 shadow-lg '
                                    + (reussi
                                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50'
                                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/50')}
                            />
                            <div className="flex flex-wrap gap-2 mt-2 justify-center z-10 max-h-[8rem] w-full overflow-y-auto custom-scrollbar px-2 py-1">
                                {history[0].rolls.map((r, i) => (
                                    <span key={i} className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg text-xs font-black shadow-inner relative group ${getDieCssClass(r)}`}>
                                        {r.displayStr ? r.displayStr : r.val}
                                        {r.source === 'gear' && <span className="absolute bottom-0 right-1 text-[8px] opacity-40 font-bold uppercase">G</span>}
                                        {r.source === 'base' && <span className="absolute bottom-0 right-1 text-[8px] opacity-40 font-bold uppercase">B</span>}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center opacity-50 relative z-10">
                            <Dices size={48} className="mx-auto mb-4 text-app-text/40" />
                            <p className="text-app-text/50 font-medium">{t('dice.status.waiting')}</p>
                        </div>
                    )}
                </div>

                {/* History Log */}
                <div className="flex-1 bg-app-surface/60 border border-app-border rounded-2xl p-5 flex flex-col overflow-hidden backdrop-blur-md shadow-xl">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-app-border">
                        <h3 className="text-sm font-bold text-app-text/90 uppercase tracking-widest">{t('dice.history.title')}</h3>
                        <button
                            onClick={clearHistory}
                            disabled={history.length === 0}
                            className="flex items-center gap-1.5 text-xs font-medium text-app-text/50 hover:text-app-text transition-colors disabled:opacity-30"
                        >
                            <RotateCcw size={12} /> {t('dice.actions.clear')}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {history.map(record => (
                            <div key={record.id} className="flex flex-col gap-2 p-3 rounded-xl bg-app-bg/50 border border-app-border/50 hover:bg-app-bg transition-colors relative">
                                {record.batchId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/20 rounded-l-xl"></div>}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-app-text/50">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    <span className="text-xs font-semibold text-accent max-w-[60%] truncate text-right">{record.title}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-1 max-w-[60%] items-center">
                                        {record.rolls.map((r, idx) => (
                                            <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center justify-center font-bold ${getDieCssClass(r)}`}>
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
                                <EtiquetteDuDegre
                                    resultat={record}
                                    classes={reussi => 'mt-1 text-[10px] uppercase font-bold text-right '
                                        + (reussi ? 'text-emerald-500' : 'text-rose-500')}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DiceBoard;
