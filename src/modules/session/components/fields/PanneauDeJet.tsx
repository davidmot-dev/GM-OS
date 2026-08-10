import React, { useMemo, useState } from 'react';
import { Dices, AlertTriangle, Plus, Minus } from 'lucide-react';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import { preparerLeJet, verdict, type DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * Lancer depuis la fiche de personnage.
 *
 * **Ce qu'il change.** Jusqu'ici la fiche était un formulaire : on y notait des
 * valeurs qu'il fallait reporter à la main dans Dice OS pour lancer. Le seuil,
 * chez Dune, se calcule à partir de deux champs de la fiche — une compétence et
 * un principe — et personne ne pouvait faire ce calcul à la place du joueur.
 *
 * **Le résultat reste sur la fiche**, à côté des valeurs qui l'ont produit. On
 * voit d'où vient le seuil, ce qui est la moitié de l'intérêt : un jet dont on
 * ne sait pas de quoi il est fait ne se vérifie pas.
 *
 * Le panneau ne s'affiche que si le pilote décrit ses jets. Un système sans
 * descripteur garde sa fiche telle quelle, sans bouton mort.
 */
interface PanneauDeJetProps {
    descripteur: DescripteurDeJet;
    dice: DiceConfig;
    template: SheetTemplate;
    /** Valeurs courantes de la fiche, telles que l'éditeur les tient. */
    valeurs: Record<string, unknown>;
}

const PanneauDeJet: React.FC<PanneauDeJetProps> = ({ descripteur, dice, template, valeurs }) => {
    /** Champ retenu pour chaque composante — `{ competence: 'combat' }`. */
    const [choix, setChoix] = useState<Record<string, string>>({});
    const [desAchetes, setDesAchetes] = useState(0);
    const [difficulte, setDifficulte] = useState(descripteur.difficulte.defaut);
    const [resultat, setResultat] = useState<RollResult | null>(null);
    const [seuilDuLancer, setSeuilDuLancer] = useState(0);

    /** Les champs proposés pour une composante : ceux de sa section. */
    const champsDe = (sectionId: string) =>
        template.sections.find(s => s.id === sectionId)?.fields ?? [];

    const jet = useMemo(
        () => preparerLeJet(descripteur, valeurs, { champs: choix, desSupplementaires: desAchetes, difficulte }),
        [descripteur, valeurs, choix, desAchetes, difficulte],
    );

    /** Rien ne part tant que chaque composante n'a pas son champ. */
    const pret = descripteur.seuil.every(c => choix[c.id]) && jet.avertissements.length === 0;

    const lancer = () => {
        const res = DiceEngine.rollFromConfig(
            { ...dice, successThreshold: jet.seuil },
            { baseCount: jet.nombreDeDes, doubleSous: jet.doubleSous },
        );
        setSeuilDuLancer(jet.seuil);
        setResultat(res);
    };

    const reussites = resultat?.successes ?? 0;
    const v = verdict(reussites, difficulte);
    const complications = descripteur.complication
        ? (resultat?.rolls ?? []).filter(d => typeof d.val === 'number' && d.val >= descripteur.complication!).length
        : 0;

    return (
        <div className="space-y-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
            <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                <Dices size={14} /> Lancer un test
            </h3>

            {/* Les composantes du seuil : un menu par composante. */}
            <div className="grid grid-cols-2 gap-3">
                {descripteur.seuil.map(composante => (
                    <label key={composante.id} className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">
                            {composante.label}
                        </span>
                        <select
                            value={choix[composante.id] ?? ''}
                            onChange={e => setChoix(c => ({ ...c, [composante.id]: e.target.value }))}
                            className="bg-app-bg/60 border border-app-border/40 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-accent/50"
                        >
                            <option value="">— choisir —</option>
                            {champsDe(composante.sectionId).map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.label} ({String(valeurs[f.id] ?? f.defaultValue)})
                                </option>
                            ))}
                        </select>
                    </label>
                ))}
            </div>

            {/* Le seuil, décomposé — on doit voir d'où il sort. */}
            <div className="flex items-baseline gap-2 text-xs">
                <span className="text-app-text/40 font-bold uppercase tracking-widest text-[9px]">Seuil</span>
                <span className="font-mono text-lg font-black text-accent">{jet.seuil}</span>
                {jet.composantes.length > 0 && (
                    <span className="text-app-text/30 font-mono">
                        = {jet.composantes.map(c => `${c.valeur}`).join(' + ')}
                        <span className="ml-1 opacity-60">({jet.composantes.map(c => c.champ).join(' + ')})</span>
                    </span>
                )}
            </div>

            <div className="flex items-center gap-6">
                {/* Réserve : les dés supplémentaires s'achètent, jusqu'au plafond du système. */}
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">Dés</span>
                    <button
                        onClick={() => setDesAchetes(d => Math.max(0, d - 1))}
                        className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                    ><Minus size={12} /></button>
                    <span className="font-mono text-sm font-black w-6 text-center">{jet.nombreDeDes}</span>
                    <button
                        onClick={() => setDesAchetes(d => Math.min(descripteur.reserve.max - descripteur.reserve.base, d + 1))}
                        className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                    ><Plus size={12} /></button>
                </div>

                <label className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">Difficulté</span>
                    <input
                        type="number"
                        min={descripteur.difficulte.min}
                        max={descripteur.difficulte.max}
                        value={difficulte}
                        onChange={e => setDifficulte(Number(e.target.value))}
                        className="w-14 bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent/50"
                    />
                </label>

                <button
                    onClick={lancer}
                    disabled={!pret}
                    className={`ml-auto px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        pret
                            ? 'bg-accent text-white hover:scale-105 active:scale-95'
                            : 'bg-app-text/5 text-app-text/20 cursor-not-allowed'
                    }`}
                >
                    Lancer
                </button>
            </div>

            {/*
                Ce qui manque se dit. Un champ absent de la fiche est une erreur
                de configuration du pilote, et le joueur doit savoir pourquoi le
                bouton refuse plutôt que de le voir grisé sans explication.
            */}
            {jet.avertissements.length > 0 && (
                <ul className="space-y-1">
                    {jet.avertissements.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-amber-300/70">
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}
                        </li>
                    ))}
                </ul>
            )}

            {resultat && (
                <div className="rounded-xl border border-app-border/30 bg-app-bg/40 p-3 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                        {resultat.rolls.map((d, i) => {
                            const val = typeof d.val === 'number' ? d.val : 0;
                            const critique = descripteur.critique !== undefined && val <= jet.doubleSous;
                            const complique = descripteur.complication !== undefined && val >= descripteur.complication;
                            return (
                                <span
                                    key={i}
                                    title={critique ? 'Deux réussites' : complique ? 'Complication' : undefined}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-black border ${
                                        critique
                                            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                                            : d.isCritMax
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300/80'
                                                : complique
                                                    ? 'bg-red-500/20 border-red-400/50 text-red-200'
                                                    : 'bg-app-text/5 border-app-border/30 text-app-text/40'
                                    }`}
                                >
                                    {val}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                        <span className={`font-black uppercase tracking-widest ${v.reussi ? 'text-emerald-400' : 'text-red-400'}`}>
                            {v.reussi ? 'Réussite' : 'Échec'}
                        </span>
                        <span className="text-app-text/50 font-mono">
                            {reussites} réussite{reussites > 1 ? 's' : ''} / difficulté {difficulte}
                        </span>
                        {/* L'excédent est ce qui alimente la monnaie de table. */}
                        {v.excedent > 0 && (
                            <span className="text-amber-300/80 font-mono">+{v.excedent} excédent</span>
                        )}
                        {complications > 0 && (
                            <span className="text-red-300/80 font-mono">
                                {complications} complication{complications > 1 ? 's' : ''}
                            </span>
                        )}
                        <span className="ml-auto text-app-text/25 font-mono text-[10px]">sous {seuilDuLancer}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanneauDeJet;
