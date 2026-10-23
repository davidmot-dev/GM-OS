import React, { useState } from 'react';
import { DiceEngine } from '../../../dice/DiceEngine';
import { agirEnAdulte, agirEnEnfant, resoudreLeTestPsychotique, type TestPsychotique } from '../../../dice/systemes/psychologieDeCrimes';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';

/**
 * **La psychologie de Crimes** — C4 (2026-10-23), livre p. 409-418.
 *
 * Les jauges de l'enquêteur et les gestes que le livre leur donne : l'angoisse
 * (que la névrose suit, p. 409, 411), la névrose (frustration, but accompli),
 * la psychose, le **test psychotique** (Mental GARDE 1 à 3 contre psychose +
 * angoisse, sans dépassement, p. 410) et l'**Innocence** des enfants (p. 415).
 * Le seuil de névrose et la déchéance se proposent sous le bandeau du meneur
 * (`franchissements`) ; ici, rien ne s'écrit sans un clic.
 */
type Regle = NonNullable<NonNullable<DescripteurDeJet['garde']>['psychologie']>;

const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'w-24 font-black uppercase tracking-widest text-ui-9 text-app-text/60';

const PsychologieDeCrimes: React.FC<{
    regle: Regle;
    valeurs: Record<string, unknown>;
    /** Le Mental actuel, marques comprises : les dés du test psychotique. */
    mentalActuel: number;
    ecrire: (maj: Record<string, number>) => void;
    consigner: (titre: string, ligne: string) => void;
}> = ({ regle, valeurs, mentalActuel, ecrire, consigner }) => {
    const n = (champ?: string) => (champ ? Math.max(0, Number(valeurs[champ]) || 0) : 0);
    const angoisse = n(regle.angoisse), nevrose = n(regle.nevrose), psychose = n(regle.psychose);
    const seuilNevrose = regle.seuilNevrose ? n(regle.seuilNevrose) : undefined;
    const [intensite, setIntensite] = useState<1 | 2 | 3>(2);
    const [test, setTest] = useState<TestPsychotique | null>(null);
    const [psychoseNotee, setPsychoseNotee] = useState(false);

    const changer = (maj: Record<string, number>, ligne: string) => { ecrire(maj); consigner('Psychologie', ligne); };
    // « L'angoisse influence la névrose : quand l'une baisse l'autre aussi, et inversement » (p. 411).
    const angoisseDe = (d: number) => {
        const a = Math.min(5, Math.max(0, angoisse + d));
        if (a === angoisse) return;
        const v = Math.max(0, nevrose + d);
        changer({ [regle.angoisse]: a, [regle.nevrose]: v }, `Angoisse ${angoisse} → ${a}, Névrose ${nevrose} → ${v}`);
    };
    const nevroseDe = (d: number, pourquoi: string) => {
        const v = Math.max(0, nevrose + d);
        if (v !== nevrose) changer({ [regle.nevrose]: v }, `Névrose ${nevrose} → ${v} (${pourquoi})`);
    };
    const psychoseDe = (d: number, pourquoi: string) => {
        const v = Math.min(10, Math.max(0, psychose + d));
        if (v !== psychose) changer({ [regle.psychose]: v }, `Psychose ${psychose} → ${v} (${pourquoi})`);
    };
    const tester = () => {
        const des = Array.from({ length: Math.max(0, mentalActuel) }, () => DiceEngine.roll(10));
        const r = resoudreLeTestPsychotique(des, intensite, psychose, angoisse);
        setTest(r);
        setPsychoseNotee(false);
        consigner('Test psychotique', `Mental ${mentalActuel} GARDE ${intensite} contre ${r.seuil} : ${r.jet.totalDisplay} — `
            + (r.calme ? 'le personnage garde son calme.' : 'état de folie, +1 Psychose à noter.'));
    };
    const inclinaison = regle.inclinaison ? String(valeurs[regle.inclinaison] ?? '').trim() : '';
    const score = regle.innocence ? n(regle.innocence.score) : 0;
    const seuilInnocence = regle.innocence ? n(regle.innocence.seuil) : 0;

    return (
        <section data-psychologie className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2" data-jauge="angoisse">
                <span className={etiquette}>Angoisse</span>
                <strong className="font-mono text-base w-10">{angoisse}/5</strong>
                <button type="button" className={bouton} onClick={() => angoisseDe(1)} disabled={angoisse >= 5}
                    title="Une ambiance ou un événement angoissants : +1, et la Névrose suit (p. 409, 411)">+1</button>
                <button type="button" className={bouton} onClick={() => angoisseDe(-1)} disabled={angoisse <= 0}
                    title="Le danger dominé ou mieux connu : −1, et la Névrose suit (p. 411)">−1</button>
                {angoisse >= 3 && <span className="text-etat-alerte">Le meneur peut exiger des jets même faciles, et un seuil de 9 pour viser (p. 383, 412).</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2" data-jauge="nevrose">
                <span className={etiquette}>Névrose</span>
                <strong className="font-mono text-base w-10">{nevrose}{seuilNevrose ? `/${seuilNevrose}` : ''}</strong>
                <button type="button" className={bouton} onClick={() => nevroseDe(1, 'passion frustrée ou passion taboue assouvie')}
                    title="Une passion frustrée, ou une passion taboue assouvie (p. 409)">Frustration +1</button>
                <button type="button" className={bouton} onClick={() => nevroseDe(-1, 'but accompli ou passion assouvie')} disabled={nevrose <= 0}
                    title="Un but important accompli, ou une passion à laquelle il s'adonne (p. 409)">But accompli −1</button>
                {seuilNevrose !== undefined && seuilNevrose > 0 && nevrose >= seuilNevrose
                    && <span className="text-etat-danger">Seuil atteint : la décompensation se propose sous le bandeau.</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2" data-jauge="psychose">
                <span className={etiquette}>Psychose</span>
                <strong className="font-mono text-base w-10">{psychose}/10</strong>
                <button type="button" className={bouton} onClick={() => psychoseDe(1, 'échec critique sur une passion, ou dans l’histoire')}
                    title="Échec critique sur un jet de passion ou dans l'histoire (p. 410)">+1</button>
                <button type="button" className={bouton} onClick={() => psychoseDe(-1, 'thérapie ou succès important')} disabled={psychose <= 0}
                    title="Un mois de thérapie avec un aliéniste, ou un succès important dans le jeu (p. 410)">−1</button>
                {psychose >= 6 && <span className="text-etat-alerte">Dès 6 : l'état de folie revient à chaque seuil de névrose (p. 410).</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-app-border/30 pt-2" data-test-psychotique>
                <span className={etiquette}>Test psychotique</span>
                <select value={intensite} onChange={e => setIntensite(Number(e.target.value) as 1 | 2 | 3)} data-intensite
                    className="bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold">
                    <option value={1}>GARDE 1 — un proche, une créature (le pire)</option>
                    <option value={2}>GARDE 2</option>
                    <option value={3}>GARDE 3 — un inconnu, un danger indistinct</option>
                </select>
                <span className="font-mono text-app-text/50">Mental {mentalActuel} contre {Math.min(10, Math.max(2, psychose + angoisse))}</span>
                <button type="button" className={bouton} onClick={tester} disabled={mentalActuel <= 0}
                    title="Mental GARDE X contre psychose + angoisse ; pas de dépassement ; une réussite garde le calme (p. 410)">Lancer le test psychotique</button>
            </div>
            {test && (
                <div className="flex flex-wrap items-center gap-2" data-issue-psychotique>
                    <span className="font-mono">{test.jet.rolls.map(d => (d.isDropped ? `(${d.val})` : String(d.val))).join(' ')}</span>
                    {test.calme ? (
                        <strong className="text-etat-succes">Calme gardé.</strong>
                    ) : (
                        <>
                            <strong className="text-etat-danger">
                                État de folie{inclinaison ? ` selon l'inclinaison « ${inclinaison} »` : ''}, choisi par le meneur.
                            </strong>
                            {!psychoseNotee && (
                                <button type="button" className={`${bouton} border-etat-danger/50 text-etat-danger`}
                                    onClick={() => { psychoseDe(1, 'test psychotique raté'); setPsychoseNotee(true); }}>
                                    Noter +1 Psychose
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {regle.innocence && seuilInnocence > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-app-border/30 pt-2" data-jauge="innocence">
                    <span className={etiquette}>Innocence</span>
                    <strong className="font-mono text-base w-10">{score}/{seuilInnocence}</strong>
                    <button type="button" className={bouton} disabled={score <= 0}
                        title="Annuler un 1 (après le jet), jeter et garder un dé de plus (avant), ou tenter une action désespérée et naïve (p. 416)"
                        onClick={() => changer({ [regle.innocence!.score]: score - 1 }, `Innocence dépensée : ${score} → ${score - 1}`)}>
                        Dépenser un point
                    </button>
                    <button type="button" className={bouton} onClick={() => {
                        const r = agirEnAdulte(score, seuilInnocence);
                        changer({ [regle.innocence!.score]: r.score, [regle.innocence!.seuil]: r.seuil }, `Agit en adulte : seuil ${seuilInnocence} → ${r.seuil}, score ${score} → ${r.score}. ${r.potentiel}`);
                    }}>Agit en adulte</button>
                    <button type="button" className={bouton} onClick={() => {
                        const r = agirEnEnfant(score, seuilInnocence);
                        changer({ [regle.innocence!.seuil]: r.seuil }, `Agit en enfant : seuil ${seuilInnocence} → ${r.seuil}.${r.potentiel ? ` ${r.potentiel}` : ''}`);
                    }}>Agit en enfant</button>
                </div>
            )}
        </section>
    );
};

export default PsychologieDeCrimes;
