import { useRef, useState } from 'react';
import { DiceEngine } from '../../../dice/DiceEngine';
import { CLE_CTHULHU_HACK, DEPENSES_FORTUNE_CH, NOMS_HORS_JEU_CH, appliquerPertesCH, avancerCH, defausserFortuneCH,
    effetActifCH, lireCH, recupererCH, signalerImpactCH, tirerConsequenceCH, type RegleCthulhuHack } from '../../../dice/systemes/cthulhuHack';

const B='rounded border border-app-border px-2 py-1 text-ui-11 hover:bg-app-text/10 disabled:opacity-40';
const duree=(secondes:number)=>{const minutes=Math.max(0,Math.ceil(secondes/60));return minutes>=60?`${Math.floor(minutes/60)} h ${minutes%60} min`:`${minutes} minute(s)`;};
type Props={regle:RegleCthulhuHack;valeurs:Record<string,unknown>;ecrire:(maj:Record<string,unknown>)=>void;maxPV?:number;
    joueur?:boolean;libelle?:(id:string)=>string;consigner?:(titre:string,texte:string)=>void};

/** Même suivi sur la fiche et la carte du combattant. L'horloge est celle de la fiction. */
export default function SuiviCthulhuHack({regle:r,valeurs,ecrire,maxPV,joueur=false,libelle=(id)=>id,consigner}:Props){
    const [local,setLocal]=useState({base:valeurs,fiche:valeurs});
    const ref=useRef(local);if(ref.current.base!==valeurs)ref.current={base:valeurs,fiche:valeurs};
    const f=local.base===valeurs?local.fiche:valeurs,s=lireCH(f);
    const [erreur,setErreur]=useState(''),[danger,setDanger]=useState(false),[pertes,setPertes]=useState<Record<string,Record<string,number>>>({});
    const [quantite,setQuantite]=useState(1),[raison,setRaison]=useState<keyof typeof DEPENSES_FORTUNE_CH>('innocent');
    const agir=(operation:(fiche:Record<string,unknown>)=>Record<string,unknown>)=>{
        if(joueur)return;
        try{const apres=operation(ref.current.fiche);if(apres===ref.current.fiche)return;
            const maj=Object.fromEntries(Object.entries(apres).filter(([k,v])=>ref.current.fiche[k]!==v));
            ref.current={base:valeurs,fiche:apres};setLocal(ref.current);ecrire(maj);setErreur('');
            consigner?.('Cthulhu Hack',lireCH(apres).dernier??'Suivi mis à jour.');
        }catch(e){setErreur((e as Error).message);}
    };
    const id=()=>`ch-${crypto.randomUUID()}`;
    const effets=s.effets.filter(e=>effetActifCH(s,e));
    return <section data-suivi-cthulhu-hack className="space-y-3 rounded-lg border border-app-border p-3 text-ui-12">
        <h3 className="font-bold">Cthulhu Hack — blessures et conséquences</h3>
        <p>{s.mort?'Mort':s.pulp?'Variante Pulp':'Hors Jeu standard'} · Fortune : {Number(f[r.fortune])||0}/2</p>
        {s.dernier&&<p role="status">{s.dernier}</p>}
        {effets.map(e=><div key={e.id} className="rounded bg-app-text/5 p-2">
            <strong>{e.nom}</strong> — {e.texte}
            <p>{e.moment!==undefined?`${Math.max(0,e.moment-(s.moments??0))} Moment(s) restant(s). `:''}{e.secondes!==undefined?`${duree(e.secondes-s.secondes)} restantes. `:''}
                {e.scene!==undefined?`Fin de scène ${e.scene}. `:''}{e.jour!==undefined?'Jusqu’à la fin de la prochaine journée ou de la séance. ':''}
                {e.plusLong?'Retenir la durée la plus longue.':''}</p>
            {!joueur&&e.nom==='Inconscience'&&<button className={B} onClick={()=>agir(fiche=>{
                const suivi=structuredClone(lireCH(fiche));suivi.effets=suivi.effets.filter(v=>v.id!==e.id);
                suivi.dernier='Un autre personnage a consacré un Moment à réveiller cet investigateur.';
                return {...fiche,[CLE_CTHULHU_HACK]:suivi};
            })}>Un autre personnage le réveille (1 Moment)</button>}
        </div>)}
        {!joueur&&<>
            <label className="flex gap-2"><input type="checkbox" checked={s.pulp} disabled={s.tombe} onChange={e=>agir(fiche=>{
                const suivi=structuredClone(lireCH(fiche));if(suivi.tombe)throw new Error('Terminer cette chute avant de changer de mode.');
                suivi.pulp=e.target.checked;suivi.dernier=suivi.pulp?'Variante Pulp activée explicitement.':'Hors Jeu standard activé.';
                return {...fiche,[CLE_CTHULHU_HACK]:suivi};
            })}/>Variante Pulp (livre p. 50)</label>
            {s.pulp&&<p>À 0 PV : chaque nouvelle blessure impose un D10, avec −1 cumulatif. Aucun PV rendu pendant le combat.</p>}
            {Number(f[r.pv])===0&&!s.tombe&&!s.mort&&<button className={B} onClick={()=>agir(fiche=>signalerImpactCH(r,fiche,1,0,1,id()))}>Signaler le Hors Jeu</button>}
            <label className="flex gap-2"><input type="checkbox" checked={danger} onChange={e=>setDanger(e.target.checked)}/>Le danger est écarté (confirmation du MJ)</label>
            {s.consequences.filter(c=>c.cycle===s.cycle&&!c.recupere).map(c=>{
                const champs=c.resultat===2?[...r.physique,...r.personnalite]:c.resultat===3?r.personnalite:r.physique;
                return <div key={c.id} className="space-y-2 rounded border border-app-border p-2">
                    <p>{c.de?`D10 ${c.de} − ${c.malus} = ${c.resultat} : ${NOMS_HORS_JEU_CH[c.resultat!]}`:`Conséquence en attente${c.malus?` (−${c.malus})`:''}`}</p>
                    {!c.de&&<button className={B} disabled={s.mort||!c.pulp&&!danger} onClick={()=>agir(fiche=>tirerConsequenceCH(fiche,c.id,DiceEngine.roll(10),danger))}>Tirer le D10 de Hors Jeu</button>}
                    {c.resultat&&c.resultat>=2&&c.resultat<=4&&!c.applique&&<>
                        <p>Répartir {c.resultat===2?'6 points entre exactement deux Sauvegardes':c.resultat===3?'4 points de personnalité':'2 points physiques'}. Les pertes sont permanentes.</p>
                        <div className="flex flex-wrap gap-2">{champs.map(champ=>{
                            const courant=Number(f[champ]),lisible=f[champ]!==undefined&&f[champ]!==null&&f[champ]!==''&&Number.isFinite(courant);
                            return <label key={champ}>{libelle(champ)}
                                <input className="ml-1 w-14 rounded border border-app-border bg-app-bg" aria-label={`Perte ${libelle(champ)}`} type="number" min={0} max={lisible?courant:undefined} disabled={!lisible} value={pertes[c.id]?.[champ]??0} onChange={e=>setPertes(p=>({...p,[c.id]:{...p[c.id],[champ]:Number(e.target.value)}}))}/>
                                <span> → {lisible?courant-(pertes[c.id]?.[champ]??0):'Sauvegarde à renseigner'}</span>
                            </label>;
                        })}</div>
                        <button className={B} onClick={()=>agir(fiche=>appliquerPertesCH(r,fiche,c.id,pertes[c.id]??{}))}>Confirmer les pertes permanentes</button>
                    </>}
                    {c.applique&&!s.mort&&<button className={B} disabled={!danger||!maxPV||s.consequences.some(v=>v.cycle===s.cycle&&!v.applique)} onClick={()=>agir(fiche=>recupererCH(r,fiche,c.id,DiceEngine.roll(4),maxPV!,danger))}>Danger écarté : récupérer 1D4 PV</button>}
                    {!maxPV&&<p>Renseigner le maximum de PV avant de récupérer.</p>}
                </div>;
            })}
            <details><summary>Temps de jeu et effets</summary><div className="mt-2 flex flex-wrap gap-2">
                <input aria-label="Durée écoulée" className="w-16 rounded border border-app-border bg-app-bg" type="number" min={1} max={10000} value={quantite} onChange={e=>setQuantite(Number(e.target.value))}/>
                {(['moment','minute','heure'] as const).map(unite=><button className={B} key={unite} onClick={()=>agir(fiche=>avancerCH(fiche,unite,quantite,id()))}>Avancer de {quantite} {unite}(s)</button>)}
                {(['scene','jour','seance'] as const).map(unite=><button className={B} key={unite} onClick={()=>agir(fiche=>avancerCH(fiche,unite,1,id()))}>{unite==='jour'?'Fin de la prochaine journée':unite==='scene'?'Fin de scène':'Fin de séance'}</button>)}
            </div><p>Les Moments se comptent séparément des minutes et des heures, sur confirmation du MJ. Les effets liés à un sens restent à son appréciation.</p></details>
            <details><summary>Armures — protection déclarée</summary><p>Lancer leur dé de Matériel à la fin du combat. Un déclin enlève un PA. Les dégâts saisis doivent tenir compte de l’armure et du couvert.</p>
                {r.armures.filter(a=>String(f[a.nom]??'').trim()).map(a=><label className="block" key={a.de}>{String(f[a.nom])} · {String(f[a.de]??'')} · PA
                    <input aria-label={`PA ${String(f[a.nom])}`} className="ml-1 w-16 rounded border border-app-border bg-app-bg" type="number" min={0} value={Number(f[a.protection])||0} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=0)agir(fiche=>({...fiche,[a.protection]:n}));}}/>
                </label>)}
            </details>
            <details><summary>Fortune — défausse du MJ</summary><div className="flex flex-wrap gap-2 mt-2">
                <select className="max-w-full rounded border border-app-border bg-app-bg" aria-label="Effet de Fortune MJ" value={raison} onChange={e=>setRaison(e.target.value as typeof raison)}>
                    {Object.entries(DEPENSES_FORTUNE_CH).map(([cle,nom])=><option key={cle} value={cle}>{nom} ({cle==='choc'||cle==='menace'||cle==='relance'&&(s.test?.desavantagePresent||s.test?.modificateur==='desavantage')?2:1} jeton(s))</option>)}
                </select>
                <button className={B} onClick={()=>agir(fiche=>{
                    const res=defausserFortuneCH(r,fiche,raison,id());
                    if(res.resultat)lireCH(res.fiche).dernier+=` ${res.resultat.totalDisplay}`;
                    return res.fiche;
                })}>Défausser et appliquer</button>
            </div><p>La relance reprend le dernier test réussi enregistré sur cette fiche, avec ses conditions. Le MJ joue les effets narratifs ; le secret lui-même n’est pas enregistré.</p></details>
        </>}
        {erreur&&<p role="alert" className="text-etat-danger">{erreur}</p>}
    </section>;
}
