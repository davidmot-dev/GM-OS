import { useState } from 'react';
import { DiceEngine } from '../../dice/DiceEngine';
import { RENCONTRES, TABLE_SPECIALE, estHumide, rencontreDuD100, type GenreDeTerre, type IdDeRencontre } from '../../dice/systemes/hautReve';
import {
    NOM_DES_TABLES, etatGeneralDuHautReve, lireHautReve, meilleureVoie, proposerCaseHumide, proposerDeclenchement, proposerEffetDeDragon,
    proposerEffetDecide, proposerFinDEffet, proposerLutte, proposerRefoulement, proposerRencontre, proposerResistance, proposerSort,
    reservesDuLivret, sortsDuLivret, type ChoixDeRencontre,
} from '../logic/hautReveDuVoyageur';
import { lireRepos } from '../logic/reposDuVoyageur';
import { useOperationDeVoyageur } from '../hooks/useOperationDeVoyageur';
import type { DonneesDeVoyage } from '../logic/operationsDeVoyageur';
import { CLASSE_OPERATION as classe, ValidationOperationVoyageur } from './ValidationOperationVoyageur';

/** Les genres de terres, dans l'ordre de la table des rencontres (p. 183). */
const GENRES: [GenreDeTerre, string][] = [
    ['cite', 'Cité'], ['sanctuaire', 'Sanctuaire'], ['plaines', 'Plaines'], ['pont', 'Pont'], ['collines', 'Collines'], ['foret', 'Forêt'],
    ['monts', 'Monts'], ['desert', 'Désert'], ['fleuve', 'Fleuve'], ['lac', 'Lac'], ['marais', 'Marais'], ['gouffre', 'Gouffre'],
    ['necropole', 'Nécropole'], ['desolation', 'Désolation'],
];
const nombre = (v: string) => (v.trim() === '' ? undefined : Number(v));

/** Un champ de dé : on tape le résultat de la table, ou on le fait tirer. */
function De({ libelle, faces, valeur, changer }: { libelle: string; faces: number; valeur: string; changer: (v: string) => void }) {
    return <label className="flex flex-col text-sm">{libelle}
        <span className="flex gap-1"><input aria-label={libelle} type="number" min={1} max={faces} className={`${classe} w-24`} value={valeur} onChange={e => changer(e.target.value)} />
            <button type="button" className={classe} title={`Tirer 1d${faces}`} onClick={() => changer(String(DiceEngine.roll(faces)))}>d{faces}</button></span>
    </label>;
}

/**
 * **Le Haut-Rêve du Voyageur** — 24/10/2026 (Livre du Haut-Rêve 2.3.1, p. 181–210).
 * Rencontres et cases humides des TMR, sorts et réserves, jets de résistance,
 * refoulement, queues, souffles et têtes de Dragon. La carte des TMR reste dans
 * son module ; ici, ce que ces épreuves écrivent sur la fiche.
 */
