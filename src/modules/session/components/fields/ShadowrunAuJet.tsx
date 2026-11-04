import React from 'react';
import {
    DES_DE_RISQUE_CONSEILLES, DIFFICULTES_DE_SHADOWRUN, LIBELLES_DU_RISQUE, RR_MAXIMALE,
    type ChoixDeShadowrun, type JetDeShadowrun, type NiveauDeRisque, type ReserveDeShadowrun,
} from '../../../dice/systemes/shadowrun';

/**
 * **Le jet de Shadowrun : Anarchy 2.0** — 31/10/2026, à la demande de David (« finir le pilote »).
 * Avant de lancer : le seuil du livre, la spécialisation, les dés de risque (la table « Combien
 * prendre de dés de risque ? » en raccourcis), la RR, l'avantage et ce qui le donne. Après : les
 * succès nets, la complication et ce qu'elle rapporte, la relance payée en Anarchy.
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };
const NIVEAUX: NiveauDeRisque[] = ['faible', 'normal', 'fort', 'extreme'];

export const PreparationShadowrun: React.FC<{
    choix: ChoixDeShadowrun;
    setChoix: (maj: (c: ChoixDeShadowrun) => ChoixDeShadowrun) => void;
    reserve?: ReserveDeShadowrun & { rrDeLaCompetence?: number };
    difficulte: number;
    setDifficulte: (n: number) => void;
    /** Les points d'Anarchy de la fiche ; absents, l'avantage ne s'achète pas d'ici. */
    anarchy?: number;
}> = ({ choix, setChoix, reserve, difficulte, setDifficulte, anarchy }) => {
    const rr = reserve?.rr ?? 0;
    const situation = Math.max(-1, Math.min(1, choix.situation));
    return (
        <div data-preparation-shadowrun className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1">
                <span className={etiquette}>Seuil</span>
                {DIFFICULTES_DE_SHADOWRUN.map(d => (
                    <button key={d.seuil} type="button" aria-pressed={difficulte === d.seuil}
                        className={`${bouton} ${difficulte === d.seuil ? 'border-accent text-accent' : ''}`}
                        title={`${d.seuil} succès (p. 64) ; en test opposé, le seuil est le nombre de succès de l'adversaire.`}
                        onClick={() => setDifficulte(d.seuil)}>
                        {d.label} ({d.seuil})
                    </button>
                ))}
            </div>
            {!reserve?.alternatif && (
                <div className="flex flex-wrap items-center gap-1">
                    <span className={etiquette}>Risque</span>
                    {NIVEAUX.map(niveau => {
                        const conseil = DES_DE_RISQUE_CONSEILLES[rr as 0 | 1 | 2 | 3][niveau];
                        const des = Math.min(conseil ?? reserve?.des ?? 0, reserve?.des ?? 0);
                        return (
                            <button key={niveau} type="button" aria-pressed={reserve?.risque === des} disabled={conseil === null}
                                className={`${bouton} ${reserve?.risque === des ? 'border-accent text-accent' : ''}`}
                                title={`Action ${LIBELLES_DU_RISQUE[niveau].toLowerCase()} à RR ${rr} : ${conseil ?? '—'} dés de risque (p. 71).`}
                                onClick={() => setChoix(c => ({ ...c, desDeRisque: des }))}>
                                {LIBELLES_DU_RISQUE[niveau]} ({conseil === null ? '—' : des})
                            </button>
                        );
                    })}
                    <label className="flex items-center gap-1 ml-2" title="De 0 à toute la réserve : leurs succès comptent double, leurs 1 font les complications (p. 70).">
                        Dés de risque
                        <input aria-label="Dés de risque" type="number" min={0} max={reserve?.des ?? 0} value={reserve?.risque ?? 0} className={`w-14 ${champ}`}
                            onChange={e => setChoix(c => ({ ...c, desDeRisque: Math.max(0, entier(e.target.value)) }))} />
                    </label>
                </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"
                    title="La réduction du risque des atouts : elle ignore autant de 1 sur les dés de risque, 3 au plus (p. 71). Proposée d'après la ligne de la compétence.">
                    RR
                    <select aria-label="Réduction du risque" value={rr} className={champ}
                        onChange={e => setChoix(c => ({ ...c, rr: entier(e.target.value) }))}>
                        {Array.from({ length: RR_MAXIMALE + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {reserve?.rrDeLaCompetence !== undefined && <span className="text-app-text/50">fiche : {reserve.rrDeLaCompetence}</span>}
                </label>
                <label className="flex items-center gap-1" title="Spécialisation adéquate : +2 dés (p. 52).">
                    <input type="checkbox" checked={choix.specialisation} onChange={e => setChoix(c => ({ ...c, specialisation: e.target.checked }))} />
                    Spécialisation (+2 dés)
                </label>
                <label className="flex items-center gap-1" title="Conditions jugées par le meneur : avantage, 4+ réussit ; désavantage, 6 seul (p. 65).">
                    Situation
                    <select aria-label="Situation" value={situation} className={champ}
                        onChange={e => setChoix(c => ({ ...c, situation: entier(e.target.value) }))}>
                        <option value={1}>Avantage</option>
                        <option value={0}>Neutre</option>
                        <option value={-1}>Désavantage</option>
                    </select>
                </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                {anarchy !== undefined && (
                    <label className="flex items-center gap-1"
                        title="Déclaré avant le jet, justifié par un comportement, une réplique, un atout, un équipement ou le plan (p. 77). Retiré de la fiche au lancer.">
                        <input type="checkbox" checked={choix.anarchyPourAvantage} disabled={anarchy < 1 && !choix.anarchyPourAvantage}
                            onChange={e => setChoix(c => ({ ...c, anarchyPourAvantage: e.target.checked }))} />
                        1 point d'Anarchy : avantage <span className="text-app-text/50">({anarchy} restant{anarchy > 1 ? 's' : ''})</span>
                    </label>
                )}
                <label className="flex items-center gap-1" title="Une blessure légère impose un désavantage jusqu'à la fin de la prochaine narration du personnage (p. 68).">
                    <input type="checkbox" checked={choix.blessureLegereRecente} onChange={e => setChoix(c => ({ ...c, blessureLegereRecente: e.target.checked }))} />
                    Blessure légère récente
                </label>
                <label className="flex items-center gap-1" title="Astral, Sorcellerie, Conjuration, pouvoir d'adepte : l'Essence perdue annule des succès (p. 60).">
                    <input type="checkbox" checked={choix.magie} onChange={e => setChoix(c => ({ ...c, magie: e.target.checked }))} />
                    Test de magie
                </label>
                {choix.magie && <label className="flex items-center gap-1"><input type="checkbox" checked={!!choix.drain} onChange={e => setChoix(c => ({ ...c, drain: e.target.checked }))} /> Action soumise au drain (Sorcellerie / Conjuration)</label>}
                <label className="flex items-center gap-1"><input type="checkbox" checked={!!choix.social} onChange={e => setChoix(c => ({ ...c, social: e.target.checked }))} /> Test social affecté par l’Essence (choix du meneur)</label>
            </div>
            {reserve && (
                <span data-composition-shadowrun className="text-app-text/60">
                    Réserve {reserve.base}{reserve.specialisation > 0 && ' +2 de spécialisation'} = <strong className="text-app-text">{reserve.des} dé{reserve.des > 1 ? 's' : ''}</strong>
                    {reserve.alternatif
                        ? `, et ${reserve.speciaux} dé${reserve.speciaux > 1 ? 's' : ''} spécia${reserve.speciaux > 1 ? 'ux' : 'l'} (règle de risque alternative, p. 72)`
                        : `, dont ${reserve.risque} de risque (action normale : ${reserve.risqueNormal})`}
                    {' '}— succès sur {reserve.valeurDuSucces === 4 ? '4, 5 ou 6' : reserve.valeurDuSucces === 6 ? '6 seulement' : '5 ou 6'}
                    {reserve.sources.length > 0 && ` (${reserve.sources.join(', ')})`}.
                </span>
            )}
        </div>
    );
};

export const SuitesShadowrun: React.FC<{
    jet: JetDeShadowrun;
    /** Les points d'Anarchy de la fiche, s'ils s'y écrivent : la relance se paie. */
    anarchy?: number;
    relancer?: () => void;
}> = ({ jet, anarchy, relancer }) => {
    const s = jet.shadowrun;
    return (
        <div data-suites-shadowrun className="flex w-full flex-col gap-1 text-xs text-app-text/70">
            {s.reussi && s.nets > 0 && (
                <span>{s.nets} succès net{s.nets > 1 ? 's' : ''}{s.exceptionnelle ? ' : réussite exceptionnelle, au-delà des attentes (p. 64)' : ''} — au combat, ils s'ajoutent à la VD de l'arme (p. 66).</span>
            )}
            {s.complication === 'mineure' && <span className="text-etat-alerte">Complication mineure : un petit imprévu, le test reste {s.reussi ? 'réussi' : 'échoué'} (p. 70).</span>}
            {s.complication === 'critique' && (
                <span className="text-etat-danger">Complication critique : un effet grave pour la scène ; le meneur peut forcer l'échec (p. 70).{s.anarchyGagnee ? ` +${s.anarchyGagnee} point d'Anarchy (p. 77).` : ''}</span>
            )}
            {s.complication === 'desastre' && (
                <span className="text-etat-danger">Désastre : toute l'équipe doit changer ses plans ; le test échoue (p. 70).{s.anarchyGagnee ? ` +${s.anarchyGagnee} points d'Anarchy (p. 77).` : ''}</span>
            )}
            {s.relance && <span>Relancé : la complication est celle du premier jet (p. 77).</span>}
            {relancer && anarchy !== undefined && (
                <span className="flex items-center gap-2">
                    <button type="button" className={bouton} disabled={anarchy < 1} onClick={relancer}
                        title="Relance tous les dés, mêmes dés de risque et même (dés)avantage ; les complications du premier jet restent (p. 77).">
                        Relancer — 1 point d'Anarchy
                    </button>
                    <span className="text-app-text/50">{anarchy} restant{anarchy > 1 ? 's' : ''}</span>
                </span>
            )}
        </div>
    );
};
