import React, { useState, useEffect, useRef } from 'react';
import { Bouton } from '../../../components/socle/Bouton';
import { Panneau } from '../../../components/socle/Panneau';
import { Minus, Plus, RotateCcw, Dices, Info, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { type DiceConfig } from '../../../types/drivers';
import {
    facesDuNiveau, poigneeDepuisLesLettres, type ModificateurDeDes,
} from '../../dice/desEchelonnes';

/** Les niveaux d'un jeu échelonné, du meilleur dé au plus petit. */
const LETTRES_ECHELONNEES = ['A', 'B', 'C', 'D'] as const;

interface RemoteDicePadProps {
    activeDiceConfig?: DiceConfig | null;
    /**
     * Ce jeu lance-t-il des **dés échelonnés** ? La réponse vient du meneur —
     * elle ne se déduit pas de `activeDiceConfig.engine`, qu'un pilote peut
     * contredire. Voir `useNexusSynchronizer`.
     */
    desEchelonnes?: boolean;
    onRoll: (params: { 
        sides?: number; 
        count: number; 
        modifier: number; 
        mode: string; 
        target?: number;
        useSystem?: boolean;
        gearCount?: number;
        title?: string;
        formula?: string;
        /** Les lettres choisies par le joueur — un dé de base chacune. */
        niveauxEchelonnes?: { label: string; lettre: string }[];
        /** Le dé d'équipement, compté à part : ses 1 usent le matériel. */
        equipementEchelonne?: string;
        modificateurEchelonne?: ModificateurDeDes;
    }) => void;
    onClear: () => void;
}

const DICE_MODES = [
    { id: 'standard', label: 'Standard d20/d6' },
    { id: 'exploding', label: 'Somme Explosive' },
    { id: 'formula', label: 'Formule Libre' },
    { id: 'threshold', label: 'Jet de Seuil (Target)' },
    { id: 'pool', label: 'Pool de Dés (Succès)' },
    { id: 'pool_explode', label: 'Pool Explosif' },
    { id: 'advantage', label: 'Avantage (Garde Meilleur)' },
    { id: 'disadvantage', label: 'Désavantage (Garde Pire)' },
    { id: 'yze', label: 'Year Zero Engine' },
    { id: 'fate', label: 'FATE / Fudge' },
    { id: 'rolemaster', label: 'Rolemaster' },
];

const RemoteDicePad: React.FC<RemoteDicePadProps> = ({ activeDiceConfig, desEchelonnes, onRoll, onClear }) => {
    const [diceCount, setDiceCount] = useState(1);
    const [diceModifier, setDiceModifier] = useState(0);
    const [diceMode, setDiceMode] = useState<string>('standard');
    const [isManualMode, setIsManualMode] = useState(false);
    const [prevSystemEngine, setPrevSystemEngine] = useState<string | undefined>(activeDiceConfig?.engine);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const modeMenuRef = useRef<HTMLDivElement>(null);
    const [threshold, setThreshold] = useState(activeDiceConfig?.successThreshold || 10);
    const [diceFormula, setDiceFormula] = useState('');

    /*
      **Les dés échelonnés sur la tablette — demandé par David le 2026-09-03**,
      dans la foulée du même défaut au pupitre du meneur.

      Le joueur nomme ses deux niveaux, comme le meneur nomme ceux d'un PNJ : il
      les lit sur sa fiche, et **l'échelle reste dans `desEchelonnes.ts`** — le
      dé écrit à côté de chaque lettre vient de la table et n'est jamais saisi.

      *La composition qui fait foi se refait chez le meneur* : c'est lui qui
      résout, et deux compositions pour un même jet finiraient par ne plus
      s'accorder. Ici, on ne calcule que ce qui s'affiche.
    */
    const [niveauAttribut, setNiveauAttribut] = useState('B');
    const [niveauCompetence, setNiveauCompetence] = useState('C');
    const [niveauEquipement, setNiveauEquipement] = useState('');
    const [modificateurEchelonne, setModificateurEchelonne] = useState<ModificateurDeDes>('aucun');

    /** Le jet en cours est-il échelonné ? Le mode manuel reprend la main dessus. */
    const estEchelonne = !!desEchelonnes && !isManualMode;

    const poigneeEchelonnee = poigneeDepuisLesLettres(
        [
            { label: 'Attribut', lettre: niveauAttribut },
            { label: 'Compétence', lettre: niveauCompetence },
        ],
        modificateurEchelonne,
    );
    const facesDeLEquipement = facesDuNiveau(niveauEquipement);

    /** La poignée telle qu'elle se lit — le même libellé qu'au pupitre. */
    const libelleDeLaPoignee = poigneeEchelonnee.des.map(d => `D${d.faces}`).join(' + ')
        + (facesDeLEquipement !== null ? ` + D${facesDeLEquipement}` : '');

    // Sync mode with system when the campaign/driver changes
    if (activeDiceConfig?.engine !== prevSystemEngine && !isManualMode) {
        setPrevSystemEngine(activeDiceConfig?.engine);
        const systemMode = activeDiceConfig?.engine?.toLowerCase();
        if (systemMode) {
            const supportedMode = DICE_MODES.find(m => m.id === systemMode || (systemMode === 'year-zero' && m.id === 'yze'));
            if (supportedMode && supportedMode.id !== diceMode) {
                setDiceMode(supportedMode.id);
            }
        }
    }

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const haptic = (pattern: number | number[] = 50) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };

    const handleRollClick = (params: Parameters<typeof onRoll>[0]) => {
        haptic([40, 20, 40]);
        onRoll(params);
    };

    const diceTypes = [4, 6, 8, 10, 12, 20, 100];

    const handleSystemRoll = () => {
        if (!activeDiceConfig) return;
        const modeId = isManualMode ? diceMode : (activeDiceConfig.engine || 'standard');
        /*
          **On envoie les lettres, pas les faces.** L'échelle appartient au jeu,
          donc au meneur : c'est chez lui qu'elle est transcrite, et c'est lui
          qui applique l'avantage puis le plafond du livre. Une tablette qui
          enverrait « 12 » imposerait sa lecture de la règle.
        */
        const echelonne = estEchelonne ? {
            niveauxEchelonnes: [
                { label: 'Attribut', lettre: niveauAttribut },
                { label: 'Compétence', lettre: niveauCompetence },
            ],
            equipementEchelonne: niveauEquipement || undefined,
            modificateurEchelonne,
        } : {};
        onRoll({
            count: diceCount,
            gearCount: threshold,
            modifier: diceModifier,
            mode: estEchelonne ? 'yze-echelonne' : modeId,
            target: threshold,
            useSystem: !isManualMode,
            ...echelonne,
            title: isManualMode
                ? `Jet Manuel (${DICE_MODES.find(m => m.id === diceMode)?.label})`
                : estEchelonne
                ? `Jet Système (${libelleDeLaPoignee})`
                : `Jet Système (${activeDiceConfig.engine || 'Standard'})`
        });
    };

    const currentModeLabel = DICE_MODES.find(m => m.id === diceMode)?.label || 'Standard';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* System Info & Active Config */}
            {activeDiceConfig && (
                <Panneau as="div" habillage="libre" className="flex items-center gap-3 p-4 premium-glass rounded-3xl border-accent/20 bg-accent/5">
                    <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-glow-accent/10">
                        <Dices size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-ui-10 font-black uppercase text-accent tracking-tighter">Système Actif</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-app-text uppercase">{activeDiceConfig.engine || 'Standard'}</span>
                            {isManualMode ? (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-etat-alerte/10 border border-etat-alerte/20">
                                    <AlertCircle size={8} className="text-etat-alerte" />
                                    <span className="text-ui-8 font-black text-etat-alerte uppercase tracking-tighter">Manuel</span>
                                </div>
                            ) : (
                                <span className="text-ui-10 text-app-muted">({activeDiceConfig.logic})</span>
                            )}
                        </div>
                    </div>
                    <Bouton habillage="libre" cibleTactile
                        onClick={handleSystemRoll}
                        className="ml-auto px-6 py-3 bg-accent text-app-on-accent text-xs font-black uppercase rounded-2xl shadow-glow-accent active:scale-95 transition-all"
                    >
                        Lancer Système
                    </Bouton>
                </Panneau>
            )}

            {/*
              **Les niveaux, quand le jeu lance des dés échelonnés.**

              Ce bloc remplace la quantité et le seuil, qui n'ont aucun sens ici :
              on ne lance pas *un nombre* de dés, on lance **deux dés de tailles
              différentes**. Le joueur règle, puis touche « Lancer Système ».
            */}
            {estEchelonne && (
                <Panneau as="div" habillage="libre" className="flex flex-col gap-3 p-5 premium-glass rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <span className="text-ui-10 font-black uppercase text-app-muted tracking-widest pl-1">
                        Attribut / Compétence / Équipement
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                        {([
                            { cle: 'attribut', titre: 'Attribut', valeur: niveauAttribut, poser: setNiveauAttribut, facultatif: false },
                            { cle: 'competence', titre: 'Compétence', valeur: niveauCompetence, poser: setNiveauCompetence, facultatif: false },
                            { cle: 'equipement', titre: 'Équip.', valeur: niveauEquipement, poser: setNiveauEquipement, facultatif: true },
                        ] as const).map(({ cle, titre, valeur, poser, facultatif }) => (
                            <div key={cle} className="flex flex-col gap-1">
                                <span className="text-ui-9 font-black uppercase text-app-muted tracking-tighter pl-1">{titre}</span>
                                <select
                                    value={valeur}
                                    onChange={(e) => poser(e.target.value)}
                                    title={titre}
                                    aria-label={titre}
                                    className="bg-app-text/5 border border-app-text/10 p-3 rounded-2xl text-lg font-black text-accent outline-none focus:border-accent/50 transition-all"
                                >
                                    {facultatif && <option value="">—</option>}
                                    {LETTRES_ECHELONNEES.map(lettre => (
                                        <option key={lettre} value={lettre}>{lettre} (D{facesDuNiveau(lettre)})</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {([
                            { cle: 'aucun', titre: 'Normal' },
                            { cle: 'avantage', titre: 'Avantage' },
                            { cle: 'desavantage', titre: 'Désavantage' },
                        ] as const).map(({ cle, titre }) => (
                            <Bouton habillage="libre" cibleTactile
                                key={cle}
                                onClick={() => { haptic(10); setModificateurEchelonne(cle); }}
                                aria-pressed={modificateurEchelonne === cle}
                                className={`flex-1 px-2 py-3 rounded-2xl border text-ui-10 font-black uppercase tracking-tighter transition-all active:scale-95 ${modificateurEchelonne === cle
                                    ? 'bg-accent text-app-on-accent border-accent/40 shadow-glow-accent'
                                    : 'bg-app-text/5 border-app-text/10 text-app-muted'}`}
                            >
                                {titre}
                            </Bouton>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 pl-1">
                        <span className="text-lg font-black text-app-text font-mono">{libelleDeLaPoignee || '—'}</span>
                        <span className="text-ui-9 text-app-muted uppercase tracking-widest ml-auto">6+ réussite · 10+ en vaut deux</span>
                    </div>

                    {/*
                      *Une correction muette est une règle perdue* : le livre
                      plafonne à deux D12, et un désavantage ne vide jamais la
                      poignée. Quand la composition corrige, elle le dit.
                    */}
                    {poigneeEchelonnee.remarques.map((remarque, i) => (
                        <p key={i} className="text-ui-10 italic text-etat-alerte/80">{remarque}</p>
                    ))}
                </Panneau>
            )}

            {/* Controls */}
            {estEchelonne ? null : diceMode === 'formula' ? (
                <Panneau as="div" habillage="libre" className="flex flex-col gap-3 p-5 premium-glass rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <span className="text-ui-10 font-black uppercase text-app-muted tracking-widest pl-1">Formule de dés</span>
                    <div className="flex gap-3">
                        <input 
                            type="text"
                            value={diceFormula}
                            onChange={(e) => setDiceFormula(e.target.value)}
                            placeholder="ex: 2d10+1d4+5"
                            className="flex-1 bg-app-text/5 border border-app-text/10 p-4 rounded-2xl text-xl font-black text-accent outline-none focus:border-accent/50 transition-all placeholder:text-app-subtle"
                        />
                        <Bouton habillage="libre" cibleTactile
                            onClick={() => handleRollClick({
                                sides: 0,
                                count: 1,
                                modifier: 0,
                                mode: 'formula',
                                formula: diceFormula,
                                title: `Formule: ${diceFormula}`
                            })}
                            disabled={!diceFormula.trim()}
                            title="Lancer la formule"
                            aria-label="Lancer la formule personnalisée"
                            className="px-6 bg-accent text-app-on-accent font-black uppercase rounded-2xl shadow-glow-accent active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            <Dices size={24} />
                        </Bouton>
                    </div>
                    <span className="text-ui-10 text-app-muted italic pl-1">Supporte les opérateurs (+,-,*,/), les pools (ex: 5d6s6) et les fonctions.</span>
                </Panneau>
            ) : (
                <div className={`grid ${diceMode === 'yze' ? 'grid-cols-2' : (diceMode === 'rolemaster' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4')} gap-4`}>
                    {diceMode !== 'rolemaster' && (
                        <Panneau as="div" habillage="libre" className="flex flex-col gap-2 p-4 premium-glass rounded-3xl">
                            <span className="text-ui-10 font-black uppercase text-app-muted tracking-widest">
                                {diceMode === 'yze' ? 'Dés Base' : 'Quantité / Base'}
                            </span>
                            <div className="flex items-center justify-between">
                                <Bouton habillage="libre" cibleTactile
                                    onClick={() => {
                                        haptic(10);
                                        setDiceCount(Math.max(1, diceCount - 1));
                                    }} 
                                    title="Diminuer la quantité"
                                    aria-label="Diminuer la quantité"
                                    className="min-w-[44px] w-10 h-10 rounded-xl flex items-center justify-center bg-app-text/5 active:scale-90 transition-all font-black text-app-text hover:bg-app-text/10"
                                >
                                    <Minus size={16} />
                                </Bouton>
                                <span className="text-xl font-black text-accent">{diceCount}</span>
                                <Bouton habillage="libre" cibleTactile
                                    onClick={() => {
                                        haptic(10);
                                        setDiceCount(Math.min(99, diceCount + 1));
                                    }} 
                                    title="Augmenter la quantité"
                                    aria-label="Augmenter la quantité"
                                    className="min-w-[44px] w-10 h-10 rounded-xl flex items-center justify-center bg-app-text/5 active:scale-90 transition-all font-black text-app-text hover:bg-app-text/10"
                                >
                                    <Plus size={16} />
                                </Bouton>
                            </div>
                        </Panneau>
                    )}

                    <div className={`${diceMode === 'yze' ? 'col-span-1' : (diceMode === 'rolemaster' ? 'col-span-1' : 'grid grid-cols-2 gap-3 col-span-2 lg:col-span-2')}`}>
                        {diceMode !== 'yze' && (
                            <Panneau as="div" habillage="libre" className="flex flex-col gap-2 p-4 premium-glass rounded-3xl">
                                <span className="text-ui-10 font-black uppercase text-app-muted tracking-widest">Modificateur</span>
                                <div className="flex items-center justify-between">
                                    <Bouton habillage="libre" cibleTactile
                                        onClick={() => setDiceModifier(diceModifier - 1)} 
                                        title="Diminuer le modificateur"
                                        aria-label="Diminuer le modificateur"
                                        className="min-w-[44px] w-10 h-10 rounded-xl flex items-center justify-center bg-app-text/5 active:scale-90 transition-all font-black text-app-text hover:bg-app-text/10"
                                    >
                                        <Minus size={16} />
                                    </Bouton>
                                    <span className={`text-xl font-black ${diceModifier === 0 ? 'text-app-muted' : 'text-accent'}`}>
                                        {diceModifier > 0 ? `+${diceModifier}` : diceModifier}
                                    </span>
                                    <Bouton habillage="libre" cibleTactile
                                        onClick={() => setDiceModifier(diceModifier + 1)} 
                                        title="Augmenter le modificateur"
                                        aria-label="Augmenter le modificateur"
                                        className="min-w-[44px] w-10 h-10 rounded-xl flex items-center justify-center bg-app-text/5 active:scale-90 transition-all font-black text-app-text hover:bg-app-text/10"
                                    >
                                        <Plus size={16} />
                                    </Bouton>
                                </div>
                            </Panneau>
                        )}

                        {diceMode !== 'rolemaster' && (
                            <Panneau as="div" habillage="libre" className="flex flex-col gap-2 p-4 premium-glass rounded-3xl h-full">
                                <span className="text-ui-10 font-black uppercase text-app-muted tracking-widest">
                                    {diceMode === 'yze' ? 'Dés Equip. (E)' : 'Seuil (Target)'}
                                </span>
                                <div className="flex items-center justify-between">
                                    <Bouton habillage="libre" cibleTactile
                                        onClick={() => setThreshold(Math.max(0, threshold - 1))} 
                                        title={diceMode === 'yze' ? 'Diminuer l\'expertise' : 'Diminuer le seuil'}
                                        aria-label={diceMode === 'yze' ? 'Diminuer l\'expertise' : 'Diminuer le seuil'}
                                        className="min-w-[44px] w-10 h-10 rounded-xl flex items-center justify-center bg-app-text/5 active:scale-90 transition-all font-black text-app-text hover:bg-app-text/10"
                                    >
                                        <Minus size={16} />
                                    </Bouton>
                                    <span className="text-xl font-black text-accent">{threshold}</span>
                                    <Bouton habillage="libre" cibleTactile
                                        onClick={() => setThreshold(Math.min(99, threshold + 1))} 
                                        title={diceMode === 'yze' ? 'Augmenter l\'expertise' : 'Augmenter le seuil'}
                                        aria-label={diceMode === 'yze' ? 'Augmenter l\'expertise' : 'Augmenter le seuil'}
                                        className="min-w-[44px] w-10 h-10 rounded-xl flex items-center justify-center bg-app-text/5 active:scale-90 transition-all font-black text-app-text hover:bg-app-text/10"
                                    >
                                        <Plus size={16} />
                                    </Bouton>
                                </div>
                            </Panneau>
                        )}
                    </div>
                </div>
            )}

            {/* Mode Selector - Refactored to Dropdown */}
            <div className="flex flex-col gap-2">
                <label className="text-ui-10 font-black uppercase text-app-muted tracking-widest pl-1">Mode de Lancer</label>
                <div className="relative" ref={modeMenuRef}>
                    <Bouton habillage="libre" cibleTactile
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`w-full p-4 flex items-center justify-between premium-glass rounded-3xl border transition-all ${
                            isMenuOpen ? 'border-accent/50 ring-4 ring-accent/10' : 'border-app-text/5'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isManualMode ? 'bg-etat-alerte/10 text-etat-alerte' : 'bg-accent/10 text-accent'}`}>
                                <Dices size={18} />
                            </div>
                            <span className="text-sm font-bold text-app-text uppercase">{currentModeLabel}</span>
                        </div>
                        <ChevronDown size={18} className={`text-app-muted transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </Bouton>

                    {isMenuOpen && (
                        <div 
                            className="absolute top-full left-0 right-0 mt-2 z-[150] rounded-3xl border border-app-text/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 max-h-[260px] overflow-y-auto custom-scrollbar bg-app-bg/95 backdrop-blur-2xl p-2 pointer-events-auto block"
                        >
                            <div className="grid grid-cols-1 gap-1 py-1">
                                {DICE_MODES.map(mode => (
                                    <Bouton habillage="libre" cibleTactile
                                        key={mode.id}
                                        onClick={() => {
                                            setDiceMode(mode.id);
                                            setIsManualMode(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                                            diceMode === mode.id ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:bg-app-text/5 hover:text-app-text'
                                        }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-tight">{mode.label}</span>
                                        {diceMode === mode.id && <Check size={14} />}
                                    </Bouton>
                                ))}
                                
                                {isManualMode && (
                                    <Bouton habillage="libre" cibleTactile
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsManualMode(false);
                                            setIsMenuOpen(false);
                                        }}
                                        className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-etat-alerte/10 text-etat-alerte hover:bg-etat-alerte/20 transition-all border border-etat-alerte/20"
                                    >
                                        <RotateCcw size={14} />
                                        <span className="text-ui-10 font-black uppercase tracking-widest">Réinitialiser au système</span>
                                    </Bouton>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Dice Buttons */}
            {diceMode === 'rolemaster' ? (
                <div className="flex flex-col gap-4">
                    <Bouton habillage="libre" cibleTactile
                        onClick={() => handleRollClick({ 
                            sides: 100, 
                            count: 1, 
                            modifier: diceModifier, 
                            mode: 'rolemaster',
                            title: `Rolemaster d100`
                        })}
                        className="w-full p-8 premium-glass border border-accent/20 rounded-3xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group overflow-hidden relative shadow-glow-accent/5 hover:border-accent/40"
                    >
                        <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors" />
                        <Dices size={48} className="text-accent mb-2 animate-in zoom-in duration-300" />
                        <span className="text-2xl font-black text-app-text tracking-widest uppercase">Lancer d100 Rolemaster</span>
                        <span className="text-ui-10 text-app-muted font-bold uppercase tracking-[0.2em]">Open-Ended Roll (Explosif)</span>
                        {diceModifier !== 0 && (
                            <div className="mt-2 px-4 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-black">
                                Modificateur: {diceModifier > 0 ? '+' : ''}{diceModifier}
                            </div>
                        )}
                    </Bouton>
                    <Bouton habillage="libre" cibleTactile
                        onClick={() => {
                            setDiceModifier(0);
                            setIsManualMode(false);
                            onClear();
                        }}
                        className="w-full p-4 bg-etat-danger/10 border border-etat-danger/20 text-etat-danger rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all font-black hover:bg-etat-danger/20"
                    >
                        <RotateCcw size={18} />
                        <span className="text-xs uppercase tracking-widest">Réinitialiser</span>
                    </Bouton>
                </div>
            ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                    {diceTypes.map(d => (
                        <Bouton habillage="libre" cibleTactile
                            key={d}
                            onClick={() => handleRollClick({ 
                                sides: d, 
                                count: diceCount, 
                                modifier: diceModifier, 
                                mode: diceMode, 
                                target: threshold,
                                gearCount: threshold 
                            })}
                            title={`Lancer D${d}`}
                            aria-label={`Lancer D${d}`}
                            className="aspect-square premium-glass border border-app-text/5 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-90 transition-all group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors" />
                            <span className="text-xs font-black text-accent group-active:text-app-text z-10 font-mono">D{d}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-app-text/10 group-hover:bg-accent/40 transition-colors z-10" />
                        </Bouton>
                    ))}
                    <Bouton habillage="libre" cibleTactile
                        onClick={() => {
                            setDiceCount(1);
                            setDiceModifier(0);
                            setThreshold(activeDiceConfig?.successThreshold || 10);
                            setIsManualMode(false);
                            onClear();
                        }}
                        title="Réinitialiser les dés"
                        aria-label="Réinitialiser les dés"
                        className="aspect-square bg-etat-danger/10 border border-etat-danger/20 text-etat-danger rounded-2xl flex items-center justify-center active:scale-90 transition-all font-black hover:bg-etat-danger/20 shadow-glow-rose/5"
                    >
                        <RotateCcw size={20} />
                    </Bouton>
                </div>
            )}
            
            {/* Help text if YZE */}
            {activeDiceConfig?.engine === 'yze' && (
                <Panneau as="div" habillage="libre" className="flex items-center gap-2 p-3 bg-app-text/5 rounded-2xl border border-app-text/5">
                    <Info size={14} className="text-app-muted" />
                    <span className="text-ui-9 text-app-muted font-medium italic">
                        Le moteur Year Zero gère automatiquement les 6 comme succès et les 1 comme complications sur les dés de base/skill et de gear.
                    </span>
                </Panneau>
            )}
        </div>
    );
};

export default RemoteDicePad;
