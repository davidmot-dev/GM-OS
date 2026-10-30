import React from 'react';
import {
    DIFFICULTES_DE_DEGENESIS, EGO_PAR_ROUND, MODIFICATEURS_DE_DEGENESIS,
    type ChoixDeDegenesis, type JetDeDegenesis, type ReserveDeDegenesis,
} from '../../../dice/systemes/degenesis';

/**
 * **Le jet de Degenesis** — 30/10/2026, à la demande de David (« finir le pilote »).
 * Avant de lancer : la difficulté du livre en succès requis, les modificateurs en dés,
 * l'Égo dépensé ; la valeur d'action se lit en entier, Traumatismes et succès d'office
 * compris. Après : les déclencheurs et ce qu'ils valent au combat.
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };
const signe = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

export const PreparationDegenesis: React.FC<{
    choix: ChoixDeDegenesis;
    setChoix: (maj: (c: ChoixDeDegenesis) => ChoixDeDegenesis) => void;
    reserve?: ReserveDeDegenesis;
    difficulte: number;
    setDifficulte: (n: number) => void;
    /** Les points d'Égo de la fiche ; absents, l'Égo ne se dépense pas d'ici. */
    ego?: number;
}> = ({ choix, setChoix, reserve, difficulte, setDifficulte, ego }) => {
    const egoMax = ego === undefined ? 0 : Math.min(EGO_PAR_ROUND, ego);
    return (
        <div data-preparation-degenesis className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1">
                <span className={etiquette}>Difficulté</span>
                {DIFFICULTES_DE_DEGENESIS.map(d => (
                    <button key={d.succes} type="button" aria-pressed={difficulte === d.succes}
                        className={`${bouton} ${difficulte === d.succes ? 'border-accent text-accent' : ''}`}
                        title={`${d.succes} succès requis (p. 18)`} onClick={() => setDifficulte(d.succes)}>
                        {d.label} ({d.succes})
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
                <span className={etiquette}>Modificateurs</span>
                {MODIFICATEURS_DE_DEGENESIS.map(m => (
                    <button key={m.label} type="button" className={bouton} title="S'ajoute à la valeur d'action (p. 102-106)."
                        onClick={() => setChoix(c => ({ ...c, modificateur: c.modificateur + m.des }))}>
                        {m.label} {signe(m.des)}D
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1" title="Maniabilité de l'arme, encombrement, Potentiels, couverture… toujours en dés.">
                    Total des modificateurs (D)
                    <input aria-label="Modificateurs en dés" type="number" value={choix.modificateur} className={`w-14 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, modificateur: entier(e.target.value) }))} />
                </label>
                {ego !== undefined && (
                    <label className="flex items-center gap-1"
                        title="Dépensés au jet d'initiative : +1D à l'initiative et à la première action du round, trois au plus (p. 100). Retirés de la fiche au lancer.">
                        Égo dépensé
                        <select aria-label="Égo dépensé" value={Math.min(choix.ego, egoMax)} className={champ}
                            onChange={e => setChoix(c => ({ ...c, ego: entier(e.target.value) }))}>
                            {Array.from({ length: egoMax + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="text-app-text/50">sur {ego}</span>
                    </label>
                )}
            </div>
            {reserve && (
                <span data-composition-degenesis className="text-app-text/60">
                    Valeur d'action {reserve.base}
                    {reserve.modificateur !== 0 && ` ${signe(reserve.modificateur)}D`}
                    {reserve.ego > 0 && ` +${reserve.ego}D d'Égo`}
                    {reserve.traumatismes > 0 && ` −${reserve.traumatismes}D de Traumatisme${reserve.traumatismes > 1 ? 's' : ''}`}
                    {' '}= <strong className="text-app-text">{reserve.valeur}</strong> : {reserve.des} dé{reserve.des > 1 ? 's' : ''}
                    {reserve.automatiques > 0 && ` et ${reserve.automatiques} succès d'office`}, réussis sur 4, 5 ou 6.
                </span>
            )}
        </div>
    );
};

export const SuitesDegenesis: React.FC<{ jet: JetDeDegenesis }> = ({ jet }) => {
    const d = jet.degenesis;
    return (
        <div data-suites-degenesis className="flex w-full flex-col gap-1 text-xs text-app-text/70">
            {d.bilan === 'reussite' && d.declencheurs > 0 && (
                <span>
                    {d.declencheurs} déclencheur{d.declencheurs > 1 ? 's' : ''} : au combat, +{d.declencheurs} dégât{d.declencheurs > 1 ? 's' : ''} (p. 107) ;
                    ils activent aussi les Potentiels et les propriétés des armes sans s'épuiser (p. 19).
                </span>
            )}
            {d.bilan === 'echec-critique' && (
                <span className="text-etat-danger">{d.uns} « 1 » pour {d.succes} succès : l'action prend mauvaise tournure (p. 19).</span>
            )}
            {d.bilan !== 'reussite' && d.six > 0 && (
                <span>{d.six} six obtenu{d.six > 1 ? 's' : ''} : ils départagent une confrontation à égalité de succès (p. 19).</span>
            )}
        </div>
    );
};
