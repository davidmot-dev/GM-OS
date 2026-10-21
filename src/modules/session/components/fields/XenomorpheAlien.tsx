import { useRef, useState } from 'react';
import type { CombatAlien, RegleDeCombatAlien } from '../../../dice/systemes/combatAlien';
import { critiqueXenoAlien } from '../../../dice/systemes/xenomorphesAlien';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import { entreeDeLaTable } from '../../../dice/systemes/yearZero';
import { pontDesTables } from '../../../tables/pontDesTables';
import { useCombatStore } from '../../../combat/useCombatStore';
import { useSessionOSStore } from '../../useSessionOSStore';
import { CLE_COMBAT_ALIEN, lireLeCombatAlien } from '../../../dice/systemes/combatAlien';

const bouton='rounded border border-app-border px-2 py-1 disabled:opacity-40';
const champ='block w-full min-w-0 rounded border border-app-border bg-app-bg p-1';
const TABLES=['attaques_bloodburster','attaques_de_chestburster','attaques_de_facehugger','attaques_de_la_nuee','attaques_de_moissonneur','attaques_de_scorpionides','attaques_de_ver_leonin','attaques_neomorphes','attaques_pretorien_reine','attaques_soldat_sentinelle','attaques_xenomorphe_rodeur'];
export default function XenomorpheAlien({regle,suivi,actuel,noter,dire,joueur,sourceEntityId,combattantId}:{regle:RegleDeCombatAlien;suivi:CombatAlien;actuel:()=>CombatAlien;noter:(s:CombatAlien,m?:Record<string,unknown>)=>void;dire:(t:string,r?:RollResult)=>void;joueur:boolean;sourceEntityId?:string;combattantId?:string}){
    const plateau=useCombatStore(),enCours=useRef(false),[choix,setChoix]=useState(1),[nom,setNom]=useState('observation'),[des,setDes]=useState(0),[sang,setSang]=useState<string[]>([]),[issue,setIssue]=useState(false);
    const x=suivi.xenomorphe!;
    const changer=(maj:Partial<typeof x>)=>{const s=actuel();noter({...s,xenomorphe:{...s.xenomorphe!,...maj}});};
    const carte=plateau.combatants.find(c=>combattantId?c.id===combattantId:c.sourceEntityId===sourceEntityId&&sourceEntityId);
    const lireFiche=(id:string)=>{const s=useSessionOSStore.getState(),c=useCombatStore.getState().combatants.find(c=>c.id===id);return c?.isPlayer?s.players.flatMap(p=>p.characters).find(p=>p.id===c.sourcePlayerId)?.sheetData??c.sheetData??{}:s.entities.find(e=>e.id===c?.sourceEntityId)?.sheetData??c?.sheetData??{};};
    const tirer=async(critique:boolean,aleatoire:boolean)=>{
        if(enCours.current)return;enCours.current=true;
        try{
            const s=actuel(),x=s.xenomorphe!;
            const table=await pontDesTables()?.loadTable('Alien',critique?'blessures_critiques_xenomorphes':x.table).catch(()=>null);
            if(!table){dire('Table indisponible : aucune demande consommée.');return;}
            const code=aleatoire?DiceEngine.roll(6):choix,e=entreeDeLaTable(table.entries,code);if(!e)return;
            if(critique){
                const id=s.critiques[0];if(!id)return;
                const r=critiqueXenoAlien(s,id,code,e.title,e.effect??'');
                if(r.suivi===s)return;
                if(code===3){const d=DiceEngine.roll(6);r.suivi.xenomorphe={...r.suivi.xenomorphe!,reflexe:d<=3?'fuite':'attaque',reflexeActions:{lente:false,rapide:false}};}
                noter(r.suivi,r.sante!==undefined?{[regle.sante]:r.sante}:{});
                if(r.retirerCarte&&carte?.alien){const cartes=[...carte.alien.cartes].sort((a,b)=>a-b).slice(1);plateau.updateCombatant(carte.id,{init:cartes[0],alien:{...carte.alien,cartes}});}
            }else{changer({attaque:{code,titre:e.title,effet:[e.description,e.effect].filter(Boolean).join(' — ')}});}
            dire(`${critique?'Critique xénomorphe':'Attaque spéciale'} D6 ${code} — ${e.title}. Résoudre les cibles et conséquences indiquées avec Maman.`);
        }finally{enCours.current=false;}
    };
    return <details data-xenomorphe-alien className="space-y-2 rounded border border-app-border p-2"><summary className="cursor-pointer font-bold">Xénomorphe — {x.etat}, Vitesse {x.vitesse}</summary>
        {x.critique&&<p>{x.critique.code} — {x.critique.titre} : {x.critique.effet}</p>}
        {!joueur&&<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{([['Vitesse','vitesse',1],['Santé maximale de l’espèce','maximum',1],['Protection naturelle','protection',0],['Éclaboussure d’acide de l’espèce','acide',0]] as const).map(([label,k,min])=><label key={k}>{label}<input className={champ} type="number" min={min} value={x[k]} onChange={e=>changer({[k]:Math.max(min,Math.trunc(Number(e.target.value)||0))})}/></label>)}</div>
            <label className="block"><input type="checkbox" checked={x.xx121} onChange={e=>changer({xx121:e.target.checked})}/> Espèce XX121 avec sang acide</label>
            <label>Table des attaques de cette espèce<select className={champ} value={x.table} onChange={e=>changer({table:e.target.value})}>{TABLES.map(t=><option key={t} value={t}>{t.replaceAll('_',' ')}</option>)}</select></label>
            <p>Modifier la Vitesse avant le tirage. Après une blessure, la plus basse carte est retirée automatiquement. Ne pas dupliquer la fiche de Santé.</p>
            <label>Choix d’attaque de Maman<select className={champ} value={choix} onChange={e=>setChoix(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
            <button type="button" className={bouton} disabled={x.etat==='mort'} onClick={()=>void tirer(false,true)}>Tirer une attaque spéciale D6</button>{' '}
            <button type="button" className={bouton} disabled={x.etat==='mort'} onClick={()=>void tirer(false,false)}>Choisir cette attaque spéciale</button>
            {suivi.critiques.length>0&&<button type="button" className={bouton} onClick={()=>void tirer(true,true)}>Résoudre le critique xénomorphe D6</button>}
            {x.etat==='ruse'&&<button type="button" className={bouton} onClick={()=>{changer({etat:'actif'});noter({...actuel(),xenomorphe:{...actuel().xenomorphe!,etat:'actif'}},{[regle.sante]:1});}}>Attaqué ou initiative atteinte : se relever à 1 et attaquer</button>}
            {x.etat==='blesse'&&x.fuiteRound!==plateau.round&&<button type="button" className={bouton} onClick={()=>{const d=DiceEngine.roll(6);changer({fuiteRound:plateau.round});dire(`Début du Round ${plateau.round} : D6 ${d} ; ${d<=3?'tente de s’échapper':'reste au combat'}.`);}}>Début du Round : tester la fuite D6</button>}
            {x.etat==='reflexe'&&<div><p>Réflexe immédiat hors tour : {x.reflexe}. Une lente et une rapide supplémentaires, à résoudre maintenant.</p>
                {(['lente','rapide'] as const).map(a=><button key={a} type="button" className={bouton} disabled={!!x.reflexeActions?.[a]} onClick={()=>changer({reflexeActions:{lente:x.reflexeActions?.lente??false,rapide:x.reflexeActions?.rapide??false,[a]:true}})}>Réflexe : payer la {a}</button>)}
                <label className="block"><input type="checkbox" checked={issue} onChange={e=>setIssue(e.target.checked)}/>{x.reflexe==='fuite'?'Fuite réussie':'Attaque a infligé des dégâts après protection'}</label>
                <button type="button" className={bouton} disabled={!x.reflexeActions?.lente||!x.reflexeActions?.rapide} onClick={()=>{
                    const mort=x.reflexe==='attaque'&&!issue,s=actuel();noter({...s,mort,xenomorphe:{...s.xenomorphe!,etat:mort?'mort':'actif'}},{[regle.sante]:mort?0:issue?(x.reflexe==='fuite'?Math.ceil(x.maximum/2):1):0});
                }}>Confirmer l’issue du réflexe</button></div>}
            {x.etat==='souffle'&&<button type="button" className={bouton} onClick={()=>noter({...actuel(),mort:true,xenomorphe:{...actuel().xenomorphe!,etat:'mort'}})}>Dernier souffle : attaque à la prochaine initiative résolue, mort</button>}
            <details><summary className="cursor-pointer">Compétences propres sans attribut humain</summary>
                <label>Compétence de l’espèce<input className={champ} value={nom} onChange={e=>setNom(e.target.value)}/></label><label>Réserve de base<input className={champ} type="number" min="0" value={des} onChange={e=>setDes(Math.max(0,Math.trunc(Number(e.target.value)||0)))}/></label>
                <button type="button" className={bouton} disabled={!nom.trim()} onClick={()=>changer({competences:{...x.competences,[nom.trim()]:des}})}>Mémoriser cette compétence</button>
                {Object.entries(x.competences).map(([nom,n])=><button type="button" key={nom} className={bouton} disabled={x.etat==='mort'} onClick={()=>dire(`${nom} : ${n} dés de base seuls, aucun Stress ni forçage.`,DiceEngine.rollYZE(n,0))}>Tester {nom} — {n}D6</button>)}
            </details>
            {x.demandesAcide.map(d=><div key={d.id} data-aspersion-alien><p>Éclaboussure demandée : {d.des}D6. Sélectionner seulement les victimes au Contact ; le feu ne déclenche rien. Le décor reste arbitré.</p>
                {plateau.combatants.filter(c=>c.id!==carte?.id).map(c=><label className="block" key={c.id}><input type="checkbox" checked={sang.includes(c.id)} onChange={e=>setSang(v=>e.target.checked?[...v,c.id]:v.filter(id=>id!==c.id))}/>{c.name} au Contact</label>)}
                <button type="button" className={bouton} onClick={()=>{
                    const v=actuel(),xx=v.xenomorphe!;if(xx.recusAcide.includes(d.id))return;
                    for(const id of sang){const c=useCombatStore.getState().combatants.find(c=>c.id===id);if(!c)continue;const f=lireFiche(id),a=lireLeCombatAlien(f);
                        const precedentes=a.acide?.aspersions??(a.acide&&a.acide.des>0?[{id:'ancienne',des:a.acide.des,round:a.acide.round,traiteRound:a.acide.traiteRound}]:[]);
                        const maj={...f,[CLE_COMBAT_ALIEN]:{...a,acide:{...a.acide,des:d.des,round:plateau.round,trepas:a.acide?.trepas??false,aspersions:[...precedentes,{id:d.id,des:d.des,round:plateau.round,traiteRound:plateau.round-1}]}}};
                        const s=useSessionOSStore.getState();if(c.isPlayer){const p=s.players.find(p=>p.characters.some(p=>p.id===c.sourcePlayerId));if(p)s.updateCharacter(p.id,c.sourcePlayerId!,{sheetData:maj});}
                        else if(c.sourceEntityId)s.updateEntity(c.sourceEntityId,{sheetData:maj});else plateau.updateCombatant(c.id,{sheetData:maj});
                    }
                    noter({...v,xenomorphe:{...xx,demandesAcide:xx.demandesAcide.filter(a=>a.id!==d.id),recusAcide:[...xx.recusAcide,d.id]}});setSang([]);
                }}>Confirmer les victimes de cette aspersion</button></div>)}
        </>}
        {x.attaque&&<p data-attaque-speciale-alien>{x.attaque.code} — {x.attaque.titre} : {x.attaque.effet}</p>}
        <p>Nature et exceptions de l’espèce validées par Maman. Les attaques se paient dans Actions Alien ; armure naturelle {x.protection}D6, aucune blessure humaine ni réparation Comtech.</p>
    </details>;
}
