import { useRef, useState } from 'react';
import { CLE_SUIVI_FATIGUE, EFFORTS_DU_VOYAGEUR, etatDuVoyageur, proposerFatigue, suiviFatigueActif,
    type DonneesDeFatigue, type EffortDuVoyageur, type PropositionDeFatigue } from '../logic/fatigueDuVoyageur';

type Trace = {id: string; motif: string; avant: number; apres: number; enduranceAvant: number; enduranceApres: number};
/** Même panneau MJ/tablette : les propositions sont absolues, jamais des deltas réseau. */
export function PanneauFatigueVoyageur({donnees, appliquer, avantOperation}: {
    donnees: DonneesDeFatigue; appliquer: (maj: DonneesDeFatigue) => void; avantOperation?: () => boolean;
}) {
    const [effort, setEffort] = useState<EffortDuVoyageur>('intellectuel');
    const [quantite, setQuantite] = useState('1');
    const [taux, setTaux] = useState('2');
    const [erreur, setErreur] = useState('');
    const [proposition, setProposition] = useState<{valeur: PropositionDeFatigue; source: string} | null>(null);
    const enCours = useRef(false);
    let etat;
    try {etat = etatDuVoyageur(donnees);} catch (e) {return <section aria-label="Fatigue et état général" className="rounded-xl border border-app-border p-4 space-y-2">
        <p role="alert" className="text-sm text-etat-alerte">{String((e as Error).message)}</p>
        {suiviFatigueActif(donnees) && !donnees.__rddSante231 && <button type="button" className="rounded border border-app-border px-3 py-2" onClick={() => {
            if (avantOperation && !avantOperation()) return;
            appliquer({[CLE_SUIVI_FATIGUE]: 0});
        }}>Revenir au suivi manuel</button>}
    </section>;}
    const classe = 'min-w-0 max-w-full rounded border border-app-border bg-app-bg px-3 py-2 text-app-text';
    const traces = Array.isArray(donnees.__rddMouvementsFatigue) ? donnees.__rddMouvementsFatigue as Trace[] : [];
    const proposer = (valeur: PropositionDeFatigue) => {setProposition({valeur, source: JSON.stringify(donnees)});setErreur('');};
    return <section aria-label="Fatigue et état général" className="rounded-xl border border-accent/30 bg-app-surface p-4 space-y-3 text-app-text">
        <h3 className="font-bold">Fatigue et état général</h3>
        {!suiviFatigueActif(donnees) ? <>
            <p className="text-sm">Activer le suivi conserve les valeurs actuelles : fatigue {etat.fatigue}, endurance {etat.endurance}.
                Ensuite, une perte d’endurance ajoute la fatigue correspondante. Les efforts et le sommeil se valident après aperçu.</p>
            <button type="button" className={classe} onClick={() => {
                if (avantOperation && !avantOperation()) return;
                appliquer({[CLE_SUIVI_FATIGUE]: 1, __rddAvantFatigue231: donnees.__rddAvantFatigue231 ?? structuredClone(donnees)});
            }}>Activer le suivi de fatigue</button>
        </> : <>
            <p className="font-bold" role="status">Fatigue {etat.fatigue} / {etat.maximum} · État général {etat.total}</p>
            <p className="text-sm">Fatigue {etat.fatigueMalus} + vie manquante {etat.vieMalus} + éthylisme {etat.ethylismeMalus}
                {' + '}surencombrement {etat.encombrementMalus}.</p>
            <div className="space-y-1" aria-label="Piste de fatigue">
                {[0,-1,-2,-3,-4,-5,-6,-7].map(ligne => <div key={ligne} className="flex gap-2 items-center text-sm">
                    <span className="font-mono w-6">{ligne}</span>
                    {etat.segments.filter(s => s.ligne === ligne).map((s, i) => <span key={i}
                        className={`rounded border px-2 py-1 ${s.cochees ? 'border-accent text-accent' : 'border-app-border text-app-text/60'}`}
                        aria-label={`Ligne ${ligne}, segment ${i + 1} : ${s.cochees} sur ${s.taille}`}>
                        {s.cochees}/{s.taille}
                    </span>)}
                </div>)}
            </div>
            {etat.assomme && <p role="alert" className="text-etat-alerte">Assommé de fatigue. Récupérer au moins un segment depuis la piste pleine avant le réveil.</p>}
            {etat.avertissements.map(a => <p role="status" key={a} className="text-sm text-etat-alerte">{a}</p>)}
            <div className="flex flex-wrap gap-3 items-end">
                <label className="min-w-0 max-w-full flex flex-col gap-1 text-sm">Effort ou récupération
                    <select className={classe} value={effort} onChange={e => {setEffort(e.target.value as EffortDuVoyageur);setProposition(null);}}>
                        {Object.entries(EFFORTS_DU_VOYAGEUR).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">Quantité
                    <input className={`${classe} w-24`} type="number" min={1} max={10000} value={quantite}
                        onChange={e => {setQuantite(e.target.value);setProposition(null);}} />
                </label>
                {effort === 'extenuant' && <label className="flex flex-col gap-1 text-sm">Cases par heure
                    <input type="number" min={2} max={6} value={taux} className={`${classe} w-24`}
                        onChange={e => {setTaux(e.target.value);setProposition(null);}} />
                </label>}
                <button type="button" className={classe} onClick={() => {
                    try {proposer(proposerFatigue(donnees, effort, Number(quantite), Number(taux)));}
                    catch (e) {setErreur((e as Error).message);setProposition(null);}
                }}>Prévisualiser</button>
            </div>
            <p className="text-xs text-app-text/60">Une heure draconique vaut 120 minutes. Le sommeil proposé ici ne récupère que la fatigue,
                en respectant l’endurance actuellement manquante ; la récupération d’endurance et les blessures seront traitées séparément.</p>
            <p className="text-xs text-app-text/60">Alcool : aux degrés 1 à 3, la fatigue est différée. Inscrivez-la après 30 minutes sans boire,
                ou avec la prochaine perte d’alcool au degré 4 ou plus. Fatigue différée : {String(donnees.fatigue_differee ?? 0)}.</p>
            <details>
                <summary className="cursor-pointer text-sm">Éthylisme et surencombrement</summary>
                <form className="flex flex-wrap gap-3 items-end mt-2" onSubmit={e => {
                    e.preventDefault();const f = new FormData(e.currentTarget);
                    const maj = {ethylisme: Number(f.get('ethylisme')), surencombrement: Number(f.get('surencombrement'))};
                    try {
                        etatDuVoyageur({...donnees, ...maj});
                        proposer({maj, motif: 'Éthylisme et surencombrement ajustés par la table', avant: etat.fatigue,
                            apres: etat.fatigue, enduranceAvant: etat.endurance, enduranceApres: etat.endurance});
                    } catch (err) {setErreur((err as Error).message);setProposition(null);}
                }}>
                    <label className="text-sm flex flex-col gap-1">Degré d’éthylisme (0–7)
                        <input name="ethylisme" type="number" min={0} max={7} required defaultValue={-etat.ethylismeMalus} className={`${classe} w-28`} />
                    </label>
                    <label className="text-sm flex flex-col gap-1">Points de surencombrement retenus par le gardien
                        <input name="surencombrement" type="number" min={0} required defaultValue={-etat.encombrementMalus} className={`${classe} w-28`} />
                    </label>
                    <button className={classe}>Proposer les modificateurs</button>
                </form>
            </details>
            {!donnees.__rddSante231 && <details><summary className="cursor-pointer text-sm">Suivi manuel</summary>
                <p className="text-xs my-2">Désactiver conserve les compteurs et leur historique. Le malus devra ensuite être saisi dans la difficulté du jet.</p>
                <button type="button" className={classe} onClick={() => {
                    if (avantOperation && !avantOperation()) return;
                    appliquer({[CLE_SUIVI_FATIGUE]: 0});
                }}>Revenir au suivi manuel</button>
            </details>}
            {proposition && <div aria-label="Aperçu du mouvement" className="p-3 rounded border border-accent space-y-2">
                <p className="text-sm">{proposition.valeur.motif} : fatigue {proposition.valeur.avant} → {proposition.valeur.apres},
                    endurance {proposition.valeur.enduranceAvant} → {proposition.valeur.enduranceApres}.
                    {' '}État général proposé : {etatDuVoyageur({...donnees, ...proposition.valeur.maj}).total}.</p>
                <button type="button" className="rounded px-3 py-2 bg-accent text-app-bg font-bold" onClick={() => {
                    if (enCours.current) return;
                    if (proposition.source !== JSON.stringify(donnees)) {setProposition(null);setErreur('La fiche a changé : refaire l’aperçu.');return;}
                    if (avantOperation && !avantOperation()) return;
                    enCours.current = true;
                    try {
                        const id = crypto.randomUUID();
                        const trace = {id, ...proposition.valeur};
                        appliquer({...proposition.valeur.maj, __rddOperationFatigue: id, __rddMouvementsFatigue: [...traces, trace].slice(-30)});
                        setProposition(null);setErreur('');
                    } finally {enCours.current = false;}
                }}>Appliquer le mouvement</button>
            </div>}
            {traces.length > 0 && <details><summary className="text-sm cursor-pointer">Derniers mouvements ({traces.length})</summary>
                <ul className="text-xs space-y-1 mt-2">{traces.slice().reverse().map(t => <li key={t.id}>{t.motif} : fatigue {t.avant} → {t.apres}, endurance {t.enduranceAvant} → {t.enduranceApres}</li>)}</ul>
            </details>}
        </>}
        {erreur && <p role="alert" className="text-sm text-etat-danger">{erreur}</p>}
    </section>;
}
