import React, { useMemo, useState } from 'react';
import { Dices, AlertTriangle, Info, Plus, Minus, Coins } from 'lucide-react';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import {
    preparerLeJet, sectionDeLaComposante, verdict,
    type ComposanteDeJet, type DescripteurDeJet,
} from '../../../dice/DescripteurDeJet';
import { ventilerLaDepense, type RessourceDeTable } from '../../../table/RessourcesDeTable';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
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
    /**
     * De quoi faire payer les dés et créditer l'excédent.
     *
     * Les deux facultatifs et solidaires : un système sans monnaie de table
     * garde le panneau tel quel, les dés y sont simplement gratuits.
     */
    campaignId?: string;
    ressourcesDeTable?: RessourceDeTable[];
    /**
     * Le panneau tourne sur la tablette d'un joueur.
     *
     * Le jet est **exactement le même** — mêmes dés, même seuil, même règle :
     * *un jet qui change selon l'écran d'où on le lance n'est pas le même jet.*
     * Seule la dépense change de chemin : elle doit remonter au meneur au lieu
     * de rester dans la fenêtre où elle a été faite.
     */
    pourLesJoueurs?: boolean;
}

const PanneauDeJet: React.FC<PanneauDeJetProps> = ({
    descripteur, dice, template, valeurs, campaignId, ressourcesDeTable, pourLesJoueurs = false,
}) => {
    /** Champ retenu pour chaque composante — `{ competence: 'combat' }`. */
    const [choix, setChoix] = useState<Record<string, string>>({});
    const [desAchetes, setDesAchetes] = useState(0);
    // Un jeu sans difficulté déclarée n'en affiche pas, et part de zéro : chez
    // Alien, un seul six suffit — il n'y a pas de seuil à atteindre.
    const [difficulte, setDifficulte] = useState(descripteur.difficulte?.defaut ?? 0);
    const [resultat, setResultat] = useState<RollResult | null>(null);
    const [seuilDuLancer, setSeuilDuLancer] = useState(0);
    /** Ce que le dernier lancer a fait aux réserves de la table. */
    const [mouvements, setMouvements] = useState<string[]>([]);

    const { etatDe, depenser, gagner, ajusterDepuisLaTablette } = useRessourcesDeTableStore();
    const monnaie = campaignId && ressourcesDeTable?.length ? { campaignId, ressourcesDeTable } : null;

    /**
     * Débiter ou créditer la réserve, du bon côté du réseau.
     *
     * Sur la tablette, `depenser` n'écrirait que dans la fenêtre du joueur : sa
     * réserve baisserait chez lui et nulle part ailleurs, ce qui est pire que
     * de ne pas la lui donner — deux tables joueraient avec deux Impulsions.
     *
     * `motif` accompagne le mouvement jusqu'au journal de séance : *une
     * Impulsion qui passe de quatre à un ne veut rien dire sans le jet qui l'a
     * dépensée.*
     */
    const mouvoir = (id: string, delta: number, motif: string) => {
        if (!monnaie) return { avertissements: [] as string[] };
        if (pourLesJoueurs) {
            return ajusterDepuisLaTablette(monnaie.campaignId, monnaie.ressourcesDeTable, id, delta, motif);
        }
        return delta < 0
            ? depenser(monnaie.campaignId, monnaie.ressourcesDeTable, id, -delta, motif)
            : gagner(monnaie.campaignId, monnaie.ressourcesDeTable, id, delta, motif);
    };

    /**
     * Les champs proposés pour une composante : ceux de sa section.
     *
     * **La résolution est partagée avec `preparerLeJet`**, et c'est essentiel :
     * un menu rempli depuis une section que le calcul ignorerait — ou l'inverse
     * — rendrait un jet dont l'écran et le moteur ne parlent plus du même
     * endroit de la fiche.
     */
    const champsDe = (composante: ComposanteDeJet) =>
        sectionDeLaComposante(template.sections, composante).section?.fields ?? [];

    const jet = useMemo(
        () => preparerLeJet(
            descripteur, valeurs,
            { champs: choix, desSupplementaires: desAchetes, difficulte },
            template.sections,
        ),
        [descripteur, valeurs, choix, desAchetes, difficulte, template.sections],
    );

    /** Rien ne part tant que chaque composante n'a pas son champ. */
    // Un jeu sans composante de seuil est prêt d'emblée : il n'y a rien à
    // choisir sur la fiche avant de lancer.
    const pret = (descripteur.seuil ?? []).every(c => choix[c.id]) && jet.avertissements.length === 0;

    /**
     * D'où sortiront les points, **avant** de lancer.
     *
     * Chez Dune, les dés qu'on ne peut pas payer en Impulsion se paient en
     * Menace : la dépense alimente la réserve du meneur. Ce n'est jamais une
     * surprise acceptable — donc on l'annonce, et le joueur décide ensuite.
     */
    const ventilation = useMemo(() => {
        if (!monnaie || !jet.cout.ressource || jet.cout.total === 0) return null;
        const etat = etatDe(monnaie.campaignId, monnaie.ressourcesDeTable);
        return ventilerLaDepense(monnaie.ressourcesDeTable, etat, jet.cout.ressource, jet.cout.total);
    }, [monnaie, jet.cout.ressource, jet.cout.total, etatDe]);

    const nomDe = (id?: string) =>
        ressourcesDeTable?.find(r => r.id === id)?.label ?? id ?? '';

    const lancer = () => {
        const dits: string[] = [];

        // Le coût se prélève au moment où l'on s'engage, pas pendant qu'on
        // tourne les boutons : régler avant de lancer ferait payer les
        // hésitations.
        /**
         * Ce que le jet a coûté, dit au journal avec ce qui l'a composé.
         *
         * « Jet : Combat + Devoir (seuil 11), 2 dés achetés » — relire une
         * séance et y trouver une Impulsion tombée de quatre à un sans savoir
         * pourquoi ne renseigne sur rien.
         */
        const enTete = jet.composantes.length > 0
            ? `Jet : ${jet.composantes.map(c => c.label).join(' + ')} (seuil ${jet.seuil})`
            : `Jet : ${jet.nombreDeDes}d${jet.faces}`;

        if (monnaie && jet.cout.ressource && jet.cout.total > 0) {
            dits.push(...mouvoir(
                jet.cout.ressource, -jet.cout.total,
                `${enTete}, ${jet.desAchetes} dé${jet.desAchetes > 1 ? 's' : ''} acheté${jet.desAchetes > 1 ? 's' : ''}`,
            ).avertissements);
        }

        const res = DiceEngine.rollFromConfig(
            { ...dice, successThreshold: jet.seuil },
            { baseCount: jet.nombreDeDes, doubleSous: jet.doubleSous },
        );
        setSeuilDuLancer(jet.seuil);
        setResultat(res);

        /**
         * « Après la résolution d'un test réussi, chaque réussite excédentaire
         * génère un point d'Impulsion ajouté à la réserve du groupe. »
         *
         * Le crédit est automatique parce que la règle l'est — `verdict` rend
         * un excédent nul sur un échec, ce qui couvre « aucune Impulsion ne
         * peut être générée si le test échoue ». Le plafond, lui, se dit :
         * gagner trois points et n'en voir arriver qu'un doit s'expliquer.
         */
        if (monnaie && jet.cout.ressource) {
            const excedent = verdict(res.successes ?? 0, jet.difficulte).excedent;
            if (excedent > 0) {
                dits.push(...mouvoir(
                    jet.cout.ressource, excedent,
                    `${enTete}, ${excedent} réussite${excedent > 1 ? 's' : ''} excédentaire${excedent > 1 ? 's' : ''}`,
                ).avertissements);
            }
        }

        setMouvements(dits);
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
                {(descripteur.seuil ?? []).map(composante => (
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
                            {champsDe(composante).map(f => (
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
                        onClick={() => setDesAchetes(d => Math.min((descripteur.reserve?.max ?? 0) - (descripteur.reserve?.base ?? 0), d + 1))}
                        className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                    ><Plus size={12} /></button>
                </div>

                {/*
                    Le prix des dés achetés, ventilé. « 3 — 2 d'Impulsion,
                    1 de Menace » : ce qui part chez le meneur se voit avant
                    le lancer, pas après.
                */}
                {ventilation && (
                    <span
                        className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300/80"
                        title="Coût des dés supplémentaires"
                    >
                        <Coins size={11} />
                        {ventilation.surLaReserve > 0 && (
                            <span>{ventilation.surLaReserve} {nomDe(jet.cout.ressource)}</span>
                        )}
                        {ventilation.reporte > 0 && (
                            <span className="text-red-300/80">
                                {ventilation.surLaReserve > 0 && '+ '}
                                {ventilation.reporte} {nomDe(ventilation.ressourceDeReport)}
                            </span>
                        )}
                    </span>
                )}

                {/* Pas de champ pour ce que le jeu ne fixe pas : un sélecteur de
                    difficulté sur un jeu qui n'en a pas invite à en inventer une. */}
                {descripteur.difficulte && (
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
                )}

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

            {/*
                Ce qui s'est raccordé malgré une dérive du pilote. Plus discret
                que les avertissements — le jet est juste et part —, mais dit :
                un défaut silencieux finit toujours par coûter plus cher qu'une
                ligne de texte.
            */}
            {jet.remarques.length > 0 && (
                <ul className="space-y-1">
                    {jet.remarques.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] text-app-text/35">
                            <Info size={11} className="mt-0.5 shrink-0" /> {r}
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
                        {/* L'excédent alimente la monnaie de table — et depuis
                            le mur n° 4, il y est réellement versé. */}
                        {v.excedent > 0 && (
                            <span className="text-amber-300/80 font-mono">
                                +{v.excedent}{monnaie && jet.cout.ressource ? ` ${nomDe(jet.cout.ressource)}` : ' excédent'}
                            </span>
                        )}
                        {complications > 0 && (
                            <span className="text-red-300/80 font-mono">
                                {complications} complication{complications > 1 ? 's' : ''}
                            </span>
                        )}
                        <span className="ml-auto text-app-text/25 font-mono text-[10px]">sous {seuilDuLancer}</span>
                    </div>

                    {/*
                        Ce que le lancer a fait aux réserves de la table : un
                        report en Menace, un gain refusé par le plafond. Une
                        réserve qui bouge sans le dire est exactement le genre
                        de silence qu'on traque.
                    */}
                    {mouvements.length > 0 && (
                        <ul className="space-y-1 pt-1 border-t border-app-border/20">
                            {mouvements.map((m, i) => (
                                <li key={i} className="flex items-start gap-2 text-[11px] text-amber-300/70">
                                    <Coins size={11} className="mt-0.5 shrink-0" /> {m}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default PanneauDeJet;
