import { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useClockStore } from '../../../store/useClockStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { HEURES_DRACONIQUES } from '../logic/ficheDeVoyageur';
import { ajustementAstral, fixerNombreAstral, lireAstrologie, momentDraconique, observerAstres, signeVoyageur, type AstrologieVoyageur } from '../logic/astrologieDuVoyageur';
import { useAstrologieVoyageur } from '../hooks/useAstrologieVoyageur';
import { CLASSE_OPERATION as classe } from './ValidationOperationVoyageur';
import { ValidationOperationVoyageur } from './ValidationOperationVoyageur';
import { useOperationDeVoyageur } from '../hooks/useOperationDeVoyageur';
import { experienceObservation, lireProgression } from '../logic/progressionDuVoyageur';

export function PanneauAstrologieVoyageur({campagneId,personnageId,donnees,lectureSeule=false,avantOperation,appliquer}:{
    campagneId?:string|null;personnageId:string;donnees:Record<string,unknown>;lectureSeule?:boolean;avantOperation?:()=>boolean;appliquer?:(d:Record<string,unknown>)=>void;
}) {
    const {astrologie:a,instant,mode}=useAstrologieVoyageur(campagneId);
    const [heure,setHeure]=useState('1'),[jour,setJour]=useState('0'),[nombre,setNombre]=useState(''),[visibilite,setVisibilite]=useState('0');
    const [de,setDe]=useState(''),[faux,setFaux]=useState('1'),[ciel,setCiel]=useState(false),[temps,setTemps]=useState(false);
    const [erreur,setErreur]=useState(''),[apercu,setApercu]=useState<{a:AstrologieVoyageur;empreinte:string;fiche:string;instant:number;description:string}|null>(null);
    const xp=useOperationDeVoyageur(donnees,d=>appliquer?.(d),avantOperation);
    let moment,signe;
    try {if(a){lireAstrologie(a);moment=momentDraconique(a.origine,instant);}signe=signeVoyageur(donnees.heure_naissance);}catch(e){return <p role="alert">{(e as Error).message}</p>;}
    if (!campagneId) return null;
    const proposer=(f:()=>{a:AstrologieVoyageur;description:string})=>{
        if(avantOperation&&!avantOperation())return;
        try {
            if(mode!=='static'&&mode!=='fantasy')throw new Error('Utiliser le temps de jeu statique ou fantastique dans Clock-OS.');
            setApercu({...f(),empreinte:JSON.stringify(a),fiche:JSON.stringify(donnees),instant});setErreur('');
        }catch(e){setErreur((e as Error).message);setApercu(null);}
    };
    return <section aria-label="Astrologie et heures draconiques RdD" className="rounded-xl border border-accent/30 bg-app-surface text-app-text p-4 space-y-3">
        <h3 className="font-bold text-accent">Astrologie et heures draconiques</h3>
        <p className="text-sm">{moment ? `Jour de jeu ${moment.jour} · ${moment.nom} (${moment.heure}/12).` : 'Aucun repère astrologique déclaré pour cette campagne.'}</p>
        <p className="text-xs">Une heure draconique dure 120 minutes. Clock-OS indique le temps ; il ne valide jamais un repos, une dépense ni une nuit.</p>
        {a && <details><summary className="cursor-pointer">Mes prédictions annoncées</summary>
            {(a.predictions[personnageId] ?? []).map((p,i)=><div key={i} className="text-sm my-2">
                Jour {p.jour} : nombre annoncé {p.nombre}, validité inconnue.
                <p className="text-xs">{HEURES_DRACONIQUES.map((h,i)=>`${h} ${ajustementAstral(signe!,p.nombre,i+1) >= 0 ? '+' : ''}${ajustementAstral(signe!,p.nombre,i+1)}`).join(' · ')}</p>
            </div>)}
        </details>}
        {lectureSeule ? <p className="text-sm">Les jets de chance et les rituels se résolvent avec le MJ, qui connaît le nombre réel. Les prédictions peuvent être erronées.</p> : <>
            <fieldset disabled={!!apercu} className="min-w-0 space-y-3">
                {!a ? <>
                    <label className="flex flex-col text-sm">Heure draconique au repère Clock-OS<select aria-label="Heure au repère" className={classe} value={heure} onChange={e=>setHeure(e.target.value)}>{HEURES_DRACONIQUES.map((h,i)=><option key={h} value={i+1}>{h}</option>)}</select></label>
                    <p className="text-xs">L’instant actuel de Clock-OS sera le début de l’heure choisie, au jour de jeu zéro. Le Vaisseau est le début de cette journée ; l’Araignée est minuit.</p>
                    <button type="button" className={classe} onClick={()=>proposer(()=>({a:{version:1,origine:instant-(Number(heure)-1)*7200000,nombres:{},observations:[],predictions:{}},description:'Fixer le repère draconique de la campagne, sans changer l’horloge.'}))}>Préparer le repère draconique</button>
                </> : <details><summary className="cursor-pointer font-bold">Préparation astrologique du MJ</summary><div className="space-y-3 my-3">
                    <p className="text-xs">Nombres réels et résultats des observations secrets. Les joueurs ne reçoivent que leurs propres nombres annoncés.</p>
                    <label className="flex flex-col text-sm">Jour de jeu visé<input aria-label="Jour astral" type="number" className={classe} value={jour} onChange={e=>setJour(e.target.value)} /></label>
                    <label className="flex flex-col text-sm">Nombre astral réel (1–12)<input aria-label="Nombre astral réel" type="number" min={1} max={12} className={classe} value={nombre} onChange={e=>setNombre(e.target.value)} /></label>
                    <button type="button" className={classe} onClick={()=>setNombre(String(DiceEngine.roll(12)))}>Tirer le nombre astral</button>
                    <button type="button" className={classe} onClick={()=>proposer(()=>({a:fixerNombreAstral(a,Number(jour),Number(nombre)),description:`Fixer le nombre secret du jour ${jour}.`}))}>Préparer le nombre réel</button>
                    <p className="text-xs">Nombres fixés : {Object.entries(a.nombres ?? {}).map(([j,n])=>`${j} : ${n}`).join(' · ') || 'aucun'}.</p>
                    <label className="text-sm block"><input type="checkbox" checked={ciel} onChange={e=>setCiel(e.target.checked)} /> Étoiles visibles pour cette observation nocturne</label>
                    <label className="text-sm block"><input type="checkbox" checked={temps} onChange={e=>setTemps(e.target.checked)} /> Vingt minutes d’observation ont été jouées</label>
                    <label className="flex flex-col text-sm">Ajustement de visibilité<input aria-label="Visibilité des étoiles" type="number" max={0} min={-100} className={classe} value={visibilite} onChange={e=>setVisibilite(e.target.value)} /></label>
                    <label className="flex flex-col text-sm">d100 secret d’astrologie<input aria-label="Dé secret d’astrologie" type="number" min={1} max={100} className={classe} value={de} onChange={e=>setDe(e.target.value)} /></label>
                    <button type="button" className={classe} onClick={()=>setDe(String(DiceEngine.roll(100)))}>Tirer secrètement l’observation</button>
                    <label className="flex flex-col text-sm">Nombre erroné à annoncer en cas d’échec<input aria-label="Faux nombre astral" type="number" min={1} max={12} className={classe} value={faux} onChange={e=>setFaux(e.target.value)} /></label>
                    <button type="button" className={classe} onClick={()=>proposer(()=>{
                        if(!ciel||!temps)throw new Error('Confirmer les étoiles visibles et les vingt minutes jouées.');
                        const r=observerAstres(a,instant,personnageId,donnees,Number(jour),Number(visibilite),Number(de),Number(faux),crypto.randomUUID());
                        return {a:r.astrologie,description:`Observation de ce personnage : ${r.degre}, ajustement ${r.ajustement} ; annoncer seulement ${r.annonce}.`};
                    })}>Préparer la prédiction de ce personnage</button>
                    <p className="text-xs">XP secrètes en attente de communication : {(a.observations ?? []).filter(o=>o.personnage===personnageId&&o.xp>0).map(o=>`jour ${o.jour} : ${o.xp} (${o.id})`).join(' · ') || 'aucune'}.</p>
                    {appliquer&&(a.observations ?? []).filter(o=>o.personnage===personnageId&&o.xp>0&&!lireProgression(donnees).jetsUtilises.includes(`astrologie-${o.id}`)).map(o=><button key={o.id} type="button" className={classe} disabled={!!xp.apercu} onClick={()=>xp.proposer(id=>experienceObservation(donnees,a,personnageId,o.id,id))}>Communiquer les XP de l’observation du jour {o.jour}</button>)}
                </div></details>}
            </fieldset>
            {erreur&&<p role="alert">{erreur}</p>}
            <ValidationOperationVoyageur operation={xp} />
            {apercu&&<div aria-label="Aperçu astrologique MJ" className="rounded border border-accent p-3 space-y-2"><p>{apercu.description}</p>
                <button type="button" className={classe} onClick={()=>{
                    if(avantOperation&&!avantOperation())return;
                    const actuel=useSessionOSStore.getState().campaigns.find(c=>c.id===campagneId)?.rddAstrologie;
                    if(JSON.stringify(actuel)!==apercu.empreinte||JSON.stringify(donnees)!==apercu.fiche||useClockStore.getState().timestamp!==apercu.instant){setErreur('Le calendrier, la fiche ou l’heure a changé : refaire l’aperçu.');setApercu(null);return;}
                    useSessionOSStore.getState().updateCampaign(campagneId,{rddAstrologie:apercu.a});
                    useJournalStore.getState().addEvent({type:'PJ',nature:'trace',title:'Astrologie — validation MJ',content:apercu.description});
                    setApercu(null);setDe('');setCiel(false);setTemps(false);
                }}>Valider l’astrologie</button><button type="button" className={classe} onClick={()=>setApercu(null)}>Annuler</button>
            </div>}
            {a&&<button type="button" className={classe} disabled={!!apercu||!!xp.apercu} onClick={()=>{
                if(avantOperation&&!avantOperation())return;
                useClockStore.getState().addTime(20*60);
            }}>Avancer Clock-OS de vingt minutes</button>}
        </>}
    </section>;
}
