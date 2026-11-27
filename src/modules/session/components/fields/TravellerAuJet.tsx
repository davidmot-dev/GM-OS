import React from 'react';
import {
    DIFFICULTES_DE_TRAVELLER, SENS_DES_EFFETS, cibleDeTraveller, mdPourLaTacheSuivante, modificateursDeTraveller,
    type ChoixDeTraveller, type JetDeTraveller,
} from '../../../dice/systemes/traveller';

/**
 * **Le test de Traveller** — 26/11/2026, à la demande de David (« finir le pilote », livre de
 * règles français v2.2). Avant de lancer : la difficulté de l'Arbitre, le Coup de pouce ou le Coup
 * du sort, la durée, les actions simultanées, le MD d'une chaîne de tâches et les autres MD des
 * règles. Après : l'Effet, ce qu'il veut dire, et le MD qu'il donne au test suivant. Rien ne
 * s'écrit sur la fiche.
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };
const signe = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

export const PreparationTraveller: React.FC<{
    choix: ChoixDeTraveller;
    setChoix: (maj: (c: ChoixDeTraveller) => ChoixDeTraveller) => void;
    /** Le MD de la fiche : caractéristique + compétence (ou sa pénalité). */
    mdDeLaFiche: number;
}> = ({ choix, setChoix, mdDeLaFiche }) => {
    const md = modificateursDeTraveller(mdDeLaFiche, choix);
    const cible = cibleDeTraveller(choix);
    return (
        <div data-preparation-traveller className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"><span className={etiquette}>Difficulté</span>
                    <select aria-label="Difficulté" value={choix.difficulte} className={champ}
                        onChange={e => setChoix(c => ({ ...c, difficulte: entier(e.target.value) }))}>
                        {DIFFICULTES_DE_TRAVELLER.map(d => <option key={d.cible} value={d.cible}>{d.label} ({d.cible}+)</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-1"
                    title="Un facteur extérieur, au jugement de l'Arbitre : un dé de plus, on garde les deux meilleurs ou les deux pires. Ils s'annulent et ne se cumulent pas (p. 61).">
                    <span className={etiquette}>Circonstances</span>
                    <select aria-label="Coup de pouce ou Coup du sort" value={choix.pouceOuSort} className={champ}
                        onChange={e => setChoix(c => ({ ...c, pouceOuSort: Math.max(-1, Math.min(1, entier(e.target.value))) as -1 | 0 | 1 }))}>
                        <option value={0}>Aucune</option>
                        <option value={1}>Coup de pouce (3D, les 2 meilleurs)</option>
                        <option value={-1}>Coup du sort (3D, les 2 pires)</option>
                    </select>
                </label>
                <label className="flex items-center gap-1" title="Monter ou descendre d'un seul cran sur la table des Durées, avant de lancer (p. 62).">
                    <span className={etiquette}>Durée</span>
                    <select aria-label="Durée" value={choix.duree} className={champ}
                        onChange={e => setChoix(c => ({ ...c, duree: Math.max(-1, Math.min(1, entier(e.target.value))) as -1 | 0 | 1 }))}>
                        <option value={0}>Normale</option>
                        <option value={-1}>Plus vite (MD−2)</option>
                        <option value={1}>Plus lentement (MD+2)</option>
                    </select>
                </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1" title="Chaque action menée en même temps monte la difficulté d'un niveau : Facile devient Routine (p. 62).">
                    Actions simultanées en plus
                    <input aria-label="Actions simultanées en plus" type="number" min={0} value={choix.tachesSupplementaires} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, tachesSupplementaires: Math.max(0, entier(e.target.value)) }))} />
                </label>
                <label className="flex items-center gap-1" title="Le MD que la tâche précédente d'une chaîne donne à celle-ci, de −3 à +3 (p. 63).">
                    Chaîne de tâches
                    <input aria-label="MD de la tâche précédente" type="number" min={-3} max={3} value={choix.chaine} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, chaine: Math.max(-3, Math.min(3, entier(e.target.value))) }))} />
                </label>
                <label className="flex items-center gap-1" title="Les MD que les règles listent : viser, portée, couvert, cible à plat ventre… (p. 72).">
                    Autres MD
                    <input aria-label="Autres MD" type="number" value={choix.autre} className={`w-14 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, autre: entier(e.target.value) }))} />
                </label>
            </div>
            <span data-composition-traveller className="text-app-text/60">
                {choix.pouceOuSort === 0 ? '2D' : `3D, les deux ${choix.pouceOuSort > 0 ? 'meilleurs' : 'pires'}`} {md < 0 ? '−' : '+'} {Math.abs(md)} ;
                {' '}{cible}+ pour réussir. L’Effet est le total moins {cible}.
            </span>
        </div>
    );
};

export const SuitesTraveller: React.FC<{
    jet: JetDeTraveller;
    /** Ce qui a été lancé : composantes et réglages. */
    titre?: string;
    /** Reporter le MD au test suivant d'une chaîne de tâches. */
    reporter?: (md: number) => void;
}> = ({ jet, titre, reporter }) => {
    const t = jet.traveller;
    const suivant = mdPourLaTacheSuivante(t.effet);
    return (
        <div data-suites-traveller className="flex w-full flex-col gap-2 text-xs">
            {titre && <p className="text-app-text/60">{titre}</p>}
            <p data-effet-traveller className="font-bold">
                Effet {signe(t.effet)} : {SENS_DES_EFFETS[t.bilan]} (p. 61).
            </p>
            {t.effet >= 0 && (
                <p className="text-app-text/60">
                    Une attaque réussie inflige les dés de l’arme + {t.effet} (l’Effet), + le MD de FOR en mêlée, moins l’armure ;
                    {t.effet >= 6 ? ' avec cet Effet de 6 ou plus, au moins 1 point malgré l’armure' : ' un Effet de 6 ou plus inflige toujours au moins 1 point'} (p. 74-75).
                </p>
            )}
            <div className="flex flex-wrap items-center gap-2" data-chaine-traveller>
                <span className="text-app-text/60">Chaîne de tâches : MD{signe(suivant)} au test suivant (p. 63).</span>
                {reporter && <button type="button" className={bouton} onClick={() => reporter(suivant)}>Reporter au test suivant</button>}
            </div>
        </div>
    );
};
