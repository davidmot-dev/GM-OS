import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cleI18nDuDegre } from '../../dice/degresDeReussite';
import { DiceEngine } from '../../dice/DiceEngine';
import { appelChance, attribuerVoyage, cloreAction, destineeAction, lireAction, recupererChanceParDestinee, relancerAction } from '../logic/recoursDuVoyageur';
import { lireMoral, proposerMoral, type SituationDeMoral } from '../logic/moralDuVoyageur';
import { useOperationDeVoyageur } from '../hooks/useOperationDeVoyageur';
import type { DonneesDeVoyage } from '../logic/operationsDeVoyageur';
import { CLASSE_OPERATION as classe, ValidationOperationVoyageur } from './ValidationOperationVoyageur';
import { useAstrologieVoyageur } from '../hooks/useAstrologieVoyageur';

export function PanneauRecoursVoyageur({donnees,appliquer,avantOperation,lectureSeule=false,campagneId}:{
    donnees:DonneesDeVoyage;appliquer:(d:DonneesDeVoyage)=>void;avantOperation?:()=>boolean;lectureSeule?:boolean;campagneId?:string|null;
}) {
    const {t}=useTranslation(['modules','common']);
    const libellesRecours={aucun:'recours ouverts','chance-reussie':'relance autorisée','chance-echouee':'chance refusée',relancee:'relance terminée',destinee:'destinée utilisée',clos:'résultat définitif'};
    const astro=useAstrologieVoyageur(campagneId);
    const [de,setDe]=useState(''),[situation,setSituation]=useState<SituationDeMoral>('neutre'),[motif,setMotif]=useState(''),[voyage,setVoyage]=useState('1');
    const op=useOperationDeVoyageur(donnees,d=>{appliquer(d);setDe('');},avantOperation);
    let a,m;try{a=lireAction(donnees);m=lireMoral(donnees);}catch(e){return <p role="alert">{(e as Error).message}</p>;}
    return <section aria-label="Chance destinée et moral RdD" className="rounded-xl border border-accent/30 p-4 space-y-3 text-app-text bg-app-surface">
        <h3 className="font-bold text-accent">Chance, destinée et moral</h3>
        <p className="text-sm">Chance {String(donnees.points_de_chance ?? donnees.chance)} / {String(donnees.chance)} · destinée {String(donnees.points_de_destinee ?? 0)} · moral {m.moral} · exaltation {m.exaltation} · dissolution {m.dissolution}</p>
        {a && <p className="text-sm">Résultat conservé : {a.titre} · {t(cleI18nDuDegre(a.degre))} · {libellesRecours[a.recours]}.</p>}
        {lectureSeule ? <p className="text-sm">Le MJ résout les recours depuis ce résultat. Une tentative de chance ferme le recours à la destinée pour cette action.</p> : <>
            <fieldset className="min-w-0 space-y-3" disabled={!!op.apercu}>
                <label className="flex flex-col text-sm">Dé du recours ou du moral<input aria-label="Dé du recours" type="number" min={1} max={100} className={classe} value={de} onChange={e=>setDe(e.target.value)} /></label>
                <div className="flex flex-wrap gap-2"><button type="button" className={classe} onClick={()=>setDe(String(DiceEngine.roll(100)))}>Tirer le d100 du recours</button>
                    <button type="button" className={classe} onClick={()=>setDe(String(DiceEngine.roll(20)))}>Tirer le d20 du moral</button></div>
                {a && a.recours !== 'clos' && <>
                    {a.recours === 'aucun' && <>
                        <button type="button" className={classe} onClick={()=>op.proposer(id=>appelChance(donnees,Number(de),astro.bonus(donnees.heure_naissance),id))}>Préparer l’appel à la chance</button>
                        <button type="button" className={classe} onClick={()=>op.proposer(id=>destineeAction(donnees,id))}>Préparer la destinée sur ce résultat</button>
                    </>}
                    {a.recours === 'chance-reussie' && <button type="button" className={classe} onClick={()=>op.proposer(id=>relancerAction(donnees,Number(de),id))}>Préparer l’unique relance</button>}
                    {a.recours !== 'chance-reussie' && <button type="button" className={classe} onClick={()=>op.proposer(id=>cloreAction(donnees,id))}>Accepter le résultat définitif</button>}
                </>}
                <button type="button" className={classe} onClick={()=>op.proposer(id=>recupererChanceParDestinee(donnees,id))}>Une destinée pour récupérer toute la chance</button>
                <details><summary className="cursor-pointer font-bold">Moral et récompenses</summary><div className="space-y-3 my-3">
                    <label className="flex flex-col text-sm">Situation du moral<select aria-label="Situation du moral" className={classe} value={situation} onChange={e=>setSituation(e.target.value as SituationDeMoral)}>
                        <option value="neutre">Neutre</option><option value="heureuse">Heureuse</option><option value="malheureuse">Malheureuse</option></select></label>
                    <label className="flex flex-col text-sm">Motif du moral ou de la récompense<input aria-label="Motif du recours" className={classe} maxLength={160} value={motif} onChange={e=>setMotif(e.target.value)} /></label>
                    <button type="button" className={classe} onClick={()=>op.proposer(id=>proposerMoral(donnees,situation,Number(de),motif,id))}>Préparer le jet de moral</button>
                    <label className="flex flex-col text-sm">Points de voyage (dixièmes de destinée)<input aria-label="Points de voyage" type="number" min={1} max={70} className={classe} value={voyage} onChange={e=>setVoyage(e.target.value)} /></label>
                    <button type="button" className={classe} onClick={()=>op.proposer(id=>attribuerVoyage(donnees,Number(voyage),motif,id))}>Préparer la récompense de voyage</button>
                </div></details>
            </fieldset><ValidationOperationVoyageur operation={op} />
        </>}
    </section>;
}
