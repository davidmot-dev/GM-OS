import React from 'react';
import {
    DIFFICULTES_DE_BARBARIANS, ORDRE_DE_REACTION, gesteOffert, nombreDeDesDeBarbarians, soldeDesDes,
    type ChoixDeBarbarians, type GesteDeBarbarians, type JetDeBarbarians,
} from '../../../dice/systemes/barbarians';

/**
 * **Le jet de Barbarians of Lemuria** — 27/10/2026, à la demande de David (« finir le
 * pilote »). Avant de lancer : la difficulté du livre, la défense ou l'Initiative adverse,
 * les dés de bonus et de malus. Après : les points d'héroïsme (Faveur divine, succès
 * héroïque et légendaire) et l'échec critique. Rien ne s'écrit sans un clic.
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };

export const PreparationBarbarians: React.FC<{
    choix: ChoixDeBarbarians;
    setChoix: (maj: (c: ChoixDeBarbarians) => ChoixDeBarbarians) => void;
    /** La somme des composantes retenues : attribut + carrière ou aptitude. */
    seuil: number;
}> = ({ choix, setChoix, seuil }) => {
    const solde = soldeDesDes(choix.bonus, choix.malus);
    const total = seuil + choix.difficulte + choix.autre - choix.opposition;
    const des = nombreDeDesDeBarbarians(choix.bonus, choix.malus);
    return (
        <div data-preparation-barbarians className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"><span className={etiquette}>Difficulté</span>
                    <select aria-label="Difficulté" value={choix.difficulte} className={champ}
                        onChange={e => setChoix(c => ({ ...c, difficulte: entier(e.target.value) }))}>
                        {DIFFICULTES_DE_BARBARIANS.map(d => (
                            <option key={d.label} value={d.modificateur}>
                                {d.label} ({d.modificateur > 0 ? '+' : ''}{d.modificateur}){'portee' in d ? ` — tir à portée ${d.portee}` : ''}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-1"
                    title="Au jet d'attaque, la Défense de la cible ; au jet de réaction, la plus haute Initiative des coriaces ou rivaux (p. 60, 62).">
                    {choix.reaction ? 'Initiative adverse' : 'Défense de la cible'}
                    <input aria-label="Défense ou Initiative adverse" type="number" value={choix.opposition} className={`w-14 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, opposition: entier(e.target.value) }))} />
                </label>
                <label className="flex items-center gap-1" title="Posture, horde, embuscade… ce que le MJ ajoute ou retire.">
                    Autre
                    <input aria-label="Autre modificateur" type="number" value={choix.autre} className={`w-14 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, autre: entier(e.target.value) }))} />
                </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1" title="Un avantage qui joue : trois dés, les deux meilleurs (p. 16).">
                    Dés de bonus
                    <input aria-label="Dés de bonus" type="number" min={0} value={choix.bonus} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, bonus: Math.max(0, entier(e.target.value)) }))} />
                </label>
                <label className="flex items-center gap-1" title="Un désavantage qui joue : trois dés, les deux pires (p. 17).">
                    Dés de malus
                    <input aria-label="Dés de malus" type="number" min={0} value={choix.malus} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, malus: Math.max(0, entier(e.target.value)) }))} />
                </label>
                <label className="flex items-center gap-1" title="Esprit + Initiative au début du combat : la place du héros dans l'ordre de réaction (p. 60).">
                    <input type="checkbox" checked={choix.reaction} onChange={e => setChoix(c => ({ ...c, reaction: e.target.checked }))} />
                    Jet de réaction
                </label>
            </div>
            <span data-composition-barbarians className="text-app-text/60">
                {des}d6{solde > 0 ? `, les deux meilleurs` : solde < 0 ? `, les deux pires` : ''} {total < 0 ? '−' : '+'} {Math.abs(total)} ; 9 ou plus pour réussir.
                {' '}Un double 6 réussit toujours, un double 1 échoue toujours (p. 10).
            </span>
        </div>
    );
};

export const SuitesBarbarians: React.FC<{
    jet: JetDeBarbarians;
    reaction: boolean;
    /** Les points d'héroïsme du personnage ; `undefined` : le pilote ne nomme pas le champ. */
    heroisme?: number;
    geste: (geste: GesteDeBarbarians) => void;
    faveurDivine: () => void;
    accorderUnPoint: () => void;
    /** Le point d'héroïsme d'un échec critique est-il déjà accordé ? */
    pointAccorde: boolean;
}> = ({ jet, reaction, heroisme, geste, faveurDivine, accorderUnPoint, pointAccorde }) => {
    const b = jet.barbarians;
    const peutPayer = heroisme !== undefined && heroisme > 0;
    const reste = heroisme === undefined ? '' : ` (${heroisme} sur la fiche)`;
    return (
        <div data-suites-barbarians className="flex w-full flex-col gap-2 text-xs">
            {reaction && <p data-ordre-de-reaction className="font-bold">Ordre de réaction : {ORDRE_DE_REACTION[b.bilan]} (p. 60).</p>}
            {b.seulementSurDoubleSix && b.doubleSix && <p className="text-app-text/60">Seul un double 6 pouvait réussir : réussite, sans succès héroïque (p. 56).</p>}
            <div className="flex flex-wrap items-center gap-2" data-heroisme-barbarians>
                <span className="text-app-text/60">Points d’héroïsme{reste} :</span>
                <button type="button" className={bouton} disabled={!peutPayer}
                    title="Relancer tous les dés, dés de bonus compris, et garder le second jet — même sur un double 1 (p. 58)."
                    onClick={faveurDivine}>Faveur divine : relancer (1)</button>
                {gesteOffert(b, 'heroique') && (
                    <button type="button" className={bouton} disabled={!peutPayer} title="Une réussite devient un succès héroïque (p. 59)."
                        onClick={() => geste('heroique')}>Succès héroïque (1)</button>
                )}
                {gesteOffert(b, 'legendaire') && (
                    <button type="button" className={bouton} disabled={!peutPayer}
                        title="Le double 6 devient un succès légendaire : deux options de succès héroïque au combat (p. 59)."
                        onClick={() => geste('legendaire')}>Succès légendaire (1)</button>
                )}
            </div>
            {gesteOffert(b, 'critique') && (
                <div className="flex flex-wrap items-center gap-2" data-echec-critique-barbarians>
                    <span className="text-app-text/60">Le joueur peut en faire un échec critique, qui met le héros en difficulté ce round et le suivant (p. 57).</span>
                    <button type="button" className={bouton} onClick={() => geste('critique')}>Échec critique</button>
                </div>
            )}
            {b.bilan === 'echec-critique' && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-app-text/60">Le MJ peut accorder 1 point d’héroïsme, même au-delà de la réserve (p. 57).</span>
                    <button type="button" className={bouton} disabled={pointAccorde || heroisme === undefined} onClick={accorderUnPoint}>
                        {pointAccorde ? 'Point accordé' : 'Accorder 1 point'}
                    </button>
                </div>
            )}
        </div>
    );
};
