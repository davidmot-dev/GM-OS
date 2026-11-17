import React, { useState } from 'react';
import {
    DIFFICULTES_DE_VAMPIRE, MODIFICATEUR_CONSEILLE, RELANCE_MAXIMALE, relanceImpossible, relancesProposees,
    type ChoixDeVampire, type JetDeVampire, type ReserveDeVampire, type TestDExaltation,
} from '../../../dice/systemes/vampire';

/**
 * **Le jet de Vampire : la Mascarade (V5)** — 17/11/2026, à la demande de David (« finir le
 * pilote »). Avant de lancer : la difficulté du tableau (p. 119), la spécialité (+1 dé, p. 118),
 * les dés du conteur (p. 120), le jet de jauge sans Soif (p. 205) et le test d'Exaltation
 * (p. 211). Après : le bilan du livre, la relance par la Volonté (p. 122) et la Compulsion
 * d'un échec bestial (p. 207-208).
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };
const signe = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);
const des = (n: number) => `${n} dé${n > 1 ? 's' : ''}`;

export const PreparationVampire: React.FC<{
    choix: ChoixDeVampire;
    setChoix: (maj: (c: ChoixDeVampire) => ChoixDeVampire) => void;
    reserve?: ReserveDeVampire;
    difficulte: number;
    setDifficulte: (n: number) => void;
    /** Le texte des spécialités de la compétence retenue, s'il y en a. */
    specialites?: string;
    /** Le test d'Exaltation ; absent, il ne se lance pas d'ici. */
    exalter?: (deuxDes: boolean) => void;
    dernierTest?: TestDExaltation | null;
}> = ({ choix, setChoix, reserve, difficulte, setDifficulte, specialites, exalter, dernierTest }) => {
    const [deuxDes, setDeuxDes] = useState(false);
    const horsConseil = Math.abs(choix.modificateur) > MODIFICATEUR_CONSEILLE;
    return (
        <div data-preparation-vampire className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1">
                <span className={etiquette}>Difficulté</span>
                {DIFFICULTES_DE_VAMPIRE.map(d => (
                    <button key={d.reussites} type="button" aria-pressed={difficulte === d.reussites}
                        className={`${bouton} ${difficulte === d.reussites ? 'border-accent text-accent' : ''}`}
                        title={`${d.reussites} réussite${d.reussites > 1 ? 's' : ''} requise${d.reussites > 1 ? 's' : ''} (p. 119)`}
                        onClick={() => setDifficulte(d.reussites)}>
                        {d.label} ({d.reussites})
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1" title="Une spécialité de la compétence s'applique à l'action : un dé de plus (p. 118).">
                    <input type="checkbox" checked={choix.specialite} onChange={e => setChoix(c => ({ ...c, specialite: e.target.checked }))} />
                    Spécialité (+1 dé)
                    {specialites && <span className="text-app-text/50">— {specialites}</span>}
                </label>
                <label className="flex items-center gap-1" title="Les dés que le conteur ajoute ou retire ; le livre conseille trois au plus (p. 120).">
                    Dés du conteur
                    <button type="button" className={bouton} aria-label="Retirer un dé" onClick={() => setChoix(c => ({ ...c, modificateur: c.modificateur - 1 }))}>−</button>
                    <input aria-label="Dés du conteur" type="number" value={choix.modificateur} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, modificateur: entier(e.target.value) }))} />
                    <button type="button" className={bouton} aria-label="Ajouter un dé" onClick={() => setChoix(c => ({ ...c, modificateur: c.modificateur + 1 }))}>+</button>
                </label>
                <label className="flex items-center gap-1" title="Un jet de Volonté ou d'Humanité ne reçoit jamais de dés de Soif, et la Volonté ne le relance pas (p. 122, 205).">
                    <input type="checkbox" checked={choix.sansSoif} onChange={e => setChoix(c => ({ ...c, sansSoif: e.target.checked }))} />
                    Jet de jauge (Volonté, Humanité)
                </label>
            </div>
            {horsConseil && <span className="text-etat-alerte/80">Le livre conseille au plus trois dés ajoutés ou retirés par le conteur (p. 120).</span>}
            {reserve && (
                <span data-composition-vampire className="text-app-text/60">
                    Groupement {reserve.base}
                    {reserve.specialite > 0 && ' +1 de spécialité'}
                    {reserve.modificateur !== 0 && ` ${signe(reserve.modificateur)} du conteur`}
                    {' '}= <strong className="text-app-text">{des(reserve.total)}</strong>
                    {reserve.desDeSoif > 0 ? `, dont ${reserve.desDeSoif} de Soif (Soif ${reserve.soif})` : reserve.sansSoif && reserve.soif > 0 ? ', sans dé de Soif' : ''}.
                    {' '}Chaque 6 réussit ; une paire de 10 vaut quatre réussites.
                </span>
            )}
            {exalter && (
                <div data-exaltation-vampire className="flex flex-wrap items-center gap-2 border-t border-app-border/20 pt-2">
                    <button type="button" className={bouton} onClick={() => exalter(deuxDes)}
                        title="Un dé : 6 ou plus, la Soif ne bouge pas ; sinon elle monte d'un point (p. 211).">
                        Test d’Exaltation
                    </button>
                    <label className="flex items-center gap-1" title="Une grande Puissance du sang fait lancer deux dés pour certains tests, en gardant le meilleur (p. 211, 216).">
                        <input type="checkbox" checked={deuxDes} onChange={e => setDeuxDes(e.target.checked)} />
                        deux dés, le meilleur gardé
                    </label>
                    {dernierTest && <span data-dernier-test className={dernierTest.reussi ? 'text-etat-succes' : 'text-etat-danger'}>{dernierTest.texte}</span>}
                </div>
            )}
        </div>
    );
};

