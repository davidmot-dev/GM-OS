import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEGRES_DE_REUSSITE, cleI18nDuDegre, type DegreDeReussite } from '../../dice/degresDeReussite';
import { DiceEngine } from '../../dice/DiceEngine';
import { lireSanteVoyageur } from '../logic/santeDuVoyageur';
import { initialiserRepos, lireRepos, preparerGuerison, proposerChateauDormant, proposerRepos } from '../logic/reposDuVoyageur';
import { operationDeVoyageur, type DonneesDeVoyage } from '../logic/operationsDeVoyageur';
import { useOperationDeVoyageur } from '../hooks/useOperationDeVoyageur';
import { CLASSE_OPERATION as classe, ValidationOperationVoyageur } from './ValidationOperationVoyageur';
import { bandesDuJet } from '../../dice/systemes/revesDeDragons';
import { degreDuDe } from '../../dice/degresDeReussite';
import type { SituationDeMoral } from '../logic/moralDuVoyageur';

export function PanneauReposVoyageur({donnees,appliquer,avantOperation,lectureSeule = false}: {
    donnees: DonneesDeVoyage; appliquer: (d:DonneesDeVoyage) => void; avantOperation?: () => boolean; lectureSeule?: boolean;
}) {
    const {t} = useTranslation(['modules','common']);
    const [restants,setRestants] = useState<Record<string,string>>({}), [maladie,setMaladie] = useState<boolean | null>(null);
    const [sommeil,setSommeil] = useState(false), [minutes,setMinutes] = useState('20'), [reveAutorise,setReveAutorise] = useState(true);
    const [ddr,setDdr] = useState(''), [maitrise,setMaitrise] = useState('');
    const [nomNuit,setNomNuit] = useState(''), [controles,setControles] = useState(false);
    const [jets,setJets] = useState<Record<string,string>>({}), [herbes,setHerbes] = useState<Record<string,string>>({});
    const [deVie,setDeVie] = useState(''), [decoction,setDecoction] = useState('0');
    const [vieEligible,setVieEligible] = useState(false);
    const [stressDe,setStressDe]=useState(''),[stressSecond,setStressSecond]=useState(''),[moralDe,setMoralDe]=useState('');
    const [situationMoral,setSituationMoral]=useState<SituationDeMoral>('neutre'),[chanceDepensee,setChanceDepensee]=useState(false);
    const [destineeBlessures,setDestineeBlessures]=useState<Record<string,boolean>>({}),[destineeVie,setDestineeVie]=useState(false);
    const op = useOperationDeVoyageur(donnees,d => {appliquer(d);setDdr('');setMaitrise('');setJets({});setHerbes({});setDeVie('');setNomNuit('');setControles(false);setDecoction('0');setStressDe('');setStressSecond('');setMoralDe('');setChanceDepensee(false);setDestineeBlessures({});setDestineeVie(false);},avantOperation);
    let r,s;try {r = lireRepos(donnees);s = lireSanteVoyageur(donnees);} catch(e) {return <p role="alert">{(e as Error).message}</p>;}
    if (!s) return null;
    const maladieActuelle = maladie ?? r?.maladieOuPoison ?? false;
    const exigibles = s.blessures.filter(b => b.soinsComplets && b.guerison && r && b.guerison.prochainJour <= r.jour);
    const manuscrits = (v: Record<string,string>) => Object.fromEntries(Object.entries(v).filter(([,s]) => s.trim()).map(([k,s]) => [k,Number(s)]));
    return <section aria-label="Repos et Château Dormant RdD" className="p-4 rounded-xl border border-accent/30 bg-app-surface text-app-text space-y-3">
        <h3 className="font-bold text-accent">Repos et Château Dormant</h3>
        <p className="text-sm">{r ? `Journée de suivi ${r.jour+1} · ${r.heuresDormies} heure(s) de sommeil déclarée(s).` : 'Aucune récupération ni avance des jours à l’ouverture de la fiche.'}</p>
        <fieldset disabled={!!op.apercu} className="min-w-0 space-y-3">
        {lectureSeule ? <p className="text-sm">Le MJ prépare et valide les repos et les bilans de nuit.</p> : !r ? <>
            <p className="text-sm">Pour les blessures déjà soignées, reportez le délai restant jusqu’au prochain test : 0 signifie ce soir. Le jour des soins est exclu.</p>
            {s.blessures.filter(b => b.soinsComplets).map(b => <label key={b.id} className="text-sm flex flex-col">Jours restant — {b.gravite} {b.localisation || b.id}
                <input className={classe} type="number" min={0} max={6} value={restants[b.id] ?? ''} onChange={e => setRestants(v=>({...v,[b.id]:e.target.value}))} /></label>)}
            <label className="text-sm block"><input type="checkbox" checked={maladieActuelle} onChange={e => setMaladie(e.target.checked)} /> Maladie ou empoisonnement encore actif</label>
            <label className="text-sm block"><input type="checkbox" checked={vieEligible} onChange={e => setVieEligible(e.target.checked)} /> PV déjà éligibles ce soir : dernière blessure, maladie ou poison guéri avant aujourd’hui</label>
            <button type="button" className={classe} disabled={!!op.apercu} onClick={() => op.proposer(id => initialiserRepos(donnees,manuscrits(restants),maladieActuelle,id,vieEligible))}>Préparer le suivi du repos</button>
        </> : <>
            <details><summary className="cursor-pointer font-bold">Préparer un repos</summary>
                <div className="space-y-3 my-3">
                    <label className="text-sm flex flex-col">Nature du repos<select aria-label="Nature du repos" className={classe} value={sommeil ? 'sommeil' : 'veille'} onChange={e => {setSommeil(e.target.value === 'sommeil');op.annuler();}}>
                        <option value="veille">Repos éveillé</option><option value="sommeil">Une heure complète de sommeil (120 minutes)</option></select></label>
                    {!sommeil && <label className="text-sm flex flex-col">Minutes de repos éveillé<input className={classe} type="number" step={5} min={5} max={120} value={minutes} onChange={e => {setMinutes(e.target.value);op.annuler();}} /></label>}
                    {sommeil && <>
                        <p className="text-xs">Procédez heure par heure pour appliquer les limites dans l’ordre. Quittez les TMR avant de dormir. Aucun repos n’est déclenché par Clock-OS.</p>
                        <label className="text-sm block"><input type="checkbox" checked={reveAutorise} onChange={e => {setReveAutorise(e.target.checked);op.annuler();}} /> Récupération de rêve autorisée : heure complète, sans montée en TMR au début ou à la fin, sans effet contraire</label>
                        {reveAutorise && Number(donnees.reve_pts) < Number(donnees.reve_seuil) && <>
                            <label className="text-sm flex flex-col">Tirages DDR (0 à 7, séparés par des espaces)<input className={classe} value={ddr} onChange={e => {setDdr(e.target.value);op.annuler();}} /></label>
                            <button type="button" className={classe} disabled={!!op.apercu} onClick={() => {
                                const des:number[] = [];let de:number;
                                do {de = DiceEngine.roll(8)%8;des.push(de);} while (de === 7 && des.length < 100);
                                setDdr(des.join(' '));setMaitrise('');
                            }}>Tirer la récupération de rêve</button>
                            {ddr.trim().split(/[\s,;]+/)[0] === '7' && <>
                                <p className="text-sm">Rêve de Dragon : points de rêve actuels / Draconic − force du rêve, avec l’état après repos. Pas de dérobade ni de refoulement. À zéro rêve, échec total automatique. Résolvez la maîtrise avant l’aperçu.</p>
                                <label className="text-sm flex flex-col">Résultat de maîtrise du Rêve<select aria-label="Résultat de maîtrise du Rêve" className={classe} value={maitrise} onChange={e => {setMaitrise(e.target.value);op.annuler();}}>
                                    <option value="">À résoudre</option>{DEGRES_DE_REUSSITE.map(d => <option key={d} value={d}>{t(cleI18nDuDegre(d))}</option>)}</select></label>
                            </>}
                        </>}
                    </>}
                    <button type="button" className={classe} disabled={!!op.apercu} onClick={() => op.proposer(id => proposerRepos(donnees,sommeil,sommeil ? 120 : Number(minutes),reveAutorise,
                        ddr.trim() ? ddr.trim().split(/[\s,;]+/).map(Number) : [],maitrise ? maitrise as DegreDeReussite : undefined,id))}>Prévisualiser le repos</button>
                </div>
            </details>
            <details><summary className="cursor-pointer font-bold">Bilan de fin du Château Dormant</summary>
                <div className="space-y-3 my-3">
                    <label className="text-sm flex flex-col">Nuit ou date de jeu (unique)<input className={classe} maxLength={120} placeholder="Ex. 5 Dragon" value={nomNuit} onChange={e => {setNomNuit(e.target.value);op.annuler();}} /></label>
                    <label className="text-sm block"><input type="checkbox" checked={maladieActuelle} onChange={e => {setMaladie(e.target.checked);op.annuler();}} /> Maladie ou empoisonnement encore actif</label>
                    <p className="text-sm">Ordre : stress après une heure de sommeil ; famine ; guérisons et vie ; moral ; chance ; rêve au-dessus du seuil ; enchantements non permanents. Le stress utilise les points de rêve avant leur perte nocturne.</p>
                    <label className="text-sm block"><input type="checkbox" checked={controles} onChange={e => setControles(e.target.checked)} /> Famine traitée ou sans objet ; enchantements non permanents vérifiés</label>
                    {Number(donnees.stress ?? 0)>0&&r.heuresDormies>0&&<>
                        <p className="text-xs">Stress : rêve actuel {String(donnees.reve_pts)} à zéro, sans état ni astrologie.</p>
                        <label className="flex flex-col text-sm">d100 de stress<input aria-label="d100 de stress" type="number" min={1} max={100} className={classe} value={stressDe} onChange={e=>setStressDe(e.target.value)} /></label>
                        <button type="button" className={classe} onClick={()=>{setStressDe(String(DiceEngine.roll(100)));setStressSecond('');}}>Tirer le stress</button>
                        {stressDe&&degreDuDe(Number(stressDe),bandesDuJet(Number(donnees.reve_pts),0))==='reussite-particuliere'&&<>
                            <label className="flex flex-col text-sm">Second d100 de stress<input aria-label="Second d100 de stress" type="number" min={1} max={100} className={classe} value={stressSecond} onChange={e=>setStressSecond(e.target.value)} /></label>
                            <button type="button" className={classe} onClick={()=>setStressSecond(String(DiceEngine.roll(100)))}>Tirer la double particulière</button>
                        </>}
                    </>}
                    <label className="flex flex-col text-sm">Situation du moral au matin<select aria-label="Moral au matin" className={classe} value={situationMoral} onChange={e=>setSituationMoral(e.target.value as SituationDeMoral)}>
                        <option value="neutre">Neutre</option><option value="heureuse">Heureuse</option><option value="malheureuse">Malheureuse</option></select></label>
                    <label className="flex flex-col text-sm">d20 de moral au matin<input aria-label="d20 de moral au matin" type="number" min={1} max={20} className={classe} value={moralDe} onChange={e=>setMoralDe(e.target.value)} /></label>
                    <button type="button" className={classe} onClick={()=>setMoralDe(String(DiceEngine.roll(20)))}>Tirer le moral au matin</button>
                    <label className="text-sm block"><input type="checkbox" checked={chanceDepensee} onChange={e=>setChanceDepensee(e.target.checked)} /> Chance dépensée aujourd’hui hors du suivi automatique</label>
                    {exigibles.map(b => <div key={b.id} className="rounded border border-app-border p-2 space-y-2">
                        <strong>Guérison — {b.gravite} {b.localisation || b.id}</strong>
                        <p className="text-xs">CONSTITUTION à {preparerGuerison(donnees,b,Number(herbes[b.id] || 0)).ajustement} ; {preparerGuerison(donnees,b,Number(herbes[b.id] || 0)).seuil} %. Bonus de soin +{b.bonusGuerison}, consommé après ce test.</p>
                        <label className="text-sm flex flex-col">Bonus d’herbe effectif — {b.id}<input type="number" className={classe} min={0} max={10} value={herbes[b.id] ?? '0'} onChange={e => {setHerbes(v=>({...v,[b.id]:e.target.value}));op.annuler();}} /></label>
                        <label className="text-sm flex flex-col">d100 de guérison — {b.id}<input type="number" className={classe} min={1} max={100} value={jets[b.id] ?? ''} onChange={e => {setJets(v=>({...v,[b.id]:e.target.value}));op.annuler();}} /></label>
                        <button type="button" className={classe} disabled={!!op.apercu} onClick={() => setJets(v=>({...v,[b.id]:String(DiceEngine.roll(100))}))}>Tirer le d100 de {b.id}</button>
                        <label className="text-sm block"><input type="checkbox" checked={!!destineeBlessures[b.id]} onChange={e=>setDestineeBlessures(v=>({...v,[b.id]:e.target.checked}))} /> Dépenser une destinée sur la CONSTITUTION de {b.id}</label>
                    </div>)}
                    <p className="text-xs">PV : aucun test tant qu’il reste une blessure, maladie ou poison ; attendre le lendemain de leur disparition. Pas de malus général ; seule la vie manquante et la meilleure décoction autorisée ajustent le jet.</p>
                    <label className="text-sm flex flex-col">d100 de récupération de vie, si exigible<input type="number" className={classe} min={1} max={100} value={deVie} onChange={e => {setDeVie(e.target.value);op.annuler();}} /></label>
                    <button type="button" className={classe} disabled={!!op.apercu} onClick={() => setDeVie(String(DiceEngine.roll(100)))}>Tirer le d100 de vie</button>
                    <label className="text-sm block"><input type="checkbox" checked={destineeVie} onChange={e=>setDestineeVie(e.target.checked)} /> Dépenser une destinée sur la CONSTITUTION de récupération de vie</label>
                    <label className="text-sm flex flex-col">Bonus de la meilleure décoction (Lyre à Araignée)<input type="number" className={classe} min={0} max={10} value={decoction} onChange={e => {setDecoction(e.target.value);op.annuler();}} /></label>
                    <button type="button" className={classe} disabled={!!op.apercu} onClick={() => op.proposer(id => proposerChateauDormant(donnees,
                        {nom:nomNuit.trim(),controlesManuels:controles,maladieOuPoison:maladieActuelle,jetsBlessures:manuscrits(jets),herbes:manuscrits(herbes),deVie:deVie.trim() ? Number(deVie) : undefined,bonusDecoction:Number(decoction),
                            destineeBlessures:Object.keys(destineeBlessures).filter(k=>destineeBlessures[k]),destineeVie,
                            etapesVoyageur:{stressDe:stressDe ? Number(stressDe):undefined,stressSecond:stressSecond ? Number(stressSecond):undefined,moralDe:Number(moralDe),situation:situationMoral,chanceDepensee}},id))}>Prévisualiser le bilan de nuit</button>
                </div>
            </details>
        </>}
        {r && <>
            {s.blessures.filter(b=>b.guerison).map(b=><p key={b.id} className="text-sm">{b.gravite} : prochain test en fin de journée de suivi {b.guerison!.prochainJour+1}.</p>)}
            {r.effets.map(e=><div key={e.id} className="text-sm"><p>{e.nombre} {e.type}(s) de Dragon à résoudre — {e.motif}.</p>
                {!lectureSeule && <button type="button" className={classe} disabled={!!op.apercu} onClick={()=>op.proposer(id=>operationDeVoyageur(donnees,id,
                    {__rddRepos231:{...r,effets:r.effets.filter(x=>x.id!==e.id)}},'Effet de Dragon résolu',[`${e.nombre} ${e.type}(s) : conséquences traitées à la table.`]))}>Marquer cet effet résolu</button>}</div>)}
        </>}
        </fieldset>{!lectureSeule && <ValidationOperationVoyageur operation={op} />}
    </section>;
}