export function PanneauHautReveVoyageur({ donnees, appliquer, avantOperation, lectureSeule = false }: {
    donnees: DonneesDeVoyage; appliquer: (d: DonneesDeVoyage) => void; avantOperation?: () => boolean; lectureSeule?: boolean;
}) {
    const op = useOperationDeVoyageur(donnees, appliquer, avantOperation);
    const [genre, choisirGenre] = useState<GenreDeTerre>('cite'), [speciale, choisirSpeciale] = useState(''), [d100, noterD100] = useState('');
    const [force, noterForce] = useState(''), [choix, choisir] = useState<ChoixDeRencontre['choix']>('maitriser');
    const [maitrise, noterMaitrise] = useState(''), [d20, noterD20] = useState(''), [humide, noterHumide] = useState(''), [lutte, noterLutte] = useState('');
    const [ligne, choisirLigne] = useState(''), [lancer, noterLancer] = useState(''), [rituel, cocherRituel] = useState(false);
    const [saCase, cocherSaCase] = useState(true), [reserve, cocherReserve] = useState(false), [astro, noterAstro] = useState('0'), [heure, noterHeure] = useState('');
    const [jr, noterJr] = useState('-8'), [deJr, noterDeJr] = useState('');
    const [effet, noterEffet] = useState(''), [sousDe, noterSousDe] = useState(''), [table2, cocherTable2] = useState(true), [nonHr, cocherNonHr] = useState(false);
    const [decide, choisirDecide] = useState<'queue' | 'souffle' | 'tete'>('queue'), [motif, noterMotif] = useState('');
    let h;
    try { h = lireHautReve(donnees); } catch (e) { return <p role="alert">{(e as Error).message}</p>; }
    const repos = (() => { try { return lireRepos(donnees); } catch { return null; } })();
    const voie = meilleureVoie(donnees), etat = etatGeneralDuHautReve(donnees), sorts = sortsDuLivret(donnees);
    const reserves = reservesDuLivret(donnees).filter(r => r.nom.trim());
    const enAttente = [...h.enAttente.map(e => ({ ...e, source: e.id })), ...(repos?.effets ?? []).map(e => ({ ...e, source: `repos:${e.id}` }))];
    const apercu = (() => {
        if (speciale) return RENCONTRES.find(r => r.id === speciale)!;
        try { return d100 ? rencontreDuD100(genre, Number(d100)) : null; } catch { return null; }
    })();
    const forceAleatoire = () => {
        if (!apercu) return;
        const bonus = TABLE_SPECIALE.find(t => t.id === apercu.id && speciale)?.bonus ?? 0;
        const m = /^(\d)d(\d)$/.exec(apercu.force);
        if (m) noterForce(String(Array.from({ length: Number(m[1]) }, () => DiceEngine.roll(Number(m[2]))).reduce((a, b) => a + b, 0) + bonus));
        else { let f = 7, t; do { t = DiceEngine.roll(8) % 8; f += t; } while (t === 7); noterForce(String(f)); }
    };
    return <section aria-label="Haut-Rêve RdD" className="rounded-xl border border-accent/30 p-4 space-y-3 text-app-text bg-app-surface">
        <h3 className="font-bold text-accent">Haut-Rêve, queues et souffles</h3>
        <p className="text-sm">Rêve actuel {String(donnees.reve_pts ?? 0)} · seuil {String(donnees.reve_seuil ?? 0)} · RÊVE {String(donnees.reve ?? 0)} · meilleure voie {voie.nom} {voie.niveau} · état général {etat} · refoulement {h.refoulement}</p>
        {h.lutte && <p role="status" className="text-sm text-etat-alerte">Prisonnier : {RENCONTRES.find(r => r.id === h.lutte!.rencontre)?.nom} {h.lutte.force}, {h.lutte.rounds} round(s) de défaite.</p>}
        {h.actifs.length > 0 && <div className="space-y-1"><strong className="text-sm">Effets en cours</strong>{h.actifs.map(e => <div key={e.id} className="text-sm border border-app-border rounded p-2">
            <p><strong>{NOM_DES_TABLES[e.table]} — {e.nom}</strong>{e.precision ? ` : ${e.precision}` : ''}</p><p className="text-xs">{e.effet}</p>
            {!lectureSeule && <div className="flex flex-wrap gap-2 mt-1">
                {e.refoulable !== null && <button type="button" className={classe} disabled={!d20} onClick={() => op.proposer(id => proposerRefoulement(donnees, Number(d20), id, e.id))}>Refouler ({e.refoulable} pt, d20 ci-dessous)</button>}
                <button type="button" className={classe} onClick={() => op.proposer(id => proposerFinDEffet(donnees, e.id, id))}>Terminer</button></div>}
        </div>)}</div>}
        {reserves.length > 0 && <div className="space-y-1"><strong className="text-sm">Sorts en réserve</strong>{reserves.map(r => <p key={r.ligne} className="text-sm flex flex-wrap items-center gap-2">
            {r.nom} ({r.voie}, {r.tmr || 'case ?'}){!lectureSeule && <button type="button" className={classe} onClick={() => op.proposer(id => proposerDeclenchement(donnees, r.ligne, id))}>Déclencher</button>}</p>)}</div>}
        {lectureSeule ? <p className="text-sm">Le MJ résout les rencontres, les sorts et les effets de Dragon avec vous.</p> : <fieldset disabled={!!op.apercu} className="min-w-0 space-y-3">
            <De libelle="d20 du test de refoulement" faces={20} valeur={d20} changer={noterD20} />
            {enAttente.length > 0 && <details open><summary className="cursor-pointer font-bold">Effets de Dragon à tirer ({enAttente.length})</summary><div className="my-2 space-y-2">
                <De libelle="d100 de la table" faces={100} valeur={effet} changer={noterEffet} />
                <De libelle="d20 du désir ou de l’idée fixe" faces={20} valeur={sousDe} changer={noterSousDe} />
                <label className="text-sm block"><input type="checkbox" checked={table2} onChange={e => cocherTable2(e.target.checked)} /> Tête : table des haut-rêvants</label>
                <label className="text-sm block"><input type="checkbox" checked={nonHr} onChange={e => cocherNonHr(e.target.checked)} /> Non haut-rêvant (relance sous 29 ou 61)</label>
                {enAttente.map(e => <button key={e.source} type="button" className={`${classe} block`} disabled={!effet} onClick={() => op.proposer(id => proposerEffetDeDragon(donnees,
                    { source: e.source, d100: Number(effet), sousDe: nombre(sousDe), tableDesHautRevants: table2, nonHautRevant: nonHr }, id))}>
                    Tirer : {e.type === 'queue' ? (h.ombre ? 'ombre de Thanatos' : 'queue') : e.type === 'souffle' ? 'souffle' : 'tête'} de Dragon — {e.motif}{e.nombre > 1 ? ` (×${e.nombre})` : ''}</button>)}
            </div></details>}
            {h.lutte ? <details open><summary className="cursor-pointer font-bold">Lutter ce round</summary><div className="my-2 space-y-2">
                <De libelle="d100 de maîtrise" faces={100} valeur={lutte} changer={noterLutte} />
                <button type="button" className={classe} disabled={!lutte} onClick={() => op.proposer(id => proposerLutte(donnees, Number(lutte), id, nombre(d20)))}>Préparer le round de lutte</button>
            </div></details> : <details><summary className="cursor-pointer font-bold">Rencontre en TMR</summary><div className="my-2 space-y-2">
                <p className="text-xs">1d7 au début de chaque case ou round ; sur un 7, la table selon le genre de terre, puis la force. Maîtrise : rêve actuel, meilleure voie, moins la force, état général compris.</p>
                <label className="flex flex-col text-sm">Genre de terre<select aria-label="Genre de terre" className={classe} value={genre} onChange={e => choisirGenre(e.target.value as GenreDeTerre)}>
                    {GENRES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label className="flex flex-col text-sm">Rencontre imposée<select aria-label="Rencontre imposée" className={classe} value={speciale} onChange={e => choisirSpeciale(e.target.value)}>
                    <option value="">Tirer sur la table des rencontres</option>{RENCONTRES.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}</select></label>
                {!speciale && <De libelle="d100 des rencontres" faces={100} valeur={d100} changer={noterD100} />}
                {apercu && <p className="text-sm">{apercu.nom} — force {apercu.force}. {apercu.ignorable ? 'Peut être laissé passer.' : ''}</p>}
                <label className="flex flex-col text-sm">Force<span className="flex gap-1"><input aria-label="Force de la rencontre" type="number" className={`${classe} w-24`} value={force} onChange={e => noterForce(e.target.value)} />
                    <button type="button" className={classe} disabled={!apercu} onClick={forceAleatoire}>Tirer</button></span></label>
                <label className="flex flex-col text-sm">Choix du haut-rêvant<select aria-label="Choix face à la rencontre" className={classe} value={choix} onChange={e => choisir(e.target.value as ChoixDeRencontre['choix'])}>
                    <option value="maitriser">Maîtriser</option><option value="derober">Se dérober</option><option value="refouler">Refouler</option><option value="laisser">Laisser passer</option></select></label>
                {choix === 'maitriser' && <De libelle="d100 de maîtrise" faces={100} valeur={maitrise} changer={noterMaitrise} />}
                <button type="button" className={classe} disabled={!apercu || !force} onClick={() => op.proposer(id => proposerRencontre(donnees, {
                    genre, d100: speciale ? undefined : Number(d100), rencontreId: (speciale || undefined) as IdDeRencontre | undefined, force: Number(force), choix,
                    d100Maitrise: nombre(maitrise), d20: nombre(d20), speciale: !!speciale && TABLE_SPECIALE.some(t => t.id === speciale),
                }, id))}>Préparer la rencontre</button>
                {estHumide(genre) && <><De libelle="d100 de la case humide" faces={100} valeur={humide} changer={noterHumide} />
                    <button type="button" className={classe} disabled={!humide} onClick={() => op.proposer(id => proposerCaseHumide(donnees, Number(humide), id))}>Maîtriser la case (force 7)</button></>}
            </div></details>}
            <details><summary className="cursor-pointer font-bold">Lancer un sort</summary><div className="my-2 space-y-2">
                {!sorts.length ? <p className="text-sm">Aucun sort nommé dans la page « Sorts et rituels » du livret.</p> : <>
                    <label className="flex flex-col text-sm">Sort ou rituel<select aria-label="Sort à lancer" className={classe} value={ligne} onChange={e => choisirLigne(e.target.value)}>
                        <option value="">Choisir</option>{sorts.map(s => <option key={s.ligne} value={s.ligne}>{s.nom} — {s.voie}, R{s.difficulte}, r{s.cout}{s.bonusCase ? `, +${s.bonusCase} %` : ''}</option>)}</select></label>
                    <De libelle="d100 du lancer" faces={100} valeur={lancer} changer={noterLancer} />
                    <label className="text-sm block"><input type="checkbox" checked={saCase} onChange={e => cocherSaCase(e.target.checked)} /> Depuis la case de ses bonus</label>
                    <label className="text-sm block"><input type="checkbox" checked={rituel} onChange={e => cocherRituel(e.target.checked)} /> C’est un rituel (pas de réserve, astrologie)</label>
                    {rituel && <label className="flex flex-col text-sm">Ajustement astrologique<input aria-label="Ajustement astrologique" type="number" className={`${classe} w-24`} value={astro} onChange={e => noterAstro(e.target.value)} /></label>}
                    {!rituel && <label className="text-sm block"><input type="checkbox" checked={reserve} onChange={e => cocherReserve(e.target.checked)} /> Mettre en réserve (+1 rêve)</label>}
                    {reserve && <label className="flex flex-col text-sm">Heure de naissance de la cible<input aria-label="Heure de la cible" className={classe} value={heure} onChange={e => noterHeure(e.target.value)} /></label>}
                    <button type="button" className={classe} disabled={ligne === '' || !lancer} onClick={() => op.proposer(id => proposerSort(donnees, {
                        ligne: Number(ligne), d100: Number(lancer), rituel, astrologie: Number(astro) || 0, depuisSaCase: saCase, reserve: reserve && !rituel, heureDeLaCible: heure,
                    }, id))}>Préparer le lancer</button>
                </>}
            </div></details>
            <details><summary className="cursor-pointer font-bold">Jet de résistance</summary><div className="my-2 space-y-2">
                <label className="flex flex-col text-sm">Difficulté (r−8 en général)<input aria-label="Difficulté du JR" type="number" max={0} className={`${classe} w-24`} value={jr} onChange={e => noterJr(e.target.value)} /></label>
                <De libelle="d100 du JR" faces={100} valeur={deJr} changer={noterDeJr} />
                <button type="button" className={classe} disabled={!deJr} onClick={() => op.proposer(id => proposerResistance(donnees, Number(jr), Number(deJr), id))}>Préparer le JR</button>
            </div></details>
            <details><summary className="cursor-pointer font-bold">Noter un effet de Dragon décidé par le meneur</summary><div className="my-2 space-y-2">
                <select aria-label="Effet décidé" className={classe} value={decide} onChange={e => choisirDecide(e.target.value as typeof decide)}>
                    <option value="queue">Queue</option><option value="souffle">Souffle</option><option value="tete">Tête</option></select>
                <input aria-label="Origine de l’effet" placeholder="Origine" maxLength={120} className={classe} value={motif} onChange={e => noterMotif(e.target.value)} />
                <button type="button" className={classe} onClick={() => op.proposer(id => proposerEffetDecide(donnees, decide, motif, id))}>Noter l’effet à tirer</button>
            </div></details>
        </fieldset>}
        {!lectureSeule && <ValidationOperationVoyageur operation={op} />}
    </section>;
}