/** Ce que chaque bilan du livre appelle, en une phrase. */
const SUITES: Record<JetDeVampire['vampire']['bilan'], string> = {
    'triomphe-brutal': 'La Bête a obtenu le critique : l’action réussit, mais brutalement — Flétrissure, brèche de la Mascarade ou point d’avantage perdu ; sur un jet de perception ou de discrétion, le jet échoue (p. 207).',
    'victoire-critique': 'Une réussite éclatante : plus vite, plus élégamment ou plus méticuleusement (p. 120-121).',
    victoire: '',
    echec: '',
    'echec-bestial': 'La Bête se manifeste : une Compulsion, ou à défaut un point d’avantage perdu, des dégâts aggravés, ou +1 de Soif (p. 207-208).',
    'echec-total': 'Aucune réussite : un échec total, dont le conteur fixe les conséquences (p. 122).',
};

export const SuitesVampire: React.FC<{
    jet: JetDeVampire;
    sansSoif: boolean;
    /** La Volonté restante ; absente, elle ne se décompte pas (le joueur paie lui-même). */
    volonte?: number;
    relancer?: (rangs: number[]) => void;
    tirerLaCompulsion?: () => void;
    compulsion?: { nom: string; effet: string };
}> = ({ jet, sansSoif, volonte, relancer, tirerLaCompulsion, compulsion }) => {
    const v = jet.vampire;
    const [rangs, setRangs] = useState<number[]>(() => relancesProposees(v));
    const raison = relanceImpossible(v, sansSoif, volonte);
    const basculer = (i: number) => setRangs(r => (r.includes(i) ? r.filter(x => x !== i) : r.length < RELANCE_MAXIMALE ? [...r, i] : r));
    const manquantes = v.difficulte - v.reussites;
    return (
        <div data-suites-vampire className="flex w-full flex-col gap-1.5 text-xs text-app-text/70">
            {SUITES[v.bilan] && <span>{SUITES[v.bilan]}</span>}
            {v.marge > 0 && <span>Marge {v.marge} : elle mesure les dégâts et l’intensité de bien des pouvoirs (p. 121).</span>}
            {v.bilan === 'echec' && (
                <span>Victoire à la Pyrrhus possible : l’action réussit contre un coût proportionnel à {manquantes} réussite{manquantes > 1 ? 's' : ''} manquante{manquantes > 1 ? 's' : ''} (p. 121-122).</span>
            )}
            {v.bilan === 'echec-bestial' && tirerLaCompulsion && (
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={bouton} onClick={tirerLaCompulsion} title="Le tableau des Compulsions aléatoires (p. 208).">
                        Tirer la Compulsion
                    </button>
                    {compulsion && <span data-compulsion><strong className="text-app-text">{compulsion.nom}</strong> — {compulsion.effet}</span>}
                </div>
            )}
            {relancer && !v.relance && (
                <div data-relance-vampire className="flex flex-wrap items-center gap-1 border-t border-app-border/20 pt-1.5">
                    <span className={etiquette}>Volonté</span>
                    {v.ordinaires.map((val, i) => (
                        <button key={i} type="button" aria-pressed={rangs.includes(i)} disabled={!!raison}
                            className={`${bouton} font-mono ${rangs.includes(i) ? 'border-accent text-accent' : ''}`}
                            title="Dé ordinaire à relancer (trois au plus)" onClick={() => basculer(i)}>
                            {val}
                        </button>
                    ))}
                    <button type="button" className={bouton} disabled={!!raison || rangs.length === 0} onClick={() => relancer(rangs)}
                        title="Un point de Volonté relance jusqu'à trois dés ordinaires, jamais les dés de Soif (p. 122).">
                        Relancer {rangs.length} dé{rangs.length > 1 ? 's' : ''} (1 Volonté{volonte !== undefined ? `, reste ${volonte}` : ''})
                    </button>
                    {raison && <span className="text-app-text/50">{raison}</span>}
                    {!raison && v.dixDeSoif && v.paires > 0 && (
                        <span className="text-app-text/50">Relancer un 10 ordinaire peut défaire le triomphe brutal (p. 205).</span>
                    )}
                </div>
            )}
            {v.relance && <span className="text-app-text/50">Relancé par la Volonté ({v.relances?.length ?? 0} dé{(v.relances?.length ?? 0) > 1 ? 's' : ''}).</span>}
        </div>
    );
};
